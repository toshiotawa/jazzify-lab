import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import './bravuraClefFont.css';
import './chordVoicingStaffEffects.css';

export interface ChordVoicingStaffGroup {
  id: string;
  chordName: string;
  voicing: readonly string[];
  voicingStaves?: readonly number[] | null;
  correctPitchClasses?: readonly number[];
  tiedFromPreviousVoicingIndices?: readonly number[];
  measureOffset?: 0 | 1;
  isActive?: boolean;
  isRest?: boolean;
}

export interface ChordVoicingCompletionPulse {
  groupId: string;
  kind: 'voicingPartial' | 'harmonyComplete';
  eventKey: number;
}

interface ChordVoicingStaffProps {
  voicing?: readonly string[];
  voicingStaves?: readonly number[] | null;
  chordName?: string;
  keyFifths?: number;
  correctPitchClasses?: readonly number[];
  voicingGroups?: readonly ChordVoicingStaffGroup[];
  activeGroupId?: string | null;
  correctPitchClassesByGroupId?: ReadonlyMap<string, readonly number[]>;
  /** 親が算出した密集レイアウト。未指定時は measureOffset===0 のグループの合計音数で推論 */
  denseCurrentMeasureLayout?: boolean;
  /** 完成エフェクトのワンショット指示。groupId が現在小節（measureOffset===0）に存在しない場合は無視 */
  completionPulse?: ChordVoicingCompletionPulse | null;
  /** false のとき、次ガイド色・三角・コード名強調など「入力許可」を示す強調のみ抑止する */
  showTargetHints?: boolean;
  /** 1 小節のみ表示。中央バーラインを廃し第 1 小節を右端まで広げる（既定: 2 小節）。 */
  singleMeasureLayout?: boolean;
  /** コード名ラベル帯と上部余白を畳む（既定: false）。 */
  hideChordLabels?: boolean;
  /**
   * 1 和弦・単一小節向けに五線横幅を縮める。単位譜のみのため `singleMeasureLayout` を内部で許容済みとして扱う。
   */
  compactSingleMeasure?: boolean;
  className?: string;
}

interface PositionedVoicingNote {
  note: ParsedVoicingNoteWithStaff;
  yCenter: number;
  xOffset: number;
  accidentalColumn: number;
}

interface ParsedVoicingNoteWithStaff {
  step: string;
  alter: number;
  octave: number;
  midi: number;
  staff: StaffNumber;
  degree: number;
  pitchClass: number;
  voicingIndex: number;
  displayAccidentalAlter: number | null;
  tiedFromPrevious: boolean;
}

interface StaffLayoutMetrics {
  measureDividerX: number;
  measureOneNoteLeftX: number;
  measureOneNoteRightX: number;
  measureTwoNoteLeftX: number;
  measureTwoNoteRightX: number;
}

interface ParsedVoicingStaffGroup {
  id: string;
  chordName: string;
  notes: ParsedVoicingNoteWithStaff[];
  measureOffset: 0 | 1;
  slotIndex: number;
  slotCount: number;
  legacyIsActive: boolean;
  isRest: boolean;
}

interface KeySignatureMark {
  alter: number;
  degree: number;
}

type StaffNumber = 1 | 2;

const NOTATION_COLOR = '#ffffff';
const CORRECT_NOTATION_COLOR = '#22c55e';
/** 未正解ガイド（次ノートの楕円ストロークとマーカー）マリンゴールド */
const NEXT_TARGET_COLOR = '#f39800';
const TOP_POINTER_COLOR = '#f39800';
const ACTIVE_CHORD_LABEL_COLOR = '#facc15';
const SP = 10;
const STAFF_WIDTH = 720;
const STAFF_LINE_LEFT_X = 24;
const STAFF_LINE_RIGHT_X = 696;
/** viewBox 右端は五線終端よりやや広い（従来座標との互換） */
const VIEWBOX_EDGE_PAD_X = STAFF_WIDTH - STAFF_LINE_RIGHT_X;
const STAFF_LINE_THICKNESS = Math.max(1, SP * 0.1);
const STAFF_HEIGHT = SP * 4;
/** 上下五線の縦オフセット。ト音譜の下端〜ヘ音譜の上端のあいだの余白（ト／ヘの離間）。 */
const STAFF_TOP_STEP = STAFF_HEIGHT + SP * 12;
/** 上下加線3本ぶん（+0.5SP の安全マージン込み）の余白。要望1。 */
const LEDGER_LINE_PADDING = SP * 3.5;
const CLEF_FONT_SIZE = SP * 4;
/** SMuFL: gClef / fClef（https://www.w3.org/2021/03/smufl14/tables/clefs.html） */
const SMUFL_G_CLEF = '\uE050';
const SMUFL_F_CLEF = '\uE062';
const SMUFL_ACCIDENTAL_FLAT = '\uE260';
const SMUFL_ACCIDENTAL_NATURAL = '\uE261';
const SMUFL_ACCIDENTAL_SHARP = '\uE262';
const SMUFL_ACCIDENTAL_DOUBLE_SHARP = '\uE263';
const SMUFL_ACCIDENTAL_DOUBLE_FLAT = '\uE264';
const TREBLE_REFERENCE_DEGREE = 4 * 7 + 6;
const BASS_REFERENCE_DEGREE = 3 * 7 + 1;
const STEP_ORDER: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};
const EMPTY_STAVES: readonly number[] = [];
const EMPTY_PITCH_CLASSES: readonly number[] = [];
const EMPTY_TIED_INDICES: readonly number[] = [];
const EMPTY_GROUPS: readonly ChordVoicingStaffGroup[] = [];
const EMPTY_CORRECT_PITCH_CLASS_MAP = new Map<string, readonly number[]>();
const MEASURE_ONE_NOTE_LEFT_X = 138;
const KEY_SIGNATURE_LEFT_X = 88;
const KEY_SIGNATURE_GAP_X = SP * 1.05;
const ACCIDENTAL_FONT_SIZE = SP * 2.9;
const PARSED_NOTE_CACHE_LIMIT = 96;
/** 現在小節の同一ハーモニー内の横並びヴォイシング合計がこれ以上なら密集レイアウト（親と共有） */
export const CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD = 5;
const DENSE_CURRENT_MEASURE_RATIO = 0.9;
const SHARP_KEY_SIGNATURE_STEPS: readonly string[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_KEY_SIGNATURE_STEPS: readonly string[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

const REFERENCE_DEGREE_BY_STAFF: Record<StaffNumber, number> = {
  1: TREBLE_REFERENCE_DEGREE,
  2: BASS_REFERENCE_DEGREE,
};

const KEY_SIGNATURE_MARKS: Record<StaffNumber, { sharps: number[]; flats: number[] }> = {
  1: {
    sharps: [
      5 * 7 + 3,
      5 * 7 + 0,
      5 * 7 + 4,
      5 * 7 + 1,
      4 * 7 + 5,
      5 * 7 + 2,
      4 * 7 + 6,
    ],
    flats: [
      4 * 7 + 6,
      5 * 7 + 2,
      4 * 7 + 5,
      5 * 7 + 1,
      4 * 7 + 4,
      5 * 7 + 0,
      4 * 7 + 3,
    ],
  },
  2: {
    sharps: [
      3 * 7 + 3,
      3 * 7 + 0,
      3 * 7 + 4,
      3 * 7 + 1,
      2 * 7 + 5,
      3 * 7 + 2,
      2 * 7 + 6,
    ],
    flats: [
      2 * 7 + 6,
      3 * 7 + 2,
      2 * 7 + 5,
      3 * 7 + 1,
      2 * 7 + 4,
      3 * 7 + 0,
      2 * 7 + 3,
    ],
  },
};

const clampKeyFifths = (keyFifths: number): number => (
  Math.max(-7, Math.min(7, Math.trunc(keyFifths)))
);

const degreeForNote = (step: string, octave: number): number => (
  octave * 7 + (STEP_ORDER[step] ?? 0)
);

const yForDegree = (staffTopY: number, staff: StaffNumber, degree: number): number => {
  const middleLineY = staffTopY + SP * 2;
  return middleLineY - (degree - REFERENCE_DEGREE_BY_STAFF[staff]) * (SP / 2);
};

const accidentalGlyph = (alter: number): string => {
  if (alter === 2) {
    return SMUFL_ACCIDENTAL_DOUBLE_SHARP;
  }
  if (alter === 1) {
    return SMUFL_ACCIDENTAL_SHARP;
  }
  if (alter === -1) {
    return SMUFL_ACCIDENTAL_FLAT;
  }
  if (alter === -2) {
    return SMUFL_ACCIDENTAL_DOUBLE_FLAT;
  }
  if (alter === 0) {
    return SMUFL_ACCIDENTAL_NATURAL;
  }
  return '';
};

const keySignatureAlter = (step: string, keyFifths: number): number => {
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

/** 単一和弦コンパクト表示用の五線終端 X（調号〜転回和弦クラスタぶん）。 */
function compactChordStaffLineRightX(keyFifths: number): number {
  const fifthsAbs = Math.abs(clampKeyFifths(keyFifths));
  const keySignatureEndX = fifthsAbs > 0
    ? KEY_SIGNATURE_LEFT_X + (fifthsAbs - 1) * KEY_SIGNATURE_GAP_X + ACCIDENTAL_FONT_SIZE * 0.4
    : KEY_SIGNATURE_LEFT_X;
  const measureOneNoteLeftX = Math.max(MEASURE_ONE_NOTE_LEFT_X, keySignatureEndX + SP * 3.1);
  const chordClusterReserve = SP * 16;
  const barlineMargin = SP * 2;
  return Math.ceil(measureOneNoteLeftX + chordClusterReserve + barlineMargin);
}

const getStaffLayoutMetrics = (
  keyFifths: number,
  wideFirstMeasure: boolean,
  singleMeasureLayout: boolean,
  staffLineRightX: number,
): StaffLayoutMetrics => {
  const fifths = Math.abs(clampKeyFifths(keyFifths));
  const keySignatureEndX = fifths > 0
    ? KEY_SIGNATURE_LEFT_X + (fifths - 1) * KEY_SIGNATURE_GAP_X + ACCIDENTAL_FONT_SIZE * 0.4
    : KEY_SIGNATURE_LEFT_X;
  const staffMidX = (STAFF_LINE_LEFT_X + staffLineRightX) / 2;
  const dividerX = singleMeasureLayout
    ? staffLineRightX
    : wideFirstMeasure
      ? STAFF_LINE_LEFT_X + (staffLineRightX - STAFF_LINE_LEFT_X) * DENSE_CURRENT_MEASURE_RATIO
      : staffMidX;
  const measureOneNoteLeftX = Math.max(MEASURE_ONE_NOTE_LEFT_X, keySignatureEndX + SP * 3.1);

  return {
    measureDividerX: dividerX,
    measureOneNoteLeftX,
    measureOneNoteRightX: Math.max(measureOneNoteLeftX + SP * 3, dividerX - SP * 2.5),
    measureTwoNoteLeftX: Math.min(dividerX + SP * 2.1, staffLineRightX - SP * 2.2),
    measureTwoNoteRightX: staffLineRightX - SP * 2.5,
  };
};

const keySignatureMarks = (staff: StaffNumber, keyFifths: number): KeySignatureMark[] => {
  const fifths = clampKeyFifths(keyFifths);
  if (fifths === 0) {
    return [];
  }
  const alter = fifths > 0 ? 1 : -1;
  const degrees = fifths > 0
    ? KEY_SIGNATURE_MARKS[staff].sharps.slice(0, fifths)
    : KEY_SIGNATURE_MARKS[staff].flats.slice(0, Math.abs(fifths));
  return degrees.map(degree => ({ alter, degree }));
};

const parseNotes = (
  voicing: readonly string[],
  voicingStaves: readonly number[],
  tiedFromPreviousVoicingIndices: readonly number[],
): ParsedVoicingNoteWithStaff[] => {
  const shouldInferStaves = voicingStaves.length === 0;
  if (!shouldInferStaves && voicing.length !== voicingStaves.length) {
    throw new Error('voicing と voicing_staves は同じ長さである必要があります');
  }
  const tiedIndexSet = new Set(tiedFromPreviousVoicingIndices);
  return voicing.map((noteName, index) => {
    const parsed = parseVoicingNoteName(noteName);
    const inferredStaff: StaffNumber = parsed.midi < 60 ? 2 : 1;
    const staff = shouldInferStaves ? inferredStaff : Math.trunc(voicingStaves[index]);
    if (staff !== 1 && staff !== 2) {
      throw new Error(`voicing_staves の値は 1 または 2 のみ許容します (index=${index})`);
    }
    return {
      ...parsed,
      staff,
      degree: degreeForNote(parsed.step, parsed.octave),
      pitchClass: ((parsed.midi % 12) + 12) % 12,
      voicingIndex: index,
      displayAccidentalAlter: null,
      tiedFromPrevious: tiedIndexSet.has(index),
    };
  });
};

const parsedNoteCacheKey = (
  voicing: readonly string[],
  voicingStaves: readonly number[],
  tiedFromPreviousVoicingIndices: readonly number[],
): string => [
  voicing.join(','),
  voicingStaves.join(','),
  tiedFromPreviousVoicingIndices.join(','),
].join('|');

const parseNotesWithCache = (
  cache: Map<string, ParsedVoicingNoteWithStaff[]>,
  voicing: readonly string[],
  voicingStaves: readonly number[],
  tiedFromPreviousVoicingIndices: readonly number[],
): ParsedVoicingNoteWithStaff[] => {
  const cacheKey = parsedNoteCacheKey(voicing, voicingStaves, tiedFromPreviousVoicingIndices);
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const parsed = parseNotes(voicing, voicingStaves, tiedFromPreviousVoicingIndices);
  cache.set(cacheKey, parsed);
  if (cache.size > PARSED_NOTE_CACHE_LIMIT) {
    const firstKey = cache.keys().next().value;
    if (typeof firstKey === 'string') {
      cache.delete(firstKey);
    }
  }
  return parsed;
};

const accidentalStateKey = (note: ParsedVoicingNoteWithStaff): string => (
  `${note.staff}:${note.step}:${note.octave}`
);

const applyRequiredAccidentals = (
  groups: readonly ParsedVoicingStaffGroup[],
  keyFifths: number,
): ParsedVoicingStaffGroup[] => {
  const groupsByMeasure = new Map<0 | 1, ParsedVoicingStaffGroup[]>();
  groups.forEach(group => {
    const measureGroups = groupsByMeasure.get(group.measureOffset) ?? [];
    measureGroups.push(group);
    groupsByMeasure.set(group.measureOffset, measureGroups);
  });

  const nextGroupsById = new Map<string, ParsedVoicingStaffGroup>();
  ([0, 1] as const).forEach(measureOffset => {
    const measureGroups = groupsByMeasure.get(measureOffset) ?? [];
    const accidentalState = new Map<string, number>();
    measureGroups
      .slice()
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .forEach(group => {
        const updatedNotes = group.notes.map(note => {
          const currentAlter = accidentalState.get(accidentalStateKey(note)) ?? keySignatureAlter(note.step, keyFifths);
          const displayAccidentalAlter = !note.tiedFromPrevious && currentAlter !== note.alter
            ? note.alter
            : null;
          return {
            ...note,
            displayAccidentalAlter,
          };
        });

        group.notes.forEach(note => {
          accidentalState.set(accidentalStateKey(note), note.alter);
        });
        nextGroupsById.set(group.id, {
          ...group,
          notes: updatedNotes,
        });
      });
  });

  return groups.map(group => nextGroupsById.get(group.id) ?? group);
};

const compareNotesForDisplay = (
  a: ParsedVoicingNoteWithStaff,
  b: ParsedVoicingNoteWithStaff,
): number => {
  if (a.degree !== b.degree) {
    return a.degree - b.degree;
  }
  if (a.alter !== b.alter) {
    return a.alter - b.alter;
  }
  return a.voicingIndex - b.voicingIndex;
};

const layoutNotes = (
  notes: readonly ParsedVoicingNoteWithStaff[],
  staffTopY: number,
  baseX: number,
): PositionedVoicingNote[] => {
  if (notes.length === 0) {
    return [];
  }

  const sortedNotes = [...notes].sort(compareNotesForDisplay);
  const noteWidth = SP * 1.45;
  const adjacentOffset = noteWidth * 0.5;
  const offsets = Array.from({ length: sortedNotes.length }, () => 0);

  let clusterStart = 0;
  for (let index = 1; index <= sortedNotes.length; index += 1) {
    const shouldBreak = index === sortedNotes.length
      || sortedNotes[index].degree - sortedNotes[index - 1].degree > 1;
    if (shouldBreak) {
      const clusterCount = index - clusterStart;
      if (clusterCount > 1) {
        for (let noteIndex = clusterStart; noteIndex < index; noteIndex += 1) {
          offsets[noteIndex] = (noteIndex - clusterStart) % 2 === 0
            ? -adjacentOffset
            : adjacentOffset;
        }
      }
      clusterStart = index;
    }
  }

  const yCenters = sortedNotes.map(note => yForDegree(staffTopY, note.staff, note.degree));
  const accidentalColumns = Array.from({ length: sortedNotes.length }, () => 0);
  const occupiedColumnY: number[] = [];
  const accidentalCollisionHeight = SP * 1.15;
  const accidentalIndices = sortedNotes
    .map((note, index) => ({ note, index }))
    .filter(item => item.note.displayAccidentalAlter !== null)
    .sort((a, b) => yCenters[a.index] - yCenters[b.index]);

  accidentalIndices.forEach(({ index }) => {
    let column = 0;
    while (
      column < occupiedColumnY.length
      && Math.abs(occupiedColumnY[column] - yCenters[index]) < accidentalCollisionHeight
    ) {
      column += 1;
    }
    if (column === occupiedColumnY.length) {
      occupiedColumnY.push(yCenters[index]);
    } else {
      occupiedColumnY[column] = yCenters[index];
    }
    accidentalColumns[index] = column;
  });

  const noteWidthForAcc = SP * 1.45;
  const sortedAcc = [...accidentalIndices].sort((a, b) => {
    const ax = baseX + offsets[a.index];
    const bx = baseX + offsets[b.index];
    if (ax !== bx) {
      return ax - bx;
    }
    return yCenters[a.index] - yCenters[b.index];
  });
  sortedAcc.forEach(({ index: idx }) => {
    let col = accidentalColumns[idx];
    for (const { index: prev } of sortedAcc) {
      if (prev === idx) {
        break;
      }
      if (Math.abs(yCenters[prev] - yCenters[idx]) >= accidentalCollisionHeight) {
        continue;
      }
      if (Math.abs((baseX + offsets[prev]) - (baseX + offsets[idx])) >= noteWidthForAcc * 1.3) {
        continue;
      }
      col = Math.max(col, accidentalColumns[prev] + 1);
    }
    accidentalColumns[idx] = col;
  });

  return sortedNotes.map((note, index) => ({
    note,
    yCenter: yCenters[index],
    xOffset: offsets[index],
    accidentalColumn: accidentalColumns[index],
  }));
};

const CLEF_LEFT_X = STAFF_LINE_LEFT_X + SP * 0.8;

const StaffClefGlyph: React.FC<{
  staff: StaffNumber;
  staffTopY: number;
  showAnchorDebug: boolean;
  staffLineRightX: number;
  clefFontsLoaded: boolean;
}> = ({ staff, staffTopY, showAnchorDebug, staffLineRightX, clefFontsLoaded }) => {
  const anchorLineY = staff === 1 ? staffTopY + 3 * SP : staffTopY + SP;
  const glyph = staff === 1 ? SMUFL_G_CLEF : SMUFL_F_CLEF;

  return (
    <g data-staff-clef={staff}>
      {showAnchorDebug ? (
        <g aria-hidden>
          <line
            x1={STAFF_LINE_LEFT_X}
            x2={staffLineRightX}
            y1={anchorLineY}
            y2={anchorLineY}
            stroke="#ef4444"
            strokeWidth={1}
          />
          <circle cx={CLEF_LEFT_X} cy={anchorLineY} fill="#ef4444" r={4} />
        </g>
      ) : null}
      {clefFontsLoaded ? (
        <text
          dominantBaseline="alphabetic"
          fill={NOTATION_COLOR}
          fontFamily="Bravura, serif"
          fontSize={CLEF_FONT_SIZE}
          textAnchor="start"
          x={CLEF_LEFT_X}
          y={anchorLineY}
        >
          {glyph}
        </text>
      ) : null}
    </g>
  );
};

const StaffLines: React.FC<{
  staff: StaffNumber;
  topY: number;
  staffLineRightX: number;
}> = ({ staff, topY, staffLineRightX }) => (
  <g>
    {Array.from({ length: 5 }, (_, line) => {
      const y = topY + line * SP;
      return (
        <line
          key={line}
          data-staff-line={line}
          data-staff-number={staff}
          x1={STAFF_LINE_LEFT_X}
          x2={staffLineRightX}
          y1={y}
          y2={y}
          stroke={NOTATION_COLOR}
          strokeLinecap="round"
          strokeWidth={STAFF_LINE_THICKNESS}
        />
      );
    })}
  </g>
);

const WholeRest: React.FC<{
  groupId: string;
  baseX: number;
  staffTopY: number;
  color: string;
}> = ({ groupId, baseX, staffTopY, color }) => (
  <rect
    data-whole-rest-group-id={groupId}
    x={baseX - SP * 0.72}
    y={staffTopY + SP + STAFF_LINE_THICKNESS}
    width={SP * 1.44}
    height={SP * 0.5}
    rx={1}
    fill={color}
  />
);

const LedgerLines: React.FC<{
  xCenter: number;
  yCenter: number;
  staffTopY: number;
  noteWidth: number;
}> = ({ xCenter, yCenter, staffTopY, noteWidth }) => {
  const topLineY = staffTopY;
  const bottomLineY = staffTopY + STAFF_HEIGHT;
  const noteHeight = SP * 0.86;
  const noteTop = yCenter - noteHeight / 2;
  const noteBottom = yCenter + noteHeight / 2;
  const ledgerLineYs: number[] = [];

  if (yCenter < topLineY) {
    for (let y = topLineY - SP; y >= noteTop - 0.05; y -= SP) {
      ledgerLineYs.push(y);
    }
  }
  if (yCenter > bottomLineY) {
    for (let y = bottomLineY + SP; y <= noteBottom + 0.05; y += SP) {
      ledgerLineYs.push(y);
    }
  }

  return (
    <g data-voicing-ledger-lines="true">
      {ledgerLineYs.map(y => (
        <line
          key={y}
          x1={xCenter - noteWidth / 2 - SP * 0.4}
          x2={xCenter + noteWidth / 2 + SP * 0.4}
          y1={y}
          y2={y}
          stroke={NOTATION_COLOR}
          strokeLinecap="round"
          strokeWidth={STAFF_LINE_THICKNESS}
        />
      ))}
    </g>
  );
};

const WholeNote: React.FC<{
  groupId: string;
  positioned: PositionedVoicingNote;
  baseX: number;
  staffTopY: number;
  isCorrect: boolean;
  isNextHint: boolean;
  clefFontsLoaded: boolean;
}> = ({
  groupId,
  positioned,
  baseX,
  staffTopY,
  isCorrect,
  isNextHint,
  clefFontsLoaded,
}) => {
  const noteWidth = SP * 1.45;
  const noteHeight = SP * 0.86;
  const xCenter = baseX + positioned.xOffset;
  const accidental = positioned.note.displayAccidentalAlter === null
    ? ''
    : accidentalGlyph(positioned.note.displayAccidentalAlter);
  const notationColor = isCorrect
    ? CORRECT_NOTATION_COLOR
    : isNextHint
      ? NEXT_TARGET_COLOR
      : NOTATION_COLOR;
  const accidentalX = Math.min(
    xCenter - noteWidth * 1.15,
    baseX - noteWidth * 1.25 - positioned.accidentalColumn * SP * 0.95,
  );

  return (
    <g>
      {clefFontsLoaded && accidental ? (
        <text
          data-accidental-group-id={groupId}
          data-accidental-voicing-index={positioned.note.voicingIndex}
          data-voicing-pitch-class={positioned.note.pitchClass}
          x={accidentalX}
          y={positioned.yCenter}
          dominantBaseline="central"
          fill={notationColor}
          fontFamily="Bravura, serif"
          fontSize={ACCIDENTAL_FONT_SIZE}
          textAnchor="middle"
        >
          {accidental}
        </text>
      ) : null}
      <ellipse
        data-next-voicing-hint={isNextHint ? 'true' : undefined}
        data-voicing-group-id={groupId}
        data-voicing-index={positioned.note.voicingIndex}
        data-voicing-pitch-class={positioned.note.pitchClass}
        cx={xCenter}
        cy={positioned.yCenter}
        fill="none"
        rx={noteWidth / 2}
        ry={noteHeight / 2}
        stroke={notationColor}
        strokeWidth="2.8"
        transform={`rotate(-18 ${xCenter} ${positioned.yCenter})`}
      />
      <LedgerLines
        xCenter={xCenter}
        yCenter={positioned.yCenter}
        staffTopY={staffTopY}
        noteWidth={noteWidth}
      />
    </g>
  );
};

const getVoicingGroupBaseX = (
  group: ParsedVoicingStaffGroup,
  layout: StaffLayoutMetrics,
): number => {
  const left = group.measureOffset === 0 ? layout.measureOneNoteLeftX : layout.measureTwoNoteLeftX;
  const right = group.measureOffset === 0 ? layout.measureOneNoteRightX : layout.measureTwoNoteRightX;
  const slotWidth = (right - left) / Math.max(1, group.slotCount);
  return left + slotWidth * (group.slotIndex + 0.5);
};

/** 計算済みコード名ラベル（座標は viewBox 内の論理 px） */
interface ChordLabelFrame {
  groupId: string;
  chordName: string;
  x: number;
  fontSize: number;
  fill: string;
}

interface StaffSystemVerticalLayout {
  firstStaffTopY: number;
  labelCenterY: number;
  svgHeight: number;
  chordLabels: readonly ChordLabelFrame[];
}

export const estimateChordNameWidthPx = (chordName: string, fontSize: number): number => {
  let w = 0;
  for (const ch of chordName) {
    if (/[mwMW#b°Δ]/.test(ch)) {
      w += fontSize * 0.68;
    } else if (/[il1I|]/.test(ch)) {
      w += fontSize * 0.26;
    } else if (/\d/.test(ch)) {
      w += fontSize * 0.5;
    } else {
      w += fontSize * 0.56;
    }
  }
  return Math.min(STAFF_WIDTH * 0.44, w + fontSize * 0.8);
};

interface ChordLabelLayoutRow {
  groupId: string;
  chordName: string;
  fill: string;
  fullWidth: number;
  centerX: number;
}

const layoutChordLabelRowsInPlace = (
  rows: ChordLabelLayoutRow[],
  leftBound: number,
  rightBound: number,
  minGap: number,
): void => {
  rows.sort((a, b) => a.centerX - b.centerX);
  for (let i = 1; i < rows.length; i += 1) {
    const previousRight = rows[i - 1].centerX + rows[i - 1].fullWidth / 2;
    const currentLeft = rows[i].centerX - rows[i].fullWidth / 2;
    if (currentLeft < previousRight + minGap) {
      rows[i].centerX += previousRight + minGap - currentLeft;
    }
  }
  const last = rows[rows.length - 1];
  const overflow = last.centerX + last.fullWidth / 2 - rightBound;
  if (overflow > 0) {
    for (let j = 0; j < rows.length; j += 1) {
      rows[j].centerX -= overflow;
    }
  }
  const first = rows[0];
  const underflow = leftBound - (first.centerX - first.fullWidth / 2);
  if (underflow > 0) {
    for (let j = 0; j < rows.length; j += 1) {
      rows[j].centerX += underflow;
    }
  }
};

export const layoutBattleChordLabels = (
  groups: readonly ParsedVoicingStaffGroup[],
  layout: StaffLayoutMetrics,
  activeGroupId: string | null | undefined,
  labelCenterY: number,
  leftBound: number,
  rightBound: number,
  sp: number,
): readonly ChordLabelFrame[] => {
  const named = groups.filter(g => g.chordName.length > 0);
  if (named.length === 0) {
    return [];
  }
  const minGap = sp * 0.8;
  let fontSize = 18;
  const minFont = 12;
  while (fontSize >= minFont) {
    const rows: ChordLabelLayoutRow[] = named.map(g => {
      const isActiveChord = activeGroupId !== undefined && activeGroupId !== null
        ? g.id === activeGroupId
        : g.legacyIsActive;
      const fill = isActiveChord ? ACTIVE_CHORD_LABEL_COLOR : NOTATION_COLOR;
      const fullWidth = estimateChordNameWidthPx(g.chordName, fontSize);
      const desiredX = getVoicingGroupBaseX(g, layout);
      const clampedX = Math.min(
        Math.max(desiredX, leftBound + fullWidth / 2),
        rightBound - fullWidth / 2,
      );
      return {
        groupId: g.id,
        chordName: g.chordName,
        fill,
        fullWidth,
        centerX: clampedX,
      };
    });
    layoutChordLabelRowsInPlace(rows, leftBound, rightBound, minGap);
    const fits = rows.every(r => (
      r.centerX - r.fullWidth / 2 >= leftBound - 0.5
      && r.centerX + r.fullWidth / 2 <= rightBound + 0.5
    ));
    if (fits) {
      return rows.map(r => ({
        groupId: r.groupId,
        chordName: r.chordName,
        x: r.centerX,
        fontSize,
        fill: r.fill,
      }));
    }
    fontSize -= 1;
  }
  const rows: ChordLabelLayoutRow[] = named.map(g => {
    const isActiveChord = activeGroupId !== undefined && activeGroupId !== null
      ? g.id === activeGroupId
      : g.legacyIsActive;
    const fill = isActiveChord ? ACTIVE_CHORD_LABEL_COLOR : NOTATION_COLOR;
    const fullWidth = estimateChordNameWidthPx(g.chordName, minFont);
    const desiredX = getVoicingGroupBaseX(g, layout);
    const clampedX = Math.min(
      Math.max(desiredX, leftBound + fullWidth / 2),
      rightBound - fullWidth / 2,
    );
    return {
      groupId: g.id,
      chordName: g.chordName,
      fill,
      fullWidth,
      centerX: clampedX,
    };
  });
  layoutChordLabelRowsInPlace(rows, leftBound, rightBound, minGap);
  return rows.map(r => ({
    groupId: r.groupId,
    chordName: r.chordName,
    x: r.centerX,
    fontSize: minFont,
    fill: r.fill,
  }));
};

/** コード名レーンを確保し、その下に五線系を置く縦レイアウト（論理座標系） */
const computeBattleStaffSystemLayout = (
  activeStaves: readonly StaffNumber[],
  groups: readonly ParsedVoicingStaffGroup[],
  layout: StaffLayoutMetrics,
  activeGroupId: string | null | undefined,
  hideChordLabels: boolean,
  staffLineRightX: number,
): StaffSystemVerticalLayout => {
  const labelTopPadding = SP * 0.4;
  const labelBandCore = Math.min(34, Math.max(24, SP * 2.6));
  const reservedLabelTop = hideChordLabels ? 0 : labelTopPadding + labelBandCore;
  const labelCenterY = hideChordLabels ? 0 : labelTopPadding + labelBandCore / 2;
  const labelBottomGap = hideChordLabels ? 0 : SP * 0.9;
  const firstStaffTopY = reservedLabelTop + labelBottomGap + LEDGER_LINE_PADDING;
  const staffCount = activeStaves.length;
  const staffBlockHeight = (staffCount - 1) * STAFF_TOP_STEP + STAFF_HEIGHT;
  const svgHeight = firstStaffTopY + staffBlockHeight + LEDGER_LINE_PADDING + SP * 0.5;
  const margin = SP * 0.35;
  const leftBound = STAFF_LINE_LEFT_X + margin;
  const rightBound = staffLineRightX - margin;
  const chordLabels = hideChordLabels
    ? []
    : layoutBattleChordLabels(
        groups,
        layout,
        activeGroupId,
        labelCenterY,
        leftBound,
        rightBound,
        SP,
      );
  return {
    firstStaffTopY,
    labelCenterY,
    svgHeight,
    chordLabels,
  };
};

interface VoicingBattleHintsResult {
  nextHintVoicingIndex: number | null;
  topPointer: {
    staff: StaffNumber;
    staffTopY: number;
    xCenter: number;
    yCenter: number;
  } | null;
}

/** 現在小節（measureOffset === 0）のアクティブ・グループ: 未正解ガイドは左端の未演奏音、マーカーは和音の最高音上 */
const computeVoicingBattleHints = (
  groups: readonly ParsedVoicingStaffGroup[],
  layout: StaffLayoutMetrics,
  activeGroupId: string | null | undefined,
  correctPitchClassSets: ReadonlyMap<string, ReadonlySet<number>>,
  activeStaves: readonly StaffNumber[],
  firstStaffTopY: number,
): VoicingBattleHintsResult => {
  if (activeGroupId === undefined || activeGroupId === null) {
    return { nextHintVoicingIndex: null, topPointer: null };
  }
  const group = groups.find(g => g.id === activeGroupId);
  if (!group || group.measureOffset !== 0 || group.isRest || group.notes.length === 0) {
    return { nextHintVoicingIndex: null, topPointer: null };
  }

  const pressed = correctPitchClassSets.get(activeGroupId) ?? new Set<number>();

  type Candidate = {
    voicingIndex: number;
    pitchClass: number;
    xCenter: number;
    degree: number;
    midi: number;
    staff: StaffNumber;
    staffTopY: number;
    yCenter: number;
  };

  const candidates: Candidate[] = [];
  const rowsForTop: Candidate[] = [];

  activeStaves.forEach((staff, staffIndex) => {
    const staffTopY = firstStaffTopY + staffIndex * STAFF_TOP_STEP;
    const baseX = getVoicingGroupBaseX(group, layout);
    const staffNotes = group.notes.filter(note => note.staff === staff);
    const positioned = layoutNotes(staffNotes, staffTopY, baseX);
    positioned.forEach(p => {
      const xCenter = baseX + p.xOffset;
      const row: Candidate = {
        voicingIndex: p.note.voicingIndex,
        pitchClass: p.note.pitchClass,
        xCenter,
        degree: p.note.degree,
        midi: p.note.midi,
        staff,
        staffTopY,
        yCenter: p.yCenter,
      };
      rowsForTop.push(row);
      if (!pressed.has(p.note.pitchClass)) {
        candidates.push(row);
      }
    });
  });

  let nextHintVoicingIndex: number | null = null;

  if (candidates.length === 0) {
    return {
      nextHintVoicingIndex: null,
      topPointer: null,
    };
  }

  candidates.sort((a, b) => {
    if (a.xCenter !== b.xCenter) {
      return a.xCenter - b.xCenter;
    }
    if (a.degree !== b.degree) {
      return a.degree - b.degree;
    }
    return a.voicingIndex - b.voicingIndex;
  });

  const nextTarget = candidates[0];
  nextHintVoicingIndex = nextTarget.voicingIndex;

  const highestMidi = rowsForTop.reduce<Candidate | null>((best, row) => {
    if (best === null || row.midi > best.midi) {
      return row;
    }
    return best;
  }, null);

  if (highestMidi === null) {
    return {
      nextHintVoicingIndex,
      topPointer: null,
    };
  }

  return {
    nextHintVoicingIndex,
    topPointer: {
      staff: highestMidi.staff,
      staffTopY: highestMidi.staffTopY,
      xCenter: highestMidi.xCenter,
      yCenter: highestMidi.yCenter,
    },
  };
};

/** ハーモニー完成 / 部分完成の発光オーバーレイ。eventKey で再マウントして CSS アニメーションを再起動する */
const PulseOverlayLayer: React.FC<{
  pulse: ChordVoicingCompletionPulse;
  groups: readonly ParsedVoicingStaffGroup[];
  correctPitchClassSets: ReadonlyMap<string, ReadonlySet<number>>;
  layout: StaffLayoutMetrics;
  activeStaves: readonly StaffNumber[];
  firstStaffTopY: number;
  pulseGroupIds: ReadonlySet<string>;
}> = ({ pulse, groups, correctPitchClassSets, layout, activeStaves, firstStaffTopY, pulseGroupIds }) => {
  const haloClass = pulse.kind === 'harmonyComplete'
    ? 'voicing-halo-pulse-complete'
    : 'voicing-halo-pulse-partial';
  const halos: React.ReactNode[] = [];
  const noteWidth = SP * 1.45;
  const noteHeight = SP * 0.86;
  activeStaves.forEach((staff, staffIndex) => {
    const staffTopY = firstStaffTopY + staffIndex * STAFF_TOP_STEP;
    groups.forEach(group => {
      if (group.measureOffset !== 0 || !pulseGroupIds.has(group.id)) {
        return;
      }
      const correctSet = correctPitchClassSets.get(group.id);
      if (!correctSet || correctSet.size === 0) {
        return;
      }
      const baseX = getVoicingGroupBaseX(group, layout);
      const positioned = layoutNotes(group.notes.filter(n => n.staff === staff), staffTopY, baseX);
      positioned.forEach(p => {
        if (!correctSet.has(p.note.pitchClass)) {
          return;
        }
        const xCenter = baseX + p.xOffset;
        halos.push(
          <ellipse
            key={`halo-${group.id}-${staff}-${p.note.voicingIndex}`}
            className={haloClass}
            cx={xCenter}
            cy={p.yCenter}
            rx={noteWidth * 0.9}
            ry={noteHeight * 1.25}
            fill="#22c55e"
            stroke="#bbf7d0"
            strokeWidth={2}
            opacity={0.9}
            transform={`rotate(-18 ${xCenter} ${p.yCenter})`}
          />,
        );
      });
    });
  });
  return <g aria-hidden>{halos}</g>;
};

const TopNotePointer: React.FC<{
  xCenter: number;
  yCenter: number;
}> = ({ xCenter, yCenter }) => {
  const noteHeight = SP * 0.86;
  const triH = SP * 0.55;
  const halfW = SP * 0.42;
  const topEdgeY = yCenter - noteHeight / 2;
  /** 逆三角マーカーを五線直上でやや離す（上方向へ） */
  const apexY = topEdgeY - SP * 0.55;
  const baseY = apexY - triH;
  return (
    <polygon
      aria-hidden
      data-voicing-top-pointer="true"
      fill={TOP_POINTER_COLOR}
      points={`${xCenter},${apexY} ${xCenter - halfW},${baseY} ${xCenter + halfW},${baseY}`}
    />
  );
};

const RenderedStaff: React.FC<{
  staff: StaffNumber;
  groups: readonly ParsedVoicingStaffGroup[];
  correctPitchClassSets: ReadonlyMap<string, ReadonlySet<number>>;
  staffTopY: number;
  keyFifths: number;
  layout: StaffLayoutMetrics;
  activeGroupId: string | null | undefined;
  staffLineRightX: number;
  clefFontsLoaded: boolean;
}> = ({
  staff,
  groups,
  correctPitchClassSets,
  staffTopY,
  keyFifths,
  layout,
  activeGroupId,
  staffLineRightX,
  clefFontsLoaded,
}) => {
  const marks = keySignatureMarks(staff, keyFifths);
  const positionedGroups = useMemo(() => (
    groups.map(group => ({
      group,
      noteBaseX: getVoicingGroupBaseX(group, layout),
      positionedNotes: layoutNotes(
        group.notes.filter(note => note.staff === staff),
        staffTopY,
        getVoicingGroupBaseX(group, layout),
      ),
    }))
  ), [groups, layout, staff, staffTopY]);

  return (
    <g>
      <StaffLines staff={staff} topY={staffTopY} staffLineRightX={staffLineRightX} />
      <StaffClefGlyph
        showAnchorDebug={import.meta.env.DEV}
        staff={staff}
        staffTopY={staffTopY}
        staffLineRightX={staffLineRightX}
        clefFontsLoaded={clefFontsLoaded}
      />
      {clefFontsLoaded
        ? marks.map((mark, index) => (
            <text
              key={`${mark.alter}-${index}`}
              data-key-signature-index={index}
              data-key-signature-staff={staff}
              x={KEY_SIGNATURE_LEFT_X + index * KEY_SIGNATURE_GAP_X}
              y={yForDegree(staffTopY, staff, mark.degree)}
              dominantBaseline="central"
              fill={NOTATION_COLOR}
              fontFamily="Bravura, serif"
              fontSize={ACCIDENTAL_FONT_SIZE}
              textAnchor="middle"
            >
              {accidentalGlyph(mark.alter)}
            </text>
          ))
        : null}
      {positionedGroups.map(({ group, noteBaseX, positionedNotes }) => {
        const correctPitchClassSet = correctPitchClassSets.get(group.id);
        const notes = positionedNotes.map(positioned => (
          <WholeNote
            key={`${group.id}-${positioned.note.voicingIndex}`}
            groupId={group.id}
            positioned={positioned}
            baseX={noteBaseX}
            staffTopY={staffTopY}
            isCorrect={correctPitchClassSet?.has(positioned.note.pitchClass) ?? false}
            isNextHint={
              activeGroupId !== undefined
              && activeGroupId !== null
              && group.id === activeGroupId
              && group.measureOffset === 0
              && !(correctPitchClassSet?.has(positioned.note.pitchClass) ?? false)
            }
            clefFontsLoaded={clefFontsLoaded}
          />
        ));
        if (!group.isRest) {
          return notes;
        }
        return [
          <WholeRest
            key={`${group.id}-rest`}
            groupId={group.id}
            baseX={noteBaseX}
            staffTopY={staffTopY}
            color={NOTATION_COLOR}
          />,
          ...notes,
        ];
      })}
    </g>
  );
};

const ChordVoicingStaff: React.FC<ChordVoicingStaffProps> = ({
  voicing = [],
  voicingStaves,
  chordName = '',
  keyFifths = 0,
  correctPitchClasses,
  voicingGroups,
  activeGroupId,
  correctPitchClassesByGroupId,
  denseCurrentMeasureLayout,
  completionPulse,
  showTargetHints = true,
  singleMeasureLayout = false,
  compactSingleMeasure = false,
  hideChordLabels = false,
  className,
}) => {
  const normalizedVoicingStaves = voicingStaves ?? EMPTY_STAVES;
  const normalizedCorrectPitchClasses = correctPitchClasses ?? EMPTY_PITCH_CLASSES;
  const normalizedVoicingGroups = voicingGroups ?? EMPTY_GROUPS;
  const normalizedCorrectPitchClassesByGroupId = correctPitchClassesByGroupId ?? EMPTY_CORRECT_PITCH_CLASS_MAP;
  const parseCacheRef = useRef(new Map<string, ParsedVoicingNoteWithStaff[]>());
  const staffGroups = useMemo<ChordVoicingStaffGroup[]>(() => {
    if (normalizedVoicingGroups.length > 0) {
      return normalizedVoicingGroups
        .filter(group => group.isRest === true || group.voicing.length > 0)
        .map(group => ({
          ...group,
          measureOffset: group.measureOffset === 1 ? 1 : 0,
          isRest: group.isRest === true || group.voicing.length === 0,
        }));
    }
    if (voicing.length === 0) {
      return [];
    }
    return [{
      id: 'single',
      chordName,
      voicing,
      voicingStaves: normalizedVoicingStaves,
      correctPitchClasses: normalizedCorrectPitchClasses,
      measureOffset: 0,
    }];
  }, [
    chordName,
    normalizedCorrectPitchClasses,
    normalizedVoicingGroups,
    normalizedVoicingStaves,
    voicing,
  ]);

  const renderState = useMemo(() => {
    if (staffGroups.length === 0) {
      return { groups: [] as ParsedVoicingStaffGroup[], error: null };
    }
    try {
      const measureSlotCounts = new Map<0 | 1, number>();
      staffGroups.forEach(group => {
        measureSlotCounts.set(group.measureOffset ?? 0, (measureSlotCounts.get(group.measureOffset ?? 0) ?? 0) + 1);
      });
      const nextSlotByMeasure = new Map<0 | 1, number>();
      const groups = staffGroups.map(group => {
        const measureOffset = group.measureOffset ?? 0;
        const slotIndex = nextSlotByMeasure.get(measureOffset) ?? 0;
        nextSlotByMeasure.set(measureOffset, slotIndex + 1);
        return {
          id: group.id,
          chordName: group.chordName,
          notes: parseNotesWithCache(
            parseCacheRef.current,
            group.voicing,
            group.voicingStaves ?? EMPTY_STAVES,
            group.tiedFromPreviousVoicingIndices ?? EMPTY_TIED_INDICES,
          ),
          measureOffset,
          slotIndex,
          slotCount: measureSlotCounts.get(measureOffset) ?? 1,
          legacyIsActive: group.isActive === true,
          isRest: group.isRest === true || group.voicing.length === 0,
        };
      });
      return { groups: applyRequiredAccidentals(groups, keyFifths), error: null };
    } catch (error) {
      return {
        groups: [] as ParsedVoicingStaffGroup[],
        error: error instanceof Error ? error.message : '譜面の生成に失敗しました',
      };
    }
  }, [keyFifths, staffGroups]);

  const correctPitchClassSets = useMemo(() => {
    const sets = new Map<string, ReadonlySet<number>>();
    staffGroups.forEach(group => {
      const pitchClasses = normalizedCorrectPitchClassesByGroupId.get(group.id)
        ?? group.correctPitchClasses
        ?? EMPTY_PITCH_CLASSES;
      sets.set(group.id, new Set(pitchClasses));
    });
    return sets;
  }, [normalizedCorrectPitchClassesByGroupId, staffGroups]);

  const [clefFontsLoaded, setClefFontsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loadClefFont = async () => {
      const sizePx = SP * 4;
      try {
        await document.fonts.load(`${sizePx}px Bravura`, SMUFL_G_CLEF);
        await document.fonts.load(`${sizePx}px Bravura`, SMUFL_F_CLEF);
        await document.fonts.load(`${ACCIDENTAL_FONT_SIZE}px Bravura`, SMUFL_ACCIDENTAL_SHARP);
        await document.fonts.load(`${ACCIDENTAL_FONT_SIZE}px Bravura`, SMUFL_ACCIDENTAL_NATURAL);
        await document.fonts.load(`${ACCIDENTAL_FONT_SIZE}px Bravura`, SMUFL_ACCIDENTAL_FLAT);
        await document.fonts.load(`${ACCIDENTAL_FONT_SIZE}px Bravura`, SMUFL_ACCIDENTAL_DOUBLE_SHARP);
        await document.fonts.load(`${ACCIDENTAL_FONT_SIZE}px Bravura`, SMUFL_ACCIDENTAL_DOUBLE_FLAT);
        await document.fonts.ready;
      } catch {
        // Font Loading API 非対応時はブラウザのフォールバック描画に任せる
      }
      if (!cancelled) {
        setClefFontsLoaded(true);
      }
    };
    void loadClefFont();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRestGroups = renderState.groups.some(group => group.isRest);
  const activeStaves = hasRestGroups ? ([1, 2] as const) : ([1, 2] as const).filter(staff => (
    renderState.groups.some(group => group.notes.some(note => note.staff === staff))
  ));
  const measureZeroNoteTotal = staffGroups.reduce((sum, group) => {
    if ((group.measureOffset ?? 0) !== 0 || group.isRest === true) {
      return sum;
    }
    return sum + group.voicing.length;
  }, 0);
  const inferredDenseLayout = measureZeroNoteTotal >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD;
  const wideFirstMeasure = typeof denseCurrentMeasureLayout === 'boolean'
    ? denseCurrentMeasureLayout
    : inferredDenseLayout;
  const effectiveSingleMeasureLayout = singleMeasureLayout || compactSingleMeasure;
  const staffLineRightX = compactSingleMeasure
    ? compactChordStaffLineRightX(keyFifths)
    : STAFF_LINE_RIGHT_X;
  const viewBoxWidth = staffLineRightX + VIEWBOX_EDGE_PAD_X;
  const layout = getStaffLayoutMetrics(keyFifths, wideFirstMeasure, effectiveSingleMeasureLayout, staffLineRightX);
  const effectiveActiveGroupId = showTargetHints ? activeGroupId : null;
  const systemLayout = useMemo(
    () => computeBattleStaffSystemLayout(
      activeStaves,
      renderState.groups,
      layout,
      effectiveActiveGroupId,
      hideChordLabels,
      staffLineRightX,
    ),
    [effectiveActiveGroupId, activeStaves, hideChordLabels, layout, renderState.groups, staffLineRightX],
  );
  const battleHints = useMemo(
    () => computeVoicingBattleHints(
      renderState.groups,
      layout,
      effectiveActiveGroupId,
      correctPitchClassSets,
      activeStaves,
      systemLayout.firstStaffTopY,
    ),
    [
      effectiveActiveGroupId,
      activeStaves,
      correctPitchClassSets,
      layout,
      renderState.groups,
      systemLayout.firstStaffTopY,
    ],
  );

  /** completionPulse が現在小節（measureOffset===0）に有効な間だけ採用する。小節が進めば自然に消える。 */
  const activePulse = useMemo<ChordVoicingCompletionPulse | null>(() => {
    if (!completionPulse) {
      return null;
    }
    const target = renderState.groups.find(group => (
      group.id === completionPulse.groupId && group.measureOffset === 0
    ));
    return target ? completionPulse : null;
  }, [completionPulse, renderState.groups]);

  const pulseGroupIds = useMemo<ReadonlySet<string> | null>(() => {
    if (!activePulse) {
      return null;
    }
    if (activePulse.kind === 'harmonyComplete') {
      const set = new Set<string>();
      renderState.groups.forEach(group => {
        if (group.measureOffset === 0) {
          set.add(group.id);
        }
      });
      return set;
    }
    return new Set<string>([activePulse.groupId]);
  }, [activePulse, renderState.groups]);

  const measureFramePulseGeometry = useMemo(() => {
    if (!activePulse || activePulse.kind !== 'harmonyComplete' || activeStaves.length === 0) {
      return null;
    }
    const padX = SP * 0.6;
    const padY = SP * 1.2;
    const x = STAFF_LINE_LEFT_X - padX;
    const y = systemLayout.firstStaffTopY - padY;
    const width = layout.measureDividerX - STAFF_LINE_LEFT_X + padX;
    const height = (activeStaves.length - 1) * STAFF_TOP_STEP + STAFF_HEIGHT + padY * 2;
    return { x, y, width, height };
  }, [activePulse, activeStaves.length, layout.measureDividerX, systemLayout.firstStaffTopY]);

  const svgHeight = systemLayout.svgHeight;

  return (
    <div className={cn('relative flex w-full justify-center', className)}>
      {renderState.error ? (
        <div className="rounded bg-red-950/80 px-3 py-1 text-xs text-red-100">
          {renderState.error}
        </div>
      ) : (
        <svg
          aria-busy={!clefFontsLoaded}
          aria-label={chordName ? `${chordName} battle mode staff` : 'Battle mode staff'}
          className="h-auto w-full overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          role="img"
          viewBox={`0 0 ${viewBoxWidth} ${svgHeight}`}
        >
          {activePulse?.kind === 'harmonyComplete' && measureFramePulseGeometry ? (
            <rect
              key={`measure-frame-pulse-${activePulse.eventKey}`}
              className="voicing-measure-frame-pulse"
              x={measureFramePulseGeometry.x}
              y={measureFramePulseGeometry.y}
              width={measureFramePulseGeometry.width}
              height={measureFramePulseGeometry.height}
              rx={SP * 0.6}
              ry={SP * 0.6}
              fill="none"
              stroke="#22c55e"
              strokeWidth={3}
              pointerEvents="none"
            />
          ) : null}
          {systemLayout.chordLabels.map(label => {
            const shouldGlow = activePulse?.kind === 'harmonyComplete' && label.groupId === activePulse.groupId;
            return (
              <text
                key={shouldGlow ? `${label.groupId}-label-${activePulse?.eventKey}` : `${label.groupId}-label`}
                className={shouldGlow ? 'voicing-chord-name-glow' : undefined}
                data-voicing-group-active={label.fill === ACTIVE_CHORD_LABEL_COLOR ? 'true' : 'false'}
                data-voicing-group-id={label.groupId}
                x={label.x}
                y={systemLayout.labelCenterY}
                dominantBaseline="central"
                fill={label.fill}
                fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                fontSize={label.fontSize}
                fontWeight="800"
                textAnchor="middle"
              >
                {label.chordName}
              </text>
            );
          })}
          {activeStaves.map((staff, index) => (
            <RenderedStaff
              key={staff}
              staff={staff}
              groups={renderState.groups}
              correctPitchClassSets={correctPitchClassSets}
              staffTopY={systemLayout.firstStaffTopY + index * STAFF_TOP_STEP}
              keyFifths={keyFifths}
              layout={layout}
              activeGroupId={effectiveActiveGroupId}
              staffLineRightX={staffLineRightX}
              clefFontsLoaded={clefFontsLoaded}
            />
          ))}
          {activeStaves.length > 0 && Array.from(new Set([layout.measureDividerX, staffLineRightX])).map(x => (
            <line
              key={`system-barline-${x}`}
              data-staff-barline={x}
              x1={x}
              x2={x}
              y1={systemLayout.firstStaffTopY}
              y2={systemLayout.firstStaffTopY + (activeStaves.length - 1) * STAFF_TOP_STEP + STAFF_HEIGHT}
              stroke={NOTATION_COLOR}
              strokeLinecap="round"
              strokeWidth={STAFF_LINE_THICKNESS}
            />
          ))}
          {activePulse && pulseGroupIds ? (
            <g key={`pulse-overlay-${activePulse.eventKey}`}>
              <PulseOverlayLayer
                pulse={activePulse}
                groups={renderState.groups}
                correctPitchClassSets={correctPitchClassSets}
                layout={layout}
                activeStaves={activeStaves}
                firstStaffTopY={systemLayout.firstStaffTopY}
                pulseGroupIds={pulseGroupIds}
              />
            </g>
          ) : null}
          {battleHints.topPointer ? (
            <TopNotePointer
              xCenter={battleHints.topPointer.xCenter}
              yCenter={battleHints.topPointer.yCenter}
            />
          ) : null}
        </svg>
      )}
    </div>
  );
};

export default ChordVoicingStaff;
