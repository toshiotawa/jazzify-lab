import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

interface ChordVoicingStaffProps {
  voicing: readonly string[];
  voicingStaves?: readonly number[] | null;
  chordName: string;
  keyFifths?: number;
  correctPitchClasses?: readonly number[];
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
}

interface KeySignatureMark {
  symbol: string;
  degree: number;
}

type StaffNumber = 1 | 2;

const NOTATION_COLOR = '#ffffff';
const CORRECT_NOTATION_COLOR = '#ef4444';
const SP = 12;
const STAFF_WIDTH = 360;
const STAFF_LINE_LEFT_X = 24;
const STAFF_LINE_RIGHT_X = 336;
const STAFF_LINE_THICKNESS = Math.max(1, SP * 0.1);
const STAFF_HEIGHT = SP * 4;
const STAFF_TOP_Y = SP * 4.5;
const STAFF_TOP_STEP = STAFF_HEIGHT + SP * 7;
const CLEF_FONT_SIZE = SP * 4;
const CLEF_FONT_FAMILY = "Noto Music, Bravura, 'Apple Symbols', Georgia, 'Times New Roman', serif";
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

const CLEF_BY_STAFF: Record<StaffNumber, string> = {
  1: '𝄞',
  2: '𝄢',
};

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

const accidentalSymbol = (alter: number): string => {
  if (alter === 2) {
    return '𝄪';
  }
  if (alter === 1) {
    return '♯';
  }
  if (alter === -1) {
    return '♭';
  }
  if (alter === -2) {
    return '𝄫';
  }
  return '';
};

const keySignatureMarks = (staff: StaffNumber, keyFifths: number): KeySignatureMark[] => {
  const fifths = clampKeyFifths(keyFifths);
  if (fifths === 0) {
    return [];
  }
  const symbol = fifths > 0 ? '♯' : '♭';
  const degrees = fifths > 0
    ? KEY_SIGNATURE_MARKS[staff].sharps.slice(0, fifths)
    : KEY_SIGNATURE_MARKS[staff].flats.slice(0, Math.abs(fifths));
  return degrees.map(degree => ({ symbol, degree }));
};

const parseNotes = (
  voicing: readonly string[],
  voicingStaves: readonly number[],
): ParsedVoicingNoteWithStaff[] => {
  const shouldInferStaves = voicingStaves.length === 0;
  if (!shouldInferStaves && voicing.length !== voicingStaves.length) {
    throw new Error('voicing と voicing_staves は同じ長さである必要があります');
  }
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
    };
  });
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
    .filter(item => item.note.alter !== 0)
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
  positioned: PositionedVoicingNote;
  baseX: number;
  staffTopY: number;
  isCorrect: boolean;
}> = ({ positioned, baseX, staffTopY, isCorrect }) => {
  const noteWidth = SP * 1.45;
  const noteHeight = SP * 0.86;
  const xCenter = baseX + positioned.xOffset;
  const accidental = accidentalSymbol(positioned.note.alter);
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
          data-accidental-voicing-index={positioned.note.voicingIndex}
          data-voicing-pitch-class={positioned.note.pitchClass}
          x={accidentalX}
          y={positioned.yCenter}
          dominantBaseline="central"
          fill={notationColor}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={SP * 1.45}
          fontWeight="600"
          textAnchor="middle"
        >
          {accidental}
        </text>
      )}
      <ellipse
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

const RenderedStaff: React.FC<{
  staff: StaffNumber;
  notes: readonly ParsedVoicingNoteWithStaff[];
  staffTopY: number;
  keyFifths: number;
  correctPitchClassSet: ReadonlySet<number>;
}> = ({ staff, notes, staffTopY, keyFifths, correctPitchClassSet }) => {
  const marks = keySignatureMarks(staff, keyFifths);
  const noteBaseX = marks.length > 0 ? 246 : 228;
  const clefY = staff === 1
    ? staffTopY + SP * 3
    : staffTopY + SP;
  const positionedNotes = layoutNotes(notes, staffTopY);

  return (
    <g>
      <StaffLines staff={staff} topY={staffTopY} />
      <text
        x={52}
        y={clefY}
        dominantBaseline="central"
        fill={NOTATION_COLOR}
        fontFamily={CLEF_FONT_FAMILY}
        fontSize={CLEF_FONT_SIZE}
        textAnchor="middle"
      >
        {CLEF_BY_STAFF[staff]}
      </text>
      {marks.map((mark, index) => (
        <text
          key={`${mark.symbol}-${index}`}
          x={88 + index * 10}
          y={yForDegree(staffTopY, staff, mark.degree)}
          dominantBaseline="central"
          fill={NOTATION_COLOR}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={SP * 1.45}
          fontWeight="600"
          textAnchor="middle"
        >
          {mark.symbol}
        </text>
      ))}
      {positionedNotes.map(positioned => (
        <WholeNote
          key={positioned.note.voicingIndex}
          positioned={positioned}
          baseX={noteBaseX}
          staffTopY={staffTopY}
          isCorrect={correctPitchClassSet.has(positioned.note.pitchClass)}
        />
      ))}
    </g>
  );
};

const ChordVoicingStaff: React.FC<ChordVoicingStaffProps> = ({
  voicing,
  voicingStaves,
  chordName,
  keyFifths = 0,
  correctPitchClasses,
  className,
}) => {
  const normalizedVoicingStaves = voicingStaves ?? EMPTY_STAVES;
  const normalizedCorrectPitchClasses = correctPitchClasses ?? EMPTY_PITCH_CLASSES;
  const renderState = useMemo(() => {
    if (voicing.length === 0) {
      return { notes: [] as ParsedVoicingNoteWithStaff[], error: null };
    }
    try {
      return { notes: parseNotes(voicing, normalizedVoicingStaves), error: null };
    } catch (error) {
      return {
        notes: [] as ParsedVoicingNoteWithStaff[],
        error: error instanceof Error ? error.message : '譜面の生成に失敗しました',
      };
    }
  }, [normalizedVoicingStaves, voicing]);

  const correctPitchClassSet = useMemo(
    () => new Set(normalizedCorrectPitchClasses),
    [normalizedCorrectPitchClasses],
  );

  const activeStaves = ([1, 2] as const).filter(staff => (
    renderState.notes.some(note => note.staff === staff)
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
          aria-label={`${chordName} chord voicing`}
          className="h-auto w-full overflow-visible drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          role="img"
          viewBox={`0 0 ${STAFF_WIDTH} ${svgHeight}`}
        >
          <text
            x={STAFF_WIDTH / 2}
            y={SP * 1.5}
            dominantBaseline="central"
            fill={NOTATION_COLOR}
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontSize="18"
            fontWeight="800"
            textAnchor="middle"
          >
            {chordName}
          </text>
          {activeStaves.map((staff, index) => (
            <RenderedStaff
              key={staff}
              staff={staff}
              notes={renderState.notes.filter(note => note.staff === staff)}
              staffTopY={staffTopForIndex(index)}
              keyFifths={keyFifths}
              correctPitchClassSet={correctPitchClassSet}
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default ChordVoicingStaff;
