import { AMBIENCE } from "@config/ambience";
import { ChalkWriter } from "@/components/site/chalk-writer";

/**
 * The margins of the landing page: the layer where chalk is drawn (by chalk-writer.tsx, which puts each drawing at a random free place in the margins) and a pinned note. They
 * belong to the page, so they scroll with it (the board layer in page-board.tsx is the part fixed to the screen).
 * Fills the page wrapper, behind the content, takes no pointer events and is hidden from assistive technology. Shown
 * from 90rem wide, where there is a margin.
 * Switches: config/ambience.ts (sketches, flutter).
 */
export function PageMargins() {
  if (!AMBIENCE.sketches && !AMBIENCE.flutter) return null;
  return (
    <div aria-hidden className="page-margins">
      {AMBIENCE.flutter && (
        <div className="board-note paper">
          <span className="board-pin" />
          <span className="board-note-label">Note</span>
        </div>
      )}
      {AMBIENCE.sketches && <ChalkWriter />}
    </div>
  );
}
