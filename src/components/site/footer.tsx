import Link from "next/link";
import { brand } from "@config/brand";
import { config } from "@config/env";
import { FACTS_CHECKED_ON } from "@config/facts";
import { Logo } from "./logo";
import { MotionToggle } from "./motion-toggle";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/app/shield/", label: "Open the preview" },
      { href: "/app/keys/", label: "Disclosure package" },
      { href: "/app/settings/", label: "Settings and status" },
    ],
  },
  {
    title: "Risk and legal",
    links: [
      { href: "/legal/disclosures/", label: "Disclosures and risks" },
      { href: "/legal/terms/", label: "Terms" },
      { href: "/legal/privacy/", label: "Privacy" },
      { href: "/#contracts", label: "Allowlisted contracts" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-content gap-12 px-gutter py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-14 text-muted prose-measure">{brand.tagline}</p>
          <p className="text-12 text-faint">Facts on this site were last checked on {FACTS_CHECKED_ON}.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2">
            <p className="eyebrow mb-2">{c.title}</p>
            {c.links.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex min-h-touch items-center text-14 text-muted hover:text-text">
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
        <div className="flex flex-col gap-2">
          <p className="eyebrow mb-2">Contact</p>
          {config.contactEmail ? (
            <a href={`mailto:${config.contactEmail}`} className="inline-flex min-h-touch items-center text-14 text-muted hover:text-text">
              {config.contactEmail}
            </a>
          ) : (
            <p className="text-14 text-muted">Contact: not configured</p>
          )}
          {config.socialUrl && (
            <a href={config.socialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-touch items-center text-14 text-muted hover:text-text">
              Social
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-gutter py-6 text-12 text-faint">
          <p className="prose-measure">
            {brand.name} is an independent interface. It is not affiliated with, endorsed by or sponsored by Robinhood Markets, Paxos, or the RAIL20 protocol. Robinhood Chain, USDG and
            RAIL20 are named only to describe what the interface reads.
          </p>
          <p className="prose-measure">
            {brand.name} does not take custody of funds, does not operate a relayer, and is not available to people in the United States or other restricted regions. Nothing here is
            financial, legal or tax advice.
          </p>
          <MotionToggle />
        </div>
      </div>
    </footer>
  );
}
