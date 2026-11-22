# Sightpool (working name)

A compliance-first interface for the RAIL20 USDG privacy pool on Robinhood Chain (chain 4663).

**Status: interface preview.** Landing page, dApp in **mock mode**, region and Terms gates, allowlist, and **read-only** on-chain reads. No real transaction can be sent: this build contains no write or signing code at all.

| Flag | Value | Meaning |
|---|---|---|
| `NEXT_PUBLIC_AUDIT_CLEARED` | `false` | No audit on record (interface or pool). |
| `NEXT_PUBLIC_LEGAL_OPINION_CLEARED` | `false` | No written legal opinion on record. |

Even with both set to `true`, mainnet stays impossible: there is no write adapter. See `docs/INTEGRATION-FUTURE.md`.

## Quick start

```bash
pnpm install
pnpm build                 # static export to out/
node e2e/serve.cjs         # local preview on :4173, emulates /api/geo and /api/rpc
# FAKE_COUNTRY=ID UPSTREAM=public node e2e/serve.cjs   → allowed region, official public RPC
```

`pnpm dev` works for UI work. Without the Pages Functions the region check fails closed, so actions stay disabled. That is expected.

## Checks

| Command | What it proves |
|---|---|
| `pnpm typecheck` | Strict TypeScript, no `any`. |
| `pnpm test` | 47 unit tests: resolveMode, previewFee, amount parsing, mock pool (all outcomes), screening, disclosure encryption round trip, geo fail-closed, RPC relay, allowlist checksums. |
| `pnpm e2e` | 14 Playwright tests on the static build: flows, every forced outcome, geoblock (US, missing header, restricted list), Terms gate, keyboard and focus return, 360px overflow, no client mode override. Set `CHROME_PATH` if Playwright's browser is not installed. |
| `pnpm brand:check` | The product name appears only in `config/brand.ts`. |
| `pnpm copy:check` | No forbidden claims ("untraceable", "anonymous", "safe", "audited"…), denials allowed. |
| `pnpm nowrite:check` | Zero `writeContract`, `sendTransaction`, `signMessage`, `signTypedData`, `personal_sign`, `eth_sendRawTransaction`, `api.rail20.org`, `@rail20` in `src/` and `functions/`; exactly one `PoolClient` implementation (mock). |
| `pnpm contrast:check` | 140 WCAG pairs from the token file (dark room and paper), for both accent options. |
| `pnpm links:check` | Every internal link in `out/` resolves; banned routes (`/token`, `/airdrop`, `/stake`, `/stocks`, `/shield-nvda`) do not exist. Run after build. |
| `pnpm placeholders:list` | Lists unconfigured placeholders (`--write` updates the table below). |

## Deploy (Cloudflare Pages, free tier)

1. Create a Pages project from this folder. Build command `pnpm build`, output directory `out`.
2. `functions/api/geo.ts` and `functions/api/rpc.ts` deploy as Pages Functions automatically.
3. Set server variables in Pages → Settings → Environment variables: `RPC_UPSTREAM_URL` (or `ALLOW_PUBLIC_UPSTREAM=1`), `RESTRICTED_REGION_LIST`, optionally `ALLOWED_ORIGINS`, `RATE_LIMIT_PER_MINUTE`. A Rate Limiting binding named `RATE_LIMITER` is used if present.
4. Set public variables (see `.env.example`) as build variables.
5. `public/_headers` sets CSP, `nosniff`, `Referrer-Policy`, frame and cache headers.

## Layout

```
config/       brand.ts (only place for the name), env.ts (typed placeholders), allowlist.ts, chain.ts, abis.ts, facts.ts
functions/    Cloudflare Pages Functions: /api/geo, /api/rpc
src/server/   geo.ts, rpc.ts (handlers shared by functions and tests)
src/lib/      mode, fee, format, storage, screening, disclosure, rpc-client, pool/{types,mock,flow}
src/styles/   tokens.css (every visual value)
src/components/ui, site, app, styleguide
src/app/      /, /app/{shield,transfer,unshield,activity,keys,settings}, /legal/{terms,privacy,disclosures}, /styleguide, 404
docs/         GATE-X.md (verification evidence), DECISIONS.md, INTEGRATION-FUTURE.md, BRIEF.md
tests/        node:test unit tests     e2e/   Playwright + preview server
```

## Placeholders not configured

<!-- placeholders:start -->
| Placeholder | Set with | Scope | What it is | While missing |
|---|---|---|---|---|
| `WALLETCONNECT_PROJECT_ID` | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | public | Free WalletConnect (Reown) project ID, registered by the owner. | Read-only mode shows "Wallet connect not configured". |
| `SITE_URL` | `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL (domain not registered yet). | Canonical and Open Graph URLs are relative. Sitemap uses a placeholder origin. |
| `TOS_VERSION` | `NEXT_PUBLIC_TOS_VERSION` | public | Version string for the Terms acceptance gate (e.g. 2026-11-22-draft). | Uses "draft-0". Terms are marked pending counsel review. |
| `AUDIT_REPORT_URL` | `NEXT_PUBLIC_AUDIT_REPORT_URL` | public | Link to a real audit report of this interface. | "Interface audit: none on record". No audit badge is shown. |
| `POOL_AUDIT_REPORT_URL` | `NEXT_PUBLIC_POOL_AUDIT_REPORT_URL` | public | Link to a real audit report of the underlying RAIL20 pool. | "Underlying pool audit: none on record". |
| `SCREENING_PROVIDER` | `NEXT_PUBLIC_SCREENING_PROVIDER` | public | Deposit screening provider. Only a mock adapter exists in this phase. | "Screening provider not configured". Mainnet path locked. |
| `SHIELDED_ADDRESS_FORMAT` | `NEXT_PUBLIC_SHIELDED_ADDRESS_FORMAT` | public | Real shielded address format. Undocumented by the protocol. | Mock uses the obviously fake form mock-shielded:<hex>. |
| `CONTACT_EMAIL` | `NEXT_PUBLIC_CONTACT_EMAIL` | public | Public contact address. | Footer shows "Contact: not configured". |
| `SOCIAL_URL` | `NEXT_PUBLIC_SOCIAL_URL` | public | Official social account URL. | Footer omits the social link. |
| `RESTRICTED_REGION_LIST` | `RESTRICTED_REGION_LIST` | server | Extra blocked regions (sanctions list from the owner with counsel). US is always blocked. | Only US is blocked. |
| `RPC_UPSTREAM_URL` | `RPC_UPSTREAM_URL` | server | Private RPC endpoint for /api/rpc (key stays in Cloudflare env). | /api/rpc answers "RPC upstream not configured" unless ALLOW_PUBLIC_UPSTREAM=1 (public endpoint, rate-limited). |
| `ALLOWED_ORIGINS` | `ALLOWED_ORIGINS` | server | Extra origins allowed to call /api/rpc (same origin is always allowed). | Same origin only. |
| `DOMAIN` | (owner decision) | owner | Product domain (config/brand.ts). Name and domain check pending. | No domain shown. |
| `OXBOW_ENTRYPOINT` | (owner decision) | owner | 0xbow Entrypoint address, kept only as an observed note. The brief that held it was not available. | Not recorded. 0xbow stays disabled. |
<!-- placeholders:end -->

## Open decisions

1. **Accent colour.** `#00C805` (from the brief) may read as Robinhood's brand green. A non-green AA-checked alternative is ready: `<html data-accent="alt">`. The footer carries an affiliation disclaimer.
2. **Name and domain.** "Sightpool" is a working name. A name and domain check is pending.
3. **Brief.** The brief file was not available. Reconcile copy and acceptance criteria when it is (docs/DECISIONS.md D-01).

All other decisions: `docs/DECISIONS.md`.
