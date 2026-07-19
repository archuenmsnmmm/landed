#!/usr/bin/env python3
"""Extract Landed brand assets from the source wordmark (black-on-black PNG)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DESKTOP_ASSETS = ROOT / "desktop" / "src" / "renderer" / "src" / "assets"
ICON_SOURCE = ROOT / "desktop" / "build" / "icon-source.png"
LANDING_SOURCE = ROOT / "desktop" / "build" / "landing-logo-source.png"

ALPHA_THRESHOLD = 12
ALPHA_BOOST = 3
ICON_SPLIT_X = 455
PADDING = 16
WHITE_LUMINANCE = 180


def default_source() -> Path:
    env = os.environ.get("LANDED_LOGO_SOURCE")
    if env:
        return Path(env)
    return ROOT / "desktop" / "build" / "logo-source.png"


def extract_mask_white_on_black(src: Image.Image) -> Image.Image:
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    px = src.load()
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and (r + g + b) > WHITE_LUMINANCE:
                mp[x, y] = min(255, max(r, g, b))
    return mask


def default_landing_source() -> Path:
    env = os.environ.get("LANDED_LANDING_LOGO_SOURCE")
    if env:
        return Path(env)
    return LANDING_SOURCE


def extract_mask(src: Image.Image) -> Image.Image:
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    px = src.load()
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            _, _, _, a = px[x, y]
            if a > ALPHA_THRESHOLD:
                mp[x, y] = min(255, a * ALPHA_BOOST)
    return mask


def tint(mask: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    w, h = mask.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mpx = mask.load()
    opx = out.load()
    r, g, b = color
    for y in range(h):
        for x in range(w):
            a = int(mpx[x, y])
            if a:
                opx[x, y] = (r, g, b, a)
    return out


def trim(image: Image.Image, pad: int = PADDING) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(image.width, right + pad)
    bottom = min(image.height, bottom + pad)
    return image.crop((left, top, right, bottom))


def square_mask(mask: Image.Image, pad: int = PADDING) -> Image.Image:
    w, h = mask.size
    side = max(w, h) + pad * 2
    canvas = Image.new("L", (side, side), 0)
    canvas.paste(mask, ((side - w) // 2, (side - h) // 2))
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)} ({image.width}x{image.height})")


def process(source: Path) -> None:
    src = Image.open(source).convert("RGBA")
    mask = extract_mask(src)

    wordmark_mask = trim(mask)
    icon_mask = trim(mask.crop((0, 0, ICON_SPLIT_X, src.height)))

    near_black = (10, 10, 10)  # #0a0a0a
    wordmark_dark = tint(wordmark_mask, near_black)
    wordmark_light = tint(wordmark_mask, (255, 255, 255))
    icon_dark = tint(square_mask(icon_mask), near_black)
    icon_light = tint(square_mask(icon_mask), (255, 255, 255))

    outputs = {
        PUBLIC / "landed-wordmark.png": wordmark_dark,
        PUBLIC / "landed-wordmark-light.png": wordmark_light,
        PUBLIC / "landed-logo.png": icon_dark,
        PUBLIC / "landed-mark.png": icon_light,
        DESKTOP_ASSETS / "landed-wordmark.png": wordmark_dark,
        DESKTOP_ASSETS / "landed-wordmark-light.png": wordmark_light,
        DESKTOP_ASSETS / "landed-logo.png": icon_dark,
        DESKTOP_ASSETS / "landed-mark.png": icon_light,
    }

    print(f"[landed] Processing brand logo from {source}")
    for path, image in outputs.items():
        save_png(image, path)
    print("[landed] Skipped icon-source.png — app icon is managed separately")


def process_landing(source: Path) -> Image.Image:
    src = Image.open(source).convert("RGBA")
    mask = trim(extract_mask_white_on_black(src))
    if mask.getbbox() is None:
        mask = trim(extract_mask(src))
    return tint(mask, (10, 10, 10))  # #0a0a0a


def main() -> None:
    source = default_source()
    if not source.exists():
        raise SystemExit(f"Logo source not found: {source}")
    process(source)

    landing_source = default_landing_source()
    if landing_source.exists():
        landing = process_landing(landing_source)
        print(f"[landed] Processing landing logo from {landing_source}")
        save_png(landing, PUBLIC / "landed-landing-logo.png")
    else:
        print(f"[landed] Skipping landing logo — source not found: {landing_source}")


if __name__ == "__main__":
    main()
