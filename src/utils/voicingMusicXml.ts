interface ParsedVoicingNote {
  step: string;
  alter: number;
  octave: number;
  midi: number;
}

const STEP_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const STEP_ORDER: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};
const SHARP_KEY_SIGNATURE_STEPS: readonly string[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_KEY_SIGNATURE_STEPS: readonly string[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

const NOTE_NAME_PATTERN = /^([A-G])(x|##|#|bb|b|♯|♭)?(-?\d+)$/;

const parseAccidentalAlter = (raw: string | undefined): number => {
  if (!raw) {
    return 0;
  }
  switch (raw) {
    case 'x':
    case '##':
      return 2;
    case '#':
    case '♯':
      return 1;
    case 'b':
    case '♭':
      return -1;
    case 'bb':
      return -2;
    default:
      return 0;
  }
};

export const parseVoicingNoteName = (noteName: string): ParsedVoicingNote => {
  const trimmed = noteName.trim();
  const match = trimmed.match(NOTE_NAME_PATTERN);
  if (!match) {
    throw new Error(`音名 "${noteName}" を解釈できません`);
  }
  const [, step, accidental, octaveText] = match;
  const alter = parseAccidentalAlter(accidental);
  const octave = Number.parseInt(octaveText, 10);
  if (!Number.isFinite(octave)) {
    throw new Error(`音名 "${noteName}" のオクターブ値が不正です`);
  }
  const semitone = STEP_TO_SEMITONE[step];
  const midi = (octave + 1) * 12 + semitone + alter;
  return { step, alter, octave, midi };
};

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const accidentalXmlValue = (alter: number): string => {
  if (alter === 2) {
    return 'double-sharp';
  }
  if (alter === 1) {
    return 'sharp';
  }
  if (alter === -1) {
    return 'flat';
  }
  if (alter === -2) {
    return 'flat-flat';
  }
  return 'natural';
};

/** MusicXML `<accidental>` テキスト（`<pitch><alter>` 欠落時）を半音変位へ。未対応は null。 */
export const musicXmlAccidentalTextToAlter = (accidentalText: string): number | null => {
  switch (accidentalText.trim().toLowerCase()) {
    case 'natural':
      return 0;
    case 'sharp':
      return 1;
    case 'flat':
      return -1;
    case 'double-sharp':
      return 2;
    case 'flat-flat':
    case 'double-flat':
      return -2;
    default:
      return null;
  }
};

const clampKeyFifths = (keyFifths: number): number => (
  Math.max(-7, Math.min(7, Math.trunc(keyFifths)))
);

/** MusicXML `<key><fifths>` と音名 step（C…B）から、その調における変位（半音）を返す。 */
export const musicXmlKeySignatureAlter = (step: string, keyFifths: number): number => {
  const fifths = clampKeyFifths(keyFifths);
  if (fifths > 0) {
    for (let index = 0; index < fifths; index += 1) {
      if (SHARP_KEY_SIGNATURE_STEPS[index] === step) {
        return 1;
      }
    }
    return 0;
  }
  if (fifths < 0) {
    const flatCount = Math.abs(fifths);
    for (let index = 0; index < flatCount; index += 1) {
      if (FLAT_KEY_SIGNATURE_STEPS[index] === step) {
        return -1;
      }
    }
    return 0;
  }
  return 0;
};

interface VoicingNoteWithStaff extends ParsedVoicingNote {
  staff: number;
  noteName: string;
  voicingIndex: number;
}

const compareNotesForDisplay = (a: VoicingNoteWithStaff, b: VoicingNoteWithStaff): number => {
  if (a.staff !== b.staff) {
    return a.staff - b.staff;
  }
  if (a.octave !== b.octave) {
    return a.octave - b.octave;
  }
  const stepDiff = (STEP_ORDER[a.step] ?? 0) - (STEP_ORDER[b.step] ?? 0);
  if (stepDiff !== 0) {
    return stepDiff;
  }
  return a.alter - b.alter;
};

const renderNoteXml = (note: VoicingNoteWithStaff, isChordTone: boolean, keyFifths: number): string => {
  const alterLine = note.alter !== 0 ? `        <alter>${note.alter}</alter>\n` : '';
  const accidentalLine = note.alter !== musicXmlKeySignatureAlter(note.step, keyFifths)
    ? `        <accidental>${accidentalXmlValue(note.alter)}</accidental>`
    : '';
  return [
    '      <note>',
    isChordTone ? '        <chord/>' : '',
    '        <pitch>',
    `          <step>${escapeXml(note.step)}</step>`,
    alterLine ? alterLine.trim() : '',
    `          <octave>${note.octave}</octave>`,
    '        </pitch>',
    '        <duration>4</duration>',
    '        <voice>1</voice>',
    '        <type>whole</type>',
    accidentalLine,
    `        <staff>${note.staff}</staff>`,
    '      </note>',
  ]
    .filter(Boolean)
    .join('\n');
};

const buildStaffNotes = (notes: VoicingNoteWithStaff[], keyFifths: number): string => {
  if (notes.length === 0) {
    return [
      '      <note>',
      '        <rest/>',
      '        <duration>4</duration>',
      '        <voice>1</voice>',
      '        <type>whole</type>',
      '      </note>',
    ].join('\n');
  }
  return notes
    .map((note, index) => renderNoteXml(note, index > 0, keyFifths))
    .join('\n');
};

export interface BuildVoicingMusicXmlOptions {
  voicing: readonly string[];
  voicingStaves: readonly number[];
  keyFifths?: number;
}

export interface BuildVoicingMusicXmlResult {
  xml: string;
  noteOrder: number[];
  noteheadOrder: Array<number | null>;
}

const STAFF_NUMBER_TREBLE = 1;
const STAFF_NUMBER_BASS = 2;

export const buildVoicingMusicXml = (
  options: BuildVoicingMusicXmlOptions,
): BuildVoicingMusicXmlResult => {
  const { voicing, voicingStaves } = options;
  const keyFifths = clampKeyFifths(options.keyFifths ?? 0);
  if (voicing.length !== voicingStaves.length) {
    throw new Error('voicing と voicing_staves は同じ長さである必要があります');
  }
  if (voicing.length === 0) {
    throw new Error('voicing は1音以上必要です');
  }

  const parsed: VoicingNoteWithStaff[] = voicing.map((noteName, index) => {
    const staff = Math.trunc(voicingStaves[index]);
    if (staff !== STAFF_NUMBER_TREBLE && staff !== STAFF_NUMBER_BASS) {
      throw new Error(`voicing_staves の値は 1 または 2 のみ許容します (index=${index})`);
    }
    return {
      ...parseVoicingNoteName(noteName),
      staff,
      noteName,
      voicingIndex: index,
    };
  });

  const trebleNotes = parsed
    .filter(note => note.staff === STAFF_NUMBER_TREBLE)
    .sort(compareNotesForDisplay);
  const bassNotes = parsed
    .filter(note => note.staff === STAFF_NUMBER_BASS)
    .sort(compareNotesForDisplay);

  const noteOrder: number[] = [
    ...trebleNotes.map(note => note.voicingIndex),
    ...bassNotes.map(note => note.voicingIndex),
  ];
  const noteheadOrder: Array<number | null> = [
    ...(trebleNotes.length > 0 ? trebleNotes.map(note => note.voicingIndex) : [null]),
    ...(bassNotes.length > 0 ? bassNotes.map(note => note.voicingIndex) : [null]),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Voicing</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>${keyFifths}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
${buildStaffNotes(trebleNotes, keyFifths)}
      <backup>
        <duration>4</duration>
      </backup>
${buildStaffNotes(bassNotes, keyFifths)}
      <barline location="right">
        <bar-style>light-heavy</bar-style>
      </barline>
    </measure>
  </part>
</score-partwise>
`;

  return { xml, noteOrder, noteheadOrder };
};
