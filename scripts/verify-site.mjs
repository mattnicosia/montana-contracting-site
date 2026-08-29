import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const pages = ["index.html", "pre-construction.html"];
const errors = [];
const referencedAssets = new Set();

function fail(message) {
  errors.push(message);
}

for (const page of pages) {
  const source = readFileSync(resolve(root, page), "utf8");

  if (!/<title>[^<]+<\/title>/.test(source)) fail(`${page}: missing title`);
  if (!/<meta name="description" content="[^"]+">/.test(source)) fail(`${page}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/montanacontracting\.com/.test(source)) fail(`${page}: missing canonical URL`);

  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`${page}: duplicate IDs: ${[...new Set(duplicateIds)].join(", ")}`);

  for (const match of source.matchAll(/assets\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|svg|woff2|mp4|webm)/g)) {
    referencedAssets.add(match[0]);
  }

  for (const match of source.matchAll(/PR\+'([^']+\.(?:jpe?g|png|webm|mp4))'/g)) {
    referencedAssets.add(`assets/photos/projects/${match[1]}`);
  }

  for (const match of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/application\/ld\+json/.test(match[1])) continue;
    try {
      new Function(match[2]);
    } catch (error) {
      fail(`${page}: invalid inline JavaScript: ${error.message}`);
    }
  }
}

const index = readFileSync(resolve(root, "index.html"), "utf8");
const slugs = [...index.matchAll(/slug:'([^']+)'/g)].map((match) => match[1]);
const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
if (!slugs.length) fail("index.html: no projects found");
if (duplicateSlugs.length) fail(`index.html: duplicate project slugs: ${[...new Set(duplicateSlugs)].join(", ")}`);

for (const asset of referencedAssets) {
  const file = resolve(root, asset);
  if (!existsSync(file)) {
    fail(`Missing asset: ${asset}`);
  } else if (!statSync(file).size) {
    fail(`Empty asset: ${asset}`);
  } else if (!extname(file)) {
    fail(`Asset has no extension: ${asset}`);
  }
}

for (const file of ["favicon.svg", "robots.txt", "sitemap.xml", "vercel.json"]) {
  if (!existsSync(resolve(root, file))) fail(`Missing required file: ${file}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${pages.length} pages, ${slugs.length} projects, and ${referencedAssets.size} assets.`);
