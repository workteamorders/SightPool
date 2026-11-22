# Gate X: verification record

Checked on 22 November 2026, between 14:18 and 14:22 UTC (22:18–22:22 Asia/Makassar).
All reads were read-only. Nothing was signed, nothing was broadcast, and no call was made to `api.rail20.org`.

## a. Documentation re-read

| Source | How it was read | Result |
|---|---|---|
| https://docs.rail20.org/contracts.html | web fetch | Addresses for chain 4663 match the brief and the facts list. Fees: USDG pool 0.5 USDG flat, ETH pool 0.00015 ETH flat, 0.35% on all pools. Functions: `shield(uint256,uint256[2])` payable, `transact(uint256,uint256[],uint256[2],address,uint256,bytes)`, `getLastRoot()` (named in an example only). No full ABI. No statement on audit, pause, upgradeability of pools, or view keys. RPC URL not listed. |
| https://docs.rail20.org/faq.html | web fetch | States "No formal audit yet" and "Funds are at your own risk until audit completes." Claims no entity can freeze user funds or seize notes. Says front-ends may be geo-blocked. Nothing on deposit screening, relayer trust, proof location, view keys, upgradeability or pause. |
| https://docs.rail20.org/relayer.html | web fetch | The relayer "derives the account keys, builds the zero-knowledge proof, pays the gas, and broadcasts it." `/api/withdraw` body: `signature`, `chain`, `pool`, `amount`, `recipient` (optional `recipients`, max 2). No terms, rate limits or SDK status. |
| https://docs.rail20.org/architecture.html | web fetch | Notes are encrypted under a key derived from the owner's wallet signature (AES-256-GCM on-chain). Nullifier formula uses a value derived from `privKey`. No separate view-only key. No mention of upgradeability, pause or admin roles. |
| rail20dev/protocol `docs/compliance.md` | raw.githubusercontent.com (one request) | Now readable (it was rate-limited during the first research pass). It describes "view keys" and "Private Proofs of Innocence" as concepts ("Each user holds view keys…", "No master key exists…") **with no mechanism, key format or API**. It says the official front-end "can screen addresses against sanctions lists". |
| rail20dev/protocol `docs/integration.md` | raw.githubusercontent.com (one request) | SDK still "coming soon". Proof generation: "Relayer-side from the user's signature… Self-hosting the relayer keeps proving fully in your control." CLI `@rail20/cli` is listed as live on npm (not inspected). Contact: an X account. |

### Differences from the facts list in the prompt

1. **The pools are upgradeable proxies.** The prompt says upgradeability is "not described". On-chain, both pools are ERC-1967 proxies (see b). The docs still say nothing about it.
2. `compliance.md` is now read: it **claims** view keys exist, but describes no mechanism. Fact 4 ("treat as no view key until proven") stands. The disclosure-package wording stays.
3. The fee recipient address as printed in the docs and brief (`0xd962c7a67b74EEe8…`) is **not a valid EIP-55 checksum**. The checksummed form is `0xd962c7a67B74EEe8D418189f7917A18577A4775d`. On chain 4663 it has no code (an EOA). It is display-only.
4. The FAQ freeze and geoblock lines talk about "the contracts on Base". The relayer page says keys are derived "in the browser" in one place and by the relayer from the signature in another. Both readings still mean the signature is the key material.
5. Robinhood Chain itself has a public testnet (chain 46630, per Robinhood's connection docs). **RAIL20 documents no pool deployment on it**, so the testnet option stays hidden. Nothing was invented for it.

## b. On-chain (public RPC `https://rpc.mainnet.chain.robinhood.com`, read-only)

Reads ran from a browser page at block 120,687,373 (0x7318b0d) and were re-checked at block 120,688,091.

| Check | Result |
|---|---|
| `eth_chainId` | `0x1237` = **4663** ✔ |
| `eth_getCode` USDG pool `0x04F8…53F0` | 708 bytes ✔ (ERC-1967 proxy) |
| `eth_getCode` ETH pool `0xBf6a…d163` | 708 bytes ✔ (ERC-1967 proxy) |
| `eth_getCode` USDG `0x5fc5…d168` | 170 bytes ✔ (ERC-1967 proxy) |
| `eth_getCode` fee recipient `0xd962…775d` | empty: an EOA. It is not a contract the interface calls, so it stays as display-only and is marked "account, no contract code". |
| USDG `name()` / `symbol()` / `decimals()` | "Global Dollar" / "USDG" / **6** |
| USDG implementation (EIP-1967 slot) | `0x68184C449E1a8f34fA18d289737129FD27B66f8F`, source published on Blockscout as `USDG` (Paxos token, UUPS: `upgradeTo`, `proxiableUUID`). |
| USDG pause/freeze ABI | Not in the implementation ABI directly. The implementation routes selectors to facets (`getFacet(bytes4)`). `paused()` and `isFrozen(address)` route to `0x58cab81e3d8468A0e90df8cBfacb34535e1DE942`, published on Blockscout as `TokenAdminFacet`, which declares `paused() view returns (bool)` and `isFrozen(address) view returns (bool)`. Only these two fragments are stored. Live values: `paused()` = false; `isFrozen(USDG pool)` = false. |
| Pool implementations | USDG pool → `0x09669189090Bd1c46301Ed2D01A8C5e8C319f7Ce`; ETH pool → `0x09f5a9a2FE3e1ebD1595bd5e991f7f17B4cE69B0`. **Neither implementation has published source on Blockscout.** The EIP-1967 admin slot is empty for both, which suggests upgrade logic lives in the (unpublished) implementation (UUPS style). Who can upgrade is unknown. |
| Pool `getLastRoot()` (selector `0xba70f757`) | Returns a 32-byte value on both pools (USDG pool `0x04d2eb0f…5325`). ✔ |
| Pool ABI | No full ABI from docs or explorer. Stored: documented fragments `shield`, `transact`, `getLastRoot` only. Only `getLastRoot` is ever called. |
| USDG `balanceOf(USDG pool)` | 1.711936 USDG at block 120,687,373. Shown in the app only as "contract balance, not Sightpool TVL and not user traction". |

Decision rule applied: every allowlisted contract address has code on chain 4663, so none is removed. The fee recipient is not a contract. It stays display-only and is labelled as an account.

## c. Chain config for viem

- viem 2.58.4 ships `robinhood` (id 4663, "Robinhood Chain", ETH, Blockscout). Its default RPC list also contains a third-party endpoint (`rpc.ordofi.network`). The app defines its own chain object with only the official public RPC `https://rpc.mainnet.chain.robinhood.com` (the official public endpoint per Robinhood's connection docs and several provider guides, which also call it rate-limited and not for production). The browser never talks to it directly: all reads go through `/api/rpc`.
- Native symbol: ETH, 18 decimals. Explorer: `https://robinhoodchain.blockscout.com`.
- Version compatibility: RainbowKit 2.2.11 (latest) has peer `wagmi ^2.9.0`. wagmi 3.x is out, but RainbowKit does not support it yet. Locked: `wagmi 2.19.5`, `viem 2.58.4`, `@rainbow-me/rainbowkit 2.2.11`, `@tanstack/react-query 5.108.2`, `next 16.4.6`.

## d. View key / disclosure

Evidence: `compliance.md` and `integration.md` name view keys and Proofs of Innocence as features. The architecture page derives the note-encryption key from the same wallet signature used for spending, and describes no separate view-only key. No API, format or tool exists to produce a view-only key.
Result: treated as **no view key**. The `/app/keys` page is a "Disclosure package" with the banner "This protocol build does not offer a view-only key. This package is a user-assembled record, not a cryptographic view key."
