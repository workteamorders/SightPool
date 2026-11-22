/*
 * Local preview server for screenshots and end-to-end tests. Serves out/ and emulates the two Pages Functions
 * using the same handlers. FAKE_COUNTRY sets the cf-ipcountry header ("" = missing). UPSTREAM=fixture answers
 * /api/rpc from values recorded at Gate X (test only, never shipped); UPSTREAM=public uses the official endpoint.
 */
require("../tests/register.cjs");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { handleGeo } = require("../src/server/geo.ts");
const { handleRpc } = require("../src/server/rpc.ts");

const PORT = Number(process.env.PORT || 4173);
const ROOT = path.join(__dirname, "..", "out");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain", ".xml": "application/xml", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

const FIXTURE = {
  eth_chainId: "0x1237",
  eth_blockNumber: "0x7318ddb",
  eth_getCode: "0x6080604052366100135761",
  eth_gasPrice: "0x989680",
  eth_getBalance: "0x0",
};
const CALLS = {
  "0xba70f757": "0x04d2eb0f13a8f4afebe260a071a9bfb09ebba031dbb00915a2639c3094353325",
  "0x5c975abb": "0x" + "0".repeat(64),
  "0xe5839836": "0x" + "0".repeat(64),
  "0x70a08231": "0x" + (1711936).toString(16).padStart(64, "0"),
  "0xdd62ed3e": "0x" + "0".repeat(64),
  "0x313ce567": "0x" + "6".padStart(64, "0"),
};
const fixtureFetch = async (_url, opts) => {
  const req = JSON.parse(opts.body);
  let result = FIXTURE[req.method];
  if (req.method === "eth_call") result = CALLS[(req.params[0].data || "").slice(0, 10)] ?? "0x";
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: req.id, result }), { status: 200 });
};

function toRequest(req, body) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  headers.delete("cf-ipcountry");
  const fake = process.env.FAKE_COUNTRY;
  if (fake) headers.set("cf-ipcountry", fake);
  return new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
}

async function send(res, r) {
  res.writeHead(r.status, Object.fromEntries(r.headers.entries()));
  res.end(Buffer.from(await r.arrayBuffer()));
}

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString();
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/geo") return send(res, handleGeo(toRequest(req, body), { RESTRICTED_REGION_LIST: process.env.RESTRICTED_REGION_LIST || "" }));
    if (url.pathname === "/api/rpc") {
      const up = process.env.UPSTREAM;
      return send(res, await handleRpc(toRequest(req, body), { ALLOW_PUBLIC_UPSTREAM: up === "public" || up === "fixture" ? "1" : "", RATE_LIMIT_PER_MINUTE: "600" }, up === "fixture" ? { fetchImpl: fixtureFetch } : {}));
    }
    let p = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!p.startsWith(ROOT)) return res.writeHead(400).end();
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
    if (!fs.existsSync(p)) {
      const nf = path.join(ROOT, "404.html");
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : "Not found");
    }
    /* Mirror Cloudflare: compressed text and long cache for hashed assets. */
    const type = TYPES[path.extname(p)] || "application/octet-stream";
    const headers = { "content-type": type };
    if (url.pathname.startsWith("/_next/static/")) headers["cache-control"] = "public, max-age=31536000, immutable";
    let data = fs.readFileSync(p);
    if (/text|javascript|json|svg|xml/.test(type) && /\bbr\b/.test(req.headers["accept-encoding"] || "")) {
      data = zlib.brotliCompressSync(data);
      headers["content-encoding"] = "br";
    }
    res.writeHead(200, headers);
    res.end(data);
  })
  .listen(PORT, () => console.log(`preview on http://localhost:${PORT}`));
