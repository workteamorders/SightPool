"use client";
import * as T from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";

/** Hover and focus. Never the only place important information lives: the same text is in the page or label. */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Provider delayDuration={200}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content sideOffset={6} className="z-50 max-w-tip rounded-sm border border-line-strong bg-surface-3 px-3 py-2 text-12 text-text shadow-floating data-[state=delayed-open]:animate-[sp-fade_var(--dur-element)_var(--easing-out)]">
            {content}
            <T.Arrow className="fill-[var(--surface-3)]" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}

export function InfoTip({ label, content }: { label: string; content: ReactNode }) {
  return (
    <Tooltip content={content}>
      <button type="button" aria-label={label} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:text-text">
        <HelpCircle aria-hidden className="size-4" />
      </button>
    </Tooltip>
  );
}
