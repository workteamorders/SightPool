/**
 * Region check. Fails closed: a missing, malformed or unknown country is treated as blocked.
 * This is an interface restriction, not contract access control: the pool contracts are permissionless.
 */
export interface GeoEnv {
  RESTRICTED_REGION_LIST?: string;
}

export const ALWAYS_BLOCKED = ["US"] as const;
/** Cloudflare uses XX for unknown and T1 for Tor. Both fail closed. */
const UNKNOWN_CODES = new Set(["XX", "T1"]);

export function blockedList(env: GeoEnv): string[] {
  const extra = (env.RESTRICTED_REGION_LIST ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
  return Array.from(new Set<string>([...ALWAYS_BLOCKED, ...extra]));
}

export type GeoReason = "allowed" | "restricted-region" | "unknown-region";

export interface GeoAnswer {
  country: string | null;
  blocked: boolean;
  reason: GeoReason;
}

export function evaluateCountry(raw: string | null | undefined, env: GeoEnv): GeoAnswer {
  const c = (raw ?? "").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]$/.test(c) || UNKNOWN_CODES.has(c)) return { country: null, blocked: true, reason: "unknown-region" };
  if (blockedList(env).includes(c)) return { country: c, blocked: true, reason: "restricted-region" };
  return { country: c, blocked: false, reason: "allowed" };
}

export function handleGeo(request: Request, env: GeoEnv): Response {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: { allow: "GET, HEAD", "content-type": "application/json" } });
  }
  const answer = evaluateCountry(request.headers.get("cf-ipcountry"), env);
  return new Response(JSON.stringify(answer), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

/** Client side: anything other than a well-formed allowed answer is blocked. */
export function interpretGeoPayload(payload: unknown): GeoAnswer {
  if (!payload || typeof payload !== "object") return { country: null, blocked: true, reason: "unknown-region" };
  const p = payload as Partial<GeoAnswer>;
  if (p.blocked === false && p.reason === "allowed" && typeof p.country === "string" && /^[A-Z][A-Z0-9]$/.test(p.country)) {
    return { country: p.country, blocked: false, reason: "allowed" };
  }
  const reason: GeoReason = p.reason === "restricted-region" ? "restricted-region" : "unknown-region";
  return { country: typeof p.country === "string" ? p.country : null, blocked: true, reason };
}
