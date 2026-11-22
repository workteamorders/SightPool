require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseAmount, formatAmount, isMockShieldedAddress } = require("../src/lib/format.ts");

test("parseAmount is exact and strict", () => {
  assert.deepEqual(parseAmount("25.5", 6), { ok: true, value: 25_500_000n });
  assert.deepEqual(parseAmount("1,000", 6), { ok: true, value: 1_000_000_000n });
  assert.deepEqual(parseAmount(".5", 6), { ok: true, value: 500_000n });
  assert.equal(parseAmount("", 6).ok, false);
  assert.equal(parseAmount("0", 6).ok, false);
  assert.equal(parseAmount("1.1234567", 6).ok, false);
  assert.equal(parseAmount("1e3", 6).ok, false);
  assert.equal(parseAmount("-1", 6).ok, false);
  assert.equal(parseAmount(".", 6).ok, false);
  assert.equal(parseAmount("9999999999999999", 6).ok, false);
});

test("formatAmount groups and trims", () => {
  assert.equal(formatAmount(1_000_000_000n, 6), "1,000.00");
  assert.equal(formatAmount(850_000n, 6), "0.85");
  assert.equal(formatAmount(1_785n, 6), "0.001785");
  assert.equal(formatAmount(0n, 6), "0.00");
});

test("mock shielded addresses are obviously fake", () => {
  assert.ok(isMockShieldedAddress("mock-shielded:" + "a".repeat(40)));
  assert.ok(!isMockShieldedAddress("0x" + "a".repeat(40)));
  assert.ok(!isMockShieldedAddress("mock-shielded:" + "g".repeat(40)));
});
