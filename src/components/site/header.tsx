"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as D from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { brand } from "@config/brand";
import { buttonClass } from "@/components/ui/button-styles";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#disclosures", label: "Disclosures" },
  { href: "/#contracts", label: "Contracts" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const inApp = path?.startsWith("/app");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface-3 focus:px-4 focus:py-3">
        Skip to main content
      </a>
      <div className="mx-auto flex h-[var(--header-h)] max-w-content items-center justify-between gap-4 px-gutter">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex min-h-touch items-center rounded-sm" aria-label={`${brand.name} home`}>
            <Logo />
          </Link>
          <Badge tone="mock" className="hidden sm:inline-flex">
            Interface preview
          </Badge>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="inline-flex min-h-touch items-center rounded-md px-3 text-14 text-muted hover:bg-surface-2 hover:text-text">
              {n.label}
            </Link>
          ))}
          <Link href="/app/shield/" aria-current={inApp ? "page" : undefined} className={cn(buttonClass(inApp ? "secondary" : "primary", "sm"), "ml-2")}>
            Open the preview
          </Link>
        </nav>
        <D.Root open={open} onOpenChange={setOpen}>
          <D.Trigger className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-line-control lg:hidden" aria-label="Open menu">
            <Menu aria-hidden className="size-4" />
          </D.Trigger>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-40 bg-bg/80 data-[state=open]:animate-[sp-fade_var(--dur-element)_var(--easing-out)]" />
            <D.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sidebar flex-col gap-2 border-l border-line-strong bg-surface-2 p-4 safe-bottom data-[state=open]:animate-[sp-fade_var(--dur-panel)_var(--easing-out)] focus-visible:outline-none sm:max-w-dialog">
              <div className="flex items-center justify-between">
                <D.Title className="eyebrow">Menu</D.Title>
                <D.Description className="sr-only">Site navigation</D.Description>
                <D.Close className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md hover:bg-surface-3" aria-label="Close menu">
                  <X aria-hidden className="size-4" />
                </D.Close>
              </div>
              <nav aria-label="Main" className="flex flex-col">
                {NAV.map((n) => (
                  <D.Close asChild key={n.href}>
                    <Link href={n.href} className="flex min-h-12 items-center border-b border-line text-16">
                      {n.label}
                    </Link>
                  </D.Close>
                ))}
              </nav>
              <D.Close asChild>
                <Link href="/app/shield/" className={cn(buttonClass("primary", "md"), "mt-4")}>
                  Open the preview
                </Link>
              </D.Close>
            </D.Content>
          </D.Portal>
        </D.Root>
      </div>
    </header>
  );
}
