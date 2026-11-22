import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaChevronLeft } from 'react-icons/fa';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { DefenseGameScreen } from '@/components/defense/DefenseGameScreen';
import {
  DefenseTutorialInputChoice,
  DefenseTutorialInputPanel,
} from '@/components/defense/tutorial/DefenseTutorialInputPanel';
import {
  buildDefaultTutorialNotationFromStore,
  DefenseTutorialSetup,
} from '@/components/defense/tutorial/DefenseTutorialSetup';
import {
  DefenseTutorialClearModal,
  type DefenseTutorialSaveStatus,
} from '@/components/defense/tutorial/DefenseTutorialClearModal';
import { buildDefenseTutorialPhrase } from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
  dismissDefenseTutorialClearModal,
  hasClearedDefenseTutorial,
  markDefenseTutorialCompletionSaved,
  markDefenseTutorialPhraseSucceeded,
  retreatDefenseTutorialScreen,
  selectDefenseTutorialInputMethod,
  shouldSaveCompletionOnExit,
  updateDefenseTutorialNotation,
  type DefenseTutorialSessionState,
} from '@/game/defense/tutorial/defenseTutorialState';
import {
  formatTutorialNotationLabel,
  formatTutorialPlaySubtitle,
  resolveTutorialClef,
} from '@/game/defense/tutorial/defenseTutorialNotation';
import type { DefenseDifficulty } from '@/game/defense/defenseTypes';
import { DEFENSE_TUTORIAL_INPUT_SETUP_V1 } from '@/game/defense/defenseTypes';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { isLowRegisterNotationInstrument } from '@/utils/notationInstrument';
import { cn } from '@/utils/cn';
import type { InputMethod } from '@/types';
import { recordPlayMapNodeClear } from '@/platform/supabasePlayMap';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import type { ClearConditions } from '@/types';

export interface DefenseTutorialLessonContext {
  readonly lessonId: string;
  readonly lessonSongId: string;
  readonly clearConditions: ClearConditions | Record<string, unknown>;
}

interface DefenseTutorialProps {
  readonly playMapNodeId?: string;
  readonly lessonContext?: DefenseTutorialLessonContext | null;
  readonly onExit: (cleared: boolean) => void;
}

const tutorialDifficulty: DefenseDifficulty = {
  level: 1,
  enemyHp: 1,
  spawnIntervalSec: 4,
  maxEnemies: 2,
  enemySpeedPxPerSec: 60,
  enemyDamage: 1,
  attackIntervalSec: 999,
  attackRangePx: 48,
};

export const DefenseTutorial: React.FC<DefenseTutorialProps> = ({
  playMapNodeId,
  lessonContext = null,
  onExit,
}) => {
  const profile = useAuthStore((state) => state.profile);
  const geoCountry = useGeoStore((state) => state.country);
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const updateNotationInstrument = useAuthStore((state) => state.updateNotationInstrument);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });

  const [session, setSession] = useState<DefenseTutorialSessionState>(() => (
    createDefenseTutorialSessionState(
      buildDefaultTutorialNotationFromStore(
        settings.notationInstrumentId,
        settings.notationClefOverride,
        settings.notationTranspositionOverride,
      ),
    )
  ));
  const [playNonce, setPlayNonce] = useState(0);
  const [saveStatus, setSaveStatus] = useState<DefenseTutorialSaveStatus>('idle');
  const [isExiting, setIsExiting] = useState(false);
  const sessionRef = useRef(session);
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  const saveStartedRef = useRef(false);
  const exitingRef = useRef(false);

  sessionRef.current = session;

  const inputSetupMethod = session.screen === 'inputSetup' ? session.inputMethod : null;
  const inputMonitor = useStandaloneNoteInput({
    enabled: inputSetupMethod === 'midi' || inputSetupMethod === 'voice',
    inputMethod: inputSetupMethod ?? settings.inputMethod,
    onNoteOn: () => undefined,
    playMidiSound: false,
    trackDetectedNoteLabel: true,
  });

  const phraseBuild = useMemo(
    () => buildDefenseTutorialPhrase(session.notation),
    [session.notation],
  );

  const notationLabel = useMemo(
    () => formatTutorialNotationLabel(session.notation, isEnglishCopy),
    [session.notation, isEnglishCopy],
  );

  const persistCompletion = useCallback(async (): Promise<boolean> => {
    const current = sessionRef.current;
    if (!shouldSaveCompletionOnExit(current)) {
      return current.completionSaved;
    }
    setSaveStatus('saving');
    try {
      if (playMapNodeId) {
        await recordPlayMapNodeClear(playMapNodeId, {});
      }
      if (lessonContext) {
        await updateLessonRequirementProgress(
          lessonContext.lessonId,
          lessonContext.lessonSongId,
          'S',
          lessonContext.clearConditions,
          { sourceType: 'defense', lessonSongId: lessonContext.lessonSongId },
        );
      }
      sessionRef.current = markDefenseTutorialCompletionSaved(sessionRef.current);
      setSession((prev) => markDefenseTutorialCompletionSaved(prev));
      setSaveStatus('saved');
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    }
  }, [lessonContext, playMapNodeId]);

  useEffect(() => {
    if (!session.clearModalVisible || session.completionSaved || saveStartedRef.current) {
      return;
    }
    if (!session.phraseSucceeded) {
      return;
    }
    saveStartedRef.current = true;
    const task = persistCompletion().then((saved) => {
      if (!saved) {
        saveStartedRef.current = false;
      }
    }).finally(() => {
      saveInFlightRef.current = null;
    });
    saveInFlightRef.current = task;
    void task;
  }, [session.clearModalVisible, session.phraseSucceeded, session.completionSaved, persistCompletion]);

  const persistNotationSettings = useCallback((notation: typeof session.notation) => {
    updateSettings({
      notationInstrumentId: notation.notationInstrumentId,
      notationOctaveShift: notation.notationOctaveShift,
      notationClefOverride: notation.clefOverride,
      notationTranspositionOverride: notation.transpositionOverride,
      voiceLowRegister: isLowRegisterNotationInstrument(notation.notationInstrumentId),
    });
    void updateNotationInstrument(notation.notationInstrumentId);
  }, [updateNotationInstrument, updateSettings]);

  const finishExit = useCallback(async () => {
    if (exitingRef.current) {
      return;
    }
    exitingRef.current = true;
    setIsExiting(true);
    try {
      if (saveInFlightRef.current) {
        await saveInFlightRef.current;
      }
      if (shouldSaveCompletionOnExit(sessionRef.current)) {
        await persistCompletion();
      }
      onExit(hasClearedDefenseTutorial(sessionRef.current));
    } finally {
      exitingRef.current = false;
      setIsExiting(false);
    }
  }, [onExit, persistCompletion]);

  const handleExit = useCallback(() => {
    void finishExit();
  }, [finishExit]);

  const handleClearModalDone = useCallback(() => {
    void finishExit();
  }, [finishExit]);

  const handleKeepAdjusting = useCallback(() => {
    setPlayNonce((value) => value + 1);
    setSession((prev) => dismissDefenseTutorialClearModal(prev));
  }, []);

  const handleNotationConfirm = useCallback(() => {
    if (session.screen === 'notation') {
      setSession((prev) => advanceDefenseTutorialScreen(prev, 'notationConfirm'));
      return;
    }
    persistNotationSettings(session.notation);
    setSession((prev) => advanceDefenseTutorialScreen(prev, 'inputChoice'));
  }, [persistNotationSettings, session.notation, session.screen]);

  const handleSelectInput = useCallback((method: InputMethod) => {
    updateSettings({ inputMethod: method });
    setSession((prev) => selectDefenseTutorialInputMethod(
      advanceDefenseTutorialScreen(prev, 'inputSetup'),
      method,
    ));
  }, [updateSettings]);

  const handleFallbackInput = useCallback((method: InputMethod) => {
    updateSettings({ inputMethod: method });
    setSession((prev) => selectDefenseTutorialInputMethod(prev, method));
  }, [updateSettings]);

  const handleStartPlay = useCallback(() => {
    setPlayNonce((value) => value + 1);
    setSession((prev) => advanceDefenseTutorialScreen(prev, 'play'));
  }, []);

  const handleRetreat = useCallback(() => {
    if (session.screen === 'play') {
      setPlayNonce((value) => value + 1);
    }
    setSession((prev) => {
      const next = retreatDefenseTutorialScreen(prev);
      return next ?? prev;
    });
  }, [session.screen]);

  const handlePhraseSucceeded = useCallback(() => {
    setSession((prev) => markDefenseTutorialPhraseSucceeded(prev));
  }, []);

  const isCleared = hasClearedDefenseTutorial(session);
  const canRetreat = session.screen !== 'notation' && !session.clearModalVisible;
  const setupScrollable = session.screen !== 'play' || session.clearModalVisible;
  const showPlayClearedBadge = session.screen === 'play'
    && isCleared
    && !session.clearModalVisible;
  const exitButtonLabel = isCleared
    ? (isEnglishCopy ? 'Done' : '完了')
    : (isEnglishCopy ? 'Exit' : '終了');

  const instruction = (() => {
    if (showPlayClearedBadge) {
      return isEnglishCopy
        ? 'Input setup complete. Tap Done when you are finished adjusting.'
        : '入力設定は完了です。調整が終わったら右上の「完了」を押してください。';
    }
    if (session.screen === 'play' && !session.clearModalVisible) {
      return isEnglishCopy
        ? 'Listen on Listen! bars, then play do, re, and mi on Play! bars (one octave up or down is OK).'
        : 'Listen! の小節で聞き、Play! の小節で譜面のド・レ・ミを演奏しましょう（1オクターブ上下も可）。';
    }
    return '';
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950 text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {canRetreat ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost shrink-0 px-2"
              aria-label={isEnglishCopy ? 'Back' : '戻る'}
              onClick={handleRetreat}
            >
              <FaChevronLeft />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-medium text-slate-200">{notationLabel}</div>
              {session.screen === 'play' && !session.clearModalVisible ? (
                showPlayClearedBadge ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                    <FaCheck className="text-emerald-300" aria-hidden />
                    {isEnglishCopy ? 'Cleared' : 'クリア済み'}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    {isEnglishCopy ? 'Not cleared' : '未クリア'}
                  </span>
                )
              ) : null}
            </div>
            {session.screen === 'play' && !session.clearModalVisible ? (
              <div className="truncate text-xs text-slate-400">
                {formatTutorialPlaySubtitle(phraseBuild.concertMidis, isEnglishCopy)}
              </div>
            ) : null}
          </div>
        </div>
        {!session.clearModalVisible ? (
          <button
            type="button"
            className={cn(
              'btn btn-sm shrink-0',
              isCleared
                ? 'border-emerald-500/50 bg-emerald-600 text-white hover:bg-emerald-500'
                : 'btn-ghost',
            )}
            disabled={isExiting}
            onClick={handleExit}
          >
            {exitButtonLabel}
          </button>
        ) : null}
      </header>

      <div className={setupScrollable ? 'flex min-h-0 flex-1 flex-col overflow-y-auto' : 'flex min-h-0 flex-1 flex-col'}>
        {session.screen === 'notation' || session.screen === 'notationConfirm' ? (
          <DefenseTutorialSetup
            settings={session.notation}
            isEnglishCopy={isEnglishCopy}
            mode={session.screen === 'notationConfirm' ? 'confirm' : 'edit'}
            onChange={(notation) => setSession((prev) => updateDefenseTutorialNotation(prev, notation))}
            onConfirm={handleNotationConfirm}
            onBackToEdit={session.screen === 'notationConfirm'
              ? () => setSession((prev) => advanceDefenseTutorialScreen(prev, 'notation'))
              : undefined}
          />
        ) : null}

        {session.screen === 'inputChoice' ? (
          <DefenseTutorialInputChoice isEnglishCopy={isEnglishCopy} onSelect={handleSelectInput} />
        ) : null}

        {session.screen === 'inputSetup' && session.inputMethod ? (
          <DefenseTutorialInputPanel
            inputMethod={session.inputMethod}
            isEnglishCopy={isEnglishCopy}
            midiDeviceId={settings.selectedMidiDevice}
            onMidiDeviceChange={(deviceId) => updateSettings({ selectedMidiDevice: deviceId })}
            isMidiConnected={inputMonitor.isConnected}
            backingVolume={settings.bgmVolume}
            onBackingVolumeChange={(value) => updateSettings({ bgmVolume: value })}
            midiVolume={settings.midiVolume}
            onMidiVolumeChange={(value) => updateSettings({ midiVolume: value })}
            detectedNoteLabel={inputMonitor.detectedNoteLabel}
            connectionStatus={
              inputMonitor.connectionStatus === 'ready'
                ? (isEnglishCopy ? 'Ready' : '準備完了')
                : inputMonitor.connectionStatus === 'requesting'
                  ? (isEnglishCopy ? 'Requesting microphone…' : 'マイク権限を確認しています…')
                  : inputMonitor.connectionStatus === 'error'
                    ? (isEnglishCopy ? 'Input unavailable' : '入力を利用できません')
                    : (isEnglishCopy ? 'Preparing input…' : '入力を準備しています…')
            }
            onReady={handleStartPlay}
            onFallbackInput={handleFallbackInput}
          />
        ) : null}

        {session.clearModalVisible ? (
          <DefenseTutorialClearModal
            isEnglishCopy={isEnglishCopy}
            fromLesson={lessonContext != null}
            fromPlayMap={playMapNodeId != null && lessonContext == null}
            saveStatus={saveStatus}
            onDone={handleClearModalDone}
            onKeepAdjusting={handleKeepAdjusting}
          />
        ) : null}

        {session.screen === 'play' && session.inputMethod && !session.clearModalVisible ? (
          <>
            {instruction ? (
              <p className="shrink-0 px-4 py-2 text-center text-sm text-slate-200">{instruction}</p>
            ) : null}
            <DefenseGameScreen
              key={playNonce}
              stage={phraseBuild.stage}
              difficulty={tutorialDifficulty}
              practiceMode={false}
              tutorialOptions={DEFENSE_TUTORIAL_INPUT_SETUP_V1}
              tutorialInputMethod={session.inputMethod}
              tutorialStaffGroups={phraseBuild.staffGroups}
              tutorialClef={resolveTutorialClef(session.notation)}
              tutorialConcertMidis={phraseBuild.concertMidis}
              onTutorialPhraseSucceeded={handlePhraseSucceeded}
              onExit={handleExit}
              suppressResultScreen
              onRetry={() => setPlayNonce((value) => value + 1)}
              onApplyPracticeModeAndRestart={() => { setPlayNonce((value) => value + 1); }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};