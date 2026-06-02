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
  const windowEndMeasure = windowStartMeasure + 1;

  const visible = chords
    .map((chord, index) => ({ chord, index }))
    .filter(
      ({ chord }) =>
        chord.measureNumber >= windowStartMeasure && chord.measureNumber <= windowEndMeasure,
    );

  const slotByMeasure = new Map<number, number>();

  return visible.map(({ chord, index }) => {
    const measure = chord.measureNumber;
    const slotIndex = slotByMeasure.get(measure) ?? 0;
    slotByMeasure.set(measure, slotIndex + 1);

    const names = voicingNamesFor(chord);
    const staves = voicingStavesFor(chord, names);
    const isActive = activeChordIndex === index;
    const measureOffset = measure === windowStartMeasure ? (0 as const) : (1 as const);
    const showLabel = slotIndex === 0;

    return {
      id: chordEventId(chord, index),
      chordName: showLabel ? chord.chordName : '',
      voicing: names,
      voicingStaves: staves,
      correctPitchClasses: isActive ? chord.voicing.map((m) => ((m % 12) + 12) % 12) : [],
      measureOffset,
      isActive,
      exemptFromFade: isActive,
    };
  });
};

export const resolveDemoStaffWindowStartMeasure = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
  activeChordIndex: number | null,
): number => {
  if (activeChordIndex === null || !chords[activeChordIndex]) {
    const first = chords[0];
    return first?.measureNumber ?? 1;
  }
  const activeMeasure = chords[activeChordIndex].measureNumber;
  const maxMeasure = chords.reduce((max, c) => Math.max(max, c.measureNumber), 1);
  if (activeMeasure >= maxMeasure) {
    return Math.max(1, maxMeasure - 1);
  }
  return activeMeasure;
};

export const SurvivalTutorialDemoStaff = React.memo<SurvivalTutorialDemoStaffProps>(
  ({ snapshot, className }) => {
    const groups = useMemo(() => buildDemoStaffVoicingGroups(snapshot), [snapshot]);

    if (groups.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'min-w-0 flex-1 max-w-[min(520px,92vw)] overflow-visible [&_svg]:origin-top [&_svg]:scale-[0.92] [&_svg]:transform-gpu [&_svg]:transform [&_svg]:h-auto [&_svg]:w-full md:[&_svg]:scale-[0.88]',
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
        />
      </div>
    );
  },
);

SurvivalTutorialDemoStaff.displayName = 'SurvivalTutorialDemoStaff';
