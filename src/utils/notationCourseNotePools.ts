/**
 * 「音符の読み方」コース: トピック別出題音プール（唯一の音源）。
 * survival_random_chords / ear_training_chord_quiz_items 生成に使用。
 */
import type { SurvivalLessonRandomChordEntry } from '@/types';
import { Note } from 'tonal';

const parseNoteNameToMidi = (noteName: string): number | null => {
  const midi = Note.midi(noteName.trim());
  return typeof midi === 'number' && Number.isFinite(midi) ? midi : null;
};

export type NotationStaff = 1 | 2;

export interface NotationCourseNoteSpec {
  readonly noteName: string;
  readonly staff: NotationStaff;
  readonly keyFifths?: number;
}

export interface NotationCourseTopicSpec {
  readonly blockNumber: number;
  readonly questKey: string;
  readonly titleJa: string;
  readonly titleEn: string;
  readonly descriptionJa: string;
  readonly descriptionEn: string;
  readonly notes: readonly NotationCourseNoteSpec[];
}

const note = (
  noteName: string,
  staff: NotationStaff,
  keyFifths = 0,
): NotationCourseNoteSpec => ({ noteName, staff, keyFifths });

const treble = (noteName: string, keyFifths = 0): NotationCourseNoteSpec => (
  note(noteName, 1, keyFifths)
);

const bass = (noteName: string, keyFifths = 0): NotationCourseNoteSpec => (
  note(noteName, 2, keyFifths)
);

const uniqNotes = (specs: readonly NotationCourseNoteSpec[]): NotationCourseNoteSpec[] => {
  const seen = new Set<string>();
  const out: NotationCourseNoteSpec[] = [];
  for (const spec of specs) {
    const key = `${spec.noteName}:${spec.staff}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(spec);
  }
  return out;
};

const mergeTopicNotes = (
  topics: readonly NotationCourseTopicSpec[],
): NotationCourseNoteSpec[] => uniqNotes(topics.flatMap(t => [...t.notes]));

export const toRandomChordEntry = (spec: NotationCourseNoteSpec): SurvivalLessonRandomChordEntry => {
  const midi = parseNoteNameToMidi(spec.noteName);
  if (midi === null) {
    throw new Error(`Invalid note name: ${spec.noteName}`);
  }
  return {
    name: spec.noteName,
    voicing: [midi],
    voicingNames: [spec.noteName],
    voicingStaves: [spec.staff],
    keyFifths: spec.keyFifths ?? 0,
  };
};

export const toRandomChordEntries = (
  specs: readonly NotationCourseNoteSpec[],
): SurvivalLessonRandomChordEntry[] => specs.map(toRandomChordEntry);

const block1Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 1,
    questKey: 'q1',
    titleJa: 'ミファソ',
    titleEn: 'E F G',
    descriptionJa: 'ト音記号・五線の中。下から2番目の線（ミ）から、ファ・ソまで読みましょう。',
    descriptionEn: 'Treble clef, notes on the staff. Read E, F, and G from the second line up.',
    notes: [treble('E4'), treble('F4'), treble('G4')],
  },
  {
    blockNumber: 1,
    questKey: 'q2',
    titleJa: 'ソラシ',
    titleEn: 'G A B',
    descriptionJa: 'ト音記号・五線の中。ソ・ラ・シの3音です。',
    descriptionEn: 'Treble clef, notes on the staff: G, A, and B.',
    notes: [treble('G4'), treble('A4'), treble('B4')],
  },
  {
    blockNumber: 1,
    questKey: 'q3',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ト音記号・五線の中。シからレまで読みましょう。',
    descriptionEn: 'Treble clef, notes on the staff: B, C, and D.',
    notes: [treble('B4'), treble('C5'), treble('D5')],
  },
  {
    blockNumber: 1,
    questKey: 'q4',
    titleJa: 'レミファ',
    titleEn: 'D E F',
    descriptionJa: 'ト音記号・五線の中。レ・ミ・ファの3音です。',
    descriptionEn: 'Treble clef, notes on the staff: D, E, and F.',
    notes: [treble('D5'), treble('E5'), treble('F5')],
  },
  {
    blockNumber: 1,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ト音記号・五線の中の音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef notes within the staff.',
    notes: [
      treble('E4'), treble('F4'), treble('G4'), treble('A4'), treble('B4'),
      treble('C5'), treble('D5'), treble('E5'), treble('F5'),
    ],
  },
];

const block2Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 2,
    questKey: 'q1',
    titleJa: 'ソラシ',
    titleEn: 'G A B',
    descriptionJa: 'ト音記号・上加線。五線の上のソ・ラ・シです。',
    descriptionEn: 'Treble clef, upper ledger lines: G, A, and B.',
    notes: [treble('G5'), treble('A5'), treble('B5')],
  },
  {
    blockNumber: 2,
    questKey: 'q2',
    titleJa: 'ラシド',
    titleEn: 'A B C',
    descriptionJa: 'ト音記号・上加線。ラ・シ・ドの3音です。',
    descriptionEn: 'Treble clef, upper ledger lines: A, B, and C.',
    notes: [treble('A5'), treble('B5'), treble('C6')],
  },
  {
    blockNumber: 2,
    questKey: 'q3',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ト音記号・上加線。シ・ド・レを読みましょう。',
    descriptionEn: 'Treble clef, upper ledger lines: B, C, and D.',
    notes: [treble('B5'), treble('C6'), treble('D6')],
  },
  {
    blockNumber: 2,
    questKey: 'q4',
    titleJa: 'ドレミ',
    titleEn: 'C D E',
    descriptionJa: 'ト音記号・上加線。ド・レ・ミの3音です。',
    descriptionEn: 'Treble clef, upper ledger lines: C, D, and E.',
    notes: [treble('C6'), treble('D6'), treble('E6')],
  },
  {
    blockNumber: 2,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ト音記号・上加線の音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef upper-ledger notes.',
    notes: [treble('G5'), treble('A5'), treble('B5'), treble('C6'), treble('D6'), treble('E6')],
  },
];

const block3Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 3,
    questKey: 'q1',
    titleJa: 'ファソラ',
    titleEn: 'F G A',
    descriptionJa: 'ト音記号・下加線。ファ・ソ・ラの3音です。',
    descriptionEn: 'Treble clef, lower ledger lines: F, G, and A.',
    notes: [treble('F3'), treble('G3'), treble('A3')],
  },
  {
    blockNumber: 3,
    questKey: 'q2',
    titleJa: 'ソラシ',
    titleEn: 'G A B',
    descriptionJa: 'ト音記号・下加線。ソ・ラ・シを読みましょう。',
    descriptionEn: 'Treble clef, lower ledger lines: G, A, and B.',
    notes: [treble('G3'), treble('A3'), treble('B3')],
  },
  {
    blockNumber: 3,
    questKey: 'q3',
    titleJa: 'ラシド',
    titleEn: 'A B C',
    descriptionJa: 'ト音記号・下加線。ラ・シ・ド（中央ド）です。',
    descriptionEn: 'Treble clef, lower ledger lines: A, B, and middle C.',
    notes: [treble('A3'), treble('B3'), treble('C4')],
  },
  {
    blockNumber: 3,
    questKey: 'q4',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ト音記号・下加線。シ・ド・レの3音です。',
    descriptionEn: 'Treble clef, lower ledger lines: B, C, and D.',
    notes: [treble('B3'), treble('C4'), treble('D4')],
  },
  {
    blockNumber: 3,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionEn: 'Review all treble-clef lower-ledger notes.',
    descriptionJa: 'ト音記号・下加線の音符をすべて復習します。',
    notes: [treble('F3'), treble('G3'), treble('A3'), treble('B3'), treble('C4'), treble('D4')],
  },
];

const block4Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 4,
    questKey: 'q1',
    titleJa: 'ト音記号 総合まとめ',
    titleEn: 'Treble clef review',
    descriptionJa: '五線の中・上加線・下加線のト音記号音符をすべて復習します。',
    descriptionEn: 'Review all treble-clef notes: staff, upper ledger, and lower ledger.',
    notes: mergeTopicNotes([...block1Topics.slice(0, 4), ...block2Topics.slice(0, 4), ...block3Topics.slice(0, 4)]),
  },
];

const block5Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 5,
    questKey: 'q1',
    titleJa: 'ソラシ',
    titleEn: 'G A B',
    descriptionJa: 'ヘ音記号・五線の中。ソ・ラ・シの3音です。',
    descriptionEn: 'Bass clef, notes on the staff: G, A, and B.',
    notes: [bass('G2'), bass('A2'), bass('B2')],
  },
  {
    blockNumber: 5,
    questKey: 'q2',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ヘ音記号・五線の中。シ・ド・レを読みましょう。',
    descriptionEn: 'Bass clef, notes on the staff: B, C, and D.',
    notes: [bass('B2'), bass('C3'), bass('D3')],
  },
  {
    blockNumber: 5,
    questKey: 'q3',
    titleJa: 'レミファ',
    titleEn: 'D E F',
    descriptionJa: 'ヘ音記号・五線の中。レ・ミ・ファの3音です。',
    descriptionEn: 'Bass clef, notes on the staff: D, E, and F.',
    notes: [bass('D3'), bass('E3'), bass('F3')],
  },
  {
    blockNumber: 5,
    questKey: 'q4',
    titleJa: 'ファソラ',
    titleEn: 'F G A',
    descriptionJa: 'ヘ音記号・五線の中。ファ・ソ・ラを読みましょう。',
    descriptionEn: 'Bass clef, notes on the staff: F, G, and A.',
    notes: [bass('F3'), bass('G3'), bass('A3')],
  },
  {
    blockNumber: 5,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・五線の中の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef notes within the staff.',
    notes: [
      bass('G2'), bass('A2'), bass('B2'), bass('C3'), bass('D3'),
      bass('E3'), bass('F3'), bass('G3'), bass('A3'),
    ],
  },
];

const block6Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 6,
    questKey: 'q1',
    titleJa: 'ラシド',
    titleEn: 'A B C',
    descriptionJa: 'ヘ音記号・下加線。ラ・シ・ドの3音です。',
    descriptionEn: 'Bass clef, lower ledger lines: A, B, and C.',
    notes: [bass('A1'), bass('B1'), bass('C2')],
  },
  {
    blockNumber: 6,
    questKey: 'q2',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ヘ音記号・下加線。シ・ド・レを読みましょう。',
    descriptionEn: 'Bass clef, lower ledger lines: B, C, and D.',
    notes: [bass('B1'), bass('C2'), bass('D2')],
  },
  {
    blockNumber: 6,
    questKey: 'q3',
    titleJa: 'ドレミ',
    titleEn: 'C D E',
    descriptionJa: 'ヘ音記号・下加線。ド・レ・ミの3音です。',
    descriptionEn: 'Bass clef, lower ledger lines: C, D, and E.',
    notes: [bass('C2'), bass('D2'), bass('E2')],
  },
  {
    blockNumber: 6,
    questKey: 'q4',
    titleJa: 'レミファ',
    titleEn: 'D E F',
    descriptionJa: 'ヘ音記号・下加線。レ・ミ・ファを読みましょう。',
    descriptionEn: 'Bass clef, lower ledger lines: D, E, and F.',
    notes: [bass('D2'), bass('E2'), bass('F2')],
  },
  {
    blockNumber: 6,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・下加線の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef lower-ledger notes.',
    notes: [bass('A1'), bass('B1'), bass('C2'), bass('D2'), bass('E2'), bass('F2')],
  },
];

const block7Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 7,
    questKey: 'q1',
    titleJa: 'シドレ',
    titleEn: 'B C D',
    descriptionJa: 'ヘ音記号・上加線。シ・ド・レの3音です。',
    descriptionEn: 'Bass clef, upper ledger lines: B, C, and D.',
    notes: [bass('B3'), bass('C4'), bass('D4')],
  },
  {
    blockNumber: 7,
    questKey: 'q2',
    titleJa: 'ドレミ',
    titleEn: 'C D E',
    descriptionJa: 'ヘ音記号・上加線。中央ドからミまで読みましょう。',
    descriptionEn: 'Bass clef, upper ledger lines: C, D, and E.',
    notes: [bass('C4'), bass('D4'), bass('E4')],
  },
  {
    blockNumber: 7,
    questKey: 'q3',
    titleJa: 'レミファ',
    titleEn: 'D E F',
    descriptionJa: 'ヘ音記号・上加線。レ・ミ・ファの3音です。',
    descriptionEn: 'Bass clef, upper ledger lines: D, E, and F.',
    notes: [bass('D4'), bass('E4'), bass('F4')],
  },
  {
    blockNumber: 7,
    questKey: 'q4',
    titleJa: 'ミファソ',
    titleEn: 'E F G',
    descriptionJa: 'ヘ音記号・上加線。ミ・ファ・ソを読みましょう。',
    descriptionEn: 'Bass clef, upper ledger lines: E, F, and G.',
    notes: [bass('E4'), bass('F4'), bass('G4')],
  },
  {
    blockNumber: 7,
    questKey: 'q5',
    titleJa: 'まとめ（全て）',
    titleEn: 'Review (all)',
    descriptionJa: 'ヘ音記号・上加線の音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef upper-ledger notes.',
    notes: [bass('B3'), bass('C4'), bass('D4'), bass('E4'), bass('F4'), bass('G4')],
  },
];

const block8Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 8,
    questKey: 'q1',
    titleJa: 'ヘ音記号 総合まとめ',
    titleEn: 'Bass clef review',
    descriptionJa: '五線の中・下加線・上加線のヘ音記号音符をすべて復習します。',
    descriptionEn: 'Review all bass-clef notes: staff, lower ledger, and upper ledger.',
    notes: mergeTopicNotes([...block5Topics.slice(0, 4), ...block6Topics.slice(0, 4), ...block7Topics.slice(0, 4)]),
  },
];

const block9Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 9,
    questKey: 'q1',
    titleJa: '大譜表まとめ',
    titleEn: 'Grand staff review',
    descriptionJa: '中央のドを中心に、ト音記号とヘ音記号がランダムに出題されます。',
    descriptionEn: 'Random mix of treble and bass clef notes centered on middle C.',
    notes: [
      bass('A3'), bass('B3'), bass('C4'), bass('D4'),
      treble('C4'), treble('D4'), treble('E4'), treble('F4'),
    ],
  },
];

const trebleStaffSharps: NotationCourseNoteSpec[] = [
  treble('F#4'), treble('G#4'), treble('C#5'), treble('D#5'),
];

const bassStaffSharps: NotationCourseNoteSpec[] = [
  bass('F#2'), bass('G#2'), bass('C#3'), bass('D#3'),
];

const trebleStaffFlats: NotationCourseNoteSpec[] = [
  treble('Bb4'), treble('Eb4'), treble('Ab4'), treble('Db5'),
];

const bassStaffFlats: NotationCourseNoteSpec[] = [
  bass('Bb2'), bass('Eb3'), bass('Ab2'), bass('Db3'),
];

const block10Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 10,
    questKey: 'q1',
    titleJa: '五線の中（ト音）＋♯',
    titleEn: 'Treble staff + sharps',
    descriptionJa: 'ト音記号・五線の中のシャープ（♯）付き音符です。',
    descriptionEn: 'Sharps on the treble staff within the five lines.',
    notes: trebleStaffSharps,
  },
  {
    blockNumber: 10,
    questKey: 'q2',
    titleJa: '五線の中（ヘ音）＋♯',
    titleEn: 'Bass staff + sharps',
    descriptionJa: 'ヘ音記号・五線の中のシャープ（♯）付き音符です。',
    descriptionEn: 'Sharps on the bass staff within the five lines.',
    notes: bassStaffSharps,
  },
  {
    blockNumber: 10,
    questKey: 'q3',
    titleJa: 'まとめ（全て＋♯）',
    titleEn: 'Review (all + sharps)',
    descriptionJa: 'ト音・ヘ音の五線内シャープ音符を復習します。',
    descriptionEn: 'Review all treble and bass sharps within the staff.',
    notes: [...trebleStaffSharps, ...bassStaffSharps],
  },
];

const block11Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 11,
    questKey: 'q1',
    titleJa: '五線の中（ト音）＋♭',
    titleEn: 'Treble staff + flats',
    descriptionJa: 'ト音記号・五線の中のフラット（♭）付き音符です。',
    descriptionEn: 'Flats on the treble staff within the five lines.',
    notes: trebleStaffFlats,
  },
  {
    blockNumber: 11,
    questKey: 'q2',
    titleJa: '五線の中（ヘ音）＋♭',
    titleEn: 'Bass staff + flats',
    descriptionJa: 'ヘ音記号・五線の中のフラット（♭）付き音符です。',
    descriptionEn: 'Flats on the bass staff within the five lines.',
    notes: bassStaffFlats,
  },
  {
    blockNumber: 11,
    questKey: 'q3',
    titleJa: 'まとめ（全て＋♭）',
    titleEn: 'Review (all + flats)',
    descriptionJa: 'ト音・ヘ音の五線内フラット音符を復習します。',
    descriptionEn: 'Review all treble and bass flats within the staff.',
    notes: [...trebleStaffFlats, ...bassStaffFlats],
  },
];

const block12Topics: NotationCourseTopicSpec[] = [
  {
    blockNumber: 12,
    questKey: 'q1',
    titleJa: '総仕上げ（ファイナル）',
    titleEn: 'Final review',
    descriptionJa: 'ト音・ヘ音・上下加線・臨時記号すべてのランダム総復習です。',
    descriptionEn: 'Final random review: treble, bass, ledger lines, and accidentals.',
    notes: uniqNotes([
      ...mergeTopicNotes([...block1Topics.slice(0, 4), ...block2Topics.slice(0, 4), ...block3Topics.slice(0, 4)]),
      ...mergeTopicNotes([...block5Topics.slice(0, 4), ...block6Topics.slice(0, 4), ...block7Topics.slice(0, 4)]),
      ...block9Topics[0].notes,
      ...trebleStaffSharps,
      ...bassStaffSharps,
      ...trebleStaffFlats,
      ...bassStaffFlats,
    ]),
  },
];

export const NOTATION_COURSE_BLOCK_META: Readonly<
  Record<number, { blockNameJa: string; blockNameEn: string; blockDescriptionJa: string; blockDescriptionEn: string }>
> = {
  1: {
    blockNameJa: '五線の中の音符（ト音記号）',
    blockNameEn: 'Treble clef: notes on the staff',
    blockDescriptionJa: 'ト音記号の五線の中の音符を、3音ずつ覚えていきます。',
    blockDescriptionEn: 'Learn treble-clef notes on the staff, three at a time.',
  },
  2: {
    blockNameJa: '五線の上加線（ト音記号）',
    blockNameEn: 'Treble clef: upper ledger lines',
    blockDescriptionJa: '五線の上にある加線の音符を読みましょう。',
    blockDescriptionEn: 'Read notes on upper ledger lines above the treble staff.',
  },
  3: {
    blockNameJa: '五線の下加線（ト音記号）',
    blockNameEn: 'Treble clef: lower ledger lines',
    blockDescriptionJa: '五線の下にある加線の音符を読みましょう。',
    blockDescriptionEn: 'Read notes on lower ledger lines below the treble staff.',
  },
  4: {
    blockNameJa: 'ト音記号 総合まとめ',
    blockNameEn: 'Treble clef review',
    blockDescriptionJa: 'ト音記号の五線・上加線・下加線を総復習します。',
    blockDescriptionEn: 'Review all treble-clef staff and ledger-line notes.',
  },
  5: {
    blockNameJa: '五線の中の音符（ヘ音記号）',
    blockNameEn: 'Bass clef: notes on the staff',
    blockDescriptionJa: 'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。',
    blockDescriptionEn: 'Learn bass-clef notes on the staff, three at a time.',
  },
  6: {
    blockNameJa: '五線の下加線（ヘ音記号）',
    blockNameEn: 'Bass clef: lower ledger lines',
    blockDescriptionJa: 'ヘ音記号・五線の下の加線音符を読みましょう。',
    blockDescriptionEn: 'Read notes on lower ledger lines below the bass staff.',
  },
  7: {
    blockNameJa: '五線の上加線（ヘ音記号）',
    blockNameEn: 'Bass clef: upper ledger lines',
    blockDescriptionJa: 'ヘ音記号・五線の上の加線音符を読みましょう。',
    blockDescriptionEn: 'Read notes on upper ledger lines above the bass staff.',
  },
  8: {
    blockNameJa: 'ヘ音記号 総合まとめ',
    blockNameEn: 'Bass clef review',
    blockDescriptionJa: 'ヘ音記号の五線・下加線・上加線を総復習します。',
    blockDescriptionEn: 'Review all bass-clef staff and ledger-line notes.',
  },
  9: {
    blockNameJa: '大譜表まとめ',
    blockNameEn: 'Grand staff review',
    blockDescriptionJa: '中央のドを中心にト音とヘ音が混ざって出題されます。',
    blockDescriptionEn: 'Mixed treble and bass clef notes centered on middle C.',
  },
  10: {
    blockNameJa: '臨時記号（シャープ ♯）',
    blockNameEn: 'Accidentals: sharps',
    blockDescriptionJa: '五線の中のシャープ（♯）付き音符を読みましょう。',
    blockDescriptionEn: 'Read sharps on the treble and bass staves.',
  },
  11: {
    blockNameJa: '臨時記号（フラット ♭）',
    blockNameEn: 'Accidentals: flats',
    blockDescriptionJa: '五線の中のフラット（♭）付き音符を読みましょう。',
    blockDescriptionEn: 'Read flats on the treble and bass staves.',
  },
  12: {
    blockNameJa: '総仕上げ（ファイナル）',
    blockNameEn: 'Final review',
    blockDescriptionJa: 'これまで学んだすべての音符をランダムに総復習します。',
    blockDescriptionEn: 'Final random review of every note you have learned.',
  },
};

export const NOTATION_COURSE_TOPICS_BY_BLOCK: Readonly<Record<number, readonly NotationCourseTopicSpec[]>> = {
  1: block1Topics,
  2: block2Topics,
  3: block3Topics,
  4: block4Topics,
  5: block5Topics,
  6: block6Topics,
  7: block7Topics,
  8: block8Topics,
  9: block9Topics,
  10: block10Topics,
  11: block11Topics,
  12: block12Topics,
};

export const NOTATION_COURSE_ALL_TOPICS: readonly NotationCourseTopicSpec[] = [
  ...block1Topics,
  ...block2Topics,
  ...block3Topics,
  ...block4Topics,
  ...block5Topics,
  ...block6Topics,
  ...block7Topics,
  ...block8Topics,
  ...block9Topics,
  ...block10Topics,
  ...block11Topics,
  ...block12Topics,
];

export const getNotationCourseTopicsForBlocks = (
  blockNumbers: readonly number[],
): NotationCourseTopicSpec[] => blockNumbers.flatMap(bn => [...(NOTATION_COURSE_TOPICS_BY_BLOCK[bn] ?? [])]);

export const getTopicLessonKey = (topic: NotationCourseTopicSpec): string => (
  `b${topic.blockNumber}-${topic.questKey}`
);

export const getTopicLowestMidi = (topic: NotationCourseTopicSpec): number => {
  const midis = topic.notes.map(n => parseNoteNameToMidi(n.noteName)).filter((m): m is number => m !== null);
  return midis.length > 0 ? Math.min(...midis) : Number.POSITIVE_INFINITY;
};

export const assertTopicsOrderedByLowestNote = (
  topics: readonly NotationCourseTopicSpec[],
): void => {
  for (let i = 1; i < topics.length; i += 1) {
    const prev = getTopicLowestMidi(topics[i - 1]);
    const curr = getTopicLowestMidi(topics[i]);
    if (curr < prev) {
      throw new Error(
        `Topic order violation at index ${i}: ${topics[i].titleJa} (${curr}) before ${topics[i - 1].titleJa} (${prev})`,
      );
    }
  }
};
