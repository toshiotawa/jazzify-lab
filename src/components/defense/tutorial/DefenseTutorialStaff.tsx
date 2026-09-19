import React from 'react';
import ChordVoicingStaff from '@/components/earTraining/ChordVoicingStaff';
import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import { resolveTutorialDisplayStaves } from '@/game/defense/tutorial/defenseTutorialNotation';
import type { NotationInstrumentClef } from '@/utils/notationInstrument';
import { cn } from '@/utils/cn';

interface DefenseTutorialStaffProps {
  readonly groups: readonly ChordVoicingStaffGroup[];
  readonly keyFifths: number;
  readonly clef: NotationInstrumentClef;
  readonly activeGroupId: string | null;
  readonly correctPitchClassesByGroupId: ReadonlyMap<string, readonly number[]>;
  readonly className?: string;
}

export const DefenseTutorialStaff: React.FC<DefenseTutorialStaffProps> = ({
  groups,
  keyFifths,
  clef,
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
      fixedActiveStaves={resolveTutorialDisplayStaves(clef)}
      fadeAllMeasureNotes
      smuflUseForeignObject
      ignoreNotationInstrument
    />
  </div>
);
