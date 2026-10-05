'use strict';
// Every image the pages ask for must exist, and pages must show resized copies, not originals.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {outputs} = require('../scripts/generate-projects.cjs');
const root = path.resolve(__dirname, '..');
const variants = require('../data/image-variants.json');

function refs(html) {
  const out = [];
  for (const [, v] of html.matchAll(/\s(?:data-)?(?:src|poster|href)="([^"#?]+\.(?:webp|jpe?g|png))"/g)) out.push(v);
  for (const [, set] of html.matchAll(/\s(?:data-)?srcset="([^"]+)"/g)) for (const part of set.split(',')) out.push(part.trim().split(/\s+/)[0]);
  return out.map(v => v.replace(/^\//, ''));
}

const pages = [['index.html', fs.readFileSync(path.join(root, 'index.html'), 'utf8')],
  ...[...outputs()].filter(([f]) => f.endsWith('.html'))];

test('every image, srcset entry and poster on every page exists', () => {
  let count = 0;
  for (const [file, html] of pages) for (const ref of refs(html)) {
    count++;
    assert.ok(fs.existsSync(path.join(root, ref)), `${file}: ${ref}`);
  }
  assert.ok(count > 500, 'checked ' + count);
});

test('pages show resized copies, not full-size originals', () => {
  for (const [file, html] of pages) {
    for (const [tag] of html.matchAll(/<(?:img|video)\b[^>]*>/g)) {
      assert.ok(!/(?:src|poster)="\/?assets\/(?:photos|press)\//.test(tag), `${file}: ${tag.slice(0, 120)}`);
    }
  }
});

test('the manifest matches the files on disk', () => {
  for (const [src, v] of Object.entries(variants)) {
    assert.ok(fs.existsSync(path.join(root, src)), 'original ' + src);
    for (const w of v.widths) {
      const copy = 'assets/web/' + src.replace(/^assets\//, '').replace(/\.[a-z]+$/i, '') + `-${w}.webp`;
      assert.ok(fs.existsSync(path.join(root, copy)), copy);
    }
  }
});

test('press covers and film poster wait for the fonts, and every deferred image has a real source', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const press = [...home.matchAll(/<img\b[^>]*data-src="assets\/web\/press\/[^"]+"[^>]*>/g)].map(m => m[0]);
  assert.equal(press.length, 6);
  for (const tag of press) {
    assert.match(tag, /src="data:image\/gif/);
    assert.match(tag, /data-srcset="/);
    assert.ok(!/\ssrcset="/.test(tag), 'no eager srcset');
  }
  assert.match(home, /<video[^>]*data-poster="assets\/web\//);
  assert.ok(!/<video[^>]*\sposter="/.test(home), 'no eager poster');
  assert.match(home, /document\.fonts\.load\('600 1em "TT Commons Pro"'\)/);
  assert.match(home, /setTimeout\(swap,6000\)/);
  const block = home.slice(home.indexOf('DEFERRED IMAGES'), home.indexOf('PRESS CAROUSEL'));
  assert.ok(!/IntersectionObserver/.test(block), 'no nearness trigger: on phones the covers start inside any margin');
  assert.match(block, /'scroll','touchstart','keydown'/);
});
