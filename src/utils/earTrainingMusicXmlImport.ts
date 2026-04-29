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
    throw new Error(`${label} はアウフタクトまたは休符開始のため耳コピMVPでは扱えません`);
  }
  if (hasTieStop(firstPitchedNote)) {
    throw new Error(`${label} はループ開始前からタイでつながるため耳コピMVPでは扱えません`);
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
    throw new Error(`${label} は和音を含むため耳コピMVPでは扱えません`);
  }
  if (document.querySelector('backup')) {
    throw new Error(`${label} は複声または複数スタッフを含むため耳コピMVPでは扱えません`);
  }
  if (document.querySelector('note > grace')) {
    throw new Error(`${label} は装飾音符を含むため耳コピMVPでは扱えません`);
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
