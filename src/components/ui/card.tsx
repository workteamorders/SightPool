import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Raised panel: surface + 1px rule. No shadow (shadows are reserved for floating layers). */
export function Panel({ children, className, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "aside" } & Record<string, unknown>) {
  return (
    <Tag className={cn("rounded-md border border-line bg-surface", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Interactive card: one target, one link. The whole card is the link's hit area. */
export function LinkCard({ href, title, children, className, external }: { href: string; title: string; children?: ReactNode; className?: string; external?: boolean }) {
  return (
    <div
      className={cn(
        "group relative rounded-md border border-line bg-surface p-6 transition-[background-color,border-color] duration-[var(--dur-element)] ease-out hover:border-line-control hover:bg-surface-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus",
        className,
      )}
    >
      <h3 className="flex items-start justify-between gap-4 text-20 font-medium">
        {external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </a>
        ) : (
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </Link>
        )}
        <ArrowUpRight aria-hidden className="size-4 flex-none text-muted transition-transform duration-[var(--dur-element)] group-hover:-translate-y-px group-hover:translate-x-px" />
      </h3>
      {children && <div className="mt-2 text-14 text-muted">{children}</div>}
    </div>
  );
}
