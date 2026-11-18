"""Local audio file resolution and FFmpeg clipping (no remote download)."""

from __future__ import annotations

import csv
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from jazzlicks.db import AUDIO_DIR, DEFAULT_YT_CSV_PATH, WAV_DIR, ensure_youtube_csv

PAD_SEC = 0.5

AudioIndex = dict[str, Path]


def _build_audio_index(audio_dir: Path) -> AudioIndex:
    index: AudioIndex = {}
    if not audio_dir.is_dir():
        return index
    for p in audio_dir.rglob("*"):
        if p.suffix.lower() in {".wav", ".mp3", ".flac", ".m4a", ".aiff", ".aif", ".ogg"}:
            index[p.stem.lower()] = p
            index[p.name.lower()] = p
    return index


_AUDIO_INDEX: AudioIndex | None = None


def get_audio_index() -> AudioIndex:
    global _AUDIO_INDEX
    if _AUDIO_INDEX is None:
        _AUDIO_INDEX = _build_audio_index(AUDIO_DIR)
    return _AUDIO_INDEX


def resolve_local_audio(
    melid: int,
    mbzid: str | None,
    filename_track: str | None,
) -> Path | None:
    index = get_audio_index()
    candidates: list[str] = [
        str(melid),
        f"melid_{melid}",
    ]
    if mbzid:
        candidates.append(mbzid)
    if filename_track:
        stem = Path(filename_track).stem
        candidates.extend([filename_track, stem])
    for key in candidates:
        k = key.lower()
        if k in index:
            return index[k]
    for key, path in index.items():
        if str(melid) in key:
            return path
    return None


def probe_duration(path: Path) -> float | None:
    if not shutil.which("ffprobe"):
        return None
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            text=True,
        )
        return float(out.strip())
    except (subprocess.CalledProcessError, ValueError):
        return None


def audio_status_for_melid(
    melid: int,
    mbzid: str | None,
    filename_track: str | None,
    *,
    time_warning: bool,
    track_start_pad: float | None,
    track_end_pad: float | None,
) -> str:
    path = resolve_local_audio(melid, mbzid, filename_track)
    if path is None:
        return "missing"
    if time_warning:
        return "time_warning"
    if track_end_pad is None or track_start_pad is None:
        return "missing"
    if track_start_pad < 0:
        return "duration_mismatch"
    dur = probe_duration(path)
    if dur is not None and track_end_pad > dur + 0.01:
        return "duration_mismatch"
    return "ready"


def load_youtube_links(csv_path: Path | None = None) -> dict[int, list[str]]:
    path = csv_path or DEFAULT_YT_CSV_PATH
    if not path.exists():
        try:
            ensure_youtube_csv(path)
        except OSError:
            return {}
    by_melid: dict[int, list[str]] = {}
    with path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            try:
                melid = int(row.get("melid") or row.get("Melid") or 0)
            except ValueError:
                continue
            yid = (row.get("youtube_id") or "").strip()
            if not melid or not yid:
                continue
            by_melid.setdefault(melid, [])
            if yid not in by_melid[melid]:
                by_melid[melid].append(yid)
    return by_melid


def clip_ready_rows(
    rows: list[dict[str, Any]],
    *,
    out_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """Cut WAV clips for rows with audio_status == ready."""
    if not shutil.which("ffmpeg"):
        return []
    wav_dir = out_dir or WAV_DIR
    wav_dir.mkdir(parents=True, exist_ok=True)
    written: list[dict[str, Any]] = []
    for row in rows:
        if row.get("audio_status") != "ready":
            continue
        melid = row["melid"]
        path = resolve_local_audio(
            melid, row.get("track_mbzid"), row.get("filename_track")
        )
        if path is None:
            continue
        t0 = row["track_pad_start_sec"]
        t1 = row["track_pad_end_sec"]
        if t0 is None or t1 is None:
            continue
        out_path = wav_dir / f"melid_{melid}_idx{row['start_idx']}.wav"
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-ss",
                    str(max(0.0, float(t0))),
                    "-to",
                    str(float(t1)),
                    "-i",
                    str(path),
                    "-acodec",
                    "pcm_s16le",
                    str(out_path),
                ],
                check=True,
            )
            meta = {**row, "wav_path": str(out_path)}
            written.append(meta)
        except subprocess.CalledProcessError:
            row["audio_status"] = "clip_failed"
    manifest = wav_dir / "clips_manifest.json"
    manifest.write_text(json.dumps(written, indent=2, ensure_ascii=False), encoding="utf-8")
    return written


def clip_from_csv(csv_path: Path, wav_dir: Path | None = None) -> int:
    rows: list[dict[str, Any]] = []
    with csv_path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows.extend(reader)
    for r in rows:
        r["melid"] = int(r["melid"])
        if r.get("track_pad_start_sec"):
            r["track_pad_start_sec"] = float(r["track_pad_start_sec"])
        if r.get("track_pad_end_sec"):
            r["track_pad_end_sec"] = float(r["track_pad_end_sec"])
    return len(clip_ready_rows(rows, out_dir=wav_dir))
