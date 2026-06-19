/**
 * staff 1|2(ボイシング)のタイ付き onset 列から demo ロール和音を検出する。
 *
 * MusicXML 作者向け:
 * - staff 1|2 に低音から順に「前音タイ継続 + 新音 `<chord/>`」で書く(段をまたいで可)。
 * - staff 3(ベース)は MusicXML 通り(コード名からは推測しない)。
 * - 歌詞 Verse を各新音 onset に付けるとセリフと同期する。
 */
import type { SurvivalTutorialRollStep, SurvivalTutorialV4Chunk } from './survivalTutorialV4Types';
import type { SurvivalTutorialV4ParsedNote } from './parseSurvivalTutorialV4MusicXml';

const BEAT_EPSILON = 1e-6;

const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

export interface SurvivalTutorialOnsetGroup {
  readonly startBeat: number;
  notes: SurvivalTutorialV4ParsedNote[];
}

export interface SurvivalTutorialRollSequence {
  readonly startGroupIndex: number;
  readonly endGroupIndex: number;
}

const sortedUniqueMidis = (
  notes: readonly SurvivalTutorialV4ParsedNote[],
): SurvivalTutorialV4ParsedNote[] => {
  const seen = new Set<number>();
  const result: SurvivalTutorialV4ParsedNote[] = [];
  for (const note of [...notes].sort((a, b) => a.midi - b.midi)) {
    if (seen.has(note.midi)) continue;
    seen.add(note.midi);
    result.push(note);
  }
  return result;
};

const midiSetFromNotes = (notes: readonly SurvivalTutorialV4ParsedNote[]): Set<number> =>
  new Set(notes.map((note) => note.midi));

const voicingNoteKey = (note: SurvivalTutorialV4ParsedNote): string =>
  `${note.staff}:${note.midi}`;

const findMatchingVoicingNote = (
  notes: readonly SurvivalTutorialV4ParsedNote[],
  reference: SurvivalTutorialV4ParsedNote,
): SurvivalTutorialV4ParsedNote | undefined =>
  notes.find(
    (note) => note.staff === reference.staff && note.midi === reference.midi,
  );

export const isRollStepTransition = (
  prev: SurvivalTutorialOnsetGroup,
  next: SurvivalTutorialOnsetGroup,
  harmonyStartBeatFor: (beat: number) => number,
): boolean => {
  const prevPlayable = sortedUniqueMidis(prev.notes);
  const nextPlayable = sortedUniqueMidis(next.notes);
  if (nextPlayable.length <= prevPlayable.length) {
    return false;
  }

  const prevMidis = midiSetFromNotes(prevPlayable);
  const nextMidis = midiSetFromNotes(nextPlayable);
  for (const midi of prevMidis) {
    if (!nextMidis.has(midi)) {
      return false;
    }
  }

  const prevHarmony = harmonyStartBeatFor(prev.startBeat);
  const nextHarmony = harmonyStartBeatFor(next.startBeat);
  if (Math.abs(prevHarmony - nextHarmony) > BEAT_EPSILON) {
    return false;
  }

  for (const note of prevPlayable) {
    const continued = findMatchingVoicingNote(next.notes, note);
    if (!continued?.isTiedContinuation) {
      return false;
    }
  }

  for (const note of nextPlayable) {
    if (!prevMidis.has(note.midi) && note.isTiedContinuation) {
      return false;
    }
  }

  return true;
};

export const detectVoicingRollSequences = (
  voicingOnsetGroups: readonly SurvivalTutorialOnsetGroup[],
  harmonyStartBeatFor: (beat: number) => number,
): readonly SurvivalTutorialRollSequence[] => {
  const sequences: SurvivalTutorialRollSequence[] = [];
  let index = 0;
  while (index < voicingOnsetGroups.length) {
    let endIndex = index;
    while (
      endIndex + 1 < voicingOnsetGroups.length &&
      isRollStepTransition(
        voicingOnsetGroups[endIndex],
        voicingOnsetGroups[endIndex + 1],
        harmonyStartBeatFor,
      )
    ) {
      endIndex += 1;
    }
    if (endIndex > index) {
      sequences.push({ startGroupIndex: index, endGroupIndex: endIndex });
      index = endIndex + 1;
    } else {
      index += 1;
    }
  }
  return sequences;
};

const bassForStepWindow = (
  bassNotes: readonly SurvivalTutorialV4ParsedNote[],
  stepStartBeat: number,
  nextStepStartBeat: number | null,
  groupEndBeat: number,
): SurvivalTutorialV4ParsedNote[] => {
  const windowEnd = nextStepStartBeat ?? groupEndBeat;
  return sortedUniqueMidis(
    bassNotes.filter(
      (note) =>
        note.startBeat >= stepStartBeat - BEAT_EPSILON &&
        note.startBeat < windowEnd - BEAT_EPSILON,
    ),
  );
};

const buildRollStepsForSequence = (
  groups: readonly SurvivalTutorialOnsetGroup[],
  sequence: SurvivalTutorialRollSequence,
  bassNotes: readonly SurvivalTutorialV4ParsedNote[],
  spanStartBeat: number,
): SurvivalTutorialRollStep[] => {
  const slice = groups.slice(sequence.startGroupIndex, sequence.endGroupIndex + 1);
  const lastGroup = slice[slice.length - 1];
  const groupEndBeat = lastGroup
    ? Math.max(...lastGroup.notes.map((note) => note.endBeat))
    : 0;

  let cumulativeBass: SurvivalTutorialV4ParsedNote[] = [];

  return slice.map((group, stepIndex) => {
    const playable = sortedUniqueMidis(group.notes);
    const prevVoicingKeys = stepIndex > 0
      ? new Set(sortedUniqueMidis(slice[stepIndex - 1].notes).map(voicingNoteKey))
      : new Set<string>();
    const newNotes = playable.filter((note) => !prevVoicingKeys.has(voicingNoteKey(note)));
    const nextGroup = slice[stepIndex + 1];
    const stepBassWindow = bassForStepWindow(
      bassNotes,
      group.startBeat,
      nextGroup?.startBeat ?? null,
      groupEndBeat,
    );
    const newBassNotes = stepBassWindow.filter((note) => !note.isTiedContinuation);
    cumulativeBass = sortedUniqueMidis([...cumulativeBass, ...stepBassWindow]);

    const step: SurvivalTutorialRollStep = {
      startBeat: round(group.startBeat - spanStartBeat),
      newVoicing: newNotes.map((note) => note.midi),
      voicing: playable.map((note) => note.midi),
      voicingNames: playable.map((note) => note.noteName),
      voicing_staves: playable.map((note) => (note.staff === 2 ? 2 : 1) as 1 | 2),
    };

    if (newBassNotes.length > 0) {
      return {
        ...step,
        newBass: newBassNotes.map((note) => note.midi),
        bass: cumulativeBass.map((note) => note.midi),
      };
    }
    if (cumulativeBass.length > 0) {
      return {
        ...step,
        bass: cumulativeBass.map((note) => note.midi),
      };
    }
    return step;
  });
};

export const buildRollChunkFromSequence = (
  groups: readonly SurvivalTutorialOnsetGroup[],
  sequence: SurvivalTutorialRollSequence,
  bassNotes: readonly SurvivalTutorialV4ParsedNote[],
  spanStartBeat: number,
  chordName: string,
  keyFifths: number,
  trailingEndBeat: number | null,
): SurvivalTutorialV4Chunk => {
  const firstGroup = groups[sequence.startGroupIndex];
  const lastGroup = groups[sequence.endGroupIndex];
  if (!firstGroup || !lastGroup) {
    throw new Error('roll sequence references missing onset group');
  }

  const rollSteps = buildRollStepsForSequence(groups, sequence, bassNotes, spanStartBeat);
  const finalStep = rollSteps[rollSteps.length - 1];
  if (!finalStep) {
    throw new Error('roll sequence produced no steps');
  }

  const groupEndBeat = Math.max(...lastGroup.notes.map((note) => note.endBeat));
  const chunkEndBeat = trailingEndBeat ?? groupEndBeat;

  const finalBassMidis = finalStep.bass ?? [];
  const finalBassNotes = bassNotes.filter((note) => finalBassMidis.includes(note.midi));

  return {
    startBeat: round(firstGroup.startBeat - spanStartBeat),
    durationBeats: round(chunkEndBeat - firstGroup.startBeat),
    measureNumber: firstGroup.notes[0]?.measureNumber ?? 1,
    chordName,
    notes: [...finalStep.voicing],
    noteNames: finalStep.voicingNames ? [...finalStep.voicingNames] : undefined,
    noteStaves: finalStep.voicing_staves ? [...finalStep.voicing_staves] : undefined,
    bass: finalBassMidis,
    bassNames: finalBassNotes.length > 0
      ? finalBassMidis.map((midi) => finalBassNotes.find((note) => note.midi === midi)?.noteName ?? `M${midi}`)
      : undefined,
    keyFifths,
    rollSteps,
  };
};

export const groupNotesByOnset = (
  notes: readonly SurvivalTutorialV4ParsedNote[],
): SurvivalTutorialOnsetGroup[] => {
  const groups: SurvivalTutorialOnsetGroup[] = [];
  for (const note of notes) {
    let group = groups.find((item) => Math.abs(item.startBeat - note.startBeat) <= BEAT_EPSILON);
    if (!group) {
      group = { startBeat: note.startBeat, notes: [] };
      groups.push(group);
    }
    group.notes.push(note);
  }
  return groups.sort((a, b) => a.startBeat - b.startBeat);
};
