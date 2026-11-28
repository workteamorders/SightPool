"use client";
import { useEffect } from "react";
import { type Art, pickArt } from "@/lib/chalk-art";

/**
 * The hand behind the chalk drawings in the margins. It renders nothing itself; it fills the empty .sketch-slot
 * boxes that page-margins.tsx lays down. While a slot is on screen it runs a loop:
 *   draw   a new drawing, stroke by stroke, each word letter by letter (CSS does the drawing, from --d and --t),
 *   hold   the finished drawing stays for a while,
 *   wipe   a board eraser sweeps across it from the left and the chalk disappears behind it,
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
const WIPE = 3300; // the eraser sweeps for 2.6 s and leaves for 0.6 s
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
  svg.style.setProperty("--run", `${w + 12}px`);
  svg.dataset.art = art.name;
  svg.dataset.words = art.words;

  // the reveal mask: wiping slides its edge across from the left
  const mask = svgEl("mask", { id, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  mask.append(svgEl("rect", { class: "sk-reveal", x: -PAD, y: -PAD, width: w, height: h, fill: "#fff" }));
  // the smudge shows the same mask the other way round: it grows behind the eraser, where the chalk was
  const cover = svgEl("mask", { id: `${id}s`, maskUnits: "userSpaceOnUse", x: -PAD, y: -PAD, width: w, height: h });
  cover.append(svgEl("rect", { class: "sk-reveal", x: -PAD - w - 24, y: -PAD, width: w + 24, height: h, fill: "#fff" }));
  const defs = svgEl("defs");
  defs.append(mask, cover);
  svg.append(defs);
  const smudge = svgEl("g", { class: "sk-smudge", mask: `url(#${id}s)` });
  svg.append(smudge);

  // broad streaks where the eraser went over: wider than the strokes and uneven, so the board looks wiped, not clean
  for (let i = 0, n = 3 + Math.floor(Math.random() * 3); i < n; i++) {
    const y = -PAD + 6 + Math.random() * (h - 12);
    const x0 = -PAD + Math.random() * w * 0.25;
    const x1 = -PAD + w * (0.6 + Math.random() * 0.4);
    const bend = (Math.random() - 0.5) * 6;
    const streak = svgEl("path", { class: "streak", d: `M${x0.toFixed(1)} ${y.toFixed(1)} Q${((x0 + x1) / 2).toFixed(1)} ${(y + bend).toFixed(1)} ${x1.toFixed(1)} ${(y + bend / 2).toFixed(1)}` });
    streak.style.strokeWidth = `${(5 + Math.random() * 7).toFixed(1)}px`;
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

  const eraser = svgEl("g", { class: "sk-eraser" });
  const tilt = svgEl("g", { transform: `rotate(4 ${-PAD} ${h / 2 - PAD})` });
  tilt.append(
    svgEl("rect", { class: "eraser-felt", x: -PAD - 14, y: -PAD - 6, width: 28, height: h + 12, rx: 4 }),
    svgEl("rect", { class: "eraser-wood", x: -PAD - 14, y: -PAD - 6, width: 28, height: 8, rx: 3 }),
  );
  eraser.append(tilt);
  svg.append(eraser);
  return svg;
}

export function ChalkWriter() {
  useEffect(() => {
    const slots = Array.from(document.querySelectorAll<HTMLElement>(".sketch-slot"));
    if (!slots.length) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const motionOn = () => !reduce.matches && document.documentElement.dataset.motion !== "paused" && !document.hidden;
    const inView = new Map<HTMLElement, boolean>();
    const timers = new Map<HTMLElement, number>();
    const last = new Map<HTMLElement, string>();

    const stop = (slot: HTMLElement) => {
      window.clearTimeout(timers.get(slot));
      timers.delete(slot);
    };
    const later = (slot: HTMLElement, ms: number, fn: () => void) =>
      timers.set(
        slot,
        window.setTimeout(() => {
          timers.delete(slot); // this one has fired; whatever fn schedules next takes its place
          fn();
        }, ms),
      );
    const current = new Map<HTMLElement, SVGSVGElement>();
    const empty = (slot: HTMLElement) => {
      current.delete(slot);
      slot.replaceChildren();
    };
    /** A new drawing in the slot. With keepGhost, the smudge of the last one stays under it and fades away. */
    const fresh = (slot: HTMLElement, keepGhost = false) => {
      const onShow = slots.filter((o) => o !== slot).map((o) => current.get(o)?.dataset.art).filter((n): n is string => !!n);
      const art = pickArt(Math.random, slot.dataset.side === "left" ? 84 : 108, [last.get(slot) ?? "", ...onShow]);
      last.set(slot, art.name);
      const svg = build(art);
      const old = current.get(slot);
      if (keepGhost && old?.dataset.phase === "ghost" && old.isConnected) {
        old.dataset.phase = "fade";
        window.setTimeout(() => old.remove(), FADE);
        slot.append(svg);
      } else slot.replaceChildren(svg);
      current.set(slot, svg);
      return svg;
    };

    const loop = (slot: HTMLElement) => {
      const svg = fresh(slot, true);
      svg.dataset.phase = "draw";
      later(slot, Number(svg.dataset.total) * 1000 + 300, () => {
        delete svg.dataset.phase; // finished, at rest
        later(slot, 2500 + Math.random() * 3500, () => {
          svg.dataset.phase = "wipe";
          later(slot, WIPE, () => {
            svg.dataset.phase = "ghost"; // the chalk dust stays until the next drawing
            later(slot, 1200 + Math.random() * 2800, () => refresh(slot));
          });
        });
      });
    };
    const refresh = (slot: HTMLElement) => {
      if (!inView.get(slot)) {
        stop(slot);
        empty(slot);
        return;
      }
      if (!motionOn()) {
        stop(slot);
        const cur = current.get(slot);
        if (!cur || !cur.isConnected || cur.dataset.phase || slot.childElementCount > 1) fresh(slot);
        return;
      }
      if (!timers.has(slot)) loop(slot);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const slot = e.target as HTMLElement;
          const was = inView.get(slot);
          inView.set(slot, e.isIntersecting);
          if (e.isIntersecting && !was && motionOn()) later(slot, Math.random() * 6000, () => refresh(slot)); // staggered start only while drawing
          else refresh(slot);
        }
      },
      { threshold: 0.5 },
    );
    slots.forEach((s) => io.observe(s));
    const all = () => slots.forEach((s) => (stop(s), refresh(s)));
    window.addEventListener("sp-motion", all);
    document.addEventListener("visibilitychange", all);
    reduce.addEventListener("change", all);
    return () => {
      io.disconnect();
      slots.forEach((s) => (stop(s), empty(s)));
      window.removeEventListener("sp-motion", all);
      document.removeEventListener("visibilitychange", all);
      reduce.removeEventListener("change", all);
    };
  }, []);
  return null;
}
