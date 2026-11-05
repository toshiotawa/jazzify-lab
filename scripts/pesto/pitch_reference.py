"""Independent acoustic reference estimates; neither PESTO nor nominal MIDI is an input.

These are diagnostics, not human-annotated ground truth. Disagreement is retained.
"""
import numpy as np
from scipy.signal import correlate, find_peaks

SAMPLE_RATE = 48000
WINDOW = 8192
MIN_HZ = 25
MAX_HZ = 2200
AGREEMENT_CENTS = 20


def midi(frequency):
    return float(69 + 12 * np.log2(frequency / 440))


def interpolate_peak(values, index):
    if index == 0 or index == len(values) - 1:
        return float(index)
    left, center, right = values[index - 1:index + 2]
    denominator = left - 2 * center + right
    return float(index + np.clip(0.5 * (left - right) / denominator, -0.5, 0.5)) if denominator != 0 else float(index)


def periodicity_pitch(samples):
    """YIN-style cumulative mean normalized difference, with available-pair normalization."""
    values = np.asarray(samples, dtype=np.float64)
    values = values - values.mean()
    minimum, maximum = int(SAMPLE_RATE / MAX_HZ), int(SAMPLE_RATE / MIN_HZ)
    correlation = correlate(values, values, mode='full', method='fft')[len(values) - 1:len(values) + maximum]
    energy = np.concatenate(([0.], np.cumsum(values * values)))
    lags = np.arange(1, maximum + 1)
    difference = (energy[len(values) - lags] + energy[-1] - energy[lags] - 2 * correlation[1:maximum + 1]) / (len(values) - lags)
    difference = np.maximum(difference, 0)
    cumulative = np.cumsum(difference)
    normalized = np.ones(maximum + 1)
    normalized[1:] = np.divide(difference * lags, cumulative, out=np.ones_like(difference), where=cumulative > 1e-20)
    candidates = np.flatnonzero(normalized[minimum:maximum] < 0.15) + minimum
    if not len(candidates):
        return None, float(np.min(normalized[minimum:maximum]))
    index = int(candidates[0])
    while index + 1 < maximum and normalized[index + 1] < normalized[index]:
        index += 1
    period = interpolate_peak(-normalized, index)
    return float(SAMPLE_RATE / period), float(normalized[index])


def spectral_pitch(samples):
    """Harmonic-comb search from interpolated spectral peaks, independently of periodicity."""
    values = np.asarray(samples, dtype=np.float64)
    spectrum = np.abs(np.fft.rfft((values - values.mean()) * np.hanning(len(values)), n=65536))
    maximum = float(spectrum.max())
    if maximum <= 1e-12:
        return None, []
    peaks, _ = find_peaks(spectrum, height=maximum * 0.01, distance=3)
    peaks = sorted(peaks, key=lambda index: spectrum[index], reverse=True)[:30]
    frequencies = [(interpolate_peak(np.log(spectrum + 1e-20), int(index)) * SAMPLE_RATE / 65536,
                    float(spectrum[index] / maximum)) for index in peaks]
    candidates = sorted({frequency / harmonic for frequency, _ in frequencies for harmonic in range(1, 9)
                         if MIN_HZ <= frequency / harmonic <= MAX_HZ})
    bins = np.arange(len(spectrum)) * SAMPLE_RATE / 65536
    harmonics = np.arange(1, 9)
    scores = [float(np.sum(np.interp(frequency * harmonics, bins, spectrum) / np.sqrt(harmonics))) for frequency in candidates]
    return (float(candidates[int(np.argmax(scores))]) if candidates else None), frequencies[:8]


def reference_frame(samples):
    values = np.asarray(samples, dtype=np.float64)
    if len(values) != WINDOW or not np.isfinite(values).all():
        raise ValueError('Expected finite 8192-sample reference window')
    if float(np.mean(values * values)) <= 1e-6:
        return {'midi': None, 'periodicityMidi': None, 'spectralMidi': None, 'reason': 'low-energy', 'agreementCents': None}
    period, quality = periodicity_pitch(values)
    spectral, _ = spectral_pitch(values)
    disagreement = abs(midi(period) - midi(spectral)) * 100 if period and spectral else None
    accepted = disagreement is not None and disagreement <= AGREEMENT_CENTS
    return {'midi': midi(np.sqrt(period * spectral)) if accepted else None,
            'periodicityMidi': midi(period) if period else None, 'spectralMidi': midi(spectral) if spectral else None,
            'periodicityDifference': quality, 'agreementCents': disagreement,
            'reason': 'consensus' if accepted else 'unresolved'}


def reference_track(pcm, frames=120):
    values = np.asarray(pcm, dtype=np.float64)
    if values.shape != (38400,) or not np.isfinite(values).all():
        raise ValueError('Expected finite 800ms raw PCM')
    padded = np.pad(values, (WINDOW // 2, WINDOW // 2))
    return [reference_frame(padded[(frame + 1) * 240:(frame + 1) * 240 + WINDOW]) for frame in range(frames)]
