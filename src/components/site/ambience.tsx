import type { CSSProperties } from "react";

/**
 * The live background behind the landing hero: a desk lamp's beam that sways very slowly, and a few specks of
 * dust drifting through it. Pure CSS, composited properties only (transform, opacity), no script, no network.
 * Decorative and hidden from assistive technology. It stops under prefers-reduced-motion, and fewer specks show
 * on small screens. The specks are placed from a fixed formula, so the markup is the same on every build.
 */
const MOTES = Array.from({ length: 24 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: 34 + r(1) * 64,
    top: 6 + r(2) * 84,
    size: 1 + Math.round(r(3) * 2),
    dur: 22 + r(4) * 26,
    delay: -r(5) * 40,
    o: 0.2 + r(6) * 0.22,
    dx: Math.round((r(7) - 0.5) * 64),
  };
});

export function Ambience() {
  return (
    <div aria-hidden className="ambience">
      <div className="ambience-beam" />
      <div className="ambience-glow" />
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="ambience-mote"
          style={
            {
              left: `${m.left.toFixed(1)}%`,
              top: `${m.top.toFixed(1)}%`,
              width: m.size,
              height: m.size,
              "--o": m.o.toFixed(2),
              "--dx": `${m.dx}px`,
              animationDuration: `${m.dur.toFixed(1)}s`,
              animationDelay: `${m.delay.toFixed(1)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
