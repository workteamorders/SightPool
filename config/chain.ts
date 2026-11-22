import { EXPLORER_URL } from "./env";

/**
 * Robinhood Chain (Arbitrum Orbit), checked at Gate X on 22 Nov 2026.
 * No multicall3 entry on purpose: /api/rpc only lets eth_call reach allowlisted contracts.
 * Only the official public RPC is listed. The browser never calls it directly: reads go through /api/rpc.
 */
export const ROBINHOOD_CHAIN = {
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: EXPLORER_URL } },
} as const;

export const CHAIN_ID = ROBINHOOD_CHAIN.id;
export const CHAIN_ID_HEX = "0x1237";
export const OFFICIAL_PUBLIC_RPC = ROBINHOOD_CHAIN.rpcUrls.default.http[0];

export const addressUrl = (a: string) => `${EXPLORER_URL}/address/${a}`;
export const txUrl = (h: string) => `${EXPLORER_URL}/tx/${h}`;
