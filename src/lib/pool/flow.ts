import { USDG, USDG_POOL } from "../../../config/allowlist";
import { MockScreeningAdapter, screeningAllows, type ScreeningResult } from "../screening";
import { MockPoolClient, poolError } from "./mock";
import type { ActionResult, MockOutcome } from "./types";

/**
 * Orchestrates a shield in mock mode: screening first, then the pool. Deny and review both stop.
 * Returns the screening result alongside so the receipt can show the reference ID.
 */
export async function runShield(
  client: MockPoolClient,
  screening: MockScreeningAdapter,
  input: { from: string; amount: bigint },
  outcome: MockOutcome,
): Promise<{ result: ActionResult; screening: ScreeningResult | null }> {
  client.setOutcome(outcome);
  screening.setOutcome(outcome === "screening-deny" ? "deny" : outcome === "screening-review" ? "review" : "clear");
  if (outcome === "mainnet-gated") return { result: { ok: false, error: poolError("mainnet-gated") }, screening: null };
  let s: ScreeningResult;
  try {
    s = await screening.screenDeposit({ from: input.from, amount: input.amount, token: USDG, pool: USDG_POOL });
  } catch {
    return { result: { ok: false, error: poolError("invalid-input") }, screening: null };
  }
  if (!screeningAllows(s)) {
    return { result: { ok: false, error: poolError(s.status === "deny" ? "screening-deny" : "screening-review") }, screening: s };
  }
  return { result: await client.shield(input), screening: s };
}
