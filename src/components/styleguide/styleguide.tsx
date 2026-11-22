"use client";
import { useState, type ReactNode } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, FileInput } from "@/components/ui/field";
import { Panel, LinkCard } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Steps } from "@/components/ui/steps";
import { Row, Statement, Dash } from "@/components/ui/statement";
import { EmptyState, ErrorState, Skeleton, StatementSkeleton } from "@/components/ui/states";
import { Tooltip, InfoTip } from "@/components/ui/tooltip";
import { BarChart } from "@/components/ui/chart";
import { Address } from "@/components/ui/address";
import { SightLine } from "@/components/ui/sightline";
import { Paper, PaperBand, Stamp } from "@/components/ui/paper";
import { Receipt } from "@/components/app/receipt";
import type { ButtonVariant } from "@/components/ui/button-styles";

const COLORS: { name: string; v: string; role: string; on?: string }[] = [
  { name: "--bg", v: "#0f1110", role: "Base surface" },
  { name: "--surface", v: "#151816", role: "Raised panels" },
  { name: "--surface-2", v: "#1b1f1d", role: "Headers, active rows, dialogs" },
  { name: "--surface-3", v: "#232825", role: "Hover, tooltips" },
  { name: "--line", v: "#2c322f", role: "Decorative rules" },
  { name: "--line-control", v: "#6b746f", role: "Control borders (3:1)" },
  { name: "--text", v: "#edefec", role: "Primary text" },
  { name: "--text-muted", v: "#a8b0ab", role: "Secondary text" },
  { name: "--text-faint", v: "#8a938e", role: "Placeholders, footnotes" },
  { name: "--accent", v: "#00c805", role: "Main action, current place", on: "--on-accent" },
  { name: "--success", v: "#9ccdb1", role: "Success text" },
  { name: "--warning", v: "#e8c072", role: "Warning, mock" },
  { name: "--danger", v: "#f2907a", role: "Danger text" },
  { name: "--info", v: "#9dbde6", role: "Information" },
  { name: "--focus", v: "#f4e7a1", role: "Focus ring" },
  { name: "--paper", v: "#ebe7dc", role: "Document sheet" },
  { name: "--paper-2", v: "#e0dbce", role: "Sheet band, emphasised item" },
  { name: "--ink", v: "#161815", role: "Text on paper" },
  { name: "--ink-muted", v: "#474c46", role: "Secondary text on paper" },
  { name: "--stamp", v: "#9b3a1f", role: "Stamp: mock or sample, never approval" },
];

const TYPE = [
  { cls: "text-60", px: "60", use: "Hero (clamped)" },
  { cls: "text-44", px: "44", use: "Page title (clamped)" },
  { cls: "text-32", px: "32", use: "Section title (clamped)" },
  { cls: "text-24", px: "24", use: "Result heading" },
  { cls: "text-20", px: "20", use: "Panel title, lead" },
  { cls: "text-16", px: "16", use: "Body" },
  { cls: "text-14", px: "14", use: "Labels, rows" },
  { cls: "text-12", px: "12", use: "Eyebrows, footnotes" },
];

const SPACE = [
  ["1", "4", "w-1"],
  ["2", "8", "w-2"],
  ["3", "12", "w-3"],
  ["4", "16", "w-4"],
  ["6", "24", "w-6"],
  ["8", "32", "w-8"],
  ["12", "48", "w-12"],
  ["16", "64", "w-16"],
  ["24", "96", "w-24"],
] as const;

function Section({ id, title, children, note }: { id: string; title: string; children: ReactNode; note?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex flex-col gap-6 border-t border-line pt-12">
      <div className="flex flex-col gap-2">
        <h2 id={`${id}-h`} className="text-24 font-semibold">
          {title}
        </h2>
        {note && <p className="text-14 text-muted prose-measure">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>;
}

export function Styleguide() {
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false);
  const [danger, setDanger] = useState(false);
  const [sw, setSw] = useState(true);
  const [radio, setRadio] = useState<"a" | "b">("a");
  const [slider, setSlider] = useState(40);
  const [tab, setTab] = useState<"one" | "two" | "three">("one");
  const [ta, setTa] = useState("Shielded 200 USDG on 22 Nov for treasury.");
  const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
  const tones: Tone[] = ["neutral", "info", "success", "warning", "danger", "mock", "locked", "missing"];

  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-gutter pb-12 pt-12">
      <header className="flex flex-col gap-4">
        <SightLine as="div">Internal</SightLine>
        <h1 className="text-44 font-semibold">Styleguide</h1>
        <p className="text-20 text-muted prose-measure">
          Every token and every component with its states, on one page. Idea: &quot;Statement&quot;. Calm warm-dark neutrals, one accent for the main action, 1px rules, small radius, tabular figures. Dark only: the brief sets a neutral
          dark system and people read balances in low light.
        </p>
        <nav aria-label="Styleguide sections" className="flex flex-wrap gap-x-4 text-14">
          {["colors", "type", "space", "shape", "motif", "paper", "buttons", "forms", "cards", "badges", "overlays", "data", "status", "product"].map((s) => (
            <a key={s} href={`#${s}`} className="link inline-flex min-h-touch items-center capitalize text-muted">
              {s}
            </a>
          ))}
        </nav>
      </header>

      <Section id="colors" title="Color tokens" note="Named by role. Contrast is checked by scripts/contrast-check.mjs (AA: 4.5:1 text, 3:1 large text and control borders). Status color is never the only signal.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <li key={c.name} className="flex items-center gap-3 rounded-md border border-line bg-surface p-3">
              <span aria-hidden className="size-12 flex-none rounded-sm border border-line-strong" style={{ background: `var(${c.name})` }} />
              <span className="flex min-w-0 flex-col">
                <span className="num text-14">{c.name}</span>
                <span className="num text-12 text-muted">{c.v}</span>
                <span className="text-12 text-muted">{c.role}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-accent px-4 py-2 text-14 font-medium text-on-accent">Accent with on-accent</span>
          <span className="text-14 text-accent-text">Accent as text</span>
          <span className="text-14 text-muted">Open decision: accent is the brief&apos;s green. A non-green alt set ships behind html[data-accent=&quot;alt&quot;].</span>
        </div>
      </Section>

      <Section id="type" title="Typography" note="Geist Sans (one family, self-hosted) for everything; Geist Mono only for figures, addresses, hashes and commitments. Scale ratio about 1.25. Large sizes use clamp().">
        <ul className="flex flex-col gap-4">
          {TYPE.map((t) => (
            <li key={t.cls} className="grid items-baseline gap-2 border-b border-line pb-4 md:grid-cols-[8rem_1fr]">
              <span className="num text-12 text-muted">
                {t.px}px · {t.use}
              </span>
              <span className={`${t.cls} font-semibold`}>Shield, transfer, unshield.</span>
            </li>
          ))}
          <li className="grid items-baseline gap-2 md:grid-cols-[8rem_1fr]">
            <span className="num text-12 text-muted">Mono · tabular</span>
            <span className="num text-20">1,000.00 · 0.850000 · 0x04F8…53F0</span>
          </li>
          <li className="grid items-baseline gap-2 md:grid-cols-[8rem_1fr]">
            <span className="num text-12 text-muted">Eyebrow</span>
            <span className="eyebrow">Allowlist and fees</span>
          </li>
        </ul>
      </Section>

      <Section id="space" title="Space and layout" note="Multiples of 4 only. Three rhythm levels: tight 8, mid 24, loose 96. Content max 1160px; gutter 16 / 24 / 32.">
        <ul className="flex flex-col gap-2">
          {SPACE.map(([k, px, w]) => (
            <li key={k} className="flex items-center gap-4">
              <span className="num w-16 text-12 text-muted">
                {k} · {px}px
              </span>
              <span className={`h-3 bg-accent ${w}`} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shape" title="Shape and elevation" note="Radius 4 (small) and 8 (medium). Rules are 1px. Three elevations: flat, raised (surface + rule), floating (surface-2 + strong rule + shadow, for dialogs and toasts only).">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex h-24 items-end rounded-md bg-bg p-4 text-14 text-muted outline outline-1 outline-line">Flat</div>
          <div className="flex h-24 items-end rounded-md border border-line bg-surface p-4 text-14 text-muted">Raised</div>
          <div className="flex h-24 items-end rounded-md border border-line-strong bg-surface-2 p-4 text-14 text-muted shadow-floating">Floating</div>
        </div>
      </Section>

      <Section id="motif" title="Signature motif: the sight line" note="A 1px rule that starts with a small open square. Used sparingly: section labels, receipts, result headings, the logo and the 404 page. Statement rows (label, dotted leader, value) are the reading pattern.">
        <SightLine>Section label</SightLine>
        <SightLine tone="accent">Done (mock)</SightLine>
        <Panel className="max-w-form p-4">
          <Statement label="Example statement">
            <Row label="Amount" value="200.00 USDG" mono emphasis />
            <Row label="Relayer fee" value="None documented" />
            <Row label="Unavailable value" value={<Dash />} />
          </Statement>
        </Panel>
      </Section>

      <Section id="paper" title="Paper: the document layer" note="Receipts, disclosures, legal text and fee schedules are sheets of paper on the dark room. Inside a sheet, every component reads in ink because .paper re-points the text, rule and focus tokens. A stamp says mock, sample or draft. It never says approved. No shadow, no texture: the sheet separates by lightness alone.">
        <Paper fold className="max-w-form overflow-hidden">
          <PaperBand fileRef="File mock-4f1a9c2e" className="pr-8">
            <Stamp>Sample · mock</Stamp>
          </PaperBand>
          <div className="flex flex-col gap-4 p-4">
            <SightLine>Section label on paper</SightLine>
            <Statement label="Example statement on paper">
              <Row label="Amount" value="200.00 USDG" mono emphasis />
              <Row label="Relayer fee" value="None documented" />
              <Row label="Unavailable value" value={<Dash />} />
            </Statement>
            <p className="text-14 text-muted">
              Body text in <span className="text-text">ink</span>, with a <a className="link" href="#paper">link</a> and a <span className="text-faint">footnote tone</span>.
            </p>
          </div>
          <p className="paper-tear px-4 py-3 text-12 text-muted">Footnote below a tear line.</p>
        </Paper>
        <Paper className="flex max-w-form flex-wrap items-center gap-4 p-4">
          <Stamp>Mock</Stamp>
          <Stamp>Sample</Stamp>
          <Stamp>Draft</Stamp>
          <p className="text-12 text-muted">Stamps only exist on paper: rust on the dark room would fail contrast.</p>
        </Paper>
      </Section>

      <Section id="buttons" title="Buttons" note="One primary per view. Press feedback moves 1px and scales 99% in 100ms. Loading keeps the width. Hover, focus and pressed are shown statically here; they are live everywhere else.">
        <div className="overflow-x-auto">
          <table className="w-full text-14">
            <thead>
              <tr className="text-left text-12 text-muted">
                <th className="py-2 pr-4 font-medium">Variant</th>
                {["Default", "Hover", "Focus", "Pressed", "Disabled", "Loading"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v} className="border-t border-line">
                  <td className="py-3 pr-4 capitalize text-muted">{v}</td>
                  <td className="py-3 pr-4">
                    <Button variant={v}>Shield</Button>
                  </td>
                  <td className="py-3 pr-4">
                    <Button variant={v} forceState="hover">
                      Shield
                    </Button>
                  </td>
                  <td className="py-3 pr-4">
                    <Button variant={v} forceState="focus">
                      Shield
                    </Button>
                  </td>
                  <td className="py-3 pr-4">
                    <Button variant={v} forceState="pressed">
                      Shield
                    </Button>
                  </td>
                  <td className="py-3 pr-4">
                    <Button variant={v} disabled>
                      Shield
                    </Button>
                  </td>
                  <td className="py-3 pr-4">
                    <Button variant={v} loading>
                      Shield
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg" icon={<ArrowRight aria-hidden className="size-4" />}>
            Large with icon
          </Button>
          <IconButton label="Add" icon={<Plus className="size-4" />} />
          <IconButton label="Delete" variant="secondary" icon={<Trash2 className="size-4" />} />
          <IconButton label="Delete (disabled)" disabled icon={<Trash2 className="size-4" />} />
        </div>
      </Section>

      <Section id="forms" title="Form controls" note="Labels always visible. Helper text under the field. Errors are specific, appear on blur, and never clear what was typed.">
        <div className="grid gap-8 md:grid-cols-2">
          <Field label="Amount" hint="Mock public balance: 1,000.00 USDG">
            {({ id, describedBy }) => <Input id={id} mono suffix="USDG" placeholder="0.00" aria-describedby={describedBy} />}
          </Field>
          <Field label="Amount (focus, shown statically)" hint="Focus ring uses --focus.">
            {({ id }) => <Input id={id} mono suffix="USDG" defaultValue="25.00" className="border-focus outline-2 outline-focus" />}
          </Field>
          <Field label="Amount (error)" error="USDG has 6 decimal places. Use at most 6 digits after the point.">
            {({ id, describedBy, invalid }) => <Input id={id} mono suffix="USDG" defaultValue="1.1234567" invalid={invalid} aria-describedby={describedBy} />}
          </Field>
          <Field label="Recipient (success)" success="Format looks right for the mock.">
            {({ id, describedBy }) => <Input id={id} mono defaultValue="mock-shielded:7f3a…" aria-describedby={describedBy} />}
          </Field>
          <Field label="Pool (read-only)" hint="Fixed by the allowlist.">
            {({ id }) => <Input id={id} mono readOnly value="0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0" />}
          </Field>
          <Field label="Amount (disabled)" hint="View-only mode.">
            {({ id }) => <Input id={id} mono disabled placeholder="0.00" />}
          </Field>
          <Field label="Note for your advisor" optional counter={{ value: ta.length, max: 120 }} hint="Kept only in your file.">
            {({ id, describedBy }) => <Textarea id={id} value={ta} onChange={(e) => setTa(e.target.value)} aria-describedby={describedBy} />}
          </Field>
          <Field label="Sort">
            {({ id }) => (
              <Select id={id} defaultValue="new">
                <option value="new">Newest first</option>
                <option value="old">Oldest first</option>
              </Select>
            )}
          </Field>
          <div className="flex flex-col gap-2">
            <Checkbox label="I checked the address" defaultChecked />
            <Checkbox label="Unchecked" />
            <Checkbox label="Disabled" disabled hint="Explains why it is off." />
          </div>
          <RadioGroup
            legend="Format"
            name="sg-radio"
            value={radio}
            onChange={setRadio}
            options={[
              { value: "a", label: "CSV", hint: "Spreadsheet" },
              { value: "b", label: "JSON", hint: "Tools" },
            ]}
          />
          <div className="flex flex-col gap-4">
            <Switch label="Encrypt with a password" checked={sw} onChange={setSw} hint="On and off carry a word, not just position." />
            <Switch label="Mainnet transactions" checked={false} disabled lockedReason="Locked" hint="Locked switch." />
          </div>
          <div className="flex flex-col gap-4">
            <Slider label="Example slider" min={0} max={100} step={4} value={slider} onChange={setSlider} format={(v) => `${v}%`} />
            <FileInput label="Upload a file" hint="Encrypted package (.json)" accept=".json" onFile={() => {}} />
          </div>
        </div>
      </Section>

      <Section id="cards" title="Panels and cards" note="Static panels and one-target link cards. The whole card is the link.">
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="p-6">
            <p className="text-16 font-medium">Static panel</p>
            <p className="text-14 text-muted">Surface plus a 1px rule.</p>
          </Panel>
          <LinkCard href="/legal/disclosures/" title="Interactive card">
            Hover lifts the surface one step. Focus draws the ring around the whole card.
          </LinkCard>
          <LinkCard href="/app/shield/" title="Another card" className="bg-surface-2 border-line-control">
            Shown in its hover state.
          </LinkCard>
        </div>
      </Section>

      <Section id="badges" title="Badges and notices" note="Short, with an icon and a word. Never claims what the system has not checked.">
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Badge key={t} tone={t}>
              {t}
            </Badge>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Notice tone="info" title="Info">Explains something neutral.</Notice>
          <Notice tone="success" title="Success">Something completed.</Notice>
          <Notice tone="warning" title="Warning">Something to know before acting.</Notice>
          <Notice tone="danger" title="Danger">Something went wrong or is risky.</Notice>
          <Notice tone="mock" title="Mock">Simulated data.</Notice>
          <Notice tone="locked" title="Locked">Not available in this build.</Notice>
        </div>
      </Section>

      <Section id="overlays" title="Dialogs, toasts, tooltips" note="Dialogs trap focus, close on Esc, return focus, and become bottom sheets on small screens. Toasts auto-dismiss after 5s, pause on hover, and are announced.">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="danger" onClick={() => setDanger(true)}>
            Open destructive confirm
          </Button>
          <Button onClick={() => toast({ title: "Shield complete (mock)", body: "200.00 USDG. No real funds moved.", tone: "success" })}>Show success toast</Button>
          <Button onClick={() => toast({ title: "Copied", body: "Check it against the explorer.", tone: "info" })}>Show info toast</Button>
          <Tooltip content="Documented 22 Nov 2026, verify live.">
            <Button variant="ghost">Hover or focus for tooltip</Button>
          </Tooltip>
          <InfoTip label="What is a commitment?" content="A public value that stands for a private note. The same explanation is in the FAQ." />
        </div>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title="Activity detail"
          description="Mock record."
          footer={
            <>
              <Button onClick={() => setDialog(false)}>Close</Button>
              <Button variant="primary" onClick={() => setDialog(false)}>
                Done
              </Button>
            </>
          }
        >
          <Statement label="Detail">
            <Row label="Amount" value="200.00 USDG" mono />
            <Row label="Public hash" value="mock-0x4f1a…7c4e" mono />
          </Statement>
        </Dialog>
        <Dialog
          open={danger}
          onOpenChange={setDanger}
          title="Clear mock data?"
          description="This cannot be undone."
          footer={
            <>
              <Button onClick={() => setDanger(false)}>Keep mock data</Button>
              <Button variant="danger" onClick={() => setDanger(false)}>
                Clear mock data
              </Button>
            </>
          }
        />
      </Section>

      <Section id="data" title="Tables, tabs, steps, chart" note="Tables have sticky headers and right-aligned figures, and become cards under 768px. Chart titles state the conclusion and repeat the data as text.">
        <Tabs
          label="Example tabs"
          value={tab}
          onChange={setTab}
          items={[
            {
              value: "one",
              label: "Table",
              panel: (
                <DataTable
                  caption="Sample rows"
                  rowKey={(r) => r.h}
                  onRowActivate={() => toast({ title: "Row activated", tone: "info" })}
                  columns={[
                    { key: "d", header: "Date", cell: (r) => <span className="num text-muted">{r.d}</span> },
                    { key: "k", header: "Action", cell: (r) => r.k },
                    { key: "a", header: "Amount (USDG)", numeric: true, cell: (r) => r.a },
                    { key: "h", header: "Public hash", cell: (r) => <span className="num">{r.h}</span> },
                  ]}
                  rows={[
                    { d: "2026-11-22 09:30", k: "Shield", a: "200.00", h: "mock-0x4f1a…7c4e" },
                    { d: "2026-11-22 09:41", k: "Transfer", a: "50.00", h: "mock-0x9b20…11ad" },
                    { d: "2026-11-22 09:55", k: "Unshield", a: "100.00", h: "mock-0x03ce…8f02" },
                  ]}
                />
              ),
            },
            { value: "two", label: "Steps", panel: <div className="flex flex-col gap-4"><Steps steps={["Details", "Review", "Result"]} current={0} /><Steps steps={["Details", "Review", "Result"]} current={1} /><Steps steps={["Details", "Review", "Result"]} current={2} /></div> },
            {
              value: "three",
              label: "Chart",
              panel: (
                <div className="max-w-form">
                  <BarChart
                    sample
                    title="Most mock actions happened on Friday"
                    unit="actions"
                    data={[
                      { label: "Mon", value: 1 },
                      { label: "Tue", value: 0 },
                      { label: "Wed", value: 2 },
                      { label: "Thu", value: 1 },
                      { label: "Fri", value: 4 },
                      { label: "Sat", value: 0 },
                      { label: "Sun", value: 1 },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section id="status" title="Loading, empty, error" note="Skeletons are shaped like the content. Empty states give one sentence and one action. Errors say what happened, whether funds or data moved, and what to do.">
        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="flex flex-col gap-4 p-6">
            <Label>Loading</Label>
            <Skeleton className="h-6 w-24" />
            <StatementSkeleton rows={4} />
          </Panel>
          <EmptyState title="No activity yet" action={<Button variant="primary">Shield mock USDG</Button>}>
            Your mock shields, transfers and unshields show up here.
          </EmptyState>
          <ErrorState className="md:col-span-2" title="Relayer did not respond" what="The simulated relayer failed to submit the transaction." funds="Nothing moved. Your mock notes are unchanged." next="Try again later. This interface does not operate a relayer." onRetry={() => {}} />
        </div>
      </Section>

      <Section id="product" title="Product pieces" note="Receipt and address, as used in the flows.">
        <div className="grid gap-6 md:grid-cols-2">
          <Receipt sample item={{ kind: "transfer", amount: 50_000_000n, fee: 675_000n, hash: "mock-0x9b20c4e7a1d35f8e2b6c0a9d4f7e1b3c5a8d2e6f0b9c4a7e1d3f5b8c2a6e11ad", commitment: "mock-c-1c9e7b2a4d6f8e0b3a5c7d9e1f2b4a6c", counterparty: "mock-shielded:7f3a9c1e5b2d8f4a6c0e3b7d9f1a5c2e8b4d6f0a", createdAt: Date.UTC(2026, 10, 22, 9, 41) }} />
          <Panel className="flex flex-col gap-3 p-6">
            <Label>Address</Label>
            <Address value="0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0" label="USDG pool" />
            <Address value="0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0" full label="USDG pool" />
          </Panel>
        </div>
      </Section>
    </div>
  );
}
