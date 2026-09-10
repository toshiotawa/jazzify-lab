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
  readonly clefMode: TrainingClefMode;
  readonly className?: string;
}

export const TrainingStaff = React.memo<TrainingStaffProps>(({
  question,
  correctIndices,
  showHints,
  clefMode,
  className,
}) => {
  const isNoteVisible = (isTarget: boolean): boolean => !isTarget || showHints;
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
    return question.notes
      .map((note, index) => ({ note, index }))
      .filter(({ note }) => isNoteVisible(note.isTarget))
      .map(({ note, index }) => ({
        id: `note-${index}`,
        chordName: index === 0 ? question.promptLabel : '',
        voicing: [note.noteName],
        voicingStaves: [note.staff],
        correctPitchClasses: correctIndices.includes(index) ? [note.pitchClass] : [],
        measureOffset: 0 as const,
      }));
  }, [question, correctIndices, showHints]);

  const unpressedOpacity = showHints ? 1 : 0;

  if (question.layout === 'horizontal') {
    return (
      <div className={cn('pointer-events-none', className)} aria-hidden>
        <ChordVoicingStaff
          keyFifths={question.keyFifths}
          voicingGroups={voicingGroups}
          denseCurrentMeasureLayout
          singleMeasureLayout
          compactSingleMeasure
          showTargetHints={showHints}
          unpressedNoteOpacity={unpressedOpacity}
          hideChordLabels={false}
          fixedActiveStaves={fixedActiveStaves}
          ignoreNotationInstrument={ignoreNotationInstrument}
          smuflUseForeignObject
        />
      </div>
    );
  }

  const visibleEntries = question.notes
    .map((note, index) => ({ note, index }))
    .filter(({ note }) => isNoteVisible(note.isTarget));
  const visibleNotes = visibleEntries.map(({ note }) => note);

  return (
    <div className={cn('pointer-events-none', className)} aria-hidden>
      <ChordVoicingStaff
        keyFifths={question.keyFifths}
        chordName={question.promptLabel}
        voicing={visibleNotes.map((n) => n.noteName)}
        voicingStaves={visibleNotes.map((n) => n.staff)}
        correctPitchClasses={visibleEntries
          .filter(({ index }) => correctIndices.includes(index))
          .map(({ note }) => note.pitchClass)}
        singleMeasureLayout
        compactSingleMeasure
        showTargetHints={showHints}
        unpressedNoteOpacity={unpressedOpacity}
        fixedActiveStaves={fixedActiveStaves}
        ignoreNotationInstrument={ignoreNotationInstrument}
        smuflUseForeignObject
      />
    </div>
  );
});

TrainingStaff.displayName = 'TrainingStaff';
