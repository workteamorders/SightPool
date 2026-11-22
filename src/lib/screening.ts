/**
 * Deposit screening. One adapter interface, one implementation: a mock. No real provider exists in this phase,
 * so the status reads "Screening provider not configured" and the mainnet path stays locked.
 */
export type ScreeningStatus = "clear" | "review" | "deny";

export interface ScreeningRequest {
  from: string;
  amount: bigint;
  token: string;
  pool: string;
}

export interface ScreeningResult {
  status: ScreeningStatus;
  referenceId: string;
  /** Plain-language reason shown to the user. */
  message: string;
}

export interface ScreeningAdapter {
  readonly id: string;
  readonly isMock: boolean;
  screenDeposit(req: ScreeningRequest): Promise<ScreeningResult>;
}

/** Default review policy: stop. A deposit under review does not go ahead. */
export const REVIEW_POLICY = "stop" as const;

/** Whether a result lets the flow continue. Only "clear" does. */
export function screeningAllows(r: ScreeningResult): boolean {
  return r.status === "clear";
}

const MESSAGES: Record<ScreeningStatus, string> = {
  clear: "Mock screening returned clear. A real provider is not configured.",
  review: "Mock screening flagged this deposit for review. Under the default policy, the deposit stops here.",
  deny: "Mock screening denied this deposit. Nothing was moved.",
};

export class MockScreeningAdapter implements ScreeningAdapter {
  readonly id = "mock";
  readonly isMock = true;
  constructor(
    private outcome: ScreeningStatus = "clear",
    private delayMs = 400,
  ) {}
  setOutcome(o: ScreeningStatus) {
    this.outcome = o;
  }
  async screenDeposit(req: ScreeningRequest): Promise<ScreeningResult> {
    if (!/^0x[0-9a-fA-F]{40}$/.test(req.from) && !req.from.startsWith("mock-")) throw new Error("invalid sender");
    if (req.amount <= 0n) throw new Error("invalid amount");
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    const ref = `mock-scr-${Math.random().toString(16).slice(2, 10)}`;
    return { status: this.outcome, referenceId: ref, message: MESSAGES[this.outcome] };
  }
}
