import React, { useEffect, useMemo, useState } from 'react';
import FantasyGameScreen from '@/components/fantasy/FantasyGameScreen';
import type { FantasyStage as EngineFantasyStage } from '@/components/fantasy/FantasyGameEngine';
import { useToast } from '@/stores/toastStore';
import type { DailyChallengeDifficulty, FantasyStage } from '@/types';
import { createDailyChallengeRecord, fetchDailyChallengeRecordsSince, fetchDailyChallengeStage } from '@/platform/supabaseDailyChallenge';

type ViewState =
  | { type: 'loading' }
  | { type: 'blocked'; reason: 'invalid' | 'already_played' | 'missing_stage' }
  | { type: 'playing'; stage: EngineFantasyStage; difficulty: DailyChallengeDifficulty }
  | { type: 'result'; difficulty: DailyChallengeDifficulty; score: number };

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDifficulty = (hash: string): DailyChallengeDifficulty | null => {
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const raw = params.get('difficulty');
  if (raw === 'beginner' || raw === 'intermediate' || raw === 'advanced') return raw;
  return null;
};

const difficultyLabel = (d: DailyChallengeDifficulty): string => {
  if (d === 'beginner') return '初級';
  if (d === 'intermediate') return '中級';
  return '上級';
};

const toEngineStage = (dbStage: FantasyStage): EngineFantasyStage => {
  const bgmUrl = dbStage.bgm_url || dbStage.mp3_url || undefined;
  return {
    id: dbStage.id,
    stageNumber: dbStage.stage_number,
    name: dbStage.name,
    description: dbStage.description || '',
    // デイリーチャレンジ固定仕様
    maxHp: 1,
    enemyGaugeSeconds: 9999,
    enemyCount: 9999,
    enemyHp: 1,
    minDamage: 1,
    maxDamage: 1,
    mode: 'single',
    allowedChords: dbStage.allowed_chords,
    chordProgression: Array.isArray(dbStage.chord_progression) ? dbStage.chord_progression : undefined,
    showSheetMusic: false,
    showGuide: false,
    monsterIcon: 'dragon',
    bgmUrl,
    simultaneousMonsterCount: 1,
    bpm: 120,
    playRootOnCorrect: dbStage.play_root_on_correct ?? true,
  };
};

const DailyChallengeMain: React.FC = () => {
  const toast = useToast();
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const [view, setView] = useState<ViewState>({ type: 'loading' });

  useEffect(() => {
    const run = async () => {
      const difficulty = parseDifficulty(window.location.hash);
      if (!difficulty) {
        setView({ type: 'blocked', reason: 'invalid' });
        return;
      }

      try {
        const played = await fetchDailyChallengeRecordsSince({ since: today, difficulty });
        if (played.some((r) => r.played_on === today)) {
          setView({ type: 'blocked', reason: 'already_played' });
          return;
        }
      } catch {
        // 記録取得に失敗しても、最終的なinsert側で弾く
      }

      const stage = await fetchDailyChallengeStage(difficulty);
      if (!stage) {
        setView({ type: 'blocked', reason: 'missing_stage' });
        return;
      }

      setView({ type: 'playing', stage: toEngineStage(stage), difficulty });
    };

    run().catch(() => setView({ type: 'blocked', reason: 'invalid' }));
  }, [today]);

  if (view.type === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-sm text-gray-300">読み込み中...</div>
      </div>
    );
  }

  if (view.type === 'blocked') {
    const message =
      view.reason === 'already_played'
        ? '本日はこの難易度をプレイ済みです。'
        : view.reason === 'missing_stage'
          ? 'デイリーチャレンジのステージ設定が見つかりません。管理画面で設定してください。'
          : 'デイリーチャレンジの起動に失敗しました。';

    return (
      <div className="w-full h-full flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
          <div className="text-lg font-bold">デイリーチャレンジ</div>
          <div className="text-sm text-gray-200">{message}</div>
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              window.location.hash = '#dashboard';
            }}
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  if (view.type === 'result') {
    return (
      <div className="min-h-[var(--dvh,100dvh)] bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-white text-center max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 font-sans">リザルト</h2>
          <div className="bg-black/30 rounded-lg p-6 mb-6 space-y-2">
            <div className="text-sm text-gray-200">難易度</div>
            <div className="text-xl font-bold">{difficultyLabel(view.difficulty)}</div>
            <div className="mt-4 text-sm text-gray-200">スコア</div>
            <div className="text-4xl font-bold text-yellow-300">{view.score}</div>
          </div>
          <button
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors font-sans"
            onClick={() => {
              window.location.hash = '#dashboard';
            }}
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <FantasyGameScreen
      key={`${view.difficulty}:${today}`}
      stage={view.stage}
      autoStart
      uiMode="daily_challenge"
      timeLimitSeconds={120}
      onBackToStageSelect={() => {
        window.location.hash = '#dashboard';
      }}
      onGameComplete={async (_result, _score, correctAnswers) => {
        const score = correctAnswers;
        try {
          const res = await createDailyChallengeRecord({
            playedOn: today,
            difficulty: view.difficulty,
            score,
          });
          if (res.status === 'already_played') {
            toast.info('本日はプレイ済みです');
          }
        } catch {
          toast.error('記録の保存に失敗しました');
        } finally {
          setView({ type: 'result', difficulty: view.difficulty, score });
        }
      }}
    />
  );
};

export default DailyChallengeMain;

