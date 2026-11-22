require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { encryptPackage, decryptPackage, parseEnvelope, toCsv, toJson, NO_VIEW_KEY_BANNER, KDF, passwordProblem } = require("../src/lib/disclosure.ts");

const recs = [
  { date: "2026-11-22T10:00:00.000Z", kind: "shield", amount: "20.00", fee: "0.00", publicHash: "mock-0xabc", commitment: "mock-c-1", counterparty: "", label: "mock" },
  { date: "2026-11-22T11:00:00.000Z", kind: "transfer", amount: "5.00", fee: "0.5175", publicHash: "mock-0xdef", commitment: "mock-c-2", counterparty: "=HYPERLINK(\"x\")", label: "mock" },
];
const meta = { generatedAt: "2026-11-22T12:00:00.000Z", product: "Test" };

test("CSV carries the no-view-key notice and neutralises formulas", () => {
  const csv = toCsv(recs, meta);
  assert.ok(csv.includes(NO_VIEW_KEY_BANNER));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.equal(csv.trim().split("\n").length, 2 + 1 + 2);
});

test("JSON carries the notice and labels", () => {
  const j = JSON.parse(toJson(recs, meta));
  assert.equal(j.notice, NO_VIEW_KEY_BANNER);
  assert.equal(j.label, "mock");
  assert.equal(j.records.length, 2);
  assert.ok(!/view.?key"\s*:/i.test(toJson(recs, meta)), "no field named like a view key");
});

test("encrypt → decrypt round trip, with recorded parameters", async () => {
  const plain = toJson(recs, meta);
  const env = await encryptPackage(plain, "correct horse battery", "application/json");
  assert.equal(env.kdf.iterations, KDF.iterations);
  assert.equal(env.kdf.hash, "SHA-256");
  assert.equal(env.cipher.name, "AES-GCM");
  assert.ok(!JSON.stringify(env).includes("mock-0xabc"), "ciphertext hides content");
  const parsed = parseEnvelope(JSON.stringify(env));
  assert.ok(parsed);
  assert.equal(await decryptPackage(parsed, "correct horse battery"), plain);
});

test("wrong password and tampering fail cleanly", async () => {
  const env = await encryptPackage("hello world", "correct horse battery", "text/csv");
  await assert.rejects(decryptPackage(env, "wrong password!!"), /Wrong password/);
  const bad = { ...env, ciphertext: env.ciphertext.slice(0, -4) + "AAAA" };
  await assert.rejects(decryptPackage(bad, "correct horse battery"), /Wrong password/);
  await assert.rejects(decryptPackage({ ...env, kdf: { ...env.kdf, iterations: 10 } }, "x"), /Unsupported/);
});

test("weak passwords are refused before encryption", async () => {
  assert.ok(passwordProblem("short"));
  assert.equal(passwordProblem("twelve chars"), null);
  await assert.rejects(encryptPackage("x", "short", "text/csv"));
  assert.equal(parseEnvelope("not json"), null);
  assert.equal(parseEnvelope(JSON.stringify({ kind: "other" })), null);
});
