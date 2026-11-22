import type { ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

/** Skeleton shaped like the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block h-4", className)} />;
}

export function StatementSkeleton({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-24" />
          <span className="flex-1 border-b border-dotted border-line" />
          <Skeleton className="w-16" />
        </div>
      ))}
    </div>
  );
}

/** Empty state: small drawing + one sentence + one action. */
export function EmptyState({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-4 rounded-md border border-dashed border-line-strong p-8", className)}>
      <svg aria-hidden viewBox="0 0 64 24" className="h-6 w-16 text-line-control" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="0.5" y="8.5" width="7" height="7" />
        <path d="M12 12h52" strokeDasharray="2 3" />
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-16 font-medium">{title}</p>
        {children && <p className="text-14 text-muted prose-measure">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** Error state: what happened, whether funds or data moved, and what to do now. */
export function ErrorState({
  title,
  what,
  funds,
  next,
  onRetry,
  retryLabel = "Try again",
  extra,
  className,
}: {
  title: string;
  what: ReactNode;
  funds: ReactNode;
  next: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col gap-4 rounded-md border border-danger-line bg-danger-bg p-6", className)}>
      <p className="flex items-center gap-2 text-16 font-medium text-text">
        <AlertOctagon aria-hidden className="size-4 text-danger" />
        {title}
      </p>
      <dl className="grid gap-3 text-14 md:grid-cols-[max-content_1fr] md:gap-x-6">
        <dt className="text-muted">What happened</dt>
        <dd>{what}</dd>
        <dt className="text-muted">Funds and data</dt>
        <dd>{funds}</dd>
        <dt className="text-muted">What you can do</dt>
        <dd>{next}</dd>
      </dl>
      {(onRetry || extra) && (
        <div className="flex flex-wrap gap-3">
          {onRetry && (
            <Button size="sm" onClick={onRetry} icon={<RotateCcw aria-hidden className="size-4" />}>
              {retryLabel}
            </Button>
          )}
          {extra}
        </div>
      )}
    </div>
  );
}
