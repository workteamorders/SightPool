"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, FileLock2, History, Send, Settings2 } from "lucide-react";
import { brand } from "@config/brand";
import { config } from "@config/env";
import { MODE } from "@/lib/mode";
import { cn } from "@/lib/cn";
import { formatAmount } from "@/lib/format";
import { USDG_DECIMALS } from "@config/allowlist";
import { useApp } from "./app-context";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/field";
import { Dash } from "@/components/ui/statement";
import { WalletStatus } from "./wallet-status";

const NAV = [
  { href: "/app/shield/", label: "Shield", icon: ArrowDownToLine },
  { href: "/app/transfer/", label: "Transfer", icon: Send },
  { href: "/app/unshield/", label: "Unshield", icon: ArrowUpFromLine },
  { href: "/app/activity/", label: "Activity", icon: History },
  { href: "/app/keys/", label: "Disclosure package", icon: FileLock2 },
  { href: "/app/settings/", label: "Settings", icon: Settings2 },
];

export function MockBanner() {
  return (
    <div role="note" className="border-b border-warning-line bg-warning-bg">
      <p className="mx-auto flex max-w-content flex-wrap items-center gap-x-3 gap-y-1 px-gutter py-2 text-14 text-text">
        <span className="font-medium">Mock mode: no real funds are moved.</span>
        <span className="text-muted">
          {MODE.mode === "readonly" ? "Read-only: your wallet is only read, never asked to sign." : "Balances, hashes and notes here are simulated."} Mainnet is gated.
        </span>
      </p>
    </div>
  );
}

function Balances() {
  const { balances } = useApp();
  const fmt = (v: bigint | undefined) => (v === undefined ? <Dash /> : `${formatAmount(v, USDG_DECIMALS)}`);
  return (
    <dl className="grid grid-cols-2 gap-3 text-14">
      <div className="flex flex-col gap-1">
        <dt className="eyebrow">Mock public</dt>
        <dd className="num text-16">{balances ? fmt(balances.publicBalance) : <span className="skeleton inline-block h-4 w-16" aria-label="Loading" />}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="eyebrow">Mock shielded</dt>
        <dd className="num text-16">{balances ? fmt(balances.shieldedBalance) : <span className="skeleton inline-block h-4 w-16" aria-label="Loading" />}</dd>
      </div>
    </dl>
  );
}

function RegionGate({ children }: { children: ReactNode }) {
  const { geo, viewOnlyChosen, chooseViewOnly, recheckGeo } = useApp();
  /* While the check runs, content renders but every action stays disabled (regionAllows is false): no layout jump, still fail-closed. */
  if (geo.status === "loading" || !geo.blocked || viewOnlyChosen) return <>{children}</>;
  const unknown = geo.reason === "unknown-region";
  return (
    <section aria-labelledby="blocked-h" className="flex flex-col gap-6 rounded-md border border-line-strong bg-surface p-6 md:p-8">
      <p className="sightline eyebrow">
        <span>Region check</span>
      </p>
      <h1 id="blocked-h" className="text-32 font-semibold">
        {unknown ? "We could not confirm your region." : "This interface is not available in your region."}
      </h1>
      <div className="flex flex-col gap-3 text-16 text-muted prose-measure">
        <p>
          {unknown
            ? `${brand.name} needs to confirm you are outside the United States and other restricted regions. The check did not answer, so the interface stays closed. This is deliberate: it fails closed.`
            : `${brand.name} is not offered in the United States${geo.country && geo.country !== "US" ? " or in your region" : ""}.`}
        </p>
        <p>You can still look around in view-only mode. Nothing can be submitted, even in mock mode, and no wallet can be connected.</p>
        <p className="text-14">This is a restriction of this interface only. It is not access control on the pool contracts.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={chooseViewOnly}>
          Continue in view-only mode
        </Button>
        {unknown && <Button onClick={recheckGeo}>Check again</Button>}
        <Link href="/legal/disclosures/" className="link inline-flex min-h-touch items-center px-2 text-14">
          Read why
        </Link>
      </div>
    </section>
  );
}

function TosGate() {
  const { tosOpen, setTosOpen, acceptTos } = useApp();
  const [read, setRead] = useState(false);
  const [nonUs, setNonUs] = useState(false);
  return (
    <Dialog
      open={tosOpen}
      onOpenChange={setTosOpen}
      title="Before you continue"
      description={`Terms version ${config.tosVersion}. Pending counsel review.`}
      footer={
        <>
          <Button onClick={() => setTosOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={!read || !nonUs} onClick={acceptTos}>
            Accept and continue
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-14 text-muted">
        <p>Please confirm both statements. Your answer is kept only in this browser.</p>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>This is a preview in mock mode. Nothing real moves.</li>
          <li>The underlying pool has no formal audit and relies on its relayer.</li>
          <li>Mainnet is gated until an audit and a legal opinion exist.</li>
        </ul>
        <Checkbox
          checked={read}
          onChange={(e) => setRead(e.target.checked)}
          label={
            <>
              I have read the{" "}
              <Link href="/legal/terms/" target="_blank" className="link">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/legal/disclosures/" target="_blank" className="link">
                Disclosures
              </Link>
              .
            </>
          }
        />
        <Checkbox checked={nonUs} onChange={(e) => setNonUs(e.target.checked)} label="I am not a resident of, and not located in, the United States or another restricted region." />
      </div>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "";
  const { geo, viewOnlyChosen } = useApp();
  const viewOnly = geo.status === "done" && geo.blocked && viewOnlyChosen;
  return (
    <>
      <MockBanner />
      {viewOnly && (
        <div className="border-b border-line bg-surface">
          <p className="mx-auto max-w-content px-gutter py-2 text-14 text-muted">View-only: your region is restricted or could not be confirmed. Actions are disabled.</p>
        </div>
      )}
      <div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-gutter pt-8 lg:grid-cols-[var(--w-sidebar)_minmax(0,1fr)] lg:gap-12">
        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--header-h)+var(--sp-8))] lg:self-start">
          <nav aria-label="App" className="-mx-gutter overflow-x-auto px-gutter lg:mx-0 lg:px-0">
            <ul className="flex gap-1 lg:flex-col">
              {NAV.map((n) => {
                const active = path.startsWith(n.href.replace(/\/$/, ""));
                const Icon = n.icon;
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-touch items-center gap-3 whitespace-nowrap rounded-md border px-3 text-14 transition-colors duration-[var(--dur-micro)]",
                        active ? "border-line-control bg-surface-2 text-text" : "border-transparent text-muted hover:bg-surface hover:text-text",
                      )}
                    >
                      <Icon aria-hidden className={cn("size-4", active && "text-accent-text")} />
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden flex-col gap-4 rounded-md border border-line bg-surface p-4 lg:flex">
            <Balances />
            <WalletStatus compact />
          </div>
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 lg:hidden">
            <Balances />
          </div>
          <RegionGate>{children}</RegionGate>
          <Notice tone="locked" title="Keys and scope">
            This interface never asks for a seed phrase, private key or signature, in any mode. The protocol&apos;s relayer derives account keys from a wallet signature, so real transactions stay off until there is a way to
            avoid handing that to a third party.{" "}
            <Link href="/app/settings/" className="link">
              See what must happen first
            </Link>
            .
          </Notice>
        </div>
      </div>
      <TosGate />
    </>
  );
}
