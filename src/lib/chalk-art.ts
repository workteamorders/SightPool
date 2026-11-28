/**
 * The chalk drawings, as strokes. Pure functions, no DOM: given a random source and the room available, they return
 * a drawing made of strokes in the order a hand would make them. chalk-writer.tsx draws them on the board.
 *
 * Everything is made to look hand made, not vector clean: lines wobble, boxes are four separate strokes that overshoot
 * their corners, circles do not quite close, shapes are traced twice with a thinner second pass, and letters come
 * from a single-line block hand (below), capitals only, each one a little different in size, slant and height. The drawings are generic
 * textbook sketches of how a blockchain is put together: no figures, no live data, no claim about this product.
 */
export type Rng = () => number;
type Pt = [number, number];

/** One stroke: its path, the same stroke traced a second time (shapes only), and its length in px (for timing). */
export type Stroke = { d: string; d2?: string; len: number; kind: "shape" | "letter" };
export type Art = { name: string; words: string; w: number; h: number; strokes: Stroke[] };

const f = (n: number) => n.toFixed(1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const j = (r: Rng, a: number) => (r() - 0.5) * 2 * a;
const pathLen = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + dist(pts[i - 1]!, p) : 0), 0);

/** A smooth curve through the points (Catmull-Rom turned into cubic curves). */
function smooth(pts: Pt[]): string {
  const p = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]!;
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** A hand-drawn run from a to b: a few points, each pushed a little off the line. */
function run(r: Rng, a: Pt, b: Pt, amp = 0.9): Pt[] {
  const n = Math.max(2, Math.ceil(dist(a, b) / 15));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const edge = i === 0 || i === n ? 0.4 : 1;
    return [lerp(a[0], b[0], t) + j(r, amp) * edge, lerp(a[1], b[1], t) + j(r, amp) * edge] as Pt;
  });
}

function line(r: Rng, a: Pt, b: Pt): Stroke {
  const main = run(r, a, b);
  const echo = run(r, [a[0] + j(r, 1), a[1] + j(r, 1)], [b[0] + j(r, 1), b[1] + j(r, 1)], 1.1);
  return { d: smooth(main), d2: smooth(echo), len: pathLen(main), kind: "shape" };
}
function arrow(r: Rng, a: Pt, b: Pt): Stroke {
  const main = run(r, a, b);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const head = (da: number) => `M${f(b[0])} ${f(b[1])} L${f(b[0] - 6 * Math.cos(ang + da) + j(r, 0.6))} ${f(b[1] - 6 * Math.sin(ang + da) + j(r, 0.6))}`;
  return { d: `${smooth(main)} ${head(0.45)} ${head(-0.45)}`, len: pathLen(main) + 12, kind: "shape" };
}
/** A box as four separate strokes, each overshooting its corner a little, like a hand. */
function box(r: Rng, x: number, y: number, w: number, h: number): Stroke[] {
  const o = () => 1 + r() * 2.2;
  const tl: Pt = [x, y], tr: Pt = [x + w, y], br: Pt = [x + w, y + h], bl: Pt = [x, y + h];
  return [
    line(r, [tl[0] - o(), tl[1] + j(r, 0.8)], [tr[0] + o(), tr[1] + j(r, 0.8)]),
    line(r, [tr[0] + j(r, 0.8), tr[1] - o()], [br[0] + j(r, 0.8), br[1] + o()]),
    line(r, [br[0] + o(), br[1] + j(r, 0.8)], [bl[0] - o(), bl[1] + j(r, 0.8)]),
    line(r, [bl[0] + j(r, 0.8), bl[1] + o()], [tl[0] + j(r, 0.8), tl[1] - o()]),
  ];
}
/** A circle or oval that does not quite close and overshoots where it started. */
function ring(r: Rng, cx: number, cy: number, rx: number, ry: number): Stroke {
  const trace = (amp: number) => {
    const start = r() * Math.PI * 2;
    const n = 11;
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const a = start + (i / n) * Math.PI * 2 * 1.08;
      return [cx + Math.cos(a) * (rx + j(r, amp)), cy + Math.sin(a) * (ry + j(r, amp))] as Pt;
    });
    return pts;
  };
  const main = trace(0.8);
  return { d: smooth(main), d2: smooth(trace(1.1)), len: Math.PI * (rx + ry) * 1.08, kind: "shape" };
}
function wave(r: Rng, x: number, y: number, w: number): Stroke {
  const n = Math.max(3, Math.round(w / 12));
  const pts = Array.from({ length: n + 1 }, (_, i) => [x + (i * w) / n + j(r, 0.8), y + (i % 2 ? -3.5 : 3.5) + j(r, 0.8)] as Pt);
  return { d: smooth(pts), len: w * 1.15, kind: "shape" };
}

/* ---- The hand: single-line block capitals, like chalk on a school board. y runs down: 0 is the top, 12 the baseline. ---- */
type Glyph = { adv: number; s: Pt[][] };
const O: Pt[] = [[4, 0.5], [1.5, 2.5], [1, 6], [1.5, 10], [4, 11.8], [6.5, 10], [7.2, 6], [6.5, 2.5], [4, 0.5]];
const G: Record<string, Glyph> = {
  A: { adv: 9, s: [[[0.5, 12], [4, 0.5], [7.5, 12]], [[2, 7.8], [6.3, 7.5]]] },
  B: { adv: 8, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [4.5, 0.5], [6.2, 2], [5.8, 4.8], [3.5, 5.8], [1, 6]], [[1, 6], [4.5, 6], [7, 7.8], [6.8, 10.5], [4.5, 12], [1, 11.8]]] },
  C: { adv: 8, s: [[[7, 2], [5, 0.5], [2.5, 1], [1, 4], [1, 8], [2.5, 11], [5, 11.8], [7, 10.3]]] },
  D: { adv: 8, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [4.5, 0.8], [7, 3.5], [7.2, 8], [5, 11.5], [1, 11.8]]] },
  E: { adv: 7, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [6.5, 0.8]], [[1, 6.2], [5.5, 6]], [[1, 11.8], [6.8, 12]]] },
  F: { adv: 7, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [6.5, 0.5]], [[1, 6.2], [5.2, 6]]] },
  G: { adv: 8, s: [[[7, 2], [5, 0.5], [2.5, 1], [1, 4], [1, 8], [2.5, 11], [5, 11.8], [7, 10], [7, 7], [4.5, 7]]] },
  H: { adv: 8, s: [[[1, 0.5], [1, 12]], [[7, 0.5], [7, 12]], [[1, 6.2], [7, 6]]] },
  I: { adv: 6, s: [[[3, 0.5], [3, 12]], [[0.8, 0.6], [5.2, 0.6]], [[0.8, 11.8], [5.2, 11.8]]] },
  J: { adv: 6, s: [[[5, 0.5], [5, 9], [3.8, 11.5], [1.8, 11.8], [0.8, 10.5]], [[2.5, 0.6], [6.5, 0.6]]] },
  K: { adv: 8, s: [[[1, 0.5], [1, 12]], [[7, 0.5], [1.3, 7]], [[3, 5.2], [7.2, 12]]] },
  L: { adv: 7, s: [[[1, 0.5], [1, 12], [6.5, 11.8]]] },
  M: { adv: 10, s: [[[0.8, 12], [1, 0.5], [5, 8.5], [9, 0.5], [9.2, 12]]] },
  N: { adv: 8, s: [[[1, 12], [1, 0.5], [7, 12], [7, 0.5]]] },
  O: { adv: 8, s: [O] },
  P: { adv: 7, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [4.5, 0.5], [6.5, 2], [6.3, 5], [4, 6.5], [1, 6.5]]] },
  Q: { adv: 9, s: [O, [[5, 9], [8, 12.5]]] },
  R: { adv: 8, s: [[[1, 0.5], [1, 12]], [[1, 0.8], [4.5, 0.5], [6.5, 2], [6.3, 5], [4, 6.5], [1, 6.5]], [[3.5, 6.5], [7, 12]]] },
  S: { adv: 7, s: [[[6.5, 2], [4.5, 0.5], [2, 1], [1.2, 3], [2.5, 5], [5, 6.5], [6.5, 8.5], [5.8, 11], [3.5, 12], [1, 10.8]]] },
  T: { adv: 7, s: [[[0.5, 0.6], [6.8, 0.6]], [[3.7, 0.6], [3.7, 12]]] },
  U: { adv: 8, s: [[[1, 0.5], [1, 8.5], [2.5, 11.5], [4.5, 12], [6.5, 10.5], [7, 8.5], [7, 0.5]]] },
  V: { adv: 8, s: [[[0.5, 0.5], [4, 12], [7.5, 0.5]]] },
  W: { adv: 11, s: [[[0.5, 0.5], [3, 12], [5.5, 3], [8, 12], [10.5, 0.5]]] },
  X: { adv: 8, s: [[[0.8, 0.5], [7, 12]], [[7, 0.5], [0.8, 12]]] },
  Y: { adv: 8, s: [[[0.5, 0.5], [4, 6.5]], [[7.5, 0.5], [4, 6.5], [3.5, 12]]] },
  Z: { adv: 8, s: [[[0.8, 0.6], [7, 0.6], [1, 12], [7.2, 11.8]]] },
  "-": { adv: 7, s: [[[1, 7], [5.5, 7]]] },
  "+": { adv: 8, s: [[[1, 7], [6.5, 7]], [[3.75, 3.5], [3.75, 10.5]]] },
  "(": { adv: 5, s: [[[4, 0], [2, 4], [1.8, 9], [3, 13]]] },
  ")": { adv: 5, s: [[[1, 0], [3, 4], [3.2, 9], [2, 13]]] },
  ".": { adv: 5, s: [[[1.2, 10.6], [1.5, 12]]] },
  "1": { adv: 6, s: [[[1.5, 2.5], [3.5, 0.5], [3.5, 12]]] },
};
const SPACE = 5;
/** The capitals are drawn this much larger than the size a drawing asks for (they need room for the thick chalk). */
const LS = 1.2;

/** The width of a text in px at a size. */
export const textWidth = (s: string, size = 1) => [...s.toUpperCase()].reduce((w, c) => w + (c === " " ? SPACE : (G[c]?.adv ?? 8)), 0) * size * LS;

/** A text, written letter by letter. Each letter is one stroke path (all its lines in turn) and a second thinner pass, a little different each time. */
function write(r: Rng, s: string, x: number, base: number, size = 1): Stroke[] {
  const out: Stroke[] = [];
  let cx = x;
  const sz = size * LS;
  for (const c of s.toUpperCase()) {
    const g = G[c];
    if (c === " " || !g) {
      cx += SPACE * sz;
      continue;
    }
    const sc = sz * (0.92 + r() * 0.16);
    const rot = j(r, 0.09);
    const dy = j(r, 0.9);
    const pivot: Pt = [cx + g.adv * 0.4 * sc, base];
    const trace = (amp: number) =>
      g.s.map((st) =>
        st.map(([gx, gy]): Pt => {
          const px = cx + gx * sc + j(r, amp);
          const py = base + (gy - 12) * sc + dy + j(r, amp);
          const dx = px - pivot[0], dyy = py - pivot[1];
          return [pivot[0] + dx * Math.cos(rot) - dyy * Math.sin(rot) + 0.5 * sc * (12 - gy) * 0.06, pivot[1] + dx * Math.sin(rot) + dyy * Math.cos(rot)];
        }),
      );
    const main = trace(0.35);
    const echo = trace(0.7);
    out.push({ d: main.map(smooth).join(" "), d2: echo.map(smooth).join(" "), len: main.reduce((t, st) => t + pathLen(st), 0), kind: "letter" });
    cx += g.adv * sz + 1 + j(r, 0.6);
  }
  return out;
}

/* ---- The drawings ---- */
const VOCAB = [
  "block", "hash", "chain", "ledger", "node", "peer", "nonce", "merkle", "root", "leaf", "fork", "genesis", "validator",
  "consensus", "timestamp", "signature", "public key", "mempool", "finality", "epoch", "slot", "header", "digest", "proof", "state", "gas",
];
const FIELDS = ["parent hash", "merkle root", "timestamp", "nonce", "height", "version"];

type Maker = { name: string; w: number; make: (r: Rng, maxW: number) => Omit<Art, "name" | "w"> & { w?: number } };

const chain: Maker = {
  name: "chain",
  w: 84,
  make: (r) => {
    const labels = ["block n-1", "block n", "block n+1"];
    const s: Stroke[] = [];
    labels.forEach((t, i) => {
      s.push(...box(r, 4, 4 + i * 46, 76, 30));
      s.push(...write(r, t, 13, 24 + i * 46, 0.7));
      if (i < 2) s.push(arrow(r, [42, 50 + i * 46], [42, 35 + i * 46]));
    });
    return { words: labels.join(" "), h: 128, strokes: s };
  },
};
const hashFn: Maker = {
  name: "hash",
  w: 84,
  make: (r) => {
    const s: Stroke[] = [...write(r, "input", 6, 14, 0.85), arrow(r, [26, 20], [26, 35]), ring(r, 26, 49, 14, 13), ...write(r, "h()", 17, 54, 0.8), arrow(r, [26, 63], [26, 83]), ...box(r, 4, 85, 70, 24), ...write(r, "digest", 10, 102, 0.85)];
    return { words: "input h digest", h: 114, strokes: s };
  },
};
const nodes: Maker = {
  name: "nodes",
  w: 84,
  make: (r) => {
    const c: Pt[] = [[14, 16], [62, 12], [38, 44], [12, 70], [66, 68]];
    const s: Stroke[] = [];
    for (const [a, b] of [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4]] as const) {
      const pa = c[a]!, pb = c[b]!;
      const ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
      s.push(line(r, [pa[0] + Math.cos(ang) * 8, pa[1] + Math.sin(ang) * 8], [pb[0] - Math.cos(ang) * 8, pb[1] - Math.sin(ang) * 8]));
    }
    for (const p of c) s.push(ring(r, p[0], p[1], 7, 7));
    s.push(...write(r, "nodes", 18, 100, 0.85));
    return { words: "nodes", h: 104, strokes: s };
  },
};
const fork: Maker = {
  name: "fork",
  w: 84,
  make: (r) => {
    const s: Stroke[] = [...box(r, 2, 38, 18, 14), arrow(r, [21, 45], [27, 45]), ...box(r, 28, 38, 18, 14), arrow(r, [47, 42], [56, 26]), ...box(r, 57, 14, 22, 14), arrow(r, [47, 49], [56, 64]), ...box(r, 57, 58, 22, 14), ...write(r, "fork", 24, 98, 0.9)];
    return { words: "fork", h: 104, strokes: s };
  },
};
const signature: Maker = {
  name: "signature",
  w: 84,
  make: (r) => {
    const s: Stroke[] = [...write(r, "message", 4, 14, 0.8), arrow(r, [30, 20], [30, 34]), ...box(r, 6, 36, 48, 22), ...write(r, "sign", 13, 53, 0.85), arrow(r, [30, 60], [30, 76]), ...write(r, "signature", 2, 94, 0.72)];
    return { words: "message sign signature", h: 102, strokes: s };
  },
};
const pipeline: Maker = {
  name: "pipeline",
  w: 84,
  make: (r) => {
    const labels = ["mempool", "block", "chain"];
    const s: Stroke[] = [];
    labels.forEach((t, i) => {
      s.push(...box(r, 4, 4 + i * 38, 76, 24));
      s.push(...write(r, t, 12, 22 + i * 38, 0.8));
      if (i < 2) s.push(arrow(r, [42, 30 + i * 38], [42, 42 + i * 38]));
    });
    return { words: labels.join(" "), h: 108, strokes: s };
  },
};
const genesis: Maker = {
  name: "genesis",
  w: 84,
  make: (r) => {
    const s: Stroke[] = [...box(r, 4, 4, 76, 26), ...write(r, "genesis", 10, 23, 0.85), arrow(r, [42, 31], [42, 46]), ...box(r, 4, 48, 76, 26), ...write(r, "...", 32, 66, 1.1)];
    return { words: "genesis", h: 78, strokes: s };
  },
};
const merkle: Maker = {
  name: "merkle",
  w: 108,
  make: (r) => {
    const s: Stroke[] = [...write(r, "merkle root", 8, 12, 0.8), ring(r, 54, 26, 6, 6), line(r, [52, 32], [32, 46]), line(r, [56, 32], [76, 46]), ring(r, 30, 52, 6, 6), ring(r, 78, 52, 6, 6), line(r, [28, 58], [18, 82]), line(r, [32, 58], [42, 82]), line(r, [76, 58], [66, 82]), line(r, [80, 58], [90, 82])];
    for (const x of [13, 37, 61, 85]) s.push(...box(r, x, 83, 10, 10));
    s.push(...write(r, "leaves", 32, 114, 0.85));
    return { words: "merkle root leaves", h: 122, strokes: s };
  },
};
const header: Maker = {
  name: "header",
  w: 108,
  make: (r) => {
    const pool = [...FIELDS].sort(() => r() - 0.5).slice(0, 4);
    const s: Stroke[] = [...box(r, 2, 2, 104, 98)];
    pool.forEach((t, i) => {
      s.push(...write(r, t, 8, 20 + i * 24, 0.82));
      if (i < 3) s.push(line(r, [2, 27 + i * 24], [106, 27 + i * 24]));
    });
    return { words: pool.join(" "), h: 104, strokes: s };
  },
};
const links: Maker = {
  name: "links",
  w: 108,
  make: (r) => {
    const s: Stroke[] = [18, 42, 66, 90].map((x) => ring(r, x, 24, 12, 8));
    s.push(...write(r, "ledger", 22, 58, 0.85));
    return { words: "ledger", h: 66, strokes: s };
  },
};
/** Two or three words from the vocabulary, each marked in its own way: underline, wave, circle, arrow. */
const words: Maker = {
  name: "words",
  w: 84,
  make: (r, maxW) => {
    const picks: string[] = [];
    const pool = [...VOCAB].sort(() => r() - 0.5);
    const count = 2 + (r() < 0.5 ? 1 : 0);
    for (const w of pool) {
      if (picks.length === count) break;
      if (textWidth(w, 0.7) <= maxW - 8) picks.push(w);
    }
    const s: Stroke[] = [];
    picks.forEach((w, i) => {
      const y = 18 + i * 34;
      const size = Math.min(1, (maxW - 8) / textWidth(w, 1));
      const wd = textWidth(w, size);
      s.push(...write(r, w, 3, y, size));
      const mark = Math.floor(r() * 4);
      if (mark === 0) s.push(line(r, [2, y + 7], [wd + 4, y + 7]));
      else if (mark === 1) s.push(wave(r, 2, y + 9, Math.min(wd, 60)));
      else if (mark === 2) s.push(ring(r, wd / 2 + 3, y - 6, wd / 2 + 6, 13));
      else if (i < picks.length - 1) s.push(arrow(r, [wd / 2, y + 7], [wd / 2, y + 22]));
      else s.push(line(r, [2, y + 7], [wd + 4, y + 7]));
    });
    return { words: picks.join(" "), w: maxW, h: picks.length * 34 + 8, strokes: s };
  },
};

const LIBRARY: Maker[] = [chain, hashFn, nodes, fork, signature, pipeline, genesis, merkle, header, links, words, words];

/** A drawing that fits the room, avoiding the kinds given (the previous one in that place, and those on show nearby). */
export function pickArt(r: Rng, maxW: number, avoid: string[] = []): Art {
  const fits = LIBRARY.filter((m) => m.w <= maxW);
  const options = fits.filter((m) => !avoid.includes(m.name));
  const m = (options.length ? options : fits)[Math.floor(r() * (options.length || fits.length))]!;
  const made = m.make(r, maxW);
  return { name: m.name, w: made.w ?? m.w, words: made.words, h: made.h, strokes: made.strokes };
}
