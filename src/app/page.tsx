import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@config/brand";
import { ALLOWLIST, USDG_DECIMALS } from "@config/allowlist";
import { FACTS_CHECKED_ON, SOURCES, USDG_POOL_FEE } from "@config/facts";
import { config } from "@config/env";
import { buttonClass } from "@/components/ui/button-styles";
import { Badge } from "@/components/ui/badge";
import { Address } from "@/components/ui/address";
import { Paper, PaperBand, Stamp } from "@/components/ui/paper";
import { AMBIENCE } from "@config/ambience";
import { SightLine } from "@/components/ui/sightline";
import { Row, Statement } from "@/components/ui/statement";
import { StatusStrip } from "@/components/site/status-strip";
import { ArchiveFolder, BinderEdge } from "@/components/site/archive-folder";
import { Principles } from "@/components/site/principles";
import { Ambience } from "@/components/site/ambience";
import { ChalkBoard } from "@/components/site/chalk-board";
import { HeroMotion } from "@/components/site/hero-motion";
import { Receipt } from "@/components/app/receipt";
import { DISCLOSURES } from "@/content/disclosures";
import { formatAmount } from "@/lib/format";

const SUBHEAD = `Shield, transfer, and unshield USDG through allowlisted contracts on Robinhood Chain. Prepare a disclosure package for your auditor or tax advisor. Screen deposits. Mainnet stays off until an audit and a legal opinion. ${brand.name} does not take custody, and it is not a mixer for stock tokens.`;

const STEPS = [
  {
    n: "01",
    title: "Screen",
    body: "Each deposit is checked by a screening adapter before it can go ahead. Deny stops it. Review stops it too, by default.",
    cost: "No fee",
    final: "Nothing moves yet",
  },
  {
    n: "02",
    title: "Shield",
    body: "USDG moves from your wallet into the allowlisted pool contract and becomes a private note. The deposit itself is public on chain.",
    cost: "Network gas only. No relayer fee documented.",
    final: "Final once confirmed",
  },
  {
    n: "03",
    title: "Transfer",
    body: "Send part of a note to another shielded address. The protocol's relayer builds the proof and sees the amount and recipient.",
    cost: "Protocol/relayer fee",
    final: "Final once confirmed",
  },
  {
    n: "04",
    title: "Unshield",
    body: "Withdraw to a public address you choose. Check it twice: a wrong address cannot be corrected.",
    cost: "Protocol/relayer fee",
    final: "Final once confirmed",
  },
  {
    n: "05",
    title: "Disclosure package",
    body: "Prepare a record of your own activity for an auditor or tax advisor. A cryptographic view key is offered only if the underlying protocol provides one.",
    cost: "No fee",
    final: "Stays on your device until you share it",
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is ${brand.name}?`,
    a: `An interface for the RAIL20 USDG pool on Robinhood Chain that puts disclosure first: every fee, risk and limit is stated before you act. This is a preview. Every action runs in mock mode and moves nothing.`,
  },
  {
    q: "Who is it for?",
    a: "People outside the United States and other restricted regions who hold USDG and want a clear flow they can explain to an auditor or tax advisor.",
  },
  {
    q: "Is this a mixer?",
    a: "No. It is an interface to one allowlisted pool. It adds no mixing features, screens deposits, has no stock-token path, and helps you disclose your own activity.",
  },
  {
    q: "Does it hide who I am?",
    a: "Not fully, and it does not promise to. Deposits are public, the protocol's relayer sees amounts and recipients, and patterns can link activity. See the disclosures.",
  },
  {
    q: "What is a disclosure package?",
    a: "A file you assemble from your own activity: dates, public hashes, amounts and commitments, as CSV or JSON, optionally password-encrypted. It is a record, not a cryptographic view key. A view key is offered only if the underlying protocol provides one, and today it does not.",
  },
  {
    q: "Why is mainnet off?",
    a: "Real transactions need an audit of this interface, an audit of the underlying pool, a written legal opinion and a real screening provider. None exist yet. There is also no way today to send transactions without handing key material to the protocol's relayer.",
  },
  {
    q: "What does it cost?",
    a: `The protocol's relayer charges ${formatAmount(USDG_POOL_FEE.fixedRaw, USDG_DECIMALS, { min: 1 })} USDG plus 0.35% on transfers and unshields (${USDG_POOL_FEE.label}). ${brand.name} charges ${config.interfaceFeeBps === 0 ? "nothing" : `${config.interfaceFeeBps} basis points`}.`,
  },
  {
    q: "Can USDG be frozen?",
    a: "Yes. The issuer can pause the token and freeze addresses. That applies to USDG in the pool as well.",
  },
];

export default function Home() {
  return (
    <>
      {/* 1. What it is, for whom, proof, one action */}
      <div className="hero-stage relative" data-stage>
        <HeroMotion />
        <Ambience />
        <BinderEdge />
        <section className="relative z-10 mx-auto grid max-w-content items-start gap-12 px-gutter pb-12 pt-12 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-20">
          <div className="flex flex-col gap-6">
            <SightLine className="font-mono">
              {brand.name} archive / interface preview
              {AMBIENCE.caret && <span aria-hidden className="amb-caret" />}
            </SightLine>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="mock">Interface preview</Badge>
              <Badge tone="locked">Mainnet gated</Badge>
            </div>
            <div>
              <h1 className="text-44 font-bold lg:text-60">A compliance-first interface for the USDG privacy pool on Robinhood Chain.</h1>
              <svg aria-hidden focusable="false" viewBox="0 0 352 14" preserveAspectRatio="none" className="hand-underline">
                <path d="M2 9C60 3 130 11 200 6s120-2 150 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="prose-measure font-mono text-14 text-muted md:text-16">{SUBHEAD}</p>
            <p className="prose-measure border-l-2 border-accent pl-4 font-mono text-12 text-muted md:text-14">
              For USDG holders outside the United States who need to show their own activity to an auditor or tax advisor. Interface preview: every action runs in mock mode.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/app/shield/" className={buttonClass("primary", "lg")}>
                Open the preview
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link href="/legal/disclosures/" className="link inline-flex min-h-touch items-center text-16">
                Read the disclosures first
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <ArchiveFolder>
              <Receipt
                sample
                archive
                item={{
                  kind: "shield",
                  amount: 200_000_000n,
                  fee: 0n,
                  hash: "mock-0x4f1a9c2e7b30d58e6a1f0c9b2d47e8a35c6b1f90e2d4a7c8b5e3f1029a6d7c4e",
                  commitment: "mock-c-9e2b7c41d0a63f58e1b2c7d94a0f6e3b",
                  counterparty: null,
                  createdAt: Date.UTC(2026, 10, 22, 9, 30),
                }}
                screeningRef="mock-scr-3fa81c0e"
              />
            </ArchiveFolder>
            <p className="px-4 font-mono text-12 text-faint">
              <span className="num">Fig. 1</span> · Sample receipt from the mock flow. Not a real transaction.
            </p>
            <ChalkBoard />
          </div>
        </section>
        <div className="relative z-10 mx-auto max-w-content px-gutter pb-16 lg:pb-24">
          <Principles />
        </div>
      </div>

      <StatusStrip />

      {/* 2. How it works */}
      <section id="how" aria-labelledby="how-h" className="mx-auto max-w-content px-gutter pt-24">
        <SightLine as="div">How it works</SightLine>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 id="how-h" className="text-32 font-semibold">
              Five steps. Each one says what it costs and what it cannot undo.
            </h2>
            <p className="text-16 text-muted prose-measure">The flow is the same in mock mode and in any future real build. Only the mock lets you force failures to see how each one is explained.</p>
          </div>
          <ol className="path flex flex-col">
            {STEPS.map((s) => (
              <li key={s.n} className="grid gap-3 py-6 md:grid-cols-[3rem_1fr_14rem] md:gap-6">
                <span className="num text-14 text-faint">{s.n}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-20 font-medium">{s.title}</h3>
                  <p className="text-16 text-muted">{s.body}</p>
                </div>
                <dl className="flex flex-col gap-1 text-14 md:text-right">
                  <dt className="sr-only">Cost</dt>
                  <dd className="text-text">{s.cost}</dd>
                  <dt className="sr-only">Reversibility</dt>
                  <dd className="text-muted">{s.final}</dd>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. Disclosures */}
      <section id="disclosures" aria-labelledby="disc-h" className="mx-auto max-w-content px-gutter pt-24">
        <SightLine as="div">Disclosures</SightLine>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 id="disc-h" className="text-32 font-semibold">
              Read this before you touch anything.
            </h2>
            <p className="text-16 text-muted prose-measure">Checked on {FACTS_CHECKED_ON} against the protocol&apos;s documentation and the chain itself. Sources are linked. Facts change: verify them again.</p>
            <Link href="/legal/disclosures/" className="link inline-flex min-h-touch items-center text-16">
              Full disclosures and risks
            </Link>
          </div>
          <Paper fold className="overflow-hidden">
            <PaperBand fileRef={`Disclosures · checked ${FACTS_CHECKED_ON}`} className="pr-8">
              <Stamp>Draft</Stamp>
            </PaperBand>
            <div className="grid gap-px bg-line md:grid-cols-2">
              {DISCLOSURES.slice(0, 5).map((d, i) => (
                <article key={d.id} className={i === 0 ? "flex flex-col gap-2 bg-paper-2 p-6 md:col-span-2" : "flex flex-col gap-2 bg-paper p-6"}>
                  <p className="num text-12 text-faint">Item {String(i + 1).padStart(2, "0")}</p>
                  <h3 className={i === 0 ? "text-20 font-medium" : "text-16 font-medium"}>{d.title}</h3>
                  <p className="text-14 text-muted">{d.body}</p>
                  {d.sources && (
                    <p className="mt-auto flex flex-wrap gap-x-4 pt-2 text-12">
                      {d.sources.map((s) => (
                        <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-touch items-center text-muted">
                          {s.label} (source)
                        </a>
                      ))}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Paper>
        </div>
      </section>

      {/* 4. Contracts and fees */}
      <section id="contracts" aria-labelledby="ctr-h" className="mx-auto max-w-content px-gutter pt-24">
        <SightLine as="div">Allowlist and fees</SightLine>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 id="ctr-h" className="text-32 font-semibold">
              Only these contracts. No custom addresses.
            </h2>
            <p className="text-16 text-muted prose-measure">
              Each address was checked on chain 4663 on {FACTS_CHECKED_ON}. There is no field anywhere to add another contract. External links are context, not endorsement.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
              {ALLOWLIST.filter((e) => e.address).map((e) => (
                <li key={e.key} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-16">
                      {e.label}
                      {e.enabled ? <Badge tone="neutral">{e.role === "fee-recipient" ? "Display only" : "Active"}</Badge> : <Badge tone="locked">Off</Badge>}
                    </span>
                    <span className="text-14 text-muted">{e.note}</span>
                  </div>
                  {e.address && <Address value={e.address} label={e.label} />}
                </li>
              ))}
            </ul>
            <Paper className="p-6">
              <p className="mb-4 text-16 font-medium">USDG pool fees</p>
              <Statement label="Fees">
                <Row label="Protocol/relayer flat fee" value={`${formatAmount(USDG_POOL_FEE.fixedRaw, USDG_DECIMALS, { min: 1 })} USDG`} mono />
                <Row label="Protocol/relayer percentage" value="0.35%" mono />
                <Row label={`${brand.name} fee`} value={`${config.interfaceFeeBps / 100}%`} mono />
                <Row label="Applies to" value="Transfer, unshield" />
              </Statement>
              <p className="mt-4 text-12 text-faint">
                {USDG_POOL_FEE.label}. Source:{" "}
                <a className="link" href={SOURCES.rail20Contracts} target="_blank" rel="noopener noreferrer">
                  RAIL20 contracts page
                </a>
                . The fee is the protocol&apos;s, not {brand.name}&apos;s.
              </p>
            </Paper>
          </div>
        </div>
      </section>

      {/* 5. FAQ and start */}
      <section id="faq" aria-labelledby="faq-h" className="mx-auto max-w-content px-gutter pt-24">
        <SightLine as="div">Questions</SightLine>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 id="faq-h" className="text-32 font-semibold">
              Plain answers.
            </h2>
            <p className="text-16 text-muted">Then try the mock flow. Nothing you do there moves real funds.</p>
            <div>
              <Link href="/app/shield/" className={buttonClass("secondary", "md")}>
                Try the mock shield flow
              </Link>
            </div>
          </div>
          <div className="flex flex-col border-t border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 py-4 text-16 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="num text-muted transition-transform duration-[var(--dur-element)] group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-6 text-16 text-muted prose-measure">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
