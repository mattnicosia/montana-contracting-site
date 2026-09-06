'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {outputs, projects} = require('../scripts/generate-projects.cjs');
const root = path.resolve(__dirname, '..');
const generated = outputs();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('committed documents match the shared data and generator', () => {
  for (const [file, content] of generated) assert.equal(fs.readFileSync(path.join(root,file),'utf8'), content, file);
});

test('each project has initial content, sharing tags, ordinary links, and every photograph', () => {
  assert.equal(projects.length, 25);
  for (const p of projects) {
    const html = generated.get(`projects/${p.slug}/index.html`);
    const url = `https://montanacontracting.com/projects/${p.slug}/`;
    assert.ok(html.includes(`<h1 class="pd__title">${esc(p.title)}</h1>`), p.slug);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    for (const field of ['og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) assert.ok(html.includes(`="${field}" content="`), field);
    assert.ok(html.includes(`content="https://montanacontracting.com/${p.images[0]}"`));
    for (const paragraph of p.description || []) assert.ok(html.includes(`<p>${esc(paragraph)}</p>`));
    const images = [...html.matchAll(/href="([^"#]+)" data-gallery-image/g)].map(m => m[1]);
    assert.deepEqual(images, p.images.map(s => '/' + s));
    assert.ok(html.includes('href="/projects/"'));
    assert.ok(!html.includes('href="#' + p.slug));
    if (p.video) {
      assert.ok(html.includes('controls muted loop playsinline preload="none"'));
      assert.ok(html.includes(`src="/${p.video}"`));
      assert.ok(!html.includes(' autoplay'));
    }
  }
  const haviland = projects.find(p => p.slug === 'haviland-court');
  assert.equal(haviland.images.length, 23);
  assert.equal(haviland.images[0], 'assets/photos/projects/haviland-22.jpg');
});

test('all local document links, media, styles, and fonts resolve', () => {
  for (const [file, html] of generated) {
    if (!file.endsWith('.html')) continue;
    for (const [, ref] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
      const target = path.join(root,ref);
      assert.ok(fs.existsSync(target), file + ': ' + ref);
    }
  }
  const css = fs.readFileSync(path.join(root,'assets/project-pages.css'),'utf8');
  for (const [,ref] of css.matchAll(/url\('(\/[^']+)'\)/g)) assert.ok(fs.existsSync(path.join(root,ref)),ref);
});

test('homepage links do not depend on a JavaScript-only overlay', () => {
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(!html.includes('var PROJECTS='));
  assert.ok(!html.includes('id="pdetail"'));
  assert.ok(html.includes('href="/projects/"'));
  for (const slug of ['piaule-catskill','hudson-river-house','gym-englewood','multi-generational-house','twisted-ridge']) assert.ok(html.includes(`href="/projects/${slug}/"`));
  assert.ok(html.includes('<noscript><style>#preloader{display:none}.reveal{opacity:1;transform:none}'));
  const js = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[0].includes('application/ld+json') ? '' : m[1]);
  js.forEach(code => new vm.Script(code));
});

test('legacy hashes replace the current entry and preserve query parameters', () => {
  const script = generated.get('assets/legacy-project-routes.js');
  for (const [slug,dest] of [['all','/projects/'],['values','/core-values/'],['financing','/financing/'],...projects.map(p => [p.slug,`/projects/${p.slug}/`])]) {
    const calls=[];
    let hashListener;
    const location={hash:'#'+slug,search:'?source=shared',replace:value=>calls.push(value)};
    vm.runInNewContext(script,{location,window:{addEventListener:(name,fn)=>{assert.equal(name,'hashchange');hashListener=fn;}}});
    assert.deepEqual(calls,[dest+'?source=shared']);
    location.hash='#contact'; hashListener(); assert.equal(calls.length,1);
  }
});

test('project routes are not redirected to hashes and sitemap contains every static project', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  assert.ok(!config.redirects.some(r => /^\/projects\/?$/.test(r.source)));
  const sitemap = generated.get('sitemap.xml');
  assert.ok(!sitemap.includes('#'));
  for (const p of projects) assert.ok(sitemap.includes(`/projects/${p.slug}/</loc>`));
});

function galleryFixture() {
  const events = new Map();
  const make = () => ({listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},focus(){document.activeElement=this;}});
  const document = {body:{style:{overflow:''}},activeElement:null};
  const close=make(), prev=make(), next=make();
  const image={alt:'',removeAttribute(name){delete this[name];}};
  const count={textContent:''};
  const links=Array.from({length:23},(_,i)=>Object.assign(make(),{href:'/image-'+i+'.jpg',getAttribute(){return 'Open Haviland image '+(i+1);}}));
  const dialog=Object.assign(make(),{open:false,showModal(){this.open=true;},close(){this.open=false;this.listeners.close();},querySelector(selector){return {'[data-close]':close,'[data-prev]':prev,'[data-next]':next,'[data-viewer-image]':image,'[data-count]':count}[selector];},querySelectorAll(){return [close,prev,next];}});
  document.getElementById=()=>dialog;
  document.querySelector=()=>null;
  document.querySelectorAll=selector=>selector==='[data-gallery-image]'?links:[];
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/project-gallery.js'),'utf8'),{document,window:{addEventListener:(name,fn)=>events.set(name,fn)}});
  const click = (link,extra={}) => {const event={button:0,preventDefault(){this.defaultPrevented=true;},...extra};link.listeners.click(event);return event;};
  const key=(value,shiftKey=false)=>dialog.listeners.keydown({key:value,shiftKey,preventDefault(){}});
  return {document,dialog,close,prev,next,image,count,links,click,key,events};
}

test('lightbox opens hero, wraps all 23 images, traps Tab and restores focus/scroll', () => {
  const f=galleryFixture();
  assert.ok(f.click(f.links[0]).defaultPrevented);
  assert.equal(f.dialog.open,true); assert.equal(f.count.textContent,'01 / 23');
  assert.equal(f.document.activeElement,f.close); assert.equal(f.document.body.style.overflow,'hidden');
  f.key('ArrowLeft'); assert.equal(f.count.textContent,'23 / 23');
  f.key('ArrowRight'); assert.equal(f.count.textContent,'01 / 23');
  f.key('Tab',true); assert.equal(f.document.activeElement,f.next);
  f.key('Tab'); assert.equal(f.document.activeElement,f.close);
  f.close.listeners.click(); assert.equal(f.dialog.open,false);
  assert.equal(f.document.body.style.overflow,''); assert.equal(f.document.activeElement,f.links[0]);
});

test('modified image clicks stay ordinary navigation and pagehide clears an open dialog', () => {
  const f=galleryFixture();
  assert.ok(!f.click(f.links[0],{metaKey:true}).defaultPrevented);
  assert.equal(f.dialog.open,false);
  f.click(f.links[4]); f.events.get('pagehide')();
  assert.equal(f.dialog.open,false); assert.equal(f.document.body.style.overflow,'');
});
