"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { USDG_DECIMALS } from "@config/allowlist";
import type { ActivityItem, MockNote } from "@/lib/pool/types";
import { formatAmount, formatDate, shortHex } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/table";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { EmptyState, ErrorState, StatementSkeleton } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { BarChart } from "@/components/ui/chart";
import { Dialog } from "@/components/ui/dialog";
import { Receipt } from "../receipt";
import { useApp } from "../app-context";

const PAGE = 20;
const VERB = { shield: "Shield", transfer: "Transfer", unshield: "Unshield" } as const;

export function ActivityView() {
  const { client, version } = useApp();
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [notes, setNotes] = useState<MockNote[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<"all" | ActivityItem["kind"]>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "amount">("new");
  const [shown, setShown] = useState(PAGE);
  const [tab, setTab] = useState<"activity" | "notes">("activity");
  const [detail, setDetail] = useState<ActivityItem | null>(null);

  const load = async () => {
    setFailed(false);
    try {
      const [a, n] = await Promise.all([client.activity(), client.listNotes()]);
      setItems(a);
      setNotes(n);
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const needle = q.trim().toLowerCase();
    const xs = items.filter((i) => (kind === "all" || i.kind === kind) && (!needle || i.hash.toLowerCase().includes(needle) || (i.commitment ?? "").toLowerCase().includes(needle)));
    return [...xs].sort((a, b) => (sort === "new" ? b.createdAt - a.createdAt : sort === "old" ? a.createdAt - b.createdAt : Number(b.amount - a.amount)));
  }, [items, kind, q, sort]);

  const days = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const next = d.getTime() + 86_400_000;
      out.push({ label: d.toISOString().slice(5, 10), value: (items ?? []).filter((x) => x.createdAt >= d.getTime() && x.createdAt < next).length });
    }
    return out;
  }, [items]);

  const columns: Column<ActivityItem>[] = [
    { key: "date", header: "Date", cell: (r) => <span className="num text-muted">{formatDate(r.createdAt)}</span> },
    { key: "kind", header: "Action", cell: (r) => <span className="inline-flex items-center gap-2">{VERB[r.kind]} <Badge tone="mock">Mock</Badge></span> },
    { key: "amount", header: "Amount (USDG)", numeric: true, cell: (r) => formatAmount(r.amount, USDG_DECIMALS) },
    { key: "fee", header: "Fee (USDG)", numeric: true, cell: (r) => (r.fee ? formatAmount(r.fee, USDG_DECIMALS) : "–") },
    { key: "hash", header: "Public hash", cell: (r) => <span className="num">{shortHex(r.hash, 10, 4)}</span> },
  ];

  const noteCols: Column<MockNote>[] = [
    { key: "date", header: "Created", cell: (r) => <span className="num text-muted">{formatDate(r.createdAt)}</span> },
    { key: "c", header: "Commitment", cell: (r) => <span className="num">{shortHex(r.commitment, 12, 4)}</span> },
    { key: "a", header: "Amount (USDG)", numeric: true, cell: (r) => formatAmount(r.amount, USDG_DECIMALS) },
    { key: "s", header: "State", cell: (r) => (r.spent ? <Badge tone="locked">Spent</Badge> : <Badge tone="neutral">Unspent</Badge>) },
  ];

  const header = (
    <div className="flex flex-col gap-2">
      <h1 className="text-32 font-semibold">Activity</h1>
      <p className="text-16 text-muted prose-measure">Everything you did in mock mode, in this browser only. Hashes and commitments are simulated and are not on any chain.</p>
    </div>
  );

  if (failed)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState title="Activity could not be read" what="Mock data in this browser could not be loaded." funds="No real funds are involved. Mock data may be lost if storage is blocked." next="Try again, or clear mock data in Settings." onRetry={load} />
      </div>
    );
  if (!items || !notes)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <StatementSkeleton rows={5} label="Loading activity" />
      </div>
    );
  if (items.length === 0)
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState title="No activity yet" action={<Link href="/app/shield/" className={buttonClass("primary", "md")}>Shield mock USDG</Link>}>
          Your mock shields, transfers and unshields show up here, ready to go into a disclosure package.
        </EmptyState>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Action">
            {({ id }) => (
              <Select id={id} value={kind} onChange={(e) => (setKind(e.target.value as typeof kind), setShown(PAGE))}>
                <option value="all">All actions</option>
                <option value="shield">Shield</option>
                <option value="transfer">Transfer</option>
                <option value="unshield">Unshield</option>
              </Select>
            )}
          </Field>
          <Field label="Sort">
            {({ id }) => (
              <Select id={id} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="new">Newest first</option>
                <option value="old">Oldest first</option>
                <option value="amount">Largest amount</option>
              </Select>
            )}
          </Field>
          <Field label="Search hash or commitment">
            {({ id }) => <Input id={id} type="search" mono placeholder="mock-0x…" value={q} onChange={(e) => (setQ(e.target.value), setShown(PAGE))} />}
          </Field>
        </div>
        <BarChart title={`${items.length} mock action${items.length === 1 ? "" : "s"} in total`} unit="actions" data={days} />
      </div>
      <Tabs
        label="Activity views"
        value={tab}
        onChange={setTab}
        items={[
          {
            value: "activity",
            label: `Actions (${filtered.length})`,
            panel:
              filtered.length === 0 ? (
                <EmptyState title="Nothing matches" action={<Button size="sm" onClick={() => (setKind("all"), setQ(""))}>Clear filters</Button>}>
                  No mock activity matches these filters.
                </EmptyState>
              ) : (
                <div className="flex flex-col gap-4">
                  <DataTable caption="Mock activity" rows={filtered.slice(0, shown)} columns={columns} rowKey={(r) => r.id} onRowActivate={setDetail} />
                  <p className="text-14 text-muted">
                    Showing {Math.min(shown, filtered.length)} of {filtered.length}.
                  </p>
                  {shown < filtered.length && (
                    <div>
                      <Button size="sm" onClick={() => setShown((s) => s + PAGE)}>
                        Show {Math.min(PAGE, filtered.length - shown)} more
                      </Button>
                    </div>
                  )}
                </div>
              ),
          },
          {
            value: "notes",
            label: `Mock notes (${notes.length})`,
            panel: notes.length ? <DataTable caption="Mock notes" rows={notes} columns={noteCols} rowKey={(r) => r.id} /> : <EmptyState title="No notes">Shield to create a mock note.</EmptyState>,
          },
        ]}
      />
      <Dialog open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)} title="Activity detail" description="Mock record. Not on any chain.">
        {detail && <Receipt item={detail} />}
      </Dialog>
    </div>
  );
}
