import React, { useEffect, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { useLessonContext } from '@/stores/gameStore';
import { updateLessonRequirementProgress, fetchLessonRequirementsProgress } from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaAward } from 'react-icons/fa';
import { log } from '@/utils/logger';

const ResultModal: React.FC = () => {
  const { currentSong, score, settings, resultModalOpen } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    score: s.score,
    settings: s.settings,
    resultModalOpen: s.resultModalOpen
  }));
  const {
    closeResultModal,
    resetScore,
    seek,
    setCurrentTab,
    clearLessonContext,
  } = useGameActions();

  const { profile, fetchProfile } = useAuthStore();
  const lessonContext = useLessonContext();

  const [lessonRequirementSuccess, setLessonRequirementSuccess] = useState<boolean | null>(null);
  const [clearStats, setClearStats] = useState<{current: number; goal: number} | null>(null);
  const [dailyInfo, setDailyInfo] = useState<{
    todayCount: number;
    dailyRequired: number;
    todayCompleted: boolean;
    isCompleted: boolean;
  } | null>(null);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (resultModalOpen && currentSong && profile && !processed) {
      setProcessed(true);

      (async () => {
        try {
          await fetchProfile({ forceRefresh: true });

          if (lessonContext) {
            let success = true;

            if (lessonContext.clearConditions.rank) {
              const requiredRankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
              const currentRankOrder = requiredRankOrder[score.rank as keyof typeof requiredRankOrder];
              const requiredOrder = requiredRankOrder[lessonContext.clearConditions.rank as keyof typeof requiredRankOrder];
              if (currentRankOrder < requiredOrder) {
                success = false;
              }
            }

            if (lessonContext.clearConditions.speed && settings.playbackSpeed < lessonContext.clearConditions.speed) {
              success = false;
            }

            if (lessonContext.clearConditions.key !== undefined && settings.transpose !== lessonContext.clearConditions.key) {
              success = false;
            }

            setLessonRequirementSuccess(success);

            if (success && currentSong) {
              try {
                await updateLessonRequirementProgress(
                  lessonContext.lessonId,
                  currentSong.id,
                  score.rank,
                  lessonContext.clearConditions
                );

                const progressRows = await fetchLessonRequirementsProgress(lessonContext.lessonId);
                const thisProgress = progressRows.find(p => p.song_id === currentSong.id || p.lesson_song_id === currentSong.id);
                const requiresDays = !!lessonContext.clearConditions.requires_days;
                const requiredCount = lessonContext.clearConditions.count || 1;

                if (thisProgress && requiresDays) {
                  setClearStats({
                    current: (thisProgress.clear_dates || []).length,
                    goal: requiredCount,
                  });
                  const today = new Date().toISOString().split('T')[0];
                  const todayProgress = thisProgress.daily_progress?.[today];
                  setDailyInfo({
                    todayCount: todayProgress?.count || 0,
                    dailyRequired: lessonContext.clearConditions.daily_count || 1,
                    todayCompleted: todayProgress?.completed || false,
                    isCompleted: thisProgress.is_completed,
                  });
                } else if (thisProgress) {
                  setClearStats({
                    current: thisProgress.clear_count,
                    goal: requiredCount,
                  });
                }
              } catch (error) {
                log.error('実習課題の進捗更新に失敗:', error);
              }
            }
          }

          if (!lessonContext && currentSong) {
            try {
              const { getCurrentUserIdCached, getSupabaseClient } = await import('@/platform/supabaseClient');
              const supabase = getSupabaseClient();
              const userId = await getCurrentUserIdCached();

              if (userId) {
                const rankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
                const currentRankOrder = rankOrder[score.rank as keyof typeof rankOrder];
                const isBRankPlus = currentRankOrder >= 2;

                if (isBRankPlus) {
                  const { data: updateResult } = await supabase.rpc('update_song_clear_progress', {
                    _user_id: userId,
                    _song_id: currentSong.id,
                    _rank: score.rank,
                    _is_b_rank_plus: true,
                    _transpose: settings.transpose
                  });

                  if (updateResult) {
                    setClearStats({
                      current: updateResult.b_rank_plus_count || 0,
                      goal: 50
                    });
                  }
                } else {
                  const { data: stats } = await supabase
                    .from('user_song_stats')
                    .select('b_rank_plus_count')
                    .eq('user_id', userId)
                    .eq('song_id', currentSong.id)
                    .single();

                  setClearStats({
                    current: stats?.b_rank_plus_count || 0,
                    goal: 50
                  });
                }
              }
            } catch (error) {
              log.error('通常曲のクリア回数処理に失敗:', error);
            }
          }
        } catch (error) {
          log.error('結果画面の処理でエラーが発生しました:', error);
        }
      })().catch(error => {
        log.error('ResultModal async処理でキャッチされなかったエラー:', error);
      });
    } else if (!resultModalOpen) {
      setLessonRequirementSuccess(null);
      setClearStats(null);
      setDailyInfo(null);
      setProcessed(false);
    }
  }, [resultModalOpen, lessonContext, currentSong, profile, processed]);

  if (!resultModalOpen || !currentSong) return null;

  const handleRetry = () => {
    resetScore();
    seek(0);
    closeResultModal();
    setProcessed(false);
  };

  const handleChooseSong = () => {
    resetScore();
    seek(0);
    closeResultModal();
    clearLessonContext();
    setProcessed(false);
    window.location.hash = '#dashboard';
  };

  // ランクによる色とグロー効果
  const getRankStyle = (rank: string) => {
    switch (rank) {
      case 'S': return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]';
      case 'A': return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]';
      case 'B': return 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]';
      case 'C': return 'text-purple-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]';
      default: return 'text-gray-400 drop-shadow-[0_0_10px_rgba(156,163,175,0.8)]';
    }
  };

  // 精度による星表示
  const getStars = (accuracy: number) => {
    const stars = Math.floor(accuracy * 5);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <div className="modal-overlay animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-content p-0 space-y-0 max-w-md w-full mx-4 sm:mx-auto bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 shadow-2xl overflow-hidden">
        {/* ヘッダー部分（固定） */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2 tracking-wider">
            RESULT
          </h2>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-semibold text-gray-100 mb-1 truncate">{currentSong.title}</div>
            <div className="text-sm text-gray-400 truncate">{currentSong.artist}</div>
          </div>
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto custom-game-scrollbar">
                  {/* ランク表示 */}
        <div className="text-center py-4 sm:py-6">
          <div className={`text-6xl sm:text-8xl font-black ${getRankStyle(score.rank)} animate-pulse-slow`}>
            {score.rank}
          </div>
          <div className="text-yellow-300 text-base sm:text-lg mt-2">
            {getStars(score.accuracy)}
          </div>
        </div>
        
        {/* レッスン課題条件の成否表示 */}
        {lessonContext && lessonRequirementSuccess !== null && (
          <div className="px-4 sm:px-6 py-4">
            <div className={`text-center p-4 rounded-lg ${
              lessonRequirementSuccess 
                ? 'bg-emerald-900/30 border-2 border-emerald-500' 
                : 'bg-red-900/30 border-2 border-red-500'
            }`}>
              <div className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
                {lessonRequirementSuccess ? (
                  <>
                    <FaCheckCircle className="text-emerald-400" />
                    課題条件クリア！
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400" />
                    課題条件未達成
                  </>
                )}
              </div>
              <div className="text-sm text-gray-300">
                <div>必要条件:</div>
                <div className="mt-1">
                  ランク: {lessonContext.clearConditions.rank}以上
                  {lessonContext.clearConditions.speed && ` / 速度: ${lessonContext.clearConditions.speed}倍以上`}
                  {lessonContext.clearConditions.key !== undefined && ` / キー: ${lessonContext.clearConditions.key > 0 ? '+' : ''}${lessonContext.clearConditions.key}`}
                </div>
                {(lessonContext.clearConditions.count || 1) > 1 && (
                  <div className="mt-1 text-xs">
                    {lessonContext.clearConditions.requires_days 
                      ? `${lessonContext.clearConditions.count}日間クリアが必要${lessonContext.clearConditions.daily_count ? ` (${lessonContext.clearConditions.daily_count}回/日)` : ''}`
                      : `${lessonContext.clearConditions.count}回クリアが必要`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {clearStats && (
          <div className="px-4 sm:px-6 py-2">
            <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-600">
              <div className="text-sm font-medium text-gray-300 mb-1">
                {lessonContext?.clearConditions.requires_days ? 'クリア日数' : 'クリア回数'}
                {dailyInfo && ` (${dailyInfo.dailyRequired}回/日)`}
              </div>
              <div className="text-lg font-bold text-blue-400">
                {clearStats.current} / {clearStats.goal}
                {lessonContext?.clearConditions.requires_days ? '日' : '回'}
              </div>
              {dailyInfo && !dailyInfo.isCompleted && (
                <div className="mt-1">
                  {dailyInfo.todayCompleted ? (
                    <span className="text-xs text-emerald-400">✅ 本日の課題: クリア済み</span>
                  ) : (
                    <span className="text-xs text-yellow-300">
                      📅 本日: {dailyInfo.todayCount}/{dailyInfo.dailyRequired}回
                      {dailyInfo.todayCount > 0 && ` (あと${dailyInfo.dailyRequired - dailyInfo.todayCount}回)`}
                    </span>
                  )}
                </div>
              )}
              {(dailyInfo?.isCompleted || clearStats.current >= clearStats.goal) && (
                <div className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <FaAward className="text-emerald-400" />
                  目標達成！
                </div>
              )}
            </div>
          </div>
        )}

          {/* スコア詳細 */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* メインスコア */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-3xl sm:text-4xl font-bold text-white">
              {score.score.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">SCORE</div>
          </div>

          {/* 詳細統計 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-emerald-400 text-xl sm:text-2xl font-bold">{score.goodCount}</div>
              <div className="text-xs text-gray-400">GOOD</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-red-400 text-xl sm:text-2xl font-bold">{score.missCount}</div>
              <div className="text-xs text-gray-400">MISS</div>
            </div>
          </div>

          {/* 精度バー */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>精度</span>
              <span>{Math.round(score.accuracy * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${score.accuracy * 100}%` }}
              />
            </div>
          </div>

          {/* 設定情報 */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">再生速度:</span>
              <span className="font-mono">{settings.playbackSpeed}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">移調:</span>
              <span className="font-mono">{settings.transpose > 0 ? `+${settings.transpose}` : settings.transpose}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={handleRetry} 
              className="control-btn control-btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <span>もう一度</span>
            </button>
            <button 
              onClick={handleChooseSong} 
              className="control-btn control-btn-secondary flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <span>曲選択</span>
            </button>
            {lessonContext && (
              <button 
                onClick={() => {
                  resetScore();
                  seek(0);
                  closeResultModal();
                  setProcessed(false);
                  window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
                }}
                className="control-btn control-btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <FaArrowLeft />
                <span>レッスンに戻る</span>
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 