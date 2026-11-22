import { config } from "./env";
import { addressUrl } from "./chain";

/**
 * The only contracts this interface knows. There is no "custom contract" field anywhere in the UI.
 * Addresses are EIP-55 checksummed (tests/allowlist.test.cjs checks them with viem).
 * Gate X (docs/GATE-X.md) checked chain ID 4663 and non-empty code for every contract on 22 Nov 2026.
 */

export type Role = "pool" | "token" | "fee-recipient" | "note";
export type Verification = "passed" | "failed" | "not-a-contract" | "not-recorded";

export interface AllowlistEntry {
  key: "usdgPool" | "usdg" | "feeRecipient" | "ethPool" | "oxbow";
  label: string;
  role: Role;
  /** Null when no address is on record. */
  address: `0x${string}` | null;
  enabled: boolean;
  /** Why it is off, or what it is used for. */
  note: string;
  gateX: { verification: Verification; detail: string };
  /** For proxies: the implementation found in the EIP-1967 slot at Gate X. */
  implementation?: { address: `0x${string}`; sourcePublished: boolean; name: string | null };
}

export const USDG_POOL = "0x04F8d8E4C3f23fE2BfB80c6C46b7d7dfE6f853F0" as const;
export const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;
export const ETH_POOL = "0xBf6a26CEF8f6251B46Cc09D03A0f12Df5972d163" as const;
/** Docs print this with an invalid checksum (0xd962c7a67b74…). This is the EIP-55 form. */
export const FEE_RECIPIENT = "0xd962c7a67B74EEe8D418189f7917A18577A4775d" as const;
/** USDG routes paused() and isFrozen(address) to this facet. Source published on Blockscout as TokenAdminFacet. */
export const USDG_TOKEN_ADMIN_FACET = "0x58cab81e3d8468A0e90df8cBfacb34535e1DE942" as const;

export const USDG_DECIMALS = 6;

export const ALLOWLIST: readonly AllowlistEntry[] = [
  {
    key: "usdgPool",
    label: "RAIL20 USDG pool",
    role: "pool",
    address: USDG_POOL,
    enabled: true,
    note: "The only pool this interface targets.",
    gateX: { verification: "passed", detail: "Chain 4663, code present (ERC-1967 proxy). getLastRoot() answers." },
    implementation: { address: "0x09669189090Bd1c46301Ed2D01A8C5e8C319f7Ce", sourcePublished: false, name: null },
  },
  {
    key: "usdg",
    label: "USDG (Global Dollar, Paxos)",
    role: "token",
    address: USDG,
    enabled: true,
    note: "Token held in the pool. 6 decimals, read on chain.",
    gateX: { verification: "passed", detail: "Chain 4663, code present (ERC-1967 proxy). name, symbol and decimals read." },
    implementation: { address: "0x68184C449E1a8f34fA18d289737129FD27B66f8F", sourcePublished: true, name: "USDG" },
  },
  {
    key: "feeRecipient",
    label: "Protocol fee recipient",
    role: "fee-recipient",
    address: FEE_RECIPIENT,
    enabled: true,
    note: "Display only. Documented by the protocol as its fee address. The interface never sends to it.",
    gateX: { verification: "not-a-contract", detail: "No contract code on chain 4663: it is an account." },
  },
  {
    key: "ethPool",
    label: "RAIL20 ETH pool",
    role: "pool",
    address: ETH_POOL,
    enabled: config.enableEthPool,
    note: "Off by default (ENABLE_ETH_POOL). Cannot be switched on from the interface.",
    gateX: { verification: "passed", detail: "Chain 4663, code present (ERC-1967 proxy). getLastRoot() answers." },
    implementation: { address: "0x09f5a9a2FE3e1ebD1595bd5e991f7f17B4cE69B0", sourcePublished: false, name: null },
  },
  {
    key: "oxbow",
    label: "0xbow Entrypoint (observed note)",
    role: "note",
    address: null,
    enabled: false,
    note: "Out of scope. Off (ENABLE_OXBOW). Address not recorded: the brief that held it was not available.",
    gateX: { verification: "not-recorded", detail: "No address on record, so nothing was checked." },
  },
];

export const activeContracts = () =>
  ALLOWLIST.filter((e) => e.enabled && e.address && e.gateX.verification === "passed").map((e) => e.address as `0x${string}`);

/** Every address /api/rpc may read from: allowlisted contracts plus the USDG admin facet. */
export const READABLE_ADDRESSES: readonly string[] = [USDG_POOL, USDG, ETH_POOL, USDG_TOKEN_ADMIN_FACET, FEE_RECIPIENT].map((a) => a.toLowerCase());

export { addressUrl };
