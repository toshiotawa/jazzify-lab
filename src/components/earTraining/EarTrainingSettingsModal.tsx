import React, { useMemo, useState, useEffect } from 'react';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';
import { getEarTrainingSettingsModalCopy } from '@/utils/earTrainingUiCopy';

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
}) => {
  const { settings, updateSettings } = useGameStore();
  const ui = useMemo(() => getEarTrainingSettingsModalCopy(isEnglishCopy), [isEnglishCopy]);
  const [practiceDraft, setPracticeDraft] = useState(practiceRunMode?.practiceMode ?? false);

  useEffect(() => {
    if (isOpen && practiceRunMode) {
      setPracticeDraft(practiceRunMode.practiceMode);
    }
  }, [isOpen, practiceRunMode]);

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
        </div>
      </div>
    </div>
  );
};

export default EarTrainingSettingsModal;
