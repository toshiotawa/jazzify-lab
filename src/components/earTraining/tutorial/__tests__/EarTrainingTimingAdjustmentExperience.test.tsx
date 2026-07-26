import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { EarTrainingTimingAdjustmentExperience } from '@/components/earTraining/tutorial/EarTrainingTimingAdjustmentExperience';
import type { EarTrainingTutorialBindings } from '@/components/earTraining/tutorial/earTrainingTutorialBindings';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { profile: null }) => unknown) => selector({ profile: null }),
}));

vi.mock('@/hooks/useQuestCompleteJingle', () => ({
  useQuestCompleteJingleWhenVisible: () => undefined,
}));

vi.mock('@/components/survival/tutorial/tutorialAudioUnlock', () => ({
  unlockTutorialAudio: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/components/earTraining/tutorial/preloadEarTrainingTutorialBattleChunks', () => ({
  preloadEarTrainingTutorialBattleChunks: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/platform/supabaseSurvival', () => ({
  fetchSurvivalCharacters: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/components/earTraining/tutorial/fetchEarTrainingTutorialScript', async () => {
  const { buildOsmdTimingAdjustmentV1Script } = await import(
    '@/components/earTraining/tutorial/buildOsmdTimingAdjustmentV1Script'
  );
  const script = buildOsmdTimingAdjustmentV1Script();
  return {
    fetchEarTrainingTutorialScript: vi.fn().mockResolvedValue({
      id: 'osmd-timing-adjustment-v1',
      title: 'OSMDタイミング調整チュートリアル',
      title_en: 'OSMD Timing Adjustment Tutorial',
      script,
    }),
  };
});

vi.mock('@/components/earTraining/tutorial/EarTrainingTutorialSceneHost', () => ({
  showTutorialFinishCta: (_script: unknown, scene: { type: string }) => scene.type === 'finish',
  EarTrainingTutorialSceneHost: ({
    bindings,
    onSceneComplete,
  }: {
    bindings: EarTrainingTutorialBindings;
    onSceneComplete: () => void;
  }) => {
    useEffect(() => {
      if (bindings.timingCalibrationMode) {
        bindings.onBattleReady?.();
      }
    }, [bindings]);

    return (
      <button type="button" onClick={() => onSceneComplete()}>
        complete-scene
      </button>
    );
  },
}));

describe('EarTrainingTimingAdjustmentExperience', () => {
  it('shows 進む after timing calibration OSMD reports ready in the same commit as scene advance', async () => {
    const onExit = vi.fn();

    render(
      <EarTrainingTimingAdjustmentExperience
        entry="quest"
        onExit={onExit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'complete-scene' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'complete-scene' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });
  });
});
