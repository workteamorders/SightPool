import type { ReactNode } from "react";
import { AlertTriangle, Ban, CheckCircle2, FlaskConical, Info, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

type NoticeTone = "info" | "warning" | "danger" | "success" | "mock" | "locked";

const styles: Record<NoticeTone, string> = {
  info: "border-info-line bg-info-bg",
  warning: "border-warning-line bg-warning-bg",
  danger: "border-danger-line bg-danger-bg",
  success: "border-success-line bg-success-bg",
  mock: "border-warning-line bg-surface",
  locked: "border-line-strong bg-surface",
};
const iconColor: Record<NoticeTone, string> = {
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-success",
  mock: "text-warning",
  locked: "text-muted",
};
const Icon = ({ tone }: { tone: NoticeTone }) => {
  const c = cn("mt-1 size-4 flex-none", iconColor[tone]);
  switch (tone) {
    case "info":
      return <Info aria-hidden className={c} />;
    case "warning":
      return <AlertTriangle aria-hidden className={c} />;
    case "danger":
      return <Ban aria-hidden className={c} />;
    case "success":
      return <CheckCircle2 aria-hidden className={c} />;
    case "mock":
      return <FlaskConical aria-hidden className={c} />;
    case "locked":
      return <Lock aria-hidden className={c} />;
  }
};

export function Notice({ tone = "info", title, children, className, role, action }: { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; className?: string; role?: "status" | "alert"; action?: ReactNode }) {
  return (
    <div role={role} className={cn("flex gap-3 rounded-md border px-4 py-3", styles[tone], className)}>
      <Icon tone={tone} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-14">
        {title && <p className="font-medium text-text">{title}</p>}
        {children && <div className="text-muted [&_a]:text-text">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
