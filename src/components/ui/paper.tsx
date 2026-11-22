import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A sheet of paper: the document layer of the interface. Receipts, disclosures, legal text and fee schedules
 * sit on it. Everything inside reads in ink (the .paper class re-points the text, rule and focus tokens).
 * Works in server components: no client hooks.
 */
export function Paper({ children, className, as: Tag = "div", fold, torn, ...rest }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "aside"; fold?: boolean; torn?: boolean } & Record<string, unknown>) {
  return (
    <Tag className={cn("paper", className)} data-fold={fold ? "" : undefined} data-torn={torn ? "" : undefined} {...rest}>
      {children}
    </Tag>
  );
}

/** The header band of a sheet: a file reference on the left, free content (a stamp) on the right. */
export function PaperBand({ children, fileRef, className }: { children?: ReactNode; fileRef?: ReactNode; className?: string }) {
  return (
    <div className={cn("paper-band flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3", className)}>
      <p className="sightline eyebrow flex-[1_1_auto]">{fileRef && <span className="num min-w-0 normal-case tracking-normal">{fileRef}</span>}</p>
      {children}
    </div>
  );
}

/** A rubber stamp. States "mock" or "sample". It never states approval, and it is not the only carrier of the
 *  mock status: the banner and the footnote say it in words too. */
export function Stamp({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("stamp", className)}>{children}</span>;
}

/** A round seal: brand, "sample archive" and "mock" around a ring, with a stack mark in the middle. It marks a sheet
 *  as a sample from the mock flow. It is not a mark of approval, and it says "mock" in its own ring. Decorative:
 *  the stamp and the footnote carry the same status in words, so it is hidden from assistive technology. */
export function Seal({ brandName, className }: { brandName: string; className?: string }) {
  const ring = `${brandName} · SAMPLE ARCHIVE · MOCK · `.toUpperCase();
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 120 120" width={104} height={104} className={cn("seal", className)} style={{ color: "var(--stamp)", transform: "rotate(-12deg)" }}>
      <defs>
        <path id="seal-ring" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" strokeWidth="1" />
      <text fill="currentColor" fontSize="9.5" fontWeight="600" fontFamily="var(--font-code)">
        <textPath href="#seal-ring" textLength="276" lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <g transform="translate(60 60) scale(1.2) translate(-12 -12)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </g>
    </svg>
  );
}

/** A black binder clip with silver handles. Decorative. */
export function PaperClip({ className }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 68 96" width={68} height={96} className={className}>
      <path d="M15 46C5 24 9 6 24 6h20c15 0 19 18 9 40" fill="none" stroke="#8d887e" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M15 46C5 24 9 6 24 6h20c15 0 19 18 9 40" fill="none" stroke="#d6d2c8" strokeWidth="1" strokeLinecap="round" transform="translate(-0.6 -0.6)" />
      <path d="M6 44h56l-5 40H11Z" fill="#232321" />
      <path d="M6 44h56l-1 7H7Z" fill="#3a3a37" />
      <path d="M13 58h42" stroke="#4a4a46" strokeWidth="1" />
    </svg>
  );
}
