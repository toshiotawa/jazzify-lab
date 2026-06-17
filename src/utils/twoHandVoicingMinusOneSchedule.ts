/**
 * 両手ヴォイシング chord_voicing 用マイナスワン（オフライン MP3 生成）のノートスケジュール。
 */
import { note as tonalNote, transpose } from 'tonal';
import { parseChordName } from '@/utils/chord-utils';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import {
  buildAdvancedVoicingPhrase,
  TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
  TWO_HAND_VOICING_ADVANCED_LESSONS,
  type AdvancedChordCategory,
  type AdvancedProgressionSpec,
  type TwoHandVoicingAdvancedLessonSpec,
} from '@/utils/twoHandVoicingAdvancedCourse';
import {
  lookupVoicing,
  resolveBlock3VoicingTable,
  TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
  TWO_HAND_VOICING_BLOCK3_LESSONS,
  type Block3ChordCategory,
  type Block3ProgressionSpec,
  type TwoHandVoicingBlock3LessonSpec,
} from '@/utils/twoHandVoicingBlock3Course';
import {
  buildVoicingPhrasesForLesson,
  TWO_HAND_VOICING_BLOCK_META,
  TWO_HAND_VOICING_LESSONS,
  type TwoHandVoicingLessonSpec,
} from '@/utils/twoHandVoicingIntermediateCourse';
import type { OfflineNoteEvent, MinusOneVoicingArticulation } from '@/utils/offlineSf2Mix';

export const MINUS_ONE_BPM = 100;
export const MINUS_ONE_BEAT_SEC = 60 / MINUS_ONE_BPM;
export const MINUS_ONE_MEASURE_SEC = MINUS_ONE_BEAT_SEC * 4;
export const MINUS_ONE_LOOP_MEASURES = 4;
export const MINUS_ONE_LOOP_SEC = MINUS_ONE_MEASURE_SEC * MINUS_ONE_LOOP_MEASURES;
export const MINUS_ONE_LOOPS = 6;
export const MINUS_ONE_TOTAL_SEC = MINUS_ONE_LOOP_SEC * MINUS_ONE_LOOPS;

export const TWO_HAND_VOICING_MINUS_ONE_CDN_BASE = 'https://jazzify-cdn.com/sozai';

/** 薄い三角波合成音（出題ヴォイシング参考） */
export const MINUS_ONE_VOICING_GAIN = 0.32;
/** FingerBass SF2（サバイバル正解ルート音）: FantasySoundManager bassVolume デフォルト */
export const MINUS_ONE_BASS_GAIN = 0.5;
/** マイナスワン用レイヤー後段スケール */
export const MINUS_ONE_BASS_LAYER_SCALE = 0.95;

/** スウィング8分: 表拍 = 2/3, 裏拍 = 1/3 */
export const MINUS_ONE_SWING_LONG_RATIO = 2 / 3;
export const MINUS_ONE_SWING_SHORT_RATIO = 1 - MINUS_ONE_SWING_LONG_RATIO;
export const MINUS_ONE_WHOLE_NOTE_SEC = MINUS_ONE_MEASURE_SEC;
/** 2拍目表拍: スウィング8分（長い方 = 2/3拍） */
export const MINUS_ONE_VOICING_SWING_ONBEAT_SEC = MINUS_ONE_BEAT_SEC * MINUS_ONE_SWING_LONG_RATIO;
/** 2拍目裏拍: スウィング8分（短い方 = 1/3拍） */
export const MINUS_ONE_VOICING_SWING_OFFBEAT_SEC = MINUS_ONE_BEAT_SEC * MINUS_ONE_SWING_SHORT_RATIO;
/** Charleston 2拍目ウラのスタッカート音価（md: 1/3拍 × 0.9） */
export const MINUS_ONE_CHARLESTON_OFFBEAT_SEC = MINUS_ONE_VOICING_SWING_OFFBEAT_SEC * 0.9;

export type MinusOneRhythmMode = 'charleston' | 'tensionResolve';
export type MinusOneCourseKind = 'intermediate' | 'block3' | 'advanced';

export interface MinusOneLayerEvents {
  readonly voicingGuide: readonly OfflineNoteEvent[];
  readonly bass: readonly OfflineNoteEvent[];
}

export interface TwoHandVoicingMinusOneTarget {
  readonly course: MinusOneCourseKind;
  readonly lessonKey: string;
  readonly progressionKey?: string;
  readonly phraseIndex?: number;
  readonly rhythmMode: MinusOneRhythmMode;
  readonly outputFileName: string;
  readonly stageSlug: string;
  readonly phraseOrderIndex: number;
}

export const minusOneBeat1FrontSec = (measureStartSec: number): number => measureStartSec;

export const minusOneBeat2FrontSec = (measureStartSec: number): number => (
  measureStartSec + MINUS_ONE_BEAT_SEC
);

export const minusOneBeat2BackSec = (measureStartSec: number): number => (
  measureStartSec + MINUS_ONE_BEAT_SEC + MINUS_ONE_BEAT_SEC * MINUS_ONE_SWING_LONG_RATIO
);

/** 4弦ベース開放弦域: E1(28)〜G2(43) */
export const BASS_FOUR_STRING_LOW_MIDI = 28;
export const BASS_FOUR_STRING_HIGH_MIDI = 43;
/** フォールバック上限（Eb→Bb など 5th だけ少し上がる場合） */
export const BASS_FIFTH_FALLBACK_HIGH_MIDI = 46;

const BASS_MIN_MIDI = BASS_FOUR_STRING_LOW_MIDI;

const normalizeSymbolForParse = (symbol: string): string => (
  symbol.endsWith('alt') ? symbol.replace(/alt$/, '') : symbol
);

/** 5th がオクターブ2で上がる場合の上限（Bb→F3 など） */
export const BASS_FIFTH_EXTENDED_HIGH_MIDI = 53;

const bassPairInRange = (
  root: number,
  fifth: number,
  minRoot: number,
  maxFifth: number,
): boolean => root >= minRoot && fifth <= maxFifth;

const bassPairForOctaves = (
  rootSpelling: string,
  octaves: readonly (1 | 2)[],
  minRoot: number,
  maxFifth: number,
): { readonly root: number; readonly fifth: number } | null => {
  for (const octave of octaves) {
    const rootName = `${rootSpelling}${octave}`;
    const rootNote = tonalNote(rootName);
    if (rootNote.midi == null) {
      continue;
    }
    const fifthNote = tonalNote(transpose(rootName, '5P'));
    if (fifthNote.midi == null) {
      continue;
    }
    if (bassPairInRange(rootNote.midi, fifthNote.midi, minRoot, maxFifth)) {
      return { root: rootNote.midi, fifth: fifthNote.midi };
    }
  }
  return null;
};

/** サバイバル正解ルート音と同じく root2（FantasySoundManager `_playCodeRunRootNote`） */
export const bassRootMidiForSymbol = (symbol: string): number | null => {
  const parsed = parseChordName(normalizeSymbolForParse(symbol));
  if (!parsed) {
    return null;
  }
  const rootNote = tonalNote(`${parsed.root}2`);
  return rootNote.midi ?? null;
};

/** R / 5th を 4 弦ベース向けに配置（フラットキーは 2 オクターブ、それ以外は 1 優先）。 */
export const bassMidiForRootAndFifth = (symbol: string): { readonly root: number; readonly fifth: number } | null => {
  const parsed = parseChordName(normalizeSymbolForParse(symbol));
  if (!parsed) {
    return null;
  }

  if (parsed.root.includes('b')) {
    return (
      bassPairForOctaves(parsed.root, [2], BASS_MIN_MIDI, BASS_FIFTH_EXTENDED_HIGH_MIDI)
      ?? bassPairForOctaves(parsed.root, [2], BASS_MIN_MIDI, BASS_FIFTH_FALLBACK_HIGH_MIDI)
    );
  }

  return (
    bassPairForOctaves(parsed.root, [1, 2], BASS_MIN_MIDI, BASS_FOUR_STRING_HIGH_MIDI)
    ?? bassPairForOctaves(parsed.root, [1, 2], BASS_MIN_MIDI, BASS_FIFTH_EXTENDED_HIGH_MIDI)
    ?? bassPairForOctaves(parsed.root, [1, 2], 27, BASS_FIFTH_FALLBACK_HIGH_MIDI)
  );
};

const noteEventsForVoicing = (
  noteNames: readonly string[],
  startSec: number,
  durationSec: number,
  gain: number,
  articulation: MinusOneVoicingArticulation,
): OfflineNoteEvent[] => (
  noteNames.map(noteName => ({
    startSec,
    durationSec,
    midi: parseVoicingNoteName(noteName).midi,
    gain,
    articulation,
  }))
);

const pushBassRootForSymbol = (
  bass: OfflineNoteEvent[],
  symbol: string,
  measureStartSec: number,
): void => {
  const bassRootMidi = bassRootMidiForSymbol(symbol);
  if (bassRootMidi != null) {
    bass.push({
      startSec: measureStartSec,
      durationSec: MINUS_ONE_WHOLE_NOTE_SEC,
      midi: bassRootMidi,
      gain: MINUS_ONE_BASS_GAIN,
    });
  }
};

export const buildCharlestonVoicingEventsForMeasure = (
  voicingNotes: readonly string[],
  measureStartSec: number,
): OfflineNoteEvent[] => {
  const beat1FrontSec = minusOneBeat1FrontSec(measureStartSec);
  const beat2BackSec = minusOneBeat2BackSec(measureStartSec);
  return [
    ...noteEventsForVoicing(
      voicingNotes,
      beat1FrontSec,
      MINUS_ONE_BEAT_SEC,
      MINUS_ONE_VOICING_GAIN,
      'sustain',
    ),
    ...noteEventsForVoicing(
      voicingNotes,
      beat2BackSec,
      MINUS_ONE_CHARLESTON_OFFBEAT_SEC,
      MINUS_ONE_VOICING_GAIN,
      'staccato',
    ),
  ];
};

export const buildTensionResolveVoicingEventsForMeasure = (
  voicingA: readonly string[],
  voicingB: readonly string[],
  measureStartSec: number,
): OfflineNoteEvent[] => {
  const beat2FrontSec = minusOneBeat2FrontSec(measureStartSec);
  const beat2BackSec = minusOneBeat2BackSec(measureStartSec);
  return [
    ...noteEventsForVoicing(
      voicingA,
      beat2FrontSec,
      MINUS_ONE_VOICING_SWING_ONBEAT_SEC,
      MINUS_ONE_VOICING_GAIN,
      'sustain',
    ),
    ...noteEventsForVoicing(
      voicingB,
      beat2BackSec,
      MINUS_ONE_VOICING_SWING_OFFBEAT_SEC,
      MINUS_ONE_VOICING_GAIN,
      'staccato',
    ),
  ];
};

export const buildCharlestonMinusOneEventsForLoop = (
  chordSymbols: readonly string[],
  voicingNotesBySymbol: Readonly<Record<string, readonly string[]>>,
): MinusOneLayerEvents => {
  const voicingGuide: OfflineNoteEvent[] = [];
  const bass: OfflineNoteEvent[] = [];

  chordSymbols.forEach((symbol, chordIndex) => {
    const notes = voicingNotesBySymbol[symbol];
    if (!notes) {
      throw new Error(`Missing voicing notes for symbol: ${symbol}`);
    }
    const measureStartSec = chordIndex * MINUS_ONE_MEASURE_SEC;
    voicingGuide.push(...buildCharlestonVoicingEventsForMeasure(notes, measureStartSec));
    pushBassRootForSymbol(bass, symbol, measureStartSec);
  });

  return { voicingGuide, bass };
};

export const buildBlock3MinusOneEventsForLoop = (
  progression: Block3ProgressionSpec,
  category: Block3ChordCategory,
): MinusOneLayerEvents => {
  const table = resolveBlock3VoicingTable(category);
  const voicingGuide: OfflineNoteEvent[] = [];
  const bass: OfflineNoteEvent[] = [];

  progression.chordSymbols.forEach((symbol, chordIndex) => {
    const entry = lookupVoicing(table, symbol);
    const measureStartSec = chordIndex * MINUS_ONE_MEASURE_SEC;
    voicingGuide.push(
      ...buildTensionResolveVoicingEventsForMeasure(entry.voicingA, entry.voicingB, measureStartSec),
    );
    pushBassRootForSymbol(bass, symbol, measureStartSec);
  });

  return { voicingGuide, bass };
};

export const repeatEventsForLoops = (
  events: readonly OfflineNoteEvent[],
  loopSec: number,
  loops: number,
): OfflineNoteEvent[] => {
  const repeated: OfflineNoteEvent[] = [];
  for (let loop = 0; loop < loops; loop += 1) {
    const offset = loop * loopSec;
    for (const event of events) {
      repeated.push({
        ...event,
        startSec: event.startSec + offset,
      });
    }
  }
  return repeated;
};

const wrapWithLoops = (loopEvents: MinusOneLayerEvents): MinusOneLayerEvents => ({
  voicingGuide: repeatEventsForLoops(loopEvents.voicingGuide, MINUS_ONE_LOOP_SEC, MINUS_ONE_LOOPS),
  bass: repeatEventsForLoops(loopEvents.bass, MINUS_ONE_LOOP_SEC, MINUS_ONE_LOOPS),
});

const ALL_BLOCK3_LESSONS: readonly TwoHandVoicingBlock3LessonSpec[] = [
  ...TWO_HAND_VOICING_BLOCK3_LESSONS,
  ...TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
];

const ALL_ADVANCED_LESSONS: readonly TwoHandVoicingAdvancedLessonSpec[] = [
  ...TWO_HAND_VOICING_ADVANCED_LESSONS,
  ...TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
];

const findBlock3Lesson = (lessonKey: string): TwoHandVoicingBlock3LessonSpec => {
  const lesson = ALL_BLOCK3_LESSONS.find(entry => entry.lessonKey === lessonKey);
  if (!lesson) {
    throw new Error(`Unknown Block3 lesson key: ${lessonKey}`);
  }
  return lesson;
};

const findAdvancedLesson = (lessonKey: string): TwoHandVoicingAdvancedLessonSpec => {
  const lesson = ALL_ADVANCED_LESSONS.find(entry => entry.lessonKey === lessonKey);
  if (!lesson) {
    throw new Error(`Unknown advanced lesson key: ${lessonKey}`);
  }
  return lesson;
};

const findIntermediateLesson = (lessonKey: string): TwoHandVoicingLessonSpec => {
  const lesson = TWO_HAND_VOICING_LESSONS.find(entry => entry.lessonKey === lessonKey);
  if (!lesson) {
    throw new Error(`Unknown intermediate lesson key: ${lessonKey}`);
  }
  return lesson;
};

export const resolveBlock3MinusOneSpec = (
  lessonKey: string,
  progressionKey: string,
): { readonly category: Block3ChordCategory; readonly progression: Block3ProgressionSpec } => {
  const lesson = findBlock3Lesson(lessonKey);
  const progression = lesson.progressions.find(entry => entry.progressionKey === progressionKey);
  if (!progression) {
    throw new Error(`Unknown progression key: ${progressionKey} for lesson ${lessonKey}`);
  }
  return { category: lesson.category, progression };
};

export const resolveAdvancedMinusOneSpec = (
  lessonKey: string,
  progressionKey: string,
): {
  readonly category: AdvancedChordCategory;
  readonly progression: AdvancedProgressionSpec;
} => {
  const lesson = findAdvancedLesson(lessonKey);
  const progression = lesson.progressions.find(entry => entry.progressionKey === progressionKey);
  if (!progression) {
    throw new Error(`Unknown progression key: ${progressionKey} for lesson ${lessonKey}`);
  }
  return { category: lesson.category, progression };
};

export const buildBlock3MinusOneEvents = (
  lessonKey: string,
  progressionKey: string,
): MinusOneLayerEvents => {
  const { category, progression } = resolveBlock3MinusOneSpec(lessonKey, progressionKey);
  return wrapWithLoops(buildBlock3MinusOneEventsForLoop(progression, category));
};

export const buildIntermediateMinusOneEvents = (
  lessonKey: string,
  phraseIndex: number,
): MinusOneLayerEvents => {
  const lesson = findIntermediateLesson(lessonKey);
  if (lesson.isSummary) {
    throw new Error(`Summary lesson has no voicing phrase: ${lessonKey}`);
  }
  const form = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber].form;
  const phrases = buildVoicingPhrasesForLesson(lesson, form);
  const phrase = phrases[phraseIndex];
  if (!phrase) {
    throw new Error(`Unknown phrase index ${phraseIndex} for lesson ${lessonKey}`);
  }

  const chordSymbols = phrase.chords.map(chord => chord.chordName);
  const voicingNotesBySymbol: Record<string, readonly string[]> = {};
  for (const chord of phrase.chords) {
    voicingNotesBySymbol[chord.chordName] = chord.notes;
  }

  return wrapWithLoops(buildCharlestonMinusOneEventsForLoop(chordSymbols, voicingNotesBySymbol));
};

export const buildAdvancedMinusOneEvents = (
  lessonKey: string,
  progressionKey: string,
): MinusOneLayerEvents => {
  const { category, progression } = resolveAdvancedMinusOneSpec(lessonKey, progressionKey);
  if (progression.isSummary) {
    throw new Error(`Summary progression has no voicing phrase: ${lessonKey}/${progressionKey}`);
  }

  const phrase = buildAdvancedVoicingPhrase(progression, category);
  const voicingNotesBySymbol: Record<string, readonly string[]> = {};
  for (const chord of phrase.chords) {
    voicingNotesBySymbol[chord.chordName] = chord.notes;
  }

  return wrapWithLoops(buildCharlestonMinusOneEventsForLoop(
    phrase.chords.map(chord => chord.chordName),
    voicingNotesBySymbol,
  ));
};

export const minusOneLessonFileToken = (lessonKey: string): string => {
  if (lessonKey === 'b1-M7') {
    return 'b1-majM7';
  }
  if (lessonKey === 'b1-m7') {
    return 'b1-minm7';
  }
  return lessonKey;
};

export const defaultIntermediateMinusOneOutputName = (
  lessonKey: string,
  phraseIndex: number,
): string => `thvi-voicing-${lessonKey}-ph${phraseIndex}-minus-one.mp3`;

export const defaultBlock3MinusOneOutputName = (
  lessonKey: string,
  progressionKey: string,
): string => `thvi-b3-voicing-${lessonKey}-${progressionKey}-minus-one.mp3`;

export const defaultAdvancedMinusOneOutputName = (
  lessonKey: string,
  progressionKey: string,
): string => `thva-voicing-${minusOneLessonFileToken(lessonKey)}-${progressionKey}-minus-one.mp3`;

export const twoHandVoicingMinusOneCdnUrl = (fileName: string): string => (
  `${TWO_HAND_VOICING_MINUS_ONE_CDN_BASE}/${fileName}`
);

export const listTwoHandVoicingMinusOneTargets = (): readonly TwoHandVoicingMinusOneTarget[] => {
  const targets: TwoHandVoicingMinusOneTarget[] = [];

  for (const lesson of TWO_HAND_VOICING_LESSONS) {
    if (lesson.isSummary) {
      continue;
    }
    for (const phraseIndex of [0, 1] as const) {
      targets.push({
        course: 'intermediate',
        lessonKey: lesson.lessonKey,
        phraseIndex,
        rhythmMode: 'charleston',
        outputFileName: defaultIntermediateMinusOneOutputName(lesson.lessonKey, phraseIndex),
        stageSlug: `thvi-voicing-${lesson.lessonKey}`,
        phraseOrderIndex: phraseIndex,
      });
    }
  }

  for (const lesson of ALL_BLOCK3_LESSONS) {
    for (const progression of lesson.progressions) {
      if (progression.isSummary) {
        continue;
      }
      targets.push({
        course: 'block3',
        lessonKey: lesson.lessonKey,
        progressionKey: progression.progressionKey,
        rhythmMode: 'tensionResolve',
        outputFileName: defaultBlock3MinusOneOutputName(lesson.lessonKey, progression.progressionKey),
        stageSlug: `thvi-b3-voicing-${lesson.lessonKey}-${progression.progressionKey}`,
        phraseOrderIndex: 0,
      });
    }
  }

  for (const lesson of ALL_ADVANCED_LESSONS) {
    for (const progression of lesson.progressions) {
      if (progression.isSummary) {
        continue;
      }
      targets.push({
        course: 'advanced',
        lessonKey: lesson.lessonKey,
        progressionKey: progression.progressionKey,
        rhythmMode: 'charleston',
        outputFileName: defaultAdvancedMinusOneOutputName(lesson.lessonKey, progression.progressionKey),
        stageSlug: `thva-voicing-${lesson.lessonKey}-${progression.progressionKey}`,
        phraseOrderIndex: 0,
      });
    }
  }

  return targets;
};

export const buildMinusOneEventsForTarget = (
  target: TwoHandVoicingMinusOneTarget,
): MinusOneLayerEvents => {
  if (target.course === 'intermediate') {
    if (target.phraseIndex == null) {
      throw new Error(`Intermediate target missing phraseIndex: ${target.lessonKey}`);
    }
    return buildIntermediateMinusOneEvents(target.lessonKey, target.phraseIndex);
  }
  if (target.course === 'block3') {
    if (!target.progressionKey) {
      throw new Error(`Block3 target missing progressionKey: ${target.lessonKey}`);
    }
    return buildBlock3MinusOneEvents(target.lessonKey, target.progressionKey);
  }
  if (!target.progressionKey) {
    throw new Error(`Advanced target missing progressionKey: ${target.lessonKey}`);
  }
  return buildAdvancedMinusOneEvents(target.lessonKey, target.progressionKey);
};

export const filterMinusOneTargets = (
  targets: readonly TwoHandVoicingMinusOneTarget[],
  courseFilter: MinusOneCourseKind | null,
): readonly TwoHandVoicingMinusOneTarget[] => {
  if (!courseFilter) {
    return targets;
  }
  if (courseFilter === 'intermediate') {
    return targets.filter(target => target.course === 'intermediate' || target.course === 'block3');
  }
  return targets.filter(target => target.course === courseFilter);
};
