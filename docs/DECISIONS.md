# Decisions

Every decision taken without asking, with the reason. Newest facts are in `docs/GATE-X.md`.

## Scope and process

**D-01. The brief was not available.** `../sightpool-brief.md` did not exist on 22 Nov 2026. The parent folder held only `sightpool-build-prompt.md`, which is the build prompt itself. `docs/BRIEF.md` records this. Consequences:
- Page copy comes from the prompt's "PERUBAHAN COPY" (used verbatim where given) and from Gate X facts. Everything else was written fresh in the same voice.
- The design system follows the prompt's summary of the brief (neutral dark, one accent, 1px rules, small-to-medium radius, accent #00C805).
- The placeholder list comes from every bracketed name in the prompt. The brief's own "Placeholders" and Appendix could not be read. Any placeholder that exists only there is missing (see README).
- The 0xbow Entrypoint address is not recorded, because only the brief held it.
- **To do when the brief arrives:** compare copy, routes and acceptance criteria and reconcile.

**D-02. Checkpoints merged.** The prompt asks to stop after each stage. After stage 0 started, the owner wrote "buatkan sampai selesai dan siap mainet" ("build it to the end and mainnet-ready"). Stages 0–3 were therefore built in one pass with a single final report.

**D-03. "Mainnet-ready" was not implemented as real transactions.** The prompt's hard rules (no relayer client, no calls to the protocol API, no key-deriving signatures, no write code) still stand. Gate X also found new risk: the pools are upgradeable proxies with unpublished implementation source. The build is deployment-ready as an interface preview with read-only chain access. Mainnet stays gated by construction. `docs/INTEGRATION-FUTURE.md` lists exactly what is needed first. The owner was told this in the conversation.

## Facts and configuration

**D-04. Fee recipient checksum.** The docs and the prompt print `0xd962c7a67b74EEe8…`, which fails EIP-55. The allowlist uses the valid checksum `0xd962c7a67B74EEe8D418189f7917A18577A4775d`. It is an account (no code) and display-only.

**D-05. Pool ABI.** No full ABI exists: the implementations have no published source. Only the documented fragments are stored (`shield`, `transact`, `getLastRoot`), and only `getLastRoot` is ever called (`config/abis.ts`).

**D-06. USDG pause/freeze ABI.** It is not in the USDG implementation's ABI. USDG routes `paused()` and `isFrozen(address)` to `TokenAdminFacet` (source published on Blockscout), found with the verified `getFacet(bytes4)`. Only those two view fragments are stored. They are called through the USDG proxy.

**D-07. Chain object.** The chain is defined locally (id 4663, ETH, Blockscout) with only the official public RPC. viem's built-in definition also lists a third-party RPC, and that one was dropped. There is no multicall3 entry, so every `eth_call` targets an allowlisted contract and the relay can enforce that.

**D-08. Versions locked.** RainbowKit 2.2.11 (latest) requires wagmi ^2.9. Locked to wagmi 2.19.5, viem 2.58.4, @tanstack/react-query 5.108.2, Next 16.4.6, React 19.2, Tailwind 4.3.5.

**D-09. Interface fee variable renamed.** The prompt names `SIGHTPOOL_FEE_BPS`. The brand rule forbids the product name outside `config/brand.ts`, so the variable is `NEXT_PUBLIC_INTERFACE_FEE_BPS` (default 0, shown as 0).

**D-10. Fee rounding and where it comes from.** `previewFee` rounds the percentage part up, so the preview never understates the fee. An amount at or below the total fee is blocked. In the mock the fee is taken out of the amount entered (recipient receives amount − fee). The docs do not say which way the relayer applies it, so this is stated in the UI and in INTEGRATION-FUTURE. Shield shows "no relayer fee documented": the documented fees are relayer fees, and a shield is a direct deposit.

**D-11. Dated disclosure wording.** The prompt's required sentence says the pool's documentation "states" that the relayer can see amounts and recipients. Strictly, the docs show that the withdraw request body carries `amount` and `recipient` in plain form and that the relayer derives keys from the signature. They do not say "can see" in those words. The sentence is kept as the owner wrote it, because it is accurate in substance. This note records how it was derived.

**D-12. New disclosure added.** "The pool contracts can be changed" was added from Gate X (ERC-1967 proxies, implementation source not published, upgrade authority unknown).

## Behaviour

**D-13. Region check UX.** The check fails closed. While it runs, pages render but every action is disabled (this avoids a layout jump). Missing, malformed, `XX` or `T1` country means blocked. US is always blocked, and `RESTRICTED_REGION_LIST` adds more. Blocked users see an explanation and can continue in view-only mode: nothing can be submitted, even in the mock, and no wallet can be connected.

**D-14. Terms gate timing.** The Terms and non-US confirmation are required before connecting a wallet (read-only mode) and also before running any mock action. Browsing without a wallet is open. The stricter reading was chosen so the mock never shows a path around the gate.

**D-15. CSP keeps `'unsafe-inline'` for scripts.** A Next.js static export inlines bootstrap scripts whose hashes differ per page. Nonces would need a Pages Function on every request, which uses up the free tier. Everything else is strict (`object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `connect-src` limited to self and WalletConnect). Revisit if a middleware budget exists.

**D-16. Open Graph image.** It is only emitted when `SITE_URL` is configured, because OG images need absolute URLs and the domain is unknown. Otherwise they would point at localhost.

**D-17. App routes are `noindex`.** `/app/*` and `/styleguide` are excluded from search, so Lighthouse SEO on those pages reads 63 by design. Public pages score 100.

**D-18. framer-motion not used.** All motion is CSS transitions and keyframes on transform and opacity, controlled by duration tokens that drop to 0 under `prefers-reduced-motion`. This keeps the initial JavaScript smaller. The prompt allowed framer-motion for small fades only, so nothing is lost.

**D-19. shadcn/ui as pattern, not CLI.** Components follow the shadcn approach (local source on Radix primitives: Dialog, Tooltip), written to the token system. The CLI would have pulled in its default palette and radius scale, which the token rules forbid.

**D-20. Token enforcement.** Tailwind's default color, spacing, type, radius, shadow and breakpoint scales are reset in `globals.css`. Only token values exist as utilities. Spacing is 4/8-based only.

**D-21. Dark only.** The brief sets a neutral dark system. `color-scheme: dark` is set. No light theme ships.

**D-22. Mock wallet address.** `0x1111…1111`, obviously fake. Mock shielded addresses use `mock-shielded:<40 hex>`. Every mock hash starts with `mock-`.

**D-23. Forensic Archive direction (documents on paper, set in an archive).** The dark room stays the interface. Receipts, disclosure items, legal text and the fee schedule are sheets of aged paper in ink (`--paper`, `--ink*`, `--stamp` in `tokens.css`). The `.paper` class re-points the text, rule and focus tokens, so components inside a sheet need no variant. Stamps say "mock", "sample" or "draft" and never approval; they exist only on paper (rust on the dark room fails contrast) and are never the only carrier of the status: the banner and the footnote say it in words. File references on a sheet exist only for `mock-` hashes. The sight line also runs vertically through the five steps. Textures are generated from code (`pnpm textures`, fixed seed): `public/grain-dark.png` on the page, `public/grain-paper.png` on sheets and the folder. No stock or AI images, no external requests (CSP `img-src 'self'` is enough). Contrast on paper is checked against the paper blended 20% toward the texture brown, the worst case the grain produces (168 pairs in total). No glass, glow or blur.

**D-24. Landing hero follows the owner's reference image.** Manila folder with a tab, two loose sheets, a clip, a torn bottom edge, a round seal, a rope and punched holes on the left edge (wide screens only), a hand-drawn accent underline under the headline, monospace body text, and a three-fact strip with a disclaimer line. Deliberate differences from the image: (1) the seal's ring says "SAMPLE ARCHIVE · MOCK", so it cannot read as a mark of approval; (2) the file and folder numbers carry the `mock-` prefix instead of an official-looking number; (3) the disclaimer keeps the dated, specific wording already used in the footer; the hero line is shorter ("Not affiliated with Robinhood, Paxos or RAIL20") and the full text stays in the footer; (4) the photo clipped behind the sheets is left out (no stock or AI imagery); (5) the stamp rust is darker than in the image so it passes AA on aged paper; (6) the live status strip stays below the hero, because it carries the on-chain reads.

**D-25. Live background on the landing hero: a desk lamp and drifting dust.** `Ambience` (`src/components/site/ambience.tsx`) is pure CSS: a conic light cone that sways slowly, a soft glow, and 24 specks of dust (8 on small screens). Only `transform` and `opacity` animate, nothing is scripted, nothing is fetched. It is `aria-hidden`, and under `prefers-reduced-motion` the specks are hidden and the light stops. Each light layer peaks at 8.5% over the room color; where the two overlap it reaches about 12%, and `contrast:check` tests all text colors against that (`--lamp`). Decorative only: it carries no status and no data. Rejected on purpose: falling hash or code, neon particles, blurred glass, video loops. A faint live block number from the existing read-only status is possible later, but only with a plain label, so that it cannot be read as pool activity.

**D-26. Live background v2: light, sight lines, archival depth, calm interaction.** Four decorative layers sit behind the hero, all `aria-hidden`, none carrying status or data. (1) Light and shade: the lamp cone, glow and a shade drift on a 26 s cycle, away from the headline and the buttons. (2) Sight lines: a ruler on wide screens (labels "y 00 / y 20 / y 40", no numbers from the chain) and one thin traced line with a small marker that travels, then fades; it never crosses a value on the receipt and implies no verification. (3) Archival depth: two ghost folders, registration marks and a decorative "01 / 03" behind the receipt, which moves 3 to 6 px with the cursor (fine pointers only). The receipt, its folder front and clip never move. (4) Scroll drift of 4% on the decorative group. Architecture: CSS-only animation of `transform`, `opacity`, `translate`; one small client controller (`hero-motion.tsx`) that eases pointer and scroll into inline `translate` on marked layers inside a rAF loop that stops when settled. Resting state is the base style, so with animation off the picture is complete. Entrance: the content is never hidden; archival layers fade in over 0.6 s, the ruler draws, the sheets settle by 2.4 s. The light, dust, traced line and loops start only after `load` plus an idle callback (`data-live`), because starting everything at once cost 4 to 8 Lighthouse points on a mobile profile. Pausing: hidden tab and off-screen (`data-run="false"`), `prefers-reduced-motion`, and a new "Pause motion" button in the footer (it did not exist before; it is stored in `localStorage` and sets `data-motion="paused"`). Intensity: `config/ambience.ts` switches and `--amb-*` tokens. Light stays at or below 9% so that `contrast:check` (12% blend) remains valid. Rejected: falling code or hashes, particle networks, anything that reads as a live transaction feed, blur or backdrop filters, third-party scripts.

**D-27. Details that never stop moving.** Six small additions so that something is always in motion, each with a switch in `config/ambience.ts` (except the block refresh) and each in its resting state without animation. (1) A small square travels up and down the ruler (`marker`, with the ruler, wide screens). (2) The rope on the binder edge sways about a fifth of a degree (`rope`, wide screens). (3) A clock in UTC at the top right from tablet width up (`clock`). It is read from the visitor's own browser, the label says "Clock", it shows seconds only while the stage runs, and hours and minutes only when motion is off, so a frozen display cannot pass for the current second. It is not chain data. (4) More dust, a little brighter (26 specks, 12 on small screens; peak opacity 0.5). (5) A blinking caret after the hero label (`caret`). It sits outside the receipt on purpose: the receipt stays untouched. (6) The block number in the status strip is read again every 20 seconds while the tab is visible and once more when the tab comes back; a failed refresh shows a dash, never an old number; the label now says "Robinhood Chain, read-only". This is data, not decoration, so Pause motion does not stop it; it is the only part of this list that makes requests (one small read-only call per 20 s per open visible tab). Rejected again: a scan line over the receipt (implies verification), falling hashes (reads as a transaction feed).

## Open decisions for the owner

**O-1. Accent colour.** `--accent: #00c805` follows the brief. From memory, and not verified, this matches Robinhood's brand green, and the product names Robinhood Chain: risk of implied affiliation. A ready non-green alternative ships: set `data-accent="alt"` on `<html>` (bone `#e6dcc3` with dark text, AA-checked by `pnpm contrast:check`). The footer carries an affiliation disclaimer either way.

**O-2. View key.** Treated as non-existent (Gate X, d). If RAIL20 ships a real view-only key, the Keys page can add it. Until then it stays a disclosure package.

**O-3. Audit scope.** Two separate statuses are shown: "Interface audit" and "Underlying pool audit", both "None on record". An interface audit does not cover the pool.
