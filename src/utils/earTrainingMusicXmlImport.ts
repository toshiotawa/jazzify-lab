import type { EarTrainingPhraseChord, EarTrainingPhraseNote } from '@/types';
import { midiToPitchClass } from '@/utils/earTrainingEngine';
import { parseMusicXmlToNoteData } from '@/utils/musicXmlToNotes';
import { truncateMusicXmlByMeasureRange } from '@/utils/songRangeFilter';

type EarTrainingPhraseNoteImport = Omit<EarTrainingPhraseNote, 'id' | 'phrase_id' | 'created_at'>;
type EarTrainingPhraseChordImport = Omit<EarTrainingPhraseChord, 'id' | 'phrase_id' | 'created_at'>;

export interface EarTrainingMusicXmlPhraseRange {
  orderIndex: number;
  startMeasure: number;
  endMeasure: number;
}

export interface EarTrainingMusicXmlPreview {
  totalMeasures: number;
  phraseCount: number;
  ranges: EarTrainingMusicXmlPhraseRange[];
}

export interface EarTrainingMusicXmlPhraseDraft extends EarTrainingMusicXmlPhraseRange {
  musicXmlText: string;
  notes: EarTrainingPhraseNoteImport[];
  chords: EarTrainingPhraseChordImport[];
  noteCount: number;
}

export interface BuildEarTrainingPhraseDraftsOptions {
  phraseMeasures: number;
  bpm: number;
  beatsPerMeasure: number;
}

interface EarTrainingMusicXmlValidationOptions {
  label?: string;
  beatsPerMeasure?: number;
  beatType?: number;
}

const roundToMillis = (value: number): number => Math.round(value * 1000) / 1000;

const scaleNullableSeconds = (value: number | null | undefined, scale: number): number | null =>
  value === null || value === undefined ? null : roundToMillis(value * scale);

const parseXml = (xmlText: string): Document => {
  const document = new DOMParser().parseFromString(xmlText, 'application/xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) {
    throw new Error('MusicXMLの解析に失敗しました');
  }
  return document;
};

const getNumberFromText = (element: Element, selector: string, fallback: number): number => {
  const parsed = Number(element.querySelector(selector)?.textContent ?? '');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isPitchedNote = (note: Element): boolean =>
  note.querySelector('pitch') !== null && note.querySelector('rest') === null;

const isGraceNote = (note: Element): boolean => note.querySelector('grace') !== null;

const hasTieStop = (note: Element): boolean =>
  Array.from(note.querySelectorAll('tie, tied'))
    .some(tie => tie.getAttribute('type') === 'stop');

const getDurationDivisions = (element: Element): number => {
  const duration = Number(element.querySelector('duration')?.textContent ?? '0');
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

const validatePhraseStart = (
  document: Document,
  label: string,
  fallbackBeatsPerMeasure: number,
  fallbackBeatType: number,
): void => {
  const firstMeasure = document.querySelector('part:first-of-type > measure');
  if (!firstMeasure) {
    throw new Error(`${label} に小節が見つかりません`);
  }

  const divisions = getNumberFromText(firstMeasure, 'attributes > divisions', 1);
  const beatsPerMeasure = getNumberFromText(firstMeasure, 'attributes > time > beats', fallbackBeatsPerMeasure);
  const beatType = getNumberFromText(firstMeasure, 'attributes > time > beat-type', fallbackBeatType);
  const expectedMeasureDivisions = divisions * beatsPerMeasure * (4 / beatType);
  let positionDivisions = 0;
  let firstNotePositionDivisions: number | null = null;
  let firstPitchedNote: Element | null = null;

  for (const child of Array.from(firstMeasure.children)) {
    if (child.tagName === 'forward') {
      positionDivisions += getDurationDivisions(child);
      continue;
    }
    if (child.tagName !== 'note') {
      continue;
    }
    if (isGraceNote(child)) {
      continue;
    }

    const noteStartsAt = positionDivisions;
    const duration = getDurationDivisions(child);
    if (isPitchedNote(child) && !firstPitchedNote) {
      firstPitchedNote = child;
      firstNotePositionDivisions = noteStartsAt;
    }
    if (child.querySelector('chord') === null) {
      positionDivisions += duration;
    }
  }

  if (!firstPitchedNote) {
    throw new Error(`${label} の先頭小節に判定ノートがありません`);
  }
  if (firstNotePositionDivisions !== 0) {
    throw new Error(`${label} はアウフタクトまたは休符開始のためバトルモードMVPでは扱えません`);
  }
  if (hasTieStop(firstPitchedNote)) {
    throw new Error(`${label} はループ開始前からタイでつながるためバトルモードMVPでは扱えません`);
  }
  if (Math.abs(positionDivisions - expectedMeasureDivisions) > 0.001) {
    throw new Error(`${label} の先頭小節が不完全です。アウフタクトは禁止です`);
  }
};

const validateEarTrainingMusicXmlMvpConstraints = (
  xmlText: string,
  options: EarTrainingMusicXmlValidationOptions = {},
): void => {
  const document = parseXml(xmlText);
  const label = options.label ?? 'MusicXML';
  const parts = Array.from(document.querySelectorAll('part'));
  if (parts.length !== 1) {
    throw new Error(`${label} は単一パートのMusicXMLのみ対応しています`);
  }
  if (document.querySelector('note > chord')) {
    throw new Error(`${label} は和音を含むためバトルモードMVPでは扱えません`);
  }
  if (document.querySelector('backup')) {
    throw new Error(`${label} は複声または複数スタッフを含むためバトルモードMVPでは扱えません`);
  }
  if (document.querySelector('note > grace')) {
    throw new Error(`${label} は装飾音符を含むためバトルモードMVPでは扱えません`);
  }

  const voices = new Set<string>();
  const staves = new Set<string>();
  Array.from(document.querySelectorAll('note')).forEach(note => {
    if (!isPitchedNote(note)) {
      return;
    }
    voices.add(note.querySelector('voice')?.textContent?.trim() || '1');
    const staff = note.querySelector('staff')?.textContent?.trim();
    if (staff) {
      staves.add(staff);
    }
  });
  if (voices.size > 1 || staves.size > 1) {
    throw new Error(`${label} は単旋律のみ対応しています`);
  }

  validatePhraseStart(
    document,
    label,
    options.beatsPerMeasure ?? 4,
    options.beatType ?? 4,
  );
};

const getMeasureNumbers = (xmlText: string): number[] => {
  const document = parseXml(xmlText);
  const measures = Array.from(document.querySelectorAll('part:first-of-type > measure'));
  if (measures.length === 0) {
    throw new Error('MusicXMLに小節が見つかりません');
  }

  return measures.map((measure, index) => {
    const parsed = Number(measure.getAttribute('number'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1;
  });
};

export const createEarTrainingMusicXmlPreview = (
  xmlText: string,
  phraseMeasures: number,
): EarTrainingMusicXmlPreview => {
  if (!Number.isInteger(phraseMeasures) || phraseMeasures <= 0) {
    throw new Error('1フレーズの小節数は1以上の整数で入力してください');
  }

  const measureNumbers = getMeasureNumbers(xmlText);
  validateEarTrainingMusicXmlMvpConstraints(xmlText);
  const ranges: EarTrainingMusicXmlPhraseRange[] = [];
  for (let index = 0; index < measureNumbers.length; index += phraseMeasures) {
    const rangeMeasures = measureNumbers.slice(index, index + phraseMeasures);
    const startMeasure = rangeMeasures[0];
    const endMeasure = rangeMeasures[rangeMeasures.length - 1];
    ranges.push({
      orderIndex: ranges.length,
      startMeasure,
      endMeasure,
    });
  }

  return {
    totalMeasures: measureNumbers.length,
    phraseCount: ranges.length,
    ranges,
  };
};

export const validateEarTrainingImportFileCount = (
  preview: EarTrainingMusicXmlPreview,
  audioFileCount: number,
): void => {
  if (audioFileCount !== preview.phraseCount) {
    throw new Error(`mp3ファイル数は${preview.phraseCount}個必要です`);
  }
};

const toEarTrainingNotes = (
  phraseXml: string,
  bpm: number,
  beatsPerMeasure: number,
): EarTrainingPhraseNoteImport[] => {
  const beatDurationSec = 60 / bpm;
  return parseMusicXmlToNoteData(phraseXml)
    .sort((a, b) => a.time - b.time || a.pitch - b.pitch)
    .map((note, index) => {
      const totalBeats = note.time / beatDurationSec;
      const measureNumber = Math.floor(totalBeats / beatsPerMeasure) + 1;
      const beatOffset = roundToMillis((totalBeats % beatsPerMeasure) + 1);
      const noteName = note.noteName?.trim() || `MIDI${note.pitch}`;

      return {
        note_index: index,
        pitch_midi: note.pitch,
        pitch_class: midiToPitchClass(note.pitch),
        note_name: noteName,
        octave: Math.floor(note.pitch / 12) - 1,
        measure_number: measureNumber,
        beat_offset: beatOffset,
        tied_from_previous: false,
      };
    });
};

const stepAlterToName = (step: string, alter: number): string => {
  if (alter > 0) {
    return `${step}${'#'.repeat(alter)}`;
  }
  if (alter < 0) {
    return `${step}${'b'.repeat(Math.abs(alter))}`;
  }
  return step;
};

const getHarmonyName = (harmony: Element): string => {
  const rootStep = harmony.querySelector('root > root-step')?.textContent?.trim() || 'C';
  const rootAlter = Number(harmony.querySelector('root > root-alter')?.textContent ?? '0');
  const kindText = harmony.querySelector('kind')?.getAttribute('text')
    || harmony.querySelector('kind')?.textContent?.trim()
    || '';
  const bassStep = harmony.querySelector('bass > bass-step')?.textContent?.trim();
  const bassAlter = Number(harmony.querySelector('bass > bass-alter')?.textContent ?? '0');
  const rootName = stepAlterToName(rootStep, Number.isFinite(rootAlter) ? rootAlter : 0);

  if (!bassStep) {
    return `${rootName}${kindText}`.trim();
  }

  const bassName = stepAlterToName(bassStep, Number.isFinite(bassAlter) ? bassAlter : 0);
  return `${rootName}${kindText}/${bassName}`.trim();
};

const toEarTrainingChords = (
  phraseXml: string,
  bpm: number,
  defaultBeatsPerMeasure: number,
): EarTrainingPhraseChordImport[] => {
  const document = parseXml(phraseXml);
  const measures = Array.from(document.querySelectorAll('part:first-of-type > measure'));
  const chords: Array<EarTrainingPhraseChordImport & { totalBeatPosition: number }> = [];
  let divisionsPerQuarter = 1;
  let beatsPerMeasure = defaultBeatsPerMeasure;
  let beatType = 4;
  let cumulativeBeatPosition = 0;

  measures.forEach((measure, measureIndex) => {
    const divisionsEl = measure.querySelector('attributes > divisions');
    if (divisionsEl?.textContent) {
      const parsed = Number(divisionsEl.textContent);
      if (Number.isFinite(parsed) && parsed > 0) {
        divisionsPerQuarter = parsed;
      }
    }

    const timeEl = measure.querySelector('attributes > time');
    if (timeEl) {
      const parsedBeats = Number(timeEl.querySelector('beats')?.textContent);
      const parsedBeatType = Number(timeEl.querySelector('beat-type')?.textContent);
      if (Number.isFinite(parsedBeats) && parsedBeats > 0) {
        beatsPerMeasure = parsedBeats;
      }
      if (Number.isFinite(parsedBeatType) && parsedBeatType > 0) {
        beatType = parsedBeatType;
      }
    }

    let positionDivisions = 0;
    const measureQuarterBeats = (beatsPerMeasure / beatType) * 4;
    for (const child of Array.from(measure.children)) {
      if (child.tagName === 'harmony') {
        const beatOffset = roundToMillis(1 + positionDivisions / divisionsPerQuarter);
        const totalBeatPosition = cumulativeBeatPosition + (beatOffset - 1);
        chords.push({
          order_index: chords.length,
          chord_name: getHarmonyName(child),
          measure_number: measureIndex + 1,
          beat_offset: beatOffset,
          duration_beats: null,
          start_time_sec: roundToMillis(totalBeatPosition * (60 / bpm)),
          end_time_sec: null,
          totalBeatPosition,
        });
        continue;
      }

      if (child.tagName === 'backup') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions -= Number.isFinite(duration) ? duration : 0;
        continue;
      }

      if (child.tagName === 'forward') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions += Number.isFinite(duration) ? duration : 0;
        continue;
      }

      if (child.tagName !== 'note') {
        continue;
      }

      const isChordTone = child.querySelector('chord') !== null;
      if (!isChordTone) {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions += Number.isFinite(duration) ? duration : 0;
      }
    }

    if (measureQuarterBeats > 0) {
      cumulativeBeatPosition += measureQuarterBeats;
    }
  });

  const phraseTotalBeats = cumulativeBeatPosition > 0
    ? cumulativeBeatPosition
    : measures.length * defaultBeatsPerMeasure;
  return chords.map((chord, index) => {
    const nextBeatPosition = chords[index + 1]?.totalBeatPosition ?? phraseTotalBeats;
    const durationBeats = Math.max(0, nextBeatPosition - chord.totalBeatPosition);
    return {
      order_index: chord.order_index,
      chord_name: chord.chord_name,
      measure_number: chord.measure_number,
      beat_offset: chord.beat_offset,
      duration_beats: roundToMillis(durationBeats),
      start_time_sec: chord.start_time_sec,
      end_time_sec: roundToMillis((chord.totalBeatPosition + durationBeats) * (60 / bpm)),
    };
  });
};

export const scaleEarTrainingPhraseChordTimings = (
  chords: EarTrainingPhraseChordImport[],
  targetLoopDurationSec: number,
  sourceLoopDurationSec?: number,
): EarTrainingPhraseChordImport[] => {
  const inferredSourceLoopDurationSec = chords.reduce((maxEndSec, chord) => {
    const endTimeSec = chord.end_time_sec;
    if (endTimeSec === null || endTimeSec === undefined || !Number.isFinite(endTimeSec)) {
      return maxEndSec;
    }
    return Math.max(maxEndSec, endTimeSec);
  }, 0);
  const resolvedSourceLoopDurationSec = sourceLoopDurationSec ?? inferredSourceLoopDurationSec;

  if (
    chords.length === 0
    || !Number.isFinite(targetLoopDurationSec)
    || targetLoopDurationSec <= 0
    || !Number.isFinite(resolvedSourceLoopDurationSec)
    || resolvedSourceLoopDurationSec <= 0
  ) {
    return chords;
  }

  const timingScale = targetLoopDurationSec / resolvedSourceLoopDurationSec;
  return chords.map(chord => ({
    ...chord,
    start_time_sec: scaleNullableSeconds(chord.start_time_sec, timingScale),
    end_time_sec: scaleNullableSeconds(chord.end_time_sec, timingScale),
  }));
};

export const buildEarTrainingPhraseDraftsFromMusicXml = (
  xmlText: string,
  options: BuildEarTrainingPhraseDraftsOptions,
): EarTrainingMusicXmlPhraseDraft[] => {
  const preview = createEarTrainingMusicXmlPreview(xmlText, options.phraseMeasures);

  return preview.ranges.map(range => {
    const musicXmlText = truncateMusicXmlByMeasureRange(xmlText, range.startMeasure, range.endMeasure);
    validateEarTrainingMusicXmlMvpConstraints(musicXmlText, {
      label: `Phrase ${range.orderIndex + 1}`,
      beatsPerMeasure: options.beatsPerMeasure,
      beatType: 4,
    });
    const notes = toEarTrainingNotes(musicXmlText, options.bpm, options.beatsPerMeasure);
    if (notes.length === 0) {
      throw new Error(`Phrase ${range.orderIndex + 1} に判定ノートがありません`);
    }
    if (notes.length < 2) {
      throw new Error(`Phrase ${range.orderIndex + 1} のノート数は2以上にしてください`);
    }
    if (notes.length > 32) {
      throw new Error(`Phrase ${range.orderIndex + 1} のノート数が32を超えています`);
    }

    return {
      ...range,
      musicXmlText,
      notes,
      chords: toEarTrainingChords(musicXmlText, options.bpm, options.beatsPerMeasure),
      noteCount: notes.length,
    };
  });
};

// ---------------------------------------------------------------------------
// Chord-voicing battle mode helpers
// ---------------------------------------------------------------------------

export interface EarTrainingPhraseChordVoicingImport extends EarTrainingPhraseChordImport {
  voicing: string[];
  voicing_staves: number[];
}

export interface EarTrainingChordVoicingPhraseDraft extends EarTrainingMusicXmlPhraseRange {
  musicXmlText: string;
  chords: EarTrainingPhraseChordVoicingImport[];
}

export interface EarTrainingChordVoicingMusicXmlPreview extends EarTrainingMusicXmlPreview {
  hasMultipleStaves: boolean;
}

export interface BuildEarTrainingChordVoicingDraftsOptions {
  phraseMeasures: number;
  bpm: number;
  beatsPerMeasure: number;
  /** true のとき voicing 音が無い harmony も空 voicing 行として取り込む（休符小節のコード記号） */
  allowRestOnlyHarmonies?: boolean;
}

interface MusicXmlVoicingNoteRecord {
  startBeat: number;
  endBeat: number;
  step: string;
  alter: number;
  octave: number;
  staff: number;
  noteName: string;
  measureNumber: number;
}

interface MusicXmlHarmonyRecord {
  startBeat: number;
  measureNumber: number;
  beatOffset: number;
  chordName: string;
}

const stepAlterToVoicingName = (step: string, alter: number, octave: number): string => {
  if (alter > 1) {
    return `${step}x${octave}`;
  }
  if (alter === 1) {
    return `${step}#${octave}`;
  }
  if (alter === -1) {
    return `${step}b${octave}`;
  }
  if (alter < -1) {
    return `${step}bb${octave}`;
  }
  return `${step}${octave}`;
};

const stepToSemitone = (step: string): number => {
  switch (step.toUpperCase()) {
    case 'C': return 0;
    case 'D': return 2;
    case 'E': return 4;
    case 'F': return 5;
    case 'G': return 7;
    case 'A': return 9;
    case 'B': return 11;
    default: return 0;
  }
};

const calculateMidi = (step: string, alter: number, octave: number): number =>
  (octave + 1) * 12 + stepToSemitone(step) + alter;

const validateChordVoicingMusicXml = (xmlText: string, label: string): void => {
  const document = parseXml(xmlText);
  const parts = Array.from(document.querySelectorAll('part'));
  if (parts.length !== 1) {
    throw new Error(`${label} は単一パートのMusicXMLのみ対応しています`);
  }
  if (document.querySelector('note > grace')) {
    throw new Error(`${label} は装飾音符を含むためコード演奏バトルでは扱えません`);
  }
};

const detectHasMultipleStaves = (document: Document): boolean => {
  const staves = new Set<string>();
  Array.from(document.querySelectorAll('part:first-of-type note')).forEach(note => {
    if (!isPitchedNote(note)) {
      return;
    }
    const staff = note.querySelector('staff')?.textContent?.trim();
    if (staff) {
      staves.add(staff);
    }
  });
  return staves.size > 1;
};

const collectChordVoicingMusicXmlEntries = (
  xmlText: string,
  bpm: number,
  defaultBeatsPerMeasure: number,
): {
  notes: MusicXmlVoicingNoteRecord[];
  harmonies: MusicXmlHarmonyRecord[];
  totalBeats: number;
  hasMultipleStaves: boolean;
} => {
  const document = parseXml(xmlText);
  const measures = Array.from(document.querySelectorAll('part:first-of-type > measure'));
  const notes: MusicXmlVoicingNoteRecord[] = [];
  const harmonies: MusicXmlHarmonyRecord[] = [];
  let divisionsPerQuarter = 1;
  let beatsPerMeasure = defaultBeatsPerMeasure;
  let beatType = 4;
  let cumulativeBeatPosition = 0;

  measures.forEach((measure, measureIndex) => {
    const divisionsEl = measure.querySelector('attributes > divisions');
    if (divisionsEl?.textContent) {
      const parsed = Number(divisionsEl.textContent);
      if (Number.isFinite(parsed) && parsed > 0) {
        divisionsPerQuarter = parsed;
      }
    }
    const timeEl = measure.querySelector('attributes > time');
    if (timeEl) {
      const parsedBeats = Number(timeEl.querySelector('beats')?.textContent);
      const parsedBeatType = Number(timeEl.querySelector('beat-type')?.textContent);
      if (Number.isFinite(parsedBeats) && parsedBeats > 0) {
        beatsPerMeasure = parsedBeats;
      }
      if (Number.isFinite(parsedBeatType) && parsedBeatType > 0) {
        beatType = parsedBeatType;
      }
    }

    const measureQuarterBeats = (beatsPerMeasure / beatType) * 4;
    let positionDivisions = 0;
    let lastNoteStartDivisions = 0;

    for (const child of Array.from(measure.children)) {
      if (child.tagName === 'harmony') {
        const beatOffset = roundToMillis(1 + positionDivisions / divisionsPerQuarter);
        const startBeat = cumulativeBeatPosition + (beatOffset - 1);
        harmonies.push({
          startBeat,
          measureNumber: measureIndex + 1,
          beatOffset,
          chordName: getHarmonyName(child),
        });
        continue;
      }
      if (child.tagName === 'backup') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions -= Number.isFinite(duration) ? duration : 0;
        continue;
      }
      if (child.tagName === 'forward') {
        const duration = Number(child.querySelector('duration')?.textContent ?? '0');
        positionDivisions += Number.isFinite(duration) ? duration : 0;
        continue;
      }
      if (child.tagName !== 'note') {
        continue;
      }
      if (isGraceNote(child)) {
        continue;
      }

      const isChordTone = child.querySelector('chord') !== null;
      const noteStartDivisions = isChordTone ? lastNoteStartDivisions : positionDivisions;
      const duration = Number(child.querySelector('duration')?.textContent ?? '0');

      if (isPitchedNote(child)) {
        const step = child.querySelector('pitch > step')?.textContent?.trim() ?? 'C';
        const alterText = child.querySelector('pitch > alter')?.textContent?.trim();
        const alter = alterText ? Number(alterText) : 0;
        const octaveText = child.querySelector('pitch > octave')?.textContent?.trim();
        const octave = octaveText ? Number(octaveText) : 4;
        const staffText = child.querySelector('staff')?.textContent?.trim();
        const staff = staffText ? Number(staffText) : 1;
        const startBeat = cumulativeBeatPosition + noteStartDivisions / divisionsPerQuarter;
        const endBeat = startBeat + (Number.isFinite(duration) && duration > 0 ? duration / divisionsPerQuarter : 0);

        notes.push({
          startBeat,
          endBeat,
          step,
          alter,
          octave,
          staff: staff === 2 ? 2 : 1,
          noteName: stepAlterToVoicingName(step, alter, octave),
          measureNumber: measureIndex + 1,
        });
      }

      if (!isChordTone) {
        lastNoteStartDivisions = noteStartDivisions;
        positionDivisions += Number.isFinite(duration) ? duration : 0;
      }
    }

    if (measureQuarterBeats > 0) {
      cumulativeBeatPosition += measureQuarterBeats;
    }
  });

  void bpm;
  return {
    notes,
    harmonies,
    totalBeats: cumulativeBeatPosition,
    hasMultipleStaves: detectHasMultipleStaves(document),
  };
};

const CHORD_VOICING_BEAT_EPSILON = 1e-6;

interface HarmonyVoicingTimingGroup {
  startBeat: number;
  voicing: string[];
  voicing_staves: number[];
}

interface CollectedHarmonyVoicingTimingGroup {
  startBeat: number;
  seenKeys: Set<string>;
  notes: {
    name: string;
    staff: number;
    midi: number;
  }[];
}

const resolveMeasurePositionFromBeat = (
  totalBeatPosition: number,
  beatsPerMeasure: number,
): { measureNumber: number; beatOffset: number } => {
  if (!Number.isFinite(beatsPerMeasure) || beatsPerMeasure <= 0) {
    return {
      measureNumber: 1,
      beatOffset: roundToMillis(totalBeatPosition + 1),
    };
  }
  return {
    measureNumber: Math.floor(totalBeatPosition / beatsPerMeasure) + 1,
    beatOffset: roundToMillis((totalBeatPosition % beatsPerMeasure) + 1),
  };
};

const buildVoicingTimingGroupsForHarmonyRange = (
  notes: MusicXmlVoicingNoteRecord[],
  startBeat: number,
  endBeat: number,
): HarmonyVoicingTimingGroup[] => {
  const groups: CollectedHarmonyVoicingTimingGroup[] = [];
  for (const note of notes) {
    const startsInRange = note.startBeat >= startBeat - CHORD_VOICING_BEAT_EPSILON
      && note.startBeat < endBeat - CHORD_VOICING_BEAT_EPSILON;
    if (!startsInRange) {
      continue;
    }
    let group = groups.find(item => Math.abs(item.startBeat - note.startBeat) <= CHORD_VOICING_BEAT_EPSILON);
    if (!group) {
      group = {
        startBeat: note.startBeat,
        seenKeys: new Set<string>(),
        notes: [],
      };
      groups.push(group);
    }
    const key = `${note.staff}|${note.step}|${note.alter}|${note.octave}`;
    if (group.seenKeys.has(key)) {
      continue;
    }
    group.seenKeys.add(key);
    group.notes.push({
      name: note.noteName,
      staff: note.staff,
      midi: calculateMidi(note.step, note.alter, note.octave),
    });
  }
  return groups
    .sort((a, b) => a.startBeat - b.startBeat)
    .map(group => {
      const sortedNotes = [...group.notes].sort((a, b) => {
        if (a.staff !== b.staff) {
          return a.staff - b.staff;
        }
        return a.midi - b.midi;
      });
      return {
        startBeat: group.startBeat,
        voicing: sortedNotes.map(item => item.name),
        voicing_staves: sortedNotes.map(item => item.staff),
      };
    });
};

export const createEarTrainingChordVoicingMusicXmlPreview = (
  xmlText: string,
  phraseMeasures: number,
): EarTrainingChordVoicingMusicXmlPreview => {
  if (!Number.isInteger(phraseMeasures) || phraseMeasures <= 0) {
    throw new Error('1フレーズの小節数は1以上の整数で入力してください');
  }
  const measureNumbers = getMeasureNumbers(xmlText);
  validateChordVoicingMusicXml(xmlText, 'MusicXML');
  const document = parseXml(xmlText);
  const ranges: EarTrainingMusicXmlPhraseRange[] = [];
  for (let index = 0; index < measureNumbers.length; index += phraseMeasures) {
    const rangeMeasures = measureNumbers.slice(index, index + phraseMeasures);
    ranges.push({
      orderIndex: ranges.length,
      startMeasure: rangeMeasures[0],
      endMeasure: rangeMeasures[rangeMeasures.length - 1],
    });
  }
  return {
    totalMeasures: measureNumbers.length,
    phraseCount: ranges.length,
    ranges,
    hasMultipleStaves: detectHasMultipleStaves(document),
  };
};

export const buildEarTrainingChordVoicingDraftsFromMusicXml = (
  xmlText: string,
  options: BuildEarTrainingChordVoicingDraftsOptions,
): EarTrainingChordVoicingPhraseDraft[] => {
  const preview = createEarTrainingChordVoicingMusicXmlPreview(xmlText, options.phraseMeasures);
  const drafts: EarTrainingChordVoicingPhraseDraft[] = [];

  preview.ranges.forEach(range => {
    const musicXmlText = truncateMusicXmlByMeasureRange(xmlText, range.startMeasure, range.endMeasure);
    validateChordVoicingMusicXml(musicXmlText, `Phrase ${range.orderIndex + 1}`);
    const { notes, harmonies, totalBeats } = collectChordVoicingMusicXmlEntries(
      musicXmlText,
      options.bpm,
      options.beatsPerMeasure,
    );
    if (harmonies.length === 0) {
      throw new Error(`Phrase ${range.orderIndex + 1} に harmony 要素がありません`);
    }
    const phraseTotalBeats = totalBeats > 0 ? totalBeats : harmonies.length * options.beatsPerMeasure;
    const beatDurationSec = 60 / options.bpm;

    const chords: EarTrainingPhraseChordVoicingImport[] = [];
    harmonies.forEach((harmony, index) => {
      const nextStartBeat = harmonies[index + 1]?.startBeat ?? phraseTotalBeats;
      const endTimeSec = roundToMillis(nextStartBeat * beatDurationSec);
      const voicingGroups = buildVoicingTimingGroupsForHarmonyRange(notes, harmony.startBeat, nextStartBeat);
      if (voicingGroups.length === 0) {
        if (!options.allowRestOnlyHarmonies) {
          throw new Error(`Phrase ${range.orderIndex + 1} の Chord ${index + 1} (${harmony.chordName}) に voicing がありません`);
        }
        const measurePosition = resolveMeasurePositionFromBeat(harmony.startBeat, options.beatsPerMeasure);
        chords.push({
          order_index: chords.length,
          chord_name: harmony.chordName,
          measure_number: measurePosition.measureNumber,
          beat_offset: measurePosition.beatOffset,
          duration_beats: roundToMillis(Math.max(0, nextStartBeat - harmony.startBeat)),
          start_time_sec: roundToMillis(harmony.startBeat * beatDurationSec),
          end_time_sec: endTimeSec,
          voicing: [],
          voicing_staves: [],
        });
        return;
      }
      voicingGroups.forEach(group => {
        const measurePosition = resolveMeasurePositionFromBeat(group.startBeat, options.beatsPerMeasure);
        chords.push({
          order_index: chords.length,
          chord_name: harmony.chordName,
          measure_number: measurePosition.measureNumber,
          beat_offset: measurePosition.beatOffset,
          duration_beats: roundToMillis(Math.max(0, nextStartBeat - group.startBeat)),
          start_time_sec: roundToMillis(group.startBeat * beatDurationSec),
          end_time_sec: endTimeSec,
          voicing: group.voicing,
          voicing_staves: group.voicing_staves,
        });
      });
    });

    drafts.push({
      ...range,
      musicXmlText,
      chords,
    });
  });

  return drafts;
};
