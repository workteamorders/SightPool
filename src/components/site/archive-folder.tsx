import type { ReactNode } from "react";
import { AMBIENCE } from "@config/ambience";
import { brand } from "@config/brand";
import { PaperClip } from "@/components/ui/paper";

/**
 * The hero picture: a manila folder with a tab, two loose sheets behind the front sheet, and a clip. The front
 * sheet (children) is the real, readable receipt. Everything else is decoration and is hidden from assistive
 * technology. The folder number carries the mock- prefix, like every mock identifier.
 *
 * Depth (config/ambience.ts, depth): two outlined silhouettes and four registration marks sit behind the folder.
 * The layers behind the receipt take cursor parallax: each is marked data-depth (its factor), and hero-motion.tsx
 * writes `translate` on exactly those elements. The front sheet and the clip carry no data-depth, so the receipt stays
 * perfectly still.
 */
export function ArchiveFolder({ children, folderNo = "mock-0001" }: { children: ReactNode; folderNo?: string }) {
  return (
    <div className="archive">
      {AMBIENCE.depth && (
        <>
          <div aria-hidden className="archive-ghost archive-ghost-a" data-depth="1.5" />
          <div aria-hidden className="archive-ghost archive-ghost-b" data-depth="-1.25" />
          <span aria-hidden className="archive-reg archive-reg-tl" data-depth="1.5" />
          <span aria-hidden className="archive-reg archive-reg-tr" data-depth="1.5" />
          <span aria-hidden className="archive-reg archive-reg-bl" data-depth="1.5" />
          <span aria-hidden className="archive-reg archive-reg-br" data-depth="1.5" />
          <span aria-hidden className="archive-no" data-depth="1.5">
            01 / 03
          </span>
        </>
      )}
      <div aria-hidden className="archive-back" data-depth="0.75">
        <span className="archive-tab">
          {brand.name} / sample archive
          <br />
          Folder {folderNo}
        </span>
      </div>
      <div aria-hidden className="archive-sheet archive-sheet-a" data-depth="1" />
      <div aria-hidden className="archive-sheet archive-sheet-b" data-depth="1.25" />
      <div className="archive-front">{children}</div>
      <PaperClip className="archive-clip" />
    </div>
  );
}

/** The binding on the left edge: punched holes and a rope. Decorative, wide screens only. */
export function BinderEdge() {
  return <div aria-hidden className="binder hidden xl:block" />;
}
