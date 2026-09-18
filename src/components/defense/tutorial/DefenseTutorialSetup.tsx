import React from 'react';
import { NotationInstrumentSelect } from '@/components/settings/NotationInstrumentSelect';
import type { NotationInstrumentClef, NotationInstrumentId } from '@/utils/notationInstrument';
import { formatTutorialNotationLabel } from '@/game/defense/tutorial/defenseTutorialNotation';
import type { DefenseTutorialNotationSettings } from '@/game/defense/tutorial/defenseTutorialNotation';
import { getNotationInstrumentPreset } from '@/utils/notationInstrument';

interface DefenseTutorialSetupProps {
  readonly settings: DefenseTutorialNotationSettings;
  readonly isEnglishCopy: boolean;
  readonly mode: 'edit' | 'confirm';
  readonly onChange: (settings: DefenseTutorialNotationSettings) => void;
  readonly onConfirm: () => void;
  readonly onBackToEdit?: () => void;
}

export const DefenseTutorialSetup: React.FC<DefenseTutorialSetupProps> = ({
  settings,
  isEnglishCopy,
  mode,
  onChange,
  onConfirm,
  onBackToEdit,
}) => {
  const preset = getNotationInstrumentPreset(settings.notationInstrumentId);

  const applyInstrument = (instrumentId: NotationInstrumentId) => {
    const nextPreset = getNotationInstrumentPreset(instrumentId);
    onChange({
      notationInstrumentId: instrumentId,
      notationOctaveShift: settings.notationOctaveShift,
      clefOverride: nextPreset.clef,
      transpositionOverride: nextPreset.transposition,
    });
  };

  if (mode === 'confirm') {
    const label = formatTutorialNotationLabel(settings, isEnglishCopy);
    const instrumentLabel = isEnglishCopy ? preset.label.en : preset.label.ja;
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 text-center">
        <p className="text-sm text-slate-300">
          {isEnglishCopy
            ? 'Your sheet music will be shown like this.'
            : '楽譜は次の設定で表示されます。'}
        </p>
        <p className="text-xl font-semibold text-white">{instrumentLabel}</p>
        <p className="text-sm text-slate-400">{label}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onBackToEdit ? (
            <button type="button" className="btn btn-outline" onClick={onBackToEdit}>
              {isEnglishCopy ? 'Change' : '変更する'}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            {isEnglishCopy ? 'Continue with this setup' : 'この設定で進む'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8">
      <p className="text-center text-sm text-slate-300">
        {isEnglishCopy
          ? 'If you want to read in your instrument\'s key, choose that instrument. If you want concert pitch (no transposition), choose Melody (Concert key).'
          : 'あなたの楽器のキーで譜面を読みたい方は、その楽器を選んでください。コンサートキー（移調なし）で読みたい方は「単音楽器（コンサートキー）」を選んでください。'}
      </p>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-200">
          {isEnglishCopy ? 'Instrument' : '楽器'}
        </span>
        <NotationInstrumentSelect
          value={settings.notationInstrumentId}
          onChange={applyInstrument}
          isEnglishCopy={isEnglishCopy}
        />
      </label>
      <button type="button" className="btn btn-primary mt-2" onClick={onConfirm}>
        {isEnglishCopy ? 'Next' : '次へ'}
      </button>
    </div>
  );
};

export const buildDefaultTutorialNotationFromStore = (
  notationInstrumentId: NotationInstrumentId,
  notationOctaveShift: number,
  clefOverride: NotationInstrumentClef | null | undefined,
  transpositionOverride: number | null | undefined,
): DefenseTutorialNotationSettings => {
  const preset = getNotationInstrumentPreset(notationInstrumentId);
  return {
    notationInstrumentId,
    notationOctaveShift,
    clefOverride: clefOverride ?? preset.clef,
    transpositionOverride: transpositionOverride ?? preset.transposition,
  };
};
