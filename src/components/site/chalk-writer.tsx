"use client";
import { useEffect } from "react";
import { type Art, pickArt } from "@/lib/chalk-art";

/**
 * The hand behind the chalk drawings in the margins. It renders nothing itself; it fills the empty .sketch-slot
 * boxes that page-margins.tsx lays down. While a slot is on screen it runs a loop:
 *   draw   a new drawing, stroke by stroke, each word letter by letter (CSS does the drawing, from --d and --t),
 *   hold   the finished drawing stays for a while,
 *   wipe   a board eraser scrubs it away with many short slanted strokes, up and down, while the scrubbing moves on
 *          diagonally from the top left to the bottom right, the chalk disappearing behind it,
 *   ghost  what an eraser leaves: a powdery smudge along the old strokes and broad streaks where it passed,
 *   fade   the next drawing is chosen (never the same kind twice in a row, always with different words, a different
 *          hand, different wobble) and is written right over the smudge, which fades away underneath.
 * A slot that leaves the screen is emptied and waits; a drawing is made fresh when it returns. When motion is off
 * (reduced motion, Pause motion, hidden tab) there is no loop: each slot on screen simply shows a finished drawing.
 * The drawings themselves come from src/lib/chalk-art.ts.
 */
const NS = "http://www.w3.org/2000/svg";
const PAD = 6;
const SPEED = 95; // px of chalk per second along a shape
const SLANT = Math.tan((28 * Math.PI) / 180); // the scrubbing strokes lean like "/"
const STRIP = 6.5; // px between one scrubbing stroke and the next, along x
const STEP = 0.14; // seconds from the start of one scrubbing stroke to the start of the next
const STROKE = 0.17; // seconds one stroke takes, up or down
const erasing = new WeakMap<SVGSVGElement, Keyframe[]>(); // where the eraser goes, per drawing
const FADE = 7500; // how long the old smudge stays under the next drawing

let counter = 0;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function build(art: Art): SVGSVGElement {
  const id = `sk-m${counter++}`;
  const w = art.w + PAD * 2;
  const h = art.h + PAD * 2;
  const svg = svgEl("svg", { class: "sketch", "aria-hidden": "true", width: w, height: h, viewBox: `${-PAD} ${-PAD} ${w} ${h}` });
  svg.style.setProperty("--rot", `${((Math.random() - 0.5) * 3).toFixed(2)}deg`);
  svg.dataset.art = art.name;
  svg.dataset.words = art.words;

  // The wipe is many short strokes, each a slanted strip across the whole drawing that grows from one end (up, then
  // down, then up...) while the strips themselves move on from the left. In each strip a rect grows: black in the ink
  // mask (the chalk goes), white in the cover mask (the smudge appears where the chalk was). Each has its own start (--d).
  const reach = (h - 2 * PAD) * SLANT;
  let n = Math.max(9, Math.round((w + reach) / STRIP));
  if (n % 2 === 0) n += 1; // an odd count: the first stroke goes down from the top left, the last ends at the bottom right
  const pitch = (w + reach) / n;
  svg.dataset.wipe = String(Math.round((n * STEP + STROKE + 0.7) * 1000));
  svg.dataset.erase = String(Math.round((n * STEP + 0.3) * 1000)); // how long the eraser itself travels
  const mask = svgEl("mask", { id, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  mask.append(svgEl("rect", { x: -PAD, y: -PAD, width: w, height: h, fill: "#fff" }));
  const cover = svgEl("mask", { id: `${id}s`, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  const keys: Keyframe[] = [];
  const midY = -PAD + h / 2;
  for (let i = 0; i < n; i++) {
    const cx = -PAD - reach / 2 + (i + 0.5) * pitch;
    const down = i % 2 === 0;
    const d = `${(0.15 + i * STEP).toFixed(3)}s`;
    for (const [m, fill] of [[mask, "#000"], [cover, "#fff"]] as const) {
      const g = svgEl("g", { transform: `translate(${cx.toFixed(1)} ${midY.toFixed(1)}) skewX(-28)` });
      const r = svgEl("rect", { class: down ? "sk-scrub" : "sk-scrub up", x: (-pitch * 0.9).toFixed(1), y: -h / 2 - 1, width: (pitch * 1.8).toFixed(1), height: h + 2, fill });
      r.style.setProperty("--d", d);
      g.append(r);
      m.append(g);
    }
    // the eraser's way: the top end of a stroke leans right, the bottom end left
    const top = [cx + reach / 2, -PAD + 4];
    const bottom = [cx - reach / 2, -PAD + h - 4];
    const [from, to] = down ? [top, bottom] : [bottom, top];
    // one point per stroke, so the times only ever go forward: it starts at the top left, then every stroke ends where the next one begins
    const total = n * STEP + 0.3;
    if (i === 0) keys.push({ offset: 0.15 / total, transform: `translate(${from[0]!.toFixed(1)}px, ${from[1]!.toFixed(1)}px)` });
    keys.push({ offset: Math.min(1, (0.15 + (i + 1) * STEP) / total), transform: `translate(${to[0]!.toFixed(1)}px, ${to[1]!.toFixed(1)}px)` });
  }
  erasing.set(svg, keys);
  // the eraser: a felt block with a wooden back, leaning with the strokes
  const eraser = svgEl("g", { class: "sk-eraser" });
  const block = svgEl("g", { transform: "rotate(-62)" });
  block.append(
    svgEl("rect", { class: "eraser-felt", x: -13, y: -7, width: 26, height: 14, rx: 3 }),
    svgEl("rect", { class: "eraser-wood", x: -13, y: -7, width: 7, height: 14, rx: 2 }),
  );
  eraser.append(block);
  const defs = svgEl("defs");
  defs.append(mask, cover);
  svg.append(defs);
  const smudge = svgEl("g", { class: "sk-smudge", mask: `url(#${id}s)` });
  svg.append(smudge);

  // broad streaks along the strokes, where the eraser went: wider than the chalk and uneven, so the board looks wiped, not clean
  for (let i = 0, k = 4 + Math.floor(Math.random() * 4); i < k; i++) {
    const cx = -PAD - reach / 2 + Math.random() * (w + reach);
    const bend = (Math.random() - 0.5) * 8;
    const streak = svgEl("path", { class: "streak", d: `M${(cx - reach / 2).toFixed(1)} ${(-PAD + h - 3).toFixed(1)} Q${(cx + bend).toFixed(1)} ${midY.toFixed(1)} ${(cx + reach / 2).toFixed(1)} ${(-PAD + 3).toFixed(1)}` });
    streak.style.strokeWidth = `${(5 + Math.random() * 6).toFixed(1)}px`;
    smudge.append(streak);
  }

  const ink = svgEl("g", { class: "sk-ink", mask: `url(#${id})` });
  let t = 0.3;
  for (const s of art.strokes) {
    const dur = s.kind === "letter" ? Math.max(0.15, s.len / (SPEED * 1.1)) : Math.max(0.28, s.len / SPEED);
    for (const [d, cls] of [[s.d, "h"], [s.d, s.kind === "letter" ? "l" : ""], [s.d2, "b"]] as const) {
      if (!d) continue;
      const p = svgEl("path", { d, pathLength: 1 });
      if (cls) p.setAttribute("class", cls);
      p.style.setProperty("--d", `${t.toFixed(2)}s`);
      p.style.setProperty("--t", `${dur.toFixed(2)}s`);
      ink.append(p);
      if (cls === "h") smudge.append(svgEl("path", { d }));
    }
    t += dur + (s.kind === "letter" ? 0.03 : 0.1);
  }
  svg.dataset.total = t.toFixed(1);
  svg.append(ink);

  svg.append(eraser);
  return svg;
}

type Rect = { x: number; y: number; w: number; h: number };

export function ChalkWriter() {
  useEffect(() => {
    const box = document.querySelector<HTMLElement>(".page-margins");
    if (!box) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const wide = matchMedia("(min-width: 90rem)");
    const motionOn = () => !reduce.matches && document.documentElement.dataset.motion !== "paused" && !document.hidden;

    /** One hand at the board: it picks a place at random, writes there, wipes, and moves on to another place. */
    type Hand = { timer?: number; last: string; cur?: HTMLElement };
    const hands: Hand[] = [];
    const removals = new Set<number>();

    const geometry = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      const top0 = box.getBoundingClientRect().top + window.scrollY;
      // the margins beside the content (1096 px wide, centred): left of it, right of it
      const left = { lo: 76, hi: W / 2 - 556 };
      const right = { lo: W / 2 + 556, hi: W - 36 };
      return { W, H, top0, left, right };
    };
    const taken = (): Rect[] => {
      // chalk still on the board is avoided; the dust of an old drawing is not (a new one may be written over it)
      const out: Rect[] = Array.from(box.querySelectorAll<HTMLElement>(".sketch-slot"))
        .filter((e) => !["ghost", "fade"].includes((e.firstElementChild as SVGElement | null)?.dataset.phase ?? ""))
        .map((e) => ({ x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight }));
      const note = box.querySelector<HTMLElement>(".board-note");
      if (note) out.push({ x: note.offsetLeft, y: note.offsetTop, w: note.offsetWidth + 10, h: note.offsetHeight + 24 });
      return out;
    };
    const clash = (a: Rect, b: Rect, pad = 14) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

    /** A random free place for a drawing of this size on this side, near the part of the page on screen. */
    const spot = (side: "left" | "right", w: number, h: number): { x: number; y: number } | null => {
      const g = geometry();
      const r = side === "left" ? g.left : g.right;
      if (r.hi - r.lo < w) return null;
      const viewTop = window.scrollY - g.top0;
      const yMin = Math.max(0, viewTop + 72); // the sticky header covers the top of the screen
      const yMax = Math.min(g.H - h - 8, viewTop + window.innerHeight - h - 8);
      if (yMax <= yMin) return null;
      const others = taken();
      for (let i = 0; i < 40; i++) {
        const x = r.lo + Math.random() * (r.hi - r.lo - w);
        const y = yMin + Math.random() * (yMax - yMin);
        const frac = (y + h / 2) / g.H;
        if (frac > 0.226 && frac < 0.284) continue; // the status strip runs across the page here
        if (side === "right" && y < g.H * 0.13) continue; // the hero ruler and clock fill the top right
        const me = { x, y, w, h };
        if (!others.some((o) => clash(me, o))) return { x, y };
      }
      return null;
    };

    const make = (hand: Hand, side: "left" | "right", still: boolean) => {
      const g = geometry();
      const room = Math.min(108, Math.floor((side === "left" ? g.left : g.right).hi - (side === "left" ? g.left : g.right).lo));
      const onShow = Array.from(box.querySelectorAll<HTMLElement>(".sketch")).map((e) => e.dataset.art ?? "");
      const art = pickArt(Math.random, room, [hand.last, ...onShow]);
      const at = spot(side, art.w, art.h);
      if (!at) return null;
      hand.last = art.name;
      const slot = document.createElement("div");
      slot.className = "sketch-slot";
      slot.dataset.side = side;
      slot.style.left = `${at.x.toFixed(0)}px`;
      slot.style.top = `${at.y.toFixed(0)}px`;
      slot.style.width = `${art.w}px`;
      slot.style.height = `${art.h}px`;
      const svg = build(art);
      slot.append(svg);
      box.append(slot);
      if (!still) svg.dataset.phase = "draw";
      return { slot, svg };
    };

    const later = (hand: Hand, ms: number, fn: () => void) => {
      hand.timer = window.setTimeout(() => {
        hand.timer = undefined;
        fn();
      }, ms);
    };

    const run = (hand: Hand) => {
      if (!motionOn() || !wide.matches) return;
      const sides: ("left" | "right")[] = Math.random() < 0.5 ? ["left", "right"] : ["right", "left"];
      const made = make(hand, sides[0]!, false) ?? make(hand, sides[1]!, false);
      if (!made) return later(hand, 900 + Math.random() * 900, () => run(hand));
      const { slot, svg } = made;
      hand.cur = slot;
      later(hand, Number(svg.dataset.total) * 1000 + 300, () => {
        delete svg.dataset.phase; // finished, at rest
        later(hand, 2500 + Math.random() * 3500, () => {
          svg.dataset.phase = "wipe"; // the eraser scrubs it away, stroke after stroke
          const keys = erasing.get(svg);
          if (keys) svg.querySelector(".sk-eraser")?.animate(keys, { duration: Number(svg.dataset.erase), easing: "linear", fill: "both" });
          later(hand, Number(svg.dataset.wipe), () => {
            svg.dataset.phase = "ghost"; // the chalk dust stays where the drawing was
            later(hand, 2000 + Math.random() * 3000, () => {
              svg.dataset.phase = "fade";
              hand.cur = undefined;
              removals.add(window.setTimeout(() => slot.remove(), FADE));
              later(hand, 300 + Math.random() * 1400, () => run(hand));
            });
          });
        });
      });
    };

    const clear = () => {
      for (const h of hands) {
        window.clearTimeout(h.timer);
        h.timer = undefined;
        h.cur = undefined;
      }
      removals.forEach((t) => window.clearTimeout(t));
      removals.clear();
      box.querySelectorAll(".sketch-slot").forEach((e) => e.remove());
    };

    const count = () => (window.innerWidth >= 1840 ? 18 : 14);
    /** Motion off: finished drawings at random places on the screen, no cycle. */
    const scatter = () => {
      const g = geometry();
      const viewTop = window.scrollY - g.top0;
      for (const e of Array.from(box.querySelectorAll<HTMLElement>(".sketch-slot"))) {
        if (e.offsetTop + e.offsetHeight < viewTop - 200 || e.offsetTop > viewTop + window.innerHeight + 200) e.remove();
      }
      const have = box.querySelectorAll(".sketch-slot").length;
      const spare: Hand = { last: "" };
      for (let i = have; i < count(); i++) make(spare, Math.random() < 0.5 ? "left" : "right", true) ?? make(spare, Math.random() < 0.5 ? "left" : "right", true);
    };

    let started = false;
    const begin = () => {
      clear();
      started = false;
      if (!wide.matches) return;
      if (!motionOn()) {
        scatter();
        return;
      }
      started = true;
      while (hands.length < count()) hands.push({ last: "" });
      hands.length = count();
      hands.forEach((h) => later(h, Math.random() * 4000, () => run(h)));
    };

    // keep the hands near the screen: one whose drawing has scrolled far out of sight starts again where the reader is
    let queued = 0;
    const onScroll = () => {
      if (queued || !wide.matches) return;
      queued = window.setTimeout(() => {
        queued = 0;
        if (!motionOn()) return scatter();
        const g = geometry();
        const viewTop = window.scrollY - g.top0;
        for (const h of hands) {
          const c = h.cur;
          if (!c || !c.isConnected) continue;
          if (c.offsetTop + c.offsetHeight < viewTop - 150 || c.offsetTop > viewTop + window.innerHeight + 150) {
            window.clearTimeout(h.timer);
            c.remove();
            h.cur = undefined;
            later(h, Math.random() * 1200, () => run(h));
          }
        }
      }, 250);
    };
    let resizing = 0;
    const onResize = () => {
      window.clearTimeout(resizing);
      resizing = window.setTimeout(begin, 300);
    };

    begin();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("sp-motion", begin);
    document.addEventListener("visibilitychange", begin);
    reduce.addEventListener("change", begin);
    wide.addEventListener("change", begin);
    return () => {
      clear();
      window.clearTimeout(queued);
      window.clearTimeout(resizing);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("sp-motion", begin);
      document.removeEventListener("visibilitychange", begin);
      reduce.removeEventListener("change", begin);
      wide.removeEventListener("change", begin);
    };
  }, []);
  return null;
}
