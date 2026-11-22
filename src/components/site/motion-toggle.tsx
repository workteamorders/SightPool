"use client";
import { useEffect, useState } from "react";

const KEY = "sp-motion";

/**
 * Pause motion: stops the decorative animation site-wide and keeps it stopped on later visits (one local setting,
 * nothing leaves the device). It sets data-motion="paused" on <html>; CSS then shows every layer in its resting state.
 * With a system "reduce motion" setting there is nothing to pause, and the control says so.
 */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystem(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    try {
      if (localStorage.getItem(KEY) === "paused") {
        document.documentElement.dataset.motion = "paused";
        setPaused(true);
        window.dispatchEvent(new Event("sp-motion"));
      }
    } catch {
      /* storage blocked: the control still works for this visit */
    }
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    if (next) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
    try {
      if (next) localStorage.setItem(KEY, "paused");
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("sp-motion"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused || system}
      disabled={system}
      className="inline-flex min-h-touch items-center gap-2 self-start rounded-md text-12 text-muted hover:text-text disabled:cursor-default disabled:hover:text-muted"
    >
      <span aria-hidden className={paused || system ? "size-3 border border-line-control bg-text" : "size-3 border border-line-control"} />
      Pause motion
      {system && <span className="text-faint">(already off: system setting)</span>}
    </button>
  );
}
