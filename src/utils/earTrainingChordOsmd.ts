import type { EarTrainingPhrase, EarTrainingPhraseChord, EarTrainingRank, EarTrainingStage } from '@/types';
import {
  musicXmlAccidentalTextToAlter,
  musicXmlKeySignatureAlter,
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

/** OSMD リズム耳コピ：ターゲット時刻を中心に ± この秒数（前後 250ms） */
export const CHORD_OSMD_JUDGMENT_WINDOW_SEC = 0.25;
/** OSMD リズム判定の中心を後ろへずらす補正（出力レイテンシ吸収。+で late 側を許容） */
export const CHORD_OSMD_JUDGMENT_OFFSET_SEC = 0.04;
/** カウントイン中に最初のターゲットのハンマーも投げきれるよう、リードを短めにする */
export const CHORD_OSMD_HAMMER_LEAD_SEC = 2.4;
export const CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC = 0.2;

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

interface ChordOsmdNoteClusterContext {
  measureNumber: number;
  beatStartInMeasure: number;
  clusterNotes: readonly Element[];
  timing: MusicXmlScoreTimingState;
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

  return changed ? new XMLSerializer().serializeToString(doc) : xmlText;
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

const resolveMusicXmlPitchAlter = (pitch: Element, noteEl: Element, step: string, keyFifths: number): number => {
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
  return musicXmlKeySignatureAlter(step, keyFifths);
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
  const alter = resolveMusicXmlPitchAlter(pitch, noteEl, step, keyFifths);
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

/** ノート直下の `<lyric>` のうち 1 番のみ。`<text>` は lyric の直接子のみ連結（ネスト誤検出を避ける）。 */
const verseOneLyricTextFromNote = (noteEl: Element): string | null => {
  for (let child = noteEl.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName !== 'lyric' || !lyricElementIsVerseOne(child)) {
      continue;
    }
    let buffer = '';
    for (let lc = child.firstElementChild; lc; lc = lc.nextElementSibling) {
      if (lc.localName === 'text') {
        buffer += (lc.textContent ?? '').trim();
      }
    }
    const merged = buffer.trim();
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

const chordOsmdLyricTargetTimeSec = (
  measureNumber: number,
  beatStartInMeasure: number,
  bpm: number,
  beatsPerMeasure: number,
): number => {
  const beatDurationSec = 60 / Math.max(1, bpm);
  const bpmSafe = Math.max(1, beatsPerMeasure);
  const measureIndex = Math.max(0, Math.trunc(measureNumber) - 1);
  const beatIndex = Math.max(0, beatStartInMeasure - 1);
  return (measureIndex * bpmSafe + beatIndex) * beatDurationSec;
};

/**
 * ピッチを持つ音符クラスタ（先頭＋`<chord/>`）ごとにコールバック。`collectChordOsmdMusicXmlAttacks` と同一走査。
 */
const forEachChordOsmdNoteCluster = (
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

/**
 * MusicXML の 1 番歌詞のみ、音符クラスタ先頭から次の変化まで同じ文面としてイベント化。
 */
export const collectChordOsmdMusicXmlLyrics = (
  musicXmlText: string,
  bpm: number,
  beatsPerMeasure: number,
): ChordOsmdLyricEvent[] => {
  const events: ChordOsmdLyricEvent[] = [];
  let lastText: string | null = null;
  forEachChordOsmdNoteCluster(musicXmlText, ({ measureNumber, beatStartInMeasure, clusterNotes }) => {
    const text = verseOneLyricTextFromCluster(clusterNotes);
    if (text === null) {
      return;
    }
    if (text === lastText) {
      return;
    }
    lastText = text;
    events.push({
      targetTimeSec: chordOsmdLyricTargetTimeSec(measureNumber, beatStartInMeasure, bpm, beatsPerMeasure),
      measureNumber,
      text,
    });
  });
  return events;
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
      labels.set(measureNumber, chord.chord_name);
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

const buildChordOsmdRhythmTargetsFromScore = (
  phrase: EarTrainingPhrase,
  bpm: number,
  beatsPerMeasure: number,
  attacks: readonly ChordOsmdMusicXmlAttack[],
): ChordOsmdRhythmTarget[] => {
  const chords = phrase.chords ?? [];
  const playableMeasures = buildPlayableMeasures(chords);
  const disabledMeasures = buildDisabledMeasures(chords);
  const measureLabels = buildPlayableMeasureLabels(chords);
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
      const timeA = chordOsmdLyricTargetTimeSec(a.measureNumber, a.beatStartInMeasure, bpm, beatsPerMeasure);
      const timeB = chordOsmdLyricTargetTimeSec(b.measureNumber, b.beatStartInMeasure, bpm, beatsPerMeasure);
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
    );
    return {
      id: scoreTargetId(attack.measureNumber, attack.beatStartInMeasure),
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
): ChordOsmdRhythmTarget[] => {
  if (!phrase) {
    return [];
  }

  if (fromScore && attacks && attacks.length > 0) {
    return buildChordOsmdRhythmTargetsFromScore(phrase, bpm, beatsPerMeasure, attacks);
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
    if (
      last
      && chordItemsAreSameTiming(last, item)
    ) {
      if (!last.label.split(' / ').includes(item.chord.chord_name)) {
        last.label = `${last.label} / ${item.chord.chord_name}`;
      }
      counts.forEach((count, midi) => {
        last.mutableCounts.set(midi, (last.mutableCounts.get(midi) ?? 0) + count);
      });
      last.midiCounts = midiCountArray(last.mutableCounts);
      continue;
    }

    targets.push({
      id: item.chord.id,
      label: item.chord.chord_name,
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
