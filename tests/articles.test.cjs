'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {articleOutputs, formatDate} = require('../scripts/generate-projects.cjs');

const page = {eyebrow:'Blog', title:'Construction Insights Blog', h1:'Insights on luxury home and custom high-end construction.', intro:'Intro.', description:'Desc.'};
const a = {slug:'first-post', title:'First & best', description:'One.', author:'Matt Nicosia', date:'2026-11-30'};
const b = {slug:'second-post', title:'Second', dek:'Dek.', description:'Two.', author:'Ines MacAdam', date:'2026-12-14'};
const build = list => { const f = new Map(); const routes = articleOutputs(f, {page, articles:list}, () => 'Body [team](https://montanacontracting.com/people/).'); return {f, routes}; };

test('formatDate is locale-free', () => assert.equal(formatDate('2026-11-30'), 'November 30, 2026'));

test('post page has title, byline, date, canonical, article type, structured data and CTA', () => {
  const html = build([a]).f.get('blog/first-post/index.html');
  assert.ok(html.includes('<h1 class="art__title">First &amp; best</h1>'));
  assert.ok(html.includes('By Matt Nicosia · <time datetime="2026-11-30">November 30, 2026</time>'));
  assert.ok(html.includes('<link rel="canonical" href="https://montanacontracting.com/blog/first-post/">'));
  assert.ok(html.includes('<meta property="og:type" content="article">'));
  assert.ok(html.includes('content="https://montanacontracting.com/assets/photos/piaule-catskill.jpg"'));
  assert.ok(html.includes('<a href="/people/">team</a>'));
  assert.ok(!html.includes('class="art__toc"'), 'no contents list for a post without sections');
  const long = new Map(); articleOutputs(long, {page, articles:[a]}, () => '## One\n\nx\n\n## Two & more\n\ny');
  const lh = long.get('blog/first-post/index.html');
  assert.ok(lh.includes('<a href="#one">One</a>') && lh.includes('<h2 id="two-more">Two &amp; more</h2>'));
  assert.ok(lh.includes('<a href="#two-more">Two &amp; more</a>'), 'contents list text is escaped');
  assert.ok(lh.includes('<details class="art__toc-m">') && lh.includes('src="/assets/article-toc.js"'));
  assert.equal((html.match(/<h1/g) || []).length, 1);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld['@graph'][0]['@type'], 'BreadcrumbList');
  assert.equal(ld['@graph'][1]['@type'], 'BlogPosting');
  assert.equal(ld['@graph'][1].datePublished, '2026-11-30');
  assert.deepEqual(ld['@graph'][1].author, {'@type':'Person', name:'Matt Nicosia'});
  assert.ok(html.includes('Start a project.') && html.includes('href="/#start-project"'));
  assert.ok(!html.includes('Next article'), 'no next link with a single article');
});

test('blog pages use the real site header and Contact footer', () => {
  const {f} = build([a]);
  for (const file of ['blog/index.html', 'blog/first-post/index.html']) {
    const html = f.get(file);
    assert.ok(html.includes('<nav class="nav nav--solid" id="nav"'), file);
    assert.ok(html.includes('<a href="/blog/" aria-current="page">Blog</a>'), file);
    assert.ok(html.includes('<section class="sec contact" id="contact"'), file);
    assert.ok(html.includes('href="/assets/site-chrome.css"') && html.includes('src="/assets/site-nav.js"'), file);
    assert.ok(!html.includes('pd__bar') && !html.includes('pd__foot'), file);
  }
});

test('index lists newest first, next links cycle, routes feed the sitemap', () => {
  const {f, routes} = build([a, b]);
  const index = f.get('blog/index.html');
  assert.ok(index.indexOf('/blog/second-post/') < index.indexOf('/blog/first-post/'));
  assert.ok(index.includes('<a class="art__lead" href="/blog/second-post/">'), 'newest is the dark lead');
  assert.ok(index.includes('<a class="art__card" href="/blog/first-post/">'), 'older posts are cards');
  assert.ok(!build([a]).f.get('blog/index.html').includes('art__grid'), 'no empty grid with one post');
  assert.ok(index.includes('<h1>Insights on luxury home and custom <span class="art__nw">high-end</span> construction.</h1>'));
  assert.deepEqual(routes, ['/blog/', '/blog/second-post/', '/blog/first-post/']);
  assert.ok(f.get('blog/second-post/index.html').includes('href="/blog/first-post/">First &amp; best</a>'));
  assert.ok(f.get('blog/first-post/index.html').includes('href="/blog/second-post/">Second</a>'));
});

test('empty index still renders', () => assert.ok(build([]).f.get('blog/index.html').includes('New articles are on the way.')));

test('bad or duplicate slugs are rejected', () => {
  assert.throws(() => build([{...a, slug:'Bad Slug'}]));
  assert.throws(() => build([a, {...b, slug:a.slug}]));
});

test('real data: descriptions fit and bodies exist', () => {
  const {articles} = require('../scripts/generate-projects.cjs');
  for (const x of articles.articles) {
    assert.ok(x.description.length <= 155, x.slug);
    assert.ok(fs.existsSync(path.join(__dirname, '../data/articles', x.slug + '.md')), x.slug);
  }
});

test('Vercel redirects cover article routes without a trailing slash', () => {
  const v = require('../vercel.json');
  assert.ok(v.redirects.some(r => r.source === '/blog/:slug([a-z0-9-]+)' && r.destination === '/blog/:slug/'));
  assert.ok(v.redirects.some(r => r.source.includes('|blog)') && r.destination === '/:dir/'));
});
