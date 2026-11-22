/**
 * Facts the interface states, each with its source and the date it was read.
 * When a fact changes, change it here and in docs/GATE-X.md. Copy must not restate these numbers elsewhere.
 */
export const FACTS_CHECKED_ON = "22 November 2026";
export const FACTS_CHECKED_ON_ISO = "2026-11-22";

export const SOURCES = {
  rail20Contracts: "https://docs.rail20.org/contracts.html",
  rail20Faq: "https://docs.rail20.org/faq.html",
  rail20Relayer: "https://docs.rail20.org/relayer.html",
  rail20Architecture: "https://docs.rail20.org/architecture.html",
  rail20Compliance: "https://github.com/rail20dev/protocol/blob/main/docs/compliance.md",
  paxosUsdg: "https://docs.paxos.com/guides/stablecoin/usdg/mainnet",
} as const;

/** Relayer fee for the USDG pool on Robinhood Chain: flat 0.5 USDG + 0.35%. Raw units at 6 decimals. */
export const USDG_POOL_FEE = {
  fixedRaw: 500_000n,
  bpsNumerator: 35n,
  bpsDenominator: 10_000n,
  label: "documented 22 Nov 2026, verify live",
  owner: "protocol/relayer fee, not an interface fee",
  source: SOURCES.rail20Contracts,
} as const;
