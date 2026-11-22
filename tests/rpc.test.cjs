require("./register.cjs");
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { handleRpc, resetBuckets, READ_METHODS } = require("../src/server/rpc.ts");

const SITE = "https://site.example";
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const POOL = "0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0";
const ENV = { RPC_UPSTREAM_URL: "https://upstream.example/v2/secret-key", RATE_LIMIT_PER_MINUTE: "1000" };
let calls;
const fetchImpl = async (url, opts) => {
  calls.push({ url, body: JSON.parse(opts.body) });
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1237" }), { status: 200 });
};
const body = (method, params = [], extra = {}) => JSON.stringify({ jsonrpc: "2.0", id: 1, method, params, ...extra });
const request = (b, headers = {}, method = "POST") =>
  new Request(`${SITE}/api/rpc`, { method, headers: { origin: SITE, "content-type": "application/json", ...headers }, body: method === "POST" ? b : undefined });
const send = (b, headers, env = ENV) => handleRpc(request(b, headers), env, { fetchImpl });

beforeEach(() => {
  calls = [];
  resetBuckets();
});

test("allows exactly the read methods", () => {
  assert.deepEqual([...READ_METHODS].sort(), ["eth_blockNumber", "eth_call", "eth_chainId", "eth_gasPrice", "eth_getBalance", "eth_getCode"]);
});

test("forwards valid reads to the upstream", async () => {
  for (const [m, p] of [
    ["eth_chainId", []],
    ["eth_blockNumber", []],
    ["eth_gasPrice", []],
    ["eth_getCode", [POOL, "latest"]],
    ["eth_getBalance", ["0x1111111111111111111111111111111111111111", "latest"]],
    ["eth_call", [{ to: USDG, data: "0x313ce567" }, "latest"]],
    ["eth_call", [{ to: POOL, data: "0xba70f757" }, "latest"]],
  ]) {
    const r = await send(body(m, p));
    assert.equal(r.status, 200, m);
  }
  assert.equal(calls.length, 7);
  assert.equal(calls[0].url, ENV.RPC_UPSTREAM_URL);
});

test("refuses write and signing methods", async () => {
  for (const m of ["eth_sendRawTransaction", "eth_sendTransaction", "eth_sign", "personal_sign", "eth_signTypedData_v4", "eth_estimateGas", "eth_getLogs", "debug_traceCall", "eth_accounts"]) {
    const r = await send(body(m, []));
    assert.equal(r.status, 403, m);
  }
  assert.equal(calls.length, 0);
});

test("eth_call and eth_getCode only reach allowlisted contracts", async () => {
  const other = "0x2222222222222222222222222222222222222222";
  assert.equal((await send(body("eth_call", [{ to: other, data: "0x" }, "latest"]))).status, 400);
  assert.equal((await send(body("eth_getCode", [other, "latest"]))).status, 400);
  assert.equal((await send(body("eth_call", [{ to: USDG, data: "0x", value: "0x1" }, "latest"]))).status, 400);
  assert.equal((await send(body("eth_call", [{ to: USDG, data: "0x" + "ab".repeat(400) }, "latest"]))).status, 400);
  assert.equal(calls.length, 0);
});

test("refuses batches, bad JSON, extra keys and oversized bodies", async () => {
  assert.equal((await send(JSON.stringify([JSON.parse(body("eth_chainId"))]))).status, 400);
  assert.equal((await send("{nope")).status, 400);
  assert.equal((await send(body("eth_chainId", [], { extra: 1 }))).status, 400);
  assert.equal((await send(JSON.stringify({ jsonrpc: "1.0", id: 1, method: "eth_chainId" }))).status, 400);
  assert.equal((await send("x".repeat(5000))).status, 413);
  assert.equal(calls.length, 0);
});

test("refuses unknown, missing and null origins; allows configured extras", async () => {
  for (const o of [undefined, "null", "https://evil.example", "http://site.example", "not a url"]) {
    const h = o === undefined ? { origin: "" } : { origin: o };
    const r = await handleRpc(new Request(`${SITE}/api/rpc`, { method: "POST", headers: o === undefined ? {} : h, body: body("eth_chainId") }), ENV, { fetchImpl });
    assert.equal(r.status, 403, String(o));
  }
  const r = await send(body("eth_chainId"), { origin: "https://preview.example" }, { ...ENV, ALLOWED_ORIGINS: "https://preview.example" });
  assert.equal(r.status, 200);
});

test("GET is refused, OPTIONS needs an allowed origin", async () => {
  assert.equal((await handleRpc(request(null, {}, "GET"), ENV, { fetchImpl })).status, 405);
  assert.equal((await handleRpc(new Request(`${SITE}/api/rpc`, { method: "OPTIONS", headers: { origin: SITE } }), ENV)).status, 204);
  assert.equal((await handleRpc(new Request(`${SITE}/api/rpc`, { method: "OPTIONS", headers: { origin: "https://evil.example" } }), ENV)).status, 403);
});

test("rate limits per IP", async () => {
  const env = { ...ENV, RATE_LIMIT_PER_MINUTE: "3" };
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await send(body("eth_chainId"), { "cf-connecting-ip": "1.2.3.4" }, env)).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  assert.equal((await send(body("eth_chainId"), { "cf-connecting-ip": "5.6.7.8" }, env)).status, 200);
});

test("upstream: not configured fails closed; public endpoint only when opted in; key never echoed", async () => {
  const r = await send(body("eth_chainId"), {}, {});
  assert.equal(r.status, 503);
  assert.match(await r.text(), /not configured/);
  await send(body("eth_chainId"), {}, { ALLOW_PUBLIC_UPSTREAM: "1" });
  assert.equal(calls.at(-1).url, "https://rpc.mainnet.chain.robinhood.com");
  const failing = async () => new Response("boom secret-key", { status: 500 });
  const e = await handleRpc(request(body("eth_chainId")), ENV, { fetchImpl: failing });
  assert.equal(e.status, 502);
  assert.doesNotMatch(await e.text(), /secret-key/);
});
