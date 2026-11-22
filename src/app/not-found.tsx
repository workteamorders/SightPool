import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-content flex-col gap-8 px-gutter pt-24">
      <div aria-hidden className="relative h-4 w-full max-w-form overflow-hidden">
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="absolute left-0 top-1/2 size-2 -translate-y-1/2 border border-accent motion-safe:animate-[sp-scan_3.2s_var(--easing-out)_infinite_alternate]" />
      </div>
      <p className="eyebrow">404</p>
      <h1 className="text-44 font-semibold">Nothing at this address.</h1>
      <p className="text-20 text-muted prose-measure">We looked along the whole line. The page may have moved, or the link has a typo. Nothing was changed by visiting it.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonClass("primary", "md")}>
          Go to the home page
        </Link>
        <Link href="/app/shield/" className={buttonClass("secondary", "md")}>
          Open the preview
        </Link>
      </div>
    </section>
  );
}
