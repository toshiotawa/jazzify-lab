import React from 'react';
import type {
  SurvivalLessonCompositeConfig,
  SurvivalLessonOverrides,
} from '@/types';

const emptyCompositeConfig = (): SurvivalLessonCompositeConfig => ({
  bossType: 'B',
  keyFifths: 0,
  phrases: [
    {
      title: 'フレーズ1',
      chords: [{ chordName: 'Dm7', measureNumber: 1, noteNames: ['D4', 'F4', 'A4', 'C5'] }],
    },
    {
      title: 'フレーズ2',
      chords: [{ chordName: 'G7', measureNumber: 1, noteNames: ['G3', 'B3', 'D4', 'F4'] }],
    },
  ],
});

interface SurvivalLessonCompositeEditorProps {
  value: SurvivalLessonCompositeConfig;
  onChange: (next: SurvivalLessonCompositeConfig) => void;
}

export const createDefaultSurvivalLessonCompositeConfig = emptyCompositeConfig;

export const SurvivalLessonCompositeEditor: React.FC<SurvivalLessonCompositeEditorProps> = ({
  value,
  onChange,
}) => {
  const updatePhrase = (index: number, patch: Partial<SurvivalLessonCompositeConfig['phrases'][number]>) => {
    const phrases = value.phrases.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ ...value, phrases });
  };

  const updateChord = (
    phraseIndex: number,
    chordIndex: number,
    patch: Partial<SurvivalLessonCompositeConfig['phrases'][number]['chords'][number]>,
  ) => {
    const phrases = value.phrases.map((p, pi) => {
      if (pi !== phraseIndex) return p;
      const chords = p.chords.map((c, ci) => (ci === chordIndex ? { ...c, ...patch } : c));
      return { ...p, chords };
    });
    onChange({ ...value, phrases });
  };

  const addPhrase = () => {
    onChange({
      ...value,
      phrases: [
        ...value.phrases,
        {
          title: `フレーズ${value.phrases.length + 1}`,
          chords: [{ chordName: 'C', measureNumber: 1, noteNames: ['C4'] }],
        },
      ],
    });
  };

  const removePhrase = (index: number) => {
    if (value.phrases.length <= 2) return;
    onChange({ ...value, phrases: value.phrases.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4 rounded border border-purple-500/40 bg-purple-950/20 p-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          ボスタイプ
          <select
            className="select select-bordered select-sm w-full mt-1"
            value={value.bossType ?? 'B'}
            onChange={(e) => onChange({ ...value, bossType: e.target.value as 'A' | 'B' | 'C' })}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
        <label className="block text-sm">
          調号 (key_fifths)
          <input
            type="number"
            min={-7}
            max={7}
            className="input input-bordered input-sm w-full mt-1"
            value={value.keyFifths ?? 0}
            onChange={(e) => onChange({ ...value, keyFifths: Number(e.target.value) })}
          />
        </label>
      </div>

      {value.phrases.map((phrase, pi) => (
        <div key={`phrase-${pi}`} className="rounded border border-slate-600 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              value={phrase.title ?? ''}
              placeholder={`フレーズ ${pi + 1}`}
              onChange={(e) => updatePhrase(pi, { title: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-xs btn-ghost text-red-400"
              onClick={() => removePhrase(pi)}
              disabled={value.phrases.length <= 2}
            >
              削除
            </button>
          </div>
          {phrase.chords.map((chord, ci) => (
            <div key={`chord-${pi}-${ci}`} className="space-y-1">
              <input
                className="input input-bordered input-sm w-full"
                value={chord.chordName}
                placeholder="コード名 (例: Dm7)"
                onChange={(e) => updateChord(pi, ci, { chordName: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered textarea-sm w-full font-mono text-xs"
                rows={3}
                value={chord.noteNames.join('\n')}
                placeholder={'1行1音 (例:\nD4\nF4\nA4\nC5)'}
                onChange={(e) => {
                  const noteNames = e.target.value
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean);
                  updateChord(pi, ci, { noteNames });
                }}
              />
            </div>
          ))}
        </div>
      ))}

      <button type="button" className="btn btn-sm btn-outline" onClick={addPhrase}>
        フレーズ追加
      </button>
    </div>
  );
};

export type SurvivalTaskMode = 'stage_ref' | 'composite_phrase';

interface SurvivalLessonOverridesFormProps {
  value: SurvivalLessonOverrides;
  onChange: (next: SurvivalLessonOverrides) => void;
  taskMode: SurvivalTaskMode;
  isBossCapable: boolean;
}

export const emptySurvivalLessonOverrides = (): SurvivalLessonOverrides => ({});

export const SurvivalLessonOverridesForm: React.FC<SurvivalLessonOverridesFormProps> = ({
  value,
  onChange,
  taskMode,
  isBossCapable,
}) => {
  const setNum = (key: keyof SurvivalLessonOverrides, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      const next = { ...value };
      delete next[key];
      onChange(next);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    onChange({ ...value, [key]: n });
  };

  const setComposite = (key: keyof NonNullable<SurvivalLessonOverrides['compositeDamage']>, raw: string) => {
    const trimmed = raw.trim();
    const compositeDamage = { ...(value.compositeDamage ?? {}) };
    if (!trimmed) {
      delete compositeDamage[key];
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) return;
      compositeDamage[key] = n;
    }
    onChange({ ...value, compositeDamage });
  };

  const showRandomProgression = taskMode === 'stage_ref';
  const showCompositeDamage = taskMode === 'composite_phrase';

  return (
    <div className="space-y-3 rounded border border-amber-500/30 bg-amber-950/10 p-3">
      <p className="text-sm font-semibold text-amber-200">課題別上書き（空欄=デフォルト）</p>
      <div className="grid grid-cols-2 gap-2">
        {isBossCapable ? (
          <label className="text-xs">
            ボス HP
            <input
              type="number"
              className="input input-bordered input-xs w-full mt-0.5"
              value={value.bossMaxHp ?? ''}
              onChange={(e) => setNum('bossMaxHp', e.target.value)}
            />
          </label>
        ) : null}
        <label className="text-xs">
          プレイヤー HP
          <input
            type="number"
            className="input input-bordered input-xs w-full mt-0.5"
            value={value.playerMaxHp ?? ''}
            onChange={(e) => setNum('playerMaxHp', e.target.value)}
          />
        </label>
        <label className="text-xs col-span-2">
          BGM URL
          <input
            type="url"
            className="input input-bordered input-xs w-full mt-0.5"
            value={value.bgmUrl ?? ''}
            onChange={(e) => onChange({ ...value, bgmUrl: e.target.value.trim() || undefined })}
          />
        </label>
        {showRandomProgression ? (
          <>
            <label className="text-xs">
              制限時間（秒）
              <input
                type="number"
                className="input input-bordered input-xs w-full mt-0.5"
                value={value.timeLimitSec ?? ''}
                onChange={(e) => setNum('timeLimitSec', e.target.value)}
              />
            </label>
            <label className="text-xs">
              撃破ノルマ
              <input
                type="number"
                className="input input-bordered input-xs w-full mt-0.5"
                value={value.killQuota ?? ''}
                onChange={(e) => setNum('killQuota', e.target.value)}
              />
            </label>
            <label className="text-xs">
              敵ステ倍率
              <input
                type="number"
                step="0.1"
                className="input input-bordered input-xs w-full mt-0.5"
                value={value.enemyStatMultiplier ?? ''}
                onChange={(e) => setNum('enemyStatMultiplier', e.target.value)}
              />
            </label>
            <label className="text-xs">
              与ダメ倍率
              <input
                type="number"
                step="0.1"
                className="input input-bordered input-xs w-full mt-0.5"
                value={value.playerStatMultiplier ?? ''}
                onChange={(e) => setNum('playerStatMultiplier', e.target.value)}
              />
            </label>
          </>
        ) : null}
      </div>
      {showCompositeDamage ? (
        <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-2">
          <p className="col-span-2 text-xs text-slate-400">複合フレーズ与ダメ</p>
          {(['note', 'measureRange', 'finishPrimary', 'finishRepeat'] as const).map((key) => (
            <label key={key} className="text-xs">
              {key}
              <input
                type="number"
                className="input input-bordered input-xs w-full mt-0.5"
                value={value.compositeDamage?.[key] ?? ''}
                onChange={(e) => setComposite(key, e.target.value)}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};
