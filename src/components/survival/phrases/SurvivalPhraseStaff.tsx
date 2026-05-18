/**
 * Survival Phrases mode staff: 2 measures (current + next chord), sequential whole notes.
 * Forked from ChordVoicingStaff via voicingGroups (one note per group, horizontal layout).
 */
import React, { useMemo } from 'react';
import ChordVoicingStaff, { type ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { SurvivalPhraseChord } from '@/utils/survivalPhraseDefinitions';
import { cn } from '@/utils/cn';

export interface SurvivalPhraseStaffProps {
  readonly currentChord: SurvivalPhraseChord | null;
  readonly nextChord: SurvivalPhraseChord | null;
  readonly keyFifths: number;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly targetNoteIndex: number;
  readonly hintMode: boolean;
  readonly hideUnpressedAfter30s: boolean;
  readonly className?: string;
}

function buildChordGroups(
  chord: SurvivalPhraseChord | null,
  measureOffset: 0 | 1,
  correctIndices: ReadonlySet<number>,
  revealedIndices: ReadonlySet<number>,
  targetNoteIndex: number,
  hintMode: boolean,
  hideUnpressedAfter30s: boolean,
  isCurrentMeasure: boolean,
): readonly ChordVoicingStaffGroup[] {
  if (!chord || chord.notes.length === 0) {
    return [];
  }

  const correctPitchClassesByNote = chord.notes.map((note, i) =>
    correctIndices.has(i) ? [note.pitchClass] as const : [] as const,
  );

  return chord.notes.map((note, noteIndex) => {
    const isCorrect = correctIndices.has(noteIndex);
    const isRevealed = revealedIndices.has(noteIndex);
    const isTarget =
      isCurrentMeasure && !isCorrect && noteIndex === targetNoteIndex && hintMode;

    const hideNote =
      hideUnpressedAfter30s &&
      isCurrentMeasure &&
      !isCorrect &&
      !isRevealed;

    if (hideNote) {
      return {
        id: `m${measureOffset}-n${noteIndex}-hidden`,
        chordName: noteIndex === 0 ? chord.chordName : '',
        voicing: [] as const,
        voicingStaves: [note.staff] as const,
        measureOffset,
        correctPitchClasses: correctPitchClassesByNote[noteIndex],
      };
    }

    return {
      id: `m${measureOffset}-n${noteIndex}`,
      chordName: noteIndex === 0 ? chord.chordName : '',
      voicing: [note.noteName] as const,
      voicingStaves: [note.staff] as const,
      correctPitchClasses: isCorrect ? [note.pitchClass] : [],
      measureOffset,
      isActive: isTarget,
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
    hideUnpressedAfter30s,
    className,
  }) => {
    const voicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
      const current = buildChordGroups(
        currentChord,
        0,
        correctNoteIndices,
        revealedNoteIndices,
        targetNoteIndex,
        hintMode,
        hideUnpressedAfter30s,
        true,
      );
      const next = buildChordGroups(
        nextChord,
        1,
        new Set(),
        new Set(),
        0,
        false,
        false,
        false,
      );
      return [...current, ...next];
    }, [
      currentChord,
      nextChord,
      correctNoteIndices,
      revealedNoteIndices,
      targetNoteIndex,
      hintMode,
      hideUnpressedAfter30s,
    ]);

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
          keyFifths={keyFifths}
          voicingGroups={voicingGroups}
          correctPitchClassesByGroupId={correctPitchClassesByGroupId}
          showTargetHints={hintMode}
          hideUnpressedNotes={hideUnpressedAfter30s}
          smuflUseForeignObject
        />
      </div>
    );
  },
);

SurvivalPhraseStaff.displayName = 'SurvivalPhraseStaff';
