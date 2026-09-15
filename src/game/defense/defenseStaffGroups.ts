/**
 * Defense mode staff group builder: current chord only (single measure).
 */
import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { DefensePhraseChord } from '@/game/defense/defenseTypes';
import { getPhraseChordSteps } from '@/utils/phraseChordSteps';

export interface DefenseStaffGroupsResult {
  readonly groups: readonly ChordVoicingStaffGroup[];
  readonly correctPitchClassesByGroupId: ReadonlyMap<string, readonly number[]>;
  readonly activeGroupId: string | null;
}

export function buildDefenseStaffGroups(
  chord: DefensePhraseChord | null,
  correctNoteIndices: ReadonlySet<number>,
  revealedNoteIndices: ReadonlySet<number>,
  targetStepIndex: number,
  showTargetHints: boolean,
): DefenseStaffGroupsResult {
  if (!chord || chord.notes.length === 0) {
    return {
      groups: [],
      correctPitchClassesByGroupId: new Map(),
      activeGroupId: null,
    };
  }

  const { steps } = getPhraseChordSteps(chord.notes);
  const groups: ChordVoicingStaffGroup[] = [];
  const correctPitchClassesByGroupId = new Map<string, readonly number[]>();

  steps.forEach((step, stepPosition) => {
    const groupId = `m0-s${stepPosition}`;
    const stepCorrectPitchClasses: number[] = [];
    let allRevealed = true;

    for (const noteIndex of step.noteIndices) {
      const note = chord.notes[noteIndex];
      if (!note) continue;
      if (correctNoteIndices.has(noteIndex)) {
        stepCorrectPitchClasses.push(note.pitchClass);
      }
      if (!revealedNoteIndices.has(noteIndex)) {
        allRevealed = false;
      }
    }

    const isTarget = stepPosition === targetStepIndex && showTargetHints;

    groups.push({
      id: groupId,
      chordName: stepPosition === 0 ? chord.chordName : '',
      voicing: step.noteIndices.map((index) => chord.notes[index]?.noteName ?? ''),
      voicingStaves: step.noteIndices.map((index) => chord.notes[index]?.staff ?? 1),
      correctPitchClasses: stepCorrectPitchClasses,
      measureOffset: 0,
      isActive: isTarget,
      exemptFromFade: allRevealed,
    });

    if (stepCorrectPitchClasses.length > 0) {
      correctPitchClassesByGroupId.set(groupId, stepCorrectPitchClasses);
    }
  });

  const activeGroupId = showTargetHints ? `m0-s${targetStepIndex}` : null;

  return {
    groups,
    correctPitchClassesByGroupId,
    activeGroupId,
  };
}
