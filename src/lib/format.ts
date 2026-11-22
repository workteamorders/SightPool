/** Amount parsing and formatting with bigint only. No floating point touches money. */

export type ParseResult = { ok: true; value: bigint } | { ok: false; error: string };

export function parseAmount(input: string, decimals: number): ParseResult {
  const s = input.trim().replace(/,/g, "");
  if (!s) return { ok: false, error: "Enter an amount." };
  if (!/^\d*(\.\d*)?$/.test(s) || s === ".") return { ok: false, error: "Use digits and one decimal point, for example 25.50." };
  const [whole = "", frac = ""] = s.split(".");
  if (frac.length > decimals) return { ok: false, error: `USDG has ${decimals} decimal places. Use at most ${decimals} digits after the point.` };
  if (whole.replace(/^0+/, "").length > 15) return { ok: false, error: "That amount is too large." };
  const value = BigInt((whole || "0") + frac.padEnd(decimals, "0"));
  if (value === 0n) return { ok: false, error: "Enter an amount above zero." };
  return { ok: true, value };
}

export function formatAmount(raw: bigint, decimals: number, opts: { min?: number; max?: number } = {}): string {
  const neg = raw < 0n;
  const v = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  let frac = (v % base).toString().padStart(decimals, "0");
  const max = opts.max ?? decimals;
  const min = opts.min ?? 2;
  frac = frac.slice(0, max).replace(/0+$/, "");
  if (frac.length < min) frac = frac.padEnd(Math.min(min, decimals), "0");
  const w = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${w}${frac ? "." + frac : ""}`;
}

export const shortHex = (h: string, head = 6, tail = 4) => (h.length <= head + tail + 1 ? h : `${h.slice(0, head)}…${h.slice(-tail)}`);

export function isEvmAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s.trim());
}

/** The mock shielded address form. Deliberately fake-looking: the real format is undocumented. */
export const MOCK_SHIELDED_PREFIX = "mock-shielded:";
export function isMockShieldedAddress(s: string): boolean {
  return /^mock-shielded:[0-9a-f]{40}$/.test(s.trim());
}

export function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
