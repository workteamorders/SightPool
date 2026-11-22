import fs from "node:fs";
import path from "node:path";
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export function walk(dir, exts) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return walk(rel, exts);
    return exts.some((x) => e.name.endsWith(x)) ? [rel] : [];
  });
}
export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
export function report(name, problems) {
  if (problems.length) {
    console.error(`${name}: ${problems.length} problem(s)`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(`${name}: ok`);
}
