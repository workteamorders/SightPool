require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolveMode } = require("../src/lib/mode.ts");

test("default and empty values resolve to mock without a reason", () => {
  assert.deepEqual(resolveMode({}), { mode: "mock", reason: null });
  assert.deepEqual(resolveMode({ NEXT_PUBLIC_MODE: "" }), { mode: "mock", reason: null });
  assert.deepEqual(resolveMode({ NEXT_PUBLIC_MODE: "  " }), { mode: "mock", reason: null });
});

test("only mock and readonly can come out", () => {
  assert.equal(resolveMode({ NEXT_PUBLIC_MODE: "mock" }).mode, "mock");
  assert.equal(resolveMode({ NEXT_PUBLIC_MODE: "readonly" }).mode, "readonly");
  assert.equal(resolveMode({ NEXT_PUBLIC_MODE: " ReadOnly " }).mode, "readonly");
  for (const v of ["testnet", "mainnet", "MAINNET", "live", "write", "readonly2", "1", "true", "<script>"]) {
    const r = resolveMode({ NEXT_PUBLIC_MODE: v });
    assert.equal(r.mode, "mock", v);
    assert.ok(r.reason && r.reason.length > 0, `reason for ${v}`);
  }
});

test("testnet and mainnet explain why they fell back", () => {
  assert.match(resolveMode({ NEXT_PUBLIC_MODE: "testnet" }).reason, /no testnet/);
  assert.match(resolveMode({ NEXT_PUBLIC_MODE: "mainnet" }).reason, /no write path/);
});

test("no client-side override exists: mode reads only NEXT_PUBLIC_MODE", () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/lib/mode.ts"), "utf8");
  assert.doesNotMatch(src, /localStorage|sessionStorage|location|searchParams|window\./);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(__dirname, "../src")).filter((f) => /\.(ts|tsx)$/.test(f))) {
    const s = fs.readFileSync(f, "utf8");
    assert.doesNotMatch(s, /resolveMode\(\s*\{[^}]*(searchParams|localStorage|location|query)/, f);
    assert.doesNotMatch(s, /NEXT_PUBLIC_MODE[^\n]*(searchParams|localStorage|location\.)/, f);
    assert.doesNotMatch(s, /window\.(__mode|setMode|sightpoolMode)/i, f);
  }
});
