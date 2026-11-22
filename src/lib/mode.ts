/**
 * The only two modes this build knows. There is no client-side override: no query string, no storage key,
 * no console hook. The value comes from NEXT_PUBLIC_MODE at build time and nothing else.
 */
export type Mode = "mock" | "readonly";

export interface ModeResolution {
  mode: Mode;
  /** Set when the configured value was ignored. Shown in Settings. */
  reason: string | null;
}

export function resolveMode(env: { NEXT_PUBLIC_MODE?: string | undefined }): ModeResolution {
  const raw = env.NEXT_PUBLIC_MODE;
  if (raw === undefined || raw.trim() === "") return { mode: "mock", reason: null };
  const v = raw.trim().toLowerCase();
  if (v === "mock") return { mode: "mock", reason: null };
  if (v === "readonly") return { mode: "readonly", reason: null };
  if (v === "testnet") {
    return { mode: "mock", reason: "\"testnet\" is not available: the underlying pool documents no testnet deployment. Using mock mode." };
  }
  if (v === "mainnet") {
    return { mode: "mock", reason: "\"mainnet\" is not available: this build has no write path, no audit and no legal opinion on record. Using mock mode." };
  }
  return { mode: "mock", reason: `"${raw.trim().slice(0, 24)}" is not a recognised mode. Using mock mode.` };
}

/** Resolved once at build time. Literal access so Next inlines it. */
export const MODE: ModeResolution = resolveMode({ NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE });
