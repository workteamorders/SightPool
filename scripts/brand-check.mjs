// The product name may only be written in config/brand.ts. Everything else must import it.
import { walk, read, report } from "./lib.mjs";
const NAME = /sightpool/i;
const files = [...walk("src", [".ts", ".tsx", ".css"]), ...walk("functions", [".ts"]), ...walk("config", [".ts"])].filter((f) => f !== "config/brand.ts");
const problems = [];
for (const f of files) read(f).split("\n").forEach((line, i) => NAME.test(line) && problems.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`));
report("brand:check", problems);
