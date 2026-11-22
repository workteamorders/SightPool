"use client";
import { useEffect, useRef } from "react";
import { AMBIENCE } from "@config/ambience";

const SCROLL_CAP = 800;

/**
 * The only script behind the hero's live background. It renders nothing. It finds its stage (the nearest ancestor
 * with data-stage) and does three small jobs:
 *  0. Sets data-live="true" on the stage once the page has loaded and the browser is idle, so the decorative
 *     animation starts after the content and the interface are ready, never competing with them. Before that, and
 *     without script, the layers simply sit at their resting state.
 *  1. Sets data-run="false" on the stage while the tab is hidden, the stage is off screen, motion is paused with the
 *     Pause motion control, or the system asks for reduced motion. CSS pauses every decorative animation on that.
 *  2. Cursor parallax: eases a -1 to 1 offset toward the pointer, for fine pointers only, never on touch, and writes
 *     the CSS `translate` property directly on the few layers marked data-depth (depth factor times --amb-parallax).
 *  3. Scroll drift: eases the capped scroll distance and writes `translate` on the element marked data-scroll,
 *     scaled by --amb-scroll, so decorative layers lag slightly behind the page.
 * Only those marked layers are touched, never the stage, so style does not need recomputing for the whole hero. The
 * receipt and the clip carry no data-depth, so they stay perfectly still. The frame loop runs only while a value is
 * still easing, and stops by itself.
 */
export function HeroMotion() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = anchor.current?.closest<HTMLElement>("[data-stage]");
    if (!stage) return;
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

    const layers = Array.from(stage.querySelectorAll<HTMLElement>("[data-depth]"), (el) => ({ el, k: parseFloat(el.dataset.depth ?? "1") || 1 }));
    const scroller = stage.querySelector<HTMLElement>("[data-scroll]");
    const css = getComputedStyle(root);
    const amp = parseFloat(css.getPropertyValue("--amb-parallax")) || 4;
    const lag = parseFloat(css.getPropertyValue("--amb-scroll")) || 0.04;

    let inView = true;
    let tabShown = !document.hidden;
    let raf = 0;
    let tx = 0, ty = 0, ts = 0; // targets
    let cx = 0, cy = 0, cs = 0; // current, eased

    const motionOn = () => !reduce.matches && root.dataset.motion !== "paused";
    const running = () => inView && tabShown && motionOn();
    const write = () => {
      for (const { el, k } of layers) el.style.translate = `${(cx * amp * k).toFixed(2)}px ${(cy * amp * k).toFixed(2)}px`;
      if (scroller) scroller.style.translate = `0 ${(-cs * lag).toFixed(2)}px`;
    };
    const clear = () => {
      for (const { el } of layers) el.style.translate = "";
      if (scroller) scroller.style.translate = "";
    };
    const settled = () => Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002 && Math.abs(ts - cs) < 0.2;
    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      cs += (ts - cs) * 0.14;
      write();
      raf = settled() ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && running()) raf = requestAnimationFrame(tick);
    };
    const rest = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      tx = ty = ts = cx = cy = cs = 0;
      clear();
    };
    const apply = () => {
      stage.dataset.run = running() ? "true" : "false";
      if (!motionOn()) rest();
    };

    const onPointer = (e: PointerEvent) => {
      if (!AMBIENCE.parallax || !running() || !finePointer.matches || e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    const onScroll = () => {
      if (!AMBIENCE.scroll || !running()) return;
      ts = Math.min(window.scrollY, SCROLL_CAP);
      kick();
    };
    const onVisibility = () => {
      tabShown = !document.hidden;
      apply();
    };

    const io = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (!last) return;
        inView = last.isIntersecting;
        apply();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(stage);
    apply();
    onScroll();

    let idle = 0;
    let timer = 0;
    const goLive = () => {
      stage.dataset.live = "true";
    };
    const schedule = () => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(goLive, { timeout: 1500 });
      else timer = window.setTimeout(goLive, 300);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("sp-motion", apply);
    reduce.addEventListener("change", apply);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      window.removeEventListener("load", schedule);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("sp-motion", apply);
      reduce.removeEventListener("change", apply);
      delete stage.dataset.run;
      delete stage.dataset.live;
      clear();
    };
  }, []);

  return <span ref={anchor} hidden />;
}
