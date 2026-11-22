// Fails on forbidden phrases in source copy. Denials ("not anonymous", "not audited") are allowed.
import { walk, read, report } from "./lib.mjs";
const BANNED = [
  "tornado for stocks", "untraceable", "leave no trail", "hide your nvda", "full anonymity", "guaranteed privacy", "uncensorable cash",
  "revolutionizing the future of decentralized finance", "unleash the power of", "private by default", "no one can see", "secure funds",
  "anonymous", "anonymity", "safe", "verified", "audited", "mixer for stocks",
];
const DENIAL = /\b(not|no|never|isn't|aren't|without|nor|none)\b[\w\s,'-]{0,24}$/i;
const ALLOW_CONTEXT = [/motion-safe/, /safe-area/, /safe-bottom/, /SAFE_/, /\bsafe\s*=\s*\//, /const safe\b/, /\bsafe\b\s*\?/];
const files = [...walk("src", [".ts", ".tsx"]), ...walk("config", [".ts"])];
const problems = [];
for (const f of files) {
  read(f).split("\n").forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const b of BANNED) {
      let at = lower.indexOf(b);
      while (at !== -1) {
        const before = lower.slice(Math.max(0, at - 40), at);
        const wordOk = !/[a-z]/.test(lower[at - 1] ?? " ") && !/[a-z]/.test(lower[at + b.length] ?? " ");
        const allowed = DENIAL.test(before) || ALLOW_CONTEXT.some((r) => r.test(line)) || !wordOk;
        if (!allowed) problems.push(`${f}:${i + 1}: "${b}" in: ${line.trim().slice(0, 110)}`);
        at = lower.indexOf(b, at + 1);
      }
    }
  });
}
report("copy:check", problems);
