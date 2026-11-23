import type { CSSProperties } from "react";
import { AMBIENCE } from "@config/ambience";
import { brand } from "@config/brand";

/**
 * The chalk corner under the hero figure (desktop width only): short notes that are written, held and wiped away in
 * turn, the smudges the eraser leaves, chalk dust settling on a tray, and a paper note pinned at one corner. Purely
 * decorative and hidden from assistive technology. The notes repeat statements the page already makes in plain text;
 * they carry no figures, no status and no approval. Without animation (reduced motion, Pause motion) the first note
 * of each line is shown whole and the rest rests out of sight. Switches are in config/ambience.ts (chalk, fall, flutter).
 *
 * Each line shows two notes in turn (a = first half of the cycle, b = second half). A line is written with a stepped
 * clip (one step per character), held, and wiped from the left. The clip and the note are the only things that move.
 */
const LINES = [
  { top: "0.25rem", delay: 0, a: "Mock mode: no real funds move.", b: `${brand.name} does not take custody.` },
  { top: "2.5rem", delay: 2.5, a: "Mainnet is gated.", b: "Disclosures first." },
];

const FALLS = Array.from({ length: 8 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9.1337 + n * 41.713) * 24634.6345;
    return x - Math.floor(x);
  };
  return { left: 2 + r(1) * 60, top: 6 + r(2) * 34, size: 1 + Math.round(r(3)), dur: 12 + r(4) * 12, delay: -r(5) * 20, o: 0.3 + r(6) * 0.2, dx: Math.round((r(7) - 0.5) * 24) };
});

export function ChalkBoard() {
  return (
    <div aria-hidden className="chalk-board">
      {AMBIENCE.chalk &&
        LINES.map((l) => (
          <div key={l.top}>
            <span className="chalk-smudge" style={{ top: `calc(${l.top} - 0.4rem)`, animationDelay: `${l.delay}s` }} />
            {[l.a, l.b].map((text, k) => (
              <span
                key={k}
                className="chalk-line"
                data-b={k === 1 ? "" : undefined}
                style={{ top: l.top, "--n": text.length, animationDelay: `${l.delay + k * 18}s` } as CSSProperties}
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      {AMBIENCE.fall && (
        <>
          {FALLS.map((f, i) => (
            <span
              key={i}
              className="chalk-fall"
              style={
                {
                  left: `${f.left.toFixed(1)}%`,
                  top: `${f.top.toFixed(1)}%`,
                  width: f.size,
                  height: f.size,
                  "--o": f.o.toFixed(2),
                  "--dx": `${f.dx}px`,
                  "--fd": "6.5rem",
                  animationDuration: `${f.dur.toFixed(1)}s`,
                  animationDelay: `${f.delay.toFixed(1)}s`,
                } as CSSProperties
              }
            />
          ))}
          <span className="chalk-tray" />
        </>
      )}
      {AMBIENCE.flutter && (
        <div className="chalk-note paper">
          <span className="chalk-pin" />
          <span className="chalk-note-label">Sample note</span>
        </div>
      )}
    </div>
  );
}
