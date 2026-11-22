import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A sheet of paper: the document layer of the interface. Receipts, disclosures, legal text and fee schedules
 * sit on it. Everything inside reads in ink (the .paper class re-points the text, rule and focus tokens).
 * Works in server components: no client hooks.
 */
export function Paper({ children, className, as: Tag = "div", fold, ...rest }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "aside"; fold?: boolean } & Record<string, unknown>) {
  return (
    <Tag className={cn("paper", className)} data-fold={fold ? "" : undefined} {...rest}>
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
