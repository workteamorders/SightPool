import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Statement rows: label, dotted leader, value. The core reading pattern of the product. */
export function Statement({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <dl aria-label={label} className={cn("flex flex-col gap-3", className)}>
      {children}
    </dl>
  );
}

export function Row({ label, value, mono, emphasis, hint }: { label: ReactNode; value: ReactNode; mono?: boolean; emphasis?: boolean; hint?: ReactNode }) {
  return (
    <div className="leader text-14">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-right", mono && "num", emphasis ? "text-16 font-medium text-text" : "text-text")}>
        {value}
        {hint && <span className="block text-12 font-normal text-faint">{hint}</span>}
      </dd>
    </div>
  );
}

/** A dash, read as "not available" by screen readers. Used when a value cannot be read: never a made-up number. */
export function Dash({ label = "not available" }: { label?: string }) {
  return (
    <span>
      <span aria-hidden>–</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
