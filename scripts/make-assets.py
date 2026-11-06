#!/usr/bin/env python3
"""Derive resized/cropped logo files and app icons from the ORIGINAL logo.

The logo artwork is never redrawn or recoloured. Only these operations are used:
  * crop away empty transparent padding (trim)
  * proportional downscale
  * centre on a square canvas (transparent, or flat brand green where the
    platform requires an opaque icon: apple-touch-icon and maskable icon)

Usage: python3 scripts/make-assets.py
Requires: Pillow
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/logo/ali110-logo-original.png"
BRAND_BG = (6, 63, 56, 255)  # #063F38, same as --brand-green in css/themes.css

orig = Image.open(SRC).convert("RGBA")
bbox = orig.getchannel("A").getbbox()
trim = orig.crop(bbox)  # pixels untouched, just less empty margin


def fit(img, max_w=None, max_h=None):
    r = min((max_w or 10**9) / img.width, (max_h or 10**9) / img.height, 1)
    return img.resize((round(img.width * r), round(img.height * r)), Image.LANCZOS)


def on_square(img, size, fill_ratio, bg=None):
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    scaled = fit(img, int(size * fill_ratio), int(size * fill_ratio))
    canvas.alpha_composite(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    return canvas


out = ROOT / "assets/logo"
for w in (480, 960):
    fit(trim, max_w=w).save(out / f"ali110-logo-{w}.webp", "WEBP", quality=92, method=6)
trim.save(out / "ali110-logo-trimmed.png", optimize=True)

ic = ROOT / "assets/icons"
on_square(trim, 192, 0.86).save(ic / "icon-192.png", optimize=True)
on_square(trim, 512, 0.86).save(ic / "icon-512.png", optimize=True)
# Maskable icons must be opaque and keep the artwork inside the central safe zone (~60%).
on_square(trim, 512, 0.62, BRAND_BG).save(ic / "icon-maskable-512.png", optimize=True)
on_square(trim, 180, 0.70, BRAND_BG).convert("RGB").save(ic / "apple-touch-icon.png", optimize=True)
on_square(trim, 32, 0.96).save(ic / "favicon-32.png", optimize=True)
on_square(trim, 48, 0.96).save(ic / "favicon-48.png", optimize=True)
on_square(trim, 256, 0.96).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# Social preview (1200x630): logo centred on flat brand green, no extra artwork.
og = Image.new("RGBA", (1200, 630), BRAND_BG)
logo = fit(trim, max_w=760, max_h=360)
og.alpha_composite(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2))
og.convert("RGB").save(ROOT / "assets/images/og-image.png", optimize=True)
print("trim bbox", bbox, "->", trim.size)
