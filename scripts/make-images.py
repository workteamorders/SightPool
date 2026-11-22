# Renders public/og.png, public/apple-touch-icon.png and public/icon-512.png from code (no stock or AI art).
# The product name and tagline are read from config/brand.ts. Run: python3 scripts/make-images.py
import asyncio, re, pathlib
from playwright.async_api import async_playwright
root = pathlib.Path(__file__).resolve().parent.parent
brand = (root / "config/brand.ts").read_text()
name = re.search(r'name:\s*"([^"]+)"', brand).group(1)
tagline = re.search(r'tagline:\s*"([^"]+)"', brand).group(1)
font = (root / "node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2").as_uri()
mono = (root / "node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2").as_uri()
css = f"""@font-face{{font-family:G;src:url({font})}}@font-face{{font-family:M;src:url({mono})}}
*{{margin:0;box-sizing:border-box}}body{{background:#0f1110;color:#edefec;font-family:G}}"""
og = f"""<html><head><style>{css}
.w{{width:1200px;height:630px;padding:72px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #2c322f}}
.l{{display:flex;align-items:center;gap:16px;color:#a8b0ab;font:500 20px G;letter-spacing:.08em;text-transform:uppercase}}
.l:before{{content:"";width:14px;height:14px;border:2px solid #00c805}}.l:after{{content:"";flex:1;height:1px;background:#2c322f}}
h1{{font:600 64px/1.08 G;letter-spacing:-.02em;max-width:980px}}
.r{{display:flex;gap:40px;font:400 22px M;color:#a8b0ab}}.r b{{color:#edefec;font-weight:400}}
</style></head><body><div class=w><div class=l>{name} · Interface preview</div><h1>{tagline}</h1>
<div class=r><span>Mode <b>Mock</b></span><span>Mainnet <b>Gated</b></span><span>Disclosure package <b>Yes</b></span></div></div></body></html>"""
icon = lambda s: f"""<html><head><style>{css}</style></head><body><svg width={s} height={s} viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f1110"/><rect x="12.5" y="26.5" width="11" height="11" fill="none" stroke="#00c805" stroke-width="3"/><path d="M30 32h22" stroke="#edefec" stroke-width="3"/></svg></body></html>"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--allow-file-access-from-files"])
        for html, w, h, out in [(og, 1200, 630, "og.png"), (icon(180), 180, 180, "apple-touch-icon.png"), (icon(512), 512, 512, "icon-512.png")]:
            pg = await b.new_page(viewport={"width": w, "height": h})
            f = root / "out" / "_tmp.html"; f.parent.mkdir(exist_ok=True); f.write_text(html)
            await pg.goto(f.as_uri()); await pg.wait_for_timeout(300)
            await pg.screenshot(path=str(root / "public" / out)); f.unlink(); await pg.close()
        await b.close()
asyncio.run(main())
