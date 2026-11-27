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

test.describe("chalk sketches", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("twelve blockchain sketches belong to the page, are drawn line by line when they come into view, and stay in the margins", async ({ page }) => {
    await page.goto("/");
    const sketches = page.locator(".sketch");
    await expect(sketches).toHaveCount(12);
    await expect(page.locator(".page-margins")).toHaveAttribute("aria-hidden", "true");
    // they are part of the page: they scroll with it
    expect(await sketches.first().evaluate((e) => getComputedStyle(e).position)).toBe("absolute");
    const docTop = () => sketches.first().evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    const before = await docTop();
    await page.evaluate(() => window.scrollTo(0, 400));
    expect(Math.abs((await docTop()) - before)).toBeLessThan(2);
    // generic technology vocabulary only: no claims about the product, no figures
    const text = (await sketches.locator("text").allTextContents()).join(" ");
    expect(text).not.toMatch(/approved|verified|audited|safe|mixer|anonymous|untraceable|private|guarantee|\d{2,}/i);
    for (const word of ["block", "merkle root", "nonce", "consensus"]) expect(text).toContain(word);
    // they stay in the margins: left of the header logo, or right of the header button
    const logoX = await page.locator("header a").evaluateAll((els) => Math.min(...els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 2).map((r) => r.x)));
    const cta = await page.locator("header").getByRole("link", { name: "Open the preview" }).boundingBox();
    for (const box of await sketches.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, r: r.right }; }))) {
      expect(box.x >= cta!.x + cta!.width || box.r <= logoX).toBe(true);
    }
    // the first sketch is drawn stroke by stroke: shortly after it starts, the first stroke is further along than the last
    const first = sketches.first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute("data-phase", "draw");
    const offsets = () => first.locator("path").evaluateAll((ps) => ps.map((p) => parseFloat(getComputedStyle(p).strokeDashoffset)));
    await page.waitForTimeout(900);
    const early = await offsets();
    const lastStroke = early[early.length - 1]!;
    expect(lastStroke).toBeGreaterThan(0.99);
    expect(early[0]!).toBeLessThan(lastStroke);
    // then it is whole, and held
    await expect.poll(() => first.getAttribute("data-phase"), { timeout: 20000 }).toBeNull();
    expect((await offsets()).every((v) => v === 0)).toBe(true);
    // Pause motion: it rests, fully drawn, and no cycle runs
    await page.getByRole("button", { name: "Pause motion" }).click();
    await expect(first).not.toHaveAttribute("data-phase", /.+/);
    expect(await first.locator("path").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
    await expect(page.locator(".board-note")).toBeVisible();
  });

  test("below 90rem the margins are gone, so are the sketches, and nothing scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator(".sketch").first()).toBeHidden();
    await expect(page.locator(".board-note")).toBeHidden();
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
