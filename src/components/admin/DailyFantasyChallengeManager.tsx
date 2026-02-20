import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToastStore } from '@/stores/toastStore';
import type { DailyChallengeDifficulty, FantasyStage } from '@/types';
import { ensureDailyChallengeStagesExist, updateDailyChallengeStageSettings } from '@/platform/supabaseDailyChallenge';

type DifficultyForm = {
  allowedChordsText: string;
  bgmUrl: string;
};

const difficultyLabel: Record<DailyChallengeDifficulty, string> = {
  super_beginner: '超初級',
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
  super_advanced: '超上級',
};

const parseChordList = (text: string): string[] => {
  return text
    .split(/[,\s|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 1);
};

const allowedChordsToText = (allowed: unknown): string => {
  if (!Array.isArray(allowed)) return '';
  const chords = allowed.filter((v): v is string => typeof v === 'string');
  return chords.join(' ');
};

const DailyFantasyChallengeManager: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Record<DailyChallengeDifficulty, FantasyStage> | null>(null);

  const [forms, setForms] = useState<Record<DailyChallengeDifficulty, DifficultyForm>>({
    super_beginner: { allowedChordsText: '', bgmUrl: '' },
    beginner: { allowedChordsText: '', bgmUrl: '' },
    intermediate: { allowedChordsText: '', bgmUrl: '' },
    advanced: { allowedChordsText: '', bgmUrl: '' },
    super_advanced: { allowedChordsText: '', bgmUrl: '' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await ensureDailyChallengeStagesExist();
      setStages(s);
      const buildForm = (stage: typeof s[keyof typeof s]): DifficultyForm => ({
        allowedChordsText: allowedChordsToText(stage.allowed_chords),
        bgmUrl: (stage.bgm_url || stage.mp3_url || '') ?? '',
      });
      setForms({
        super_beginner: buildForm(s.super_beginner),
        beginner: buildForm(s.beginner),
        intermediate: buildForm(s.intermediate),
        advanced: buildForm(s.advanced),
        super_advanced: buildForm(s.super_advanced),
      });
    } catch {
      pushToast('デイリーチャレンジ設定の読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const difficulties = useMemo(
    () => ['super_beginner', 'beginner', 'intermediate', 'advanced', 'super_advanced'] as const,
    [],
  );

  if (loading) {
    return <div className="text-gray-300">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">デイリーチャレンジ管理</h3>
        <p className="text-sm text-gray-300 mt-1">
          難易度ごとに「許可コード（allowed_chords）」と「BGM URL（bgm_url）」のみ編集できます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {difficulties.map((difficulty) => {
          const form = forms[difficulty];
          const stage = stages?.[difficulty];
          return (
            <div key={difficulty} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold">{difficultyLabel[difficulty]}</div>
                <div className="text-xs text-gray-400">{stage?.stage_number ?? ''}</div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">許可コード（スペース/カンマ区切り）</label>
                <textarea
                  className="textarea textarea-bordered w-full text-white"
                  rows={4}
                  value={form.allowedChordsText}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForms((prev) => ({ ...prev, [difficulty]: { ...prev[difficulty], allowedChordsText: v } }));
                  }}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">BGM URL</label>
                <input
                  className="input input-bordered w-full text-white"
                  placeholder="例: https://..."
                  value={form.bgmUrl}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForms((prev) => ({ ...prev, [difficulty]: { ...prev[difficulty], bgmUrl: v } }));
                  }}
                />
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={async () => {
                  try {
                    const allowedChords = parseChordList(form.allowedChordsText);
                    if (allowedChords.length === 0) {
                      pushToast('許可コードを1つ以上入力してください', 'error');
                      return;
                    }
                    const bgmUrl = form.bgmUrl.trim() ? form.bgmUrl.trim() : null;
                    await updateDailyChallengeStageSettings({ difficulty, allowedChords, bgmUrl });
                    pushToast('保存しました', 'success');
                    await load();
                  } catch {
                    pushToast('保存に失敗しました', 'error');
                  }
                }}
              >
                保存
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400">
        ※ デイリーチャレンジの固定仕様（敵HP=1 / 与ダメージ=1 / 同時出現=1 / ガイドOFF / 2分）はアプリ側で強制適用されます。
      </div>
    </div>
  );
};

export default DailyFantasyChallengeManager;

