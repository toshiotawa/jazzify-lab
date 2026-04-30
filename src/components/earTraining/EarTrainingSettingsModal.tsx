import React from 'react';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';

interface EarTrainingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  midiDeviceId: string | null;
  onMidiDeviceChange: (deviceId: string | null) => void;
  isMidiConnected: boolean;
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
  onClose,
  midiDeviceId,
  onMidiDeviceChange,
  isMidiConnected,
}) => {
  const { settings, updateSettings } = useGameStore();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="耳コピバトル設定"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">耳コピバトル設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-300 hover:bg-slate-800 hover:text-white"
            aria-label="設定を閉じる"
          >
            閉じる
          </button>
        </div>

        <div className="max-h-[calc(100dvh-8rem)] space-y-5 overflow-y-auto pr-1">
          <section className="rounded-xl border border-blue-700/40 bg-blue-950/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-blue-100">MIDIデバイス</h3>
            <MidiDeviceSelector
              value={midiDeviceId}
              onChange={onMidiDeviceChange}
              className="w-full"
            />
            <p className="mt-2 text-xs text-slate-300">
              {isMidiConnected ? '接続済み' : '未接続または未選択'}
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">音量</h3>
            <SliderRow
              label="マスター"
              value={settings.masterVolume}
              onChange={value => updateSettings({ masterVolume: value })}
            />
            <SliderRow
              label="フレーズ音源"
              value={settings.musicVolume}
              onChange={value => updateSettings({ musicVolume: value })}
            />
            <SliderRow
              label="入力ピアノ"
              value={settings.midiVolume}
              onChange={value => updateSettings({ midiVolume: value })}
            />
            <SliderRow
              label="効果音"
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
