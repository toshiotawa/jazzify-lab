import React, { useMemo } from 'react';

import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from '@/components/earTraining/ChordVoicingStaff';
import type { SurvivalTutorialV3DemoChordEvent } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { chordEventId } from '@/components/survival/tutorial/survivalTutorialDemoPlayScheduler';
import { cn } from '@/utils/cn';

export interface SurvivalTutorialDemoStaffSnapshot {
  readonly chords: readonly SurvivalTutorialV3DemoChordEvent[];
  readonly activeChordIndex: number | null;
  readonly keyFifths: number;
  readonly windowStartMeasure: number;
}

export interface SurvivalTutorialDemoStaffProps {
  readonly snapshot: SurvivalTutorialDemoStaffSnapshot;
  readonly className?: string;
}

const voicingNamesFor = (chord: SurvivalTutorialV3DemoChordEvent): readonly string[] => {
  if (chord.voicingNames && chord.voicingNames.length === chord.voicing.length) {
    return chord.voicingNames;
  }
  return chord.voicing.map((m) => `M${m}`);
};

const voicingStavesFor = (
  chord: SurvivalTutorialV3DemoChordEvent,
  names: readonly string[],
): readonly (1 | 2)[] => {
  if (chord.voicing_staves && chord.voicing_staves.length === names.length) {
    return chord.voicing_staves;
  }
  return names.map(() => 2 as const);
};

export const buildDemoStaffVoicingGroups = (
  snapshot: SurvivalTutorialDemoStaffSnapshot,
): readonly ChordVoicingStaffGroup[] => {
  const { chords, activeChordIndex, windowStartMeasure } = snapshot;

  const visible = chords
    .map((chord, index) => ({ chord, index }))
    .filter(({ chord }) => chord.measureNumber === windowStartMeasure);

  return visible.flatMap(({ chord, index }) => {
    if (chord.voicing.length === 0) {
      return [];
    }

    const names = voicingNamesFor(chord);
    const staves = voicingStavesFor(chord, names);
    const isActive = activeChordIndex === index;

    return [{
      id: chordEventId(chord, index),
      chordName: isActive ? chord.chordName : '',
      voicing: names,
      voicingStaves: staves,
      correctPitchClasses: isActive ? chord.voicing.map((m) => ((m % 12) + 12) % 12) : [],
      measureOffset: 0 as const,
      isActive,
      exemptFromFade: isActive,
    }];
  });
};

/** 表示ウィンドウ内に発音グループが無く、休符イベントのみあるとき true。 */
export const isDemoStaffRestWindow = (
  snapshot: SurvivalTutorialDemoStaffSnapshot,
): boolean => {
  const { chords, windowStartMeasure } = snapshot;
  let hasRest = false;
  let hasVoiced = false;
  for (const chord of chords) {
    if (chord.measureNumber !== windowStartMeasure) {
      continue;
    }
    if (chord.voicing.length === 0) {
      hasRest = true;
    } else {
      hasVoiced = true;
    }
  }
  return hasRest && !hasVoiced;
};

export const resolveDemoStaffWindowStartMeasure = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
  activeChordIndex: number | null,
): number => {
  if (activeChordIndex !== null && chords[activeChordIndex]) {
    return chords[activeChordIndex].measureNumber;
  }
  return chords[0]?.measureNumber ?? 1;
};

const resolveDemoStaffActiveGroupId = (
  snapshot: SurvivalTutorialDemoStaffSnapshot,
): string | null => {
  if (snapshot.activeChordIndex === null) {
    return null;
  }
  const chord = snapshot.chords[snapshot.activeChordIndex];
  if (!chord) {
    return null;
  }
  return chordEventId(chord, snapshot.activeChordIndex);
};

export const SurvivalTutorialDemoStaff = React.memo<SurvivalTutorialDemoStaffProps>(
  ({ snapshot, className }) => {
    const groups = useMemo(() => buildDemoStaffVoicingGroups(snapshot), [snapshot]);
    const activeGroupId = useMemo(() => resolveDemoStaffActiveGroupId(snapshot), [snapshot]);
    const showEmptyStaff = useMemo(() => isDemoStaffRestWindow(snapshot), [snapshot]);

    if (groups.length === 0 && !showEmptyStaff) {
      return null;
    }

    return (
      <div
        className={cn(
          'min-w-0 flex-1 max-w-[min(420px,78vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[1.35] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[1.22]',
          className,
          'pointer-events-none',
        )}
        aria-hidden
      >
        <ChordVoicingStaff
          voicingGroups={groups}
          keyFifths={snapshot.keyFifths}
          smuflUseForeignObject
          noteCollisionLayout="anchor-low"
          unpressedNoteOpacity={0.45}
          singleMeasureLayout
          showTargetHints={false}
          showEmptyStaff={showEmptyStaff}
          activeGroupId={activeGroupId}
        />
      </div>
    );
  },
);

SurvivalTutorialDemoStaff.displayName = 'SurvivalTutorialDemoStaff';
