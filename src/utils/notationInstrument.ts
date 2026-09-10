import { Interval, Note } from 'tonal';
import {
  adjustNoteToKeyScale,
  getTargetKeyFromTranspositionForXml,
  transposeMusicXml,
} from '@/utils/musicXmlTransposer';
import { fifthsToPreferredKeyName } from '@/utils/earTrainingPracticeTranspose';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export type NotationInstrumentClef = 'treble' | 'bass' | 'grand';

export const NOTATION_INSTRUMENT_PRESETS = [
  { id: 'piano', clef: 'grand', transposition: 0, octaveOffset: 0, label: { ja: 'ピアノ / キーボード', en: 'Piano / Keyboard' } },
  { id: 'flute', clef: 'treble', transposition: 0, octaveOffset: 0, label: { ja: 'フルート', en: 'Flute' } },
  { id: 'oboe', clef: 'treble', transposition: 0, octaveOffset: 0, label: { ja: 'オーボエ', en: 'Oboe' } },
  { id: 'violin', clef: 'treble', transposition: 0, octaveOffset: 0, label: { ja: 'ヴァイオリン', en: 'Violin' } },
  { id: 'guitar', clef: 'treble', transposition: 0, octaveOffset: -1, label: { ja: 'ギター', en: 'Guitar' } },
  { id: 'ukulele', clef: 'treble', transposition: 0, octaveOffset: 0, label: { ja: 'ウクレレ', en: 'Ukulele' } },
  { id: 'trumpet_bb', clef: 'treble', transposition: -2, octaveOffset: 0, label: { ja: 'トランペット in B♭', en: 'Trumpet in B♭' } },
  { id: 'clarinet_bb', clef: 'treble', transposition: -2, octaveOffset: 0, label: { ja: 'クラリネット in B♭', en: 'Clarinet in B♭' } },
  { id: 'soprano_sax', clef: 'treble', transposition: -2, octaveOffset: 0, label: { ja: 'ソプラノサックス', en: 'Soprano Sax' } },
  { id: 'alto_sax', clef: 'treble', transposition: -9, octaveOffset: 0, label: { ja: 'アルトサックス', en: 'Alto Sax' } },
  { id: 'tenor_sax', clef: 'treble', transposition: -2, octaveOffset: -1, label: { ja: 'テナーサックス', en: 'Tenor Sax' } },
  { id: 'baritone_sax', clef: 'treble', transposition: -9, octaveOffset: -1, label: { ja: 'バリトンサックス', en: 'Baritone Sax' } },
  { id: 'french_horn_f', clef: 'treble', transposition: -7, octaveOffset: 0, label: { ja: 'ホルン in F', en: 'French Horn in F' } },
  { id: 'bass_clarinet_bb', clef: 'treble', transposition: -2, octaveOffset: -1, label: { ja: 'バスクラリネット in B♭', en: 'Bass Clarinet in B♭' } },
  { id: 'trombone', clef: 'bass', transposition: 0, octaveOffset: 0, label: { ja: 'トロンボーン', en: 'Trombone' } },
  { id: 'euphonium', clef: 'bass', transposition: 0, octaveOffset: 0, label: { ja: 'ユーフォニアム', en: 'Euphonium' } },
  { id: 'tuba', clef: 'bass', transposition: 0, octaveOffset: 0, label: { ja: 'チューバ', en: 'Tuba' } },
  { id: 'cello', clef: 'bass', transposition: 0, octaveOffset: 0, label: { ja: 'チェロ', en: 'Cello' } },
  { id: 'bassoon', clef: 'bass', transposition: 0, octaveOffset: 0, label: { ja: 'ファゴット', en: 'Bassoon' } },
  { id: 'electric_bass', clef: 'bass', transposition: 0, octaveOffset: -1, label: { ja: 'エレキベース', en: 'Electric Bass' } },
  { id: 'double_bass', clef: 'bass', transposition: 0, octaveOffset: -1, label: { ja: 'コントラバス', en: 'Double Bass' } },
] as const;

export type NotationInstrumentId = (typeof NOTATION_INSTRUMENT_PRESETS)[number]['id'];

interface NotationInstrumentPreset {
  id: NotationInstrumentId;
  clef: NotationInstrumentClef;
  /** 記譜Cの実音との半音差（Bb=-2, Eb=-9 等） */
  transposition: number;
  /** 楽器固有の記譜オクターブ（-1 = 1オクターブ下に書く） */
  octaveOffset: number;
  label: { ja: string; en: string };
}

const PRESET_BY_ID = new Map<string, NotationInstrumentPreset>(
  NOTATION_INSTRUMENT_PRESETS.map((preset) => [preset.id, preset]),
);

const DEFAULT_PRESET: NotationInstrumentPreset = NOTATION_INSTRUMENT_PRESETS[0];

export const DEFAULT_NOTATION_INSTRUMENT_ID: NotationInstrumentId = DEFAULT_PRESET.id;

export const NOTATION_OCTAVE_SHIFT_MIN = -2;
export const NOTATION_OCTAVE_SHIFT_MAX = 2;

export const isNotationInstrumentId = (value: unknown): value is NotationInstrumentId =>
  typeof value === 'string' && PRESET_BY_ID.has(value);

export const normalizeNotationInstrumentId = (value: unknown): NotationInstrumentId =>
  isNotationInstrumentId(value) ? value : DEFAULT_NOTATION_INSTRUMENT_ID;

export const getNotationInstrumentPreset = (id: NotationInstrumentId): NotationInstrumentPreset =>
  PRESET_BY_ID.get(id) ?? DEFAULT_PRESET;

export const clampNotationOctaveShift = (value: number): number =>
  Math.max(NOTATION_OCTAVE_SHIFT_MIN, Math.min(NOTATION_OCTAVE_SHIFT_MAX, Math.trunc(value)));

const clampKeyFifths = (fifths: number): number => Math.max(-7, Math.min(7, Math.trunc(fifths)));

/** コンサート音高 → 記譜表示の半音オフセット（上方向） */
export const getWrittenSemitoneOffset = (
  preset: NotationInstrumentPreset,
  userOctaveShift: number,
): number => (
  -preset.transposition - preset.octaveOffset * 12 + clampNotationOctaveShift(userOctaveShift) * 12
);

export const transposeKeyFifths = (fifths: number, semitones: number): number => {
  if (semitones === 0) {
    return clampKeyFifths(fifths);
  }
  const originalKeyName = fifthsToPreferredKeyName(clampKeyFifths(fifths));
  const targetKeyName = getTargetKeyFromTranspositionForXml(originalKeyName, semitones);
  const keyToFifthsMap: Record<string, number> = {
    Cb: -7, Gb: -6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1,
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  };
  return clampKeyFifths(keyToFifthsMap[targetKeyName] ?? fifths);
};

const formatAccidentalSuffix = (acc: string | undefined): string => {
  if (!acc) {
    return '';
  }
  if (acc === 'x') {
    return '##';
  }
  return acc;
};

const alterToAccidentalSuffix = (alter: number): string => {
  if (alter > 0) {
    return '#'.repeat(alter);
  }
  if (alter < 0) {
    return 'b'.repeat(-alter);
  }
  return '';
};

/** コンサート音名を記譜音名へ（pitch class / midi は呼び出し側で維持） */
export const transposeWrittenNoteName = (
  noteName: string,
  semitones: number,
  originalFifths: number,
  simpleMode = false,
): string => {
  if (semitones === 0) {
    return noteName;
  }
  const parsed = parseVoicingNoteName(noteName);
  const concertNote = `${parsed.step}${alterToAccidentalSuffix(parsed.alter)}${parsed.octave}`;
  const originalKeyName = fifthsToPreferredKeyName(clampKeyFifths(originalFifths));
  const targetKeyName = getTargetKeyFromTranspositionForXml(originalKeyName, semitones);
  const transposeInterval = Interval.distance(originalKeyName, targetKeyName) ?? '1P';
  const intervalSemitones = Interval.semitones(transposeInterval) ?? 0;
  const octaveAdjust = Math.round((semitones - intervalSemitones) / 12);
  const octaveInterval = octaveAdjust !== 0 ? `${Math.abs(octaveAdjust) * 8}P` : null;

  let transposedNote = Note.transpose(concertNote, transposeInterval);
  if (octaveInterval && transposedNote) {
    if (octaveAdjust > 0) {
      transposedNote = Note.transpose(transposedNote, octaveInterval);
    } else if (octaveAdjust < 0) {
      transposedNote = Note.transpose(transposedNote, `-${octaveInterval}`);
    }
  }
  if (!transposedNote) {
    return noteName;
  }
  const noteInfo = Note.get(transposedNote);
  if (noteInfo.empty || noteInfo.oct === undefined || !noteInfo.letter) {
    return noteName;
  }
  const noteNameWithoutOctave = `${noteInfo.letter}${formatAccidentalSuffix(noteInfo.acc)}`;
  const adjusted = adjustNoteToKeyScale(noteNameWithoutOctave, targetKeyName, simpleMode);
  const adjustedInfo = Note.get(adjusted);
  const letter = adjustedInfo.letter ?? noteInfo.letter;
  const acc = adjustedInfo.acc ?? noteInfo.acc;

  // 異名同音がオクターブ境界を跨ぐ場合（B##→C#, Cbb→Bb 等）はオクターブを補正する
  let octave = noteInfo.oct;
  if (adjusted !== noteNameWithoutOctave) {
    const originalMidi = Note.midi(transposedNote);
    const adjustedMidi = Note.midi(`${adjusted}${octave}`);
    if (originalMidi !== null && adjustedMidi !== null && originalMidi !== adjustedMidi) {
      octave += Math.round((originalMidi - adjustedMidi) / 12);
    }
  }
  return `${letter}${formatAccidentalSuffix(acc)}${octave}`;
};

const rewriteClefsInMusicXml = (xmlString: string, clef: Exclude<NotationInstrumentClef, 'grand'>): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const sign = clef === 'treble' ? 'G' : 'F';
  const line = clef === 'treble' ? '2' : '4';

  doc.querySelectorAll('clef').forEach((clefEl) => {
    Array.from(clefEl.children).forEach((child) => child.remove());
    const signEl = doc.createElement('sign');
    signEl.textContent = sign;
    clefEl.appendChild(signEl);
    const lineEl = doc.createElement('line');
    lineEl.textContent = line;
    clefEl.appendChild(lineEl);
  });

  return new XMLSerializer().serializeToString(doc);
};

export const applyNotationInstrumentToMusicXml = (
  xmlString: string,
  preset: NotationInstrumentPreset,
  userOctaveShift: number,
  simpleMode = false,
): string => {
  const offset = getWrittenSemitoneOffset(preset, userOctaveShift);
  if (offset === 0 && preset.clef === 'grand') {
    return xmlString;
  }

  let result = transposeMusicXml(xmlString, offset, simpleMode);
  if (preset.clef !== 'grand') {
    result = rewriteClefsInMusicXml(result, preset.clef);
  }
  return result;
};

export const formatWrittenOffsetLabel = (offset: number, isEnglishCopy: boolean): string => {
  if (offset === 0) {
    return isEnglishCopy ? 'Concert pitch (written)' : '移調なし（記譜）';
  }
  const sign = offset > 0 ? '+' : '';
  return isEnglishCopy
    ? `${sign}${offset} semitones (written)`
    : `記譜 ${sign}${offset} 半音`;
};

export const formatNotationClefLabel = (
  clef: NotationInstrumentClef,
  isEnglishCopy: boolean,
): string => {
  if (clef === 'grand') {
    return isEnglishCopy ? 'Grand staff' : '大譜表';
  }
  if (clef === 'treble') {
    return isEnglishCopy ? 'Treble clef' : 'ト音記号';
  }
  return isEnglishCopy ? 'Bass clef' : 'ヘ音記号';
};
