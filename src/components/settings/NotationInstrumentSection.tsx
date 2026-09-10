import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import {
  clampNotationOctaveShift,
  formatNotationClefLabel,
  formatWrittenOffsetLabel,
  getNotationInstrumentPreset,
  getWrittenSemitoneOffset,
  NOTATION_OCTAVE_SHIFT_MAX,
  NOTATION_OCTAVE_SHIFT_MIN,
  type NotationInstrumentId,
} from '@/utils/notationInstrument';
import { NotationInstrumentSelect } from '@/components/settings/NotationInstrumentSelect';

interface NotationInstrumentSectionProps {
  isEnglishCopy: boolean;
}

export const NotationInstrumentSection: React.FC<NotationInstrumentSectionProps> = ({
  isEnglishCopy,
}) => {
  const notationInstrumentId = useGameStore((state) => state.settings.notationInstrumentId);
  const notationOctaveShift = useGameStore((state) => state.settings.notationOctaveShift);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const updateNotationInstrument = useAuthStore((state) => state.updateNotationInstrument);
  const preset = getNotationInstrumentPreset(notationInstrumentId);
  const writtenOffset = getWrittenSemitoneOffset(preset, notationOctaveShift);

  const handleInstrumentChange = (instrumentId: NotationInstrumentId) => {
    updateSettings({ notationInstrumentId: instrumentId });
    void updateNotationInstrument(instrumentId);
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">
        {isEnglishCopy ? 'Notation instrument' : '移調楽器（記譜）'}
      </h3>
      <p className="text-xs text-slate-400">
        {isEnglishCopy
          ? 'Sheet music is transposed for your instrument. The on-screen piano always shows concert pitch.'
          : '楽譜は選択した楽器向けの記譜で表示されます。画面上のピアノは常にコンサート（実音）です。'}
      </p>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-200">
          {isEnglishCopy ? 'Instrument' : '楽器'}
        </span>
        <NotationInstrumentSelect
          value={notationInstrumentId}
          onChange={handleInstrumentChange}
          isEnglishCopy={isEnglishCopy}
        />
      </label>
      <label className="block">
        <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
          <span>{isEnglishCopy ? 'Written octave shift' : '記譜オクターブ'}</span>
          <span>
            {notationOctaveShift > 0 ? '+' : ''}
            {notationOctaveShift}
            {isEnglishCopy ? ' oct' : ' オクターブ'}
          </span>
        </div>
        <input
          type="range"
          min={NOTATION_OCTAVE_SHIFT_MIN}
          max={NOTATION_OCTAVE_SHIFT_MAX}
          step={1}
          value={notationOctaveShift}
          onChange={(event) => {
            updateSettings({
              notationOctaveShift: clampNotationOctaveShift(Number(event.target.value)),
            });
          }}
          className="range range-primary range-sm"
        />
      </label>
      <p className="text-xs text-slate-400">
        {formatWrittenOffsetLabel(writtenOffset, isEnglishCopy)}
        {' · '}
        {formatNotationClefLabel(preset.clef, isEnglishCopy)}
      </p>
    </section>
  );
};
