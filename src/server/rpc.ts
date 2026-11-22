import { READABLE_ADDRESSES } from "../../config/allowlist";
import { OFFICIAL_PUBLIC_RPC } from "../../config/chain";

/**
 * Read-only RPC relay for chain 4663 (pattern from Afterbell's rpc-handler, stricter).
 * - Read methods only. No raw transaction submission, no signing, no estimateGas.
 * - eth_call and eth_getCode may only target allowlisted contracts.
 * - Single requests only. Batches are refused.
 * - Same origin (or ALLOWED_ORIGINS) only. Per-IP rate limit.
 * - The upstream URL (which may carry a key) lives only in the Cloudflare environment.
 */
export const READ_METHODS = ["eth_chainId", "eth_blockNumber", "eth_call", "eth_getCode", "eth_getBalance", "eth_gasPrice"] as const;
export type ReadMethod = (typeof READ_METHODS)[number];

export interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface RpcEnv {
  RPC_UPSTREAM_URL?: string;
  /** "1" uses the official public endpoint (rate-limited). For previews and local work. */
  ALLOW_PUBLIC_UPSTREAM?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  RATE_LIMITER?: RateLimitBinding;
}

export const MAX_BODY_BYTES = 4 * 1024;
const HEX = /^0x[0-9a-fA-F]*$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const MAX_CALL_DATA = 2 + 8 + 64 * 4;

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });
}

function rpcError(id: unknown, code: number, message: string, status: number, extra: Record<string, string> = {}): Response {
  return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, status, extra);
}

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function originAllowed(request: Request, env: RpcEnv): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  const self = new URL(request.url);
  if (o.origin === self.origin) return true;
  return list(env.ALLOWED_ORIGINS).includes(o.origin);
}

const buckets = new Map<string, { tokens: number; at: number }>();
export function resetBuckets(): void {
  buckets.clear();
}

async function rateLimited(request: Request, env: RpcEnv, now: number): Promise<boolean> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (env.RATE_LIMITER) {
    try {
      return !(await env.RATE_LIMITER.limit({ key: ip })).success;
    } catch {
      /* fall back to the in-isolate bucket */
    }
  }
  const perMinute = Math.min(600, Math.max(1, Number(env.RATE_LIMIT_PER_MINUTE) || 60));
  const b = buckets.get(ip) ?? { tokens: perMinute, at: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.at) / 60_000) * perMinute);
  b.at = now;
  const limited = b.tokens < 1;
  if (!limited) b.tokens -= 1;
  buckets.set(ip, b);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.at < now - 120_000) buckets.delete(k);
  return limited;
}

const tagOk = (v: unknown) => v === undefined || v === "latest" || (typeof v === "string" && /^0x[0-9a-fA-F]{1,16}$/.test(v));
const readable = (a: string) => READABLE_ADDRESSES.includes(a.toLowerCase());

export function validateParams(method: string, params: unknown): string | null {
  if (params !== undefined && !Array.isArray(params)) return "Params must be a list.";
  const p = (params ?? []) as unknown[];
  if (p.length > 2) return "Too many parameters.";
  switch (method) {
    case "eth_chainId":
    case "eth_blockNumber":
    case "eth_gasPrice":
      return p.length === 0 ? null : "This method takes no parameters.";
    case "eth_getBalance":
      if (typeof p[0] !== "string" || !ADDRESS.test(p[0])) return "First parameter must be an address.";
      return tagOk(p[1]) ? null : "Block tag must be latest or a hex number.";
    case "eth_getCode":
      if (typeof p[0] !== "string" || !ADDRESS.test(p[0])) return "First parameter must be an address.";
      if (!readable(p[0])) return "Address is not on the allowlist.";
      return tagOk(p[1]) ? null : "Block tag must be latest or a hex number.";
    case "eth_call": {
      const call = p[0];
      if (typeof call !== "object" || call === null || Array.isArray(call)) return "First parameter must be a call object.";
      for (const [k, v] of Object.entries(call)) {
        if (k !== "to" && k !== "data" && k !== "from") return `Call field "${k}" is not allowed.`;
        if (typeof v !== "string" || !HEX.test(v)) return `Call field "${k}" must be hex.`;
      }
      const c = call as { to?: string; data?: string; from?: string };
      if (!c.to || !ADDRESS.test(c.to)) return "Call needs a to address.";
      if (!readable(c.to)) return "Contract is not on the allowlist.";
      if (c.from !== undefined && !ADDRESS.test(c.from)) return "from must be an address.";
      if (c.data !== undefined && c.data.length > MAX_CALL_DATA) return "Call data is too large.";
      return tagOk(p[1]) ? null : "Block tag must be latest or a hex number.";
    }
    default:
      return "Unsupported method.";
  }
}

function upstream(env: RpcEnv): string | null {
  if (env.RPC_UPSTREAM_URL && /^https:\/\//.test(env.RPC_UPSTREAM_URL)) return env.RPC_UPSTREAM_URL;
  return env.ALLOW_PUBLIC_UPSTREAM === "1" ? OFFICIAL_PUBLIC_RPC : null;
}

export interface Deps {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export async function handleRpc(request: Request, env: RpcEnv, deps: Deps = {}): Promise<Response> {
  const now = deps.now?.() ?? Date.now();
  const doFetch = deps.fetchImpl ?? fetch;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    if (!originAllowed(request, env)) return json({ error: "Origin not allowed." }, 403);
    const origin = request.headers.get("origin") ?? "";
    return new Response(null, {
      status: 204,
      headers: { "access-control-allow-origin": origin, vary: "origin", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "600" },
    });
  }
  if (method !== "POST") return json({ error: "Method not allowed." }, 405, { allow: "POST, OPTIONS" });
  if (!originAllowed(request, env)) return json({ error: "Origin not allowed." }, 403);
  const cors = { "access-control-allow-origin": request.headers.get("origin") ?? "", vary: "origin" };

  if (await rateLimited(request, env, now)) return rpcError(null, -32005, "Rate limit exceeded. Try again shortly.", 429, { ...cors, "retry-after": "10" });

  if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return rpcError(null, -32600, "Request too large.", 413, cors);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return rpcError(null, -32600, "Request too large.", 413, cors);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return rpcError(null, -32700, "Parse error.", 400, cors);
  }
  if (Array.isArray(body)) return rpcError(null, -32600, "Batches are not supported.", 400, cors);
  if (typeof body !== "object" || body === null) return rpcError(null, -32600, "Invalid request.", 400, cors);
  const req = body as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
  const keys = Object.keys(req);
  if (req.jsonrpc !== "2.0" || typeof req.method !== "string" || keys.some((k) => !["jsonrpc", "id", "method", "params"].includes(k))) {
    return rpcError(null, -32600, "Invalid request.", 400, cors);
  }
  const id = typeof req.id === "number" || (typeof req.id === "string" && req.id.length <= 64) || req.id === null ? req.id : null;
  if (!(READ_METHODS as readonly string[]).includes(req.method)) return rpcError(id, -32601, `Method "${req.method.slice(0, 40)}" is not allowed on this read-only relay.`, 403, cors);
  const bad = validateParams(req.method, req.params);
  if (bad) return rpcError(id, -32602, bad, 400, cors);

  const url = upstream(env);
  if (!url) return rpcError(id, -32002, "RPC upstream not configured.", 503, cors);

  let res: Response;
  try {
    res = await doFetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id, method: req.method, params: req.params ?? [] }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return rpcError(id, -32004, "The RPC upstream did not answer.", 504, cors);
  }
  if (res.status === 429) return rpcError(id, -32005, "The RPC upstream is rate limiting. Try again shortly.", 429, { ...cors, "retry-after": "10" });
  if (!res.ok) return rpcError(id, -32004, "The RPC upstream returned an error.", 502, cors);
  const out = await res.text();
  if (out.length > 64 * 1024) return rpcError(id, -32004, "Upstream answer too large.", 502, cors);
  return new Response(out, { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...cors } });
}
