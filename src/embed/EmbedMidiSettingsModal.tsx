import React from 'react';
import { InputMethodSelector } from '@/components/ui/InputMethodSelector';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

interface EmbedMidiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMidiConnected: boolean;
}

export const EmbedMidiSettingsModal: React.FC<EmbedMidiSettingsModalProps> = ({
  isOpen,
  onClose,
  isMidiConnected,
}) => {
  const isEnglish = shouldUseEnglishCopy();
  const { settings, updateSettings } = useGameStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-white/15 bg-gray-900 p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="embed-midi-settings-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="embed-midi-settings-title" className="text-lg font-bold text-white">
              {isEnglish ? 'Input Settings' : '入力設定'}
            </h2>
            <p className="mt-1 text-xs text-white/60">
              {isEnglish
                ? 'Connect a MIDI keyboard or use voice input to play.'
                : 'MIDIキーボードまたは音声入力で演奏できます。'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            {isEnglish ? 'Close' : '閉じる'}
          </button>
        </div>

        <InputMethodSelector
          midiDeviceId={settings.selectedMidiDevice}
          onMidiDeviceChange={(id) => updateSettings({ selectedMidiDevice: id })}
          isMidiConnected={isMidiConnected}
          showMonophonicWarning
        />

        <p className="mt-3 text-xs text-white/50">
          {isEnglish
            ? 'You can also play using the on-screen keyboard without MIDI or voice input.'
            : 'MIDI・音声入力がなくても画面鍵盤でプレイできます。'}
        </p>
      </div>
    </div>
  );
};
