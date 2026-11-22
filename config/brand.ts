/**
 * The only place the product name may be written. `pnpm brand:check` fails if it appears anywhere else in
 * src/, functions/, or config/. The name is a working name: see README "Open decisions".
 */
export const brand = {
  name: "Sightpool",
  /** Not registered yet. Empty means "not configured" (see config/env.ts). */
  domain: "",
  tagline: "A compliance-first interface for the USDG privacy pool on Robinhood Chain.",
} as const;
