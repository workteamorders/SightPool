import { FlaskConical } from "lucide-react";
import { Row, Statement } from "@/components/ui/statement";
import { formatAmount, formatDate, shortHex } from "@/lib/format";
import { USDG_DECIMALS } from "@config/allowlist";
import type { ActivityItem } from "@/lib/pool/types";

const VERB: Record<ActivityItem["kind"], string> = { shield: "Shield", transfer: "Transfer", unshield: "Unshield" };

/** Receipt for a completed mock action. Always labelled mock. Proof after the action: hash, commitment, time. */
export function Receipt({ item, screeningRef, sample }: { item: Pick<ActivityItem, "kind" | "amount" | "fee" | "hash" | "commitment" | "counterparty" | "createdAt">; screeningRef?: string | null; sample?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="sightline eyebrow flex-1" data-tone="accent">
          <span>
            {VERB[item.kind]} receipt{sample ? " · sample" : ""}
          </span>
        </p>
        <span className="inline-flex items-center gap-1 text-12 text-warning">
          <FlaskConical aria-hidden className="size-3" />
          Mock
        </span>
      </div>
      <div className="px-4 py-4">
        <Statement label={`${VERB[item.kind]} receipt`}>
          <Row label="Amount" value={`${formatAmount(item.amount, USDG_DECIMALS)} USDG`} mono emphasis />
          <Row label={item.kind === "shield" ? "Relayer fee" : "Protocol/relayer fee"} value={item.kind === "shield" ? "None documented" : `${formatAmount(item.fee, USDG_DECIMALS)} USDG`} mono />
          {item.kind === "shield" && <Row label="Screening" value={screeningRef ? <span className="num">Clear · {screeningRef}</span> : "Clear (mock)"} />}
          {item.counterparty && <Row label={item.kind === "unshield" ? "Paid out to" : "Recipient"} value={shortHex(item.counterparty, 18, 6)} mono />}
          <Row label="Public hash" value={shortHex(item.hash, 12, 6)} mono />
          {item.commitment && <Row label="Commitment" value={shortHex(item.commitment, 12, 6)} mono />}
          <Row label="Time" value={formatDate(item.createdAt)} mono />
        </Statement>
      </div>
      <p className="border-t border-line px-4 py-3 text-12 text-muted">Mock mode: no real funds are moved. Hashes and commitments here are not on any chain.</p>
    </div>
  );
}
