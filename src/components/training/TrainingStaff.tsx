import React, { useMemo } from 'react';

import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from '@/components/earTraining/ChordVoicingStaff';
import type { TrainingQuestion } from '@/game/training/trainingTypes';
import type { TrainingClefMode } from '@/game/training/trainingTypes';
import { cn } from '@/utils/cn';

interface TrainingStaffProps {
  readonly question: TrainingQuestion;
  readonly correctIndices: readonly number[];
  readonly showHints: boolean;
  readonly unpressedNoteOpacity: number;
  readonly clefMode: TrainingClefMode;
  readonly fitParentHeight?: boolean;
  readonly className?: string;
}

export const TrainingStaff = React.memo<TrainingStaffProps>(({
  question,
  correctIndices,
  showHints,
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

  const correctPitchClasses = useMemo(
    () => correctIndices.map((i) => question.notes[i]?.pitchClass).filter((pc): pc is number => pc != null),
    [correctIndices, question.notes],
  );

  const voicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
    if (question.layout !== 'horizontal') {
      return [];
    }
    return question.notes.map((note, index) => ({
      id: `note-${index}`,
      chordName: '',
      voicing: [note.noteName],
      voicingStaves: [note.staff],
      correctPitchClasses: correctIndices.includes(index) ? [note.pitchClass] : [],
      measureOffset: 0 as const,
    }));
  }, [question, correctIndices]);

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
        voicing={question.notes.map((n) => n.noteName)}
        voicingStaves={question.notes.map((n) => n.staff)}
        correctPitchClasses={correctPitchClasses}
        singleMeasureLayout
        {...sharedProps}
      />
    </div>
  );
});

TrainingStaff.displayName = 'TrainingStaff';
