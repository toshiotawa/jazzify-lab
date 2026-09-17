import {
  DEFENSE_TUTORIAL_BEATS_PER_BAR,
  DEFENSE_TUTORIAL_BPM,
  DEFENSE_TUTORIAL_LOOP_SEC,
  DEFENSE_TUTORIAL_NOTE_DURATION_SEC,
  DEFENSE_TUTORIAL_NOTE_ONSETS_SEC,
  DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES,
} from '@/game/defense/tutorial/defenseTutorialConstants';

const midiToFrequency = (midi: number): number => 440 * (2 ** ((midi - 69) / 12));

/** Synthesize one bar of concert C4–D4–E4 + rest at BPM 100 for tutorial backing. */
export const synthesizeDefenseTutorialCdeBuffer = (
  ctx: AudioContext,
  concertOctave = 4,
): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(DEFENSE_TUTORIAL_LOOP_SEC * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  DEFENSE_TUTORIAL_TARGET_PITCH_CLASSES.forEach((pitchClass, index) => {
    const midi = (concertOctave + 1) * 12 + pitchClass;
    const freq = midiToFrequency(midi);
    const startSec = DEFENSE_TUTORIAL_NOTE_ONSETS_SEC[index] ?? 0;
    const startSample = Math.floor(startSec * sampleRate);
    const durationSamples = Math.floor(DEFENSE_TUTORIAL_NOTE_DURATION_SEC * sampleRate);
    for (let i = 0; i < durationSamples; i += 1) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= length) break;
      const t = i / sampleRate;
      const envelope = Math.min(1, t / 0.02) * Math.max(0, 1 - (t - 0.35) / 0.15);
      data[sampleIndex] += Math.sin(2 * Math.PI * freq * t) * envelope * 0.35;
    }
  });

  return buffer;
};

export const getDefenseTutorialTransportConfig = (): {
  bpm: number;
  beatsPerBar: number;
  loopSec: number;
} => ({
  bpm: DEFENSE_TUTORIAL_BPM,
  beatsPerBar: DEFENSE_TUTORIAL_BEATS_PER_BAR,
  loopSec: DEFENSE_TUTORIAL_LOOP_SEC,
});
