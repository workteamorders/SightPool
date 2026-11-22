require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { handleGeo, evaluateCountry, interpretGeoPayload, blockedList } = require("../src/server/geo.ts");

const req = (country, method = "GET") => new Request("https://site.example/api/geo", { method, headers: country === undefined ? {} : { "cf-ipcountry": country } });
const call = async (country, env = {}) => (await handleGeo(req(country), env)).json();

test("fails closed: missing, empty, malformed, unknown and Tor", async () => {
  for (const c of [undefined, "", "  ", "U", "USA", "1", "XX", "T1", "<x>"]) {
    const r = await call(c);
    assert.equal(r.blocked, true, String(c));
    assert.equal(r.reason, "unknown-region");
  }
});

test("US is always blocked, extra regions come from RESTRICTED_REGION_LIST", async () => {
  assert.deepEqual(await call("US"), { country: "US", blocked: true, reason: "restricted-region" });
  assert.deepEqual(await call("us"), { country: "US", blocked: true, reason: "restricted-region" });
  const env = { RESTRICTED_REGION_LIST: "cu, IR,KP,bad,123" };
  assert.equal((await call("IR", env)).blocked, true);
  assert.equal((await call("CU", env)).blocked, true);
  assert.deepEqual(blockedList(env), ["US", "CU", "IR", "KP"]);
  assert.deepEqual(await call("ID", env), { country: "ID", blocked: false, reason: "allowed" });
  assert.equal((await call("US", { RESTRICTED_REGION_LIST: "" })).blocked, true);
});

test("only GET/HEAD; response is not cached", async () => {
  const r = await handleGeo(req("ID", "POST"), {});
  assert.equal(r.status, 405);
  const ok = await handleGeo(req("ID"), {});
  assert.equal(ok.headers.get("cache-control"), "no-store");
});

test("client interpretation fails closed on anything unexpected", () => {
  for (const p of [null, undefined, "x", 1, {}, { blocked: false }, { blocked: false, reason: "allowed" }, { blocked: false, reason: "allowed", country: "usa" }, { blocked: "false", reason: "allowed", country: "ID" }]) {
    assert.equal(interpretGeoPayload(p).blocked, true, JSON.stringify(p));
  }
  assert.deepEqual(interpretGeoPayload({ blocked: false, reason: "allowed", country: "ID" }), { country: "ID", blocked: false, reason: "allowed" });
  assert.equal(interpretGeoPayload({ blocked: true, reason: "restricted-region", country: "US" }).reason, "restricted-region");
});

test("evaluateCountry is pure", () => {
  assert.equal(evaluateCountry("DE", {}).blocked, false);
});
