import type { CSSProperties } from "react";
import { AMBIENCE } from "@config/ambience";

/**
 * The board itself: a layer fixed to the viewport behind the whole landing page, so something is always moving in view
 * wherever the visitor has scrolled. Chalk dust drifts slowly through the viewport and a soft band of light sweeps across it
 * now and then. Decorative only and hidden from assistive technology; it never takes pointer events, sits behind all
 * content, and carries no data. Without animation (reduced motion, Pause motion) it rests out of sight. Switch:
 * config/ambience.ts (board); strength of the light band: --amb-sweep in tokens.css.
 */
const SPECKS = Array.from({ length: 36 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 5.7213 + n * 29.931) * 52716.1873;
    return x - Math.floor(x);
  };
  return {
    left: 2 + r(1) * 96,
    top: 4 + r(2) * 92,
    size: 3 + Math.round(r(3)),
    dur: 30 + r(4) * 30,
    delay: -r(5) * 60,
    o: 0.45 + r(6) * 0.25,
    dx: Math.round((r(7) - 0.5) * 12),
    dy: Math.round((r(8) - 0.35) * 56),
  };
});

export function PageBoard() {
  if (!AMBIENCE.board) return null;
  return (
    <div aria-hidden className="page-board">
      <span className="page-board-sweep" />
      {SPECKS.map((p, i) => (
        <span
          key={i}
          className="page-board-speck"
          style={
            {
              left: `${p.left.toFixed(1)}%`,
              top: `${p.top.toFixed(1)}%`,
              width: p.size,
              height: p.size,
              "--o": p.o.toFixed(2),
              "--dx": `${p.dx}vw`,
              "--dy": `${p.dy}vh`,
              animationDuration: `${p.dur.toFixed(1)}s`,
              animationDelay: `${p.delay.toFixed(1)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
