// After `pnpm build`: every internal link in out/ points to a page that exists, and banned routes do not exist.
import fs from "node:fs";
import path from "node:path";
import { ROOT, report } from "./lib.mjs";
const OUT = path.join(ROOT, "out");
if (!fs.existsSync(OUT)) {
  console.error("links:check: run pnpm build first");
  process.exit(1);
}
const html = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") && html.push(path.join(d, e.name))));
walk(OUT);
const exists = (href) => {
  const clean = href.split("#")[0].split("?")[0];
  if (clean === "") return true;
  const p = path.join(OUT, decodeURIComponent(clean));
  return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, "index.html")));
};
const problems = [];
const seen = new Set();
for (const f of html) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|data:|#)/.test(href) || href.startsWith("/_next/")) continue;
    seen.add(href);
    if (!exists(href)) problems.push(`${path.relative(OUT, f)} → ${href}`);
  }
}
for (const banned of ["token", "airdrop", "stake", "stocks", "shield-nvda"]) if (fs.existsSync(path.join(OUT, banned))) problems.push(`banned route exists: /${banned}`);
console.log(`Checked ${seen.size} internal links across ${html.length} pages.`);
report("links:check", [...new Set(problems)]);
