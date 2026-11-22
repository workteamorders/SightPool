"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Tabs with roving focus (arrow keys, Home, End). */
export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; panel: ReactNode }[]; label: string }) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = items.findIndex((i) => i.value === value);
  const onKey = (e: KeyboardEvent) => {
    let n = idx;
    if (e.key === "ArrowRight") n = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") n = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = items.length - 1;
    else return;
    e.preventDefault();
    const item = items[n];
    if (item) {
      onChange(item.value);
      refs.current[n]?.focus();
    }
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line" onKeyDown={onKey}>
        {items.map((it, i) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${id}-t-${it.value}`}
              aria-selected={active}
              aria-controls={`${id}-p-${it.value}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(it.value)}
              className={cn(
                "relative min-h-touch whitespace-nowrap px-4 text-14 transition-colors duration-[var(--dur-micro)]",
                active ? "text-text after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-accent" : "text-muted hover:text-text",
              )}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {items.map((it) =>
        it.value === value ? (
          <div key={it.value} role="tabpanel" id={`${id}-p-${it.value}`} aria-labelledby={`${id}-t-${it.value}`} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
            {it.panel}
          </div>
        ) : null,
      )}
    </div>
  );
}
