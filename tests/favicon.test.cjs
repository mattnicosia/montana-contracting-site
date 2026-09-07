const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('favicon uses the three-part M artwork instead of a font character', () => {
  const svg = fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8');
  assert.doesNotMatch(svg, /<text\b/);
  assert.equal((svg.match(/<path\b/g) || []).length, 3);
  assert.match(svg, /viewBox="0 0 880 880"/);
});

test('published pages request the new favicon version', () => {
  const pages = ['index.html', 'core-values/index.html', 'financing/index.html', 'pre-construction/index.html', 'projects/index.html'];
  for (const entry of fs.readdirSync(path.join(root, 'projects'), {withFileTypes:true})) {
    if (entry.isDirectory()) pages.push(`projects/${entry.name}/index.html`);
  }
  for (const page of pages) {
    assert.match(fs.readFileSync(path.join(root, page), 'utf8'), /href="\/favicon\.svg\?v=montana-m-1"/, page);
  }
});
