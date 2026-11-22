import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/** Progress through a short flow. Current step is named in words for screen readers. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 text-12" aria-label={`Step ${current + 1} of ${steps.length}: ${steps[current] ?? ""}`}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={cn(
                "num flex size-6 flex-none items-center justify-center rounded-sm border text-12",
                state === "done" && "border-line-control bg-surface-3 text-text",
                state === "current" && "border-accent text-accent-text",
                state === "todo" && "border-line text-faint",
              )}
            >
              {state === "done" ? <Check aria-hidden className="size-3" /> : i + 1}
            </span>
            <span className={cn("hidden sm:inline", state === "current" ? "text-text" : "text-muted")}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-4 bg-line-strong md:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
