/* Make resized WebP copies of site photographs. Run locally after adding photos:
     node scripts/optimize-images.mjs
   Needs cwebp and sips (macOS). Vercel does not run this; the copies and the
   manifest are committed. Originals are never changed. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIDTHS = [800, 1600, 2400];
const QUALITY = 78;
// The homepage hero is cropped to fill tall phone screens, so it needs extra quality.
const QUALITY_OVERRIDES = { "assets/photos/piaule-catskill.jpg": 88 };
const manifestPath = join(root, "data/image-variants.json");

// Sources: every project photograph, plus images the homepage shows directly.
const projects = JSON.parse(readFileSync(join(root, "data/projects.json"), "utf8"));
// Homepage-only sources. The page itself points at the copies, so list originals here.
const fromHome = [
  "assets/photos/piaule-catskill.jpg",
  "assets/press/vogue.png", "assets/press/nyt.png", "assets/press/vogue-living.jpg",
  "assets/press/dwell.jpg", "assets/press/architectural-digest.jpg", "assets/press/archdaily.jpg",
];
const sources = [...new Set([...projects.flatMap(p => p.images), ...fromHome])].sort();

export const variantPath = (src, w) => "assets/web/" + src.replace(/^assets\//, "").replace(/\.[a-z]+$/i, "") + `-${w}.webp`;

function width(file) {
  const out = execFileSync("sips", ["-g", "pixelWidth", file], { encoding: "utf8" });
  return Number(out.match(/pixelWidth:\s*(\d+)/)[1]);
}

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const jobs = [];
for (const src of sources) {
  const abs = join(root, src);
  const w0 = width(abs);
  const widths = WIDTHS.filter(w => w <= w0);
  // Sources narrower than the top size also get a copy at their own width,
  // so large screens never upscale a smaller copy.
  if (w0 < WIDTHS[WIDTHS.length - 1] && !widths.includes(w0)) widths.push(w0);
  manifest[src] = { width: w0, widths };
  for (const w of widths) {
    const out = join(root, variantPath(src, w));
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(abs).mtimeMs) continue;
    jobs.push({ abs, out, w, w0, q: QUALITY_OVERRIDES[src] || QUALITY });
  }
}

// Small worker pool around cwebp.
let done = 0;
async function run(job) {
  mkdirSync(dirname(job.out), { recursive: true });
  const args = ["-quiet", "-q", String(job.q), "-m", "5", "-metadata", "none"];
  if (job.w < job.w0) args.push("-resize", String(job.w), "0");
  args.push(job.abs, "-o", job.out);
  await new Promise((ok, fail) => {
    import("node:child_process").then(({ execFile }) =>
      execFile("cwebp", args, err => (err ? fail(err) : ok())));
  });
  done++;
  if (done % 50 === 0) console.log(`${done}/${jobs.length}`);
}
const queue = [...jobs];
await Promise.all(Array.from({ length: Math.max(2, cpus().length - 1) }, async () => {
  while (queue.length) await run(queue.shift());
}));

const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]));
writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + "\n");
console.log(`${sources.length} sources, ${jobs.length} copies written, manifest updated.`);
