"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A small clock in UTC, read from the visitor's own browser. It is decoration, not data: the label says "Clock", not
 * a chain or pool status. While the stage runs it shows seconds; when motion is off (hidden tab, off screen, Pause
 * motion, reduced motion) it shows hours and minutes only, so a frozen display can never pass for the current second.
 * Server render and the first client render show a fixed placeholder of the same width, so nothing shifts.
 */
const PLACEHOLDER = "--:--:--";

const two = (n: number) => String(n).padStart(2, "0");

export function ArchiveClock() {
  const [text, setText] = useState(PLACEHOLDER);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = ref.current?.closest<HTMLElement>("[data-stage]") ?? null;
    const tick = () => {
      if (document.hidden) return;
      const d = new Date();
      const running = stage?.dataset.run === "true";
      setText(running ? `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}` : `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  return (
    <span ref={ref} aria-hidden className="amb-clock">
      Clock · UTC <span className="num">{text}</span>
    </span>
  );
}
