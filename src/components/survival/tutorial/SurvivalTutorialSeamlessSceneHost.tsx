import React, { useMemo, useRef, useState } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  buildDifficultyConfigForSurvivalV3,
  buildStageDefinitionFromSurvivalV3Content,
  buildTutorialPhraseDefinitionFromV3Block,
} from '@/components/survival/tutorial/buildTutorialStageFromSurvivalV3Content';
import { SurvivalTutorialDemoPlayScene } from '@/components/survival/tutorial/SurvivalTutorialDemoPlayScene';
import { SurvivalTutorialDialogueScene } from '@/components/survival/tutorial/SurvivalTutorialDialogueScene';
import type { SurvivalTutorialDemoStaffSnapshot } from '@/components/survival/tutorial/SurvivalTutorialDemoStaff';
import { SurvivalTutorialPhraseBattleScene } from '@/components/survival/tutorial/SurvivalTutorialPhraseBattleScene';
import type { SurvivalTutorialSharedRuntime } from '@/components/survival/tutorial/survivalTutorialSharedRuntime';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import { mergeSurvivalTutorialV3Baseline } from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import {
  survivalTutorialV3ContentIsPhraseBlock,
  type SurvivalTutorialScriptPayloadV3,
} from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';

const FALLBACK_CONFIG = {
  difficulty: 'easy' as const,
  displayName: 'Tutorial',
  description: '',
  descriptionEn: '',
  allowedChords: [] as string[],
  enemySpawnRate: 3,
  enemySpawnCount: 2,
  enemyStatMultiplier: 0.5,
  expMultiplier: 0.5,
  itemDropRate: 0.1,
  bgmUrl: null as string | null,
};

type SeamlessScene = Extract<
  SurvivalTutorialScriptPayloadV3['scenes'][number],
  { type: 'dialogue_only' | 'demo_play' | 'phrase_battle' }
>;

interface SurvivalTutorialSeamlessSceneHostProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: SeamlessScene;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
  readonly nextSceneIsFinish?: boolean;
  readonly sceneFrozen?: boolean;
}

/** V4 S1/S2/S3 用。ゲーム画面を一度だけマウントし、シーン制御だけを差し替える。 */
export const SurvivalTutorialSeamlessSceneHost: React.FC<
  SurvivalTutorialSeamlessSceneHostProps
> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
  nextSceneIsFinish = false,
  sceneFrozen = false,
}) => {
  const [scenarioHandle, setScenarioHandle] = useState<SurvivalScenarioHandle | null>(null);
  const tutorialJajiiSpeechTextRef = useRef('');
  const tutorialFaiSpeechTextRef = useRef('');
  const demoStaffSnapshotRef = useRef<SurvivalTutorialDemoStaffSnapshot | null>(null);
  const phraseFullLoopPulseRef = useRef(0);
  const phraseChordCompletePulseRef = useRef(0);
  const userInputPulseRef = useRef(0);
  const slotBCompletionPulseRef = useRef(0);
  const midiNoteReceivedRef = useRef(false);

  const phraseBlock = useMemo(() => {
    if (scene.type !== 'phrase_battle') return null;
    const block = script.content[scene.contentRef];
    return block && survivalTutorialV3ContentIsPhraseBlock(block) ? block : null;
  }, [scene, script.content]);
  const stageDefinition = useMemo(
    () => (phraseBlock ? buildStageDefinitionFromSurvivalV3Content(phraseBlock) : TUTORIAL_STAGE_DEFINITION),
    [phraseBlock],
  );
  const phraseDefinition = useMemo(
    () => (phraseBlock ? buildTutorialPhraseDefinitionFromV3Block(phraseBlock) : null),
    [phraseBlock],
  );
  const config = useMemo(() => {
    if (!phraseBlock) return FALLBACK_CONFIG;
    const built = buildDifficultyConfigForSurvivalV3(stageDefinition, phraseBlock);
    return { ...built, allowedChords: [...built.allowedChords] };
  }, [phraseBlock, stageDefinition]);
  const runtime = useMemo<SurvivalTutorialSharedRuntime>(
    () => ({
      scenarioHandle,
      tutorialJajiiSpeechTextRef,
      tutorialFaiSpeechTextRef,
      demoStaffSnapshotRef,
      phraseFullLoopPulseRef,
      phraseChordCompletePulseRef,
      userInputPulseRef,
      slotBCompletionPulseRef,
      midiNoteReceivedRef,
    }),
    [scenarioHandle],
  );
  const hasJajii =
    scene.type === 'phrase_battle'
    || (scene.type === 'dialogue_only' && scene.lines.some((line) => line.speaker === 'jajii'))
    || (scene.type === 'demo_play'
      && [...(scene.introLines ?? []), ...scene.lines].some((line) => line.speaker === 'jajii'));

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <SurvivalGameScreen
        difficulty="easy"
        hintMode
        stageDefinition={stageDefinition}
        config={config}
        embeddedFullHeight={embeddedFullHeight}
        survivalTutorialLayout={embeddedFullHeight}
        scenarioMode
        initialScenarioOverrides={mergeSurvivalTutorialV3Baseline(script)}
        tutorialDialogueJajii={hasJajii}
        tutorialJajiiSpeechTextRef={tutorialJajiiSpeechTextRef}
        tutorialFaiSpeechTextRef={tutorialFaiSpeechTextRef}
        tutorialDemoStaffSnapshotRef={demoStaffSnapshotRef}
        tutorialPhraseInlineDefinition={phraseDefinition}
        scenarioPhraseFullLoopPulseRef={phraseFullLoopPulseRef}
        scenarioPhraseChordCompletePulseRef={phraseChordCompletePulseRef}
        scenarioUserInputPulseRef={userInputPulseRef}
        scenarioSlotBCompletionPulseRef={slotBCompletionPulseRef}
        scenarioMidiNoteReceivedRef={midiNoteReceivedRef}
        onScenarioHandleReady={setScenarioHandle}
        onBackToSelect={bindings.onExit}
        onBackToMenu={bindings.onExit}
      />

      {scene.type === 'dialogue_only' ? (
        <SurvivalTutorialDialogueScene
          script={script}
          scene={scene}
          bindings={bindings}
          embeddedFullHeight={embeddedFullHeight}
          onSceneComplete={onSceneComplete}
          nextSceneIsFinish={nextSceneIsFinish}
          sharedRuntime={runtime}
          sceneFrozen={sceneFrozen}
        />
      ) : null}
      {scene.type === 'demo_play' ? (
        <SurvivalTutorialDemoPlayScene
          script={script}
          scene={scene}
          bindings={bindings}
          embeddedFullHeight={embeddedFullHeight}
          onSceneComplete={onSceneComplete}
          sharedRuntime={runtime}
          sceneFrozen={sceneFrozen}
        />
      ) : null}
      {scene.type === 'phrase_battle' ? (
        <SurvivalTutorialPhraseBattleScene
          script={script}
          scene={scene}
          bindings={bindings}
          embeddedFullHeight={embeddedFullHeight}
          onSceneComplete={onSceneComplete}
          sharedRuntime={runtime}
          sceneFrozen={sceneFrozen}
        />
      ) : null}
    </div>
  );
};
