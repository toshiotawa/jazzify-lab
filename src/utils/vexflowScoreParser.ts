import { log } from '@/utils/logger';

export type ClefType = 'treble' | 'bass';

export interface TimeSignature {
  beats: number;
  beatType: number;
}

export interface ParsedNoteKey {
  step: string;
  alter: number;
  octave: number;
}

export interface ParsedNote {
  keys: ParsedNoteKey[];
  duration: string;
  dots: number;
  isRest: boolean;
  tieStart: boolean;
  tieStop: boolean;
  voice: string;
}

export interface ParsedMeasure {
  measureNumber: number;
  timeSignature: TimeSignature;
  keySignature: string;
  clef: ClefType;
  notes: ParsedNote[];
}

export interface ParsedScore {
  measures: ParsedMeasure[];
  defaults: {
    clef: ClefType;
    keySignature: string;
    timeSignature: TimeSignature;
  };
}

const DEFAULT_TIME_SIGNATURE: TimeSignature = { beats: 4, beatType: 4 };
const DEFAULT_KEY = 'C';
const DEFAULT_CLEF: ClefType = 'treble';

const DURATION_MAP: Record<string, string> = {
  '1024th': '1024',
  '512th': '512',
  '256th': '256',
  '128th': '128',
  '64th': '64',
  '32nd': '32',
  '16th': '16',
  eighth: '8',
  quarter: 'q',
  half: 'h',
  whole: 'w',
  breve: '1',
  long: '1',
};

const CLEF_MAP: Record<string, ClefType> = {
  G: 'treble',
  F: 'bass',
};

const SHARP_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const FLAT_KEYS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

export function parseMusicXmlForVexflow(musicXml: string): ParsedScore | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(musicXml, 'application/xml');

    if (doc.querySelector('parsererror')) {
      log.error('MusicXMLの解析に失敗しました: parsererror要素が含まれています');
      return null;
    }

    const part = doc.querySelector('part');
    if (!part) {
      log.warn('MusicXMLにpart要素が存在しません');
      return null;
    }

    const measures = Array.from(part.querySelectorAll('measure'));
    if (measures.length === 0) {
      log.warn('MusicXMLにmeasure要素が存在しません');
      return null;
    }

    let currentClef: ClefType = DEFAULT_CLEF;
    let currentKey = DEFAULT_KEY;
    let currentTimeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE;

    const parsedMeasures: ParsedMeasure[] = measures.map((measure, index) => {
      const measureNumber = Number.parseInt(measure.getAttribute('number') ?? `${index + 1}`, 10);
      const attributes = measure.querySelector('attributes');

      if (attributes) {
        const clefSign = attributes.querySelector('clef sign')?.textContent;
        if (clefSign && CLEF_MAP[clefSign]) {
          currentClef = CLEF_MAP[clefSign];
        }

        const beats = Number.parseInt(attributes.querySelector('time beats')?.textContent ?? '', 10);
        const beatType = Number.parseInt(attributes.querySelector('time beat-type')?.textContent ?? '', 10);
        if (!Number.isNaN(beats) && !Number.isNaN(beatType)) {
          currentTimeSignature = { beats, beatType };
        }

        const fifthsText = attributes.querySelector('key fifths')?.textContent;
        if (fifthsText !== undefined && fifthsText !== null) {
          const fifths = Number.parseInt(fifthsText, 10);
          if (!Number.isNaN(fifths)) {
            currentKey = mapFifthsToKey(fifths, attributes.querySelector('key mode')?.textContent);
          }
        }
      }

      const notes = parseMeasureNotes(measure);

      return {
        measureNumber,
        timeSignature: currentTimeSignature,
        keySignature: currentKey,
        clef: currentClef,
        notes,
      };
    });

    return {
      measures: parsedMeasures,
      defaults: {
        clef: parsedMeasures[0]?.clef ?? DEFAULT_CLEF,
        keySignature: parsedMeasures[0]?.keySignature ?? DEFAULT_KEY,
        timeSignature: parsedMeasures[0]?.timeSignature ?? DEFAULT_TIME_SIGNATURE,
      },
    };
  } catch (error) {
    log.error('MusicXML解析中に予期せぬエラーが発生しました', error);
    return null;
  }
}

function parseMeasureNotes(measure: Element): ParsedNote[] {
  const parsedNotes: ParsedNote[] = [];
  let lastNote: ParsedNote | null = null;

  const noteElements = Array.from(measure.querySelectorAll('note'));
  noteElements.forEach((noteElement) => {
    const isRest = Boolean(noteElement.querySelector('rest'));
    const isChord = Boolean(noteElement.querySelector('chord'));
    const dots = noteElement.querySelectorAll('dot').length;
    const typeText = noteElement.querySelector('type')?.textContent ?? 'quarter';
    const duration = mapDuration(typeText);
    const voice = noteElement.querySelector('voice')?.textContent ?? '1';

    const tieElements = Array.from(noteElement.querySelectorAll('tie'));
    const tieStart = tieElements.some((tie) => tie.getAttribute('type') === 'start');
    const tieStop = tieElements.some((tie) => tie.getAttribute('type') === 'stop');

    const keys = extractKeysForNote(noteElement, isRest);

    if (isChord && lastNote && !lastNote.isRest) {
      if (keys.length > 0) {
        lastNote.keys.push(...keys);
      }
      lastNote.tieStart = lastNote.tieStart || tieStart;
      lastNote.tieStop = lastNote.tieStop || tieStop;
      lastNote.dots = Math.max(lastNote.dots, dots);
    } else {
      const parsedNote: ParsedNote = {
        keys: keys.length > 0 ? keys : [{ step: 'b', alter: 0, octave: 4 }],
        duration,
        dots,
        isRest,
        tieStart,
        tieStop,
        voice,
      };
      parsedNotes.push(parsedNote);
      lastNote = parsedNote;
    }
  });

  return parsedNotes;
}

function extractKeysForNote(noteElement: Element, isRest: boolean): ParsedNoteKey[] {
  if (isRest) {
    return [];
  }

  const pitch = noteElement.querySelector('pitch');
  if (!pitch) {
    return [];
  }

  const step = pitch.querySelector('step')?.textContent ?? 'C';
  const alter = Number.parseInt(pitch.querySelector('alter')?.textContent ?? '0', 10);
  const octave = Number.parseInt(pitch.querySelector('octave')?.textContent ?? '4', 10);

  return [{
    step,
    alter: Number.isNaN(alter) ? 0 : alter,
    octave: Number.isNaN(octave) ? 4 : octave,
  }];
}

function mapDuration(typeText: string): string {
  const duration = DURATION_MAP[typeText] ?? 'q';
  if (!DURATION_MAP[typeText]) {
    log.debug(`未対応の音価 "${typeText}" を検出したため、デフォルトのquarterを使用します`);
  }
  return duration;
}

function mapFifthsToKey(fifths: number, modeText?: string | null): string {
  if (fifths === 0) {
    return modeText === 'minor' ? 'Am' : 'C';
  }

  if (fifths > 0) {
    const key = SHARP_KEYS[fifths] ?? 'C';
    return modeText === 'minor' ? `${convertMajorToRelativeMinor(key)}` : key;
  }

  const index = Math.abs(fifths);
  const key = FLAT_KEYS[index] ?? 'C';
  return modeText === 'minor' ? `${convertMajorToRelativeMinor(key)}` : key;
}

function convertMajorToRelativeMinor(majorKey: string): string {
  const relativeMinorMap: Record<string, string> = {
    C: 'Am',
    G: 'Em',
    D: 'Bm',
    A: 'F#m',
    E: 'C#m',
    B: 'G#m',
    'F#': 'D#m',
    'C#': 'A#m',
    F: 'Dm',
    Bb: 'Gm',
    Eb: 'Cm',
    Ab: 'Fm',
    Db: 'Bbm',
    Gb: 'Ebm',
    Cb: 'Abm',
  };

  return relativeMinorMap[majorKey] ?? 'Am';
}
