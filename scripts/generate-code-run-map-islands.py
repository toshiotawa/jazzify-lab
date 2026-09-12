#!/usr/bin/env python3
"""Code Run ワールドマップ用の浮島スプライトを Kenney タイルから合成する。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

TILE = 48
KENNEY = (
    Path(__file__).resolve().parent.parent
    / "public"
    / "RUN"
    / "kenney_new-platformer-pack-1"
    / "Sprites"
    / "Tiles"
    / "Default"
)
WEB_OUT = Path(__file__).resolve().parent.parent / "public" / "code-run-map"
IOS_OUT = (
    Path(__file__).resolve().parent.parent
    / "ios"
    / "Jazzify"
    / "Assets.xcassets"
    / "CodeRunMap"
)

BIOMES = ("grass", "sand", "snow", "stone", "purple")


def load_tile(biome: str, name: str) -> Image.Image:
    path = KENNEY / f"terrain_{biome}_{name}.png"
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGBA")


def compose_small_island(biome: str) -> Image.Image:
    """3x2 タイルの小島（草上 + 土下）。"""
    cols, rows = 3, 2
    canvas = Image.new("RGBA", (cols * TILE, rows * TILE), (0, 0, 0, 0))
    top_row = [
        load_tile(biome, "block_top_left"),
        load_tile(biome, "block_top"),
        load_tile(biome, "block_top_right"),
    ]
    bottom_row = [
        load_tile(biome, "block_left"),
        load_tile(biome, "block_center"),
        load_tile(biome, "block_right"),
    ]
    for col, tile in enumerate(top_row):
        canvas.paste(tile, (col * TILE, 0), tile)
    for col, tile in enumerate(bottom_row):
        canvas.paste(tile, (col * TILE, TILE), tile)
    return canvas


def compose_big_island(biome: str) -> Image.Image:
    """5x2 タイルの大島（末尾中央ノード用）。"""
    cols, rows = 5, 2
    canvas = Image.new("RGBA", (cols * TILE, rows * TILE), (0, 0, 0, 0))
    top_names = [
        "block_top_left",
        "block_top",
        "block_top",
        "block_top",
        "block_top_right",
    ]
    bottom_names = [
        "block_left",
        "block_center",
        "block_center",
        "block_center",
        "block_right",
    ]
    for col, name in enumerate(top_names):
        tile = load_tile(biome, name)
        canvas.paste(tile, (col * TILE, 0), tile)
    for col, name in enumerate(bottom_names):
        tile = load_tile(biome, name)
        canvas.paste(tile, (col * TILE, TILE), tile)
    return canvas


def save_web(img: Image.Image, name: str) -> None:
    WEB_OUT.mkdir(parents=True, exist_ok=True)
    path = WEB_OUT / name
    img.save(path, "WEBP", quality=92, method=6)
    print(path)


def save_ios(img: Image.Image, asset_name: str) -> None:
    imageset = IOS_OUT / f"{asset_name}.imageset"
    imageset.mkdir(parents=True, exist_ok=True)
    png_path = imageset / f"{asset_name}.png"
    img.save(png_path, "PNG", optimize=True)
    contents = {
        "images": [{"filename": png_path.name, "idiom": "universal", "scale": "1x"}],
        "info": {"author": "xcode", "version": 1},
    }
    import json

    (imageset / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")
    print(png_path)


def copy_sky_assets() -> None:
    bg_dir = KENNEY.parent.parent / "Backgrounds" / "Default"
    sky_src = bg_dir / "background_solid_sky.png"
    clouds_src = bg_dir / "background_clouds.png"
    if sky_src.exists():
        sky = Image.open(sky_src).convert("RGBA")
        save_web(sky, "sky.webp")
        save_ios(sky, "code_run_map_sky")
    if clouds_src.exists():
        clouds = Image.open(clouds_src).convert("RGBA")
        save_web(clouds, "clouds.webp")
        save_ios(clouds, "code_run_map_clouds")


def main() -> None:
    for biome in BIOMES:
        small = compose_small_island(biome)
        big = compose_big_island(biome)
        save_web(small, f"island_small_{biome}.webp")
        save_web(big, f"island_big_{biome}.webp")
        save_ios(small, f"code_run_map_island_small_{biome}")
        save_ios(big, f"code_run_map_island_big_{biome}")
    copy_sky_assets()
    print("Done.")


if __name__ == "__main__":
    main()
