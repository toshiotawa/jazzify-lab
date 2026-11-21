import {
  DEFENSE_TUTORIAL_AUDIO_LOOP_BARS,
  DEFENSE_TUTORIAL_BEAT_SEC,
  DEFENSE_TUTORIAL_BEATS_PER_BAR,
  DEFENSE_TUTORIAL_CALL_RESPONSE_BARS,
  DEFENSE_TUTORIAL_LOOP_SEC,
  DEFENSE_TUTORIAL_NOTE_DURATION_SEC,
  DEFENSE_TUTORIAL_NOTE_ONSETS_SEC,
} from '@/game/defense/tutorial/defenseTutorialConstants';

const midiToFrequency = (midi: number): number => 440 * (2 ** ((midi - 69) / 12));

const addKick = (
  data: Float32Array,
  sampleRate: number,
  startSec: number,
  amp = 0.22,
): void => {
  const startSample = Math.floor(startSec * sampleRate);
  const durationSamples = Math.floor(0.08 * sampleRate);
  for (let i = 0; i < durationSamples; i += 1) {
    const index = startSample + i;
    if (index >= data.length) break;
    const t = i / sampleRate;
    const env = Math.exp(-t * 40);
    data[index] += Math.sin(2 * Math.PI * 90 * t) * env * amp;
  }
};

const addHat = (
  data: Float32Array,
  sampleRate: number,
  startSec: number,
  amp = 0.06,
): void => {
  const startSample = Math.floor(startSec * sampleRate);
  const durationSamples = Math.floor(0.04 * sampleRate);
  for (let i = 0; i < durationSamples; i += 1) {
    const index = startSample + i;
    if (index >= data.length) break;
    const env = Math.exp(-i / (sampleRate * 0.015));
    const noise = Math.sin(index * 12.9898 + i * 78.233) * env * amp;
    data[index] += noise;
  }
};

const renderCallBarNotes = (
  data: Float32Array,
  sampleRate: number,
  barStartSec: number,
  concertMidis: readonly [number, number, number],
): void => {
  concertMidis.forEach((midi, index) => {
    const freq = midiToFrequency(midi);
    const startSec = barStartSec + (DEFENSE_TUTORIAL_NOTE_ONSETS_SEC[index] ?? 0);
    const startSample = Math.floor(startSec * sampleRate);
    const durationSamples = Math.floor(DEFENSE_TUTORIAL_NOTE_DURATION_SEC * sampleRate);
    for (let i = 0; i < durationSamples; i += 1) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= data.length) break;
      const t = i / sampleRate;
      const envelope = Math.min(1, t / 0.02) * Math.max(0, 1 - (t - 0.35) / 0.15);
      data[sampleIndex] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.32;
    }
  });
};

const renderBarDrums = (
  data: Float32Array,
  sampleRate: number,
  barStartSec: number,
): void => {
  for (let beat = 0; beat < DEFENSE_TUTORIAL_BEATS_PER_BAR; beat += 1) {
    const beatSec = barStartSec + beat * DEFENSE_TUTORIAL_BEAT_SEC;
    addKick(data, sampleRate, beatSec);
    addHat(data, sampleRate, beatSec + DEFENSE_TUTORIAL_BEAT_SEC * 0.5);
  }
};

/** 8-bar call & response loop: call bars play concertMidis + drums, response bars drums only. */
export const synthesizeDefenseTutorialCdeBuffer = (
  ctx: AudioContext,
  concertMidis: readonly [number, number, number],
): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(DEFENSE_TUTORIAL_LOOP_SEC * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const barSec = DEFENSE_TUTORIAL_BEAT_SEC * DEFENSE_TUTORIAL_BEATS_PER_BAR;
  const cycleBars = DEFENSE_TUTORIAL_CALL_RESPONSE_BARS * 2;

  for (let bar = 0; bar < DEFENSE_TUTORIAL_AUDIO_LOOP_BARS; bar += 1) {
    const barStartSec = bar * barSec;
    const isCall = (bar % cycleBars) < DEFENSE_TUTORIAL_CALL_RESPONSE_BARS;
    renderBarDrums(data, sampleRate, barStartSec);
    if (isCall) {
      renderCallBarNotes(data, sampleRate, barStartSec, concertMidis);
    }
  }

  return buffer;
};

export const getDefenseTutorialTransportConfig = (): {
  bpm: number;
  beatsPerBar: number;
  loopSec: number;
} => ({
  bpm: 60,
  beatsPerBar: DEFENSE_TUTORIAL_BEATS_PER_BAR,
  loopSec: DEFENSE_TUTORIAL_LOOP_SEC,
});