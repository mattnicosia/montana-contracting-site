const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
execFileSync(process.execPath, [path.join(__dirname, 'generate-projects.cjs')], { cwd: root, stdio: 'inherit' });
// Only this generated output folder is replaced. Server code and secrets never enter it.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
const published = ['index.html', 'assets', 'projects', 'core-values', 'financing', 'pre-construction', 'favicon.svg', 'robots.txt', 'sitemap.xml', 'llms.txt'];
for (const item of published) fs.cpSync(path.join(root, item), path.join(output, item), { recursive: true });
console.log('Built the static site in public/.');
