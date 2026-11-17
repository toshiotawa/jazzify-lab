#!/usr/bin/env python3
"""Fallback: play swing MIDI into Kontakt standalone and record BlackHole."""

from __future__ import annotations

import argparse
import subprocess
import time
from pathlib import Path

import mido

ROOT = Path(__file__).resolve().parent
WORKHORSE_NKI = Path(
    "/Volumes/Jazznum/Sasaki Trumpet/Instruments/Natural - Workhorse.nki"
)
KONTAKT_APP = Path("/Applications/Native Instruments/Kontakt 8/Kontakt 8.app")


def pick_port(names: list[str], needle: str) -> str:
    matches = [n for n in names if needle.lower() in n.lower()]
    if not matches:
        raise RuntimeError(f"MIDI port matching '{needle}' not found. Available: {names}")
    return matches[0]


def play_midi_realtime(midi_path: Path, port_name: str, lead_in: float = 2.0) -> float:
    mid = mido.MidiFile(str(midi_path))
    wait = lead_in + mid.length + 2.0
    with mido.open_output(port_name) as port:
        time.sleep(lead_in)
        t0 = time.perf_counter()
        for msg in mid.play():
            if not msg.is_meta:
                port.send(msg)
        elapsed = time.perf_counter() - t0
    time.sleep(2.0)
    return wait


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--midi",
        type=Path,
        default=ROOT / "out/II-V_1-5_12keys_swing.mid",
    )
    ap.add_argument(
        "--wav",
        type=Path,
        default=ROOT / "out/II-V_1-5_12keys_workhorse.wav",
    )
    ap.add_argument(
        "--blackhole",
        default="BlackHole 2ch",
        help="ffmpeg avfoundation audio device name",
    )
    ap.add_argument("--midi-port-substr", default="IAC")
    args = ap.parse_args()

    if not WORKHORSE_NKI.is_file():
        raise FileNotFoundError(WORKHORSE_NKI)

    subprocess.run(
        ["open", "-a", str(KONTAKT_APP), str(WORKHORSE_NKI)],
        check=False,
    )
    time.sleep(12)

    out_port = pick_port(mido.get_output_names(), args.midi_port_substr)
    mid = mido.MidiFile(str(args.midi))
    record_sec = int(mid.length + 8)

    args.wav.parent.mkdir(parents=True, exist_ok=True)
    rec_cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "avfoundation",
        "-i",
        f":{args.blackhole}",
        "-t",
        str(record_sec),
        "-ac",
        "2",
        "-ar",
        "44100",
        str(args.wav),
    ]

    print("recording", record_sec, "sec from", args.blackhole)
    proc = subprocess.Popen(rec_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(1.5)
    print("playing midi via", out_port)
    play_midi_realtime(args.midi, out_port)
    out, err = proc.communicate(timeout=record_sec + 30)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {err.decode(errors='ignore')[-500:]}")
    print("wrote", args.wav, "stderr tail:", err.decode(errors="ignore")[-200:])


if __name__ == "__main__":
    main()
