// No write or signing code in src/ or functions/, and no reference to the protocol's API or packages.
import { walk, read, report } from "./lib.mjs";
const PATTERNS = ["writeContract", "sendTransaction", "signMessage", "signTypedData", "personal_sign", "eth_sendRawTransaction", "api.rail20.org", "@rail20"];
const files = [...walk("src", [".ts", ".tsx"]), ...walk("functions", [".ts"])];
const hits = [];
for (const f of files) read(f).split("\n").forEach((line, i) => PATTERNS.forEach((p) => line.includes(p) && hits.push(`${f}:${i + 1}: ${p}`)));
const impls = files.filter((f) => /implements\s+PoolClient\b/.test(read(f)));
if (impls.length !== 1 || !impls[0].endsWith("pool/mock.ts")) hits.push(`PoolClient implementations: ${impls.join(", ") || "none"}`);
console.log(`Scanned ${files.length} files for: ${PATTERNS.join(", ")}`);
console.log(`Matches: ${hits.length}. PoolClient implementations: ${impls.join(", ")}`);
report("nowrite:check", hits);
