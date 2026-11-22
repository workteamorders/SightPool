import { previewFee } from "../fee";
import { USDG_DECIMALS } from "../../../config/allowlist";
import { formatAmount, isEvmAddress, isMockShieldedAddress } from "../format";
import type {
  ActionKind,
  ActionResult,
  ActivityItem,
  Balances,
  DisclosureRecord,
  MockNote,
  MockOutcome,
  PoolClient,
  PoolError,
  ShieldInput,
  TransferInput,
  UnshieldInput,
} from "./types";

/** Obviously fake wallet used in mock mode. */
export const MOCK_WALLET = "0x1111111111111111111111111111111111111111" as const;
export const MOCK_START_BALANCE = 1_000n * 10n ** BigInt(USDG_DECIMALS);

export interface MockStore {
  load(): string | null;
  save(s: string): void;
  clear(): void;
}

export const memoryStore = (): MockStore => {
  let v: string | null = null;
  return { load: () => v, save: (s) => void (v = s), clear: () => void (v = null) };
};

interface State {
  publicBalance: bigint;
  notes: MockNote[];
  activity: ActivityItem[];
}

const hex = (n: number) => {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
};
export const mockHash = () => `mock-0x${hex(64)}`;
export const mockCommitment = () => `mock-c-${hex(32)}`;
export const newMockShieldedAddress = () => `mock-shielded:${hex(40)}`;

const ERRORS: Record<PoolError["code"], Omit<PoolError, "code">> = {
  rejected: {
    title: "Request rejected",
    what: "The mock wallet rejected the request, as a real wallet would if you pressed Reject.",
    funds: "Nothing moved. Mock balances are unchanged.",
    next: "Review the details and try again when ready.",
  },
  "insufficient-allowance": {
    title: "Allowance too low",
    what: "The pool would need permission to move this much mock USDG, and the mock allowance is lower.",
    funds: "Nothing moved. Mock balances are unchanged.",
    next: "In a real build you would approve the amount first. Here, choose another outcome or lower the amount.",
  },
  "paused-or-frozen": {
    title: "Token paused or address frozen",
    what: "USDG can be paused by its issuer, and addresses can be frozen. The mock simulated that state.",
    funds: "Nothing moved. The issuer, not this interface or the pool, controls pausing and freezing.",
    next: "Check the token status in Settings. There is nothing to do here until the issuer lifts it.",
  },
  "screening-deny": {
    title: "Deposit denied by screening",
    what: "Mock screening returned deny for this deposit.",
    funds: "Nothing moved. The deposit did not reach the pool.",
    next: "Denied deposits cannot continue. This interface offers no way around screening.",
  },
  "screening-review": {
    title: "Deposit held for review",
    what: "Mock screening returned review. The default policy is to stop.",
    funds: "Nothing moved.",
    next: "A real provider would need to clear the deposit first. Nothing in this interface skips review.",
  },
  "proof-failure": {
    title: "Proof could not be built",
    what: "The simulated zero-knowledge proof step failed.",
    funds: "Nothing moved. Your mock notes are unchanged.",
    next: "Try again. Repeated failures in a real build would mean the protocol's prover is having problems.",
  },
  "relayer-failure": {
    title: "Relayer did not respond",
    what: "The simulated relayer failed to submit the transaction.",
    funds: "Nothing moved. Your mock notes are unchanged.",
    next: "Try again later. This interface does not operate a relayer.",
  },
  "mainnet-gated": {
    title: "Mainnet is gated",
    what: "Real transactions are off in this build. There is no write path, no audit and no legal opinion on record.",
    funds: "Nothing moved.",
    next: "See Settings for the conditions that must be met first.",
  },
  "rpc-error": {
    title: "Network read failed",
    what: "The simulated RPC call did not answer.",
    funds: "Nothing moved.",
    next: "Try again in a moment.",
  },
  "invalid-input": {
    title: "Check the details",
    what: "Some details are missing or in the wrong format.",
    funds: "Nothing moved.",
    next: "Fix the highlighted field and try again.",
  },
  "insufficient-balance": {
    title: "Not enough mock balance",
    what: "The amount, including the documented fee, is more than the mock balance available.",
    funds: "Nothing moved.",
    next: "Lower the amount.",
  },
};

export const poolError = (code: PoolError["code"], what?: string): PoolError => ({ code, ...ERRORS[code], ...(what ? { what } : {}) });

const serialize = (s: State) =>
  JSON.stringify(s, (_k, v: unknown) => (typeof v === "bigint" ? `${v.toString()}n` : v));
const deserialize = (raw: string): State =>
  JSON.parse(raw, (_k, v: unknown) => (typeof v === "string" && /^-?\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v)) as State;

export class MockPoolClient implements PoolClient {
  readonly kind = "mock" as const;
  private state: State;
  private outcome: MockOutcome = "success";

  constructor(
    private store: MockStore = memoryStore(),
    private delayMs = 900,
  ) {
    this.state = this.read();
  }

  private fresh(): State {
    return { publicBalance: MOCK_START_BALANCE, notes: [], activity: [] };
  }

  private read(): State {
    try {
      const raw = this.store.load();
      if (!raw) return this.fresh();
      const s = deserialize(raw);
      if (typeof s.publicBalance !== "bigint" || !Array.isArray(s.notes) || !Array.isArray(s.activity)) return this.fresh();
      return s;
    } catch {
      return this.fresh();
    }
  }

  private persist() {
    try {
      this.store.save(serialize(this.state));
    } catch {
      /* storage unavailable: state stays in memory */
    }
  }

  setOutcome(o: MockOutcome) {
    this.outcome = o;
  }
  getOutcome() {
    return this.outcome;
  }

  reset() {
    this.state = this.fresh();
    this.outcome = "success";
    try {
      this.store.clear();
    } catch {
      /* ignore */
    }
  }

  private wait() {
    return this.delayMs ? new Promise((r) => setTimeout(r, this.delayMs)) : Promise.resolve();
  }

  private shieldedBalance() {
    return this.state.notes.filter((n) => !n.spent).reduce((a, n) => a + n.amount, 0n);
  }

  async balances(): Promise<Balances> {
    return { publicBalance: this.state.publicBalance, shieldedBalance: this.shieldedBalance() };
  }

  async listNotes(): Promise<MockNote[]> {
    return [...this.state.notes].sort((a, b) => b.createdAt - a.createdAt);
  }

  async activity(): Promise<ActivityItem[]> {
    return [...this.state.activity].sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Forced outcomes that apply before any state change. Screening outcomes are handled by the flow. */
  private forced(kind: ActionKind): PoolError | null {
    const o = this.outcome;
    if (o === "success" || o === "screening-deny" || o === "screening-review") return null;
    if (o === "insufficient-allowance" && kind !== "shield") return null;
    return poolError(o);
  }

  private record(kind: ActionKind, amount: bigint, fee: bigint, commitment: string | null, counterparty: string | null): ActivityItem {
    const item: ActivityItem = {
      id: `mock-a-${hex(12)}`,
      kind,
      amount,
      fee,
      hash: mockHash(),
      commitment,
      counterparty,
      createdAt: Date.now(),
      status: "success",
      label: "mock",
    };
    this.state.activity.push(item);
    return item;
  }

  /** Spend notes to cover `need`, returning change as a new note. Greedy, oldest first. */
  private spend(need: bigint): boolean {
    const unspent = this.state.notes.filter((n) => !n.spent).sort((a, b) => a.createdAt - b.createdAt);
    let got = 0n;
    const used: MockNote[] = [];
    for (const n of unspent) {
      if (got >= need) break;
      used.push(n);
      got += n.amount;
    }
    if (got < need) return false;
    for (const n of used) n.spent = true;
    const change = got - need;
    if (change > 0n) this.state.notes.push({ id: `mock-n-${hex(12)}`, commitment: mockCommitment(), amount: change, createdAt: Date.now(), spent: false, label: "mock" });
    return true;
  }

  async shield({ from, amount }: ShieldInput): Promise<ActionResult> {
    await this.wait();
    if (!isEvmAddress(from) || amount <= 0n) return { ok: false, error: poolError("invalid-input") };
    const f = this.forced("shield");
    if (f) return { ok: false, error: f };
    if (amount > this.state.publicBalance) return { ok: false, error: poolError("insufficient-balance", "The amount is more than the mock public balance.") };
    this.state.publicBalance -= amount;
    const commitment = mockCommitment();
    this.state.notes.push({ id: `mock-n-${hex(12)}`, commitment, amount, createdAt: Date.now(), spent: false, label: "mock" });
    const item = this.record("shield", amount, 0n, commitment, null);
    this.persist();
    return { ok: true, item };
  }

  async transfer({ to, amount }: TransferInput): Promise<ActionResult> {
    await this.wait();
    if (!isMockShieldedAddress(to) || amount <= 0n) return { ok: false, error: poolError("invalid-input") };
    const f = this.forced("transfer");
    if (f) return { ok: false, error: f };
    const fee = previewFee(amount, USDG_DECIMALS);
    if (fee.belowMinimum) return { ok: false, error: poolError("invalid-input", `The amount must be more than the documented fee of ${formatAmount(fee.total, USDG_DECIMALS)} USDG.`) };
    if (!this.spend(amount)) return { ok: false, error: poolError("insufficient-balance") };
    const item = this.record("transfer", amount, fee.total, mockCommitment(), to);
    this.persist();
    return { ok: true, item };
  }

  async unshield({ to, amount }: UnshieldInput): Promise<ActionResult> {
    await this.wait();
    if (!isEvmAddress(to) || amount <= 0n) return { ok: false, error: poolError("invalid-input") };
    const f = this.forced("unshield");
    if (f) return { ok: false, error: f };
    const fee = previewFee(amount, USDG_DECIMALS);
    if (fee.belowMinimum) return { ok: false, error: poolError("invalid-input", `The amount must be more than the documented fee of ${formatAmount(fee.total, USDG_DECIMALS)} USDG.`) };
    if (!this.spend(amount)) return { ok: false, error: poolError("insufficient-balance") };
    if (to.toLowerCase() === MOCK_WALLET.toLowerCase()) this.state.publicBalance += fee.net;
    const item = this.record("unshield", amount, fee.total, null, to);
    this.persist();
    return { ok: true, item };
  }

  async exportDisclosure(filter: { from?: number; to?: number } = {}): Promise<DisclosureRecord[]> {
    const items = (await this.activity())
      .filter((a) => a.status === "success")
      .filter((a) => (filter.from === undefined || a.createdAt >= filter.from) && (filter.to === undefined || a.createdAt <= filter.to))
      .sort((a, b) => a.createdAt - b.createdAt);
    return items.map((a) => ({
      date: new Date(a.createdAt).toISOString(),
      kind: a.kind,
      amount: formatAmount(a.amount, USDG_DECIMALS, { min: 2 }),
      fee: formatAmount(a.fee, USDG_DECIMALS, { min: 2 }),
      publicHash: a.hash,
      commitment: a.commitment ?? "",
      counterparty: a.counterparty ?? "",
      label: "mock",
    }));
  }
}
