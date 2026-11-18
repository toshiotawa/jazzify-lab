#!/usr/bin/env python3
"""Render lick videos (Jazzify staff slides) from lick definition + DTL audio."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from jazzlicks.covers import COVERS_DIR, download_cover_for_recording, is_placeholder
from jazzlicks.db import OUT_DIR, connect
from jazzlicks.licks import load_lick
from jazzlicks.notation import (
    build_lick_entries,
    entry_to_score_payload,
    export_ordered_playlist,
)


def cover_path_for_melid(melid: int) -> Path:
    return COVERS_DIR / f"melid_{melid}.jpg"


def entry_slug(entry) -> str:
    return f"melid_{entry.melid}_{entry.start_idx}"


def migrate_legacy_covers(entries) -> None:
    """Copy 02_Performer_pos.jpg style covers to melid_{melid}.jpg once."""
    import re

    if not COVERS_DIR.is_dir():
        return
    legacy = {}
    for p in COVERS_DIR.glob("*.jpg"):
        m = re.match(r"^\d{2}_.+_(\d+)\.jpg$", p.name)
        if not m:
            continue
        legacy[int(m.group(1))] = p
    for e in entries:
        dest = cover_path_for_melid(e.melid)
        if dest.exists() and not is_placeholder(dest):
            continue
        src = legacy.get(e.start_idx)
        if src and src.is_file() and not is_placeholder(src):
            shutil.copy2(src, dest)
            print("migrated cover", src.name, "->", dest.name)


def concat_audio(files: list[Path], dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if len(files) == 1:
        shutil.copy2(files[0], dest)
        return dest
    list_file = dest.with_suffix(".txt")
    list_file.write_text(
        "\n".join(f"file '{f.resolve()}'" for f in files), encoding="utf-8"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(dest),
        ],
        check=True,
    )
    list_file.unlink(missing_ok=True)
    return dest


def make_video(frame: Path, audio: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-loop",
            "1",
            "-i",
            str(frame),
            "-i",
            str(audio),
            "-c:v",
            "libx264",
            "-tune",
            "stillimage",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-pix_fmt",
            "yuv420p",
            "-shortest",
            str(dest),
        ],
        check=True,
    )


def concat_videos(paths: list[Path], dest: Path) -> None:
    if not paths:
        return
    list_file = dest.with_suffix(".txt")
    list_file.write_text(
        "\n".join(f"file '{p.resolve()}'" for p in paths), encoding="utf-8"
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-c",
            "copy",
            str(dest),
        ],
        check=True,
    )
    list_file.unlink(missing_ok=True)


def run_capture(config: Path, frame_dir: Path) -> None:
    score_render = ROOT / "score-render"
    bundle = score_render / "dist-staff" / "staff-bundle.js"
    if not bundle.is_file():
        subprocess.run(["npm", "run", "build"], cwd=score_render / "staff-bundle", check=True)
    if not (score_render / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=score_render, check=True)
    subprocess.run(
        ["node", "capture.mjs", str(config), str(frame_dir)],
        cwd=score_render,
        check=True,
    )


def refresh_covers(entries) -> None:
    seen_melids: set[int] = set()
    for entry in entries:
        if entry.melid in seen_melids:
            continue
        seen_melids.add(entry.melid)
        cover_path = cover_path_for_melid(entry.melid)
        slug = f"melid_{entry.melid}"
        need = is_placeholder(cover_path)
        download_cover_for_recording(
            entry.track_mbzid,
            cover_path,
            performer=entry.performer,
            title=entry.title,
            record_mbzid=entry.record_mbzid,
            record_title=entry.record_title,
            force=need,
            slug=slug,
        )
        size = cover_path.stat().st_size if cover_path.exists() else 0
        flag = "placeholder" if is_placeholder(cover_path) else "ok"
        print(f"cover melid_{entry.melid}: {size} bytes ({flag})")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lick", default="somisira")
    args = parser.parse_args()
    lick = load_lick(args.lick)

    conn = connect()
    entries = build_lick_entries(conn, args.lick)
    conn.close()

    out_base = OUT_DIR / "videos"
    playlist_path = OUT_DIR / f"{lick.id}_ordered.csv"
    export_ordered_playlist(entries, playlist_path)
    migrate_legacy_covers(entries)
    refresh_covers(entries)

    audio_work = out_base / "audio"
    capture_items: list[dict] = []

    for entry in entries:
        slug = entry_slug(entry)
        audio_out = audio_work / f"{slug}.mp3"
        concat_audio(entry.audio_files, audio_out)
        cover_path = cover_path_for_melid(entry.melid)
        score = entry_to_score_payload(entry, lick)
        for orientation in ("horizontal", "vertical", "vertical_lower"):
            capture_items.append(
                {
                    "id": slug,
                    "orientation": orientation,
                    "performer": entry.performer,
                    "title": entry.title,
                    "recordTitle": entry.record_title,
                    "coverUri": cover_path.resolve().as_uri(),
                    "scoreData": score,
                }
            )

    frame_dir = out_base / "frames"
    config_path = out_base / "capture_config.json"
    config_path.write_text(json.dumps(capture_items, indent=2), encoding="utf-8")
    run_capture(config_path, frame_dir)

    h_clips: list[Path] = []
    v_clips: list[Path] = []
    vl_clips: list[Path] = []

    for entry in entries:
        slug = entry_slug(entry)
        audio = audio_work / f"{slug}.mp3"
        h_frame = frame_dir / f"{slug}_horizontal.png"
        v_frame = frame_dir / f"{slug}_vertical.png"
        vl_frame = frame_dir / f"{slug}_vertical_lower.png"
        h_out = out_base / "horizontal" / f"{slug}.mp4"
        v_out = out_base / "vertical" / f"{slug}.mp4"
        vl_out = out_base / "vertical_lower" / f"{slug}.mp4"
        make_video(h_frame, audio, h_out)
        make_video(v_frame, audio, v_out)
        make_video(vl_frame, audio, vl_out)
        h_clips.append(h_out)
        v_clips.append(v_out)
        vl_clips.append(vl_out)
        print("rendered", slug)

    concat_videos(h_clips, out_base / f"{lick.id}_horizontal.mp4")
    concat_videos(v_clips, out_base / f"{lick.id}_vertical.mp4")
    concat_videos(vl_clips, out_base / f"{lick.id}_vertical_lower.mp4")
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
