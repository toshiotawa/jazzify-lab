import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import { TUTORIAL_BOOTSTRAP_OVERRIDES } from '@/components/survival/scenario/survivalScenarioTypes';
import { TutorialAudioController } from '@/components/survival/tutorial/TutorialAudioController';
import { runOnboardingScript } from '@/components/onboarding/runOnboardingScript';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

import { OnboardingOverlays } from './OnboardingOverlays';

const TUTORIAL_CONFIG: DifficultyConfig = {
  difficulty: 'easy',
  displayName: 'Tutorial',
  description: 'チュートリアル',
  descriptionEn: 'Tutorial',
  allowedChords: [],
  enemySpawnRate: 3,
  enemySpawnCount: 2,
  enemyStatMultiplier: 0.5,
  expMultiplier: 0.5,
  itemDropRate: 0.1,
  bgmUrl: null,
};

export interface OnboardingExperienceProps {
  embeddedFullHeight?: boolean;
  showSignupCtaOnFinish?: boolean;
  showSkip?: boolean;
  onComplete?: () => void;
  ctaHref?: string;
  ctaLabel?: string;
}

/** LP など向けハードコード台本のみ（DB に依存しない） */
export const OnboardingExperience: React.FC<OnboardingExperienceProps> = ({
  embeddedFullHeight = false,
  showSignupCtaOnFinish = false,
  showSkip = true,
  onComplete,
  ctaHref = '/signup',
  ctaLabel,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const isEnglishCopy = shouldUseEnglishCopy({
    preferredLocale: profile?.preferred_locale,
    country: profile?.country,
    rank: profile?.rank,
  });

  const [characterText, setCharacterText] = useState('');
  const [narrationText, setNarrationText] = useState('');
  const [connectedDeviceLine, setConnectedDeviceLine] = useState<string | null>(null);
  const [showPillarCard, setShowPillarCard] = useState(false);
  const [pillarCaption, setPillarCaption] = useState<string | null>(null);
  const [pillarSystemImage, setPillarSystemImage] = useState<string | null>(null);
  const [showCta, setShowCta] = useState(false);
  const [showFinishedOverlay, setShowFinishedOverlay] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const audioRef = useRef<TutorialAudioController | null>(null);
  const runnerAbortRef = useRef<AbortController | null>(null);
  const runnerStartedRef = useRef(false);
  const userInputPulseRef = useRef(0);
  const slotBCompletionPulseRef = useRef(0);
  const midiNoteReceivedRef = useRef(false);

  const finish = useCallback(() => {
    runnerAbortRef.current?.abort();
    audioRef.current?.stopAllAudio();
    setShowFinishedOverlay(true);
    onComplete?.();
  }, [onComplete]);

  const onScenarioHandleReady = useCallback(
    (handle: SurvivalScenarioHandle) => {
      if (runnerStartedRef.current) return;
      runnerStartedRef.current = true;

      const run = async () => {
        const audio = new TutorialAudioController();
        audioRef.current = audio;
        await audio.ensureBgmSettings();

        const abort = new AbortController();
        runnerAbortRef.current = abort;

        const waitForMidiNoteOrTimeout = (seconds: number): Promise<boolean> => {
          midiNoteReceivedRef.current = false;
          return new Promise((resolve) => {
            const deadline = Date.now() + seconds * 1000;
            const tick = () => {
              if (abort.signal.aborted) {
                resolve(false);
                return;
              }
              if (midiNoteReceivedRef.current) {
                resolve(true);
                return;
              }
              if (Date.now() >= deadline) {
                resolve(false);
                return;
              }
              window.setTimeout(tick, 80);
            };
            tick();
          });
        };

        const waitForFirstInputNote = (): Promise<void> => {
          const start = userInputPulseRef.current;
          return new Promise((resolve) => {
            const check = () => {
              if (abort.signal.aborted || userInputPulseRef.current !== start) {
                resolve();
                return;
              }
              window.setTimeout(check, 40);
            };
            check();
          });
        };

        const waitForSlotBCompletion = (startPulse: number, seconds: number): Promise<boolean> => {
          const deadline = Date.now() + seconds * 1000;
          return new Promise((resolve) => {
            const tick = () => {
              if (abort.signal.aborted) {
                resolve(false);
                return;
              }
              if (slotBCompletionPulseRef.current !== startPulse) {
                resolve(true);
                return;
              }
              if (Date.now() >= deadline) {
                resolve(false);
                return;
              }
              window.setTimeout(tick, 40);
            };
            tick();
          });
        };

        await runOnboardingScript({
          isEnglishCopy,
          ui: {
            setCharacterText,
            setNarrationText,
            setConnectedDeviceLine,
            setShowPillarCard,
            setPillarCaption,
            setPillarSystemImage,
            setShowCta,
          },
          handle,
          audio,
          waitForMidiNoteOrTimeout,
          waitForFirstInputNote,
          waitForSlotBCompletion,
          onFinish: finish,
          signal: abort.signal,
        });
      };

      void run();
    },
    [isEnglishCopy, finish],
  );

  useEffect(
    () => () => {
      runnerAbortRef.current?.abort();
      audioRef.current?.dispose();
    },
    [],
  );

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const handleCta = useCallback(() => {
    finish();
  }, [finish]);

  return (
    <div
      className={
        embeddedFullHeight
          ? 'relative h-full min-h-0 w-full overflow-hidden bg-black'
          : 'relative fixed inset-0 z-50 bg-black'
      }
    >
      <SurvivalGameScreen
        key={sessionKey}
        difficulty="easy"
        config={TUTORIAL_CONFIG}
        stageDefinition={TUTORIAL_STAGE_DEFINITION}
        hintMode
        embeddedFullHeight={embeddedFullHeight}
        survivalTutorialLayout={embeddedFullHeight}
        scenarioMode
        initialScenarioOverrides={TUTORIAL_BOOTSTRAP_OVERRIDES}
        onScenarioHandleReady={onScenarioHandleReady}
        scenarioUserInputPulseRef={userInputPulseRef}
        scenarioSlotBCompletionPulseRef={slotBCompletionPulseRef}
        scenarioMidiNoteReceivedRef={midiNoteReceivedRef}
        onBackToSelect={() => finish()}
        onBackToMenu={() => finish()}
      />

      <OnboardingOverlays
        characterText={characterText}
        narrationText={narrationText}
        connectedDeviceLine={connectedDeviceLine}
        showPillarCard={showPillarCard}
        pillarCaption={pillarCaption}
        pillarSystemImage={pillarSystemImage}
        showCta={showCta && !showFinishedOverlay}
        showSkip={showSkip && !showFinishedOverlay}
        isEnglishCopy={isEnglishCopy}
        onCta={handleCta}
        onSkip={handleSkip}
        ctaLabel={ctaLabel}
      />

      {showFinishedOverlay && showSignupCtaOnFinish ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/80 px-6">
          <p className="text-center text-lg font-bold text-white">
            {isEnglishCopy ? 'Ready to start your journey?' : '冒険を始めますか？'}
          </p>
          <Link
            to={ctaHref}
            className="rounded-xl bg-purple-600 px-8 py-3 font-bold text-white hover:bg-purple-500"
          >
            {ctaLabel ?? (isEnglishCopy ? 'Sign up free' : '無料で始める')}
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowFinishedOverlay(false);
              runnerStartedRef.current = false;
              setSessionKey((k) => k + 1);
            }}
            className="text-sm text-gray-400 underline"
          >
            {isEnglishCopy ? 'Play again' : 'もう一度'}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default OnboardingExperience;
