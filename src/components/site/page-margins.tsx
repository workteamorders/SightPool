import { AMBIENCE } from "@config/ambience";
import { ChalkWriter } from "@/components/site/chalk-writer";

/**
 * The margins of the landing page: empty slots where chalk is drawn (by chalk-writer.tsx) and a pinned note. They
 * belong to the page, so they scroll with it (the board layer in page-board.tsx is the part fixed to the screen).
 * Fills the page wrapper, behind the content, takes no pointer events and is hidden from assistive technology. Shown
 * from 90rem wide, where there is a margin. About thirty slots down each margin (two columns on very wide screens), never behind the status strip.
 * Switches: config/ambience.ts (sketches, flutter).
 */
const STEP = 3.5;
type Col = "outer" | "inner";
const slots = (side: "left" | "right", col: Col, first: number) =>
  Array.from({ length: 30 }, (_, i) => ({ side, col, top: first + i * STEP + Math.sin(i * 2.7 + (side === "left" ? 0 : 1.3) + (col === "inner" ? 2 : 0)) * 0.35 })).filter(
    (s) => s.top < 95 && !(s.top > 22.6 && s.top < 28.4) && !(s.side === "right" && s.top < 13), // the status strip sits across the page at about a quarter of its height; the hero ruler and clock fill the top right
  );
// The outer columns sit by the screen edge. The inner columns sit against the content and need a wider screen (110rem).
const SLOTS = [...slots("left", "outer", 2.5), ...slots("right", "outer", 4.3), ...slots("left", "inner", 4.4), ...slots("right", "inner", 2.9)];

export function PageMargins() {
  if (!AMBIENCE.sketches && !AMBIENCE.flutter) return null;
  return (
    <div aria-hidden className="page-margins">
      {AMBIENCE.sketches && SLOTS.map((s, i) => <div key={i} className="sketch-slot" data-side={s.side} data-col={s.col} style={{ top: `${s.top.toFixed(1)}%` }} />)}
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
