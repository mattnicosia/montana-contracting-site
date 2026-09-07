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
const description = p => p.description?.[0] || `${p.title}. ${p.type} in ${p.location}. A Montana Contracting project.`;

function documentHTML(title, summary, route, image, body, gallery = false) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Montana Contracting</title>
<meta name="description" content="${esc(summary)}">
<link rel="canonical" href="${origin}${route}">
<meta property="og:type" content="website">
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
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/project-pages.css">
${gallery ? '<script src="/assets/project-gallery.js" defer></script>' : ''}
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
  const gallery = p.images.slice(1).map((src,i) => `<a class="pd__shot${i % 3 === 0 ? ' pd__shot--full' : ''}" href="${asset(src)}" data-gallery-image aria-label="Open ${esc(p.title)} image ${i+2}"><img src="${asset(src)}" alt="${esc(p.title)} image ${i+2}" loading="lazy" decoding="async"></a>`).join('\n');
  const press = p.press?.length ? `<section class="pd__press" aria-label="Press"><h2 class="pd__gallery-head"><i aria-hidden="true"></i>As featured in</h2><div class="pd__press-links">${p.press.map(pr => `<a href="${esc(pr.url)}" target="_blank" rel="noopener">${esc(pr.outlet)}</a>`).join('<span aria-hidden="true">·</span>')}</div></section>` : '';
  const hero = p.video
    ? `<video controls muted loop playsinline preload="none" poster="${asset(p.images[0])}" aria-label="${esc(p.title)} project film" data-hero-film><source src="${asset(p.video)}" type="video/mp4"><a href="${asset(p.video)}">Watch the project film</a></video><a class="pd__hero-open" href="${asset(p.images[0])}" data-gallery-image aria-label="Open ${esc(p.title)} image 1">View photograph</a>`
    : `<a class="pd__hero-photo" href="${asset(p.images[0])}" data-gallery-image aria-label="Open ${esc(p.title)} image 1"><img src="${asset(p.images[0])}" alt="${esc(p.title)}" fetchpriority="high"></a>`;
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
</div></main>
<footer class="pd__foot"><a class="back" href="/projects/"><i aria-hidden="true"></i>Back to Projects</a><div class="pd__next"><div class="k">Next Project</div><a href="${projectPath(next)}">${esc(next.title)}</a></div></footer>`, true);
}

function index() {
  const cards = projects.map(p => `<a class="pcard" href="${projectPath(p)}"><div class="pcard__img">${p.placeholder ? '<span class="pcard__soon">Coming soon</span>' : ''}<img src="${asset(p.images[0])}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div><h2>${esc(p.title)}</h2><div class="pcard__meta"><span class="navy">${esc(p.category)}</span><span>${esc(p.location)}</span><span>${esc(p.type)}</span></div></a>`).join('\n');
  const summary = `Explore ${projects.length} Montana Contracting projects across New York and New Jersey.`;
  return documentHTML('All Projects', summary, '/projects/', projects[0].images[0], `${bar(true)}<main id="main"><div class="pall__head"><div class="pall__k"><i aria-hidden="true"></i>Selected Works</div><h1>All Projects</h1><p>${summary}</p></div><div class="pall__grid">${cards}</div></main>`);
}

function outputs() {
  const files = new Map([['projects/index.html', index()]]);
  const slugs = new Set();
  projects.forEach((p,i) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || slugs.has(p.slug)) throw new Error('Invalid or duplicate project slug: ' + p.slug);
    slugs.add(p.slug);
    for (const value of [...p.images, ...(p.video ? [p.video] : [])]) {
      if (!value.startsWith('assets/') || value.includes('..') || !fs.existsSync(path.join(root,value))) throw new Error('Missing or invalid project asset: ' + value);
    }
    files.set(`projects/${p.slug}/index.html`, detail(p, projects[(i+1)%projects.length]));
  });
  files.set('assets/legacy-project-routes.js', `/* Generated from data/projects.json. */\n(function(){\n  var routes=${JSON.stringify(Object.fromEntries([['all','/projects/'],['values','/core-values/'],['financing','/financing/'], ...projects.map(p => [p.slug,projectPath(p)])]))};\n  function route(){var slug=location.hash.slice(1);if(Object.prototype.hasOwnProperty.call(routes,slug))location.replace(routes[slug]+location.search);}\n  route();window.addEventListener('hashchange',route);\n})();\n`);
  const routes = ['/', '/pre-construction/', '/core-values/', '/financing/', '/projects/', ...projects.map(projectPath)];
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
module.exports = {outputs, projects};
