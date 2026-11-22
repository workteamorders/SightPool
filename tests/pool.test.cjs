require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MockPoolClient, MOCK_WALLET, MOCK_START_BALANCE, memoryStore, newMockShieldedAddress } = require("../src/lib/pool/mock.ts");
const { MockScreeningAdapter } = require("../src/lib/screening.ts");
const { runShield } = require("../src/lib/pool/flow.ts");

const U = 10n ** 6n;
const make = () => new MockPoolClient(memoryStore(), 0);
const scr = () => new MockScreeningAdapter("clear", 0);

test("starts with 1,000 mock USDG public and nothing shielded", async () => {
  const c = make();
  assert.deepEqual(await c.balances(), { publicBalance: MOCK_START_BALANCE, shieldedBalance: 0n });
  assert.equal(MOCK_START_BALANCE, 1000n * U);
});

test("shield → transfer → unshield happy path, every hash and note labelled mock", async () => {
  const c = make();
  const s = await runShield(c, scr(), { from: MOCK_WALLET, amount: 200n * U }, "success");
  assert.equal(s.result.ok, true);
  assert.equal(s.screening.status, "clear");
  let b = await c.balances();
  assert.equal(b.publicBalance, 800n * U);
  assert.equal(b.shieldedBalance, 200n * U);
  const t = await c.transfer({ to: newMockShieldedAddress(), amount: 50n * U });
  assert.equal(t.ok, true);
  assert.equal(t.item.fee, 500_000n + 175_000n);
  const u = await c.unshield({ to: MOCK_WALLET, amount: 100n * U });
  assert.equal(u.ok, true);
  b = await c.balances();
  assert.equal(b.shieldedBalance, 50n * U);
  assert.equal(b.publicBalance, 800n * U + 100n * U - (500_000n + 350_000n));
  const act = await c.activity();
  assert.equal(act.length, 3);
  for (const a of act) {
    assert.match(a.hash, /^mock-/);
    assert.equal(a.label, "mock");
  }
  for (const n of await c.listNotes()) {
    assert.match(n.commitment, /^mock-/);
    assert.equal(n.label, "mock");
  }
});

test("every forced outcome fails without moving balances", async () => {
  for (const o of ["rejected", "insufficient-allowance", "paused-or-frozen", "proof-failure", "relayer-failure", "mainnet-gated", "rpc-error", "screening-deny", "screening-review"]) {
    const c = make();
    const s = await runShield(c, scr(), { from: MOCK_WALLET, amount: 10n * U }, o);
    assert.equal(s.result.ok, false, o);
    assert.equal(s.result.error.code, o);
    assert.ok(s.result.error.what && s.result.error.funds && s.result.error.next, `${o} explains itself`);
    assert.deepEqual(await c.balances(), { publicBalance: MOCK_START_BALANCE, shieldedBalance: 0n }, o);
  }
});

test("screening deny and review stop before the pool is touched", async () => {
  const c = make();
  const deny = await runShield(c, scr(), { from: MOCK_WALLET, amount: 10n * U }, "screening-deny");
  assert.equal(deny.screening.status, "deny");
  const review = await runShield(c, scr(), { from: MOCK_WALLET, amount: 10n * U }, "screening-review");
  assert.equal(review.screening.status, "review");
  assert.equal((await c.activity()).length, 0);
});

test("transfer and unshield outcomes", async () => {
  for (const o of ["rejected", "paused-or-frozen", "proof-failure", "relayer-failure", "rpc-error"]) {
    const c = make();
    await runShield(c, scr(), { from: MOCK_WALLET, amount: 100n * U }, "success");
    c.setOutcome(o);
    const t = await c.transfer({ to: newMockShieldedAddress(), amount: 10n * U });
    assert.equal(t.ok, false, o);
    const u = await c.unshield({ to: MOCK_WALLET, amount: 10n * U });
    assert.equal(u.ok, false, o);
    assert.equal((await c.balances()).shieldedBalance, 100n * U);
  }
});

test("input checks: below fee, over balance, wrong address formats", async () => {
  const c = make();
  await runShield(c, scr(), { from: MOCK_WALLET, amount: 10n * U }, "success");
  assert.equal((await c.transfer({ to: newMockShieldedAddress(), amount: 400_000n })).error.code, "invalid-input");
  assert.equal((await c.transfer({ to: newMockShieldedAddress(), amount: 11n * U })).error.code, "insufficient-balance");
  assert.equal((await c.transfer({ to: MOCK_WALLET, amount: 2n * U })).error.code, "invalid-input");
  assert.equal((await c.unshield({ to: "mock-shielded:" + "a".repeat(40), amount: 2n * U })).error.code, "invalid-input");
  assert.equal((await c.shield({ from: MOCK_WALLET, amount: 2000n * U })).error.code, "insufficient-balance");
});

test("state persists through the store and survives a corrupt store", async () => {
  const store = memoryStore();
  const a = new MockPoolClient(store, 0);
  await a.shield({ from: MOCK_WALLET, amount: 5n * U });
  const b = new MockPoolClient(store, 0);
  assert.equal((await b.balances()).shieldedBalance, 5n * U);
  store.save("{not json");
  const c = new MockPoolClient(store, 0);
  assert.equal((await c.balances()).publicBalance, MOCK_START_BALANCE);
  const broken = { load: () => { throw new Error("blocked"); }, save: () => { throw new Error("blocked"); }, clear: () => {} };
  const d = new MockPoolClient(broken, 0);
  assert.equal((await d.shield({ from: MOCK_WALLET, amount: 1n * U })).ok, true);
});

test("disclosure export contains only completed mock activity", async () => {
  const c = make();
  await runShield(c, scr(), { from: MOCK_WALLET, amount: 20n * U }, "success");
  const recs = await c.exportDisclosure();
  assert.equal(recs.length, 1);
  assert.equal(recs[0].kind, "shield");
  assert.equal(recs[0].amount, "20.00");
  assert.equal(recs[0].label, "mock");
  assert.match(recs[0].publicHash, /^mock-/);
  assert.equal((await c.exportDisclosure({ from: Date.now() + 1000 })).length, 0);
});

test("only MockPoolClient implements PoolClient", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const impls = walk(path.join(__dirname, "../src")).filter((f) => /\.(ts|tsx)$/.test(f)).filter((f) => /implements\s+PoolClient\b/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(impls.map((f) => path.basename(f)), ["mock.ts"]);
});
