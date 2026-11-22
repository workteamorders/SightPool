/**
 * ABI fragments, each traced to a source checked at Gate X (docs/GATE-X.md).
 * Nothing here is guessed: if a function is not in a published source or the protocol docs, it is not here.
 */

/** From the USDG implementation source published on Blockscout (0x68184C44…6F8F). Read functions only. */
export const usdgReadAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

/**
 * From TokenAdminFacet (0x58cab81e…E942), source published on Blockscout. USDG routes these selectors to it
 * (checked with getFacet(bytes4) at Gate X). Called through the USDG proxy address.
 */
export const usdgAdminFacetReadAbi = [
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "isFrozen", stateMutability: "view", inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "bool" }] },
] as const;

/**
 * Documented fragments only (docs.rail20.org/contracts.html). The pool implementations have no published source,
 * so no full ABI exists. Only getLastRoot is ever called by this interface. shield and transact are kept as
 * documentation of the shape and are never encoded or sent.
 */
export const rail20PoolDocumentedFragments = [
  { type: "function", name: "getLastRoot", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "shield",
    stateMutability: "payable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "outputCommitments", type: "uint256[2]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "transact",
    stateMutability: "nonpayable",
    inputs: [
      { name: "root", type: "uint256" },
      { name: "nullifiers", type: "uint256[]" },
      { name: "outputCommitments", type: "uint256[2]" },
      { name: "recipient", type: "address" },
      { name: "withdrawAmount", type: "uint256" },
      { name: "proof", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/** The subset the interface may call. */
export const rail20PoolReadAbi = [rail20PoolDocumentedFragments[0]] as const;

/** Selectors computed with viem toFunctionSelector at Gate X. Used by the dependency-free reader on public pages. */
export const SELECTORS = {
  getLastRoot: "0xba70f757",
  balanceOf: "0x70a08231",
  allowance: "0xdd62ed3e",
  decimals: "0x313ce567",
  paused: "0x5c975abb",
  isFrozen: "0xe5839836",
} as const;
