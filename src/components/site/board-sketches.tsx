import type { CSSProperties, ReactNode } from "react";
import { AMBIENCE } from "@config/ambience";

/**
 * Chalk sketches in the margins of the landing page (from 90rem wide, where the page leaves room beside its content):
 * abstract textbook drawings of how a blockchain is put together. They are part of the page, so they scroll with it
 * and are not fixed to the screen. Each one is drawn line by line, like chalk on a board: every stroke is drawn in
 * turn, from its start to its end, and every word is written letter by letter. When it is complete it is held, then
 * wiped away from the left, and drawn again later. sketch-draw.tsx starts the drawing when a sketch scrolls into view.
 * Without animation (reduced motion, Pause motion) they rest, fully drawn. Decorative and hidden from assistive
 * technology; they never overlap content; no figures, no live data, no claim about this product. The lines are
 * jittered a little so they look hand drawn; the jitter is deterministic, so server and browser draw the same thing.
 * Switch: config/ambience.ts (sketches). Look: .sketch in globals.css.
 */
type Item = { k: "p"; d: string; len: number } | { k: "t"; x: number; y: number; s: string };

const jit = (s: number, i: number, a = 1) => {
  const x = Math.sin(s * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * a;
};
const f = (n: number) => n.toFixed(1);
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

function box(x: number, y: number, w: number, h: number, s: number): Item {
  const p: [number, number][] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - 2]];
  return { k: "p", len: 2 * (w + h) + 2, d: "M" + p.map(([a, b], i) => `${f(a + jit(s, i * 2))} ${f(b + jit(s, i * 2 + 1))}`).join(" L") };
}
function line(x1: number, y1: number, x2: number, y2: number, s: number): Item {
  const mx = (x1 + x2) / 2 + jit(s, 1, 1.5);
  const my = (y1 + y2) / 2 + jit(s, 2, 1.5);
  return { k: "p", len: dist(x1, y1, x2, y2), d: `M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}` };
}
function arrow(x1: number, y1: number, x2: number, y2: number, s: number): Item {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (d: number) => `M${f(x2)} ${f(y2)} L${f(x2 - 5 * Math.cos(a + d))} ${f(y2 - 5 * Math.sin(a + d))}`;
  const l = line(x1, y1, x2, y2, s);
  return { k: "p", len: dist(x1, y1, x2, y2) + 10, d: `${l.k === "p" ? l.d : ""} ${head(0.5)} ${head(-0.5)}` };
}
function ring(cx: number, cy: number, rx: number, ry: number, s: number): Item {
  const j = jit(s, 3, 1);
  return { k: "p", len: Math.PI * (rx + ry), d: `M${f(cx - rx)} ${f(cy + j)} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0` };
}
const wave = (x: number, y: number): Item => ({ k: "p", len: 64, d: `M${x} ${y} q6 -5 12 0 t12 0 t12 0 t12 0 t12 0` });
const text = (x: number, y: number, s: string): Item => ({ k: "t", x, y, s });

type Art = { w: number; h: number; items: Item[] };

const chain: Art = {
  w: 84,
  h: 128,
  items: [
    box(4, 4, 76, 30, 10),
    text(12, 23, "block n-1"),
    arrow(42, 50, 42, 34, 21),
    box(4, 50, 76, 30, 11),
    text(12, 69, "block n"),
    arrow(42, 96, 42, 80, 22),
    box(4, 96, 76, 30, 12),
    text(12, 115, "block n+1"),
  ],
};
const words: Art = {
  w: 84,
  h: 58,
  items: [text(2, 14, "consensus"), wave(2, 22), text(2, 44, "timestamp"), line(2, 50, 66, 50, 31)],
};
const hashFn: Art = {
  w: 84,
  h: 112,
  items: [text(6, 12, "input"), arrow(26, 17, 26, 34, 41), ring(26, 48, 14, 13, 42), text(17, 52, "h()"), arrow(26, 62, 26, 82, 43), box(4, 84, 62, 22, 44), text(12, 99, "digest")],
};
const merkle: Art = {
  w: 108,
  h: 118,
  items: [
    text(14, 10, "merkle root"),
    ring(54, 24, 6, 6, 51),
    line(54, 30, 30, 46, 54),
    line(54, 30, 78, 46, 55),
    ring(30, 52, 6, 6, 52),
    ring(78, 52, 6, 6, 53),
    line(30, 58, 18, 82, 56),
    line(30, 58, 42, 82, 57),
    line(78, 58, 66, 82, 58),
    line(78, 58, 90, 82, 59),
    box(13, 82, 10, 10, 60),
    box(37, 82, 10, 10, 61),
    box(61, 82, 10, 10, 62),
    box(85, 82, 10, 10, 63),
    text(36, 110, "leaves"),
  ],
};
const header: Art = {
  w: 108,
  h: 94,
  items: [
    box(2, 2, 104, 88, 71),
    text(8, 18, "parent hash"),
    line(2, 24, 106, 24, 72),
    text(8, 40, "merkle root"),
    line(2, 46, 106, 46, 73),
    text(8, 62, "timestamp"),
    line(2, 68, 106, 68, 74),
    text(8, 84, "nonce"),
  ],
};
const links: Art = {
  w: 108,
  h: 60,
  items: [ring(18, 24, 12, 8, 81), ring(42, 24, 12, 8, 82), ring(66, 24, 12, 8, 83), ring(90, 24, 12, 8, 84), text(30, 52, "ledger")],
};

/** Where each sketch goes: a share of the page height, and the margin it sits in. Left sketches are at most 84px wide. */
const SKETCHES: { side: "left" | "right"; top: number; rot: number; art: Art }[] = [
  { side: "left", top: 6, rot: -1.5, art: chain },
  { side: "left", top: 21, rot: 1, art: words },
  { side: "left", top: 33, rot: -1, art: hashFn },
  { side: "left", top: 51, rot: 1.4, art: chain },
  { side: "left", top: 67, rot: -1.2, art: words },
  { side: "left", top: 82, rot: 1, art: hashFn },
  { side: "right", top: 10, rot: 1.2, art: merkle },
  { side: "right", top: 19, rot: -1, art: header },
  { side: "right", top: 40, rot: 1.5, art: links },
  { side: "right", top: 56, rot: -1.3, art: merkle },
  { side: "right", top: 72, rot: 1, art: header },
  { side: "right", top: 88, rot: -1.5, art: links },
];

/** Seconds: the speed of the chalk along a line, the time per letter, and the pause between strokes. */
const SPEED = 80;
const PER_LETTER = 0.09;
const PAUSE = 0.14;

function draw(art: Art): { nodes: ReactNode[]; total: number } {
  let t = 0.2;
  const nodes = art.items.map((it, i) => {
    if (it.k === "p") {
      const dur = Math.max(0.35, it.len / SPEED);
      const node = <path key={i} d={it.d} pathLength={1} style={{ "--d": `${t.toFixed(2)}s`, "--t": `${dur.toFixed(2)}s` } as CSSProperties} />;
      t += dur + PAUSE;
      return node;
    }
    const dur = Math.max(0.3, it.s.length * PER_LETTER);
    const node = (
      <text key={i} x={it.x} y={it.y} style={{ "--d": `${t.toFixed(2)}s`, "--t": `${dur.toFixed(2)}s`, "--n": it.s.length } as CSSProperties}>
        {it.s}
      </text>
    );
    t += dur + PAUSE;
    return node;
  });
  return { nodes, total: t };
}

export function BoardSketches() {
  if (!AMBIENCE.sketches) return null;
  return (
    <>
      {SKETCHES.map((s, i) => {
        const { nodes, total } = draw(s.art);
        return (
          <svg
            key={i}
            aria-hidden
            className="sketch"
            data-side={s.side}
            data-total={total.toFixed(1)}
            width={s.art.w}
            height={s.art.h}
            viewBox={`0 0 ${s.art.w} ${s.art.h}`}
            style={{ top: `${s.top}%`, "--rot": `${s.rot}deg` } as CSSProperties}
          >
            {nodes}
          </svg>
        );
      })}
    </>
  );
}
