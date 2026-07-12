import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import type { WebKeyboardDisplayMode } from '@/utils/webKeyboardDisplayRange';

interface WebKeyboardDisplayModeSectionProps {
  isEnglishCopy: boolean;
}

export const WebKeyboardDisplayModeSection: React.FC<WebKeyboardDisplayModeSectionProps> = ({
  isEnglishCopy,
}) => {
  const { settings, updateSettings } = useGameStore();
  const currentMode = settings.webKeyboardDisplayMode ?? 'questionRangeFit';

  const setMode = (mode: WebKeyboardDisplayMode) => {
    updateSettings({ webKeyboardDisplayMode: mode });
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">
        {isEnglishCopy ? 'Keyboard display' : '鍵盤表示'}
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          className={`btn btn-sm ${currentMode === 'questionRangeFit' ? 'btn-primary' : 'btn-ghost border border-slate-600'}`}
          onClick={() => setMode('questionRangeFit')}
        >
          {isEnglishCopy ? 'Fit to question range' : '出題音域フィット'}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${currentMode === 'full88' ? 'btn-primary' : 'btn-ghost border border-slate-600'}`}
          onClick={() => setMode('full88')}
        >
          {isEnglishCopy ? 'Full 88 keys' : '88鍵盤'}
        </button>
      </div>
    </section>
  );
};
