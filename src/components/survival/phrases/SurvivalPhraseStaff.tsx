/**
 * Survival Phrases mode staff: 1 measure (current chord only), sequential whole notes.
 * Uses `singleMeasureLayout` (full staff width) — not `compactSingleMeasure`, which narrows
 * the SVG viewBox and gets blown up by the parent scale transform.
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, { type ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';

import type { SurvivalPhraseChord } from '@/utils/survivalPhraseDefinitions';
import { getPhraseChordSteps } from '@/utils/phraseChordSteps';

import { cn } from '@/utils/cn';

export interface SurvivalPhraseStaffProps {
  readonly currentChord: SurvivalPhraseChord | null;
  /** 互換用。1小節表示では描画しない。 */
  readonly nextChord: SurvivalPhraseChord | null;
  readonly keyFifths: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly targetStepIndex: number;
  readonly hintMode: boolean;
  readonly unpressedNoteOpacity: number;
  readonly className?: string;
}

function buildChordGroups(
  chord: SurvivalPhraseChord | null,
  correctIndices: ReadonlySet<number>,
  revealedIndices: ReadonlySet<number>,
  targetStepIndex: number,
  hintMode: boolean,
): readonly ChordVoicingStaffGroup[] {
  if (!chord || chord.notes.length === 0) {
    return [];
  }

  const { steps } = getPhraseChordSteps(chord.notes);

  return steps.map((step, stepPosition) => {
    const groupId = `m0-s${stepPosition}`;
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

    const isTarget = stepPosition === targetStepIndex && hintMode;

    return {
      id: groupId,
      chordName: stepPosition === 0 ? chord.chordName : '',
      voicing: step.noteIndices.map((index) => chord.notes[index]?.noteName ?? ''),
      voicingStaves: step.noteIndices.map((index) => chord.notes[index]?.staff ?? 1),
      correctPitchClasses: stepCorrectPitchClasses,
      measureOffset: 0 as const,
      isActive: isTarget,
      exemptFromFade: allRevealed,
    };
  });
}

export const SurvivalPhraseStaff = React.memo<SurvivalPhraseStaffProps>(
  ({
    currentChord,
    nextChord,
    keyFifths,
    correctNoteIndices,
    revealedNoteIndices,
    targetStepIndex,
    hintMode,
    unpressedNoteOpacity,
    className,
  }) => {
    void nextChord;

    const voicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
      return buildChordGroups(
        currentChord,
        correctNoteIndices,
        revealedNoteIndices,
        targetStepIndex,
        hintMode,
      );
    }, [currentChord, correctNoteIndices, revealedNoteIndices, targetStepIndex, hintMode]);

    const activeGroupId = hintMode ? `m0-s${targetStepIndex}` : null;

    const correctPitchClassesByGroupId = useMemo(() => {
      const map = new Map<string, readonly number[]>();
      for (const group of voicingGroups) {
        if (group.correctPitchClasses && group.correctPitchClasses.length > 0) {
          map.set(group.id, group.correctPitchClasses);
        }
      }
      return map;
    }, [voicingGroups]);

    if (voicingGroups.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'min-w-0 flex-1 max-w-[min(420px,78vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.35] [&_svg]:transform-gpu [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.22]',
          className,
          'pointer-events-none',
        )}
        aria-hidden
      >
        <ChordVoicingStaff
          singleMeasureLayout
          keyFifths={keyFifths}
          voicingGroups={voicingGroups}
          activeGroupId={activeGroupId}
          correctPitchClassesByGroupId={correctPitchClassesByGroupId}
          showTargetHints={hintMode}
          unpressedNoteOpacity={unpressedNoteOpacity}
          fadeAllMeasureNotes
          smuflUseForeignObject
        />
      </div>
    );
  },
);

SurvivalPhraseStaff.displayName = 'SurvivalPhraseStaff';
