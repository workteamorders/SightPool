import { EyeOff, Globe, Layers } from "lucide-react";
import Link from "next/link";
import { brand } from "@config/brand";
import { FACTS_CHECKED_ON, USDG_POOL_FEE } from "@config/facts";

/**
 * Three standing facts, then one line of disclaimer. Each is true in this build: the region and Terms gates exist,
 * there is no view-only key (see the disclosures), and the fee comes from the protocol's documentation, dated.
 */
export function Principles() {
  const items = [
    { icon: Globe, head: "Region + Terms gate", body: "Access is restricted by region and by the Terms of Service." },
    { icon: EyeOff, head: "No view-only key", body: `${brand.name} does not provide a view-only key.` },
    { icon: Layers, head: USDG_POOL_FEE.label, body: `Fee information is documented on ${FACTS_CHECKED_ON}. Verify live.` },
  ];
  return (
    <div className="flex flex-col gap-6 border-y border-line-strong py-6">
      <ul className="grid gap-6 md:grid-cols-3 md:gap-0">
        {items.map((i, n) => (
          <li key={i.head} className={n > 0 ? "flex items-start gap-4 md:border-l md:border-line-strong md:pl-8" : "flex items-start gap-4 md:pr-8"}>
            <i.icon aria-hidden className="mt-1 size-8 flex-none text-text" strokeWidth={1.25} />
            <div className="flex flex-col gap-1">
              <h2 className="font-mono text-14 font-medium uppercase tracking-[0.1em] text-text">{i.head}</h2>
              <p className="text-14 text-muted">{i.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4 text-14">
        <Link href="/legal/disclosures/" className="link inline-flex min-h-touch items-center">
          Disclosures
        </Link>
        <p className="min-w-0 flex-1 basis-64 text-muted">
          <strong className="font-medium text-text">Independent interface.</strong> Not affiliated with Robinhood, Paxos or RAIL20.
        </p>
        <p className="inline-flex items-center gap-2 font-mono text-12 uppercase tracking-[0.1em] text-text">
          <span aria-hidden className="size-3 bg-accent" />
          Interface preview · Mock
        </p>
      </div>
    </div>
  );
}
