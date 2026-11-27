const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('both nav logo files exist and draw the M in white and brand blue', () => {
  const white = read('assets/montana-logo-white.svg');
  const blue = read('assets/montana-logo.svg');
  assert.match(white, /fill="#FFFFFF"/i);
  assert.match(blue, /fill="#0028CC"/i);
  for (const svg of [white, blue]) {
    assert.equal((svg.match(/<path\b/g) || []).length, 1);
    assert.doesNotMatch(svg, /<text\b|<image\b/);
  }
});

test('every nav logo link has an accessible name and points at a file that exists', () => {
  const pages = ['index.html', 'pre-construction.html', 'pre-construction/index.html'];
  for (const page of pages) {
    const html = read(page);
    const links = [...html.matchAll(/<a\b[^>]*class="nav__logo"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.ok(links.length > 0, `${page} has no nav logo link`);
    for (const [tag, inner] of links) {
      assert.match(tag, /aria-label="Montana Contracting Corp home"/, `${page} logo link has no accessible name`);
      const imgs = [...inner.matchAll(/<img\b[^>]*>/g)];
      assert.ok(imgs.length > 0, `${page} logo link has no image`);
      for (const [img] of imgs) {
        assert.match(img, /alt="[^"]+"/, `${page} logo image has no alt text`);
        const src = img.match(/src="\/(assets\/[^"]+)"/);
        assert.ok(src && fs.existsSync(path.join(root, src[1])), `${page} logo src must be root-relative and the file must exist: ${img}`);
      }
    }
  }
});

test('inner page headers name their logo link and the logo file exists', () => {
  const pages = ['core-values/index.html', 'financing/index.html', 'people/index.html', 'privacy/index.html', 'projects/index.html'];
  for (const page of pages) {
    const html = read(page);
    const m = html.match(/<a\b[^>]*class="(?:page-logo|pd__logo)"[^>]*>[\s\S]*?<\/a>/);
    assert.ok(m, `${page} has no logo link`);
    assert.match(m[0], /aria-label="[^"]+"|<img\b[^>]*alt="[^"]+"/, `${page} logo link has no accessible name`);
    const src = m[0].match(/src="(?:\.\.\/|\/)?(assets\/[^"]+)"/);
    assert.ok(src && fs.existsSync(path.join(root, src[1])), `${page} logo file missing`);
  }
});
