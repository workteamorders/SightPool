require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { previewFee } = require("../src/lib/fee.ts");
const { USDG_POOL_FEE } = require("../config/facts.ts");

const U = 10n ** 6n;

test("fee is 0.5 USDG + 0.35% at 6 decimals", () => {
  const f = previewFee(100n * U, 6);
  assert.equal(f.fixed, 500_000n);
  assert.equal(f.variable, 350_000n);
  assert.equal(f.total, 850_000n);
  assert.equal(f.net, 100n * U - 850_000n);
  assert.equal(f.belowMinimum, false);
  assert.equal(f.interfaceFee, 0n);
});

test("percentage part rounds up, never down", () => {
  assert.equal(previewFee(1n, 6).variable, 1n);
  assert.equal(previewFee(2857n, 6).variable, 10n); // 2857*35/10000 = 9.9995 → 10
  assert.equal(previewFee(2858n, 6).variable, 11n); // 10.003 → 11
  assert.equal(previewFee(10_000n, 6).variable, 35n); // exact
  assert.equal(previewFee(0n, 6).variable, 0n);
});

test("amounts at or below the fixed fee are blocked", () => {
  for (const a of [0n, 1n, 499_999n, 500_000n, 501_755n]) {
    const f = previewFee(a, 6);
    assert.equal(f.belowMinimum, true, String(a));
    assert.equal(f.net, 0n);
  }
  const ok = previewFee(510_000n, 6);
  assert.equal(ok.belowMinimum, false);
  assert.equal(ok.net, 510_000n - 500_000n - 1_785n);
});

test("fixed fee rescales with decimals", () => {
  assert.equal(previewFee(0n, 18).fixed, 500_000_000_000_000_000n);
  assert.equal(previewFee(0n, 2).fixed, 50n);
  assert.equal(previewFee(0n, 0).fixed, 1n); // 0.5 rounded up
});

test("interface fee is zero by default and bounded", () => {
  assert.equal(previewFee(100n * U, 6).interfaceFee, 0n);
  assert.equal(previewFee(100n * U, 6, 10).interfaceFee, 100_000n);
  assert.throws(() => previewFee(1n, 6, -1));
  assert.throws(() => previewFee(1n, 6, 10_001));
  assert.throws(() => previewFee(-1n, 6));
  assert.throws(() => previewFee(1n, 6.5));
});

test("large amounts stay exact (bigint)", () => {
  const big = 123_456_789_012_345n * U;
  const f = previewFee(big, 6);
  assert.equal(f.variable, (big * 35n + 9_999n) / 10_000n);
  assert.equal(f.total + f.net, big);
});

test("fee carries its documentation labels", () => {
  assert.equal(USDG_POOL_FEE.label, "documented 22 Nov 2026, verify live");
  assert.match(USDG_POOL_FEE.owner, /protocol\/relayer fee/);
});
