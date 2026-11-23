import type { CSSProperties } from "react";
import { AMBIENCE } from "@config/ambience";
import { ArchiveClock } from "@/components/site/archive-clock";

/**
 * The live background behind the landing hero, as markup only. Motion is CSS (transform and opacity, plus one
 * scale for drawn lines, plus the `translate` that hero-motion.tsx writes); the one small script is hero-motion.tsx. Everything here is decorative and hidden from
 * assistive technology, and every layer is already in its resting state without animation, so the picture is complete
 * when motion is off. Switches are in config/ambience.ts, dials in tokens.css (--amb-*).
 *
 *   light      lamp cone, soft glow, and a shade that drifts behind the folder (about 26s per sway)
 *   dust       specks drifting through the light
 *   fall       chalk dust falling slowly (6 specks on small screens); chalk-board.tsx adds a tray and more specks
 *   marker     a small square that travels up and down the ruler without pause (with the ruler, wide screens)
 *   clock      a UTC clock from the visitor's browser (tablet width up), labelled "Clock"
 *   sightlines a static ruler with coordinate marks, and one line traced now and then with a small marker. It
 *              runs along the top of the hero, clear of the receipt and every value on it.
 *
 * Specks are placed by a fixed formula, so the markup is identical on every build.
 */
const MOTES = Array.from({ length: 26 }, (_, i) => {
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
    o: 0.3 + r(6) * 0.2,
    dx: Math.round((r(7) - 0.5) * 64),
  };
});

/** Chalk dust falling slowly, scattered across the hero (6 on small screens). */
const FALLS = Array.from({ length: 12 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 7.3141 + n * 53.119) * 31415.9265;
    return x - Math.floor(x);
  };
  return { left: 4 + r(1) * 92, top: 4 + r(2) * 70, size: 1 + Math.round(r(3)), dur: 16 + r(4) * 16, delay: -r(5) * 30, o: 0.25 + r(6) * 0.2, dx: Math.round((r(7) - 0.5) * 30) };
});

export function Ambience() {
  return (
    <div aria-hidden className="ambience">
      <div className="amb-scroll" data-scroll>
        {AMBIENCE.light && (
          <div className="amb-in amb-in-light">
            <div className="ambience-shade" />
            <div className="ambience-beam" />
            <div className="ambience-glow" />
          </div>
        )}
        {AMBIENCE.dust && (
          <div className="amb-in amb-in-dust">
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
        )}
        {AMBIENCE.fall && (
          <div className="amb-in amb-in-dust">
            {FALLS.map((f, i) => (
              <span
                key={i}
                className="ambience-fall"
                style={
                  {
                    left: `${f.left.toFixed(1)}%`,
                    top: `${f.top.toFixed(1)}%`,
                    width: f.size,
                    height: f.size,
                    "--o": f.o.toFixed(2),
                    "--dx": `${f.dx}px`,
                    animationDuration: `${f.dur.toFixed(1)}s`,
                    animationDelay: `${f.delay.toFixed(1)}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
        {AMBIENCE.sightlines && (
          <>
            <div className="sl-ruler">
              <span className="sl-label" style={{ top: 0 }}>y 00</span>
              <span className="sl-label" style={{ top: "9rem" }}>y 20</span>
              <span className="sl-label" style={{ top: "18rem" }}>y 40</span>
              {AMBIENCE.marker && <span className="sl-ruler-marker" />}
            </div>
            <div className="sl-run">
              <div className="sl-run-line" />
              <div className="sl-run-end" />
              <div className="sl-run-marker" />
            </div>
          </>
        )}
      </div>
      {AMBIENCE.clock && <ArchiveClock />}
    </div>
  );
}
