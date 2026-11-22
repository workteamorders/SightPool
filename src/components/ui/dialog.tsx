"use client";
import * as D from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Dialog: Esc closes, focus moves in and returns to the trigger, background does not scroll (Radix).
 * On small screens it docks to the bottom as a sheet. Primary action sits on the right, always.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  size = "md",
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
  size?: "md" | "lg";
}) {
  /* Controlled dialogs have no Radix Trigger, so remember what had focus and give it back on close. */
  const returnTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open && typeof document !== "undefined") returnTo.current = document.activeElement as HTMLElement | null;
  }, [open]);
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-bg/80 data-[state=open]:animate-[sp-fade_var(--dur-element)_var(--easing-out)]" />
        <D.Content
          onCloseAutoFocus={(e) => {
            if (!trigger && returnTo.current?.isConnected) {
              e.preventDefault();
              returnTo.current.focus();
            }
          }}
          className={cn(
            "fixed z-50 flex max-h-[var(--h-dialog-max)] flex-col border border-line-strong bg-surface-2 shadow-floating focus-visible:outline-none",
            "inset-x-0 bottom-0 rounded-t-md safe-bottom data-[state=open]:animate-[sp-sheet-in_var(--dur-panel)_var(--easing-out)]",
            "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-md md:pb-0",
            size === "md" ? "md:max-w-dialog" : "md:max-w-dialog-lg",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div className="flex flex-col gap-1">
              <D.Title className="text-20 font-medium">{title}</D.Title>
              {description ? <D.Description className="text-14 text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close className="-mr-2 inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-text" aria-label="Close">
              <X aria-hidden className="size-4" />
            </D.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 md:flex-row md:justify-end">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
