"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "info" | "success" | "warning";
interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}
interface ToastApi {
  toast: (t: { title: string; body?: string; tone?: ToastTone }) => void;
}

const Ctx = createContext<ToastApi>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

const DURATION = 5000;

/** Toasts: title + one line, auto-dismiss after 5s, closable, announced politely, kept away from main actions (top right / top on mobile). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback<ToastApi["toast"]>(({ title, body, tone = "info" }) => {
    const id = next.current++;
    setItems((xs) => [...xs.slice(-2), { id, title, body, tone }]);
  }, []);
  const api = useMemo(() => ({ toast }), [toast]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4 md:inset-x-auto md:right-0 md:items-end">
        {items.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(onClose, DURATION);
    return () => clearTimeout(t);
  }, [paused, onClose]);
  const icon =
    item.tone === "success" ? <CheckCircle2 aria-hidden className="mt-1 size-4 text-success" /> : item.tone === "warning" ? <AlertTriangle aria-hidden className="mt-1 size-4 text-warning" /> : <Info aria-hidden className="mt-1 size-4 text-info" />;
  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn("animate-in pointer-events-auto flex w-full max-w-toast items-start gap-3 rounded-md border border-line-strong bg-surface-2 py-3 pl-4 pr-2 shadow-floating")}
    >
      {icon}
      <div className="flex-1">
        <p className="text-14 font-medium">{item.title}</p>
        {item.body && <p className="text-14 text-muted">{item.body}</p>}
      </div>
      <button type="button" onClick={onClose} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-text" aria-label="Dismiss notification">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
