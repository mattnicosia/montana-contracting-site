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

const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
if (!robots.includes("Sitemap: https://montanacontracting.com/sitemap.xml")) {
  fail("robots.txt: sitemap must use the production host");
}

if (!index.includes('class="nav__burger" aria-expanded="false" aria-controls="main-nav-links"')) {
  fail("index.html: mobile menu control must expose its navigation target and state");
}

if (!index.includes("c.classList.remove('reveal')")) {
  fail("index.html: carousel clones must not depend on the reveal observer");
}

if (!index.includes("closeLightbox(false)")) {
  fail("index.html: hash routing must close the image viewer");
}

if (!index.includes("minmax(min(320px,100%),1fr)")) {
  fail("index.html: project cards must fit narrow phone viewports");
}

if (!index.includes("title:'Dunkin Fort Montgomery'") || index.includes("title:'Dunkin Eastchester'")) {
  fail("index.html: Dunkin project name must match the Fort Montgomery image");
}

if (index.includes("PR+'catch-air-nanuet-05.jpg'")) {
  fail("index.html: Catch Air gallery must not include the duplicate fifth image");
}

if (!index.includes("if(pall.classList.contains('open'))allScrollTop=pall.scrollTop")) {
  fail("index.html: All Projects must preserve its scroll position when opening a project");
}

if (!index.includes("history.replaceState('',document.title,location.pathname+location.search)")) {
  fail("index.html: closing All Projects must replace its history entry");
}

if (!index.includes("location.pathname+location.search+target")) {
  fail("index.html: leaving a project detail must replace its history entry");
}

if (!index.includes("if(featured)featured.scrollIntoView()")) {
  fail("index.html: leaving a deep-linked project must reveal Featured Projects");
}

if (!index.includes("montanaProjectGateway:lastGateway==='all'?'all':'featured'")) {
  fail("index.html: project history entries must record their gateway");
}

if (!index.includes("if(history.state&&history.state.montanaProjectGateway)")) {
  fail("index.html: project exit must return to an existing gateway entry");
}

if (!index.includes("else{lastGateway='';closeOverlays();}")) {
  fail("index.html: homepage routes must clear the project gateway");
}

const preConstruction = readFileSync(resolve(root, "pre-construction.html"), "utf8");
if (!preConstruction.includes('class="nav__burger" aria-expanded="false" aria-controls="precon-nav-links"')) {
  fail("pre-construction.html: mobile menu control must expose its navigation target and state");
}

if (!preConstruction.includes(".timeline__phase{grid-area:auto;opacity:1;pointer-events:auto}")) {
  fail("pre-construction.html: mobile timeline phases must use normal document flow");
}

if (!preConstruction.includes("@media(max-width:899px)")) {
  fail("pre-construction.html: normal-flow timeline must include narrow tablets");
}

if (!preConstruction.includes("mobileMQ.addEventListener('change',reloadTimeline)")) {
  fail("pre-construction.html: timeline must reinitialize after a breakpoint change");
}

const server = readFileSync(resolve(root, "scripts/serve.mjs"), "utf8");
if (!server.includes("const pathname = new URL(request.url") || !server.includes("decodedRoute = decodeURIComponent(route)") || !server.includes('response.writeHead(400')) {
  fail("scripts/serve.mjs: malformed request URLs must return a client error");
}

if (!server.includes('response.writeHead(206') || !server.includes('"Content-Range"')) {
  fail("scripts/serve.mjs: media requests must support byte ranges");
}

if (!server.includes('const pathFromRoot = relative(root, filePath)') || !server.includes('isAbsolute(pathFromRoot)')) {
  fail("scripts/serve.mjs: path containment must work across operating systems");
}

const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
if (sitemap.includes("#")) {
  fail("sitemap.xml: fragment URLs are not separate crawlable documents");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Verified ${pages.length} pages, ${slugs.length} projects, and ${referencedAssets.size} assets.`);
