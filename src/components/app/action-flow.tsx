"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { USDG_DECIMALS } from "@config/allowlist";
import { config } from "@config/env";
import { previewFee } from "@/lib/fee";
import { formatAmount, parseAmount } from "@/lib/format";
import type { ActionKind, ActivityItem, Balances, MockOutcome, PoolError } from "@/lib/pool/types";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { Panel } from "@/components/ui/card";
import { Row, Statement } from "@/components/ui/statement";
import { EmptyState, ErrorState, StatementSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useApp } from "./app-context";
import { FeeRows, FlowHeader, OutcomePicker, PendingNote, useDraft } from "./flow-parts";
import { Receipt } from "./receipt";

const STEPS = ["Details", "Review", "Result"];
const VERB: Record<ActionKind, string> = { shield: "Shield", transfer: "Transfer", unshield: "Unshield" };

export interface ToField {
  label: string;
  hint: ReactNode;
  placeholder: string;
  initial: string;
  validate: (s: string) => string | null;
  helpers?: (set: (v: string) => void) => ReactNode;
  /** When false, the "to" field is shown read-only (e.g. the pool for shield). */
  editable: boolean;
  reviewLabel: string;
}

export interface ActionFlowProps {
  kind: ActionKind;
  lead: ReactNode;
  to: ToField;
  available: (b: Balances) => bigint;
  availableLabel: string;
  hasFee: boolean;
  extraReview?: (amount: bigint, to: string) => ReactNode;
  irreversible: string;
  run: (amount: bigint, to: string, outcome: MockOutcome) => Promise<{ ok: true; item: ActivityItem; screeningRef?: string | null } | { ok: false; error: PoolError }>;
  empty?: { title: string; body: string; href: string; cta: string };
  pendingStages: string[];
}

export function ActionFlow(p: ActionFlowProps) {
  const app = useApp();
  const { toast } = useToast();
  const [draft, setDraft, clearDraft] = useDraft(p.kind, { amount: "", to: p.to.initial });
  const [touched, setTouched] = useState<{ amount: boolean; to: boolean }>({ amount: false, to: false });
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<MockOutcome>("success");
  const [ack, setAck] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<PoolError | null>(null);
  const [done, setDone] = useState<{ item: ActivityItem; screeningRef?: string | null } | null>(null);

  const available = app.balances ? p.available(app.balances) : null;
  const parsed = parseAmount(draft.amount, USDG_DECIMALS);
  const amount = parsed.ok ? parsed.value : null;
  const fee = p.hasFee && amount ? previewFee(amount, USDG_DECIMALS, config.interfaceFeeBps) : null;

  const amountError = (() => {
    if (!parsed.ok) return parsed.error;
    if (available !== null && parsed.value > available) return `That is more than your ${p.availableLabel.toLowerCase()} of ${formatAmount(available, USDG_DECIMALS)} USDG.`;
    if (fee?.belowMinimum) return `Enter more than the documented fee of ${formatAmount(fee.total, USDG_DECIMALS)} USDG.`;
    return null;
  })();
  const toError = p.to.editable ? p.to.validate(draft.to) : null;
  const canReview = !amountError && !toError && app.regionAllows;

  const toReview = () => {
    setTouched({ amount: true, to: true });
    if (!canReview) return;
    setError(null);
    setAck(false);
    setStep(1);
  };

  const submit = async () => {
    if (!amount || !canReview) return;
    if (!(await app.requireTos())) return;
    setError(null);
    setPending(p.pendingStages[0] ?? "Submitting.");
    const timers = p.pendingStages.slice(1).map((s, i) => setTimeout(() => setPending(s), 500 * (i + 1)));
    try {
      const r = await p.run(amount, draft.to.trim(), outcome);
      if (r.ok) {
        setDone({ item: r.item, screeningRef: r.screeningRef });
        setStep(2);
        clearDraft();
        toast({ title: `${VERB[p.kind]} complete (mock)`, body: `${formatAmount(r.item.amount, USDG_DECIMALS)} USDG. No real funds moved.`, tone: "success" });
      } else {
        setError(r.error);
      }
    } catch {
      setError({ code: "rpc-error", title: "Something went wrong", what: "The mock engine hit an unexpected error.", funds: "Nothing moved.", next: "Try again. If it repeats, clear mock data in Settings." });
    } finally {
      timers.forEach(clearTimeout);
      setPending(null);
      await app.refresh();
    }
  };

  const restart = () => {
    setDone(null);
    setError(null);
    setStep(0);
    setTouched({ amount: false, to: false });
  };

  if (app.balances && available === 0n && p.empty && step === 0) {
    return (
      <div className="flex flex-col gap-6">
        <FlowHeader title={VERB[p.kind]} lead={p.lead} step={0} steps={STEPS} />
        <EmptyState title={p.empty.title} action={<Link href={p.empty.href} className={buttonClass("primary", "md")}>{p.empty.cta}</Link>}>
          {p.empty.body}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FlowHeader title={VERB[p.kind]} lead={p.lead} step={step} steps={STEPS} />

      {step === 0 && (
        <Panel as="section" aria-label="Details" className="flex max-w-form flex-col gap-6 p-6">
          {!app.balances ? (
            <StatementSkeleton rows={3} label="Loading balances" />
          ) : (
            <>
              <Field
                label="Amount"
                hint={
                  <>
                    {p.availableLabel}: <span className="num">{available === null ? "–" : formatAmount(available, USDG_DECIMALS)}</span> USDG (mock)
                  </>
                }
                error={touched.amount ? amountError : null}
                aside={
                  available !== null && available > 0n ? (
                    <button type="button" className="link min-h-touch px-2 text-14" onClick={() => setDraft({ amount: formatAmount(available, USDG_DECIMALS, { min: 0 }).replace(/,/g, "") })}>
                      Use all
                    </button>
                  ) : null
                }
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    mono
                    suffix="USDG"
                    value={draft.amount}
                    invalid={invalid}
                    aria-describedby={describedBy || undefined}
                    onChange={(e) => setDraft({ amount: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                  />
                )}
              </Field>

              <Field label={p.to.label} hint={p.to.hint} error={touched.to ? toError : null} aside={p.to.editable && p.to.helpers ? p.to.helpers((v) => setDraft({ to: v })) : null}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    mono
                    spellCheck={false}
                    autoComplete="off"
                    placeholder={p.to.placeholder}
                    value={p.to.editable ? draft.to : p.to.initial}
                    readOnly={!p.to.editable}
                    invalid={invalid}
                    aria-describedby={describedBy || undefined}
                    onChange={(e) => setDraft({ to: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, to: true }))}
                  />
                )}
              </Field>

              {p.hasFee ? (
                <FeeRows amount={amount} />
              ) : (
                <Statement label="Costs">
                  <Row label="Relayer fee" value="None documented for shield" />
                  <Row label="Network gas" value="Paid by your wallet in ETH (none in mock)" />
                </Statement>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button variant="primary" onClick={toReview} disabled={!app.regionAllows}>
                  Review {p.kind}
                </Button>
                {!app.regionAllows && <p className="text-14 text-muted" role="status">{app.geo.status === "loading" ? "Checking your region before actions are enabled…" : "Actions are off in view-only mode."}</p>}
              </div>
            </>
          )}
        </Panel>
      )}

      {step === 1 && amount && (
        <Panel as="section" aria-label="Review" className="flex max-w-form flex-col gap-6 p-6">
          <h2 className="text-20 font-medium">Check everything once more</h2>
          <Statement label="Summary">
            <Row label="Action" value={`${VERB[p.kind]} (mock)`} />
            <Row label="Amount" value={`${formatAmount(amount, USDG_DECIMALS)} USDG`} mono emphasis />
            <Row label={p.to.reviewLabel} value={<span className="break-all">{p.to.editable ? draft.to.trim() : p.to.initial}</span>} mono />
            {fee && (
              <>
                <Row label="Protocol/relayer fee" value={`${formatAmount(fee.total, USDG_DECIMALS)} USDG`} mono />
                <Row label="Recipient receives" value={`${formatAmount(fee.net, USDG_DECIMALS)} USDG`} mono emphasis />
              </>
            )}
            {p.extraReview?.(amount, draft.to.trim())}
          </Statement>
          <Checkbox checked={ack} onChange={(e) => setAck(e.target.checked)} label={p.irreversible} hint="In mock mode nothing moves. The check is here because it matters in a real build." />
          <OutcomePicker kind={p.kind} value={outcome} onChange={setOutcome} disabled={Boolean(pending)} />
          {pending && <PendingNote stage={pending} />}
          {error && (
            <ErrorState
              title={error.title}
              what={error.what}
              funds={error.funds}
              next={error.next}
              onRetry={submit}
              extra={
                <Button size="sm" variant="ghost" onClick={() => setStep(0)} icon={<ArrowLeft aria-hidden className="size-4" />}>
                  Edit details
                </Button>
              }
            />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => setStep(0)} disabled={Boolean(pending)} icon={<ArrowLeft aria-hidden className="size-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={submit} loading={Boolean(pending)} loadingLabel="Submitting (mock)" disabled={!ack}>
              {VERB[p.kind]} {formatAmount(amount, USDG_DECIMALS)} USDG
            </Button>
          </div>
        </Panel>
      )}

      {step === 2 && done && (
        <section aria-label="Result" className="animate-in flex max-w-form flex-col gap-6">
          <div className="flex flex-col gap-1" role="status">
            <p className="sightline eyebrow" data-tone="accent">
              <span>Done (mock)</span>
            </p>
            <h2 className="text-24 font-semibold">
              {VERB[p.kind]} of {formatAmount(done.item.amount, USDG_DECIMALS)} USDG recorded.
            </h2>
            <p className="text-14 text-muted">The receipt below is your record. It also appears in Activity and can go into a disclosure package.</p>
          </div>
          <Receipt item={done.item} screeningRef={done.screeningRef} />
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={restart}>
              New {p.kind}
            </Button>
            <Link href="/app/activity/" className={buttonClass("secondary", "md")}>
              View activity
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
