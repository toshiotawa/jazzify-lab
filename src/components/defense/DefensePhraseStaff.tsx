/**
 * Defense mode staff: current chord only (single measure), via ChordVoicingStaff.
 */
import React, { useMemo } from 'react';

import ChordVoicingStaff from '@/components/earTraining/ChordVoicingStaff';
import { buildDefenseStaffGroups } from '@/game/defense/defenseStaffGroups';
import { resolveDefenseDisplayStaves } from '@/game/defense/defenseStaffLayout';
import type { DefensePhraseChord, DefenseStaffLayout } from '@/game/defense/defenseTypes';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { getNotationInstrumentPreset } from '@/utils/notationInstrument';

interface DefensePhraseStaffProps {
  readonly chord: DefensePhraseChord | null;
  readonly keyFifths: number;
  readonly staffLayout: DefenseStaffLayout;
  readonly correctNoteIndices: ReadonlySet<number>;
  readonly revealedNoteIndices: ReadonlySet<number>;
  readonly targetStepIndex: number;
  readonly showTargetHints: boolean;
  readonly unpressedNoteOpacity: number;
  readonly className?: string;
}

export const DefensePhraseStaff = React.memo<DefensePhraseStaffProps>(({
  chord,
  keyFifths,
  staffLayout,
  correctNoteIndices,
  revealedNoteIndices,
  targetStepIndex,
  showTargetHints,
  unpressedNoteOpacity,
  className,
}) => {
  const notationInstrumentId = useGameStore((state) => state.settings.notationInstrumentId);
  const displayStaves = useMemo(
    () => resolveDefenseDisplayStaves(
      getNotationInstrumentPreset(notationInstrumentId).clef,
      staffLayout,
    ),
    [notationInstrumentId, staffLayout],
  );
  const built = useMemo(
    () => buildDefenseStaffGroups(
      chord,
      correctNoteIndices,
      revealedNoteIndices,
      targetStepIndex,
      showTargetHints,
    ),
    [chord, correctNoteIndices, revealedNoteIndices, targetStepIndex, showTargetHints],
  );

  if (built.groups.length === 0) {
    return null;
  }

  return (
    <div className={cn('min-w-0 flex-1 w-full overflow-visible pointer-events-none', className)} aria-hidden>
      <ChordVoicingStaff
        singleMeasureLayout
        keyFifths={keyFifths}
        voicingGroups={built.groups}
        activeGroupId={built.activeGroupId}
        correctPitchClassesByGroupId={built.correctPitchClassesByGroupId}
        showTargetHints={showTargetHints}
        unpressedNoteOpacity={unpressedNoteOpacity}
        fixedActiveStaves={displayStaves}
        fadeAllMeasureNotes
        smuflUseForeignObject
      />
    </div>
  );
});

DefensePhraseStaff.displayName = 'DefensePhraseStaff';
