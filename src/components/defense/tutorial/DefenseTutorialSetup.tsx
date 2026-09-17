import React from 'react';
import { NotationInstrumentSelect } from '@/components/settings/NotationInstrumentSelect';
import type { NotationInstrumentClef, NotationInstrumentId } from '@/utils/notationInstrument';
import { formatTutorialNotationLabel } from '@/game/defense/tutorial/defenseTutorialNotation';
import type { DefenseTutorialNotationSettings } from '@/game/defense/tutorial/defenseTutorialNotation';
import { getNotationInstrumentPreset } from '@/utils/notationInstrument';

const KEY_OPTIONS: readonly { label: string; transposition: number }[] = [
  { label: 'C', transposition: 0 },
  { label: 'B♭', transposition: -2 },
  { label: 'E♭', transposition: -9 },
  { label: 'F', transposition: -7 },
];

const CLEF_OPTIONS: readonly { value: NotationInstrumentClef; labelJa: string; labelEn: string }[] = [
  { value: 'treble', labelJa: 'ト音記号', labelEn: 'Treble clef' },
  { value: 'bass', labelJa: 'ヘ音記号', labelEn: 'Bass clef' },
  { value: 'grand', labelJa: '大譜表', labelEn: 'Grand staff' },
];

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
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 text-center">
        <p className="text-sm text-slate-300">
          {isEnglishCopy
            ? 'Your sheet music will be shown like this.'
            : '楽譜は次の設定で表示されます。'}
        </p>
        <p className="text-2xl font-semibold text-white">{label}</p>
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
          ? 'Choose the sheet music you usually read.'
          : '普段使っている楽譜を選んでください。'}
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
      <label className="block">
        <span className="mb-1 block text-sm text-slate-200">
          {isEnglishCopy ? 'Clef' : '音部記号'}
        </span>
        <select
          className="select select-bordered w-full"
          value={settings.clefOverride ?? preset.clef}
          onChange={(event) => {
            onChange({
              ...settings,
              clefOverride: event.target.value as NotationInstrumentClef,
            });
          }}
        >
          {CLEF_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {isEnglishCopy ? option.labelEn : option.labelJa}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-200">
          {isEnglishCopy ? 'Written key' : '移調キー'}
        </span>
        <select
          className="select select-bordered w-full"
          value={settings.transpositionOverride ?? preset.transposition}
          onChange={(event) => {
            onChange({
              ...settings,
              transpositionOverride: Number(event.target.value),
            });
          }}
        >
          {KEY_OPTIONS.map((option) => (
            <option key={option.transposition} value={option.transposition}>
              {option.label}
            </option>
          ))}
        </select>
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
