import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
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
  buildDefenseTutorialPhrase,
  DEFENSE_TUTORIAL_AUDIO_URL,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import {
  advanceDefenseTutorialScreen,
  createDefenseTutorialSessionState,
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
import type { InputMethod } from '@/types';
import { recordPlayMapNodeClear } from '@/platform/supabasePlayMap';

interface DefenseTutorialProps {
  readonly playMapNodeId?: string;
  readonly onExit: () => void;
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

  const inputSetupMethod = session.screen === 'inputSetup' ? session.inputMethod : null;
  const inputMonitor = useStandaloneNoteInput({
    enabled: inputSetupMethod === 'midi' || inputSetupMethod === 'voice',
    inputMethod: inputSetupMethod ?? settings.inputMethod,
    voiceFastResponse: settings.voiceFastResponse ?? false,
    voiceLowRegister: settings.voiceLowRegister ?? false,
    onNoteOn: () => undefined,
    playMidiSound: false,
  });

  const phraseBuild = useMemo(
    () => buildDefenseTutorialPhrase(session.notation, DEFENSE_TUTORIAL_AUDIO_URL),
    [session.notation],
  );

  const notationLabel = useMemo(
    () => formatTutorialNotationLabel(session.notation, isEnglishCopy),
    [session.notation, isEnglishCopy],
  );

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

  const handleExit = useCallback(async () => {
    if (playMapNodeId && shouldSaveCompletionOnExit(session)) {
      try {
        await recordPlayMapNodeClear(playMapNodeId, {});
        setSession((prev) => markDefenseTutorialCompletionSaved(prev));
      } catch {
        /* keep local success; user can retry later */
      }
    }
    onExit();
  }, [onExit, playMapNodeId, session]);

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

  const canRetreat = session.screen !== 'notation';
  const setupScrollable = session.screen !== 'play';

  const instruction = (() => {
    if (session.phraseSucceeded) {
      return isEnglishCopy
        ? 'Three notes were recognized. Tap Exit when you are done adjusting.'
        : '3音が判定されました。設定ができたら右上の「終了」を押してください。';
    }
    if (session.screen === 'play') {
      return isEnglishCopy
        ? 'Play do, re, and mi as shown on the staff. Timing is not judged. One octave up or down is OK.'
        : '譜面のド・レ・ミを演奏しましょう。タイミングは判定しません。1オクターブ上や下でも大丈夫です。';
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
            <div className="truncate text-sm font-medium text-slate-200">{notationLabel}</div>
            {session.screen === 'play' ? (
              <div className="truncate text-xs text-slate-400">
                {formatTutorialPlaySubtitle(phraseBuild.concertMidis, isEnglishCopy)}
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={() => { void handleExit(); }}>
          {isEnglishCopy ? 'Exit' : '終了'}
        </button>
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
            voiceSensitivity={settings.voiceSensitivity}
            voiceFastResponse={settings.voiceFastResponse ?? false}
            voiceLowRegister={settings.voiceLowRegister ?? false}
            onVoiceSensitivityChange={(value) => updateSettings({ voiceSensitivity: value })}
            onVoiceFastResponseChange={(value) => updateSettings({ voiceFastResponse: value })}
            onVoiceLowRegisterChange={(value) => updateSettings({ voiceLowRegister: value })}
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

        {session.screen === 'play' && session.inputMethod ? (
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
              onExit={() => { void handleExit(); }}
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
