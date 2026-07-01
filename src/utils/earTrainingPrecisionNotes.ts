import {
  chordOsmdBeatToTargetTimeSec,
  forEachChordOsmdNoteCluster,
  musicXmlNoteHasTieStop,
  parseMusicXmlNoteElementToMidi,
} from '@/utils/earTrainingChordOsmd';
import { scalePracticeTargetTimeSec } from '@/utils/earTrainingPracticeSpeed';

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);
const DEFAULT_KEYBOARD_SPAN_SEMITONES = 24;
const KEYBOARD_PADDING_SEMITONES = 2;

/** 88鍵フルレンジ（A0〜C8） */
export const PRECISION_FULL_KEYBOARD_RANGE: PrecisionKeyboardRange = {
  minMidi: 21,
  maxMidi: 108,
};

/** 練習ガイド表示: 判定窓の先読み秒 */
export const PRECISION_GUIDE_LEAD_SEC = 0.5;

/** 8分音符以下の固定描画高さ（px） */
export const PRECISION_SHORT_NOTE_HEIGHT_PX = 8;

export interface PrecisionNote {
  id: string;
  midi: number;
  startSec: number;
  durationSec: number;
  isBlackKey: boolean;
  measureNumber: number;
  /** 2/3拍以下（スイング長8分含む）: 固定低高さ・ヒット即消滅 */
  isShortNote: boolean;
}

export interface PrecisionKeyboardRange {
  minMidi: number;
  maxMidi: number;
}

export interface PrecisionNoteBuildResult {
  notes: PrecisionNote[];
  keyboardRange: PrecisionKeyboardRange;
}

const isBlackKeyMidi = (midi: number): boolean => (
  BLACK_KEY_OFFSETS.has(((Math.round(midi) % 12) + 12) % 12)
);

const precisionNoteId = (
  measureNumber: number,
  beatStartInMeasure: number,
  midi: number,
  indexInCluster: number,
): string => (
  `p:${measureNumber}:${beatStartInMeasure.toFixed(4)}:${midi}:${indexInCluster}`
);

const durationSecFromDivisions = (
  durationDivisions: number,
  divisions: number,
  bpm: number,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const quarters = durationDivisions / Math.max(1, divisions);
  return Math.max(0.05, quarters * beatDurationSec);
};

/**
 * ショートノーツ上限音価（四分音符比）。
 * 2/3拍（スイング長8分 = 3連符2分子）以下をショート。
 * 比較は分数の交叉乗算のみ（2/3 の浮動小数を閾値に使わない）。
 */
export const PRECISION_SHORT_NOTE_MAX_QUARTER_NUM = 2;
export const PRECISION_SHORT_NOTE_MAX_QUARTER_DEN = 3;

/** 四分音符長（quarterLength = durationSec * bpm / 60）がショート上限以下か */
export const isPrecisionShortNoteQuarterLength = (quarterLength: number): boolean => (
  quarterLength * PRECISION_SHORT_NOTE_MAX_QUARTER_DEN
  <= PRECISION_SHORT_NOTE_MAX_QUARTER_NUM + 1e-9
);

/** 4/4 前提: stage.bpm は四分音符 BPM */
export const precisionShortNoteMaxDurationSec = (bpm: number): number => (
  (60 / Math.max(1, bpm)) * (
    PRECISION_SHORT_NOTE_MAX_QUARTER_NUM / PRECISION_SHORT_NOTE_MAX_QUARTER_DEN
  )
);

/** @deprecated precisionShortNoteMaxDurationSec を使用 */
export const precisionEighthNoteDurationSec = precisionShortNoteMaxDurationSec;

export const isPrecisionShortNoteDuration = (
  durationSec: number,
  bpm: number,
): boolean => {
  const safeBpm = Math.max(1, bpm);
  const quarterLength = durationSec * safeBpm / 60;
  return isPrecisionShortNoteQuarterLength(quarterLength);
};

export const withPrecisionShortNoteFlags = (
  notes: readonly PrecisionNote[],
  classificationBpm: number,
): PrecisionNote[] => notes.map(note => ({
  ...note,
  isShortNote: isPrecisionShortNoteDuration(note.durationSec, classificationBpm),
}));

export const calibratePrecisionNotes = (
  notes: readonly PrecisionNote[],
  params: {
    resolveCalibratedStartSec: (startSec: number) => number;
    practiceMode: boolean;
    practiceSpeedPercent: number;
    classificationBpm: number;
  },
): PrecisionNote[] => {
  const scaled = notes.map(note => ({
    ...note,
    startSec: params.resolveCalibratedStartSec(note.startSec),
    durationSec: params.practiceMode
      ? scalePracticeTargetTimeSec(note.durationSec, params.practiceSpeedPercent)
      : note.durationSec,
  }));
  return withPrecisionShortNoteFlags(scaled, params.classificationBpm);
};

export const resolvePrecisionKeyboardRange = (
  noteMidis: readonly number[],
): PrecisionKeyboardRange => {
  if (noteMidis.length === 0) {
    return { minMidi: 60, maxMidi: 83 };
  }
  let minNote = noteMidis[0] ?? 60;
  let maxNote = noteMidis[0] ?? 83;
  for (let i = 1; i < noteMidis.length; i += 1) {
    const midi = noteMidis[i] ?? minNote;
    if (midi < minNote) {
      minNote = midi;
    }
    if (midi > maxNote) {
      maxNote = midi;
    }
  }

  let minMidi = minNote - KEYBOARD_PADDING_SEMITONES;
  let maxMidi = maxNote + KEYBOARD_PADDING_SEMITONES;
  const span = maxMidi - minMidi + 1;
  if (span < DEFAULT_KEYBOARD_SPAN_SEMITONES) {
    const center = (minNote + maxNote) / 2;
    const halfSpan = Math.floor(DEFAULT_KEYBOARD_SPAN_SEMITONES / 2);
    minMidi = Math.round(center) - halfSpan;
    maxMidi = minMidi + DEFAULT_KEYBOARD_SPAN_SEMITONES - 1;
  }
  return {
    minMidi: Math.max(21, minMidi),
    maxMidi: Math.min(108, maxMidi),
  };
};

/** Web 版などフル鍵盤表示時は 88 鍵、それ以外はノーツ音域から算出 */
export const resolvePrecisionDisplayKeyboardRange = (
  noteMidis: readonly number[],
  useFullKeyboard: boolean,
): PrecisionKeyboardRange => {
  if (useFullKeyboard) {
    return PRECISION_FULL_KEYBOARD_RANGE;
  }
  return resolvePrecisionKeyboardRange(noteMidis);
};

/** 練習モード: 判定ライン付近に来た pending ノーツの鍵盤ガイド対象か */
export const isPrecisionNoteInGuideWindow = (
  note: Pick<PrecisionNote, 'startSec'>,
  phraseTimeSec: number,
  windowSec: number,
  leadSec = PRECISION_GUIDE_LEAD_SEC,
): boolean => {
  const earliest = note.startSec - leadSec;
  const latest = note.startSec + windowSec;
  return phraseTimeSec >= earliest && phraseTimeSec <= latest;
};

/** 練習モード: 実際の演奏区間内か（鍵盤ハイライト用） */
export const isPrecisionNoteInPerformanceWindow = (
  note: Pick<PrecisionNote, 'startSec' | 'durationSec'>,
  phraseTimeSec: number,
): boolean => (
  phraseTimeSec >= note.startSec
  && phraseTimeSec <= note.startSec + note.durationSec
);

export const buildPrecisionNotesFromMusicXml = (
  musicXmlText: string,
  bpm: number,
  beatsPerMeasure: number,
  transposeOffset = 0,
): PrecisionNoteBuildResult => {
  const notes: PrecisionNote[] = [];
  forEachChordOsmdNoteCluster(musicXmlText, ({
    measureNumber,
    beatStartInMeasure,
    clusterNotes,
    timing,
    durationDivisions,
  }) => {
    const startSec = chordOsmdBeatToTargetTimeSec(
      measureNumber,
      beatStartInMeasure,
      bpm,
      beatsPerMeasure,
    );
    const durationSec = durationSecFromDivisions(
      durationDivisions,
      timing.divisions,
      bpm,
    );
    let indexInCluster = 0;
    for (const noteEl of clusterNotes) {
      if (musicXmlNoteHasTieStop(noteEl)) {
        indexInCluster += 1;
        continue;
      }
      const rawMidi = parseMusicXmlNoteElementToMidi(noteEl, timing.keyFifths);
      if (rawMidi === null) {
        indexInCluster += 1;
        continue;
      }
      const midi = rawMidi + transposeOffset;
      notes.push({
        id: precisionNoteId(measureNumber, beatStartInMeasure, midi, indexInCluster),
        midi,
        startSec,
        durationSec,
        isBlackKey: isBlackKeyMidi(midi),
        measureNumber,
        isShortNote: isPrecisionShortNoteDuration(durationSec, bpm),
      });
      indexInCluster += 1;
    }
  });

  notes.sort((a, b) => {
    if (Math.abs(a.startSec - b.startSec) > 0.0005) {
      return a.startSec - b.startSec;
    }
    if (a.midi !== b.midi) {
      return a.midi - b.midi;
    }
    return a.id.localeCompare(b.id);
  });

  const keyboardRange = resolvePrecisionKeyboardRange(notes.map(note => note.midi));
  return { notes, keyboardRange };
};
