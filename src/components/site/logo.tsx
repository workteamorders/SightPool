import { brand } from "@config/brand";

/** Original mark: the sight line itself (open square + rule). Drawn in code. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="inline-flex items-center gap-2">
        <svg aria-hidden viewBox="0 0 28 12" className="h-3 w-8" fill="none">
          <rect x="0.5" y="2.5" width="7" height="7" stroke="var(--accent)" />
          <path d="M11 6h17" stroke="var(--text)" />
        </svg>
        <span className="text-16 font-semibold tracking-tight">{brand.name}</span>
      </span>
    </span>
  );
}
