/**
 * Survival Phrases mode staff: 1 measure (current chord only), sequential whole notes.
 * Forked from ChordVoicingStaff via voicingGroups (one note per group, horizontal layout).
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff, { type ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';

import type { SurvivalPhraseChord } from '@/utils/survivalPhraseDefinitions';

import { cn } from '@/utils/cn';

export interface SurvivalPhraseStaffProps {
  readonly currentChord: SurvivalPhraseChord | null;
  /** 互換・将来用。描画では現在小節のみ使用。 */
  readonly nextChord: SurvivalPhraseChord | null;
  readonly keyFifths: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly targetNoteIndex: number;
  readonly hintMode: boolean;
  readonly unpressedNoteOpacity: number;
  readonly className?: string;
}

function buildChordGroups(
  chord: SurvivalPhraseChord | null,
  correctIndices: ReadonlySet<number>,
  revealedIndices: ReadonlySet<number>,
  targetNoteIndex: number,
  hintMode: boolean,
): readonly ChordVoicingStaffGroup[] {
  if (!chord || chord.notes.length === 0) {
    return [];
  }

  return chord.notes.map((note, noteIndex) => {
    const isCorrect = correctIndices.has(noteIndex);
    const isRevealed = revealedIndices.has(noteIndex);
    const isTarget = !isCorrect && noteIndex === targetNoteIndex && hintMode;

    return {
      id: `n${noteIndex}`,
      chordName: noteIndex === 0 ? chord.chordName : '',
      voicing: [note.noteName] as const,
      voicingStaves: [note.staff] as const,
      correctPitchClasses: isCorrect ? [note.pitchClass] : [],
      measureOffset: 0 as const,
      isActive: isTarget,
      exemptFromFade: isRevealed,
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
    targetNoteIndex,
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
        targetNoteIndex,
        hintMode,
      );
    }, [currentChord, correctNoteIndices, revealedNoteIndices, targetNoteIndex, hintMode]);

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
          compactSingleMeasure
          keyFifths={keyFifths}
          voicingGroups={voicingGroups}
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
