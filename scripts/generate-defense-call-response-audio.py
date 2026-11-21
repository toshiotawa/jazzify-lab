#!/usr/bin/env python3
"""Generate call-and-response backing tracks (MP3) for Phrase Defense.

Call bars: phrase melody + jazz swing drums.
Response bars: jazz swing drums only.
Loop lengths match barSeconds(bpm, beats_per_bar) * audio_loop_bars exactly.
"""
import math
import os
import random
import struct
import subprocess
import wave
from concurrent.futures import ProcessPoolExecutor, as_completed

SAMPLE_RATE = 44100
OUT_DIR = os.path.join("public", "sozai", "defense-call-response")

TUTORIAL_ROOT_MIDIS = (
    27,
    29,
    34,
    36,
    39,
    41,
    46,
    48,
    51,
    53,
    58,
    60,
    63,
    65,
    70,
    72,
    75,
    77,
    82,
    84,
)


def midi_to_freq(midi: int) -> float:
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def add_jazz_ep_note(buf_l, buf_r, start_sec: float, dur_sec: float, midi: int, vel: float = 0.42):
    """Warm jazz electric-piano / Rhodes-like tone with bell attack and smooth release."""
    freq = midi_to_freq(midi)
    start_idx = int(round(start_sec * SAMPLE_RATE))
    # Include a short release tail while clamping cleanly inside buffer
    total_sec = dur_sec + 0.14
    n_samples = int(round(total_sec * SAMPLE_RATE))
    two_pi = 2.0 * math.pi
    attack = 0.008
    release = 0.12

    for i in range(n_samples):
        idx = start_idx + i
        if idx < 0 or idx >= len(buf_l):
            continue
        t = i / SAMPLE_RATE
        if t < attack:
            env = t / attack
        elif t < dur_sec:
            env = math.exp(-2.2 * (t - attack))
            env = 0.35 + 0.65 * env
        else:
            rel_t = t - dur_sec
            base_at_dur = 0.35 + 0.65 * math.exp(-2.2 * max(0.0, dur_sec - attack))
            env = base_at_dur * max(0.0, 1.0 - rel_t / release)

        # Fundamental + warm 2nd/3rd harmonics + subtle tine bell (4th/7th fast decay)
        tine = math.exp(-24.0 * t)
        sig = (
            1.00 * math.sin(two_pi * freq * t)
            + 0.32 * math.sin(two_pi * freq * 2.0 * t) * math.exp(-3.5 * t)
            + 0.14 * math.sin(two_pi * freq * 3.0 * t) * math.exp(-6.0 * t)
            + 0.16 * math.sin(two_pi * freq * 4.0 * t) * tine
        )
        val = sig * env * vel * 0.52
        buf_l[idx] += val * 0.96
        buf_r[idx] += val * 1.04


def add_kick(buf_l, buf_r, start_sec: float, vel: float = 0.50):
    start_idx = int(round(start_sec * SAMPLE_RATE))
    n_samples = int(round(0.22 * SAMPLE_RATE))
    two_pi = 2.0 * math.pi
    phase = 0.0
    for i in range(n_samples):
        idx = start_idx + i
        if idx < 0 or idx >= len(buf_l):
            continue
        t = i / SAMPLE_RATE
        f = 48.0 + 92.0 * math.exp(-26.0 * t)
        phase += two_pi * f / SAMPLE_RATE
        env = math.exp(-13.0 * t)
        val = math.sin(phase) * env * vel
        buf_l[idx] += val
        buf_r[idx] += val


def add_ride(buf_l, buf_r, start_sec: float, vel: float = 0.22, accent: bool = False):
    start_idx = int(round(start_sec * SAMPLE_RATE))
    dur = 0.32 if accent else 0.19
    n_samples = int(round(dur * SAMPLE_RATE))
    two_pi = 2.0 * math.pi
    # Metallic inharmonic partials + high-frequency shimmer
    partials = (3120.0, 4490.0, 5870.0, 7430.0, 9120.0)
    rng = random.Random(int(start_sec * 10000) + (7 if accent else 3))
    prev_noise = 0.0
    for i in range(n_samples):
        idx = start_idx + i
        if idx < 0 or idx >= len(buf_l):
            continue
        t = i / SAMPLE_RATE
        env = math.exp(-(8.5 if accent else 15.0) * t)
        ping = math.exp(-42.0 * t) * (1.2 if accent else 0.6)
        metal = 0.0
        for p in partials:
            metal += math.sin(two_pi * p * t)
        noise = rng.uniform(-1.0, 1.0)
        hp_noise = noise - 0.85 * prev_noise
        prev_noise = noise
        sig = (metal * 0.12 + hp_noise * 0.35 + math.sin(two_pi * 2420.0 * t) * ping * 0.35) * env * vel
        buf_l[idx] += sig * 0.88
        buf_r[idx] += sig * 1.12


def add_hihat_chick(buf_l, buf_r, start_sec: float, vel: float = 0.24):
    """Jazz pedal hi-hat on beats 2 and 4."""
    start_idx = int(round(start_sec * SAMPLE_RATE))
    n_samples = int(round(0.085 * SAMPLE_RATE))
    rng = random.Random(int(start_sec * 10000) + 99)
    prev = 0.0
    for i in range(n_samples):
        idx = start_idx + i
        if idx < 0 or idx >= len(buf_l):
            continue
        t = i / SAMPLE_RATE
        env = math.exp(-42.0 * t)
        noise = rng.uniform(-1.0, 1.0)
        hp = noise - 0.9 * prev
        prev = noise
        val = hp * env * vel
        buf_l[idx] += val * 1.10
        buf_r[idx] += val * 0.90


def add_snare_brush(buf_l, buf_r, start_sec: float, vel: float = 0.16):
    """Soft jazz snare / rim tap."""
    start_idx = int(round(start_sec * SAMPLE_RATE))
    n_samples = int(round(0.11 * SAMPLE_RATE))
    two_pi = 2.0 * math.pi
    rng = random.Random(int(start_sec * 10000) + 55)
    for i in range(n_samples):
        idx = start_idx + i
        if idx < 0 or idx >= len(buf_l):
            continue
        t = i / SAMPLE_RATE
        body = math.sin(two_pi * 195.0 * t) * math.exp(-26.0 * t) * 0.45
        wire = rng.uniform(-1.0, 1.0) * math.exp(-22.0 * t) * 0.55
        val = (body + wire) * vel
        buf_l[idx] += val
        buf_r[idx] += val


def add_jazz_drum_bar(buf_l, buf_r, bar_start_sec: float, beat_sec: float, is_call: bool):
    """Add 1 bar (4/4) of jazz swing drums."""
    swing_off = beat_sec * (2.0 / 3.0)
    # Beat 1: clear downbeat kick + accented ride
    add_kick(buf_l, buf_r, bar_start_sec, vel=0.46 if is_call else 0.52)
    add_ride(buf_l, buf_r, bar_start_sec, vel=0.26, accent=True)
    # Beat 2: ride + pedal hi-hat chick + swing skip
    add_ride(buf_l, buf_r, bar_start_sec + beat_sec * 1.0, vel=0.22, accent=False)
    add_hihat_chick(buf_l, buf_r, bar_start_sec + beat_sec * 1.0, vel=0.24)
    add_ride(buf_l, buf_r, bar_start_sec + beat_sec * 1.0 + swing_off, vel=0.17, accent=False)
    # Beat 3: ride + light kick
    add_ride(buf_l, buf_r, bar_start_sec + beat_sec * 2.0, vel=0.24, accent=True)
    add_kick(buf_l, buf_r, bar_start_sec + beat_sec * 2.0, vel=0.20)
    # Beat 4: ride + pedal hi-hat chick + soft brush snare + swing skip
    add_ride(buf_l, buf_r, bar_start_sec + beat_sec * 3.0, vel=0.22, accent=False)
    add_hihat_chick(buf_l, buf_r, bar_start_sec + beat_sec * 3.0, vel=0.24)
    add_snare_brush(buf_l, buf_r, bar_start_sec + beat_sec * 3.0, vel=0.14)
    add_ride(buf_l, buf_r, bar_start_sec + beat_sec * 3.0 + swing_off, vel=0.18, accent=False)


def render_call_response_mp3(
    filename: str,
    bpm: float,
    beats_per_bar: int,
    audio_loop_bars: int,
    call_response_bars: int,
    melody_events_in_call_block,
):
    beat_sec = 60.0 / bpm
    bar_sec = beat_sec * beats_per_bar
    total_sec = bar_sec * audio_loop_bars
    n_samples = int(round(total_sec * SAMPLE_RATE))

    buf_l = [0.0] * n_samples
    buf_r = [0.0] * n_samples
    cycle_bars = call_response_bars * 2

    for bar_idx in range(audio_loop_bars):
        bar_start = bar_idx * bar_sec
        pos_in_cycle = bar_idx % cycle_bars
        is_call = pos_in_cycle < call_response_bars
        add_jazz_drum_bar(buf_l, buf_r, bar_start, beat_sec, is_call)
        if pos_in_cycle == 0:
            for (beat_offset, dur_beats, midi, vel) in melody_events_in_call_block:
                add_jazz_ep_note(
                    buf_l,
                    buf_r,
                    bar_start + beat_offset * beat_sec,
                    dur_beats * beat_sec,
                    midi,
                    vel,
                )

    # Gentle normalization with headroom so clipping never occurs
    peak = max(max(abs(x) for x in buf_l), max(abs(x) for x in buf_r), 1e-6)
    gain = min(1.0, 0.88 / peak)

    # Tiny 2ms edge fade so loop wrap has zero click
    fade_samples = min(int(0.002 * SAMPLE_RATE), n_samples // 4)
    for i in range(fade_samples):
        f = i / fade_samples
        buf_l[i] *= f
        buf_r[i] *= f
        buf_l[n_samples - 1 - i] *= f
        buf_r[n_samples - 1 - i] *= f

    os.makedirs(OUT_DIR, exist_ok=True)
    wav_path = os.path.join("/tmp", filename.replace(".mp3", ".wav"))
    mp3_path = os.path.join(OUT_DIR, filename)

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        raw = bytearray(n_samples * 4)
        for i in range(n_samples):
            sl = max(-32767, min(32767, int(round(buf_l[i] * gain * 32767))))
            sr = max(-32767, min(32767, int(round(buf_r[i] * gain * 32767))))
            struct.pack_into("<hh", raw, i * 4, sl, sr)
        wf.writeframes(raw)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            wav_path,
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "192k",
            "-ar",
            str(SAMPLE_RATE),
            mp3_path,
        ],
        check=True,
    )
    os.remove(wav_path)
    print(f"Generated {mp3_path} ({total_sec:.3f}s, {audio_loop_bars} bars @ {bpm} BPM)")


def render_tutorial_root_track(root_midi: int) -> None:
    render_call_response_mp3(
        filename=f"defense-tutorial-call-response-root-{root_midi}-bpm60.mp3",
        bpm=60.0,
        beats_per_bar=4,
        audio_loop_bars=8,
        call_response_bars=1,
        melody_events_in_call_block=[
            (0.0, 0.78, root_midi, 0.50),
            (1.0, 0.78, root_midi + 2, 0.50),
            (2.0, 0.78, root_midi + 4, 0.50),
        ],
    )


def main():
    # 1) Tutorial: Do-Re-Mi (C4=60, D4=62, E4=64), BPM 60, 4/4, 8-bar loop, 1-bar call / 1-bar response
    render_call_response_mp3(
        filename="defense-tutorial-call-response-cde-bpm60.mp3",
        bpm=60.0,
        beats_per_bar=4,
        audio_loop_bars=8,
        call_response_bars=1,
        melody_events_in_call_block=[
            (0.0, 0.78, 60, 0.50),
            (1.0, 0.78, 62, 0.50),
            (2.0, 0.78, 64, 0.50),
        ],
    )

    # 1b) Tutorial: per-root ascending tracks (same C-D-E pattern transposed), BPM 60
    with ProcessPoolExecutor(max_workers=min(len(TUTORIAL_ROOT_MIDIS), os.cpu_count() or 1)) as pool:
        futures = [pool.submit(render_tutorial_root_track, root_midi) for root_midi in TUTORIAL_ROOT_MIDIS]
        for future in as_completed(futures):
            future.result()

    # 2) Stage 1-1: Phrases I-IV (Dm7), BPM 120, 4/4, 8-bar loop, 1-bar call / 1-bar response
    swing_six_note_slots = [
        (0.0, 0.31),
        (2.0 / 3.0, 0.31),
        (1.0, 0.31),
        (1.0 + 2.0 / 3.0, 0.31),
        (2.0, 0.31),
        (2.0 + 2.0 / 3.0, 1.10),
    ]
    stage_1_1_phrases = [
        ("defense-stage-1-1-cr-phrase-1-bpm120.mp3", [76, 74, 69, 65, 64, 62]),
        ("defense-stage-1-1-cr-phrase-2-bpm120.mp3", [64, 65, 69, 72, 76, 74]),
        ("defense-stage-1-1-cr-phrase-3-bpm120.mp3", [74, 76, 77, 79, 76, 74]),
        ("defense-stage-1-1-cr-phrase-4-bpm120.mp3", [64, 61, 62, 64, 65, 67]),
    ]
    for filename, midis in stage_1_1_phrases:
        events = [
            (beat_off, dur, midi, 0.48)
            for (beat_off, dur), midi in zip(swing_six_note_slots, midis)
        ]
        render_call_response_mp3(
            filename=filename,
            bpm=120.0,
            beats_per_bar=4,
            audio_loop_bars=8,
            call_response_bars=1,
            melody_events_in_call_block=events,
        )


if __name__ == "__main__":
    main()
