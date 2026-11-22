import type { ReactNode } from "react";
import { AlertTriangle, Ban, Check, CircleDashed, FlaskConical, Info, Lock, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "mock" | "locked" | "missing";

const tones: Record<Tone, string> = {
  neutral: "border-line-strong bg-surface-2 text-text",
  info: "border-info-line bg-info-bg text-info",
  success: "border-success-line bg-success-bg text-success",
  warning: "border-warning-line bg-warning-bg text-warning",
  danger: "border-danger-line bg-danger-bg text-danger",
  mock: "border-warning-line bg-transparent text-warning",
  locked: "border-line-strong bg-transparent text-muted",
  missing: "border-dashed border-line-control bg-transparent text-muted",
};

const icons: Record<Tone, ReactNode> = {
  neutral: <Minus aria-hidden className="size-3" />,
  info: <Info aria-hidden className="size-3" />,
  success: <Check aria-hidden className="size-3" />,
  warning: <AlertTriangle aria-hidden className="size-3" />,
  danger: <Ban aria-hidden className="size-3" />,
  mock: <FlaskConical aria-hidden className="size-3" />,
  locked: <Lock aria-hidden className="size-3" />,
  missing: <CircleDashed aria-hidden className="size-3" />,
};

/**
 * Short status label. Meaning is carried by the icon and the word, not the color.
 * Never use a badge to claim something the system has not checked.
 */
export function Badge({ tone = "neutral", children, className, icon = true }: { tone?: Tone; children: ReactNode; className?: string; icon?: boolean }) {
  return (
    <span className={cn("inline-flex min-h-6 items-center gap-1 whitespace-nowrap rounded-sm border px-2 text-12 font-medium leading-none", tones[tone], className)}>
      {icon && icons[tone]}
      {children}
    </span>
  );
}
