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
  readonly activeRollStepIndex: number | null;
  readonly keyFifths: number;
  readonly windowStartMeasure: number;
}

const collectDemoSceneStaves = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
): Set<1 | 2> => {
  const staves = new Set<1 | 2>();
  const addStaves = (values: readonly number[] | undefined): void => {
    if (!values) {
      return;
    }
    for (const value of values) {
      if (value === 1 || value === 2) {
        staves.add(value);
      }
    }
  };
  for (const chord of chords) {
    addStaves(chord.voicing_staves);
    if (chord.rollSteps) {
      for (const step of chord.rollSteps) {
        addStaves(step.voicing_staves);
      }
    }
  }
  return staves;
};

/** demo シーン全体の voicing / rollSteps から、シーン内で固定する 1|2 段表示を決める。 */
export const resolveDemoSceneFixedStaves = (
  chords: readonly SurvivalTutorialV3DemoChordEvent[],
): readonly (1 | 2)[] => {
  const staves = collectDemoSceneStaves(chords);
  if (staves.has(1) && staves.has(2)) {
    return [1, 2];
  }
  if (staves.has(1)) {
    return [1];
  }
  if (staves.has(2)) {
    return [2];
  }
  return [1, 2];
};

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

const voicingForActiveChord = (
  chord: SurvivalTutorialV3DemoChordEvent,
  activeRollStepIndex: number | null,
): readonly number[] => {
  if (
    activeRollStepIndex !== null &&
    chord.rollSteps &&
    chord.rollSteps[activeRollStepIndex]
  ) {
    return chord.rollSteps[activeRollStepIndex].voicing;
  }
  return chord.voicing;
};

const voicingNamesForActiveChord = (
  chord: SurvivalTutorialV3DemoChordEvent,
  names: readonly string[],
  activeRollStepIndex: number | null,
): readonly string[] => {
  if (
    activeRollStepIndex !== null &&
    chord.rollSteps &&
    chord.rollSteps[activeRollStepIndex]?.voicingNames
  ) {
    const stepNames = chord.rollSteps[activeRollStepIndex].voicingNames;
    if (stepNames && stepNames.length === chord.rollSteps[activeRollStepIndex].voicing.length) {
      return stepNames;
    }
  }
  return names;
};

const voicingStavesForActiveChord = (
  chord: SurvivalTutorialV3DemoChordEvent,
  staves: readonly (1 | 2)[],
  activeRollStepIndex: number | null,
): readonly (1 | 2)[] => {
  if (
    activeRollStepIndex !== null &&
    chord.rollSteps &&
    chord.rollSteps[activeRollStepIndex]?.voicing_staves
  ) {
    const stepStaves = chord.rollSteps[activeRollStepIndex].voicing_staves;
    if (stepStaves && stepStaves.length === chord.rollSteps[activeRollStepIndex].voicing.length) {
      return stepStaves;
    }
  }
  return staves;
};

const highlightPitchClassesForActiveChord = (
  chord: SurvivalTutorialV3DemoChordEvent,
  activeRollStepIndex: number | null,
): readonly number[] => {
  if (
    activeRollStepIndex !== null &&
    chord.rollSteps &&
    chord.rollSteps[activeRollStepIndex]
  ) {
    return chord.rollSteps[activeRollStepIndex].newVoicing.map(
      (midi) => ((midi % 12) + 12) % 12,
    );
  }
  return chord.voicing.map((midi) => ((midi % 12) + 12) % 12);
};

export const buildDemoStaffVoicingGroups = (
  snapshot: SurvivalTutorialDemoStaffSnapshot,
): readonly ChordVoicingStaffGroup[] => {
  const { chords, activeChordIndex, activeRollStepIndex, windowStartMeasure } = snapshot;

  const visible = chords
    .map((chord, index) => ({ chord, index }))
    .filter(({ chord }) => chord.measureNumber === windowStartMeasure);

  return visible.flatMap(({ chord, index }) => {
    if (chord.voicing.length === 0) {
      return [];
    }

    const isActive = activeChordIndex === index;
    const displayVoicing = isActive
      ? voicingForActiveChord(chord, activeRollStepIndex)
      : chord.voicing;
    if (displayVoicing.length === 0) {
      return [];
    }

    const baseNames = voicingNamesFor(chord);
    const names = isActive
      ? voicingNamesForActiveChord(chord, baseNames, activeRollStepIndex)
      : baseNames;
    const staves = isActive
      ? voicingStavesForActiveChord(chord, voicingStavesFor(chord, names), activeRollStepIndex)
      : voicingStavesFor(chord, names);

    return [{
      id: chordEventId(chord, index),
      chordName: isActive ? chord.chordName : '',
      voicing: names.slice(0, displayVoicing.length),
      voicingStaves: staves.slice(0, displayVoicing.length),
      correctPitchClasses: isActive
        ? [...highlightPitchClassesForActiveChord(chord, activeRollStepIndex)]
        : [],
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
    const fixedActiveStaves = useMemo(
      () => resolveDemoSceneFixedStaves(snapshot.chords),
      [snapshot.chords],
    );

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
          fixedActiveStaves={fixedActiveStaves}
          activeGroupId={activeGroupId}
        />
      </div>
    );
  },
);

SurvivalTutorialDemoStaff.displayName = 'SurvivalTutorialDemoStaff';
