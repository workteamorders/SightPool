"use client";
import { useEffect, useState } from "react";
import { config } from "@config/env";
import { CHAIN_ID_HEX } from "@config/chain";
import { USDG, USDG_POOL } from "@config/allowlist";
import { MODE } from "@/lib/mode";
import { readBlockNumber, readChainId, readHasCode, readPaused } from "@/lib/rpc-client";
import { Dash } from "@/components/ui/statement";
import { cn } from "@/lib/cn";

/** The block number is read again at this interval while the tab is visible. Read-only, one small request. */
const REFRESH_MS = 20_000;

type Live = { loading: boolean; chainOk: boolean | null; block: bigint | null; poolCode: boolean | null; paused: boolean | null };

/**
 * Status strip: what is true right now, in words. Live values come from /api/rpc; any failure shows a dash.
 * Contract balance and pool set size are deliberately not shown here.
 */
export function StatusStrip({ className }: { className?: string }) {
  const [live, setLive] = useState<Live>({ loading: true, chainOk: null, block: null, poolCode: null, paused: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      const [chain, block, code, paused] = await Promise.all([readChainId(), readBlockNumber(), readHasCode(USDG_POOL), readPaused(USDG)]);
      if (alive) setLive({ loading: false, chainOk: chain === null ? null : chain.toLowerCase() === CHAIN_ID_HEX, block, poolCode: code, paused });
    })();
    const refresh = async () => {
      if (document.hidden) return;
      const block = await readBlockNumber();
      if (alive) setLive((l) => (l.loading ? l : { ...l, block }));
    };
    const id = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const items: { k: string; v: React.ReactNode }[] = [
    { k: "Mode", v: MODE.mode === "mock" ? "Mock: no real funds move" : "Read-only" },
    { k: "Mainnet", v: "Gated" },
    { k: "Interface audit", v: config.auditReportUrl ? <a className="link" href={config.auditReportUrl}>Report</a> : "None on record" },
    { k: "Underlying pool audit", v: config.poolAuditReportUrl ? <a className="link" href={config.poolAuditReportUrl}>Report</a> : "None on record" },
    {
      k: "Robinhood Chain",
      v: live.loading ? <span className="skeleton inline-block h-3 w-16 align-middle" aria-label="Loading" /> : live.chainOk && live.block !== null ? <span key={String(live.block)} className="num block-tick">Block {live.block.toLocaleString("en-US")}</span> : <Dash label="not readable right now" />,
    },
    {
      k: "USDG pool contract",
      v: live.loading ? <span className="skeleton inline-block h-3 w-16 align-middle" aria-label="Loading" /> : live.poolCode === null ? <Dash label="not readable right now" /> : live.poolCode ? "Code present" : "No code found",
    },
    {
      k: "USDG token",
      v: live.loading ? <span className="skeleton inline-block h-3 w-16 align-middle" aria-label="Loading" /> : live.paused === null ? <Dash label="not readable right now" /> : live.paused ? "Paused by issuer" : "Not paused",
    },
  ];

  return (
    <section aria-label="Current status" className={cn("border-y border-line bg-surface", className)}>
      <ul className="mx-auto grid max-w-content grid-cols-2 gap-x-6 gap-y-3 px-gutter py-4 md:grid-cols-4 xl:grid-cols-7">
        {items.map((i) => (
          <li key={i.k} className="flex min-w-0 flex-col gap-1">
            <span className="eyebrow">{i.k}</span>
            <span className="text-14 text-text">{i.v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
