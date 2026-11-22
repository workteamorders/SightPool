import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The signature motif: a section label on a 1px sight line that starts with a small open square. */
export function SightLine({ children, tone, className, as: Tag = "p", id }: { children?: ReactNode; tone?: "accent"; className?: string; as?: "p" | "h2" | "h3" | "div"; id?: string }) {
  return (
    <Tag id={id} className={cn("sightline eyebrow", className)} data-tone={tone}>
      {children && <span className="flex-none">{children}</span>}
    </Tag>
  );
}
