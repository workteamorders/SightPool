"use client";
import { useEffect } from "react";
import { type Art, pickArt } from "@/lib/chalk-art";

/**
 * The hands behind the chalk drawings on the page background. It renders nothing itself: each hand puts a drawing at a
 * random free place anywhere on the page (between the text, never over it) and runs a loop:
 *   draw   a new drawing, stroke by stroke, each word letter by letter (CSS does the drawing, from --d and --t),
 *   hold   the finished drawing stays for a moment,
 *   wipe   a board eraser scrubs it away with many short slanted strokes, up and down, while the scrubbing moves on
 *          diagonally from the top left to the bottom right, the chalk disappearing behind it,
 *   ghost  what an eraser leaves: a powdery smudge along the old strokes and broad streaks where it passed,
 *   fade   the smudge fades where it was, and the hand starts again somewhere else (never the same kind twice in a
 *          row, different words, a different hand, a different size, different wobble).
 * Every drawing gets its own timing (writing speed, hold, scrubbing speed, how long the dust stays): all random, so no
 * two drawings are ever on the same clock. A hand whose drawing scrolls far out of sight starts again where the reader is.
 * When motion is off (reduced motion, Pause motion, hidden tab) there is no loop: finished drawings are scattered
 * over the screen. The drawings themselves come from src/lib/chalk-art.ts.
 */
const NS = "http://www.w3.org/2000/svg";
const PAD = 44; // room around a drawing for the eraser and its dust, which do not stay inside the drawing's box
const EX = 24; // how far the eraser goes past the drawing, top and bottom
const SPEED = 95; // px of chalk per second along a shape, times a random factor per drawing
const SLANT = Math.tan((28 * Math.PI) / 180); // the scrubbing strokes lean like "/"
const erasing = new WeakMap<SVGSVGElement, Keyframe[]>(); // where the eraser goes, per drawing

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
  // every drawing has its own clock
  const step0 = 0.06 + Math.random() * 0.045; // seconds from the start of one scrubbing stroke to the start of the next
  const strip = 5.5 + Math.random() * 2.5; // px between one scrubbing stroke and the next, along x
  const fade = 3500 + Math.random() * 3000; // ms the dust stays visible after the wipe
  svg.style.setProperty("--fade", `${(fade / 1000).toFixed(2)}s`);
  svg.dataset.fade = String(Math.round(fade));
  svg.dataset.hold = String(Math.round(600 + Math.random() * 1800)); // ms the finished drawing stays
  svg.dataset.ghost = String(Math.round(500 + Math.random() * 1700)); // ms the fresh dust is alone
  svg.dataset.gap = String(Math.round(150 + Math.random() * 850)); // ms before the hand starts again
  const aw = art.w;
  const ah = art.h;
  const reach = (ah + 2 * EX) * SLANT;
  let n = Math.max(9, Math.round((aw + 20 + reach) / strip));
  if (n % 2 === 0) n += 1; // an odd count: the first stroke goes down from the top left, the last ends at the bottom right
  const pitch = (aw + 20 + reach) / n;
  // a wide drawing is scrubbed faster still: the whole wipe has its own limit
  const step = Math.min(step0, (1.3 + Math.random() * 0.9) / n);
  const stroke = step * (1.15 + Math.random() * 0.3); // seconds one stroke takes, up or down
  svg.style.setProperty("--st", `${stroke.toFixed(3)}s`);
  svg.dataset.wipe = String(Math.round((n * step + stroke + 0.3) * 1000));
  svg.dataset.erase = String(Math.round((n * step + 0.3) * 1000)); // how long the eraser itself travels
  const mask = svgEl("mask", { id, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  mask.append(svgEl("rect", { x: -PAD, y: -PAD, width: w, height: h, fill: "#fff" }));
  const cover = svgEl("mask", { id: `${id}s`, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  const keys: Keyframe[] = [];
  const pos = (x: number, y: number) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  const total = n * step + 0.3;
  keys.push({ offset: 0, transform: pos(-30, -EX - 6) }); // it comes in from outside the drawing
  for (let i = 0; i < n; i++) {
    const cx = -10 - reach / 2 + (i + 0.5) * pitch;
    const down = i % 2 === 0;
    const d = `${(0.1 + i * step).toFixed(3)}s`;
    for (const [m, fill] of [[mask, "#000"], [cover, "#fff"]] as const) {
      const g = svgEl("g", { transform: `translate(${cx.toFixed(1)} ${(ah / 2).toFixed(1)}) skewX(-28)` });
      const r = svgEl("rect", { class: down ? "sk-scrub" : "sk-scrub up", x: (-pitch * 0.9).toFixed(1), y: -ah / 2 - EX - 1, width: (pitch * 1.8).toFixed(1), height: ah + 2 * EX + 2, fill });
      r.style.setProperty("--d", d);
      g.append(r);
      m.append(g);
    }
    // the eraser's way: past the drawing at both ends, the top end of a stroke leaning right, the bottom end left
    const over = () => EX * (0.5 + Math.random() * 0.7);
    const top = [cx + reach / 2, -over()];
    const bottom = [cx - reach / 2, ah + over()];
    const to = down ? bottom : top;
    keys.push({ offset: Math.min(0.995, (0.1 + (i + 1) * step) / total), transform: pos(to[0]!, to[1]!) });
  }
  keys.push({ offset: 1, transform: pos(aw + 36, ah + EX + 10) }); // and leaves again
  erasing.set(svg, keys);
  // the eraser: a felt block with a wooden back, leaning with the strokes; a real one is bigger than a letter
  const eraser = svgEl("g", { class: "sk-eraser" });
  const block = svgEl("g", { transform: "rotate(-62)" });
  block.append(
    svgEl("rect", { class: "eraser-felt", x: -20, y: -10, width: 40, height: 20, rx: 4 }),
    svgEl("rect", { class: "eraser-wood", x: -20, y: -10, width: 10, height: 20, rx: 3 }),
  );
  eraser.append(block);
  const defs = svgEl("defs");
  defs.append(mask, cover);
  svg.append(defs);
  const smudge = svgEl("g", { class: "sk-smudge", mask: `url(#${id}s)` });
  svg.append(smudge);

  // broad streaks along the strokes, where the eraser went: of different lengths, they stick out past the drawing here and there, so the dust has no box-shaped edge
  for (let i = 0, k = 6 + Math.floor(Math.random() * 5); i < k; i++) {
    const len = ah * (0.45 + Math.random() * 0.8);
    const cx = -4 + Math.random() * (aw + 8);
    const cy = ah * (0.1 + Math.random() * 0.8);
    const bend = (Math.random() - 0.5) * 10;
    const dx = (len / 2) * SLANT;
    const streak = svgEl("path", { class: "streak", d: `M${(cx - dx).toFixed(1)} ${(cy + len / 2).toFixed(1)} Q${(cx + bend).toFixed(1)} ${cy.toFixed(1)} ${(cx + dx).toFixed(1)} ${(cy - len / 2).toFixed(1)}` });
    streak.style.strokeWidth = `${(5 + Math.random() * 7).toFixed(1)}px`;
    smudge.append(streak);
  }

  const ink = svgEl("g", { class: "sk-ink", mask: `url(#${id})` });
  const speed = SPEED * (2.5 + Math.random() * 2.5); // this drawing is written at its own pace
  const plan = art.strokes.map((s) => {
    const own = 0.8 + Math.random() * 0.4; // and every stroke a little differently
    const dur = (s.kind === "letter" ? Math.max(0.04, s.len / (speed * 1.6)) : Math.max(0.08, s.len / speed)) * own;
    return { s, dur, gap: s.kind === "letter" ? 0.004 + Math.random() * 0.016 : 0.02 + Math.random() * 0.05 };
  });
  // a big drawing is written faster still: nothing takes longer than this one's own limit
  const raw = plan.reduce((sum, x) => sum + x.dur + x.gap, 0);
  const cap = 1.8 + Math.random() * 1.6;
  const f = Math.min(1, cap / raw);
  let t = 0.1;
  for (const { s, dur: d0, gap } of plan) {
    const dur = d0 * f;
    for (const [d, cls] of [[s.d, "h"], [s.d, s.kind === "letter" ? "l" : ""], [s.d2, "b"]] as const) {
      if (!d) continue;
      const p = svgEl("path", { d, pathLength: 1 });
      if (cls) p.setAttribute("class", cls);
      p.style.setProperty("--d", `${t.toFixed(3)}s`);
      p.style.setProperty("--t", `${dur.toFixed(3)}s`);
      ink.append(p);
      if (cls === "h") smudge.append(svgEl("path", { d }));
    }
    t += dur + gap * f;
  }
  svg.dataset.total = t.toFixed(3);
  svg.append(ink);

  svg.append(eraser);
  return svg;
}

type Rect = { x: number; y: number; w: number; h: number };
/** What the chalk keeps away from: anything that carries text or is a control or a picture. */
const TEXTY = "h1,h2,h3,h4,p,li,a,button,label,input,select,textarea,dt,dd,th,td,figcaption,summary,code,pre,img,canvas,svg:not(.sketch),.paper";

export function ChalkWriter() {
  useEffect(() => {
    const box = document.querySelector<HTMLElement>(".page-margins");
    if (!box) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const wide = matchMedia("(min-width: 64rem)");
    const motionOn = () => !reduce.matches && document.documentElement.dataset.motion !== "paused" && !document.hidden;

    /** One hand at the board: it picks a place at random, writes there, wipes, and moves on to another place. */
    type Hand = { timer?: number; last: string; cur?: HTMLElement; at?: { x: number; y: number } };
    const hands: Hand[] = [];
    const removals = new Set<number>();
    const recent: { x: number; y: number }[] = []; // where the last drawings went, so the next ones go elsewhere

    const geometry = () => {
      const r = box.getBoundingClientRect();
      return { W: box.clientWidth, H: box.clientHeight, top0: r.top + window.scrollY, left0: r.left };
    };
    /** Chalk still on the board, and text. The dust of an old drawing is not avoided (a new one may be written over it). */
    const keepOut = (): { r: Rect; pad: number }[] => {
      const g = geometry();
      const top = box.getBoundingClientRect().top;
      const out: { r: Rect; pad: number }[] = [];
      for (const e of Array.from(box.querySelectorAll<HTMLElement>(".sketch-slot"))) {
        if (["ghost", "fade"].includes((e.firstElementChild as SVGElement | null)?.dataset.phase ?? "")) continue;
        out.push({ r: { x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight }, pad: 30 });
      }
      const note = box.querySelector<HTMLElement>(".board-note");
      if (note) out.push({ r: { x: note.offsetLeft, y: note.offsetTop, w: note.offsetWidth + 10, h: note.offsetHeight + 24 }, pad: 30 });
      for (const e of Array.from(document.querySelectorAll<HTMLElement>(TEXTY))) {
        if (box.contains(e)) continue;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > window.innerHeight + 1200) continue;
        out.push({ r: { x: b.left - g.left0, y: b.top - top, w: b.width, h: b.height }, pad: 30 });
      }
      return out;
    };
    const clash = (a: Rect, b: Rect, pad: number) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
    const far = (x: number, y: number, from: { x: number; y: number }[], d: number) => from.every((p) => Math.hypot(p.x - x, p.y - y) >= d);

    /** A random free place for a drawing of this size anywhere on the page, near the part that is on screen. */
    const spot = (hand: Hand, w: number, h: number): { x: number; y: number } | null => {
      const g = geometry();
      const viewTop = window.scrollY - g.top0;
      const yMin = Math.max(0, viewTop + 72); // the sticky header covers the top of the screen
      const yMax = Math.min(g.H - h - 8, viewTop + window.innerHeight - h - 8);
      const xMin = 72; // the binder strip runs down the left edge
      const xMax = g.W - w - 20;
      if (yMax <= yMin || xMax <= xMin) return null;
      const others = keepOut();
      // first try to go somewhere new (away from the last drawings and from this hand's last one); then anywhere free
      for (const spread of [true, false]) {
        for (let i = 0; i < 60; i++) {
          const x = xMin + Math.random() * (xMax - xMin);
          const y = yMin + Math.random() * (yMax - yMin);
          if (spread && !(far(x, y, recent, 150) && far(x, y, hand.at ? [hand.at] : [], 300))) continue;
          const me = { x, y, w, h };
          if (!others.some((o) => clash(me, o.r, o.pad))) return { x, y };
        }
      }
      return null;
    };

    const make = (hand: Hand, still: boolean) => {
      const scale = 0.9 + Math.random() * 0.45; // drawings come in different sizes
      const onShow = Array.from(box.querySelectorAll<HTMLElement>(".sketch")).map((e) => e.dataset.art ?? "");
      const art = pickArt(Math.random, 108, [hand.last, ...onShow]);
      const w = Math.round(art.w * scale);
      const h = Math.round(art.h * scale);
      const at = spot(hand, w, h);
      if (!at) return null;
      hand.last = art.name;
      hand.at = at;
      recent.push(at);
      if (recent.length > 12) recent.shift();
      const slot = document.createElement("div");
      slot.className = "sketch-slot";
      slot.style.left = `${at.x.toFixed(0)}px`;
      slot.style.top = `${at.y.toFixed(0)}px`;
      slot.style.width = `${w}px`;
      slot.style.height = `${h}px`;
      const svg = build(art);
      svg.setAttribute("width", String(Math.round((art.w + PAD * 2) * scale)));
      svg.setAttribute("height", String(Math.round((art.h + PAD * 2) * scale)));
      svg.style.left = svg.style.top = `${-PAD * scale}px`;
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
      const made = make(hand, false);
      if (!made) return later(hand, 600 + Math.random() * 900, () => run(hand));
      const { slot, svg } = made;
      hand.cur = slot;
      const d = svg.dataset;
      later(hand, Number(d.total) * 1000 + 100, () => {
        delete d.phase; // finished, at rest
        later(hand, Number(d.hold), () => {
          d.phase = "wipe"; // the eraser scrubs it away, stroke after stroke
          const keys = erasing.get(svg);
          if (keys) svg.querySelector(".sk-eraser")?.animate(keys, { duration: Number(d.erase), easing: "linear", fill: "both" });
          later(hand, Number(d.wipe), () => {
            d.phase = "ghost"; // the chalk dust stays where the drawing was
            later(hand, Number(d.ghost), () => {
              d.phase = "fade";
              hand.cur = undefined;
              removals.add(window.setTimeout(() => slot.remove(), Number(d.fade) + 200));
              later(hand, Number(d.gap), () => run(hand));
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

    const count = () => (window.innerWidth >= 1840 ? 17 : window.innerWidth >= 1440 ? 12 : 8);
    /** Motion off: finished drawings at random places on the screen, no cycle. */
    const scatter = () => {
      const g = geometry();
      const viewTop = window.scrollY - g.top0;
      for (const e of Array.from(box.querySelectorAll<HTMLElement>(".sketch-slot"))) {
        if (e.offsetTop + e.offsetHeight < viewTop - 200 || e.offsetTop > viewTop + window.innerHeight + 200) e.remove();
      }
      const have = box.querySelectorAll(".sketch-slot").length;
      const spare: Hand = { last: "" };
      for (let i = have; i < count(); i++) make(spare, true);
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
      hands.forEach((h) => later(h, Math.random() * 2500, () => run(h)));
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
            later(h, Math.random() * 800, () => run(h));
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
