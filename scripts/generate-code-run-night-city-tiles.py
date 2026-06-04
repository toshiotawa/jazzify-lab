#!/usr/bin/env python3
"""Code Run 夜のジャズ街向け 48x48 タイルを生成する。"""
from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 48
OUT = Path(__file__).resolve().parent.parent / "public" / "RUN" / "tiles" / "night-city"


def _rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def save(img: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    img.save(path, optimize=True)
    print(path)


def ground_top() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), _rgb("#1a1528"))
    draw = ImageDraw.Draw(img)
    rng = random.Random(7)

    # 月光ハイライト（上面）
    draw.rectangle((0, 0, SIZE - 1, 2), fill=_rgb("#6a8ab8"))
    draw.rectangle((0, 2, SIZE - 1, 3), fill=_rgb("#3d4f6e"))

    stones = [
        _rgb("#8a7358"),
        _rgb("#9a8468"),
        _rgb("#7a6348"),
        _rgb("#b09878"),
    ]
    for row in range(4):
        for col in range(4):
            x0 = col * 12 + (2 if row % 2 else 0)
            y0 = 6 + row * 10
            x1 = min(x0 + 10, SIZE - 1)
            y1 = min(y0 + 8, SIZE - 1)
            c = stones[rng.randint(0, len(stones) - 1)]
            draw.rounded_rectangle((x0, y0, x1, y1), radius=2, fill=c)
            if rng.random() < 0.35:
                draw.point((x0 + 2, y0 + 1), fill=_rgb("#c8d8f0"))

    # 石畳の目地
    for y in range(6, SIZE, 10):
        draw.line((0, y, SIZE - 1, y), fill=_rgb("#2a2238"), width=1)
    for x in range(0, SIZE, 12):
        draw.line((x, 6, x, SIZE - 1), fill=_rgb("#2a2238"), width=1)

    draw.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=_rgb("#120f1c"), width=1)
    return img


def ground_fill() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), _rgb("#1e1628"))
    draw = ImageDraw.Draw(img)
    rng = random.Random(13)

    brick_a = _rgb("#4a3540")
    brick_b = _rgb("#5c4248")
    ivy = _rgb("#3d5c38")

    for row in range(6):
        y0 = row * 8
        offset = 6 if row % 2 else 0
        for col in range(4):
            x0 = offset + col * 11
            x1 = min(x0 + 9, SIZE - 1)
            y1 = min(y0 + 6, SIZE - 1)
            draw.rectangle((x0, y0, x1, y1), fill=brick_a if col % 2 else brick_b)
            if rng.random() < 0.12:
                draw.rectangle((x0, y0, x1, min(y0 + 3, y1)), fill=ivy)

    # 蔦の垂れ
    draw.line((4, 0, 4, 18), fill=ivy, width=2)
    draw.line((SIZE - 6, 8, SIZE - 6, SIZE - 1), fill=ivy, width=2)
    draw.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=_rgb("#0e0b14"), width=1)
    return img


def brick_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), _rgb("#241c30"))
    draw = ImageDraw.Draw(img)
    rng = random.Random(21)

    for row in range(5):
        y0 = 4 + row * 9
        offset = 5 if row % 2 else 0
        for col in range(4):
            x0 = offset + col * 11
            x1 = min(x0 + 9, SIZE - 1)
            y1 = min(y0 + 7, SIZE - 1)
            base = _rgb("#6b4e42") if col % 2 else _rgb("#7a5a4c")
            draw.rectangle((x0, y0, x1, y1), fill=base)
            draw.line((x0, y0, x1, y0), fill=_rgb("#9a7868"), width=1)

    if rng.random() < 0.5:
        draw.ellipse((36, 28, 44, 40), fill=_rgb("#456040"))

    draw.rectangle((0, 0, SIZE - 1, 3), fill=_rgb("#5a7088"))
    draw.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=_rgb("#120f1c"), width=2)
    return img


def block_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), _rgb("#2a1e32"))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle((2, 2, SIZE - 3, SIZE - 3), radius=4, fill=_rgb("#4a3848"))
    draw.rounded_rectangle((6, 6, SIZE - 7, SIZE - 7), radius=2, fill=_rgb("#5c4654"))

    # 古い木枠（問い合わせブロック風）
    wood = _rgb("#6a4a32")
    draw.rectangle((10, 10, SIZE - 11, SIZE - 11), outline=wood, width=3)
    draw.line((10, 10, SIZE - 11, SIZE - 11), fill=wood, width=2)
    draw.line((SIZE - 11, 10, 10, SIZE - 11), fill=wood, width=2)

    draw.rectangle((0, 0, SIZE - 1, 4), fill=_rgb("#7a90a8"))
    draw.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=_rgb("#0e0b14"), width=2)
    return img


def platform_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 屋上の縁石＋古い板
    draw.rectangle((0, 0, SIZE - 1, 5), fill=_rgb("#5a6a80"))
    draw.rectangle((0, 5, SIZE - 1, SIZE - 1), fill=_rgb("#3a2a22"))

    plank_colors = [_rgb("#5a4030"), _rgb("#6a4a38"), _rgb("#4a3428")]
    for i, y in enumerate(range(8, SIZE - 2, 7)):
        draw.rectangle((2, y, SIZE - 3, min(y + 5, SIZE - 2)), fill=plank_colors[i % 3])
        draw.line((2, y, SIZE - 3, y), fill=_rgb("#2a1e18"), width=1)

    draw.rectangle((0, SIZE - 4, SIZE - 1, SIZE - 1), fill=_rgb("#1a1520"))
    draw.rectangle((0, 0, SIZE - 1, SIZE - 1), outline=_rgb("#120f1c"), width=1)
    return img


def spike_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    base = _rgb("#2a2238")
    metal = _rgb("#6a7088")
    draw.rectangle((0, SIZE - 8, SIZE - 1, SIZE - 1), fill=base)
    for x in range(6, SIZE - 6, 10):
        draw.polygon([(x, SIZE - 8), (x + 4, 10), (x + 8, SIZE - 8)], fill=metal)
    return img


def flag_tile() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rectangle((4, 4, 7, SIZE - 4), fill=_rgb("#3a3048"))
    draw.polygon([(8, 8), (42, 14), (8, 36)], fill=_rgb("#e8a040"))
    draw.line((10, 20, 38, 22), fill=_rgb("#f0d070"), width=2)
    return img


def main() -> None:
    save(ground_top(), "ground_top.png")
    save(ground_fill(), "ground_fill.png")
    save(brick_tile(), "brick.png")
    save(block_tile(), "block.png")
    save(platform_tile(), "platform.png")
    save(spike_tile(), "spike.png")
    save(flag_tile(), "flag.png")


if __name__ == "__main__":
    main()
