"use client";
import { useEffect } from "react";

/**
 * The script behind the chalk sketches. It renders nothing. For every .sketch it runs a small cycle while the sketch
 * is on screen: draw (CSS draws each stroke in turn and writes each word letter by letter, for data-total seconds),
 * hold, wipe from the left, a pause, and again. Off screen a sketch waits, hidden, and is drawn from the start when it
 * scrolls back into view. When motion is off (reduced motion, Pause motion, hidden tab) no cycle runs and the sketch rests,
 * fully drawn. Without this script the sketches stay hidden.
 */
const HOLD = 9000;
const WIPE = 2400;

export function SketchDraw() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<SVGElement>(".sketch"));
    if (!els.length) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const motionOn = () => !reduce.matches && document.documentElement.dataset.motion !== "paused" && !document.hidden;
    const inView = new Map<SVGElement, boolean>();
    const timers = new Map<SVGElement, number>();

    const clear = (el: SVGElement) => {
      window.clearTimeout(timers.get(el));
      timers.delete(el);
    };
    const later = (el: SVGElement, ms: number, fn: () => void) => timers.set(el, window.setTimeout(fn, ms));
    const total = (el: SVGElement) => Number(el.dataset.total ?? "8") * 1000;

    const start = (el: SVGElement) => {
      clear(el);
      el.dataset.phase = "draw";
      later(el, total(el) + 300, () => {
        delete el.dataset.phase; // drawn, at rest
        later(el, HOLD, () => {
          el.dataset.phase = "wipe";
          later(el, WIPE, () => {
            el.dataset.phase = "idle";
            later(el, 3000 + (els.indexOf(el) % 3) * 2000, () => refresh(el));
          });
        });
      });
    };
    const refresh = (el: SVGElement) => {
      el.dataset.ready = "";
      if (!motionOn()) {
        clear(el);
        delete el.dataset.phase; // rests, fully drawn
        return;
      }
      if (!inView.get(el)) {
        clear(el);
        el.dataset.phase = "idle"; // waits, hidden, to be drawn when it scrolls into view
        return;
      }
      if (!timers.has(el)) start(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inView.set(e.target as SVGElement, e.isIntersecting);
          refresh(e.target as SVGElement);
        }
      },
      { threshold: 0.4 },
    );
    els.forEach((el) => io.observe(el));
    const all = () => els.forEach(refresh);
    window.addEventListener("sp-motion", all);
    document.addEventListener("visibilitychange", all);
    reduce.addEventListener("change", all);
    return () => {
      io.disconnect();
      els.forEach((el) => {
        clear(el);
        delete el.dataset.phase;
        delete el.dataset.ready;
      });
      window.removeEventListener("sp-motion", all);
      document.removeEventListener("visibilitychange", all);
      reduce.removeEventListener("change", all);
    };
  }, []);
  return null;
}
