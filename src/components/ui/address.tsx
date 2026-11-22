"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { shortHex } from "@/lib/format";
import { addressUrl } from "@config/chain";
import { cn } from "@/lib/cn";

/** Address in mono, shortened on small screens, with copy and an explorer link. */
export function Address({ value, explorer = true, full = false, className, label }: { value: string; explorer?: boolean; full?: boolean; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the full value is still selectable in the title */
    }
  };
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1", className)}>
      <span className="num truncate text-14" title={value}>
        {full ? (
          <>
            <span className="hidden break-all md:inline">{value}</span>
            <span className="md:hidden">{shortHex(value, 8, 6)}</span>
          </>
        ) : (
          shortHex(value, 6, 4)
        )}
      </span>
      <button type="button" onClick={copy} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text" aria-label={`Copy ${label ?? "address"}`}>
        {copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4" />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied. Check it against the explorer before you use it." : ""}
      </span>
      {explorer && /^0x[0-9a-fA-F]{40}$/.test(value) && (
        <a href={addressUrl(value)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text" aria-label={`Open ${label ?? "address"} on the explorer (new tab)`}>
          <ExternalLink aria-hidden className="size-4" />
        </a>
      )}
    </span>
  );
}
