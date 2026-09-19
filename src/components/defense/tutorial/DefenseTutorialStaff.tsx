import React from 'react';
import ChordVoicingStaff from '@/components/earTraining/ChordVoicingStaff';
import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import { cn } from '@/utils/cn';

interface DefenseTutorialStaffProps {
  readonly groups: readonly ChordVoicingStaffGroup[];
  readonly keyFifths: number;
  readonly activeGroupId: string | null;
  readonly correctPitchClassesByGroupId: ReadonlyMap<string, readonly number[]>;
  readonly className?: string;
}

export const DefenseTutorialStaff: React.FC<DefenseTutorialStaffProps> = ({
  groups,
  keyFifths,
  activeGroupId,
  correctPitchClassesByGroupId,
  className,
}) => (
  <div className={cn('min-w-0 w-full overflow-visible pointer-events-none', className)} aria-hidden>
    <ChordVoicingStaff
      singleMeasureLayout
      keyFifths={keyFifths}
      voicingGroups={groups}
      activeGroupId={activeGroupId}
      correctPitchClassesByGroupId={correctPitchClassesByGroupId}
      showTargetHints
      unpressedNoteOpacity={1}
      fixedActiveStaves={[1]}
      fadeAllMeasureNotes
      smuflUseForeignObject
      ignoreNotationInstrument
    />
  </div>
);
