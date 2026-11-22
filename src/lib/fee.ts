import { USDG_POOL_FEE } from "../../config/facts";

export interface FeePreview {
  /** Flat part, raw units. */
  fixed: bigint;
  /** Percentage part, raw units, rounded up so the preview never understates the fee. */
  variable: bigint;
  total: bigint;
  /** amount - total, or 0n when the fee is larger than the amount. */
  net: bigint;
  /** True when the amount does not cover the fee: the action is blocked. */
  belowMinimum: boolean;
  /** Interface fee, raw units. Always 0n unless the owner configures INTERFACE_FEE_BPS. */
  interfaceFee: bigint;
}

const ceilDiv = (a: bigint, b: bigint) => (a === 0n ? 0n : (a + b - 1n) / b);

/**
 * Relayer fee preview for the USDG pool: fixed + amount x 35 / 10000.
 * `decimals` is the token's on-chain decimals (6 for USDG, read at Gate X). The documented fixed fee is
 * 0.5 token, so it is rescaled if decimals ever differ from 6.
 */
export function previewFee(amount: bigint, decimals: number, interfaceFeeBps = 0): FeePreview {
  if (amount < 0n) throw new RangeError("amount must not be negative");
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new RangeError("decimals out of range");
  if (!Number.isInteger(interfaceFeeBps) || interfaceFeeBps < 0 || interfaceFeeBps > 10_000) throw new RangeError("interface fee out of range");
  const fixed = decimals >= 6 ? USDG_POOL_FEE.fixedRaw * 10n ** BigInt(decimals - 6) : ceilDiv(USDG_POOL_FEE.fixedRaw, 10n ** BigInt(6 - decimals));
  const variable = ceilDiv(amount * USDG_POOL_FEE.bpsNumerator, USDG_POOL_FEE.bpsDenominator);
  const interfaceFee = ceilDiv(amount * BigInt(interfaceFeeBps), 10_000n);
  const total = fixed + variable + interfaceFee;
  const belowMinimum = amount <= total;
  return { fixed, variable, total, net: belowMinimum ? 0n : amount - total, belowMinimum, interfaceFee };
}
