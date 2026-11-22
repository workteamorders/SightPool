/**
 * Every placeholder from the build prompt as a typed, validated configuration value.
 * Empty or invalid values resolve to "not configured" and the interface fails closed.
 * `pnpm placeholders:list` reads PLACEHOLDERS (via scripts/placeholders-list.mjs) and writes the README table.
 *
 * Next.js only inlines NEXT_PUBLIC_* values that are written out literally, so each one is read by name below.
 */

export type Validity = { ok: true; value: string } | { ok: false; reason: string };

const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/;
const BOOL = /^(true|false)$/;
const REGION_LIST = /^[A-Z]{2}(,[A-Z]{2})*$/;

export function validateUrl(v: string | undefined): Validity {
  if (!v || !v.trim()) return { ok: false, reason: "not configured" };
  return HTTPS_URL.test(v.trim()) ? { ok: true, value: v.trim() } : { ok: false, reason: "must be an https URL" };
}

export function validateBool(v: string | undefined, fallback: "true" | "false"): Validity {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return { ok: true, value: fallback };
  return BOOL.test(s) ? { ok: true, value: s } : { ok: false, reason: "must be true or false" };
}

export function validateRegionList(v: string | undefined): Validity {
  const s = (v ?? "").replace(/\s+/g, "").toUpperCase();
  if (!s) return { ok: false, reason: "not configured" };
  return REGION_LIST.test(s) ? { ok: true, value: s } : { ok: false, reason: "must be comma-separated ISO 3166-1 alpha-2 codes" };
}

export function validateBps(v: string | undefined): Validity {
  const s = (v ?? "").trim();
  if (!s) return { ok: true, value: "0" };
  if (!/^\d{1,5}$/.test(s) || Number(s) > 10000) return { ok: false, reason: "must be an integer from 0 to 10000" };
  return { ok: true, value: s };
}

export function validateText(v: string | undefined, pattern: RegExp, hint: string): Validity {
  const s = (v ?? "").trim();
  if (!s) return { ok: false, reason: "not configured" };
  return pattern.test(s) ? { ok: true, value: s } : { ok: false, reason: hint };
}

export type PlaceholderScope = "public" | "server" | "owner";

export interface Placeholder {
  /** Bracketed name used in the prompt and brief. */
  id: string;
  /** Environment variable that sets it, or "" when it is not an environment value. */
  env: string;
  scope: PlaceholderScope;
  description: string;
  /** What stays locked or hidden while it is missing. */
  whenMissing: string;
  result: Validity;
}

/* Raw public values, written literally so the bundler inlines them. */
const raw = {
  mode: process.env.NEXT_PUBLIC_MODE,
  auditCleared: process.env.NEXT_PUBLIC_AUDIT_CLEARED,
  legalCleared: process.env.NEXT_PUBLIC_LEGAL_OPINION_CLEARED,
  walletConnect: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  tosVersion: process.env.NEXT_PUBLIC_TOS_VERSION,
  auditReport: process.env.NEXT_PUBLIC_AUDIT_REPORT_URL,
  poolAuditReport: process.env.NEXT_PUBLIC_POOL_AUDIT_REPORT_URL,
  feeBps: process.env.NEXT_PUBLIC_INTERFACE_FEE_BPS,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  socialUrl: process.env.NEXT_PUBLIC_SOCIAL_URL,
  screeningProvider: process.env.NEXT_PUBLIC_SCREENING_PROVIDER,
  shieldedFormat: process.env.NEXT_PUBLIC_SHIELDED_ADDRESS_FORMAT,
  enableEthPool: process.env.NEXT_PUBLIC_ENABLE_ETH_POOL,
  enableOxbow: process.env.NEXT_PUBLIC_ENABLE_OXBOW,
};

export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";

export const PLACEHOLDERS: readonly Placeholder[] = [
  {
    id: "MODE",
    env: "NEXT_PUBLIC_MODE",
    scope: "public",
    description: "Interface mode. Only `mock` (default) and `readonly` are recognised. Anything else falls back to mock.",
    whenMissing: "Mock mode.",
    result: { ok: true, value: (raw.mode ?? "").trim() || "mock" },
  },
  {
    id: "AUDIT_CLEARED",
    env: "NEXT_PUBLIC_AUDIT_CLEARED",
    scope: "public",
    description: "Owner flag: a written audit exists. Stays false in this phase.",
    whenMissing: "false. Mainnet stays gated.",
    result: validateBool(raw.auditCleared, "false"),
  },
  {
    id: "LEGAL_OPINION_CLEARED",
    env: "NEXT_PUBLIC_LEGAL_OPINION_CLEARED",
    scope: "public",
    description: "Owner flag: a written legal opinion exists. Stays false in this phase.",
    whenMissing: "false. Mainnet stays gated.",
    result: validateBool(raw.legalCleared, "false"),
  },
  {
    id: "EXPLORER_URL",
    env: "",
    scope: "owner",
    description: "Block explorer for chain 4663 (checked at Gate X).",
    whenMissing: "n/a",
    result: { ok: true, value: EXPLORER_URL },
  },
  {
    id: "WALLETCONNECT_PROJECT_ID",
    env: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
    scope: "public",
    description: "Free WalletConnect (Reown) project ID, registered by the owner.",
    whenMissing: "Read-only mode shows \"Wallet connect not configured\".",
    result: validateText(raw.walletConnect, /^[a-f0-9]{32}$/, "must be a 32-character hex project ID"),
  },
  {
    id: "SITE_URL",
    env: "NEXT_PUBLIC_SITE_URL",
    scope: "public",
    description: "Canonical site URL (domain not registered yet).",
    whenMissing: "Canonical and Open Graph URLs are relative. Sitemap uses a placeholder origin.",
    result: validateUrl(raw.siteUrl),
  },
  {
    id: "TOS_VERSION",
    env: "NEXT_PUBLIC_TOS_VERSION",
    scope: "public",
    description: "Version string for the Terms acceptance gate (e.g. 2026-11-22-draft).",
    whenMissing: "Uses \"draft-0\". Terms are marked pending counsel review.",
    result: validateText(raw.tosVersion, /^[A-Za-z0-9._-]{1,40}$/, "letters, digits, dot, dash or underscore"),
  },
  {
    id: "AUDIT_REPORT_URL",
    env: "NEXT_PUBLIC_AUDIT_REPORT_URL",
    scope: "public",
    description: "Link to a real audit report of this interface.",
    whenMissing: "\"Interface audit: none on record\". No audit badge is shown.",
    result: validateUrl(raw.auditReport),
  },
  {
    id: "POOL_AUDIT_REPORT_URL",
    env: "NEXT_PUBLIC_POOL_AUDIT_REPORT_URL",
    scope: "public",
    description: "Link to a real audit report of the underlying RAIL20 pool.",
    whenMissing: "\"Underlying pool audit: none on record\".",
    result: validateUrl(raw.poolAuditReport),
  },
  {
    id: "INTERFACE_FEE_BPS",
    env: "NEXT_PUBLIC_INTERFACE_FEE_BPS",
    scope: "public",
    description: "Interface fee in basis points. Default 0.",
    whenMissing: "0.",
    result: validateBps(raw.feeBps),
  },
  {
    id: "SCREENING_PROVIDER",
    env: "NEXT_PUBLIC_SCREENING_PROVIDER",
    scope: "public",
    description: "Deposit screening provider. Only a mock adapter exists in this phase.",
    whenMissing: "\"Screening provider not configured\". Mainnet path locked.",
    result: validateText(raw.screeningProvider, /^[a-z0-9-]{2,40}$/, "lowercase provider id"),
  },
  {
    id: "SHIELDED_ADDRESS_FORMAT",
    env: "NEXT_PUBLIC_SHIELDED_ADDRESS_FORMAT",
    scope: "public",
    description: "Real shielded address format. Undocumented by the protocol.",
    whenMissing: "Mock uses the obviously fake form mock-shielded:<hex>.",
    result: validateText(raw.shieldedFormat, /^.{1,80}$/, "free text"),
  },
  {
    id: "ENABLE_ETH_POOL",
    env: "NEXT_PUBLIC_ENABLE_ETH_POOL",
    scope: "public",
    description: "Show the ETH pool. Off by default and cannot be enabled from the interface.",
    whenMissing: "false.",
    result: validateBool(raw.enableEthPool, "false"),
  },
  {
    id: "ENABLE_OXBOW",
    env: "NEXT_PUBLIC_ENABLE_OXBOW",
    scope: "public",
    description: "0xbow entry. Out of scope. Off and cannot be enabled from the interface.",
    whenMissing: "false.",
    result: validateBool(raw.enableOxbow, "false"),
  },
  {
    id: "CONTACT_EMAIL",
    env: "NEXT_PUBLIC_CONTACT_EMAIL",
    scope: "public",
    description: "Public contact address.",
    whenMissing: "Footer shows \"Contact: not configured\".",
    result: validateText(raw.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "must be an email address"),
  },
  {
    id: "SOCIAL_URL",
    env: "NEXT_PUBLIC_SOCIAL_URL",
    scope: "public",
    description: "Official social account URL.",
    whenMissing: "Footer omits the social link.",
    result: validateUrl(raw.socialUrl),
  },
  {
    id: "RESTRICTED_REGION_LIST",
    env: "RESTRICTED_REGION_LIST",
    scope: "server",
    description: "Extra blocked regions (sanctions list from the owner with counsel). US is always blocked.",
    whenMissing: "Only US is blocked.",
    result: { ok: false, reason: "set in Cloudflare Pages environment (server only)" },
  },
  {
    id: "RPC_UPSTREAM_URL",
    env: "RPC_UPSTREAM_URL",
    scope: "server",
    description: "Private RPC endpoint for /api/rpc (key stays in Cloudflare env).",
    whenMissing: "/api/rpc answers \"RPC upstream not configured\" unless ALLOW_PUBLIC_UPSTREAM=1 (public endpoint, rate-limited).",
    result: { ok: false, reason: "set in Cloudflare Pages environment (server only)" },
  },
  {
    id: "ALLOWED_ORIGINS",
    env: "ALLOWED_ORIGINS",
    scope: "server",
    description: "Extra origins allowed to call /api/rpc (same origin is always allowed).",
    whenMissing: "Same origin only.",
    result: { ok: false, reason: "set in Cloudflare Pages environment (server only)" },
  },
  {
    id: "DOMAIN",
    env: "",
    scope: "owner",
    description: "Product domain (config/brand.ts). Name and domain check pending.",
    whenMissing: "No domain shown.",
    result: { ok: false, reason: "not configured" },
  },
  {
    id: "OXBOW_ENTRYPOINT",
    env: "",
    scope: "owner",
    description: "0xbow Entrypoint address, kept only as an observed note. The brief that held it was not available.",
    whenMissing: "Not recorded. 0xbow stays disabled.",
    result: { ok: false, reason: "not configured" },
  },
];

function get(id: string): Validity {
  const p = PLACEHOLDERS.find((x) => x.id === id);
  return p ? p.result : { ok: false, reason: "unknown placeholder" };
}

const valueOr = (id: string, fallback: string) => {
  const r = get(id);
  return r.ok ? r.value : fallback;
};

export const config = {
  rawMode: raw.mode,
  auditCleared: valueOr("AUDIT_CLEARED", "false") === "true",
  legalOpinionCleared: valueOr("LEGAL_OPINION_CLEARED", "false") === "true",
  walletConnectProjectId: get("WALLETCONNECT_PROJECT_ID").ok ? valueOr("WALLETCONNECT_PROJECT_ID", "") : null,
  siteUrl: get("SITE_URL").ok ? valueOr("SITE_URL", "") : null,
  tosVersion: valueOr("TOS_VERSION", "draft-0"),
  auditReportUrl: get("AUDIT_REPORT_URL").ok ? valueOr("AUDIT_REPORT_URL", "") : null,
  poolAuditReportUrl: get("POOL_AUDIT_REPORT_URL").ok ? valueOr("POOL_AUDIT_REPORT_URL", "") : null,
  interfaceFeeBps: Number(valueOr("INTERFACE_FEE_BPS", "0")),
  screeningProvider: get("SCREENING_PROVIDER").ok ? valueOr("SCREENING_PROVIDER", "") : null,
  enableEthPool: valueOr("ENABLE_ETH_POOL", "false") === "true",
  enableOxbow: valueOr("ENABLE_OXBOW", "false") === "true",
  contactEmail: get("CONTACT_EMAIL").ok ? valueOr("CONTACT_EMAIL", "") : null,
  socialUrl: get("SOCIAL_URL").ok ? valueOr("SOCIAL_URL", "") : null,
  explorerUrl: EXPLORER_URL,
} as const;

export const unconfigured = () => PLACEHOLDERS.filter((p) => !p.result.ok);
