import { Paper, PaperBand, Stamp } from "@/components/ui/paper";
import { Row, Statement } from "@/components/ui/statement";
import { formatAmount, formatDate, shortHex } from "@/lib/format";
import { USDG_DECIMALS } from "@config/allowlist";
import type { ActivityItem } from "@/lib/pool/types";

const VERB: Record<ActivityItem["kind"], string> = { shield: "Shield", transfer: "Transfer", unshield: "Unshield" };

/** A short file reference for the sheet, taken from the hash. Only for mock hashes (they carry the mock- prefix);
 *  a hash without that prefix gets no reference rather than one that looks official. */
function fileRef(hash: string): string | null {
  if (!hash.startsWith("mock-")) return null;
  const body = hash.slice("mock-".length).replace(/^0x/, "");
  return `File mock-${body.slice(0, 8)}`;
}

/** Receipt for a completed mock action, set as a sheet of paper. Always stamped mock. Proof after the action:
 *  hash, commitment, time. */
export function Receipt({ item, screeningRef, sample }: { item: Pick<ActivityItem, "kind" | "amount" | "fee" | "hash" | "commitment" | "counterparty" | "createdAt">; screeningRef?: string | null; sample?: boolean }) {
  return (
    <Paper fold className="overflow-hidden">
      <PaperBand fileRef={fileRef(item.hash)} className="pr-8">
        <Stamp>{sample ? "Sample · mock" : "Mock"}</Stamp>
      </PaperBand>
      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="text-20 font-medium">
          {VERB[item.kind]} receipt{sample ? " · sample" : ""}
        </p>
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
      <p className="paper-tear px-4 py-3 text-12 text-muted">Mock mode: no real funds are moved. Hashes and commitments here are not on any chain.</p>
    </Paper>
  );
}
