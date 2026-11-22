require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getAddress } = require("viem");
const { ALLOWLIST, USDG_TOKEN_ADMIN_FACET, activeContracts } = require("../config/allowlist.ts");
const { PLACEHOLDERS, config, validateUrl, validateBool, validateRegionList, validateBps } = require("../config/env.ts");

test("every address is EIP-55 checksummed", () => {
  for (const e of ALLOWLIST) {
    if (e.address) assert.equal(getAddress(e.address), e.address, e.key);
    if (e.implementation) assert.equal(getAddress(e.implementation.address), e.implementation.address, e.key);
  }
  assert.equal(getAddress(USDG_TOKEN_ADMIN_FACET), USDG_TOKEN_ADMIN_FACET);
});

test("ETH pool and 0xbow are off by default; only passed contracts are active", () => {
  const by = Object.fromEntries(ALLOWLIST.map((e) => [e.key, e]));
  assert.equal(by.ethPool.enabled, false);
  assert.equal(by.oxbow.enabled, false);
  assert.equal(by.oxbow.address, null);
  assert.deepEqual(activeContracts(), ["0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0", "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"]);
});

test("pass/fail flags default to false and unknown placeholders fail closed", () => {
  assert.equal(config.auditCleared, false);
  assert.equal(config.legalOpinionCleared, false);
  assert.equal(config.walletConnectProjectId, null);
  assert.equal(config.interfaceFeeBps, 0);
  assert.equal(config.screeningProvider, null);
  assert.ok(PLACEHOLDERS.length >= 15);
  assert.equal(validateUrl("http://x.example").ok, false);
  assert.equal(validateUrl("https://x.example/report.pdf").ok, true);
  assert.equal(validateUrl("").ok, false);
  assert.equal(validateBool("yes", "false").ok, false);
  assert.deepEqual(validateBool(undefined, "false"), { ok: true, value: "false" });
  assert.equal(validateRegionList("us, cu").ok, true);
  assert.equal(validateRegionList("USA").ok, false);
  assert.equal(validateBps("10001").ok, false);
  assert.deepEqual(validateBps(""), { ok: true, value: "0" });
});
