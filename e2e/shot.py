# Screenshots at 360/768/1440 (and 1920 when asked). Usage: python3 e2e/shot.py /path/ name [full]
import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    path, name = sys.argv[1], sys.argv[2]
    widths = [int(w) for w in (sys.argv[3].split(",") if len(sys.argv) > 3 else ["360","768","1440"])]
    full = "--viewport" not in sys.argv
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for w in widths:
            pg = await b.new_page(viewport={"width": w, "height": 900}, device_scale_factor=1)
            await pg.goto(f"http://localhost:4173{path}", wait_until="networkidle")
            await pg.wait_for_timeout(600)
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            await pg.screenshot(path=f"/home/claude/shots/{name}-{w}.png", full_page=full)
            print(name, w, "scrollWidth", sw, "OVERFLOW" if sw > w else "ok")
            await pg.close()
        await b.close()
asyncio.run(main())
