import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";

export const metadata: Metadata = { title: "Preview", description: "Interface preview in mock mode." };

/* Static export has no redirects. This page points to the first flow instead. */
export default function AppIndex() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-32 font-semibold">Interface preview</h1>
      <p className="text-16 text-muted prose-measure">Start with a mock shield. You have 1,000 mock USDG to try the flow. Nothing real moves.</p>
      <Link href="/app/shield/" className={buttonClass("primary", "md")}>
        Start with Shield
      </Link>
    </div>
  );
}
