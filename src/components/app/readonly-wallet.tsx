"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectButton, RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http, useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { defineChain } from "viem";
import { ROBINHOOD_CHAIN } from "@config/chain";
import { USDG, USDG_DECIMALS, USDG_POOL } from "@config/allowlist";
import { brand } from "@config/brand";
import { readAllowance, readErc20Balance, readIsFrozen, readLastRoot, readPaused } from "@/lib/rpc-client";
import { formatAmount, shortHex } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Row, Statement, Dash } from "@/components/ui/statement";
import { Notice } from "@/components/ui/notice";
import { StatementSkeleton } from "@/components/ui/states";
import { useApp } from "./app-context";

const chain = defineChain({ ...ROBINHOOD_CHAIN, rpcUrls: { default: { http: ["/api/rpc"] } } });

/**
 * Read-only wallet. Connect only: no signature, no transaction, no message. Reads go through /api/rpc,
 * which only allows read methods against allowlisted contracts.
 */
export function ReadonlyWallet({ compact, projectId }: { compact: boolean; projectId: string }) {
  const [qc] = useState(() => new QueryClient());
  const wagmiConfig = useMemo(
    () => getDefaultConfig({ appName: brand.name, projectId, chains: [chain], transports: { [chain.id]: http("/api/rpc", { batch: false }) }, ssr: false }),
    [projectId],
  );
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "var(--accent)", accentColorForeground: "var(--on-accent)", borderRadius: "small", fontStack: "system" })} modalSize="compact">
          <Inner compact={compact} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

interface Reads {
  balance: bigint | null;
  allowance: bigint | null;
  frozen: boolean | null;
  paused: boolean | null;
  root: string | null;
  poolBalance: bigint | null;
}

function Inner({ compact }: { compact: boolean }) {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();
  const { requireTos, regionAllows } = useApp();
  const [reads, setReads] = useState<Reads | null>(null);
  const wrongChain = isConnected && chainId !== ROBINHOOD_CHAIN.id;

  useEffect(() => {
    if (!address || wrongChain) return;
    let alive = true;
    setReads(null);
    (async () => {
      const [balance, allowance, frozen, paused, root, poolBalance] = await Promise.all([
        readErc20Balance(USDG, address),
        readAllowance(USDG, address, USDG_POOL),
        readIsFrozen(USDG, address),
        readPaused(USDG),
        readLastRoot(USDG_POOL),
        readErc20Balance(USDG, USDG_POOL),
      ]);
      if (alive) setReads({ balance, allowance, frozen, paused, root, poolBalance });
    })();
    return () => {
      alive = false;
    };
  }, [address, wrongChain]);

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => {
        if (!mounted) return <StatementSkeleton rows={1} />;
        if (!isConnected || !address) {
          return (
            <div className="flex flex-col gap-2">
              {!compact && <p className="text-14 text-muted">Connecting only lets this page read your public USDG balance and status. You will not be asked to sign anything.</p>}
              <Button
                variant={compact ? "secondary" : "primary"}
                size="sm"
                disabled={!regionAllows}
                onClick={async () => {
                  if (await requireTos()) openConnectModal();
                }}
              >
                Connect wallet (read-only)
              </Button>
              {!regionAllows && <p className="text-12 text-muted">Not available in view-only mode.</p>}
            </div>
          );
        }
        if (wrongChain) {
          return (
            <div className="flex flex-col gap-2">
              <Notice tone="warning" title="Wrong network">
                Switch to Robinhood Chain (4663) to read your balances.
              </Notice>
              <Button size="sm" loading={switching} onClick={() => switchChain({ chainId: ROBINHOOD_CHAIN.id })}>
                Switch to Robinhood Chain
              </Button>
              {switchError && <p className="text-12 text-danger">The wallet did not switch. Try again from the wallet.</p>}
            </div>
          );
        }
        if (compact) {
          return (
            <div className="flex flex-col gap-1 text-14">
              <span className="eyebrow">Wallet (read-only)</span>
              <span className="num">{shortHex(address)}</span>
              <span className="num text-muted">{reads ? reads.balance === null ? <Dash /> : `${formatAmount(reads.balance, USDG_DECIMALS)} USDG` : "…"}</span>
            </div>
          );
        }
        const v = (x: bigint | null) => (x === null ? <Dash label="could not be read" /> : `${formatAmount(x, USDG_DECIMALS)} USDG`);
        const b = (x: boolean | null, yes: string, no: string) => (x === null ? <Dash label="could not be read" /> : x ? yes : no);
        return (
          <div className="flex flex-col gap-4">
            {reads ? (
              <Statement label="On-chain reads">
                <Row label="Connected address" value={shortHex(address, 8, 6)} mono />
                <Row label="Public USDG balance" value={v(reads.balance)} mono />
                <Row label="Allowance to USDG pool" value={v(reads.allowance)} mono />
                <Row label="Your address frozen by issuer" value={b(reads.frozen, "Frozen", "Not frozen")} />
                <Row label="USDG token" value={b(reads.paused, "Paused", "Not paused")} />
                <Row label="Pool latest root" value={reads.root ? shortHex(reads.root, 10, 6) : <Dash label="could not be read" />} mono />
                <Row label="Pool contract balance" value={v(reads.poolBalance)} mono hint={`Contract balance, not ${brand.name} TVL and not user traction.`} />
              </Statement>
            ) : (
              <StatementSkeleton rows={6} label="Reading on-chain values" />
            )}
            <div>
              <Button size="sm" variant="ghost" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
