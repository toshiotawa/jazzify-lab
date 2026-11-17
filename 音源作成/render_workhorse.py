#!/usr/bin/env python3
"""Render swing MIDI through Kontakt 7 VST3 + a Kontakt instrument (.nki)."""

from __future__ import annotations

import argparse
import shutil
import wave
from pathlib import Path

import dawdreamer as daw
import numpy as np

ROOT = Path(__file__).resolve().parent
KONTAKT_AU = Path("/Library/Audio/Plug-Ins/VST3/Kontakt 7.vst3")
AGWF_VST3 = Path("/Library/Audio/Plug-Ins/VST3/AGWF.vst3")
DEFAULT_INSTRUMENT_NKI = Path(
    "/Volumes/Jazznum/Sasaki Trumpet/Instruments/Natural - Workhorse.nki"
)
HINTERLAND_LEGATO_NKI = Path(
    "/Volumes/Jazznum/Hinterland/Instruments/Clean/Hinterland - Legato.nki"
)
KONTAKT_DEFAULT_NKI = Path(
    "/Users/apple/Library/Application Support/Native Instruments/Kontakt 7/default/kontakt_def.nki"
)
DEFAULT_STATE_PATH = ROOT / "state" / "natural_workhorse.dawstate"
DEFAULT_BACKUP = ROOT / "state" / "kontakt_def.nki.bak"

SAMPLE_RATE = 44_100
BUFFER_SIZE = 512
TAIL_SEC = 2.0


def _prepare_kontakt_default(instrument_nki: Path) -> None:
    if not instrument_nki.is_file():
        raise FileNotFoundError(f"Missing instrument: {instrument_nki}")
    if not KONTAKT_DEFAULT_NKI.is_file():
        raise FileNotFoundError(f"Missing Kontakt default nki: {KONTAKT_DEFAULT_NKI}")

    DEFAULT_BACKUP.parent.mkdir(parents=True, exist_ok=True)
    if not DEFAULT_BACKUP.exists():
        shutil.copy2(KONTAKT_DEFAULT_NKI, DEFAULT_BACKUP)
    shutil.copy2(instrument_nki, KONTAKT_DEFAULT_NKI)


def _restore_kontakt_default() -> None:
    if DEFAULT_BACKUP.is_file():
        shutil.copy2(DEFAULT_BACKUP, KONTAKT_DEFAULT_NKI)


def _midi_seconds(midi_path: Path, tempo_bpm: float = 160.0) -> float:
    from mido import MidiFile

    mid = MidiFile(str(midi_path))
    if mid.length > 0:
        return mid.length
    # fallback from tick length
    ticks = max((msg.time for track in mid.tracks for msg in track), default=0)
    return ticks * (60.0 / tempo_bpm) / 480.0


def _write_wav(path: Path, audio: np.ndarray, sample_rate: int) -> None:
    audio = np.asarray(audio, dtype=np.float32)
    if audio.ndim == 1:
        audio = audio[None, :]
    elif audio.ndim == 2 and audio.shape[0] > audio.shape[1]:
        audio = audio.T
    channels, frames = audio.shape
    pcm = np.clip(audio, -1.0, 1.0)
    pcm_i16 = (pcm * 32767.0).astype(np.int16)

    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        if channels == 1:
            wf.writeframes(pcm_i16.T.tobytes())
        else:
            interleaved = np.zeros((frames, channels), dtype=np.int16)
            for ch in range(channels):
                interleaved[:, ch] = pcm_i16[ch]
            wf.writeframes(interleaved.tobytes())


def _probe_peak(engine: daw.RenderEngine, synth) -> float:
    synth.clear_midi()
    synth.add_midi_note(67, 110, 0.05, 0.6)
    engine.load_graph([(synth, [])])
    engine.render(1.2)
    peak = float(np.max(np.abs(engine.get_audio())))
    synth.clear_midi()
    return peak


def _pick_stereo(audio: np.ndarray) -> np.ndarray:
    if audio.ndim != 2:
        return audio
    if audio.shape[0] <= 2:
        return audio[:2]
    # Use loudest adjacent pair for multi-out Kontakt
    energies = [float(np.mean(audio[i] ** 2) + np.mean(audio[i + 1] ** 2)) for i in range(0, audio.shape[0] - 1, 2)]
    best = int(np.argmax(energies)) * 2 if energies else 0
    return audio[best : best + 2]


def render(
    midi_path: Path,
    wav_path: Path,
    *,
    instrument_nki: Path,
    state_path: Path,
    preset_label: str,
    force_preset: bool = False,
    bpm: float = 160.0,
    plugin_path: Path = KONTAKT_AU,
) -> dict:
    midi_path = midi_path.resolve()
    wav_path = wav_path.resolve()
    state_path = state_path.resolve()

    had_state = state_path.is_file() and not force_preset
    is_kontakt = plugin_path.name.startswith("Kontakt")
    if not had_state and is_kontakt:
        _prepare_kontakt_default(instrument_nki)

    try:
        engine = daw.RenderEngine(SAMPLE_RATE, BUFFER_SIZE)
        engine.set_bpm(bpm)
        synth = engine.make_plugin_processor("instrument", str(plugin_path))

        if had_state:
            synth.load_state(str(state_path))
            if _probe_peak(engine, synth) < 1e-5:
                print(
                    "保存した state を読んでも無音です。"
                    f" Kontakt で {preset_label} を確認し、ウィンドウを閉じてください。"
                    " 閉じたあと、このまま書き出します。",
                    flush=True,
                )
                synth.open_editor()
                state_path.parent.mkdir(parents=True, exist_ok=True)
                synth.save_state(str(state_path))
        else:
            print(
                f"Kontakt 7 が開きます。{preset_label} を読み、ウィンドウを閉じてください。",
                flush=True,
            )
            synth.open_editor()
            state_path.parent.mkdir(parents=True, exist_ok=True)
            synth.save_state(str(state_path))

        if _probe_peak(engine, synth) < 1e-5:
            raise RuntimeError(
                f"{preset_label} が鳴っていません。"
                " ウィンドウでその音色を読み込んでから閉じて、もう一度実行してください。"
            )

        synth.load_midi(
            str(midi_path),
            clear_previous=True,
            beats=False,
            all_events=True,
        )
        duration = _midi_seconds(midi_path) + TAIL_SEC
        engine.load_graph([(synth, [])])
        engine.render(duration)
        audio = engine.get_audio()
        audio = _pick_stereo(audio)
        _write_wav(wav_path, audio, SAMPLE_RATE)

        peak = float(np.max(np.abs(audio)))
        rms = float(np.sqrt(np.mean(audio**2)))
        if peak < 1e-6:
            raise RuntimeError(
                f"レンダリング結果が無音です。{preset_label} を読み込んだ state を作成してください。"
            )
        return {
            "wav": str(wav_path),
            "duration_sec": duration,
            "peak": peak,
            "rms": rms,
            "channels": int(audio.shape[0]),
            "used_saved_state": had_state,
        }
    finally:
        if not had_state and is_kontakt:
            _restore_kontakt_default()


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
    ap.add_argument("--force-preset", action="store_true")
    ap.add_argument(
        "--nki",
        type=Path,
        default=DEFAULT_INSTRUMENT_NKI,
        help="Kontakt instrument to load when bootstrapping state",
    )
    ap.add_argument(
        "--state",
        type=Path,
        default=DEFAULT_STATE_PATH,
        help="DawDreamer plugin state file for this instrument",
    )
    ap.add_argument(
        "--preset-label",
        default="Natural - Workhorse",
        help="Name shown when Kontakt GUI must be confirmed",
    )
    ap.add_argument("--bpm", type=float, default=160.0, help="Transport BPM")
    ap.add_argument("--plugin", type=Path, default=KONTAKT_AU, help="VST3 plugin to render")
    args = ap.parse_args()
    stats = render(
        args.midi,
        args.wav,
        instrument_nki=args.nki,
        state_path=args.state,
        preset_label=args.preset_label,
        force_preset=args.force_preset,
        bpm=args.bpm,
        plugin_path=args.plugin,
    )
    print(stats)


if __name__ == "__main__":
    main()
