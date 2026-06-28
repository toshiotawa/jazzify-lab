import React, { useMemo, useState, useEffect } from 'react';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { getEarTrainingSettingsModalCopy } from '@/utils/earTrainingUiCopy';
import {
  clampPracticeTransposeOffset,
  formatPracticeTransposeOffsetLabel,
  getPracticeTransposeTargetKeyName,
  PRACTICE_TRANSPOSE_MAX,
  PRACTICE_TRANSPOSE_MIN,
} from '@/utils/earTrainingPracticeTranspose';
import {
  clampPracticeSpeedPercent,
  formatPracticeSpeedPercentLabel,
  PRACTICE_SPEED_MAX_PERCENT,
  PRACTICE_SPEED_MIN_PERCENT,
} from '@/utils/earTrainingPracticeSpeed';
import {
  clampEarTrainingOsmdTimingAdjustmentMs,
  formatEarTrainingOsmdTimingAdjustmentLabel,
  OSMD_TIMING_ADJUSTMENT_MS_MAX,
  OSMD_TIMING_ADJUSTMENT_MS_MIN,
  OSMD_TIMING_ADJUSTMENT_MS_STEP,
} from '@/utils/earTrainingOsmdTimingAdjustment';

interface EarTrainingSettingsModalProps {
  isOpen: boolean;
  isEnglishCopy: boolean;
  onClose: () => void;
  midiDeviceId: string | null;
  onMidiDeviceChange: (deviceId: string | null) => void;
  isMidiConnected: boolean;
  practiceRunMode?: {
    practiceMode: boolean;
    onApplyPracticeModeAndRestart: (nextPracticeMode: boolean) => void;
  };
  practiceTranspose?: {
    enabled: boolean;
    practiceMode: boolean;
    originalKeyFifths: number;
    originalKeyName: string;
    appliedOffset: number;
  };
  practiceSpeed?: {
    practiceMode: boolean;
    appliedSpeedPercent: number;
    onApplyAndRestart: (params: { speedPercent: number; transposeOffset: number }) => void;
  };
  osmdTimingAdjustment?: {
    appliedOffsetMs: number;
    onChange: (offsetMs: number) => void;
  };
}

const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={event => onChange(Number(event.target.value))}
      className="range range-primary range-sm"
    />
  </label>
);

const EarTrainingSettingsModal: React.FC<EarTrainingSettingsModalProps> = ({
  isOpen,
  isEnglishCopy,
  onClose,
  midiDeviceId,
  onMidiDeviceChange,
  isMidiConnected,
  practiceRunMode,
  practiceTranspose,
  practiceSpeed,
  osmdTimingAdjustment,
}) => {
  const { settings, updateSettings } = useGameStore();
  const ui = useMemo(() => getEarTrainingSettingsModalCopy(isEnglishCopy), [isEnglishCopy]);
  const [practiceDraft, setPracticeDraft] = useState(practiceRunMode?.practiceMode ?? false);
  const [transposeDraft, setTransposeDraft] = useState(practiceTranspose?.appliedOffset ?? 0);
  const [speedDraft, setSpeedDraft] = useState(practiceSpeed?.appliedSpeedPercent ?? 100);
  const [timingAdjustmentDraft, setTimingAdjustmentDraft] = useState(
    osmdTimingAdjustment?.appliedOffsetMs ?? 0,
  );

  useEffect(() => {
    if (isOpen && practiceRunMode) {
      setPracticeDraft(practiceRunMode.practiceMode);
    }
  }, [isOpen, practiceRunMode?.practiceMode]);

  useEffect(() => {
    if (isOpen && practiceTranspose) {
      setTransposeDraft(practiceTranspose.appliedOffset);
    }
  }, [isOpen, practiceTranspose?.appliedOffset]);

  useEffect(() => {
    if (isOpen && practiceSpeed) {
      setSpeedDraft(practiceSpeed.appliedSpeedPercent);
    }
  }, [isOpen, practiceSpeed?.appliedSpeedPercent]);

  useEffect(() => {
    if (isOpen && osmdTimingAdjustment) {
      setTimingAdjustmentDraft(osmdTimingAdjustment.appliedOffsetMs);
    }
  }, [isOpen, osmdTimingAdjustment?.appliedOffsetMs]);

  const playbackControlsActive = Boolean(practiceSpeed?.practiceMode);
  const transposeTargetKeyName = practiceTranspose
    ? getPracticeTransposeTargetKeyName(practiceTranspose.originalKeyFifths, transposeDraft)
    : '—';
  const playbackSectionTitle = practiceTranspose?.enabled
    ? (isEnglishCopy ? 'Transpose & Speed' : '移調 & 速度変更')
    : (isEnglishCopy ? 'Speed' : '速度変更');

  if (!isOpen) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- オーバーレイ押下で閉じるモーダル背景
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ui.dialogAriaLabel}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{ui.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label={ui.closeAriaLabel}
          >
            {ui.close}
          </button>
        </div>

        <div className="max-h-[calc(100dvh-8rem)] space-y-5 overflow-y-auto pr-1">
          {practiceRunMode ? (
            <section className="rounded-xl border border-cyan-600/40 bg-cyan-950/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-cyan-100">
                {isEnglishCopy ? 'Practice / Performance' : '練習 / 本番'}
              </h3>
              <div className="mb-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input
                    type="radio"
                    name="ear-training-settings-run-mode"
                    checked={!practiceDraft}
                    onChange={() => setPracticeDraft(false)}
                    className="radio radio-xs radio-info"
                  />
                  {isEnglishCopy ? 'Performance' : '本番'}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                  <input
                    type="radio"
                    name="ear-training-settings-run-mode"
                    checked={practiceDraft}
                    onChange={() => setPracticeDraft(true)}
                    className="radio radio-xs radio-info"
                  />
                  {isEnglishCopy ? 'Practice' : '練習'}
                </label>
              </div>
              <button
                type="button"
                className="btn btn-info btn-sm w-full font-sans"
                onClick={() => {
                  practiceRunMode.onApplyPracticeModeAndRestart(practiceDraft);
                  onClose();
                }}
              >
                {isEnglishCopy ? 'Restart from beginning' : '最初から挑戦'}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                {isEnglishCopy
                  ? 'Practice mode does not save lesson progress.'
                  : '練習モードではレッスン進捗は保存されません。'}
              </p>
              {practiceSpeed ? (
                <p className="mt-2 text-xs text-cyan-200/80">
                  {isEnglishCopy
                    ? 'In practice mode, you can change playback speed (and transpose when enabled for the task). Not available in performance mode.'
                    : '練習モードでは再生速度を変更できます（移調を有効にした課題ではキーも変更可能。本番では利用できません）。'}
                </p>
              ) : practiceTranspose?.enabled ? (
                <p className="mt-2 text-xs text-cyan-200/80">
                  {isEnglishCopy
                    ? 'In practice mode, you can transpose this stage when transposition is enabled for the task (not available in performance mode).'
                    : '練習モードでは、移調を有効にした課題でキーを変更できます（本番では利用できません）。'}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-blue-700/40 bg-blue-950/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-100">{ui.midiHeading}</h3>
            <MidiDeviceSelector
              value={midiDeviceId}
              onChange={onMidiDeviceChange}
              className="w-full"
            />
            <p className="mt-2 text-xs text-slate-300">
              {isMidiConnected ? ui.midiConnected : ui.midiDisconnected}
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">{ui.volumeHeading}</h3>
            <SliderRow
              label={ui.master}
              value={settings.masterVolume}
              onChange={value => updateSettings({ masterVolume: value })}
            />
            <SliderRow
              label={ui.phraseAudio}
              value={settings.musicVolume}
              onChange={value => updateSettings({ musicVolume: value })}
            />
            <SliderRow
              label={ui.inputPiano}
              value={settings.midiVolume}
              onChange={value => updateSettings({ midiVolume: value })}
            />
            <SliderRow
              label={ui.soundEffects}
              value={settings.soundEffectVolume}
              onChange={value => updateSettings({ soundEffectVolume: value })}
            />
          </section>

          {osmdTimingAdjustment ? (
            <section className="rounded-xl border border-amber-600/40 bg-amber-950/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-100">
                {ui.osmdTimingAdjustmentHeading}
              </h3>
              <p className="mb-3 text-xs text-slate-300">
                {ui.osmdTimingAdjustmentDescription}
              </p>
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                  <span>{isEnglishCopy ? 'Offset' : '補正量'}</span>
                  <span>{formatEarTrainingOsmdTimingAdjustmentLabel(timingAdjustmentDraft)}</span>
                </div>
                <input
                  type="range"
                  min={OSMD_TIMING_ADJUSTMENT_MS_MIN}
                  max={OSMD_TIMING_ADJUSTMENT_MS_MAX}
                  step={OSMD_TIMING_ADJUSTMENT_MS_STEP}
                  value={timingAdjustmentDraft}
                  onChange={event => {
                    const next = clampEarTrainingOsmdTimingAdjustmentMs(Number(event.target.value));
                    setTimingAdjustmentDraft(next);
                    osmdTimingAdjustment.onChange(next);
                  }}
                  className="range range-warning range-sm"
                />
              </label>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{OSMD_TIMING_ADJUSTMENT_MS_MIN}ms {ui.osmdTimingAdjustmentEarlier}</span>
                <span>0ms</span>
                <span>{OSMD_TIMING_ADJUSTMENT_MS_MAX}ms {ui.osmdTimingAdjustmentLater}</span>
              </div>
            </section>
          ) : null}

          {practiceSpeed ? (
            <section className="rounded-xl border border-violet-600/40 bg-violet-950/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-violet-100">
                {playbackSectionTitle}
              </h3>
              <label className="block">
                <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                  <span>{isEnglishCopy ? 'Speed' : '速度'}</span>
                  <span>{formatPracticeSpeedPercentLabel(speedDraft)}</span>
                </div>
                <input
                  type="range"
                  min={PRACTICE_SPEED_MIN_PERCENT}
                  max={PRACTICE_SPEED_MAX_PERCENT}
                  step={1}
                  value={speedDraft}
                  disabled={!playbackControlsActive}
                  onChange={event => setSpeedDraft(
                    clampPracticeSpeedPercent(Number(event.target.value)),
                  )}
                  className="range range-secondary range-sm disabled:opacity-40"
                />
              </label>
              {practiceTranspose?.enabled ? (
                <>
                  <p className="mb-3 mt-3 text-xs text-slate-300">
                    {isEnglishCopy
                      ? `Original key: ${practiceTranspose.originalKeyName} (0)`
                      : `原調: ${practiceTranspose.originalKeyName} (0)`}
                  </p>
                  <label className="block">
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                      <span>{isEnglishCopy ? 'Semitones' : '半音'}</span>
                      <span>
                        {transposeDraft === 0
                          ? practiceTranspose.originalKeyName
                          : `${transposeTargetKeyName} (${formatPracticeTransposeOffsetLabel(transposeDraft)})`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={PRACTICE_TRANSPOSE_MIN}
                      max={PRACTICE_TRANSPOSE_MAX}
                      step={1}
                      value={transposeDraft}
                      disabled={!playbackControlsActive}
                      onChange={event => setTransposeDraft(
                        clampPracticeTransposeOffset(Number(event.target.value)),
                      )}
                      className="range range-secondary range-sm disabled:opacity-40"
                    />
                  </label>
                </>
              ) : null}
              {!playbackControlsActive ? (
                <p className="mt-2 text-xs text-slate-400">
                  {isEnglishCopy
                    ? 'Switch to practice mode to change playback settings.'
                    : '再生設定を変更するには練習モードに切り替えてください。'}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-3 w-full font-sans disabled:opacity-40"
                disabled={!playbackControlsActive}
                onClick={() => {
                  practiceSpeed.onApplyAndRestart({
                    speedPercent: clampPracticeSpeedPercent(speedDraft),
                    transposeOffset: clampPracticeTransposeOffset(transposeDraft),
                  });
                  onClose();
                }}
              >
                {isEnglishCopy ? 'Apply and restart' : '適用して最初から'}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                {isEnglishCopy
                  ? 'Applies to phrase audio and sheet music (when transposed), then restarts from the beginning.'
                  : 'フレーズ音源と楽譜（移調時）に反映し、最初から再読み込みします。'}
              </p>
            </section>
          ) : practiceTranspose?.enabled ? (
            <section className="rounded-xl border border-violet-600/40 bg-violet-950/30 p-4">
              <p className="text-xs text-cyan-200/80">
                {isEnglishCopy
                  ? 'In practice mode, you can transpose this stage when transposition is enabled for the task (not available in performance mode).'
                  : '練習モードでは、移調を有効にした課題でキーを変更できます（本番では利用できません）。'}
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EarTrainingSettingsModal;
