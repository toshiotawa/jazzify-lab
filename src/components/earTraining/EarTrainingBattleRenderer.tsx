import React, { forwardRef, lazy, Suspense } from 'react';
import type { EarTrainingMode } from '@/types';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { isEarTrainingBattleCanvasEnabled } from '@/game/earTraining/canvas/earTrainingBattleCanvasFlag';
import EarTrainingBattleCanvas from '@/components/earTraining/EarTrainingBattleCanvas';

const LazyEarTrainingPhaserGame = lazy(
  () => import('@/components/earTraining/EarTrainingPhaserGame'),
);

interface EarTrainingBattleRendererProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
  disableCorrectSe?: boolean;
  battleMode?: EarTrainingMode;
}

const EarTrainingBattleRenderer = forwardRef<EarTrainingBattleSceneHandle, EarTrainingBattleRendererProps>((props, ref) => {
  if (isEarTrainingBattleCanvasEnabled()) {
    return <EarTrainingBattleCanvas ref={ref} {...props} />;
  }
  return (
    <Suspense fallback={null}>
      <LazyEarTrainingPhaserGame ref={ref} {...props} />
    </Suspense>
  );
});

EarTrainingBattleRenderer.displayName = 'EarTrainingBattleRenderer';

export default EarTrainingBattleRenderer;
