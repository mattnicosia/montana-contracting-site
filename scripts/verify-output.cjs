const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
for (const file of ['.env.local', '.git', 'api', 'server', 'tests', 'docs', 'package.json']) {
  assert.equal(fs.existsSync(path.join(root, file)), false, `${file} must not be public`);
}
for (const file of ['index.html', 'projects/index.html', 'pre-construction/index.html', 'robots.txt']) {
  assert.ok(fs.statSync(path.join(root, file)).isFile(), `${file} must be published`);
}
assert.match(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/montanacontracting\.com\/sitemap\.xml/);
console.log('The public output contains the site without server code or configuration.');
