/**
 * Defense mode staff: N measures via ChordVoicingStaff (2 measures per row).
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from '@/components/earTraining/ChordVoicingStaff';
import type { DefensePhraseChord, DefenseStaffLayout } from '@/game/defense/defenseTypes';
import { getPhraseChordSteps } from '@/utils/phraseChordSteps';
import { cn } from '@/utils/cn';

interface DefensePhraseStaffProps {
  readonly chords: readonly DefensePhraseChord[];
  readonly chordIndex: number;
  readonly keyFifths: number;
  readonly staffLayout: DefenseStaffLayout;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly targetStepIndex: number;
  readonly showTargetHints: boolean;
  readonly unpressedNoteOpacity: number;
  readonly className?: string;
}

const fixedStavesForLayout = (layout: DefenseStaffLayout): readonly (1 | 2)[] => (
  layout === 'grand' ? [1, 2] : [1]
);

function buildMeasureGroups(
  chord: DefensePhraseChord,
  measureOffset: 0 | 1,
  correctIndices: ReadonlySet<number>,
  revealedIndices: ReadonlySet<number>,
  targetStepIndex: number,
  isActiveChord: boolean,
  hintMode: boolean,
): readonly ChordVoicingStaffGroup[] {
  if (chord.notes.length === 0) {
    return [];
  }

  const { steps } = getPhraseChordSteps(chord.notes);

  return steps.map((step, stepPosition) => {
    const groupId = `m${measureOffset}-s${stepPosition}`;
    const stepCorrectPitchClasses: number[] = [];
    let allRevealed = true;

    for (const noteIndex of step.noteIndices) {
      const note = chord.notes[noteIndex];
      if (!note) continue;
      if (correctIndices.has(noteIndex)) {
        stepCorrectPitchClasses.push(note.pitchClass);
      }
      if (!revealedIndices.has(noteIndex)) {
        allRevealed = false;
      }
    }

    const isTarget = isActiveChord && stepPosition === targetStepIndex && hintMode;

    return {
      id: groupId,
      chordName: stepPosition === 0 ? chord.chordName : '',
      voicing: step.noteIndices.map((index) => chord.notes[index]?.noteName ?? ''),
      voicingStaves: step.noteIndices.map((index) => chord.notes[index]?.staff ?? 1),
      correctPitchClasses: stepCorrectPitchClasses,
      measureOffset,
      isActive: isTarget,
      exemptFromFade: allRevealed,
    };
  });
}

export const DefensePhraseStaff = React.memo<DefensePhraseStaffProps>(({
  chords,
  chordIndex,
  keyFifths,
  staffLayout,
  correctNoteIndices,
  revealedNoteIndices,
  targetStepIndex,
  showTargetHints,
  unpressedNoteOpacity,
  className,
}) => {
  const rows = useMemo(() => {
    const result: Array<{
      measureOffset: 0 | 1;
      groups: readonly ChordVoicingStaffGroup[];
      activeGroupId: string | null;
    }> = [];

    for (let rowStart = 0; rowStart < chords.length; rowStart += 2) {
      const rowChords = chords.slice(rowStart, rowStart + 2);
      const groups: ChordVoicingStaffGroup[] = [];

      rowChords.forEach((chord, offsetInRow) => {
        const measureOffset = offsetInRow === 0 ? 0 : 1;
        const globalIndex = rowStart + offsetInRow;
        const isActiveChord = globalIndex === chordIndex;
        groups.push(
          ...buildMeasureGroups(
            chord,
            measureOffset,
            correctNoteIndices,
            revealedNoteIndices,
            targetStepIndex,
            isActiveChord,
            showTargetHints,
          ),
        );
      });

      const activeGroupId = showTargetHints && chordIndex >= rowStart && chordIndex < rowStart + 2
        ? `m${chordIndex - rowStart === 0 ? 0 : 1}-s${targetStepIndex}`
        : null;

      result.push({ measureOffset: 0, groups, activeGroupId });
    }

    return result;
  }, [
    chords,
    chordIndex,
    correctNoteIndices,
    revealedNoteIndices,
    targetStepIndex,
    showTargetHints,
  ]);

  const correctPitchClassesByGroupId = useMemo(() => {
    const map = new Map<string, readonly number[]>();
    for (const row of rows) {
      for (const group of row.groups) {
        if (group.correctPitchClasses && group.correctPitchClasses.length > 0) {
          map.set(group.id, group.correctPitchClasses);
        }
      }
    }
    return map;
  }, [rows]);

  if (chords.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-1 pointer-events-none', className)} aria-hidden>
      {rows.map((row, rowIndex) => (
        <div
          key={`defense-staff-row-${rowIndex}`}
          className="min-w-0 flex-1 max-w-[min(420px,78vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.35] [&_svg]:transform-gpu [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.22]"
        >
          <ChordVoicingStaff
            keyFifths={keyFifths}
            voicingGroups={row.groups}
            activeGroupId={row.activeGroupId}
            correctPitchClassesByGroupId={correctPitchClassesByGroupId}
            showTargetHints={showTargetHints}
            unpressedNoteOpacity={unpressedNoteOpacity}
            fixedActiveStaves={fixedStavesForLayout(staffLayout)}
            fadeAllMeasureNotes
            smuflUseForeignObject
          />
        </div>
      ))}
    </div>
  );
});

DefensePhraseStaff.displayName = 'DefensePhraseStaff';
