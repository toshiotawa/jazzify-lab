import type { EarTrainingPhrase, EarTrainingPhraseChord, EarTrainingRank, EarTrainingStage } from '@/types';
import { transposeChordLabel } from '@/utils/earTrainingPracticeTranspose';
import {
  musicXmlAccidentalTextToAlter,
  parseVoicingNoteName,
} from '@/utils/voicingMusicXml';

/** chord_osmd ステージ／チュートリアル content.stage の既定値（MusicXML 譜面から判定ターゲットを生成） */
export const EAR_TRAINING_OSMD_SCORE_TARGET_DEFAULTS = {
  show_keyboard_hints_in_battle: true,
  osmd_targets_from_score: true,
} as const;

type EarTrainingOsmdScoreTargetStage = Pick<EarTrainingStage, 'mode' | 'osmd_targets_from_score'>;

/** chord_osmd では MusicXML 譜面ベース判定を既定とする（明示的 false のみ従来の chords タイミング） */
export const earTrainingOsmdUsesScoreTargets = (
  stage: EarTrainingOsmdScoreTargetStage,
): boolean => (
  stage.osmd_targets_from_score === true
  || (stage.mode === 'chord_osmd' && stage.osmd_targets_from_score !== false)
);

/** OSMD ステージ保存用: chord_osmd なら未指定時 true、明示 false は維持 */
export const resolveEarTrainingOsmdTargetsFromScore = (
  stage: EarTrainingOsmdScoreTargetStage,
): boolean | undefined => {
  if (stage.mode !== 'chord_osmd') {
    return stage.osmd_targets_from_score;
  }
  if (stage.osmd_targets_from_score === false) {
    return false;
  }
  return true;
};

/** OSMD リズム耳コピ：ターゲットより早い入力の受付幅（250ms）。 */
export const CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC = 0.25;
/** OSMD リズム耳コピ：ターゲットより遅い入力の受付幅・遅れミス確定（300ms）。 */
export const CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC = 0.3;
/** @deprecated `CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC` を使用 */
export const CHORD_OSMD_JUDGMENT_WINDOW_SEC = CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC;
import { OSMD_TIMING_ADJUSTMENT_MS_DEFAULT } from '@/utils/earTrainingOsmdTimingAdjustment';

/** @deprecated ユーザー timingAdjustment のデフォルト (+40ms) と同等。新規コードは timingAdjustment を使用 */
export const CHORD_OSMD_JUDGMENT_OFFSET_SEC = OSMD_TIMING_ADJUSTMENT_MS_DEFAULT / 1000;
/** ターゲット拍の何拍前にハンマー投擲を開始するか */
export const CHORD_OSMD_HAMMER_LEAD_BEATS = 4;

/** BPM からハンマー投擲リード秒数を算出（4拍前） */
export const chordOsmdHammerLeadSec = (bpm: number): number =>
  (60 / Math.max(1, bpm)) * CHORD_OSMD_HAMMER_LEAD_BEATS;
/** ターゲット時刻からこの秒数後にハンマー着弾・被ダメ演出 */
export const CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC = 0.3;

export const isPhraseTimeInChordOsmdJudgmentWindow = (
  phraseTimeSec: number,
  judgedTargetTimeSec: number,
  earlySec: number = CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC,
  lateSec: number = CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC,
): boolean => {
  const delta = phraseTimeSec - judgedTargetTimeSec;
  return delta >= -earlySec && delta <= lateSec;
};

export const hasChordOsmdJudgmentWindowExpired = (
  phraseTimeSec: number,
  judgedTargetTimeSec: number,
  lateSec: number = CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC,
): boolean => phraseTimeSec > judgedTargetTimeSec + lateSec;

const SAME_TARGET_EPSILON_SEC = 0.0005;
const SAME_TARGET_BEAT_EPSILON = 0.0005;
const XML_TIMING_EPSILON = 0.0005;
/** DB の beat_offset と MusicXML 由来 beatStartInMeasure を対応付ける許容（拍、1-indexed） */
const XML_ATTACK_BEAT_MATCH_EPS = 0.01;

const MUSIC_XML_STEP_TO_SEMITONE: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export interface ChordOsmdMusicXmlAttack {
  measureNumber: number;
  /** 小節内の拍位置（先頭拍を 1）。四分音符グリッド。 */
  beatStartInMeasure: number;
  midis: readonly number[];
}

/** MusicXML 1 番（verse 1）歌詞の表示タイミング（フレーズ冒頭 0 秒基準・Audio と同じ BPM 換算） */
export interface ChordOsmdLyricEvent {
  targetTimeSec: number;
  measureNumber: number;
  text: string;
}

/** 精密モード譜面歌詞レイヤー用：全 verse + 拍位置付き lyric イベント。 */
export interface ChordOsmdScoreLyricEvent {
  targetTimeSec: number;
  measureNumber: number;
  beatStartInMeasure: number;
  verseNumber: number;
  text: string;
}

export interface ChordOsmdNoteClusterContext {
  measureNumber: number;
  beatStartInMeasure: number;
  clusterNotes: readonly Element[];
  timing: MusicXmlScoreTimingState;
  /** クラスタ先頭音符の `<duration>`（divisions 単位） */
  durationDivisions: number;
}

interface MusicXmlScoreTimingState {
  divisions: number;
  beats: number;
  beatType: number;
  keyFifths: number;
}

interface ChordOsmdMidiCount {
  midi: number;
  count: number;
}

export interface ChordOsmdRhythmTarget {
  id: string;
  label: string;
  orderIndex: number;
  targetTimeSec: number;
  measureNumber: number;
  midiCounts: readonly ChordOsmdMidiCount[];
}

export type ChordOsmdTargetVisualState = 'idle' | 'active' | 'completed' | 'failed';

interface MusicXmlTimingState {
  divisions: number;
  beats: number;
  beatType: number;
}

interface TimedMusicXmlMarker {
  time: number;
  node: Node;
}

interface TimedStaffNote {
  start: number;
  duration: number;
  staff: 1 | 2;
  note: Element;
}

const isElementNode = (node: Node): node is Element => node.nodeType === 1;

const getDirectChild = (parent: Element, localName: string): Element | null => {
  for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
};

const getDirectChildText = (parent: Element, localName: string): string | null => {
  const child = getDirectChild(parent, localName);
  const text = child?.textContent?.trim();
  return text ? text : null;
};

const parsePositiveNumber = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseStaffNumber = (value: string | null): 1 | 2 | null => {
  if (value === '1') {
    return 1;
  }
  if (value === '2') {
    return 2;
  }
  return null;
};

const setDirectChildText = (doc: Document, parent: Element, localName: string, text: string): void => {
  const existing = getDirectChild(parent, localName);
  if (existing) {
    existing.textContent = text;
    return;
  }
  const child = doc.createElement(localName);
  child.textContent = text;
  parent.appendChild(child);
};

const durationToMusicXmlType = (duration: number, divisions: number): string | null => {
  const ratio = duration / Math.max(1, divisions);
  if (Math.abs(ratio - 4) <= XML_TIMING_EPSILON) {
    return 'whole';
  }
  if (Math.abs(ratio - 2) <= XML_TIMING_EPSILON) {
    return 'half';
  }
  if (Math.abs(ratio - 1) <= XML_TIMING_EPSILON) {
    return 'quarter';
  }
  if (Math.abs(ratio - 0.5) <= XML_TIMING_EPSILON) {
    return 'eighth';
  }
  if (Math.abs(ratio - 0.25) <= XML_TIMING_EPSILON) {
    return '16th';
  }
  return null;
};

const createDurationElement = (doc: Document, duration: number): Element => {
  const durationElement = doc.createElement('duration');
  durationElement.textContent = String(Math.round(duration));
  return durationElement;
};

const createRestNote = (
  doc: Document,
  duration: number,
  voice: 1 | 2,
  staff: 1 | 2,
  divisions: number,
): Element => {
  const note = doc.createElement('note');
  note.appendChild(doc.createElement('rest'));
  note.appendChild(createDurationElement(doc, duration));
  const voiceElement = doc.createElement('voice');
  voiceElement.textContent = String(voice);
  note.appendChild(voiceElement);
  const noteType = durationToMusicXmlType(duration, divisions);
  if (noteType) {
    const typeElement = doc.createElement('type');
    typeElement.textContent = noteType;
    note.appendChild(typeElement);
  }
  const staffElement = doc.createElement('staff');
  staffElement.textContent = String(staff);
  note.appendChild(staffElement);
  return note;
};

const createBackup = (doc: Document, duration: number): Element => {
  const backup = doc.createElement('backup');
  backup.appendChild(createDurationElement(doc, duration));
  return backup;
};

const cloneTimedNote = (doc: Document, source: Element, voice: 1 | 2, staff: 1 | 2): Element => {
  const note = source.cloneNode(true);
  if (!isElementNode(note)) {
    return source;
  }
  setDirectChildText(doc, note, 'voice', String(voice));
  setDirectChildText(doc, note, 'staff', String(staff));
  return note;
};

const readMeasureTiming = (
  measure: Element,
  previous: MusicXmlTimingState,
): MusicXmlTimingState => {
  const attributes = getDirectChild(measure, 'attributes');
  if (!attributes) {
    return previous;
  }
  const divisions = parsePositiveNumber(getDirectChildText(attributes, 'divisions')) ?? previous.divisions;
  const time = getDirectChild(attributes, 'time');
  const beats = time ? parsePositiveNumber(getDirectChildText(time, 'beats')) ?? previous.beats : previous.beats;
  const beatType = time
    ? parsePositiveNumber(getDirectChildText(time, 'beat-type')) ?? previous.beatType
    : previous.beatType;
  return { divisions, beats, beatType };
};

const normalizeMeasureToExplicitTwoStaffVoices = (
  doc: Document,
  measure: Element,
  timing: MusicXmlTimingState,
): boolean => {
  if (measure.getElementsByTagName('backup').length > 0 || measure.getElementsByTagName('forward').length > 0) {
    return false;
  }

  const timedNotes: TimedStaffNote[] = [];
  const markers: TimedMusicXmlMarker[] = [];
  let time = 0;
  let hasUnsupportedNote = false;

  for (const child of Array.from(measure.childNodes)) {
    if (!isElementNode(child)) {
      continue;
    }

    if (child.localName !== 'note') {
      markers.push({ time, node: child.cloneNode(true) });
      continue;
    }

    if (getDirectChild(child, 'chord') || getDirectChild(child, 'grace')) {
      hasUnsupportedNote = true;
      break;
    }

    const duration = parsePositiveNumber(getDirectChildText(child, 'duration'));
    const staff = parseStaffNumber(getDirectChildText(child, 'staff'));
    if (duration === null || staff === null) {
      hasUnsupportedNote = true;
      break;
    }

    timedNotes.push({
      start: time,
      duration,
      staff,
      note: child,
    });
    time += duration;
  }

  if (hasUnsupportedNote || timedNotes.length === 0) {
    return false;
  }

  const hasTreble = timedNotes.some(note => note.staff === 1);
  const hasBass = timedNotes.some(note => note.staff === 2);
  if (!hasTreble || !hasBass) {
    return false;
  }

  const hasStaffSwitch = timedNotes.some((note, index) => index > 0 && note.staff !== timedNotes[index - 1].staff);
  if (!hasStaffSwitch) {
    return false;
  }

  const expectedMeasureDuration = timing.divisions * timing.beats * (4 / timing.beatType);
  const measureDuration = Math.max(time, expectedMeasureDuration);
  if (!Number.isFinite(measureDuration) || measureDuration <= 0) {
    return false;
  }

  while (measure.firstChild) {
    measure.removeChild(measure.firstChild);
  }

  const inlineMarkers = markers.filter(marker => marker.time < measureDuration - XML_TIMING_EPSILON);
  const endMarkers = markers.filter(marker => marker.time >= measureDuration - XML_TIMING_EPSILON);
  let markerIndex = 0;

  const appendInlineMarkersUpTo = (targetTime: number): void => {
    while (
      markerIndex < inlineMarkers.length
      && inlineMarkers[markerIndex].time <= targetTime + XML_TIMING_EPSILON
    ) {
      measure.appendChild(inlineMarkers[markerIndex].node);
      markerIndex += 1;
    }
  };

  const appendRest = (duration: number, voice: 1 | 2, staff: 1 | 2): void => {
    if (duration <= XML_TIMING_EPSILON) {
      return;
    }
    measure.appendChild(createRestNote(doc, duration, voice, staff, timing.divisions));
  };

  const appendStaffVoice = (staff: 1 | 2, withMarkers: boolean): void => {
    const staffNotes = timedNotes.filter(note => note.staff === staff);
    let cursor = 0;
    for (const note of staffNotes) {
      if (withMarkers) {
        while (
          markerIndex < inlineMarkers.length
          && inlineMarkers[markerIndex].time < note.start - XML_TIMING_EPSILON
        ) {
          const marker = inlineMarkers[markerIndex];
          appendRest(marker.time - cursor, staff, staff);
          cursor = marker.time;
          measure.appendChild(marker.node);
          markerIndex += 1;
        }
        appendInlineMarkersUpTo(note.start);
      }
      appendRest(note.start - cursor, staff, staff);
      measure.appendChild(cloneTimedNote(doc, note.note, staff, staff));
      cursor = note.start + note.duration;
    }
    if (withMarkers) {
      while (markerIndex < inlineMarkers.length) {
        const marker = inlineMarkers[markerIndex];
        appendRest(marker.time - cursor, staff, staff);
        cursor = marker.time;
        measure.appendChild(marker.node);
        markerIndex += 1;
      }
    }
    appendRest(measureDuration - cursor, staff, staff);
  };

  appendStaffVoice(1, true);
  measure.appendChild(createBackup(doc, measureDuration));
  appendStaffVoice(2, false);
  for (const marker of endMarkers) {
    measure.appendChild(marker.node);
  }
  return true;
};

const MUSIC_XML_TENTHS_PER_STAFF_LINE = 40;

/**
 * `<staff-layout><staff-distance>`（段間）を OSMD `BetweenStaffDistance`（staff 高さ単位）へ換算。
 * 2 段目 layout（number="2"）を優先し、無ければ最初の staff-distance を使う。
 */
export const readBetweenStaffDistanceStaffHeightsFromMusicXml = (
  musicXmlText: string,
): number | null => {
  const twoStaffMatch = musicXmlText.match(
    /<staff-layout\b[^>]*\bnumber="2"[^>]*>[\s\S]*?<staff-distance>(\d+(?:\.\d+)?)<\/staff-distance>/,
  );
  const fallbackMatch = twoStaffMatch ?? musicXmlText.match(
    /<staff-layout>[\s\S]*?<staff-distance>(\d+(?:\.\d+)?)<\/staff-distance>/,
  );
  if (!fallbackMatch) {
    return null;
  }
  const tenths = Number.parseFloat(fallbackMatch[1]);
  if (!Number.isFinite(tenths) || tenths <= 0) {
    return null;
  }
  return tenths / MUSIC_XML_TENTHS_PER_STAFF_LINE;
};

/** `<harmony>` の並べ替えは MusicXML の時間位置を壊すため行わない。交互 staff の単一 voice のみ正規化する。 */
export const normalizeChordOsmdMusicXml = (xmlText: string): string => {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return xmlText;
  }

  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return xmlText;
  }

  let changed = false;
  let timing: MusicXmlTimingState = { divisions: 1, beats: 4, beatType: 4 };
  for (const measure of Array.from(doc.getElementsByTagName('measure'))) {
    timing = readMeasureTiming(measure, timing);
    changed = normalizeMeasureToExplicitTwoStaffVoices(doc, measure, timing) || changed;
  }

  if (!changed) {
    return xmlText;
  }
  return new XMLSerializer().serializeToString(doc);
};

const parseMusicXmlMeasureNumber = (measure: Element, ordinalOneBased: number): number => {
  const raw = measure.getAttribute('number')?.trim();
  if (raw) {
    const match = /^(\d+)/.exec(raw);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return ordinalOneBased;
};

const readScoreTimingFromAttributes = (
  attributes: Element,
  previous: MusicXmlScoreTimingState,
): MusicXmlScoreTimingState => {
  let { divisions, beats, beatType, keyFifths } = previous;
  const divText = getDirectChildText(attributes, 'divisions');
  if (divText) {
    const d = parsePositiveNumber(divText);
    if (d !== null) {
      divisions = d;
    }
  }
  const timeEl = getDirectChild(attributes, 'time');
  if (timeEl) {
    const bt = parsePositiveNumber(getDirectChildText(timeEl, 'beats'));
    const bty = parsePositiveNumber(getDirectChildText(timeEl, 'beat-type'));
    if (bt !== null) {
      beats = bt;
    }
    if (bty !== null) {
      beatType = bty;
    }
  }
  const keyEl = getDirectChild(attributes, 'key');
  if (keyEl) {
    const fifthsText = getDirectChildText(keyEl, 'fifths');
    if (fifthsText !== null && fifthsText !== '') {
      const k = Number.parseInt(fifthsText, 10);
      if (Number.isFinite(k)) {
        keyFifths = k;
      }
    }
  }
  return { divisions, beats, beatType, keyFifths };
};

/** `<tie type="stop"/>` または `<notations>` 直下の `<tied type="stop"/>`。誤検出回避のため直接子のみ走査。 */
const noteHasTieStop = (noteEl: Element): boolean => {
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === 'tie' && child.getAttribute('type') === 'stop') {
      return true;
    }
    if (child.localName === 'notations') {
      for (let ne = child.firstElementChild; ne; ne = ne.nextElementSibling) {
        if (ne.localName === 'tied' && ne.getAttribute('type') === 'stop') {
          return true;
        }
      }
    }
  }
  return false;
};

const resolveMusicXmlPitchAlter = (pitch: Element, noteEl: Element): number => {
  const alterText = getDirectChildText(pitch, 'alter');
  if (alterText !== null && alterText !== '') {
    const parsedAlter = Number.parseInt(alterText, 10);
    if (Number.isFinite(parsedAlter)) {
      return parsedAlter;
    }
  }
  const accidentalText = getDirectChildText(noteEl, 'accidental');
  if (accidentalText !== null && accidentalText !== '') {
    const fromAccidental = musicXmlAccidentalTextToAlter(accidentalText);
    if (fromAccidental !== null) {
      return fromAccidental;
    }
  }
  return 0;
};

const noteElementToMidi = (noteEl: Element, keyFifths: number): number | null => {
  const pitch = getDirectChild(noteEl, 'pitch');
  if (!pitch) {
    return null;
  }
  const stepRaw = getDirectChildText(pitch, 'step');
  const step = stepRaw?.trim();
  if (!step || step.length !== 1) {
    return null;
  }
  const semitoneBase = MUSIC_XML_STEP_TO_SEMITONE[step];
  if (semitoneBase === undefined) {
    return null;
  }
  const octaveText = getDirectChildText(pitch, 'octave');
  if (!octaveText) {
    return null;
  }
  const octave = Number.parseInt(octaveText, 10);
  if (!Number.isFinite(octave)) {
    return null;
  }
  const alter = resolveMusicXmlPitchAlter(pitch, noteEl);
  return (octave + 1) * 12 + semitoneBase + alter;
};

const selectMusicXmlMeasures = (doc: Document): Element[] => {
  const fromParts = Array.from(doc.querySelectorAll('part > measure'));
  if (fromParts.length > 0) {
    return fromParts;
  }
  return Array.from(doc.getElementsByTagName('measure'));
};

/** `number` 未指定・空・1 の lyric のみ 1 番として扱う（MusicXML 既定）。 */
const lyricElementIsVerseOne = (lyricEl: Element): boolean => {
  const raw = lyricEl.getAttribute('number')?.trim();
  return raw === undefined || raw === '' || raw === '1';
};

/** lyric の `number` 属性を verse 番号に（未指定・空は 1）。 */
const parseVerseNumberFromLyricElement = (lyricEl: Element): number => {
  const raw = lyricEl.getAttribute('number')?.trim();
  if (raw === undefined || raw === '') {
    return 1;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/** lyric 直接子の `<text>` / `<el/>` から表示用歌詞文字列を組み立てる（改行を保持）。 */
const mergeLyricTextFromLyricElement = (lyricEl: Element): string => {
  let buffer = '';
  for (let lc = lyricEl.firstElementChild; lc; lc = lc.nextElementSibling) {
    if (lc.localName === 'text') {
      buffer += lc.textContent ?? '';
    } else if (lc.localName === 'el') {
      buffer += '\n';
    }
  }
  return buffer.replace(/\r\n/g, '\n').trim();
};

/** 後方互換エイリアス */
const mergeVerseOneLyricTextFromLyricElement = mergeLyricTextFromLyricElement;

/** ノート直下の全 `<lyric>` を verse 番号付きで収集。 */
const allVersesLyricTextsFromNote = (
  noteEl: Element,
): Array<{ verseNumber: number; text: string }> => {
  const results: Array<{ verseNumber: number; text: string }> = [];
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName !== 'lyric') {
      continue;
    }
    const merged = mergeLyricTextFromLyricElement(child);
    if (merged.length > 0) {
      results.push({
        verseNumber: parseVerseNumberFromLyricElement(child),
        text: merged,
      });
    }
  }
  return results;
};

/** 空の `<lyric/>`（extend stop 等）も含めてクラスタ内の全 verse を列挙。 */
const allLyricVersesFromNote = (
  noteEl: Element,
): Array<{ verseNumber: number; text: string }> => {
  const results: Array<{ verseNumber: number; text: string }> = [];
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName !== 'lyric') {
      continue;
    }
    results.push({
      verseNumber: parseVerseNumberFromLyricElement(child),
      text: mergeLyricTextFromLyricElement(child),
    });
  }
  return results;
};

const allVersesLyricTextsFromCluster = (
  clusterNotes: readonly Element[],
): Array<{ verseNumber: number; text: string }> => {
  const byVerse = new Map<number, string>();
  for (const noteEl of clusterNotes) {
    for (const entry of allVersesLyricTextsFromNote(noteEl)) {
      if (!byVerse.has(entry.verseNumber)) {
        byVerse.set(entry.verseNumber, entry.text);
      }
    }
  }
  return Array.from(byVerse.entries()).map(([verseNumber, text]) => ({ verseNumber, text }));
};

const allLyricVersesFromCluster = (
  clusterNotes: readonly Element[],
): Array<{ verseNumber: number; text: string }> => {
  const byVerse = new Map<number, string>();
  for (const noteEl of clusterNotes) {
    for (const entry of allLyricVersesFromNote(noteEl)) {
      if (!byVerse.has(entry.verseNumber)) {
        byVerse.set(entry.verseNumber, entry.text);
      }
    }
  }
  return Array.from(byVerse.entries()).map(([verseNumber, text]) => ({ verseNumber, text }));
};

const noteHasLyricElements = (noteEl: Element): boolean => {
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === 'lyric') {
      return true;
    }
  }
  return false;
};

/**
 * MusicXML の 1 番歌詞のみ、音符クラスタ先頭から次の変化まで同じ文面としてイベント化。
 */
export const collectChordOsmdMusicXmlLyrics = (
  musicXmlText: string,
  bpm: number,
  beatsPerMeasure: number,
  isSwing = false,
): ChordOsmdLyricEvent[] => {
  const lyrics: ChordOsmdLyricEvent[] = [];
  let lastText: string | null = null;
  for (const event of collectChordOsmdScoreLyricEvents(musicXmlText, bpm, beatsPerMeasure, isSwing)) {
    if (event.verseNumber !== 1 || event.text === lastText) {
      continue;
    }
    lastText = event.text;
    lyrics.push({
      targetTimeSec: event.targetTimeSec,
      measureNumber: event.measureNumber,
      text: event.text,
    });
  }
  return lyrics;
};

/** スウィング8分: 表拍 = 2/3, 裏拍 = 1/3 */
export const CHORD_OSMD_SWING_LONG_EIGHTH_RATIO = 2 / 3;

const applyChordOsmdSwingToBeatIndex = (beatIndex: number): number => {
  const beatWhole = Math.floor(beatIndex + 1e-6);
  const fraction = beatIndex - beatWhole;
  if (Math.abs(fraction - 0.5) < 1e-6) {
    return beatWhole + CHORD_OSMD_SWING_LONG_EIGHTH_RATIO;
  }
  return beatIndex;
};

const chordOsmdLyricTargetTimeSec = (
  measureNumber: number,
  beatStartInMeasure: number,
  bpm: number,
  beatsPerMeasure: number,
  isSwing = false,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const bpmSafe = Math.max(1, beatsPerMeasure);
  const measureIndex = Math.max(0, Math.trunc(measureNumber) - 1);
  const rawBeatIndex = Math.max(0, beatStartInMeasure - 1);
  const beatIndex = isSwing ? applyChordOsmdSwingToBeatIndex(rawBeatIndex) : rawBeatIndex;
  return (measureIndex * bpmSafe + beatIndex) * beatDurationSec;
};

/** MusicXML 音符要素 → MIDI（タイ stop 判定は呼び出し側で行う） */
export const parseMusicXmlNoteElementToMidi = noteElementToMidi;

/** `<tie type="stop"/>` / `<tied type="stop"/>` */
export const musicXmlNoteHasTieStop = noteHasTieStop;

export const chordOsmdBeatToTargetTimeSec = chordOsmdLyricTargetTimeSec;

/**
 * ピッチを持つ音符クラスタ（先頭＋`<chord/>`）ごとにコールバック。`collectChordOsmdMusicXmlAttacks` と同一走査。
 */
export const forEachChordOsmdNoteCluster = (
  musicXmlText: string,
  onCluster: (ctx: ChordOsmdNoteClusterContext) => void,
): void => {
  if (typeof DOMParser === 'undefined') {
    return;
  }
  const doc = new DOMParser().parseFromString(musicXmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return;
  }

  const measures = selectMusicXmlMeasures(doc);
  let timing: MusicXmlScoreTimingState = {
    divisions: 1,
    beats: 4,
    beatType: 4,
    keyFifths: 0,
  };

  for (let measureIndex = 0; measureIndex < measures.length; measureIndex += 1) {
    const measure = measures[measureIndex];
    const measureNumber = parseMusicXmlMeasureNumber(measure, measureIndex + 1);
    let currentTime = 0;
    const children = Array.from(measure.children);
    let ci = 0;
    while (ci < children.length) {
      const child = children[ci];
      if (!isElementNode(child)) {
        ci += 1;
        continue;
      }
      if (child.localName === 'attributes') {
        timing = readScoreTimingFromAttributes(child, timing);
        ci += 1;
        continue;
      }
      if (child.localName === 'backup') {
        const dur = parsePositiveNumber(getDirectChildText(child, 'duration'));
        if (dur !== null) {
          currentTime -= dur;
        }
        ci += 1;
        continue;
      }
      if (child.localName === 'forward') {
        const dur = parsePositiveNumber(getDirectChildText(child, 'duration'));
        if (dur !== null) {
          currentTime += dur;
        }
        ci += 1;
        continue;
      }
      if (child.localName !== 'note') {
        ci += 1;
        continue;
      }

      const noteEl = child;
      if (getDirectChild(noteEl, 'grace')) {
        ci += 1;
        continue;
      }

      const duration = parsePositiveNumber(getDirectChildText(noteEl, 'duration'));
      if (duration === null) {
        ci += 1;
        continue;
      }

      if (getDirectChild(noteEl, 'rest')) {
        if (noteHasLyricElements(noteEl)) {
          const divisions = Math.max(1, timing.divisions);
          const quartersFromMeasureStart = currentTime / divisions;
          const beatStartInMeasure = quartersFromMeasureStart + 1;
          onCluster({
            measureNumber,
            beatStartInMeasure,
            clusterNotes: [noteEl],
            timing,
            durationDivisions: duration,
          });
        }
        currentTime += duration;
        ci += 1;
        continue;
      }

      const pitch = getDirectChild(noteEl, 'pitch');
      if (!pitch) {
        ci += 1;
        continue;
      }

      if (getDirectChild(noteEl, 'chord')) {
        ci += 1;
        continue;
      }

      const headStopTied = noteHasTieStop(noteEl);
      const clusterNotes: Element[] = [noteEl];
      const clusterDur = duration;
      let ni = ci + 1;
      while (ni < children.length) {
        const next = children[ni];
        if (!isElementNode(next) || next.localName !== 'note') {
          break;
        }
        if (getDirectChild(next, 'grace')) {
          break;
        }
        if (!getDirectChild(next, 'chord')) {
          break;
        }
        if (getDirectChild(next, 'rest')) {
          break;
        }
        const nextPitch = getDirectChild(next, 'pitch');
        if (!nextPitch) {
          break;
        }
        clusterNotes.push(next);
        ni += 1;
      }

      const divisions = Math.max(1, timing.divisions);
      const quartersFromMeasureStart = currentTime / divisions;
      const beatStartInMeasure = quartersFromMeasureStart + 1;

      onCluster({
        measureNumber,
        beatStartInMeasure,
        clusterNotes,
        timing,
        durationDivisions: clusterDur,
      });

      currentTime += clusterDur;
      ci = ni;
    }
  }
};

/** MusicXML から「同時発音のクラスタ」単位で MIDI を収集（`<chord/>`・`<backup>`・タイ続き `tie/tied type="stop"` を考慮）。OSMD 判定の正とする。 */
export const collectChordOsmdMusicXmlAttacks = (musicXmlText: string): ChordOsmdMusicXmlAttack[] => {
  const attacks: ChordOsmdMusicXmlAttack[] = [];
  forEachChordOsmdNoteCluster(musicXmlText, ({ measureNumber, beatStartInMeasure, clusterNotes, timing }) => {
    const clusterMidis: number[] = [];
    const head = clusterNotes[0];
    if (head && getDirectChild(head, 'pitch') && !noteHasTieStop(head)) {
      const midi0 = noteElementToMidi(head, timing.keyFifths);
      if (midi0 !== null) {
        clusterMidis.push(midi0);
      }
    }
    for (let i = 1; i < clusterNotes.length; i += 1) {
      const next = clusterNotes[i];
      if (!getDirectChild(next, 'pitch')) {
        continue;
      }
      if (noteHasTieStop(next)) {
        continue;
      }
      const mm = noteElementToMidi(next, timing.keyFifths);
      if (mm !== null) {
        clusterMidis.push(mm);
      }
    }
    if (clusterMidis.length > 0) {
      attacks.push({
        measureNumber,
        beatStartInMeasure,
        midis: clusterMidis,
      });
    }
  });
  return attacks;
};

const verseOneLyricTextFromNote = (noteEl: Element): string | null => {
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName !== 'lyric' || !lyricElementIsVerseOne(child)) {
      continue;
    }
    const merged = mergeVerseOneLyricTextFromLyricElement(child);
    if (merged.length > 0) {
      return merged;
    }
  }
  return null;
};

const verseOneLyricTextFromCluster = (clusterNotes: readonly Element[]): string | null => {
  for (const noteEl of clusterNotes) {
    const t = verseOneLyricTextFromNote(noteEl);
    if (t !== null) {
      return t;
    }
  }
  return null;
};

/**
 * MusicXML の全 verse 歌詞を音符クラスタ単位でイベント化（精密モード譜面レイヤー用）。
 */
export const collectChordOsmdScoreLyricEvents = (
  musicXmlText: string,
  bpm: number,
  beatsPerMeasure: number,
  isSwing = false,
): ChordOsmdScoreLyricEvent[] => {
  const events: ChordOsmdScoreLyricEvent[] = [];
  const lastTextByVerse = new Map<number, string>();
  forEachChordOsmdNoteCluster(musicXmlText, ({ measureNumber, beatStartInMeasure, clusterNotes }) => {
    const allVersesInCluster = allLyricVersesFromCluster(clusterNotes);
    if (allVersesInCluster.length === 0) {
      return;
    }
    const versesPresent = new Set(allVersesInCluster.map((entry) => entry.verseNumber));
    const maxPresentVerse = allVersesInCluster.reduce(
      (max, entry) => Math.max(max, entry.verseNumber),
      0,
    );
    let hasChange = false;
    for (const { verseNumber, text } of allVersesInCluster) {
      const lastText = lastTextByVerse.get(verseNumber) ?? null;
      if (text.length > 0) {
        if (text !== lastText) {
          hasChange = true;
        }
      } else if (lastText !== null) {
        hasChange = true;
      }
    }
    for (const [verseNumber, text] of lastTextByVerse) {
      if (text.length > 0 && verseNumber > maxPresentVerse && !versesPresent.has(verseNumber)) {
        hasChange = true;
      }
    }
    if (!hasChange) {
      return;
    }
    const nextState = new Map(lastTextByVerse);
    for (const { verseNumber, text } of allVersesInCluster) {
      if (text.length > 0) {
        nextState.set(verseNumber, text);
      } else {
        nextState.delete(verseNumber);
      }
    }
    for (const verseNumber of nextState.keys()) {
      if (verseNumber > maxPresentVerse && !versesPresent.has(verseNumber)) {
        nextState.delete(verseNumber);
      }
    }
    const targetTimeSec = chordOsmdLyricTargetTimeSec(
      measureNumber,
      beatStartInMeasure,
      bpm,
      beatsPerMeasure,
      isSwing,
    );
    for (const [verseNumber, text] of nextState) {
      if (text.length > 0) {
        events.push({
          targetTimeSec,
          measureNumber,
          beatStartInMeasure,
          verseNumber,
          text,
        });
      }
    }
    lastTextByVerse.clear();
    for (const [verseNumber, text] of nextState) {
      lastTextByVerse.set(verseNumber, text);
    }
  });
  events.sort((a, b) => {
    if (a.targetTimeSec !== b.targetTimeSec) {
      return a.targetTimeSec - b.targetTimeSec;
    }
    if (a.measureNumber !== b.measureNumber) {
      return a.measureNumber - b.measureNumber;
    }
    if (a.beatStartInMeasure !== b.beatStartInMeasure) {
      return a.beatStartInMeasure - b.beatStartInMeasure;
    }
    return a.verseNumber - b.verseNumber;
  });
  return events;
};
export const joinScoreLyricVerseTexts = (
  events: readonly Pick<ChordOsmdScoreLyricEvent, 'verseNumber' | 'text'>[],
): string => (
  events
    .slice()
    .sort((a, b) => a.verseNumber - b.verseNumber)
    .map((event) => event.text.trim())
    .filter((text) => text.length > 0)
    .join('\n')
);

export const resolveActiveScoreLyricTextAtTime = (
  events: readonly ChordOsmdScoreLyricEvent[],
  phraseTimeSec: number,
  calibrateTargetTimeSec: (targetTimeSec: number) => number,
): string => {
  let bestTime = Number.NEGATIVE_INFINITY;
  for (const lyric of events) {
    const time = calibrateTargetTimeSec(lyric.targetTimeSec);
    if (time > phraseTimeSec + 1e-9) {
      break;
    }
    if (time > bestTime + 1e-9) {
      bestTime = time;
    }
  }
  if (!Number.isFinite(bestTime)) {
    return '';
  }
  const batch = events.filter(
    (lyric) => Math.abs(calibrateTargetTimeSec(lyric.targetTimeSec) - bestTime) < 1e-9,
  );
  return joinScoreLyricVerseTexts(batch);
};

const mergeMidisFromXmlAttacks = (
  attacks: readonly ChordOsmdMusicXmlAttack[],
  measureNumber: number,
  beatOffset: number,
): Map<number, number> | null => {
  const merged = new Map<number, number>();
  let matched = false;
  for (const attack of attacks) {
    if (attack.measureNumber !== measureNumber) {
      continue;
    }
    if (Math.abs(attack.beatStartInMeasure - beatOffset) >= XML_ATTACK_BEAT_MATCH_EPS) {
      continue;
    }
    matched = true;
    for (const midi of attack.midis) {
      merged.set(midi, (merged.get(midi) ?? 0) + 1);
    }
  }
  if (!matched || merged.size === 0) {
    return null;
  }
  return merged;
};

const chordStartTimeSec = (
  chord: EarTrainingPhraseChord,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.start_time_sec === 'number' && Number.isFinite(chord.start_time_sec)) {
    return Math.max(0, chord.start_time_sec);
  }

  if (
    typeof chord.measure_number === 'number'
    && Number.isFinite(chord.measure_number)
    && typeof chord.beat_offset === 'number'
    && Number.isFinite(chord.beat_offset)
  ) {
    const measureIndex = Math.max(0, Math.trunc(chord.measure_number) - 1);
    const beatIndex = Math.max(0, chord.beat_offset - 1);
    return (measureIndex * Math.max(1, beatsPerMeasure) + beatIndex) * beatDurationSec;
  }

  return Math.max(0, chord.order_index) * beatDurationSec;
};

const chordMeasureNumber = (
  chord: EarTrainingPhraseChord,
  targetTimeSec: number,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.measure_number === 'number' && Number.isFinite(chord.measure_number)) {
    return Math.max(1, Math.trunc(chord.measure_number));
  }
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  return measureDurationSec > 0
    ? Math.floor(targetTimeSec / measureDurationSec) + 1
    : 1;
};

const chordBeatOffset = (chord: EarTrainingPhraseChord): number | null => {
  if (typeof chord.beat_offset !== 'number' || !Number.isFinite(chord.beat_offset)) {
    return null;
  }
  return chord.beat_offset;
};

const chordItemsAreSameTiming = (
  a: { targetTimeSec: number; measureNumber: number; beatOffset: number | null },
  b: { targetTimeSec: number; measureNumber: number; beatOffset: number | null },
): boolean => {
  if (a.measureNumber !== b.measureNumber) {
    return false;
  }
  if (Math.abs(a.targetTimeSec - b.targetTimeSec) <= SAME_TARGET_EPSILON_SEC) {
    return true;
  }
  return a.beatOffset !== null
    && b.beatOffset !== null
    && Math.abs(a.beatOffset - b.beatOffset) <= SAME_TARGET_BEAT_EPSILON;
};

const noteNameToMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parseVoicingNoteName(trimmed).midi;
  } catch {
    return null;
  }
};

const addMidiCounts = (
  counts: Map<number, number>,
  voicing: readonly string[] | null | undefined,
): void => {
  for (const noteName of voicing ?? []) {
    const midi = noteNameToMidi(noteName);
    if (midi !== null) {
      counts.set(midi, (counts.get(midi) ?? 0) + 1);
    }
  }
};

const midiCountArray = (counts: ReadonlyMap<number, number>): ChordOsmdMidiCount[] => (
  Array.from(counts, ([midi, count]) => ({ midi, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => a.midi - b.midi)
);

const buildPlayableMeasureLabels = (
  chords: readonly EarTrainingPhraseChord[],
  transposeOffset = 0,
): Map<number, string> => {
  const labels = new Map<number, string>();
  for (const chord of chords) {
    if (chord.input_disabled === true) {
      continue;
    }
    if (typeof chord.measure_number !== 'number' || !Number.isFinite(chord.measure_number)) {
      continue;
    }
    const measureNumber = Math.max(1, Math.trunc(chord.measure_number));
    if (!labels.has(measureNumber)) {
      labels.set(measureNumber, transposeChordLabel(chord.chord_name, transposeOffset));
    }
  }
  return labels;
};

const buildPlayableMeasures = (chords: readonly EarTrainingPhraseChord[]): Set<number> => {
  const measures = new Set<number>();
  for (const chord of chords) {
    if (chord.input_disabled === true) {
      continue;
    }
    if (typeof chord.measure_number !== 'number' || !Number.isFinite(chord.measure_number)) {
      continue;
    }
    measures.add(Math.max(1, Math.trunc(chord.measure_number)));
  }
  return measures;
};

const buildDisabledMeasures = (chords: readonly EarTrainingPhraseChord[]): Set<number> => {
  const measures = new Set<number>();
  for (const chord of chords) {
    if (chord.input_disabled !== true) {
      continue;
    }
    if (typeof chord.measure_number !== 'number' || !Number.isFinite(chord.measure_number)) {
      continue;
    }
    measures.add(Math.max(1, Math.trunc(chord.measure_number)));
  }
  return measures;
};

const attackMidiCounts = (midis: readonly number[]): Map<number, number> => {
  const counts = new Map<number, number>();
  for (const midi of midis) {
    counts.set(midi, (counts.get(midi) ?? 0) + 1);
  }
  return counts;
};

const scoreTargetId = (measureNumber: number, beatStartInMeasure: number): string => (
  `score:${measureNumber}:${beatStartInMeasure.toFixed(4)}`
);

/** MIDI / 絶対時刻から小節番号を推定（譜面スクロール用） */
export const chordOsmdMeasureNumberFromTimeSec = (
  startSec: number,
  bpm: number,
  beatsPerMeasure: number,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  if (!(measureDurationSec > 0) || !Number.isFinite(startSec)) {
    return 1;
  }
  return Math.max(1, Math.floor(Math.max(0, startSec) / measureDurationSec + SAME_TARGET_EPSILON_SEC) + 1);
};

export interface ChordOsmdMidiNoteLike {
  midi: number;
  startSec: number;
}

/**
 * MIDI 由来ノーツを同一 startSec クラスタにまとめ、OSMD リズムターゲットにする。
 * `midi_url` があるフレーズでは MusicXML 譜面より優先する。
 */
export const buildChordOsmdRhythmTargetsFromMidiNotes = (
  notes: readonly ChordOsmdMidiNoteLike[],
  bpm: number,
  beatsPerMeasure: number,
  measureLabels?: ReadonlyMap<number, string>,
): ChordOsmdRhythmTarget[] => {
  if (notes.length === 0) {
    return [];
  }

  const sorted = notes
    .filter(note => Number.isFinite(note.midi) && Number.isFinite(note.startSec))
    .slice()
    .sort((a, b) => {
      if (Math.abs(a.startSec - b.startSec) > SAME_TARGET_EPSILON_SEC) {
        return a.startSec - b.startSec;
      }
      return a.midi - b.midi;
    });

  if (sorted.length === 0) {
    return [];
  }

  const clusters: Array<{ startSec: number; counts: Map<number, number> }> = [];
  for (const note of sorted) {
    const midi = Math.round(note.midi);
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(last.startSec - note.startSec) <= SAME_TARGET_EPSILON_SEC) {
      last.counts.set(midi, (last.counts.get(midi) ?? 0) + 1);
      continue;
    }
    clusters.push({
      startSec: note.startSec,
      counts: new Map([[midi, 1]]),
    });
  }

  return clusters.map((cluster, orderIndex) => {
    const measureNumber = chordOsmdMeasureNumberFromTimeSec(
      cluster.startSec,
      bpm,
      beatsPerMeasure,
    );
    return {
      id: `midi:${cluster.startSec.toFixed(4)}`,
      label: measureLabels?.get(measureNumber) ?? '—',
      orderIndex,
      targetTimeSec: cluster.startSec,
      measureNumber,
      midiCounts: midiCountArray(cluster.counts),
    };
  });
};

const buildChordOsmdRhythmTargetsFromScore = (
  phrase: EarTrainingPhrase,
  bpm: number,
  beatsPerMeasure: number,
  attacks: readonly ChordOsmdMusicXmlAttack[],
  transposeOffset = 0,
  isSwing = false,
): ChordOsmdRhythmTarget[] => {
  const chords = phrase.chords ?? [];
  const playableMeasures = buildPlayableMeasures(chords);
  const disabledMeasures = buildDisabledMeasures(chords);
  const measureLabels = buildPlayableMeasureLabels(chords, transposeOffset);
  if (attacks.length === 0) {
    return [];
  }
  const useAllScoreMeasures = playableMeasures.size === 0 && disabledMeasures.size === 0;

  const sortedAttacks = attacks
    .filter(attack => {
      if (useAllScoreMeasures) {
        return true;
      }
      if (playableMeasures.size === 0) {
        return false;
      }
      return playableMeasures.has(attack.measureNumber);
    })
    .sort((a, b) => {
      const timeA = chordOsmdLyricTargetTimeSec(a.measureNumber, a.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
      const timeB = chordOsmdLyricTargetTimeSec(b.measureNumber, b.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
      if (Math.abs(timeA - timeB) > SAME_TARGET_EPSILON_SEC) {
        return timeA - timeB;
      }
      if (a.measureNumber !== b.measureNumber) {
        return a.measureNumber - b.measureNumber;
      }
      return a.beatStartInMeasure - b.beatStartInMeasure;
    });

  return sortedAttacks.map((attack, orderIndex) => {
    const targetTimeSec = chordOsmdLyricTargetTimeSec(
      attack.measureNumber,
      attack.beatStartInMeasure,
      bpm,
      beatsPerMeasure,
      isSwing,
    );
    return {
      id: `${scoreTargetId(attack.measureNumber, attack.beatStartInMeasure)}:${orderIndex}`,
      label: measureLabels.get(attack.measureNumber) ?? '—',
      orderIndex,
      targetTimeSec,
      measureNumber: attack.measureNumber,
      midiCounts: midiCountArray(attackMidiCounts(attack.midis)),
    };
  });
};

export const buildChordOsmdRhythmTargets = (
  phrase: EarTrainingPhrase | undefined,
  bpm: number,
  beatsPerMeasure: number,
  attacks?: readonly ChordOsmdMusicXmlAttack[] | null,
  fromScore = false,
  transposeOffset = 0,
  midiNotes?: readonly ChordOsmdMidiNoteLike[] | null,
  isSwing = false,
): ChordOsmdRhythmTarget[] => {
  if (!phrase) {
    return [];
  }

  if (fromScore && attacks && attacks.length > 0) {
    return buildChordOsmdRhythmTargetsFromScore(
      phrase,
      bpm,
      beatsPerMeasure,
      attacks,
      transposeOffset,
      isSwing,
    );
  }

  if (midiNotes && midiNotes.length > 0) {
    const measureLabels = buildPlayableMeasureLabels(phrase.chords ?? [], transposeOffset);
    const fromMidi = buildChordOsmdRhythmTargetsFromMidiNotes(
      midiNotes,
      bpm,
      beatsPerMeasure,
      measureLabels,
    );
    if (fromMidi.length > 0) {
      return fromMidi;
    }
  }

  const chords = phrase.chords ?? [];
  if (chords.length === 0) {
    return [];
  }

  const beatDurationSec = 60 / Math.max(1, bpm);
  const sorted = chords
    .map(chord => {
      const targetTimeSec = chordStartTimeSec(chord, beatDurationSec, beatsPerMeasure);
      const measureNumber = chordMeasureNumber(chord, targetTimeSec, beatDurationSec, beatsPerMeasure);
      const beatOffset = chordBeatOffset(chord);
      return { chord, targetTimeSec, measureNumber, beatOffset };
    })
    .sort((a, b) => {
      if (Math.abs(a.targetTimeSec - b.targetTimeSec) > SAME_TARGET_EPSILON_SEC) {
        return a.targetTimeSec - b.targetTimeSec;
      }
      return a.chord.order_index - b.chord.order_index;
    });

  const targets: Array<ChordOsmdRhythmTarget & { beatOffset: number | null; mutableCounts: Map<number, number> }> = [];
  for (const item of sorted) {
    const counts = new Map<number, number>();
    addMidiCounts(counts, item.chord.voicing);
    if (attacks && attacks.length > 0 && item.beatOffset !== null) {
      const xmlCounts = mergeMidisFromXmlAttacks(attacks, item.measureNumber, item.beatOffset);
      if (xmlCounts) {
        counts.clear();
        xmlCounts.forEach((count, midi) => {
          counts.set(midi, count);
        });
      }
    }
    if (counts.size === 0) {
      continue;
    }

    const last = targets[targets.length - 1];
    const transposedChordName = transposeChordLabel(item.chord.chord_name, transposeOffset);
    if (
      last
      && chordItemsAreSameTiming(last, item)
    ) {
      if (!last.label.split(' / ').includes(transposedChordName)) {
        last.label = `${last.label} / ${transposedChordName}`;
      }
      counts.forEach((count, midi) => {
        last.mutableCounts.set(midi, (last.mutableCounts.get(midi) ?? 0) + count);
      });
      last.midiCounts = midiCountArray(last.mutableCounts);
      continue;
    }

    targets.push({
      id: item.chord.id,
      label: transposedChordName,
      orderIndex: item.chord.order_index,
      targetTimeSec: item.targetTimeSec,
      measureNumber: item.measureNumber,
      beatOffset: item.beatOffset,
      midiCounts: midiCountArray(counts),
      mutableCounts: counts,
    });
  }

  return targets.map(({ beatOffset: _beatOffset, mutableCounts: _mutableCounts, ...target }) => target);
};

export const createChordOsmdRemainingCounts = (
  target: ChordOsmdRhythmTarget,
): Map<number, number> => (
  new Map(target.midiCounts.map(item => [item.midi, item.count]))
);

export const consumeChordOsmdMidi = (
  remainingCounts: ReadonlyMap<number, number>,
  midi: number,
): Map<number, number> | null => {
  const current = remainingCounts.get(Math.round(midi)) ?? 0;
  if (current <= 0) {
    return null;
  }
  const next = new Map(remainingCounts);
  next.set(Math.round(midi), current - 1);
  return next;
};

export const chordOsmdTargetIsComplete = (
  remainingCounts: ReadonlyMap<number, number>,
): boolean => {
  for (const count of remainingCounts.values()) {
    if (count > 0) {
      return false;
    }
  }
  return true;
};

export const chordOsmdRankForAccuracy = (accuracy: number): EarTrainingRank => {
  if (accuracy >= 0.98) {
    return 'Perfect';
  }
  if (accuracy >= 0.8) {
    return 'Great';
  }
  if (accuracy >= 0.4) {
    return 'Good';
  }
  return 'Fail';
};

export const getChordOsmdTargetNoteCount = (target: ChordOsmdRhythmTarget): number => (
  target.midiCounts.reduce((sum, item) => sum + item.count, 0)
);

export const getChordOsmdTotalNoteCount = (
  targets: readonly ChordOsmdRhythmTarget[],
): number => (
  targets.reduce((sum, target) => sum + getChordOsmdTargetNoteCount(target), 0)
);

export interface ChordOsmdRuntimeRemainingCounts {
  readonly remainingCounts: ReadonlyMap<number, number>;
}

export const chordOsmdNoteHitRatio = (
  targets: readonly ChordOsmdRhythmTarget[],
  runtimeByTargetId: ReadonlyMap<string, ChordOsmdRuntimeRemainingCounts>,
): number => {
  let expected = 0;
  let remaining = 0;
  for (const target of targets) {
    const targetExpected = getChordOsmdTargetNoteCount(target);
    expected += targetExpected;
    const state = runtimeByTargetId.get(target.id);
    if (state) {
      for (const count of state.remainingCounts.values()) {
        remaining += count;
      }
    } else {
      remaining += targetExpected;
    }
  }
  if (expected <= 0) {
    return 1;
  }
  return (expected - remaining) / expected;
};

export const findFirstIncompleteChordOsmdTarget = (
  targets: readonly ChordOsmdRhythmTarget[],
  isIncomplete: (targetId: string) => boolean,
): ChordOsmdRhythmTarget | null => {
  for (const target of targets) {
    if (isIncomplete(target.id)) {
      return target;
    }
  }
  return null;
};

export const areAllChordOsmdTargetsCompleted = (
  targets: readonly ChordOsmdRhythmTarget[],
  isCompleted: (targetId: string) => boolean,
): boolean => (
  targets.length > 0 && targets.every(target => isCompleted(target.id))
);

/** 同一小節内で最後に判定されるターゲットか（小節最終音符のフィニッシュモーション用）。 */
export const isLastChordOsmdTargetInMeasure = (
  targets: readonly ChordOsmdRhythmTarget[],
  target: ChordOsmdRhythmTarget,
): boolean => {
  let latestTimeSec = target.targetTimeSec;
  let latestOrderIndex = target.orderIndex;
  for (const candidate of targets) {
    if (candidate.measureNumber !== target.measureNumber) {
      continue;
    }
    if (candidate.targetTimeSec > latestTimeSec + 1e-9) {
      latestTimeSec = candidate.targetTimeSec;
      latestOrderIndex = candidate.orderIndex;
      continue;
    }
    if (
      Math.abs(candidate.targetTimeSec - latestTimeSec) <= 1e-9
      && candidate.orderIndex > latestOrderIndex
    ) {
      latestOrderIndex = candidate.orderIndex;
    }
  }
  return (
    Math.abs(target.targetTimeSec - latestTimeSec) <= 1e-9
    && target.orderIndex === latestOrderIndex
  );
};
