"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { brand } from "@config/brand";
import { config, unconfigured } from "@config/env";
import { ALLOWLIST, USDG, USDG_POOL } from "@config/allowlist";
import { CHAIN_ID_HEX } from "@config/chain";
import { FACTS_CHECKED_ON } from "@config/facts";
import { MODE } from "@/lib/mode";
import { readChainId, readHasCode, readIsFrozen, readLastRoot, readPaused } from "@/lib/rpc-client";
import { shortHex } from "@/lib/format";
import { Panel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Address } from "@/components/ui/address";
import { Dialog } from "@/components/ui/dialog";
import { Row, Statement, Dash } from "@/components/ui/statement";
import { useToast } from "@/components/ui/toast";
import { useApp } from "../app-context";
import { WalletStatus } from "../wallet-status";

type Live = { at: number; chainOk: boolean | null; codes: Record<string, boolean | null>; paused: boolean | null; poolFrozen: boolean | null; root: string | null };

export function SettingsView() {
  const { resetMock, geo } = useApp();
  const { toast } = useToast();
  const [live, setLive] = useState<Live | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const recheck = async () => {
    setChecking(true);
    const withAddr = ALLOWLIST.filter((e) => e.address);
    const [chain, paused, poolFrozen, root, ...codes] = await Promise.all([
      readChainId(),
      readPaused(USDG),
      readIsFrozen(USDG, USDG_POOL),
      readLastRoot(USDG_POOL),
      ...withAddr.map((e) => readHasCode(e.address as string)),
    ]);
    setLive({
      at: Date.now(),
      chainOk: chain === null ? null : chain.toLowerCase() === CHAIN_ID_HEX,
      codes: Object.fromEntries(withAddr.map((e, i) => [e.key, codes[i] ?? null])),
      paused,
      poolFrozen,
      root,
    });
    setChecking(false);
  };

  const conditions = [
    { label: "Interface audit", ok: Boolean(config.auditReportUrl), state: config.auditReportUrl ? "Report linked" : "None on record" },
    { label: "Underlying pool audit", ok: Boolean(config.poolAuditReportUrl), state: config.poolAuditReportUrl ? "Report linked" : "None on record (the protocol says no formal audit yet)" },
    { label: "Written legal opinion", ok: config.legalOpinionCleared, state: config.legalOpinionCleared ? "Owner flag set" : "Not on record" },
    { label: "Audit flag (AUDIT_CLEARED)", ok: config.auditCleared, state: String(config.auditCleared) },
    { label: "Screening provider", ok: Boolean(config.screeningProvider), state: config.screeningProvider ? config.screeningProvider : "Screening provider not configured" },
    { label: "Write path in this build", ok: false, state: "Not present. This build cannot send transactions." },
    { label: "Key handling without a third-party relayer", ok: false, state: "Not available from the protocol today" },
  ];

  const missing = unconfigured();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-32 font-semibold">Settings and status</h1>
        <p className="text-16 text-muted prose-measure">What this build can and cannot do, and why. Nothing here can unlock real transactions: those need changes outside the interface.</p>
      </div>

      <Panel as="section" aria-labelledby="mode-h" className="flex flex-col gap-4 p-6">
        <h2 id="mode-h" className="text-20 font-medium">
          Mode
        </h2>
        <Statement label="Mode">
          <Row label="Current mode" value={MODE.mode === "mock" ? "Mock" : "Read-only"} />
          <Row label="Set by" value="Build configuration only (NEXT_PUBLIC_MODE)" />
          <Row label="Recognised values" value="mock, readonly" mono />
        </Statement>
        {MODE.reason && <Notice tone="warning" title="Configured mode ignored">{MODE.reason}</Notice>}
        <div className="border-t border-line pt-4">
          <Switch
            label="Mainnet transactions"
            checked={false}
            disabled
            lockedReason="Locked"
            hint="Locked. It needs an audit and a written legal opinion, and the audit must cover both this interface and the underlying pool. This build also has no write path at all."
          />
        </div>
        <ul className="flex flex-col divide-y divide-line rounded-md border border-line" aria-label="Conditions for mainnet">
          {conditions.map((c) => (
            <li key={c.label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-14">{c.label}</span>
              <span className="flex items-center gap-2 text-14 text-muted">
                {c.ok ? <Badge tone="neutral">Met</Badge> : <Badge tone="locked">Not met</Badge>}
                <span>{c.state}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel as="section" aria-labelledby="wallet-h" className="flex flex-col gap-4 p-6">
        <h2 id="wallet-h" className="text-20 font-medium">
          Wallet
        </h2>
        <WalletStatus />
      </Panel>

      <Panel as="section" aria-labelledby="allow-h" className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="allow-h" className="text-20 font-medium">
            Allowlist
          </h2>
          <Button size="sm" onClick={recheck} loading={checking} loadingLabel="Checking" icon={<RefreshCw aria-hidden className="size-4" />}>
            Check on chain now
          </Button>
        </div>
        <p className="text-14 text-muted">
          Fixed list. There is no way to add a contract. Gate X checked these on {FACTS_CHECKED_ON}
          {live ? `; the live check ran just now` : ""}.
        </p>
        <ul className="flex flex-col gap-3">
          {ALLOWLIST.map((e) => {
            const liveCode = live?.codes[e.key];
            const failed = e.gateX.verification === "failed" || (e.role !== "fee-recipient" && e.address && live && liveCode === false);
            return (
              <li key={e.key} className="flex flex-col gap-3 rounded-md border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-16">{e.label}</span>
                  {e.enabled ? <Badge tone="neutral">On</Badge> : <Badge tone="locked">Off</Badge>}
                  {failed ? (
                    <Badge tone="danger">Failed verification</Badge>
                  ) : e.gateX.verification === "passed" ? (
                    <Badge tone="neutral">Gate X: code present</Badge>
                  ) : e.gateX.verification === "not-a-contract" ? (
                    <Badge tone="info">Account, no contract code</Badge>
                  ) : (
                    <Badge tone="missing">Not recorded</Badge>
                  )}
                </div>
                {e.address ? <Address value={e.address} full label={e.label} /> : <p className="text-14 text-muted">No address on record.</p>}
                <p className="text-14 text-muted">{e.note}</p>
                <Statement label={`${e.label} checks`}>
                  <Row label="Gate X" value={e.gateX.detail} />
                  {e.implementation && <Row label="Implementation" value={<span className="num">{shortHex(e.implementation.address, 8, 6)}</span>} />}
                  {e.implementation && <Row label="Implementation source on explorer" value={e.implementation.sourcePublished ? "Published" : "Not published"} />}
                  {live && e.address && <Row label="Live code check" value={liveCode === null || liveCode === undefined ? <Dash label="could not be read" /> : liveCode ? "Code present" : "No code"} />}
                </Statement>
              </li>
            );
          })}
        </ul>
        {live && (
          <Statement label="Live token and pool status">
            <Row label="Chain ID 4663" value={live.chainOk === null ? <Dash /> : live.chainOk ? "Matches" : "Does not match"} />
            <Row label="USDG paused" value={live.paused === null ? <Dash /> : live.paused ? "Paused" : "Not paused"} />
            <Row label="USDG pool address frozen" value={live.poolFrozen === null ? <Dash /> : live.poolFrozen ? "Frozen" : "Not frozen"} />
            <Row label="Pool latest root" value={live.root ? shortHex(live.root, 10, 6) : <Dash />} mono />
          </Statement>
        )}
      </Panel>

      <Panel as="section" aria-labelledby="scr-h" className="flex flex-col gap-4 p-6">
        <h2 id="scr-h" className="text-20 font-medium">
          Screening and region
        </h2>
        <Statement label="Screening and region">
          <Row label="Screening provider" value={config.screeningProvider ?? "Screening provider not configured"} />
          <Row label="Adapter in use" value="Mock (results are simulated)" />
          <Row label="Policy for review results" value="Stop" />
          <Row label="Your region" value={geo.status === "loading" ? "Checking…" : geo.blocked ? (geo.reason === "unknown-region" ? "Could not be confirmed (blocked)" : `${geo.country ?? ""} restricted`) : `${geo.country} allowed`} />
          <Row label="Always blocked" value="United States, plus the owner's restricted list" />
        </Statement>
      </Panel>

      <Panel as="section" aria-labelledby="cfg-h" className="flex flex-col gap-4 p-6">
        <h2 id="cfg-h" className="text-20 font-medium">
          Configuration not set
        </h2>
        <p className="text-14 text-muted">These values belong to the owner. Until they are set, the interface shows them as not configured and keeps the related features off.</p>
        <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
          {missing.map((m) => (
            <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
              <span className="flex flex-wrap items-center gap-2 text-14">
                <span className="num">{m.id}</span>
                <Badge tone="missing">Not set</Badge>
              </span>
              {!m.result.ok && <span className="text-12 text-faint">{m.result.reason}</span>}
              <span className="text-14 text-muted">{m.whenMissing}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel as="section" aria-labelledby="data-h" className="flex flex-col gap-4 p-6">
        <h2 id="data-h" className="text-20 font-medium">
          Mock data in this browser
        </h2>
        <p className="text-14 text-muted">Clears mock balances, notes, activity and drafts. Your Terms answer and export log stay. {brand.name} keeps nothing on a server.</p>
        <div>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Clear mock data
          </Button>
        </div>
        <Dialog
          open={confirmReset}
          onOpenChange={setConfirmReset}
          title="Clear mock data?"
          description="Mock balances go back to 1,000 USDG public and nothing shielded. Mock activity and notes are deleted from this browser. This cannot be undone."
          footer={
            <>
              <Button onClick={() => setConfirmReset(false)}>Keep mock data</Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetMock();
                  setConfirmReset(false);
                  toast({ title: "Mock data cleared", body: "You are back to 1,000 mock USDG.", tone: "info" });
                }}
              >
                Clear mock data
              </Button>
            </>
          }
        />
      </Panel>
    </div>
  );
}
