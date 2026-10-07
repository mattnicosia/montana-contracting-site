/* Generate static project documents. Edit data/projects.json, not generated HTML. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const projects = require('../data/projects.json');
const origin = 'https://montanacontracting.com';
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const asset = value => '/' + value.replace(/^\/+/, '');
const projectPath = p => '/projects/' + p.slug + '/';
const variants = require('../data/image-variants.json');
const published = projects.filter(p => !p.placeholder);
const phone = '(845) 398-1778';
const phoneHref = 'tel:+18453981778';
const address = '173 N. Route 9W, Congers, NY 10920';

// Search results cut descriptions near 155 characters, so trim at a sentence break.
function trimDescription(text, max = 155) {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  let out = '';
  for (const s of sentences) { if ((out + s).trim().length > max) break; out += s; }
  if (out.trim()) return out.trim();
  return text.slice(0, max - 3).replace(/\s+\S*$/, '') + '...';
}
const description = p => trimDescription(p.description?.[0] || `${p.title} is a Montana Contracting project in ${p.location}.`);

// Resized WebP copies made by scripts/optimize-images.mjs. Originals stay for sharing tags.
const variantPath = (src, w) => '/assets/web/' + src.replace(/^assets\//, '').replace(/\.[a-z]+$/i, '') + `-${w}.webp`;
function sized(src, target) {
  const v = variants[src];
  if (!v) return asset(src);
  const w = [...v.widths].sort((a,b) => a-b).find(x => x >= target) || Math.max(...v.widths);
  return variantPath(src, w);
}
function srcset(src) {
  const v = variants[src];
  return v ? [...v.widths].sort((a,b) => a-b).map(w => `${variantPath(src, w)} ${w}w`).join(', ') : '';
}
function img(src, target, sizes, attrs) {
  const set = srcset(src);
  return `<img src="${sized(src, target)}"${set ? ` srcset="${set}" sizes="${sizes}"` : ''} ${attrs}>`;
}
const largest = src => sized(src, 99999);

function documentHTML(title, summary, route, image, body, gallery = false, extra = '') {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Montana Contracting</title>
<meta name="description" content="${esc(summary)}">
<link rel="canonical" href="${origin}${route}">
${extra}<meta property="og:type" content="website">
<meta property="og:site_name" content="Montana Contracting">
<meta property="og:title" content="${esc(title)} | Montana Contracting">
<meta property="og:description" content="${esc(summary)}">
<meta property="og:url" content="${origin}${route}">
<meta property="og:image" content="${origin}${asset(image)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} | Montana Contracting">
<meta name="twitter:description" content="${esc(summary)}">
<meta name="twitter:image" content="${origin}${asset(image)}">
<meta name="twitter:image:alt" content="${esc(title)}">
<meta name="theme-color" content="#0028cc">
<link rel="icon" href="/favicon.svg?v=montana-m-1" type="image/svg+xml">
<link rel="stylesheet" href="/assets/project-pages.css">
${gallery ? '<script src="/assets/project-gallery.js" defer></script>' : ''}
<script src="/assets/analytics.js" defer></script>
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<div id="project-page">${body}</div>
${gallery ? `<dialog class="pd__lightbox" id="project-lightbox" aria-label="Project image viewer">
<button type="button" class="pd__lb-btn pd__lb-close" data-close aria-label="Close image viewer">&times;</button>
<button type="button" class="pd__lb-btn pd__lb-prev" data-prev aria-label="Previous image">&#8249;</button>
<img data-viewer-image alt="">
<button type="button" class="pd__lb-btn pd__lb-next" data-next aria-label="Next image">&#8250;</button>
<p class="pd__lb-count" data-count aria-live="polite" aria-atomic="true"></p>
</dialog>` : ''}
</body></html>
`;
}

function bar(index = false) {
  return `<header class="pd__bar"><a href="/" class="pd__logo"><img src="/assets/montana-logo.svg" alt="Montana Contracting home"></a><a class="back" href="${index ? '/#featured' : '/projects/'}"><i aria-hidden="true"></i>${index ? 'Back to Home' : 'Back to Projects'}</a></header>`;
}

function detail(p, next) {
  const facts = [['Category',p.category],['Location',p.location],['Type',p.type], ...(p.architect ? [['Architect',p.architect]] : [])];
  const paragraphs = p.placeholder
    ? ['This project is part of our portfolio across the Hudson Valley and northern New Jersey. A full case study with photography and detail is being prepared.', 'Reach out and one of the three principals will walk you through the work.']
    : p.description;
  const gallery = p.images.slice(1).map((src,i) => { const full = i % 3 === 0; return `<a class="pd__shot${full ? ' pd__shot--full' : ''}" href="${largest(src)}" data-gallery-image aria-label="Open ${esc(p.title)} image ${i+2}">${img(src, full ? 1600 : 800, full ? '(max-width: 1280px) 100vw, 1280px' : '(max-width: 600px) 100vw, 640px', `alt="${esc(p.title)} image ${i+2}" loading="lazy" decoding="async"`)}</a>`; }).join('\n');
  const press = p.press?.length ? `<section class="pd__press" aria-label="Press"><h2 class="pd__gallery-head"><i aria-hidden="true"></i>As featured in</h2><div class="pd__press-links">${p.press.map(pr => `<a href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.outlet)}</a>`).join('<span aria-hidden="true">·</span>')}</div></section>` : '';
  const hero = p.video
    ? `<video controls muted loop playsinline preload="none" poster="${sized(p.images[0], 1600)}" aria-label="${esc(p.title)} project film" data-hero-film><source src="${asset(p.video)}" type="video/mp4"><a href="${asset(p.video)}">Watch the project film</a></video><a class="pd__hero-open" href="${largest(p.images[0])}" data-gallery-image aria-label="Open ${esc(p.title)} image 1">View photograph</a>`
    : `<a class="pd__hero-photo" href="${largest(p.images[0])}" data-gallery-image aria-label="Open ${esc(p.title)} image 1">${img(p.images[0], 1600, '(max-aspect-ratio: 4/3) 130vh, 100vw', `alt="${esc(p.title)}" fetchpriority="high"`)}</a>`;
  const ld = {'@context':'https://schema.org','@graph':[
    {'@type':'BreadcrumbList','itemListElement':[
      {'@type':'ListItem',position:1,name:'Home',item:origin + '/'},
      {'@type':'ListItem',position:2,name:'Projects',item:origin + '/projects/'},
      {'@type':'ListItem',position:3,name:p.title,item:origin + projectPath(p)}]},
    {'@type':'CreativeWork','name':p.title,'description':description(p),'url':origin + projectPath(p),
      'image':origin + asset(p.images[0]),'locationCreated':{'@type':'Place','name':p.location},
      'creator':{'@type':'GeneralContractor','@id':origin + '/#business','name':'Montana Contracting'}}]};
  const extra = (p.placeholder ? '<meta name="robots" content="noindex, follow">\n' : '') + `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>\n`;
  return documentHTML(p.title, description(p), projectPath(p), p.images[0], `${bar()}
<main id="main">
<div class="pd__hero${p.video ? ' pd__hero--film' : ''}">
${hero}
<div class="pd__hero-scrim"></div><div class="pd__hero-inner"><div class="pd__tags"><span class="pd__tag">${esc(p.category)}</span><span class="pd__tag pd__tag--ghost">${esc(p.location)}</span><span class="pd__tag pd__tag--ghost">${esc(p.type)}</span></div><h1 class="pd__title">${esc(p.title)}</h1></div>
</div>
<div class="pd__body"><div class="pd__lead"><dl class="pd__facts">${facts.map(([label,value]) => `<div><dt class="pd__fact-lab">${esc(label)}</dt><dd class="pd__fact-val">${esc(value)}</dd></div>`).join('')}</dl><div class="pd__desc">${paragraphs.map(t => `<p>${esc(t)}</p>`).join('')}</div></div>
${press}
<div class="pd__precon-link"><i aria-hidden="true"></i><a href="/pre-construction/">Built with our pre-construction process.</a></div>
${gallery ? `<section class="pd__gallery" aria-labelledby="gallery-title"><h2 class="pd__gallery-head" id="gallery-title"><i aria-hidden="true"></i>Gallery</h2><div class="pd__grid">${gallery}</div></section>` : ''}
</div>
<section class="pd__cta" aria-labelledby="cta-title"><div class="pd__cta-inner"><div class="pd__cta-k"><i aria-hidden="true"></i>Start a Project</div><h2 id="cta-title">Have a project like this?</h2><p>Tell us what you're planning. One of the three principals will call you back personally.</p><div class="pd__cta-actions"><a class="pd__cta-btn pd__cta-btn--solid" href="${phoneHref}">Call ${phone}</a><a class="pd__cta-btn" href="/#start-project">Let's Connect</a></div><p class="pd__cta-addr">${address} · Since 1984 · <a href="/privacy/">Privacy</a></p></div></section>
</main>
<footer class="pd__foot"><a class="back" href="/projects/"><i aria-hidden="true"></i>Back to Projects</a><div class="pd__next"><div class="k">Next Project</div><a href="${projectPath(next)}">${esc(next.title)}</a></div></footer>`, true, extra);
}

function index() {
  const cards = published.map(p => `<a class="pcard" href="${projectPath(p)}"><div class="pcard__img">${img(p.images[0], 800, '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 420px', `alt="${esc(p.title)}" loading="lazy" decoding="async"`)}</div><h2>${esc(p.title)}</h2><div class="pcard__meta"><span class="navy">${esc(p.category)}</span><span>${esc(p.location)}</span><span>${esc(p.type)}</span></div></a>`).join('\n');
  const summary = `Explore ${published.length} Montana Contracting projects across New York and New Jersey.`;
  return documentHTML('All Projects', summary, '/projects/', published[0].images[0], `${bar(true)}<main id="main"><div class="pall__head"><div class="pall__k"><i aria-hidden="true"></i>Selected Works</div><h1>All Projects</h1><p>${summary}</p></div><div class="pall__grid">${cards}</div></main>`);
}

// Service and county pages. Copy lives in data/landing-pages.json.
const landing = require('../data/landing-pages.json');
const bySlug = Object.fromEntries(projects.map(p => [p.slug, p]));
const servicePath = s => '/' + s.slug + '/';
const areaPath = a => '/areas/' + a.slug + '/';
function landingProjects(slugs) {
  const list = slugs.map(s => { const p = bySlug[s]; if (!p || p.placeholder) throw new Error('Landing page references a missing or unfinished project: ' + s); return p; });
  return `<section class="lp__work" aria-labelledby="work-title"><h2 class="pd__gallery-head" id="work-title"><i aria-hidden="true"></i>Our work</h2><div class="pall__grid lp__grid">${list.map(p => `<a class="pcard" href="${projectPath(p)}"><div class="pcard__img">${img(p.images[0], 800, '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 420px', `alt="${esc(p.title)}" loading="lazy" decoding="async"`)}</div><h3>${esc(p.title)}</h3><div class="pcard__meta"><span class="navy">${esc(p.category)}</span><span>${esc(p.location)}</span><span>${esc(p.type)}</span></div></a>`).join('\n')}</div></section>`;
}
function landingNav(current) {
  const s = landing.services.map(x => `<a href="${servicePath(x)}"${x.slug === current ? ' aria-current="page"' : ''}>${esc(x.nav)}</a>`).concat(`<a href="/pre-construction/">Pre-Construction</a>`).join('');
  const a = landing.areas.map(x => `<a href="${areaPath(x)}"${x.slug === current ? ' aria-current="page"' : ''}>${esc(x.name)}${x.state === 'NJ' ? ', NJ' : ''}</a>`).join('');
  return `<nav class="lp__links" aria-label="Services and areas"><div><div class="lp__links-k">Services</div>${s}</div><div><div class="lp__links-k">Where we build</div>${a}</div></nav>`;
}
function landingPage({route, title, crumb, crumbs, kicker, tags, h1, summary, heroSlug, body, list, listTitle, projectSlugs, faq, current, service}) {
  const hero = bySlug[heroSlug];
  const heroImage = hero.images[1] || hero.images[0];
  const faqHTML = faq?.length ? `<section class="lp__faq" aria-labelledby="faq-title"><h2 class="pd__gallery-head" id="faq-title"><i aria-hidden="true"></i>Questions</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>` : '';
  const graph = [
    {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem',position:1,name:'Home',item:origin + '/'}, ...crumbs.map((c, i) => ({'@type':'ListItem',position:i + 2,name:c[0],item:origin + c[1]}))]},
    {'@type':'Service','name':service.name,'serviceType':service.type,'url':origin + route,'description':summary,
      'provider':{'@type':'GeneralContractor','@id':origin + '/#business','name':'Montana Contracting'},
      'areaServed':service.area}];
  if (faq?.length) graph.push({'@type':'FAQPage','mainEntity':faq.map(([q, a]) => ({'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}}))});
  const extra = `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>\n`;
  return documentHTML(title, summary, route, heroImage, `${bar(true)}
<main id="main">
<div class="pd__hero">
<div class="pd__hero-photo">${img(heroImage, 1600, '(max-aspect-ratio: 4/3) 130vh, 100vw', `alt="${esc(hero.title)}, built by Montana Contracting" fetchpriority="high"`)}</div>
<div class="pd__hero-scrim"></div><div class="pd__hero-inner"><div class="pd__tags">${(tags || [kicker, 'Since 1984']).map((t, i) => `<span class="pd__tag${i ? ' pd__tag--ghost' : ''}">${esc(t)}</span>`).join('')}</div><h1 class="pd__title lp__title">${esc(h1)}</h1></div>
</div>
<div class="pd__body"><div class="pd__lead"><dl class="pd__facts"><div><dt class="pd__fact-lab">Based in</dt><dd class="pd__fact-val">Congers, NY</dd></div><div><dt class="pd__fact-lab">Since</dt><dd class="pd__fact-val">1984</dd></div><div><dt class="pd__fact-lab">Call</dt><dd class="pd__fact-val"><a href="${phoneHref}">${phone}</a></dd></div></dl><div class="pd__desc">${body.map(t => `<p>${esc(t)}</p>`).join('')}${list ? `<h2 class="lp__h2">${esc(listTitle)}</h2><ul class="lp__list">${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div></div>
<div class="pd__precon-link"><i aria-hidden="true"></i><a href="/pre-construction/">How we price a project before it starts.</a></div>
${landingProjects(projectSlugs)}
${faqHTML}
${landingNav(current)}
</div>
<section class="pd__cta" aria-labelledby="cta-title"><div class="pd__cta-inner"><div class="pd__cta-k"><i aria-hidden="true"></i>Start a Project</div><h2 id="cta-title">Planning a project${crumb ? ' in ' + esc(crumb) : ''}?</h2><p>Tell us what you're planning. One of the three principals will call you back personally.</p><div class="pd__cta-actions"><a class="pd__cta-btn pd__cta-btn--solid" href="${phoneHref}">Call ${phone}</a><a class="pd__cta-btn" href="/#start-project">Let's Connect</a></div><p class="pd__cta-addr">${address} · Since 1984 · <a href="/privacy/">Privacy</a></p></div></section>
</main>
<footer class="pd__foot"><a class="back" href="/"><i aria-hidden="true"></i>Back to Home</a><div class="pd__next"><div class="k">All Work</div><a href="/projects/">See every project</a></div></footer>`, false, extra);
}
const countyPlace = a => ({'@type':'AdministrativeArea','name':`${a.name}, ${a.state === 'NJ' ? 'New Jersey' : 'New York'}`});
function landingOutputs(files) {
  for (const s of landing.services) {
    files.set(s.slug + '/index.html', landingPage({route:servicePath(s), title:s.title, crumb:'', crumbs:[[s.nav, servicePath(s)]], kicker:s.kicker, h1:s.h1, summary:s.summary,
      heroSlug:s.hero, body:s.body, list:s.list, listTitle:s.list_title, projectSlugs:s.projects, faq:s.faq, current:s.slug,
      service:{name:s.nav, type:s.nav === 'Commercial' ? 'Commercial construction' : 'Custom home building', area:landing.areas.map(countyPlace)}}));
  }
  for (const a of landing.areas) {
    const label = `${a.name}, ${a.state}`;
    files.set('areas/' + a.slug + '/index.html', landingPage({route:areaPath(a), title:`General Contractor in ${label}`, crumb:a.name, crumbs:[[label, areaPath(a)]],
      kicker:label, tags:['General Contractor', label], h1:`${a.name.replace(' ', '\u00a0')}'s Most\u00a0Ambitious\u00a0Work`, summary:a.summary, heroSlug:a.projects[0], body:a.body, projectSlugs:a.projects, faq:a.faq, current:a.slug,
      service:{name:`General contracting in ${label}`, type:'General contracting', area:countyPlace(a)}}));
  }
  return [...landing.services.map(servicePath), ...landing.areas.map(areaPath)];
}

function outputs() {
  const files = new Map([['projects/index.html', index()]]);
  const landingRoutes = landingOutputs(files);
  const slugs = new Set();
  projects.forEach((p,i) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || slugs.has(p.slug)) throw new Error('Invalid or duplicate project slug: ' + p.slug);
    slugs.add(p.slug);
    for (const value of [...p.images, ...(p.video ? [p.video] : [])]) {
      if (!value.startsWith('assets/') || value.includes('..') || !fs.existsSync(path.join(root,value))) throw new Error('Missing or invalid project asset: ' + value);
    }
    const pos = published.indexOf(p);
    const next = pos >= 0 ? published[(pos+1)%published.length] : published[0];
    files.set(`projects/${p.slug}/index.html`, detail(p, next));
  });
  files.set('assets/legacy-project-routes.js', `/* Generated from data/projects.json. */\n(function(){\n  var routes=${JSON.stringify(Object.fromEntries([['all','/projects/'],['values','/core-values/'],['people','/people/'],['financing','/financing/'], ...projects.map(p => [p.slug,projectPath(p)])]))};\n  function route(){var slug=location.hash.slice(1);if(Object.prototype.hasOwnProperty.call(routes,slug))location.replace(routes[slug]+location.search);}\n  route();window.addEventListener('hashchange',route);\n})();\n`);
  const routes = ['/', '/pre-construction/', '/core-values/', '/people/', '/financing/', '/privacy/', '/projects/', ...landingRoutes, ...published.map(projectPath)];
  files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
  return files;
}

if (require.main === module) {
  for (const [file, content] of outputs()) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, content);
  }
  console.log(`Generated ${projects.length} project pages and their index.`);
}
module.exports = {outputs, projects, published, trimDescription, landing};
