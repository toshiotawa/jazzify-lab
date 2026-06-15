import React, { forwardRef } from 'react';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { isEarTrainingBattleCanvasEnabled } from '@/game/earTraining/canvas/earTrainingBattleCanvasFlag';
import EarTrainingBattleCanvas from '@/components/earTraining/EarTrainingBattleCanvas';
import EarTrainingPhaserGame from '@/components/earTraining/EarTrainingPhaserGame';

interface EarTrainingBattleRendererProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
  disableCorrectSe?: boolean;
}

const EarTrainingBattleRenderer = forwardRef<EarTrainingBattleSceneHandle, EarTrainingBattleRendererProps>((props, ref) => {
  if (isEarTrainingBattleCanvasEnabled()) {
    return <EarTrainingBattleCanvas ref={ref} {...props} />;
  }
  return <EarTrainingPhaserGame ref={ref} {...props} />;
});

EarTrainingBattleRenderer.displayName = 'EarTrainingBattleRenderer';

export default EarTrainingBattleRenderer;
