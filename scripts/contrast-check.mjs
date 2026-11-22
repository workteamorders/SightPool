// WCAG contrast for every text/background and boundary pair the design uses. Reads src/styles/tokens.css.
import { read, report } from "./lib.mjs";
const css = read("src/styles/tokens.css");
const block = (sel) => {
  const m = css.match(new RegExp(sel.replace(/[[\]"=]/g, "\\$&") + "\\s*\\{([^}]*)\\}"));
  return Object.fromEntries([...(m ? m[1] : "").matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((x) => [x[1], x[2]]));
};
const base = block(":root");
const alt = { ...base, ...block('html[data-accent="alt"]') };
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const SURF = ["bg", "surface", "surface-2", "surface-3"];
const pairs = [];
for (const s of SURF) for (const t of ["text", "text-muted", "text-faint", "accent-text", "success", "warning", "danger", "info", "focus"]) pairs.push([t, s, 4.5]);
for (const s of SURF.slice(0, 3)) pairs.push(["line-control", s, 3]);
pairs.push(["on-accent", "accent", 4.5], ["on-accent", "accent-hover", 4.5], ["on-accent", "accent-press", 4.5], ["on-danger", "danger-solid", 4.5], ["on-danger", "danger", 4.5]);
pairs.push(["success", "success-bg", 4.5], ["warning", "warning-bg", 4.5], ["danger", "danger-bg", 4.5], ["info", "info-bg", 4.5], ["text", "warning-bg", 4.5], ["text-muted", "warning-bg", 4.5], ["text-muted", "info-bg", 4.5], ["text-muted", "danger-bg", 4.5], ["text-muted", "success-bg", 4.5]);
pairs.push(["accent", "bg", 3], ["accent", "surface-3", 3], ["text-faint", "surface-3", 4.5]);
// Document layer: ink on paper, the stamp mark, control rules and focus ring on paper, and the sheet against the room.
for (const p of ["paper", "paper-2"]) {
  for (const t of ["ink", "ink-muted", "ink-faint", "stamp"]) pairs.push([t, p, 4.5]);
  pairs.push(["paper-line-control", p, 3], ["paper-focus", p, 3]);
}
pairs.push(["paper", "bg", 3], ["paper", "surface", 3]);
const problems = [];
const rows = [];
for (const [set, name] of [[base, "default"], [alt, "alt accent"]]) {
  for (const [fg, bg, min] of pairs) {
    if (!set[fg] || !set[bg]) {
      problems.push(`${name}: missing token ${fg} or ${bg}`);
      continue;
    }
    const r = ratio(set[fg], set[bg]);
    rows.push(`${name.padEnd(10)} ${fg.padEnd(13)} on ${bg.padEnd(13)} ${r.toFixed(2).padStart(6)}:1 (min ${min})${r < min ? "  FAIL" : ""}`);
    if (r < min) problems.push(`${name}: ${fg} on ${bg} = ${r.toFixed(2)} < ${min}`);
  }
}
if (process.argv.includes("--table")) console.log(rows.join("\n"));
report(`contrast:check (${rows.length} pairs)`, problems);
