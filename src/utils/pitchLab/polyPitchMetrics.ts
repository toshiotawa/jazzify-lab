import {
  CHORD_CONFIRM_STABLE_FRAMES,
  MIDI_PIANO_MAX,
  MIDI_PIANO_MIN,
  type PolyPitchFrame,
  type PolyPitchTrialLabel,
  type PolyPitchTrialMetrics,
} from './polyPitchTypes';

const setsEqual = (a: readonly number[], b: readonly number[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const sortMidis = (midis: readonly number[]): number[] => [...midis].sort((x, y) => x - y);

const expectedSet = (expected: readonly number[]): number[] => sortMidis(expected);

const isOctaveOfExpected = (midi: number, expected: readonly number[]): boolean =>
  expected.some((note) => note !== midi && Math.abs(note - midi) % 12 === 0);

const frameMatchesExpected = (active: readonly number[], expected: readonly number[]): boolean =>
  setsEqual(sortMidis(active), expectedSet(expected));

const framesInSustain = (
  frames: readonly PolyPitchFrame[],
  label: PolyPitchTrialLabel,
): PolyPitchFrame[] =>
  frames.filter(
    (f) =>
      f.contentTimeSec >= label.onsetTimeSec &&
      f.contentTimeSec <= label.sustainEndTimeSec,
  );

export const computeTrialMetrics = (
  frames: readonly PolyPitchFrame[],
  label: PolyPitchTrialLabel,
): PolyPitchTrialMetrics => {
  const engineId = frames[0]?.engineId ?? 'pesto';
  const sustainFrames = framesInSustain(frames, label);
  const expected = expectedSet(label.expectedMidis);

  let stableRun = 0;
  let chordConfirmed = false;
  let confirmLatencyMs: number | null = null;

  for (const frame of sustainFrames) {
    if (frameMatchesExpected(frame.activeMidis, expected)) {
      stableRun += 1;
      if (!chordConfirmed && stableRun >= CHORD_CONFIRM_STABLE_FRAMES) {
        chordConfirmed = true;
        confirmLatencyMs = Math.max(0, (frame.emitTimeSec - label.onsetTimeSec) * 1000);
      }
    } else {
      stableRun = 0;
    }
  }

  let spuriousSlots = 0;
  let spuriousSlotsWithOctave = 0;
  let totalActiveSlots = 0;
  const seenExpected = new Set<number>();

  for (const frame of sustainFrames) {
    for (const midi of frame.activeMidis) {
      totalActiveSlots += 1;
      if (expected.includes(midi)) {
        seenExpected.add(midi);
      } else if (isOctaveOfExpected(midi, expected)) {
        spuriousSlotsWithOctave += 1;
      } else {
        spuriousSlots += 1;
      }
    }
  }

  const missingCount = expected.filter((m) => !seenExpected.has(m)).length;
  const monoHit =
    expected.length === 1
      ? sustainFrames.some((f) => f.activeMidis.includes(expected[0]))
      : null;

  const preOnsetFrames = frames.filter((f) => f.contentTimeSec < label.onsetTimeSec);
  const falseOnDuringSilence = preOnsetFrames.some((f) => f.activeMidis.length > 0);

  return {
    engineId,
    chordConfirmed,
    confirmLatencyMs,
    spuriousMidiRate: sustainFrames.length > 0 && totalActiveSlots > 0
      ? spuriousSlots / totalActiveSlots
      : null,
    octaveErrorRate: sustainFrames.length > 0 && totalActiveSlots > 0
      ? spuriousSlotsWithOctave / totalActiveSlots
      : null,
    missingMidiRate: expected.length > 0 ? missingCount / expected.length : null,
    monoHit,
    falseOnDuringSilence,
    sustainFrameCount: sustainFrames.length,
  };
};

/** EffeTune NoteSpectrogram: 440 bins, 5 per semitone; index i → MIDI firstMidi + (i - 2) / dps */
export const effeTuneLevelsToActiveMidis = (
  levels: Float32Array | readonly number[],
  firstMidi: number,
  divisionsPerSemitone: number,
  threshold: number,
): number[] => {
  const active: number[] = [];
  for (let midi = MIDI_PIANO_MIN; midi <= MIDI_PIANO_MAX; midi += 1) {
    const centerIndex = 2 + (midi - firstMidi) * divisionsPerSemitone;
    let maxLevel = 0;
    for (let d = 0; d < divisionsPerSemitone; d += 1) {
      const idx = centerIndex + d;
      if (idx < 0 || idx >= levels.length) continue;
      const level = levels[idx];
      if (level > maxLevel) maxLevel = level;
    }
    if (maxLevel >= threshold) active.push(midi);
  }
  return active;
};

export const pitchPleaseProbsToActiveMidis = (
  probs: Float32Array | readonly number[],
  onThreshold: number,
  offThreshold: number,
  previousOn: readonly boolean[],
): { active: number[]; onMask: boolean[] } => {
  const onMask: boolean[] = new Array(probs.length);
  const active: number[] = [];
  for (let i = 0; i < probs.length; i += 1) {
    const prob = probs[i];
    const wasOn = previousOn[i] ?? false;
    const isOn = wasOn ? prob >= offThreshold : prob >= onThreshold;
    onMask[i] = isOn;
    if (isOn) active.push(MIDI_PIANO_MIN + i);
  }
  return { active, onMask };
};
