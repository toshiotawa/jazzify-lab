import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import type { EarTrainingStage } from '@/types';

import { resolveTutorialContentStage } from './buildTutorialStageFromContent';
import { EarTrainingTutorialDialogueScene } from './EarTrainingTutorialDialogueScene';
import type {
  EarTrainingTutorialScene,
  EarTrainingTutorialScriptPayload,
} from './earTrainingTutorialScriptTypes';
import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';

const EarTrainingChordVoicingScreen = React.lazy(
  () => import('@/components/earTraining/EarTrainingChordVoicingScreen'),
);
const EarTrainingChordQuizScreen = React.lazy(
  () => import('@/components/earTraining/EarTrainingChordQuizScreen'),
);
const EarTrainingChordOSMDScreen = React.lazy(
  () => import('@/components/earTraining/EarTrainingChordOSMDScreen'),
);

interface EarTrainingTutorialSceneHostProps {
  script: EarTrainingTutorialScriptPayload;
  scene: EarTrainingTutorialScene;
  sceneIndex: number;
  enemy: SurvivalCharacterRow | null;
  bindings: EarTrainingTutorialBindings;
  isEnglishCopy: boolean;
  onSceneComplete: () => void;
}

export const EarTrainingTutorialSceneHost: React.FC<EarTrainingTutorialSceneHostProps> = ({
  script,
  scene,
  enemy,
  bindings,
  isEnglishCopy,
  onSceneComplete,
}) => {
  const completedRef = useRef(false);

  const completeOnce = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    bindings.setCharacterText('');
    onSceneComplete();
  }, [bindings, onSceneComplete]);

  useEffect(() => {
    completedRef.current = false;
    bindings.setCharacterText('');
  }, [bindings]);

  const drumLoopUrl = script.audioTracks?.drum_loop?.url ?? '';

  const stage: EarTrainingStage | null = useMemo(() => {
    if (scene.type === 'dialogue_only' || scene.type === 'finish') {
      return null;
    }
    const built = resolveTutorialContentStage(script.content, scene.contentRef, isEnglishCopy);
    if (bindings.ui.keyboardHintsDefault) {
      built.show_keyboard_hints_in_battle = true;
    }
    return built;
  }, [bindings.ui.keyboardHintsDefault, scene, script.content]);

  if (scene.type === 'dialogue_only') {
    return (
      <EarTrainingTutorialDialogueScene
        scene={scene}
        bindings={bindings}
        drumLoopUrl={drumLoopUrl}
        onComplete={completeOnce}
      />
    );
  }

  if (scene.type === 'finish') {
    return null;
  }

  if (!stage) {
    return null;
  }

  if (scene.type === 'chord_voicing_self_paced') {
    return (
      <React.Suspense fallback={null}>
        <EarTrainingChordVoicingScreen
          stage={stage}
          enemy={enemy}
          lessonContext={null}
          initialPracticeMode={false}
          onLessonStageClear={async () => undefined}
          onBack={() => bindings.onExit()}
          tutorial={{
            scene,
            bindings,
            onSceneComplete: completeOnce,
          }}
        />
      </React.Suspense>
    );
  }

  if (scene.type === 'chord_quiz') {
    return (
      <React.Suspense fallback={null}>
        <EarTrainingChordQuizScreen
          stage={stage}
          enemy={enemy}
          lessonContext={null}
          initialPracticeMode={false}
          onLessonStageClear={async () => undefined}
          onBack={() => bindings.onExit()}
          tutorial={{
            scene,
            bindings,
            onSceneComplete: completeOnce,
          }}
        />
      </React.Suspense>
    );
  }

  if (scene.type === 'chord_osmd') {
    return (
      <React.Suspense fallback={null}>
        <EarTrainingChordOSMDScreen
          stage={stage}
          enemy={enemy}
          lessonContext={null}
          initialPracticeMode={false}
          onLessonStageClear={async () => undefined}
          onBack={() => bindings.onExit()}
          tutorial={{
            scene,
            bindings,
            onSceneComplete: completeOnce,
            drumLoopUrl,
          }}
        />
      </React.Suspense>
    );
  }

  return null;
};

export const showTutorialFinishCta = (
  script: EarTrainingTutorialScriptPayload,
  scene: EarTrainingTutorialScene,
): boolean => scene.type === 'finish' && (script.finish?.showCta ?? true);

export const tutorialFinishCtaLabel = (isEnglishCopy: boolean): string => (
  isEnglishCopy ? 'Complete' : '完了する'
);
