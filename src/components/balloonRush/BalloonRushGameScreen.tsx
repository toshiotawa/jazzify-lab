/** 風船ラッシュ — `SurvivalGameScreen` の薄いラッパー（UI はすべてサバイバルモードを流用） */
import React, { useMemo } from 'react';
import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalCharacter, DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { LessonContext, ProductionHintMode } from '@/types';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import {
  balloonRushDifficultyConfig,
  balloonRushLessonRuntime,
  balloonRushScenarioOverrides,
  balloonRushToStageDefinition,
} from '@/utils/balloonRushSurvivalBridge';

export interface BalloonRushGameScreenProps {
  readonly stage: BalloonRushResolvedStage;
  readonly hintMode: boolean;
  readonly character: SurvivalCharacter | null | undefined;
  readonly lessonContext: LessonContext | null;
  readonly isEnglishCopy: boolean;
  readonly configOverride?: DifficultyConfig;
  readonly lessonRandomChordOverrides?: ReadonlyMap<string, ChordDefinition>;
  readonly lessonProductionHintOverrides?: {
    readonly staff?: ProductionHintMode | null;
    readonly keyboard?: ProductionHintMode | null;
  };
  readonly onLessonClear?: () => void | Promise<void>;
  readonly onBack: () => void;
}

const BalloonRushGameScreen: React.FC<BalloonRushGameScreenProps> = ({
  stage,
  hintMode,
  character,
  lessonContext,
  isEnglishCopy,
  configOverride,
  lessonRandomChordOverrides,
  lessonProductionHintOverrides,
  onLessonClear,
  onBack,
}) => {
  const stageDefinition = useMemo(() => balloonRushToStageDefinition(stage), [stage]);
  const config = useMemo(
    () => configOverride ?? balloonRushDifficultyConfig(stage),
    [configOverride, stage],
  );
  const lessonRuntime = useMemo(() => balloonRushLessonRuntime(stage), [stage]);
  const scenarioOverrides = useMemo(
    () => balloonRushScenarioOverrides(stage, hintMode),
    [stage, hintMode],
  );

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
      lessonRandomChordOverrides={lessonRandomChordOverrides}
      lessonProductionHintOverrides={lessonProductionHintOverrides}
      isLessonMode={lessonContext !== null}
      hintMode={hintMode}
      onLessonStageClear={onLessonClear}
      initialScenarioOverrides={scenarioOverrides}
      scenarioMode
      embeddedFullHeight
    />
  );
};

export default BalloonRushGameScreen;
