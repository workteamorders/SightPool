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

test.describe("chalk corner", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("notes are written and wiped, dust falls, the note flutters, and everything is decorative", async ({ page }) => {
    await page.goto("/");
    const board = page.locator(".chalk-board");
    await expect(board).toHaveAttribute("aria-hidden", "true");
    const name = (sel: string, pseudo?: string) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e, p ?? null).animationName, pseudo);
    await expect.poll(() => name(".chalk-line")).toBe("sp-chalk");
    await expect.poll(() => name(".chalk-smudge")).toBe("sp-smudge");
    await expect.poll(() => name(".chalk-note")).toBe("sp-flutter");
    await expect.poll(() => name(".chalk-note", "::after")).toBe("sp-curl");
    await expect.poll(() => name(".chalk-fall")).toBe("sp-fall");
    await expect.poll(() => name(".ambience-fall")).toBe("sp-fall");
    // the notes only repeat statements the page already makes, and carry no figures
    const texts = await page.locator(".chalk-line").allTextContents();
    for (const t of texts) expect(t).not.toMatch(/\d|approved|verified|audited|safe/i);
    // the board never overlaps the receipt or the figure caption
    const b = await board.boundingBox();
    const cap = await page.getByText("Sample receipt from the mock flow.").boundingBox();
    expect(b!.y).toBeGreaterThanOrEqual(cap!.y + cap!.height);
    // Pause motion: the picture rests, first notes whole, second notes out of sight
    await page.getByRole("button", { name: "Pause motion" }).click();
    expect(await name(".chalk-line")).toBe("none");
    expect(await page.locator(".chalk-line").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    expect(await page.locator(".chalk-line[data-b]").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
    expect(await page.locator(".chalk-smudge").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
  });

  test("below desktop width the chalk corner is gone and nothing scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    await expect(page.locator(".chalk-board")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});
