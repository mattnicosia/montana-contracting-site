'use strict';
// One Google tag, on every published page, loaded the same way everywhere.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {outputs} = require('../scripts/generate-projects.cjs');
const root = path.resolve(__dirname, '..');
const TAG = '<script src="/assets/analytics.js" defer></script>';
const source = fs.readFileSync(path.join(root, 'assets/analytics.js'), 'utf8');

const pages = ['index.html','pre-construction/index.html','core-values/index.html','financing/index.html','people/index.html','privacy/index.html']
  .map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')])
  .concat([...outputs()].filter(([f]) => f.endsWith('.html')));

test('every page loads the analytics file exactly once, in the head, and no other Google tag', () => {
  assert.ok(pages.length >= 32, 'pages: ' + pages.length);
  for (const [file, html] of pages) {
    assert.equal(html.split(TAG).length - 1, 1, file);
    assert.ok(html.indexOf(TAG) < html.indexOf('</head>'), file + ' tag in head');
    assert.ok(!html.includes('googletagmanager.com'), file + ' no inline Google tag');
    assert.ok(!html.includes('avanan'), file + ' no rewritten email link');
  }
});

function run(hostname, readyState = 'loading') {
  const appended = []; const listeners = {}; const docListeners = {};
  const window = { addEventListener: (n, fn) => { listeners[n] = fn; } };
  const document = { readyState, head: { appendChild: s => appended.push(s) }, createElement: () => ({}),
    addEventListener: (n, fn) => { docListeners[n] = fn; } };
  vm.runInNewContext(source, { window, document, location: { hostname, pathname: '/projects/x/' } });
  return { window, appended, listeners, docListeners };
}

test('only the production host reports, so previews and local builds stay out of the data', () => {
  for (const host of ['localhost', '127.0.0.1', 'montana-contracting-abc.vercel.app', 'www.montanacontracting.com']) {
    const r = run(host);
    assert.equal(r.window.dataLayer, undefined, host);
    assert.equal(r.appended.length, 0, host);
  }
});

test('gtag.js waits for page load and uses the measurement ID', () => {
  const r = run('montanacontracting.com');
  assert.equal(r.appended.length, 0, 'not loaded before the page finishes');
  r.listeners.load();
  assert.equal(r.appended.length, 1);
  assert.equal(r.appended[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-1YKLCTB80N');
  assert.equal(r.appended[0].async, true);
  const config = r.window.dataLayer.map(a => [...a]).find(a => a[0] === 'config');
  assert.deepEqual(JSON.parse(JSON.stringify(config)), ['config', 'G-1YKLCTB80N']);
  const late = run('montanacontracting.com', 'complete');
  assert.equal(late.appended.length, 1, 'loads at once if the page already finished');
});

test('phone and email taps are recorded as lead events', () => {
  const r = run('montanacontracting.com');
  const click = href => r.docListeners.click({ target: { closest: () => ({ getAttribute: () => href, textContent: ' (845) 398-1778 ' }) } });
  click('tel:+18453981778'); click('mailto:info@montanacontracting.com');
  const events = r.window.dataLayer.map(a => [...a]).filter(a => a[0] === 'event');
  assert.deepEqual(JSON.parse(JSON.stringify(events.map(e => e[1]))), ['phone_click', 'email_click']);
  assert.equal(events[0][2].link_location, '/projects/x/');
  r.docListeners.click({ target: { closest: () => null } });
  assert.equal(r.window.dataLayer.filter(a => a[0] === 'event').length, 2, 'other clicks ignored');
});
