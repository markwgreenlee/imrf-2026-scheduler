#!/usr/bin/env python3
"""Generate the IMRF scheduler icon set from the source logo.

The source logo (assets/imrf-logo-source.png) has a transparent background.
iOS renders transparent apple-touch-icons on black, so every icon is flattened
onto a white background. Upscaling uses Lanczos resampling.

Run from the project root:  python3 scripts/make_icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "imrf-logo-source.png"

# path (relative to project root) -> square size in px
TARGETS = {
    "assets/icon.png": 1024,                    # Expo app icon + web favicon
    "assets/adaptive-icon.png": 1024,           # Android adaptive foreground
    "assets/favicon.png": 48,                   # small favicon
    "public/icons/icon-192.png": 192,           # PWA / Android
    "public/icons/icon-512.png": 512,           # PWA / Android
    "public/icons/apple-touch-icon.png": 180,   # Safari iPhone home screen
}


def flatten_resize(src: Image.Image, size: int) -> Image.Image:
    img = src.resize((size, size), Image.LANCZOS)
    bg = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    bg.alpha_composite(img)
    return bg.convert("RGB")


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    print(f"source: {SRC.name} {src.size}")
    for rel, size in TARGETS.items():
        out = ROOT / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        flatten_resize(src, size).save(out, "PNG")
        print(f"wrote {rel} ({size}x{size})")


if __name__ == "__main__":
    main()
