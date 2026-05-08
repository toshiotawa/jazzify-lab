import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

interface ChordVoicingStaffProps {
  voicing: readonly string[];
  voicingStaves: readonly number[];
  chordName: string;
  keyFifths?: number;
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
const STAFF_WIDTH = 360;
const STAFF_LINE_LEFT_X = 24;
const STAFF_LINE_RIGHT_X = 336;
const STAFF_SPACING = 14;
const CHORD_LABEL_HEIGHT = 30;
const STAFF_TOP_Y = 50;
const STAFF_GAP = 72;
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
  const middleLineY = staffTopY + STAFF_SPACING * 2;
  return middleLineY - (degree - REFERENCE_DEGREE_BY_STAFF[staff]) * (STAFF_SPACING / 2);
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
  if (voicing.length !== voicingStaves.length) {
    throw new Error('voicing と voicing_staves は同じ長さである必要があります');
  }
  return voicing.map((noteName, index) => {
    const parsed = parseVoicingNoteName(noteName);
    const staff = Math.trunc(voicingStaves[index]);
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
  const noteWidth = STAFF_SPACING * 1.45;
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
  const accidentalCollisionHeight = STAFF_SPACING * 1.15;
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

const staffTopForIndex = (index: number): number => STAFF_TOP_Y + index * STAFF_GAP;

const StaffLines: React.FC<{ topY: number }> = ({ topY }) => (
  <g>
    {Array.from({ length: 5 }, (_, line) => {
      const y = topY + line * STAFF_SPACING;
      return (
        <line
          key={line}
          x1={STAFF_LINE_LEFT_X}
          x2={STAFF_LINE_RIGHT_X}
          y1={y}
          y2={y}
          stroke={NOTATION_COLOR}
          strokeLinecap="round"
          strokeWidth="1.3"
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
}> = ({ xCenter, yCenter, staffTopY, noteWidth }) => {
  const topLineY = staffTopY;
  const bottomLineY = staffTopY + STAFF_SPACING * 4;
  const ledgerLineYs: number[] = [];

  if (yCenter < topLineY) {
    for (let y = topLineY - STAFF_SPACING; y >= yCenter - 0.1; y -= STAFF_SPACING) {
      ledgerLineYs.push(y);
    }
  }
  if (yCenter > bottomLineY) {
    for (let y = bottomLineY + STAFF_SPACING; y <= yCenter + 0.1; y += STAFF_SPACING) {
      ledgerLineYs.push(y);
    }
  }

  return (
    <g>
      {ledgerLineYs.map(y => (
        <line
          key={y}
          x1={xCenter - noteWidth * 0.62}
          x2={xCenter + noteWidth * 0.62}
          y1={y}
          y2={y}
          stroke={NOTATION_COLOR}
          strokeLinecap="round"
          strokeWidth="1.25"
        />
      ))}
    </g>
  );
};

const WholeNote: React.FC<{
  positioned: PositionedVoicingNote;
  baseX: number;
  staffTopY: number;
}> = ({ positioned, baseX, staffTopY }) => {
  const noteWidth = STAFF_SPACING * 1.45;
  const noteHeight = STAFF_SPACING * 0.86;
  const xCenter = baseX + positioned.xOffset;
  const accidental = accidentalSymbol(positioned.note.alter);
  const accidentalX = Math.min(
    xCenter - noteWidth * 1.05,
    baseX - noteWidth * 1.15 - positioned.accidentalColumn * STAFF_SPACING * 0.85,
  );

  return (
    <g>
      <LedgerLines
        xCenter={xCenter}
        yCenter={positioned.yCenter}
        staffTopY={staffTopY}
        noteWidth={noteWidth}
      />
      {accidental && (
        <text
          x={accidentalX}
          y={positioned.yCenter}
          dominantBaseline="central"
          fill={NOTATION_COLOR}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={STAFF_SPACING * 1.45}
          fontWeight="600"
          textAnchor="middle"
        >
          {accidental}
        </text>
      )}
      <ellipse
        cx={xCenter}
        cy={positioned.yCenter}
        fill="none"
        rx={noteWidth / 2}
        ry={noteHeight / 2}
        stroke={NOTATION_COLOR}
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
}> = ({ staff, notes, staffTopY, keyFifths }) => {
  const marks = keySignatureMarks(staff, keyFifths);
  const noteBaseX = marks.length > 0 ? 246 : 228;
  const clefY = staff === 1
    ? staffTopY + STAFF_SPACING * 2.35
    : staffTopY + STAFF_SPACING * 1.9;
  const clefSize = staff === 1 ? 52 : 42;
  const positionedNotes = layoutNotes(notes, staffTopY);

  return (
    <g>
      <StaffLines topY={staffTopY} />
      <text
        x={52}
        y={clefY}
        dominantBaseline="central"
        fill={NOTATION_COLOR}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={clefSize}
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
          fontSize={STAFF_SPACING * 1.45}
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
  className,
}) => {
  const renderState = useMemo(() => {
    if (voicing.length === 0 || voicingStaves.length === 0) {
      return { notes: [] as ParsedVoicingNoteWithStaff[], error: null };
    }
    try {
      return { notes: parseNotes(voicing, voicingStaves), error: null };
    } catch (error) {
      return {
        notes: [] as ParsedVoicingNoteWithStaff[],
        error: error instanceof Error ? error.message : '譜面の生成に失敗しました',
      };
    }
  }, [voicing, voicingStaves]);

  const activeStaves = ([1, 2] as const).filter(staff => (
    renderState.notes.some(note => note.staff === staff)
  ));
  const svgHeight = CHORD_LABEL_HEIGHT
    + (activeStaves.length > 1 ? STAFF_GAP + STAFF_SPACING * 4 : STAFF_SPACING * 4)
    + 24;

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
            y={18}
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
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export default ChordVoicingStaff;
