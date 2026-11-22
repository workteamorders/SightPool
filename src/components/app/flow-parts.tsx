"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { brand } from "@config/brand";
import { USDG_DECIMALS } from "@config/allowlist";
import { USDG_POOL_FEE, SOURCES } from "@config/facts";
import { config } from "@config/env";
import { previewFee } from "@/lib/fee";
import { formatAmount } from "@/lib/format";
import type { MockOutcome } from "@/lib/pool/types";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { Row, Statement } from "@/components/ui/statement";
import { Select } from "@/components/ui/field";
import { Steps } from "@/components/ui/steps";
import { Notice } from "@/components/ui/notice";

export const OUTCOMES: { value: MockOutcome; label: string; kinds?: ("shield" | "transfer" | "unshield")[] }[] = [
  { value: "success", label: "Success (normal path)" },
  { value: "rejected", label: "Wallet rejects the request" },
  { value: "insufficient-allowance", label: "Allowance too low", kinds: ["shield"] },
  { value: "paused-or-frozen", label: "Token paused or address frozen" },
  { value: "screening-deny", label: "Screening: deny", kinds: ["shield"] },
  { value: "screening-review", label: "Screening: review", kinds: ["shield"] },
  { value: "proof-failure", label: "Proof failure" },
  { value: "relayer-failure", label: "Relayer failure", kinds: ["transfer", "unshield"] },
  { value: "mainnet-gated", label: "Mainnet gated" },
  { value: "rpc-error", label: "RPC error" },
];

/** Mock-only control to force an outcome, so every state can be seen. Clearly labelled, folded by default. */
export function OutcomePicker({ kind, value, onChange, disabled }: { kind: "shield" | "transfer" | "unshield"; value: MockOutcome; onChange: (v: MockOutcome) => void; disabled?: boolean }) {
  return (
    <details className="group rounded-md border border-dashed border-line-strong px-4 open:pb-4">
      <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between text-14 text-muted [&::-webkit-details-marker]:hidden">
        <span>
          Test outcome (mock only): <span className="text-text">{OUTCOMES.find((o) => o.value === value)?.label}</span>
        </span>
        <span aria-hidden className="transition-transform duration-[var(--dur-element)] group-open:rotate-45">
          +
        </span>
      </summary>
      <label className="mb-2 mt-2 block text-14" htmlFor={`outcome-${kind}`}>
        Force the next result
      </label>
      <Select id={`outcome-${kind}`} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as MockOutcome)}>
        {OUTCOMES.filter((o) => !o.kinds || o.kinds.includes(kind)).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <p className="mt-2 text-12 text-muted">For trying error states. It changes only the simulated result and never skips screening in a real build.</p>
    </details>
  );
}

export function FeeRows({ amount }: { amount: bigint | null }) {
  const f = amount !== null && amount > 0n ? previewFee(amount, USDG_DECIMALS, config.interfaceFeeBps) : null;
  const v = (x: bigint | undefined) => (x === undefined ? "–" : `${formatAmount(x, USDG_DECIMALS)} USDG`);
  return (
    <div className="flex flex-col gap-3">
      <Statement label="Fee preview">
        <Row label="Protocol/relayer flat fee" value={v(f?.fixed ?? USDG_POOL_FEE.fixedRaw)} mono />
        <Row label="Protocol/relayer 0.35%" value={v(f?.variable)} mono />
        <Row label={`${brand.name} fee`} value={v(f?.interfaceFee ?? 0n)} mono />
        <Row label="Total fee" value={v(f?.total)} mono emphasis />
        <Row label="Recipient receives" value={f ? (f.belowMinimum ? "Below fee" : v(f.net)) : "–"} mono emphasis />
      </Statement>
      <p className="text-12 text-faint">
        Protocol/relayer fee, not a {brand.name} fee. {USDG_POOL_FEE.label}:{" "}
        <a className="link" href={SOURCES.rail20Contracts} target="_blank" rel="noopener noreferrer">
          source
        </a>
        . In the mock, the fee comes out of the amount you enter.
      </p>
    </div>
  );
}

export function FlowHeader({ title, lead, step, steps }: { title: string; lead: ReactNode; step: number; steps: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-32 font-semibold">{title}</h1>
        <Steps steps={steps} current={step} />
      </div>
      <p className="text-16 text-muted prose-measure">{lead}</p>
    </div>
  );
}

/** Draft that survives reloads and errors. Never holds anything sensitive: only an amount and a public or mock address. */
export function useDraft<T extends Record<string, string>>(name: string, initial: T): [T, (patch: Partial<T>) => void, () => void] {
  const [v, setV] = useState<T>(initial);
  const loaded = useRef(false);
  useEffect(() => {
    const all = readJson<Record<string, T>>(KEYS.drafts, {});
    if (all[name]) setV({ ...initial, ...all[name] });
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  const update = (patch: Partial<T>) =>
    setV((prev) => {
      const next = { ...prev, ...patch };
      if (loaded.current) writeJson(KEYS.drafts, { ...readJson<Record<string, T>>(KEYS.drafts, {}), [name]: next });
      return next;
    });
  const clear = () => {
    setV(initial);
    const all = readJson<Record<string, T>>(KEYS.drafts, {});
    delete all[name];
    writeJson(KEYS.drafts, all);
  };
  return [v, update, clear];
}

export function PendingNote({ stage }: { stage: string }) {
  return (
    <Notice tone="info" role="status" title="Working (mock)">
      {stage} Your entries stay as they are.
    </Notice>
  );
}
