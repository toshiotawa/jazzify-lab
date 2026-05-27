/** 風船ラッシュ — `SurvivalGameScreen` の薄いラッパー（UI はすべてサバイバルモードを流用） */
import React, { useMemo } from 'react';
import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalCharacter } from '@/components/survival/SurvivalTypes';
import type { LessonContext } from '@/types';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import {
  BALLOON_RUSH_SCENARIO_OVERRIDES,
  balloonRushDifficultyConfig,
  balloonRushLessonRuntime,
  balloonRushToStageDefinition,
} from '@/utils/balloonRushSurvivalBridge';

export interface BalloonRushGameScreenProps {
  readonly stage: BalloonRushResolvedStage;
  readonly hintMode: boolean;
  readonly character: SurvivalCharacter | null | undefined;
  readonly lessonContext: LessonContext | null;
  readonly isEnglishCopy: boolean;
  readonly onLessonClear?: () => void | Promise<void>;
  readonly onBack: () => void;
}

const BalloonRushGameScreen: React.FC<BalloonRushGameScreenProps> = ({
  stage,
  hintMode,
  character,
  lessonContext,
  isEnglishCopy,
  onLessonClear,
  onBack,
}) => {
  const stageDefinition = useMemo(() => balloonRushToStageDefinition(stage), [stage]);
  const config = useMemo(() => balloonRushDifficultyConfig(stage), [stage]);
  const lessonRuntime = useMemo(() => balloonRushLessonRuntime(stage), [stage]);

  return (
    <SurvivalGameScreen
      difficulty="easy"
      config={config}
      onBackToSelect={onBack}
      onBackToMenu={onBack}
      character={character ?? undefined}
      stageDefinition={stageDefinition}
      balloonRushStage={stage}
      lessonRuntime={lessonRuntime}
      isLessonMode={lessonContext !== null}
      hintMode={hintMode}
      onLessonStageClear={onLessonClear}
      initialScenarioOverrides={BALLOON_RUSH_SCENARIO_OVERRIDES}
      scenarioMode
      embeddedFullHeight
    />
  );
};

export default BalloonRushGameScreen;
