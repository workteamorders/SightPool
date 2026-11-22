// Lists every unconfigured placeholder (from config/env.ts) and writes the table into README.md between markers.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";
const require = createRequire(import.meta.url);
require("../tests/register.cjs");
const { PLACEHOLDERS } = require("../config/env.ts");
const missing = PLACEHOLDERS.filter((p) => !p.result.ok);
const rows = missing.map((p) => `| \`${p.id}\` | ${p.env ? `\`${p.env}\`` : "(owner decision)"} | ${p.scope} | ${p.description} | ${p.whenMissing} |`);
const table = ["| Placeholder | Set with | Scope | What it is | While missing |", "|---|---|---|---|---|", ...rows].join("\n");
console.log(`${missing.length} placeholder(s) not configured:\n`);
console.log(table);
const readme = path.join(ROOT, "README.md");
if (fs.existsSync(readme) && process.argv.includes("--write")) {
  const s = fs.readFileSync(readme, "utf8");
  const start = "<!-- placeholders:start -->";
  const end = "<!-- placeholders:end -->";
  if (s.includes(start) && s.includes(end)) {
    fs.writeFileSync(readme, s.slice(0, s.indexOf(start) + start.length) + "\n" + table + "\n" + s.slice(s.indexOf(end)));
    console.log("\nREADME.md updated.");
  }
}
