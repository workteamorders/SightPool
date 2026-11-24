import type { CSSProperties, ReactNode } from "react";
import { AMBIENCE } from "@config/ambience";

/**
 * Chalk sketches in the margins of the board (from 90rem wide, where the page leaves room beside its content): six
 * abstract drawings of how a blockchain is put together, each written in turn, held, and wiped away. They sit in the
 * fixed board layer, so they stay in view while the page scrolls, and they never overlap the content. Decorative and
 * hidden from assistive technology. They are generic textbook sketches of the technology: no figures, no live data,
 * and nothing that describes this product, a pool, or any claim. Hand-drawn by jittering the lines a little; the jitter
 * is deterministic, so server and browser render the same drawing. Without animation they rest, fully drawn.
 * Switches: config/ambience.ts (sketches). Look: .sketch in globals.css.
 */
const jit = (s: number, i: number, a = 1) => {
  const x = Math.sin(s * 12.9898 + i * 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * a;
};
const f = (n: number) => n.toFixed(1);

function box(x: number, y: number, w: number, h: number, s: number) {
  const p: [number, number][] = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y - 2]];
  return "M" + p.map(([a, b], i) => `${f(a + jit(s, i * 2))} ${f(b + jit(s, i * 2 + 1))}`).join(" L");
}
function line(x1: number, y1: number, x2: number, y2: number, s: number) {
  const mx = (x1 + x2) / 2 + jit(s, 1, 1.5);
  const my = (y1 + y2) / 2 + jit(s, 2, 1.5);
  return `M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`;
}
function arrow(x1: number, y1: number, x2: number, y2: number, s: number) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (d: number) => `M${f(x2)} ${f(y2)} L${f(x2 - 5 * Math.cos(a + d))} ${f(y2 - 5 * Math.sin(a + d))}`;
  return `${line(x1, y1, x2, y2, s)} ${head(0.5)} ${head(-0.5)}`;
}
function ring(cx: number, cy: number, rx: number, ry: number, s: number) {
  const j = jit(s, 3, 1);
  return `M${f(cx - rx)} ${f(cy + j)} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
}
const P = (d: string, k: number) => <path key={k} d={d} />;

const chain = {
  w: 84,
  h: 128,
  body: (
    <>
      {[0, 1, 2].map((i) => P(box(4, 4 + i * 46, 76, 30, 10 + i), i))}
      {P(arrow(42, 50, 42, 34, 21), 3)}
      {P(arrow(42, 96, 42, 80, 22), 4)}
      <text x="12" y="23">block n-1</text>
      <text x="12" y="69">block n</text>
      <text x="12" y="115">block n+1</text>
    </>
  ),
};
const words = {
  w: 84,
  h: 58,
  body: (
    <>
      <text x="2" y="14">consensus</text>
      {P("M2 22 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0", 0)}
      <text x="2" y="44">timestamp</text>
      {P(line(2, 50, 66, 50, 31), 1)}
    </>
  ),
};
const hashFn = {
  w: 84,
  h: 112,
  body: (
    <>
      <text x="6" y="12">input</text>
      {P(arrow(26, 17, 26, 34, 41), 0)}
      {P(ring(26, 48, 14, 13, 42), 1)}
      <text x="17" y="52">h()</text>
      {P(arrow(26, 62, 26, 82, 43), 2)}
      {P(box(4, 84, 62, 22, 44), 3)}
      <text x="12" y="99">digest</text>
    </>
  ),
};
const merkle = {
  w: 108,
  h: 118,
  body: (
    <>
      <text x="14" y="10">merkle root</text>
      {P(ring(54, 24, 6, 6, 51), 0)}
      {P(ring(30, 52, 6, 6, 52), 1)}
      {P(ring(78, 52, 6, 6, 53), 2)}
      {P(line(54, 30, 30, 46, 54), 3)}
      {P(line(54, 30, 78, 46, 55), 4)}
      {P(line(30, 58, 18, 82, 56), 5)}
      {P(line(30, 58, 42, 82, 57), 6)}
      {P(line(78, 58, 66, 82, 58), 7)}
      {P(line(78, 58, 90, 82, 59), 8)}
      {[13, 37, 61, 85].map((x, i) => P(box(x, 82, 10, 10, 60 + i), 9 + i))}
      <text x="36" y="110">leaves</text>
    </>
  ),
};
const header = {
  w: 108,
  h: 94,
  body: (
    <>
      {P(box(2, 2, 104, 88, 71), 0)}
      {P(line(2, 24, 106, 24, 72), 1)}
      {P(line(2, 46, 106, 46, 73), 2)}
      {P(line(2, 68, 106, 68, 74), 3)}
      <text x="8" y="18">parent hash</text>
      <text x="8" y="40">merkle root</text>
      <text x="8" y="62">timestamp</text>
      <text x="8" y="84">nonce</text>
    </>
  ),
};
const links = {
  w: 108,
  h: 60,
  body: (
    <>
      {[18, 42, 66, 90].map((x, i) => P(ring(x, 24, 12, 8, 81 + i), i))}
      <text x="30" y="52">ledger</text>
    </>
  ),
};

type Sketch = { side: "left" | "right"; top: number; dur: number; delay: number; rot: number; art: { w: number; h: number; body: ReactNode } };
const SKETCHES: Sketch[] = [
  { side: "left", top: 17, dur: 54, delay: 0, rot: -1.5, art: chain },
  { side: "left", top: 35, dur: 46, delay: 9, rot: 1, art: words },
  { side: "left", top: 50, dur: 60, delay: 22, rot: -1, art: hashFn },
  { side: "right", top: 38, dur: 52, delay: 15, rot: 1.2, art: merkle },
  { side: "right", top: 61, dur: 58, delay: 4, rot: -1, art: header },
  { side: "right", top: 84, dur: 44, delay: 30, rot: 1.5, art: links },
];

export function BoardSketches() {
  if (!AMBIENCE.sketches) return null;
  return (
    <>
      {SKETCHES.map((s, i) => (
        <svg
          key={i}
          className="sketch"
          data-side={s.side}
          width={s.art.w}
          height={s.art.h}
          viewBox={`0 0 ${s.art.w} ${s.art.h}`}
          style={{ top: `${s.top}vh`, "--rot": `${s.rot}deg`, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` } as CSSProperties}
        >
          {s.art.body}
        </svg>
      ))}
    </>
  );
}
