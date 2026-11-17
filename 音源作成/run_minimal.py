#!/usr/bin/env python3
"""End-to-end minimal pipeline: MusicXML -> swing MIDI -> Kontakt render -> MP3."""

from __future__ import annotations

import argparse
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
PY = ROOT / ".venv/bin/python"


def wav_stats(path: Path) -> tuple[float, float]:
    with wave.open(str(path), "rb") as wf:
        frames = wf.readframes(wf.getnframes())
        sw = wf.getsampwidth()
    if sw == 2:
        audio = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    elif sw == 3:
        arr = np.frombuffer(frames, dtype=np.uint8).reshape(-1, 3)
        audio = (
            (arr[:, 0].astype(np.int32))
            | (arr[:, 1].astype(np.int32) << 8)
            | (arr[:, 2].astype(np.int32) << 16)
        )
        audio = np.where(audio & 0x800000, audio - 0x1000000, audio).astype(np.float32)
        audio /= 8388608.0
    else:
        audio = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / (2**31)
    if audio.ndim == 1:
        audio = audio.reshape(-1, 1)
    else:
        audio = audio.reshape(-1, wf.getnchannels())
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio**2)))
    return peak, rms


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--musicxml",
        type=Path,
        default=Path("/Users/apple/Downloads/II-V 1-5 2barずつ_12keys.musicxml"),
    )
    ap.add_argument("--midi", type=Path, default=ROOT / "out/II-V_1-5_12keys_swing.mid")
    ap.add_argument("--wav", type=Path, default=ROOT / "out/II-V_1-5_12keys_workhorse.wav")
    ap.add_argument("--mp3", type=Path, default=ROOT / "out/II-V_1-5_12keys_workhorse.mp3")
    args = ap.parse_args()

    subprocess.run(
        [str(PY), str(ROOT / "musicxml_to_swing_midi.py"), str(args.musicxml), "-o", str(args.midi)],
        check=True,
    )
    render = subprocess.run(
        [str(PY), str(ROOT / "render_workhorse.py"), "--midi", str(args.midi), "--wav", str(args.wav)],
        check=False,
    )
    if render.returncode != 0:
        raise SystemExit(render.returncode)

    peak, rms = wav_stats(args.wav)
    if peak < 1e-5:
        raise SystemExit(
            f"WAV が無音です (peak={peak}). bootstrap をやり直し、Workhorse を確認してください。"
        )

    args.mp3.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(args.wav),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            str(args.mp3),
        ],
        check=True,
    )
    print({"midi": str(args.midi), "wav": str(args.wav), "mp3": str(args.mp3), "peak": peak, "rms": rms})


if __name__ == "__main__":
    main()
