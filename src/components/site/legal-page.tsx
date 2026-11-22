import type { ReactNode } from "react";
import { Notice } from "@/components/ui/notice";
import { SightLine } from "@/components/ui/sightline";

export function LegalPage({ title, lead, children, pending = true }: { title: string; lead: ReactNode; children: ReactNode; pending?: boolean }) {
  return (
    <article className="mx-auto flex max-w-content flex-col gap-8 px-gutter pt-12">
      <SightLine as="div">Legal</SightLine>
      <header className="flex flex-col gap-4">
        <h1 className="text-44 font-semibold">{title}</h1>
        <p className="text-20 text-muted prose-measure">{lead}</p>
      </header>
      {pending && (
        <Notice tone="warning" title="Pending counsel review">
          This is a placeholder written in plain language. It is not final legal text and has not been reviewed by a lawyer.
        </Notice>
      )}
      <div className="flex flex-col gap-8 prose-measure [&_h2]:text-24 [&_h2]:font-semibold [&_p]:text-16 [&_p]:text-muted [&_li]:text-16 [&_li]:text-muted [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6">{children}</div>
    </article>
  );
}
