require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MockScreeningAdapter, screeningAllows, REVIEW_POLICY } = require("../src/lib/screening.ts");

const req = { from: "0x1111111111111111111111111111111111111111", amount: 1n, token: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", pool: "0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0" };

test("only clear lets a deposit continue; review stops by default", async () => {
  assert.equal(REVIEW_POLICY, "stop");
  for (const [o, allowed] of [["clear", true], ["review", false], ["deny", false]]) {
    const r = await new MockScreeningAdapter(o, 0).screenDeposit(req);
    assert.equal(r.status, o);
    assert.match(r.referenceId, /^mock-scr-/);
    assert.equal(screeningAllows(r), allowed);
  }
});

test("rejects malformed requests", async () => {
  const a = new MockScreeningAdapter("clear", 0);
  await assert.rejects(a.screenDeposit({ ...req, from: "nope" }));
  await assert.rejects(a.screenDeposit({ ...req, amount: 0n }));
});
