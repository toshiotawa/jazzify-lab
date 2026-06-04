#!/usr/bin/env python3
"""Code Run 墓場タイルセットから 48x48 ゲーム用タイルを生成する。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SIZE = 48
ROOT = Path(__file__).resolve().parent.parent / "public" / "RUN"
SRC_TILES = ROOT / "graveyardtilesetnew" / "png" / "Tiles"
OUT = ROOT / "tiles" / "graveyard"


def _load(name: str) -> Image.Image:
    path = SRC_TILES / name
    img = Image.open(path).convert("RGBA")
    return img.resize((SIZE, SIZE), Image.Resampling.NEAREST)


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.save(path, optimize=True)
    print(path)


def spike_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    base = (42, 34, 28)
    metal = (120, 118, 110)
    draw.rectangle((0, SIZE - 8, SIZE - 1, SIZE - 1), fill=base)
    for x in range(6, SIZE - 6, 10):
        draw.polygon([(x, SIZE - 8), (x + 4, 10), (x + 8, SIZE - 8)], fill=metal)
    return img


def flag_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    from PIL import ImageDraw

    draw = ImageDraw.Draw(img)
    draw.rectangle((4, 4, 7, SIZE - 4), fill=(58, 52, 48))
    draw.polygon([(8, 8), (42, 14), (8, 36)], fill=(168, 48, 56))
    draw.line((10, 20, 38, 22), fill=(220, 180, 100), width=2)
    return img


def main() -> None:
    save(_load("Tile (1).png"), "ground_top_left.png")
    save(_load("Tile (2).png"), "ground_top.png")
    save(_load("Tile (3).png"), "ground_top_right.png")
    save(_load("Tile (5).png"), "ground_fill.png")
    save(_load("Tile (7).png"), "brick.png")
    save(_load("Tile (15).png"), "platform.png")
    save(spike_tile(), "spike.png")
    save(flag_tile(), "flag.png")


if __name__ == "__main__":
    main()
