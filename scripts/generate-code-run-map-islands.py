#!/usr/bin/env python3
"""Kenney の浮島タイル (terrain_*_cloud) を iOS Asset Catalog へそのままコピーする。"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KENNEY_TILES = ROOT / "public/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default"
KENNEY_BG = ROOT / "public/RUN/kenney_new-platformer-pack-1/Sprites/Backgrounds/Default"
IOS_OUT = ROOT / "ios/Jazzify/Assets.xcassets/CodeRunMap"
BIOMES = ("grass", "sand", "snow", "stone", "purple")


def write_imageset(asset_name: str, src: Path) -> None:
    imageset = IOS_OUT / f"{asset_name}.imageset"
    imageset.mkdir(parents=True, exist_ok=True)
    dest = imageset / f"{asset_name}.png"
    shutil.copyfile(src, dest)
    contents = {
        "images": [{"filename": dest.name, "idiom": "universal", "scale": "1x"}],
        "info": {"author": "xcode", "version": 1},
    }
    (imageset / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")
    print(dest)


def main() -> None:
    for biome in BIOMES:
        src = KENNEY_TILES / f"terrain_{biome}_cloud.png"
        write_imageset(f"code_run_map_island_small_{biome}", src)
        write_imageset(f"code_run_map_island_big_{biome}", src)
    write_imageset("code_run_map_sky", KENNEY_BG / "background_solid_sky.png")
    write_imageset("code_run_map_clouds", KENNEY_BG / "background_clouds.png")
    print("Done.")


if __name__ == "__main__":
    main()
