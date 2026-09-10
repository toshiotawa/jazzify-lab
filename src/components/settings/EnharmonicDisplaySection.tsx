import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';

interface EnharmonicDisplaySectionProps {
  isEnglishCopy: boolean;
}

export const EnharmonicDisplaySection: React.FC<EnharmonicDisplaySectionProps> = ({
  isEnglishCopy,
}) => {
  const simpleDisplayMode = useGameStore((state) => state.settings.simpleDisplayMode);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const updateSimpleEnharmonicDisplay = useAuthStore((state) => state.updateSimpleEnharmonicDisplay);

  const handleToggle = (enabled: boolean) => {
    updateSettings({ simpleDisplayMode: enabled });
    void updateSimpleEnharmonicDisplay(enabled);
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">
        {isEnglishCopy ? 'Enharmonic spelling' : '異名同音の簡略表示'}
      </h3>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={simpleDisplayMode}
          onChange={(event) => handleToggle(event.target.checked)}
          className="mt-0.5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium text-slate-100">
            {isEnglishCopy ? 'Use simplified spelling' : '簡略表示を使う'}
          </span>
          <span className="block text-xs text-slate-400">
            {isEnglishCopy
              ? 'Re-spell double sharps/flats and white-key accidentals (E#, B#, Fb, Cb) as natural notes on sheet music.'
              : '楽譜上のダブルシャープ・ダブルフラット、および白鍵の #/b（E#, B#, Fb, Cb）を白鍵表記にします。'}
          </span>
        </span>
      </label>
    </section>
  );
};
