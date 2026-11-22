# What a real integration would need

This build has **no** write path. This file records what must exist before one is written. It is reference only: nothing here is implemented, and nothing here should be read as a plan with dates.

## 1. Proof path (the blocking problem)

As of 22 Nov 2026 the protocol builds proofs **in its hosted relayer**, from a wallet signature that derives the user's account keys:

- `POST https://api.rail20.org/api/withdraw` with body `{ signature, chain, pool, amount, recipient }` (optional `recipients`, max 2).
- The relayer "derives the account keys, builds the zero-knowledge proof, pays the gas, and broadcasts it."
- Notes are encrypted under a key derived from the same signature. The nullifier uses a value derived from it.

Sending that signature to a third party hands over key material for the shielded account. Options, in order of preference:

1. **Client-side prover** from the protocol (not offered; the SDK is "coming soon").
2. **Self-hosted relayer** (the docs mention it; no code or image is published).
3. **Do not integrate.**

Any option also needs the protocol's written permission for a third-party front-end to use its API, its rate limits and terms, and a clear statement of what the relayer logs.

## 2. Contracts

- Both pools are ERC-1967 proxies. Implementation source is **not published**. Who can upgrade is unknown. Before integrating: published, matching source; known upgrade authority (multisig or timelock); a monitoring alert on the implementation slot.
- A full ABI from published source, replacing the documented fragments in `config/abis.ts`.
- Shield requires an ERC-20 `approve` of USDG to the pool. The approve amount should be exact, not unlimited.
- The real shielded address format (`SHIELDED_ADDRESS_FORMAT`) and how a recipient obtains one.
- Whether the relayer fee is deducted from the amount or added on top (the mock deducts it).

## 3. Gates that must all be true

| Gate | Where it shows |
|---|---|
| Audit of this interface with a public report (`AUDIT_REPORT_URL`) | Settings, status strip |
| Audit of the underlying pool with a public report (`POOL_AUDIT_REPORT_URL`) | Settings, status strip |
| Written legal opinion on operating a front-end for a privacy pool, covering blocked regions (`LEGAL_OPINION_CLEARED=true`) | Settings |
| A real screening provider with a written review policy (`SCREENING_PROVIDER`) | Settings |
| Counsel-written Terms and Privacy | /legal/* |
| Final restricted-region list (`RESTRICTED_REGION_LIST`) | /api/geo |
| A way to prove without sending key material to a third party | Section 1 |

## 4. Code shape when the time comes

- Add a second `PoolClient` implementation behind the gates above. `MockPoolClient` stays for tests.
- Writes go through the user's wallet only (wagmi `writeContract` for `approve` and `shield`). The relay at `/api/rpc` stays read-only.
- Remove the "write path not present" condition in Settings only when the code exists **and** every other gate is met.
- Update `pnpm nowrite:check` to allow exactly the new, reviewed call sites, and nothing else.
- Re-run Gate X (docs, chain ID, code, implementation slots, ABIs) on the day of release.

## 5. Questions to send to RAIL20 (through the owner)

1. May a third-party front-end call the hosted relayer API? Under what terms and rate limits?
2. Is a client-side prover or SDK planned, and in what form?
3. Do view-only keys exist as a mechanism? What format, and how are they produced?
4. Who controls upgrades of the pool proxies, and will the implementation source be published?
5. What does the relayer log, and for how long?
