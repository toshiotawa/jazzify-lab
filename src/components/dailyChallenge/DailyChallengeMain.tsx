import React, { useEffect, useState } from 'react';
import { FaLock } from 'react-icons/fa';
import FantasyGameScreen from '@/components/fantasy/FantasyGameScreen';
import type { FantasyStage as EngineFantasyStage } from '@/components/fantasy/FantasyGameEngine';
import GameHeader from '@/components/ui/GameHeader';
import { useToast } from '@/stores/toastStore';
import type { DailyChallengeDifficulty, FantasyStage } from '@/types';
import { createDailyChallengeRecord, fetchDailyChallengeRecordsSince, fetchDailyChallengeStage } from '@/platform/supabaseDailyChallenge';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
import { useUtcResetInfo } from '@/utils/useUtcResetInfo';
import { useBillingAwareMembership } from '@/utils/useBillingAwareMembership';
import { isFreeWebDailyChallengeDifficulty } from '@/utils/freeWebTier';
import WebPaywallModal from '@/components/ui/WebPaywallModal';

type PlayMode = 'challenge' | 'practice';

type ViewState =
  | { type: 'loading' }
  | { type: 'pick' }
  | { type: 'blocked'; reason: 'invalid' | 'already_played' | 'missing_stage' | 'premium_required' }
  | { type: 'playing'; stage: EngineFantasyStage; difficulty: DailyChallengeDifficulty; playMode: PlayMode }
  | { type: 'result'; difficulty: DailyChallengeDifficulty; score: number };

const VALID_DIFFICULTIES: DailyChallengeDifficulty[] = [
  'super_beginner', 'beginner', 'intermediate', 'advanced', 'super_advanced',
];

const parseDifficulty = (hash: string): DailyChallengeDifficulty | null => {
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const raw = params.get('difficulty');
  if (VALID_DIFFICULTIES.includes(raw as DailyChallengeDifficulty)) return raw as DailyChallengeDifficulty;
  return null;
};

const DIFFICULTY_LABELS_JA: Record<DailyChallengeDifficulty, string> = {
  super_beginner: '超初級',
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
  super_advanced: '超上級',
};

const DIFFICULTY_LABELS_EN: Record<DailyChallengeDifficulty, string> = {
  super_beginner: 'Super Beginner',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  super_advanced: 'Super Advanced',
};

const toEngineStage = (dbStage: FantasyStage): EngineFantasyStage => {
  const bgmUrl = dbStage.bgm_url || dbStage.mp3_url || undefined;
  return {
    id: dbStage.id,
    stageNumber: dbStage.stage_number,
    name: dbStage.name,
    name_en: dbStage.name_en,
    description: dbStage.description || '',
    description_en: dbStage.description_en,
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
    isSheetMusicMode: !!(dbStage as any).is_sheet_music_mode,
    sheetMusicClef: (dbStage as any).sheet_music_clef || 'treble',
    bpm: 120,
    playRootOnCorrect: dbStage.play_root_on_correct ?? true,
  };
};

interface DailyChallengeMainProps {
  iosDifficulty?: string;
}

const DailyChallengeMain: React.FC<DailyChallengeMainProps> = ({ iosDifficulty }) => {
  const toast = useToast();
  const [view, setView] = useState<ViewState>({ type: 'loading' });
  const [hashTick, setHashTick] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const profile = useAuthStore(s => s.profile);
  const geoCountry = useGeoStore(s => s.country);
  const isEn = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const localeCode = isEn ? 'en' : 'ja';
  const { isPremiumMember } = useBillingAwareMembership(localeCode);
  const { todayKey: today, resetLabel } = useUtcResetInfo(isEn);
  const difficultyLabel = (d: DailyChallengeDifficulty): string =>
    isEn ? DIFFICULTY_LABELS_EN[d] : DIFFICULTY_LABELS_JA[d];

  useEffect(() => {
    const onHash = (): void => {
      setHashTick((n) => n + 1);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const run = async () => {
      setView({ type: 'loading' });
      let difficulty = parseDifficulty(window.location.hash);
      if (!difficulty && iosDifficulty && VALID_DIFFICULTIES.includes(iosDifficulty as DailyChallengeDifficulty)) {
        difficulty = iosDifficulty as DailyChallengeDifficulty;
      }
      if (!difficulty) {
        const searchDifficulty = new URLSearchParams(window.location.search).get('difficulty');
        if (searchDifficulty && VALID_DIFFICULTIES.includes(searchDifficulty as DailyChallengeDifficulty)) {
          difficulty = searchDifficulty as DailyChallengeDifficulty;
        }
      }
      if (!difficulty) {
        if (isIOSWebView()) {
          setView({ type: 'blocked', reason: 'invalid' });
          return;
        }
        setView({ type: 'pick' });
        return;
      }

      if (!isPremiumMember && !isFreeWebDailyChallengeDifficulty(difficulty)) {
        setView({ type: 'blocked', reason: 'premium_required' });
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

      // playModeは'challenge'で初期化するが、ユーザーが「挑戦」等で開始するまでゲームは始まらない
      setView({ type: 'playing', stage: toEngineStage(stage), difficulty, playMode: 'challenge' });
    };

    void run().catch(() => setView({ type: 'blocked', reason: 'invalid' }));
  }, [today, hashTick, isPremiumMember, iosDifficulty]);

  if (view.type === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-sm text-gray-300">{isEn ? 'Loading...' : '読み込み中...'}</div>
      </div>
    );
  }

  if (view.type === 'pick') {
    const pickTitle = isEn ? 'Choose difficulty' : '難易度を選ぶ';
    const pickHint = isEn
      ? 'Free plan: Super Beginner only. Upgrade for all levels.'
      : 'フリープランは超初級のみプレイできます。プレミアムで全難易度を解放。';
    const upgradeCta = isEn ? 'View plans' : 'プランを見る';

    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-lg mx-auto space-y-4">
            <h1 className="text-xl font-bold">{isEn ? 'Daily Challenge' : 'デイリーチャレンジ'}</h1>
            <p className="text-sm text-gray-300">{pickTitle}</p>
            {!isPremiumMember && <p className="text-xs text-amber-200/90">{pickHint}</p>}
            <div className="flex flex-col gap-2">
              {VALID_DIFFICULTIES.map((d) => {
                const locked = !isPremiumMember && !isFreeWebDailyChallengeDifficulty(d);
                return (
                  <button
                    key={d}
                    type="button"
                    className={`btn w-full justify-between ${locked ? 'btn-outline opacity-70' : 'btn-primary'}`}
                    onClick={() => {
                      if (locked) {
                        setShowPaywall(true);
                        return;
                      }
                      window.location.hash = `#daily-challenge?difficulty=${d}`;
                    }}
                  >
                    <span>{difficultyLabel(d)}</span>
                    {locked ? <FaLock className="text-sm opacity-80" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn btn-outline w-full border-slate-500"
              onClick={() => {
                if (isIOSWebView()) {
                  sendGameCallback('gameEnd');
                  return;
                }
                window.location.hash = '#dashboard';
              }}
            >
              {isEn ? 'Back' : '戻る'}
            </button>
            {!isPremiumMember && (
              <button type="button" className="btn btn-sm btn-link text-primary-300" onClick={() => setShowPaywall(true)}>
                {upgradeCta}
              </button>
            )}
          </div>
        </div>
        <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEn} />
      </div>
    );
  }

  if (view.type === 'blocked') {
    const message =
      view.reason === 'already_played'
        ? (isEn ? 'You have already played this difficulty today.' : '本日はこの難易度をプレイ済みです。')
        : view.reason === 'missing_stage'
          ? (isEn ? 'Daily challenge stage not found. Please configure it in the admin panel.' : 'デイリーチャレンジのステージ設定が見つかりません。管理画面で設定してください。')
          : view.reason === 'premium_required'
            ? (isEn
              ? 'This difficulty is for Premium members. Free members can play Super Beginner.'
              : 'この難易度はプレミアム会員向けです。フリーは超初級のみプレイできます。')
            : (isEn ? 'Failed to start daily challenge.' : 'デイリーチャレンジの起動に失敗しました。');

    return (
      <div className="w-full h-full flex flex-col bg-gradient-game text-white">
        <GameHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
            <div className="text-lg font-bold">{isEn ? 'Daily Challenge' : 'デイリーチャレンジ'}</div>
            <div className="text-sm text-gray-200">{message}</div>
            <div className="text-xs text-gray-400">⏳ {resetLabel}</div>
            {view.reason === 'premium_required' && (
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setShowPaywall(true)}
              >
                {isEn ? 'View plans' : 'プランを見る'}
              </button>
            )}
            <WebPaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} isEnglishCopy={isEn} />
            <button
              type="button"
              className="btn btn-outline w-full border-slate-500"
              onClick={() => {
                if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                window.location.hash = '#dashboard';
              }}
            >
              {isEn ? 'Back to Dashboard' : 'ダッシュボードに戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view.type === 'result') {
    return (
      <div className="min-h-[var(--dvh,100dvh)] bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-white text-center max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 font-sans">{isEn ? 'Results' : 'リザルト'}</h2>
          <div className="bg-black/30 rounded-lg p-6 mb-6 space-y-2">
            <div className="text-sm text-gray-200">{isEn ? 'Difficulty' : '難易度'}</div>
            <div className="text-xl font-bold">{difficultyLabel(view.difficulty)}</div>
            <div className="mt-4 text-sm text-gray-200">{isEn ? 'Score' : 'スコア'}</div>
            <div className="text-4xl font-bold text-yellow-300">{view.score}</div>
            <div className="pt-2 text-xs text-gray-300">⏳ {resetLabel}</div>
          </div>
          <button
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors font-sans"
            onClick={() => {
              if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
              window.location.hash = '#dashboard';
            }}
          >
            {isEn ? 'Back to Top' : 'トップに戻る'}
          </button>
        </div>
      </div>
    );
  }

  const isPracticeMode = view.playMode === 'practice';

  return (
    <FantasyGameScreen
      key={`${view.difficulty}:${today}`}
      stage={view.stage}
      playMode={view.playMode}
      onPlayModeChange={(mode) => {
        // ユーザーがモードを選択したときにplayModeを更新
        setView({ type: 'playing', stage: view.stage, difficulty: view.difficulty, playMode: mode });
      }}
      onSwitchToChallenge={() => {
        setView({ type: 'playing', stage: view.stage, difficulty: view.difficulty, playMode: 'challenge' });
      }}
      uiMode="daily_challenge"
      timeLimitSeconds={isPracticeMode ? Infinity : 120}
      onBackToStageSelect={() => {
        if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
        window.location.hash = '#daily-challenge';
      }}
      onGameComplete={async (_result, _score, correctAnswers) => {
        const score = correctAnswers;
        // 練習モードの場合はスコアを保存しない、スタートボタン画面に戻す
        if (isPracticeMode) {
          if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
          window.location.reload();
          return;
        }
        try {
          const res = await createDailyChallengeRecord({
            playedOn: today,
            difficulty: view.difficulty,
            score,
          });
          if (res.status === 'already_played') {
            toast.info(isEn ? 'Already played today' : '本日はプレイ済みです');
          }
        } catch {
          toast.error(isEn ? 'Failed to save record' : '記録の保存に失敗しました');
        } finally {
          setView({ type: 'result', difficulty: view.difficulty, score });
        }
      }}
    />
  );
};

export default DailyChallengeMain;

