import type { ReactNode } from "react";
import { brand } from "@config/brand";
import { PaperClip } from "@/components/ui/paper";

/**
 * The hero picture: a manila folder with a tab, two loose sheets behind the front sheet, and a clip. The front
 * sheet (children) is the real, readable receipt. Everything else is decoration and is hidden from assistive
 * technology. The folder number carries the mock- prefix, like every mock identifier.
 */
export function ArchiveFolder({ children, folderNo = "mock-0001" }: { children: ReactNode; folderNo?: string }) {
  return (
    <div className="archive">
      <div aria-hidden className="archive-back">
        <span className="archive-tab">
          {brand.name} / sample archive
          <br />
          Folder {folderNo}
        </span>
      </div>
      <div aria-hidden className="archive-sheet archive-sheet-a" />
      <div aria-hidden className="archive-sheet archive-sheet-b" />
      <div className="archive-front">{children}</div>
      <PaperClip className="archive-clip" />
    </div>
  );
}

/** The binding on the left edge: punched holes and a rope. Decorative, wide screens only. */
export function BinderEdge() {
  return <div aria-hidden className="binder hidden xl:block" />;
}
