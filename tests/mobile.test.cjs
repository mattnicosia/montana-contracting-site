const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const site = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');

test('each featured link has its own existing photograph and accessible name', () => {
  const rows = [...html.matchAll(/<a\b[^>]*class="pitem\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  assert.equal(rows.length, 6);
  assert.match(rows[4], /href="\/projects\/monte-nido-west-nyack\/"/);
  assert.match(rows[5], /href="\/projects\/twisted-ridge\/"/);
  const photos = rows.map(row => {
    const image = row.match(/<img\b[^>]*class="pitem__img"[^>]*>/)?.[0];
    assert.ok(image, 'The photograph belongs inside the project link.');
    const src = image.match(/src="([^"]+)"/)[1];
    assert.equal(src, row.match(/data-preview="([^"]+)"/)[1]);
    assert.ok(fs.existsSync(path.join(site, src)), src);
    assert.match(image, /alt=""/); // The adjacent heading supplies the link name.
    assert.match(image, /loading="lazy"/);
    assert.match(row, /<h3>[^<]+<\/h3>/);
    assert.match(row, /href="(?:#|\/projects\/)[^"]+"/);
    return src;
  });
  assert.equal(new Set(photos).size, 6);
});

test('thumbnail layout stays inside the existing responsive breakpoint', () => {
  assert.match(html, /\.pitem__img\{display:none\}/);
  const mobile = html.match(/@media\(max-width:980px\)\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(mobile);
  assert.match(mobile, /\.projects__preview\{display:none\}/);
  assert.match(mobile, /grid-template-columns:clamp\(96px,26vw,176px\) minmax\(0,1fr\)/);
  assert.match(mobile, /\.pitem__img\{display:block/);
  assert.match(mobile, /color:#fff;transform:none/);
  assert.match(html, /\.pitem:focus-visible\{outline:2px solid #fff/);
});

function menuHarness() {
  const classes = new Set();
  const handlers = {};
  const attributes = {};
  let focused;
  const firstLink = { focus() { focused = 'first-link'; } };
  const burger = {
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener(name, handler) { handlers[`burger:${name}`] = handler; },
    focus() { focused = 'burger'; },
  };
  const links = {
    querySelector() { return firstLink; },
    addEventListener(name, handler) { handlers[`links:${name}`] = handler; },
  };
  const nav = {
    classList: {
      contains(name) { return classes.has(name); },
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
    },
    querySelector(selector) { return selector === '.nav__burger' ? burger : links; },
  };
  const source = html.split('/* ============================== NAV SCROLL AND MOBILE MENU ============================== */')[1]
    .split('/* ============================== HERO PARALLAX')[0];
  assert.ok(source.includes('setOpen'));
  vm.runInNewContext(source, {
    document: {
      getElementById() { return nav; },
      addEventListener(name, handler) { handlers[`document:${name}`] = handler; },
    },
    window: { scrollY: 0, innerHeight: 844, addEventListener() {} },
  });
  return { handlers, attributes, classes, burger, get focus() { return focused; } };
}

test('menu opening reaches links; Escape closes and restores button focus', () => {
  const menu = menuHarness();
  menu.handlers['burger:click']();
  assert.equal(menu.attributes['aria-expanded'], 'true');
  assert.equal(menu.burger.textContent, 'Close');
  assert.equal(menu.focus, 'first-link');
  assert.ok(menu.classes.has('nav--solid'));
  menu.handlers['document:keydown']({ key: 'Escape' });
  assert.equal(menu.attributes['aria-expanded'], 'false');
  assert.equal(menu.burger.textContent, 'Menu');
  assert.equal(menu.focus, 'burger');
});

test('menu button toggles closed and selecting a link closes the menu', () => {
  const menu = menuHarness();
  menu.handlers['burger:click']();
  menu.handlers['burger:click']();
  assert.equal(menu.attributes['aria-expanded'], 'false');
  menu.handlers['burger:click']();
  menu.handlers['links:click']({ target: { closest: () => ({}) } });
  assert.equal(menu.attributes['aria-expanded'], 'false');
});
