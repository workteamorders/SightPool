"use client";
import dynamic from "next/dynamic";
import { FlaskConical } from "lucide-react";
import { MODE } from "@/lib/mode";
import { config } from "@config/env";
import { MOCK_WALLET } from "@/lib/pool/mock";
import { shortHex } from "@/lib/format";
import { Notice } from "@/components/ui/notice";
import { StatementSkeleton } from "@/components/ui/states";

/* Wallet libraries load only in read-only mode, and only when a WalletConnect project ID is configured. */
const ReadonlyWallet = dynamic(() => import("./readonly-wallet").then((m) => m.ReadonlyWallet), {
  ssr: false,
  loading: () => <StatementSkeleton rows={2} label="Loading wallet" />,
});

export function WalletStatus({ compact = false }: { compact?: boolean }) {
  if (MODE.mode === "mock") {
    return (
      <div className="flex flex-col gap-1 text-14">
        <span className="eyebrow">Wallet</span>
        <span className="inline-flex items-center gap-2">
          <FlaskConical aria-hidden className="size-4 text-warning" />
          <span>
            Mock wallet <span className="num text-muted">{shortHex(MOCK_WALLET, 6, 4)}</span>
          </span>
        </span>
        {!compact && <span className="text-12 text-muted">Not a real wallet. Read-only wallet connection is available in read-only mode.</span>}
      </div>
    );
  }
  if (!config.walletConnectProjectId) {
    return compact ? (
      <div className="flex flex-col gap-1 text-14">
        <span className="eyebrow">Wallet</span>
        <span className="text-muted">Wallet connect not configured</span>
      </div>
    ) : (
      <Notice tone="locked" title="Wallet connect not configured">
        Read-only mode needs a WalletConnect project ID from the owner (WALLETCONNECT_PROJECT_ID). Until then no wallet can be connected.
      </Notice>
    );
  }
  return <ReadonlyWallet compact={compact} projectId={config.walletConnectProjectId} />;
}
