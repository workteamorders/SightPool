import { expect, test } from "@playwright/test";

// The hero's live background (src/components/site/ambience.tsx, hero-motion.tsx). These tests check the rules it
// promises: decorative only, the receipt never moves, parallax stays within 6px, and motion stops on request.

const num = (v: string) => v.split(" ").map((x) => parseFloat(x)).filter((x) => !Number.isNaN(x));

test("hero background is decorative, parallax stays within 6px, and the receipt never moves", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".ambience")).toHaveAttribute("aria-hidden", "true");
  const front = page.locator(".archive-front");
  const before = await front.boundingBox();
  await page.mouse.move(80, 80);
  await page.mouse.move(1300, 820, { steps: 12 });
  await page.waitForTimeout(1200);
  const after = await front.boundingBox();
  expect(after).toEqual(before);
  expect(await front.evaluate((e) => getComputedStyle(e).translate)).toBe("none");
  const t = num(await page.locator(".archive-ghost-a").evaluate((e) => getComputedStyle(e).translate));
  expect(Math.max(...t.map(Math.abs))).toBeGreaterThan(0.5);
  for (const sel of [".archive-ghost-a", ".archive-ghost-b", ".archive-back", ".archive-sheet-a", ".archive-sheet-b", ".archive-reg-tl"]) {
    const v = num(await page.locator(sel).first().evaluate((e) => getComputedStyle(e).translate));
    expect(Math.max(...v.map(Math.abs)), sel).toBeLessThanOrEqual(6.05);
  }
});

test("Pause motion stops the decorative animation and is remembered", async ({ page }) => {
  await page.goto("/");
  const beam = page.locator(".ambience-beam");
  await expect.poll(() => beam.evaluate((e) => getComputedStyle(e).animationName)).toBe("sp-beam");
  await expect.poll(() => page.locator(".sl-run").evaluate((e) => getComputedStyle(e).animationName)).toBe("sp-run");
  const button = page.getByRole("button", { name: "Pause motion" });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  expect(await beam.evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  expect(await page.locator(".sl-run").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  // still a complete picture: the folder and receipt are there
  await expect(page.getByText("Mock mode: no real funds are moved.").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "paused");
  await expect.poll(() => beam.evaluate((e) => getComputedStyle(e).animationName)).toBe("sp-beam");
});

test("a hidden tab holds the animation", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("[data-stage]");
  await expect(stage).toHaveAttribute("data-run", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-run", "false");
  expect(await page.locator(".ambience-beam").evaluate((e) => getComputedStyle(e).animationPlayState)).toBe("paused");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(stage).toHaveAttribute("data-run", "true");
});

test.describe("reduced motion", () => {
  // The ruler is a wide-screen element (90rem and up), so check at 1440px.
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  test("no decorative animation, the picture stays complete, and Pause motion says why it is idle", async ({ page }) => {
    await page.goto("/");
    for (const sel of [".ambience-beam", ".ambience-glow", ".sl-run", ".archive-sheet-a", ".archive-ghost-a"]) {
      expect(await page.locator(sel).first().evaluate((e) => getComputedStyle(e).animationName), sel).toBe("none");
    }
    await expect(page.locator("[data-stage]")).toHaveAttribute("data-run", "false");
    await expect(page.locator(".archive-ghost-a")).toBeVisible();
    await expect(page.locator(".sl-ruler")).toBeVisible();
    const button = page.getByRole("button", { name: /Pause motion/ });
    await expect(button).toBeDisabled();
    await expect(button).toContainText("system setting");
  });
});

test.describe("touch phone", () => {
  test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
  test("no cursor parallax, fewer decorations, no horizontal scroll, compliance stays visible", async ({ page }) => {
    await page.goto("/");
    await page.touchscreen.tap(180, 400);
    await page.waitForTimeout(600);
    expect(await page.locator(".archive-ghost-a").evaluate((e) => getComputedStyle(e).translate)).toMatch(/^(none|0px( 0px)?)$/);
    expect(await page.locator(".archive-ghost-a").evaluate((e) => getComputedStyle(e).display)).toBe("none");
    expect(await page.locator(".sl-run").evaluate((e) => getComputedStyle(e).display)).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await expect(page.getByText("Mainnet stays off until an audit and a legal opinion.")).toBeVisible();
    await expect(page.getByText("Mock mode: no real funds are moved.").first()).toBeVisible();
    await expect(page.getByText(/not affiliated with, endorsed by or sponsored by Robinhood Markets/)).toBeVisible();
  });
});

test("tablet 768: the decorative folders never cause sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/");
  await expect(page.locator(".archive-ghost-b")).toBeVisible();
  await page.waitForTimeout(500);
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(768);
});

test.describe("always-moving details", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("ruler marker, rope, caret and dust run; the clock ticks; Pause motion stops them", async ({ page }) => {
    await page.goto("/");
    const name = (sel: string, pseudo?: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e, p ?? null).animationName, pseudo);
    await expect.poll(() => name(".sl-ruler-marker")).toBe("sp-ruler-marker");
    await expect.poll(() => name(".binder", "::before")).toBe("sp-rope");
    await expect.poll(() => name(".amb-caret")).toBe("sp-caret");
    await expect.poll(() => name(".ambience-mote")).toBe("sp-mote");
    const clock = page.locator(".amb-clock .num");
    await expect(clock).toHaveText(/^\d\d:\d\d:\d\d$/);
    const first = await clock.textContent();
    await expect.poll(() => clock.textContent(), { timeout: 4000 }).not.toBe(first);
    // the clock says what it is
    await expect(page.locator(".amb-clock")).toContainText("Clock · UTC");
    await page.getByRole("button", { name: "Pause motion" }).click();
    expect(await name(".sl-ruler-marker")).toBe("none");
    expect(await name(".binder", "::before")).toBe("none");
    expect(await name(".amb-caret")).toBe("none");
    // a frozen display never shows a second
    await expect(clock).toHaveText(/^\d\d:\d\d$/);
    const hidden = await page.locator(".amb-caret").evaluate((e) => getComputedStyle(e).opacity);
    expect(hidden).toBe("0");
  });

  test("the block number is read again while the tab stays open", async ({ page }) => {
    await page.clock.install();
    let reads = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/rpc") && (r.postData() ?? "").includes("eth_blockNumber")) reads += 1;
    });
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Current status" }).getByText(/Block \d/)).toBeVisible();
    const initial = reads;
    await page.clock.runFor(21_000);
    await expect.poll(() => reads).toBeGreaterThan(initial);
    await expect(page.getByRole("region", { name: "Current status" }).getByText(/Block \d/)).toBeVisible();
  });
});

test.describe("chalk drawings", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("hands write at random free places anywhere on the page, fast, each on its own clock, something different each time, stroke by stroke, then an eraser scrubs it away", async ({ page }) => {
    test.setTimeout(120_000); // a minute of fast-forwarded time with every hand busy takes a while
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __seen: string[] }).__seen = seen;
      new MutationObserver((list) => {
        for (const m of list) m.addedNodes.forEach((n) => {
          const e = n as HTMLElement;
          const svg = e.classList?.contains("sketch-slot") ? (e.firstElementChild as SVGElement | null) : null;
          if (svg) seen.push(`${e.style.left},${e.style.top}|${svg.dataset.art}|${svg.dataset.words}|${svg.dataset.total},${svg.dataset.hold},${svg.dataset.wipe},${svg.dataset.ghost},${svg.dataset.fade},${svg.dataset.gap}`);
        });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator(".page-margins")).toHaveAttribute("aria-hidden", "true");
    await page.clock.runFor(2500);
    // several are drawing at once
    await page.clock.runFor(2500);
    await expect.poll(() => page.locator(".sketch").count()).toBeGreaterThanOrEqual(4);
    // they stay off the text and off each other
    const rects = await page.locator(".sketch-slot").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, r: r.right, y: r.top, b: r.bottom }; }));
    const texts = await page.locator("h1,h2,h3,p,li,a,button,.paper").evaluateAll((els) => els.filter((e) => !e.closest(".page-margins")).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, r: r.right, y: r.top, b: r.bottom }; }).filter((r) => r.r - r.x > 2 && r.b - r.y > 2));
    for (const c of rects) for (const t of texts) expect(c.x < t.r && t.x < c.r && c.y < t.b && t.y < c.b).toBe(false);
    // (the dust of an old drawing may be written over, so only drawings with chalk still on them are compared)
    const live = await page.locator(".sketch-slot").evaluateAll((els) => els.filter((e) => !["ghost", "fade"].includes((e.firstElementChild as SVGElement).dataset.phase ?? "")).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, r: r.right, y: r.top, b: r.bottom }; }));
    for (let i = 0; i < live.length; i++) for (let k = i + 1; k < live.length; k++) {
      const a = live[i]!, c = live[k]!;
      expect(a.x < c.r && c.x < a.r && a.y < c.b && c.y < a.b).toBe(false);
    }
    // the places belong to the page: they scroll with it
    const slot = page.locator(".sketch-slot").first();
    const docTop = () => slot.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    const before = await docTop();
    await page.evaluate(() => window.scrollTo(0, 120));
    expect(Math.abs((await docTop()) - before)).toBeLessThan(2);
    await page.evaluate(() => window.scrollTo(0, 0));
    // drawn by hand (read in one go, the drawings change fast): curved strokes traced twice, capitals as strokes
    // (no font text), every stroke starting after the one before it
    await expect(page.locator(".sketch").first()).toBeAttached();
    const hand = await page.evaluate(() => {
      const svg = document.querySelector(".sketch")!;
      const starts = Array.from(svg.querySelectorAll<SVGElement>(".sk-ink path")).map((p) => parseFloat(p.style.getPropertyValue("--d")));
      return {
        curved: Array.from(svg.querySelectorAll("path")).some((p) => (p.getAttribute("d") ?? "").includes("C")),
        echo: svg.querySelectorAll("path.b").length,
        letters: svg.querySelectorAll("path.l").length,
        text: svg.querySelectorAll("text").length,
        ordered: starts.every((v, k) => k === 0 || v >= starts[k - 1]!),
        span: starts[starts.length - 1]! - starts[0]!,
      };
    });
    expect(hand.curved).toBe(true);
    expect(hand.echo).toBeGreaterThan(0);
    expect(hand.letters).toBeGreaterThan(0);
    expect(hand.text).toBe(0);
    expect(hand.ordered).toBe(true);
    expect(hand.span).toBeGreaterThan(0.2);
    // a long run: the eraser scrubs the drawing away with many short slanted strokes, up and down, moving on from the left
    let wiped = false;
    for (let i = 0; i < 40; i++) {
      await page.clock.runFor(1000);
      if (await page.locator('.sketch[data-phase="wipe"] .sk-eraser').count()) {
        wiped = true;
        const wiping = page.locator('.sketch[data-phase="wipe"]').first();
        // (read in one go: the drawings change fast)
        const info = await wiping.evaluate((svg) => ({
          anim: svg.querySelector(".sk-eraser")?.getAnimations().length ?? 0,
          strips: Array.from(svg.querySelector("mask")!.querySelectorAll<SVGElement>(".sk-scrub")).map((e) => ({ d: parseFloat(e.style.getPropertyValue("--d")), up: e.classList.contains("up") })),
        })).catch(() => null);
        if (!info) { wiped = false; continue; }
        expect(info.anim).toBeGreaterThanOrEqual(0);
        expect(info.strips.length).toBeGreaterThanOrEqual(9);
        for (let k = 1; k < info.strips.length; k++) {
          expect(info.strips[k]!.d).toBeGreaterThan(info.strips[k - 1]!.d); // each stroke starts after the one before
          expect(info.strips[k]!.up).not.toBe(info.strips[k - 1]!.up); // down, then up, then down
        }
        expect(info.strips[0]!.up).toBe(false); // the first goes down from the top
        expect(info.strips[info.strips.length - 1]!.up).toBe(false); // so the last ends at the bottom right
        break;
      }
    }
    expect(wiped).toBe(true);
    // what the eraser leaves: the ink is gone, the powder and streaks stay where the drawing was, and later fade
    // (each look is one read, because the drawings change fast)
    let ghost: { ink: string; smudge: string; streaks: number } | null = null;
    for (let i = 0; i < 40 && !ghost; i++) {
      await page.clock.runFor(500);
      ghost = await page.evaluate(() => {
        const g = document.querySelector('.sketch[data-phase="ghost"]');
        if (!g) return null;
        return { ink: getComputedStyle(g.querySelector(".sk-ink")!).display, smudge: getComputedStyle(g.querySelector(".sk-smudge")!).opacity, streaks: g.querySelectorAll(".sk-smudge path.streak").length };
      });
    }
    expect(ghost).not.toBeNull();
    expect(ghost!.ink).toBe("none");
    expect(ghost!.smudge).toBe("1");
    expect(ghost!.streaks).toBeGreaterThanOrEqual(6);
    let fading: string[] = [];
    for (let i = 0; i < 40 && !fading.length; i++) {
      await page.clock.runFor(500);
      fading = await page.evaluate(() => Array.from(document.querySelectorAll('.sketch[data-phase="fade"] .sk-smudge')).map((e) => getComputedStyle(e).animationName));
    }
    expect(fading).toContain("sp-smudge-fade");
    await page.clock.runFor(60_000);
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen.length).toBeGreaterThanOrEqual(25);
    // the places are random: almost none repeats, they are all over the page, and the heights are spread
    const places = seen.map((e) => e.split("|")[0]!);
    expect(new Set(places).size).toBeGreaterThanOrEqual(places.length * 0.95);
    const xs = places.map((p) => parseFloat(p.split(",")[0]!));
    const tops = places.map((p) => parseFloat(p.split(",")[1]!));
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(500); // not only left and right edges
    expect(Math.max(...tops) - Math.min(...tops)).toBeGreaterThan(300);
    expect(xs.filter((x) => x > 400 && x < 1000).length).toBeGreaterThan(0); // some in the middle of the page
    // fast, and every drawing on its own clock: draw time, hold, wipe, dust, fade, gap are all different from drawing to drawing
    const clocks = seen.map((e) => e.split("|")[3]!);
    expect(new Set(clocks).size).toBe(clocks.length);
    const field = (i: number) => clocks.map((c) => parseFloat(c.split(",")[i]!));
    expect(Math.max(...field(0))).toBeLessThan(3.6); // s to write
    expect(Math.max(...field(1))).toBeLessThanOrEqual(2400); // ms held
    expect(Math.max(...field(2))).toBeLessThanOrEqual(3200); // ms to wipe
    for (const i of [0, 1, 2, 3, 4, 5]) expect(new Set(field(i)).size).toBeGreaterThanOrEqual(clocks.length * 0.9);
    // and the content differs: many different drawings and words
    expect(new Set(seen.map((e) => e.split("|")[2])).size).toBeGreaterThanOrEqual(25); // fixed-label drawings (a chain of blocks, a genesis block) repeat their words, never their lines
    expect(new Set(seen.map((e) => e.split("|")[1])).size).toBeGreaterThanOrEqual(8);
    // generic technology vocabulary only: no claims about the product, no figures
    expect(seen.map((e) => e.split("|")[2]).join(" ")).not.toMatch(/approved|verified|audited|safe|mixer|anonymous|untraceable|private|guarantee|\d{2,}/i);
  });

  test("Pause motion: drawings rest, finished, and nothing is drawn or wiped", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => page.locator(".sketch").count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(2); // each hand starts after a random delay of up to 4 s
    await page.getByRole("button", { name: "Pause motion" }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.locator(".sketch").count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator(".sketch[data-phase]").count()).toBe(0);
    expect(await page.locator(".sketch path").evaluateAll((ps) => ps.filter((p) => p.isConnected).every((p) => getComputedStyle(p).animationName === "none"))).toBe(true);
    await expect(page.locator(".board-note")).toBeVisible();
  });

  test("below 64rem there are no drawings, and nothing scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto("/");
    expect(await page.locator(".sketch-slot").count()).toBe(0);
    await expect(page.locator(".board-note")).toBeHidden();
    expect(await page.locator(".sketch").count()).toBe(0);
    for (const width of [768, 360]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
});

test.describe("the board layer", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("stays in view while scrolling, sits behind content, takes no pointer events, and stops on request", async ({ page }) => {
    await page.goto("/");
    const board = page.locator(".page-board");
    await expect(board).toHaveAttribute("aria-hidden", "true");
    const css = (sel: string, prop: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);
    expect(await css(".page-board", "position")).toBe("fixed");
    expect(await css(".page-board", "pointer-events")).toBe("none");
    expect(Number(await css(".page-board", "z-index"))).toBeLessThan(0);
    await expect.poll(() => css(".page-board-speck", "animation-name")).toBe("sp-board-drift");
    await expect.poll(() => css(".page-board-sweep", "animation-name")).toBe("sp-board-sweep");
    // still there, and still the same size, after scrolling to the bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const box = await board.boundingBox();
    expect(box).toMatchObject({ x: 0, y: 0, width: 1440, height: 900 });
    // a click goes through to the content underneath
    await page.getByRole("link", { name: "Open the preview" }).first().scrollIntoViewIfNeeded();
    // Pause motion: it rests out of sight
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: "Pause motion" }).click();
    expect(await css(".page-board-speck", "animation-name")).toBe("none");
    expect(await css(".page-board-speck", "opacity")).toBe("0");
    expect(await css(".page-board-sweep", "opacity")).toBe("0");
  });
});
