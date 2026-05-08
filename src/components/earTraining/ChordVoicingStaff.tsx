import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import './bravuraClefFont.css';

export interface ChordVoicingStaffGroup {
  id: string;
  chordName: string;
  voicing: readonly string[];
  voicingStaves?: readonly number[] | null;
  correctPitchClasses?: readonly number[];
  tiedFromPreviousVoicingIndices?: readonly number[];
  measureOffset?: 0 | 1;
  isActive?: boolean;
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

interface ParsedVoicingStaffGroup {
  id: string;
  chordName: string;
  notes: ParsedVoicingNoteWithStaff[];
  measureOffset: 0 | 1;
  slotIndex: number;
  slotCount: number;
  legacyIsActive: boolean;
}

interface KeySignatureMark {
  alter: number;
  degree: number;
}

type StaffNumber = 1 | 2;

const NOTATION_COLOR = '#ffffff';
const CORRECT_NOTATION_COLOR = '#22c55e';
const ACTIVE_CHORD_LABEL_COLOR = '#facc15';
const SP = 12;
const STAFF_WIDTH = 720;
const STAFF_LINE_LEFT_X = 24;
const STAFF_LINE_RIGHT_X = 696;
const STAFF_LINE_THICKNESS = Math.max(1, SP * 0.1);
const STAFF_HEIGHT = SP * 4;
/** コード名ラベルとト譜表の間に余白を取る（譜面の可読性） */
const STAFF_TOP_Y = SP * 5.75;
const STAFF_TOP_STEP = STAFF_HEIGHT + SP * 7;
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
const MEASURE_DIVIDER_X = STAFF_WIDTH / 2;
const MEASURE_ONE_NOTE_LEFT_X = 138;
const MEASURE_ONE_NOTE_RIGHT_X = MEASURE_DIVIDER_X - 30;
const MEASURE_TWO_NOTE_LEFT_X = MEASURE_DIVIDER_X + 30;
const MEASURE_TWO_NOTE_RIGHT_X = STAFF_LINE_RIGHT_X - 30;
const KEY_SIGNATURE_LEFT_X = 88;
const KEY_SIGNATURE_GAP_X = SP * 0.9;
const PARSED_NOTE_CACHE_LIMIT = 96;
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

  return sortedNotes.map((note, index) => ({
    note,
    yCenter: yCenters[index],
    xOffset: offsets[index],
    accidentalColumn: accidentalColumns[index],
  }));
};

const staffTopForIndex = (index: number): number => STAFF_TOP_Y + index * STAFF_TOP_STEP;

const CLEF_LEFT_X = STAFF_LINE_LEFT_X + SP * 0.8;

const StaffClefGlyph: React.FC<{
  staff: StaffNumber;
  staffTopY: number;
  showAnchorDebug: boolean;
}> = ({ staff, staffTopY, showAnchorDebug }) => {
  const anchorLineY = staff === 1 ? staffTopY + 3 * SP : staffTopY + SP;
  const glyph = staff === 1 ? SMUFL_G_CLEF : SMUFL_F_CLEF;

  return (
    <g data-staff-clef={staff}>
      {showAnchorDebug ? (
        <g aria-hidden>
          <line
            x1={STAFF_LINE_LEFT_X}
            x2={STAFF_LINE_RIGHT_X}
            y1={anchorLineY}
            y2={anchorLineY}
            stroke="#ef4444"
            strokeWidth={1}
          />
          <circle cx={CLEF_LEFT_X} cy={anchorLineY} fill="#ef4444" r={4} />
        </g>
      ) : null}
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
    </g>
  );
};

const StaffLines: React.FC<{ staff: StaffNumber; topY: number }> = ({ staff, topY }) => (
  <g>
    {Array.from({ length: 5 }, (_, line) => {
      const y = topY + line * SP;
      return (
        <line
          key={line}
          data-staff-line={line}
          data-staff-number={staff}
          x1={STAFF_LINE_LEFT_X}
          x2={STAFF_LINE_RIGHT_X}
          y1={y}
          y2={y}
          stroke={NOTATION_COLOR}
          strokeLinecap="round"
          strokeWidth={STAFF_LINE_THICKNESS}
        />
      );
    })}
    {[MEASURE_DIVIDER_X, STAFF_LINE_RIGHT_X].map(x => (
      <line
        key={x}
        data-staff-barline={x}
        data-staff-number={staff}
        x1={x}
        x2={x}
        y1={topY}
        y2={topY + STAFF_HEIGHT}
        stroke={NOTATION_COLOR}
        strokeLinecap="round"
        strokeWidth={STAFF_LINE_THICKNESS}
      />
    ))}
  </g>
);

const LedgerLines: React.FC<{
  xCenter: number;
  yCenter: number;
  staffTopY: number;
  noteWidth: number;
  color: string;
}> = ({ xCenter, yCenter, staffTopY, noteWidth, color }) => {
  const topLineY = staffTopY;
  const bottomLineY = staffTopY + STAFF_HEIGHT;
  const ledgerLineYs: number[] = [];

  if (yCenter < topLineY) {
    for (let y = topLineY - SP; y >= yCenter - 0.1; y -= SP) {
      ledgerLineYs.push(y);
    }
  }
  if (yCenter > bottomLineY) {
    for (let y = bottomLineY + SP; y <= yCenter + 0.1; y += SP) {
      ledgerLineYs.push(y);
    }
  }

  return (
    <g>
      {ledgerLineYs.map(y => (
        <line
          key={y}
          x1={xCenter - noteWidth / 2 - SP * 0.4}
          x2={xCenter + noteWidth / 2 + SP * 0.4}
          y1={y}
          y2={y}
          stroke={color}
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
}> = ({ groupId, positioned, baseX, staffTopY, isCorrect }) => {
  const noteWidth = SP * 1.45;
  const noteHeight = SP * 0.86;
  const xCenter = baseX + positioned.xOffset;
  const accidental = positioned.note.displayAccidentalAlter === null
    ? ''
    : accidentalGlyph(positioned.note.displayAccidentalAlter);
  const notationColor = isCorrect ? CORRECT_NOTATION_COLOR : NOTATION_COLOR;
  const accidentalX = Math.min(
    xCenter - noteWidth * 1.05,
    baseX - noteWidth * 1.15 - positioned.accidentalColumn * SP * 0.85,
  );

  return (
    <g>
      <LedgerLines
        xCenter={xCenter}
        yCenter={positioned.yCenter}
        staffTopY={staffTopY}
        noteWidth={noteWidth}
        color={notationColor}
      />
      {accidental && (
        <text
          data-accidental-group-id={groupId}
          data-accidental-voicing-index={positioned.note.voicingIndex}
          data-voicing-pitch-class={positioned.note.pitchClass}
          x={accidentalX}
          y={positioned.yCenter}
          dominantBaseline="central"
          fill={notationColor}
          fontFamily="Bravura, serif"
          fontSize={SP * 1.75}
          textAnchor="middle"
        >
          {accidental}
        </text>
      )}
      <ellipse
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
    </g>
  );
};

const getVoicingGroupBaseX = (group: ParsedVoicingStaffGroup): number => {
  const left = group.measureOffset === 0 ? MEASURE_ONE_NOTE_LEFT_X : MEASURE_TWO_NOTE_LEFT_X;
  const right = group.measureOffset === 0 ? MEASURE_ONE_NOTE_RIGHT_X : MEASURE_TWO_NOTE_RIGHT_X;
  const slotWidth = (right - left) / Math.max(1, group.slotCount);
  return left + slotWidth * (group.slotIndex + 0.5);
};

const RenderedStaff: React.FC<{
  staff: StaffNumber;
  groups: readonly ParsedVoicingStaffGroup[];
  correctPitchClassSets: ReadonlyMap<string, ReadonlySet<number>>;
  staffTopY: number;
  keyFifths: number;
}> = ({ staff, groups, correctPitchClassSets, staffTopY, keyFifths }) => {
  const marks = keySignatureMarks(staff, keyFifths);
  const positionedGroups = useMemo(() => (
    groups.map(group => ({
      group,
      noteBaseX: getVoicingGroupBaseX(group),
      positionedNotes: layoutNotes(group.notes.filter(note => note.staff === staff), staffTopY),
    }))
  ), [groups, staff, staffTopY]);

  return (
    <g>
      <StaffLines staff={staff} topY={staffTopY} />
      <StaffClefGlyph
        showAnchorDebug={import.meta.env.DEV}
        staff={staff}
        staffTopY={staffTopY}
      />
      {marks.map((mark, index) => (
        <text
          key={`${mark.alter}-${index}`}
          data-key-signature-index={index}
          data-key-signature-staff={staff}
          x={KEY_SIGNATURE_LEFT_X + index * KEY_SIGNATURE_GAP_X}
          y={yForDegree(staffTopY, staff, mark.degree)}
          dominantBaseline="central"
          fill={NOTATION_COLOR}
          fontFamily="Bravura, serif"
          fontSize={SP * 1.75}
          textAnchor="middle"
        >
          {accidentalGlyph(mark.alter)}
        </text>
      ))}
      {positionedGroups.map(({ group, noteBaseX, positionedNotes }) => {
        const correctPitchClassSet = correctPitchClassSets.get(group.id);
        return positionedNotes.map(positioned => (
          <WholeNote
            key={`${group.id}-${positioned.note.voicingIndex}`}
            groupId={group.id}
            positioned={positioned}
            baseX={noteBaseX}
            staffTopY={staffTopY}
            isCorrect={correctPitchClassSet?.has(positioned.note.pitchClass) ?? false}
          />
        ));
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
        .filter(group => group.voicing.length > 0)
        .map(group => ({
          ...group,
          measureOffset: group.measureOffset === 1 ? 1 : 0,
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

  const isGroupActive = (group: ParsedVoicingStaffGroup): boolean => {
    if (activeGroupId !== undefined && activeGroupId !== null) {
      return group.id === activeGroupId;
    }
    return group.legacyIsActive;
  };

  const [clefFontsLoaded, setClefFontsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loadClefFont = async () => {
      const sizePx = SP * 4;
      try {
        await document.fonts.load(`${sizePx}px Bravura`, SMUFL_G_CLEF);
        await document.fonts.load(`${sizePx}px Bravura`, SMUFL_F_CLEF);
        await document.fonts.load(`${SP * 1.75}px Bravura`, SMUFL_ACCIDENTAL_SHARP);
        await document.fonts.load(`${SP * 1.75}px Bravura`, SMUFL_ACCIDENTAL_NATURAL);
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

  const activeStaves = ([1, 2] as const).filter(staff => (
    renderState.groups.some(group => group.notes.some(note => note.staff === staff))
  ));
  const svgHeight = activeStaves.length > 0
    ? STAFF_TOP_Y + (activeStaves.length - 1) * STAFF_TOP_STEP + STAFF_HEIGHT + SP * 3
    : STAFF_TOP_Y + STAFF_HEIGHT + SP * 3;

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
          viewBox={`0 0 ${STAFF_WIDTH} ${svgHeight}`}
        >
          {renderState.groups.map(group => (
            group.chordName ? (
              <text
                key={`${group.id}-label`}
                data-voicing-group-active={isGroupActive(group) ? 'true' : 'false'}
                data-voicing-group-id={group.id}
                x={getVoicingGroupBaseX(group)}
                y={SP * 2.25}
                dominantBaseline="central"
                fill={isGroupActive(group) ? ACTIVE_CHORD_LABEL_COLOR : NOTATION_COLOR}
                fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                fontSize="18"
                fontWeight="800"
                textAnchor="middle"
              >
                {group.chordName}
              </text>
            ) : null
          ))}
          {activeStaves.map((staff, index) => (
            <RenderedStaff
              key={staff}
              staff={staff}
              groups={renderState.groups}
              correctPitchClassSets={correctPitchClassSets}
              staffTopY={staffTopForIndex(index)}
              keyFifths={keyFifths}
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default ChordVoicingStaff;
