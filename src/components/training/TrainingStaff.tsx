import React, { useMemo } from 'react';

import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from '@/components/earTraining/ChordVoicingStaff';
import {
  trainingStaffDisplayNotes,
  trainingStaffHintedPitchClasses,
} from '@/game/training/trainingStaffLayout';
import type { TrainingClefMode, TrainingKind, TrainingQuestion } from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingStaffProps {
  readonly question: TrainingQuestion;
  readonly correctIndices: readonly number[];
  readonly showHints: boolean;
  readonly kind: TrainingKind;
  readonly unpressedNoteOpacity: number;
  readonly clefMode: TrainingClefMode;
  readonly fitParentHeight?: boolean;
  readonly className?: string;
}

export const TrainingStaff = React.memo<TrainingStaffProps>(({
  question,
  correctIndices,
  showHints,
  kind,
  unpressedNoteOpacity,
  clefMode,
  fitParentHeight = false,
  className,
}) => {
  const ignoreNotationInstrument = clefMode === 'bass_concert' || clefMode === 'grand_concert';
  const fixedActiveStaves = clefMode === 'bass_concert'
    ? ([2] as const)
    : clefMode === 'grand_concert'
      ? ([1, 2] as const)
      : undefined;

  const displayNotes = useMemo(
    () => trainingStaffDisplayNotes(question.notes, showHints, kind),
    [question.notes, showHints, kind],
  );

  const correctPitchClasses = useMemo(
    () => trainingStaffHintedPitchClasses(question.notes, correctIndices, showHints, kind),
    [question.notes, correctIndices, showHints, kind],
  );

  const voicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
    if (question.layout !== 'horizontal') {
      return [];
    }
    return displayNotes.map((note, index) => ({
      id: `note-${index}`,
      chordName: '',
      voicing: [note.noteName],
      voicingStaves: [note.staff],
      correctPitchClasses: correctIndices.includes(index) ? [note.pitchClass] : [],
      measureOffset: 0 as const,
    }));
  }, [question.layout, displayNotes, correctIndices]);

  const staffWrapperClass = cn(
    'flex h-full w-full items-center justify-center',
    className,
  );

  const sharedProps = {
    showTargetHints: showHints,
    unpressedNoteOpacity,
    hideChordLabels: true as const,
    fixedActiveStaves,
    ignoreNotationInstrument,
    smuflUseForeignObject: true as const,
    fitParentHeight,
  };

  if (question.layout === 'horizontal') {
    return (
      <div className={staffWrapperClass} aria-hidden>
        <ChordVoicingStaff
          keyFifths={question.keyFifths}
          voicingGroups={voicingGroups}
          denseCurrentMeasureLayout
          singleMeasureLayout
          {...sharedProps}
        />
      </div>
    );
  }

  return (
    <div className={staffWrapperClass} aria-hidden>
      <ChordVoicingStaff
        keyFifths={question.keyFifths}
        voicing={displayNotes.map((n) => n.noteName)}
        voicingStaves={displayNotes.map((n) => n.staff)}
        correctPitchClasses={correctPitchClasses}
        singleMeasureLayout
        {...sharedProps}
      />
    </div>
  );
});

TrainingStaff.displayName = 'TrainingStaff';
