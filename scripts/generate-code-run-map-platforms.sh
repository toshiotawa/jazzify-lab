#!/usr/bin/env bash
# Kenney Pixel Platformer 18x18 タイル3枚から、コードラン Night City マップ用足場を生成する。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TILE_DIR="$ROOT/assets/code-run-map/tiles"
WEB_OUT="$ROOT/public/code-run-map"
IOS_OUT="$ROOT/ios/Jazzify/Assets.xcassets/CodeRunMap"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (magick) is required." >&2
  exit 1
fi

mkdir -p "$WEB_OUT" "$IOS_OUT"

for i in 1 2 3; do
  src="$TILE_DIR/tile_000${i}.png"
  if [[ ! -f "$src" ]]; then
    echo "Missing tile: $src" >&2
    exit 1
  fi
  magick "$src" -fuzz 2% -transparent '#434a5f' "$WORK/k${i}.png"
  magick "$WORK/k${i}.png" -crop 18x14+0+2 +repage "$WORK/c${i}.png"
  magick "$WORK/k${i}.png" -crop 18x6+0+10 +repage "$WORK/d${i}.png"
  magick "$WORK/d${i}.png" -crop 18x2+0+0 +repage -fill '#7a4a48' -colorize 60 "$WORK/b${i}.png"
done

magick "$WORK/c1.png" "$WORK/c3.png" +append "$WORK/s_top.png"
magick "$WORK/b1.png" "$WORK/b3.png" +append "$WORK/s_bot.png"
magick "$WORK/s_top.png" "$WORK/s_bot.png" -append -background none "$WORK/small_orig.png"

magick "$WORK/c1.png" "$WORK/c2.png" "$WORK/c2.png" "$WORK/c3.png" +append "$WORK/b_top.png"
magick "$WORK/d1.png" "$WORK/d2.png" "$WORK/d2.png" "$WORK/d3.png" +append "$WORK/b_strip.png"
magick "$WORK/b1.png" "$WORK/b2.png" "$WORK/b2.png" "$WORK/b3.png" +append "$WORK/b_bot.png"
magick "$WORK/b_top.png" "$WORK/b_strip.png" "$WORK/b_bot.png" -append -background none "$WORK/big_orig.png"

recolor() {
  magick "$1" -fuzz 1% \
    -fill '#4fb98a' -opaque '#36e377' \
    -fill '#2f7f62' -opaque '#2eb082' \
    -fill '#4a3446' -opaque '#9f5a52' \
    -fill '#6d4c5c' -opaque '#cb815e' \
    -fill '#9a7480' -opaque '#f4ac66' \
    "$2"
}

recolor "$WORK/small_orig.png" "$WORK/platform_small.png"
recolor "$WORK/big_orig.png" "$WORK/platform_big.png"

cp "$WORK/platform_small.png" "$WEB_OUT/platform_small.png"
cp "$WORK/platform_big.png" "$WEB_OUT/platform_big.png"

magick "$ROOT/public/RUN/background.png" -resize 1280x -quality 80 "$WEB_OUT/night_city_bg.webp"

write_imageset() {
  local asset_name="$1"
  local src="$2"
  local imageset="$IOS_OUT/${asset_name}.imageset"
  mkdir -p "$imageset"
  cp "$src" "$imageset/${asset_name}.png"
  cat > "$imageset/Contents.json" <<EOF
{
  "images": [
    {
      "filename": "${asset_name}.png",
      "idiom": "universal",
      "scale": "1x"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
EOF
  echo "$imageset/${asset_name}.png"
}

write_imageset code_run_map_platform_small "$WORK/platform_small.png"
write_imageset code_run_map_platform_big "$WORK/platform_big.png"

magick identify "$WEB_OUT/platform_small.png" "$WEB_OUT/platform_big.png" "$WEB_OUT/night_city_bg.webp"
echo "Done."
