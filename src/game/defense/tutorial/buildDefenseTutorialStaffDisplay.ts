import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import type { DefensePhraseJudgeState } from '@/game/defense/defensePhraseJudge';

export interface DefenseTutorialStaffDisplay {
  readonly groups: readonly ChordVoicingStaffGroup[];
  readonly activeGroupId: string | null;
  readonly correctPitchClassesByGroupId: ReadonlyMap<string, readonly number[]>;
}

export const buildDefenseTutorialStaffDisplay = (
  baseGroups: readonly ChordVoicingStaffGroup[],
  judge: DefensePhraseJudgeState,
  concertPitchClasses: readonly number[],
): DefenseTutorialStaffDisplay => {
  const correctPitchClassesByGroupId = new Map<string, readonly number[]>();
  let activeGroupId: string | null = null;

  const groups = baseGroups.map((group, index) => {
    if (group.isRest) {
      return group;
    }
    const stepIndex = index;
    const isComplete = judge.correctNoteIndices.has(stepIndex)
      || stepIndex < judge.targetStepIndex;
    const isActive = stepIndex === judge.targetStepIndex;
    if (isActive) {
      activeGroupId = group.id;
    }
    const pitchClass = concertPitchClasses[stepIndex];
    if (isComplete && pitchClass !== undefined) {
      correctPitchClassesByGroupId.set(group.id, [pitchClass]);
    }
    return {
      ...group,
      isActive,
      correctPitchClasses: isComplete && pitchClass !== undefined ? [pitchClass] : [],
    };
  });

  return {
    groups,
    activeGroupId,
    correctPitchClassesByGroupId,
  };
};
