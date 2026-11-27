import { AMBIENCE } from "@config/ambience";
import { BoardSketches } from "@/components/site/board-sketches";
import { SketchDraw } from "@/components/site/sketch-draw";

/**
 * The margins of the landing page: chalk sketches and a pinned note that belong to the page, so they scroll with it
 * (the board layer in page-board.tsx is the part fixed to the screen). Fills the page wrapper, behind the content,
 * takes no pointer events and is hidden from assistive technology. Shown from 90rem wide, where there is a margin.
 * Switches: config/ambience.ts (sketches, flutter).
 */
export function PageMargins() {
  if (!AMBIENCE.sketches && !AMBIENCE.flutter) return null;
  return (
    <div aria-hidden className="page-margins">
      <BoardSketches />
      {AMBIENCE.flutter && (
        <div className="board-note paper">
          <span className="board-pin" />
          <span className="board-note-label">Note</span>
        </div>
      )}
      {AMBIENCE.sketches && <SketchDraw />}
    </div>
  );
}
