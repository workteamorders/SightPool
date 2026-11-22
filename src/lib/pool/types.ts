/**
 * Pool client contract. This build has exactly one implementation: MockPoolClient.
 * A real implementation is NOT written and must not be added in this phase (see docs/INTEGRATION-FUTURE.md).
 */
export type ActionKind = "shield" | "transfer" | "unshield";

/** Outcomes a tester can force in mock mode. "success" is the normal path. */
export type MockOutcome =
  | "success"
  | "rejected"
  | "insufficient-allowance"
  | "paused-or-frozen"
  | "screening-deny"
  | "screening-review"
  | "proof-failure"
  | "relayer-failure"
  | "mainnet-gated"
  | "rpc-error";

export interface MockNote {
  id: string;
  /** Mock commitment, always prefixed "mock-". */
  commitment: string;
  amount: bigint;
  createdAt: number;
  spent: boolean;
  label: "mock";
}

export interface ActivityItem {
  id: string;
  kind: ActionKind;
  amount: bigint;
  fee: bigint;
  /** Mock public hash, always prefixed "mock-". */
  hash: string;
  commitment: string | null;
  counterparty: string | null;
  createdAt: number;
  status: "success" | "failed";
  failure?: string;
  label: "mock";
}

export interface Balances {
  publicBalance: bigint;
  shieldedBalance: bigint;
}

export interface ShieldInput {
  from: string;
  amount: bigint;
}
export interface TransferInput {
  to: string;
  amount: bigint;
}
export interface UnshieldInput {
  to: string;
  amount: bigint;
}

export type ActionResult =
  | { ok: true; item: ActivityItem }
  | { ok: false; error: PoolError };

export interface PoolError {
  code: Exclude<MockOutcome, "success"> | "invalid-input" | "insufficient-balance";
  title: string;
  /** What happened. */
  what: string;
  /** Whether funds or data moved. */
  funds: string;
  /** What the user can do now. */
  next: string;
}

export interface DisclosureRecord {
  date: string;
  kind: ActionKind;
  amount: string;
  fee: string;
  publicHash: string;
  commitment: string;
  counterparty: string;
  label: "mock";
}

export interface PoolClient {
  readonly kind: "mock";
  balances(): Promise<Balances>;
  shield(input: ShieldInput): Promise<ActionResult>;
  transfer(input: TransferInput): Promise<ActionResult>;
  unshield(input: UnshieldInput): Promise<ActionResult>;
  listNotes(): Promise<MockNote[]>;
  activity(): Promise<ActivityItem[]>;
  exportDisclosure(filter?: { from?: number; to?: number }): Promise<DisclosureRecord[]>;
}
