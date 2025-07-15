import React, { useEffect, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { useLessonContext } from '@/stores/gameStore';
import { addXp, calcLevel } from '@/platform/supabaseXp';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { useAuthStore } from '@/stores/authStore';
import { calculateXP, calculateXPDetailed, XPDetailed } from '@/utils/xpCalculator';

const ResultModal: React.FC = () => {
  const { currentSong, score, settings, resultModalOpen } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    score: s.score,
    settings: s.settings,
    resultModalOpen: s.resultModalOpen
  }));
  const { closeResultModal, resetScore, seek, setCurrentTab } = useGameActions();

  const { profile, fetchProfile } = useAuthStore();
  const lessonContext = useLessonContext();

  const [xpInfo, setXpInfo] = useState<{
    gained: number;
    total: number;
    level: number;
    remainder: number;
    next: number;
    levelUp: boolean;
    detailed?: XPDetailed;
  } | null>(null);
  
  const [lessonRequirementSuccess, setLessonRequirementSuccess] = useState<boolean | null>(null);

  // XP計算・加算
  useEffect(() => {
    if (resultModalOpen && currentSong && profile) {
      (async () => {
        // ローカルで詳細計算
        const detailed = calculateXPDetailed({
          membershipRank: profile.rank,
          scoreRank: score.rank as any,
          playbackSpeed: settings.playbackSpeed,
          transposed: settings.transpose !== 0,
          // 以下の値は実際のcontextから取得する必要がある。仮に1とするか、適切に設定
          lessonBonusMultiplier: 1, // TODO: lessonContextから取得
          missionBonusMultiplier: 1, // TODO: missionから
          challengeBonusMultiplier: 1, // TODO: challengeから
          seasonMultiplier: 1, // TODO: profileから取得予定
        });

        const res = await addXp({
          songId: currentSong.id,
          baseXp: 1000, // サーバー側でも再計算するため placeholder
          speedMultiplier: settings.playbackSpeed,
          rankMultiplier: score.rank === 'S' ? 1 : score.rank === 'A' ? 0.8 : 0.5,
          transposeMultiplier: settings.transpose !== 0 ? 1.3 : 1,
          membershipMultiplier: profile.rank === 'premium' ? 1.5 : profile.rank === 'platinum' ? 2 : 1,
        });

        const levelDetail = calcLevel(res.totalXp);

        setXpInfo({
          gained: res.gainedXp ?? detailed.total,
          total: res.totalXp,
          level: res.level,
          remainder: levelDetail.remainder,
          next: levelDetail.nextLevelXp,
          levelUp: res.level > profile.level,
          detailed
        });

        await fetchProfile();
        
        // レッスンモードの場合、課題条件の成否を判定
        if (lessonContext) {
          // 課題条件を満たしているかチェック
          let success = true;
          
          // ランク条件
          if (lessonContext.clearConditions.rank) {
            const requiredRankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
            const currentRankOrder = requiredRankOrder[score.rank as keyof typeof requiredRankOrder];
            const requiredOrder = requiredRankOrder[lessonContext.clearConditions.rank as keyof typeof requiredRankOrder];
            if (currentRankOrder < requiredOrder) {
              success = false;
            }
          }
          
          // 速度条件
          if (lessonContext.clearConditions.speed && settings.playbackSpeed < lessonContext.clearConditions.speed) {
            success = false;
          }
          
          // キー条件
          if (lessonContext.clearConditions.key !== undefined && settings.transpose !== lessonContext.clearConditions.key) {
            success = false;
          }
          
          setLessonRequirementSuccess(success);
          
          // 成功した場合、実習課題の進捗を更新
          if (success && currentSong) {
            try {
              await updateLessonRequirementProgress(
                lessonContext.lessonId,
                currentSong.id,
                score.rank,
                lessonContext.clearConditions
              );
            } catch (error) {
              console.error('実習課題の進捗更新に失敗:', error);
            }
          }
        }
      })();
    } else {
      setXpInfo(null);
      setLessonRequirementSuccess(null);
    }
  }, [resultModalOpen, lessonContext, currentSong, score, settings]);

  if (!resultModalOpen || !currentSong) return null;

  const handleRetry = () => {
    resetScore();
    seek(0);
    closeResultModal();
  };

  const handleChooseSong = () => {
    resetScore();
    seek(0);
    closeResultModal();
    setCurrentTab('songs');
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
              <div className="text-lg font-bold mb-2">
                {lessonRequirementSuccess ? '✅ 課題条件クリア！' : '❌ 課題条件未達成'}
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
                      ? `${lessonContext.clearConditions.count}日間クリアが必要`
                      : `${lessonContext.clearConditions.count}回クリアが必要`}
                  </div>
                )}
              </div>
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

          {/* 獲得XP & レベル進捗 */}
          {xpInfo && (
            <div className="mb-6">
              <div className="text-center mb-2">
                <span className="text-emerald-400 font-bold">+{xpInfo.gained.toLocaleString()} XP</span>
                {xpInfo.levelUp && (
                  <span className="ml-2 text-yellow-400 font-extrabold animate-bounce">LEVEL UP!</span>
                )}
              </div>
              
              {/* XP詳細 */}
              {xpInfo.detailed && (
                <div className="bg-gray-800/50 rounded-lg p-3 mt-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>基本得点:</div>
                    <div>{xpInfo.detailed.base}</div>
                    <div>速度ボーナス:</div>
                    <div>x{xpInfo.detailed.multipliers.speed.toFixed(2)}</div>
                    <div>移調ボーナス:</div>
                    <div>x{xpInfo.detailed.multipliers.transpose.toFixed(1)}</div>
                    <div>ミッションボーナス:</div>
                    <div>x{xpInfo.detailed.multipliers.mission.toFixed(1)}</div>
                    <div>アカウントランク:</div>
                    <div>{profile?.rank === 'free' ? 'フリー 1.0' : 
                          profile?.rank === 'standard' ? 'スタンダード 1.0' :
                          profile?.rank === 'premium' ? 'プレミアム 1.5' :
                          profile?.rank === 'platinum' ? 'プラチナム 2.0' : '1.0'} x{xpInfo.detailed.multipliers.membership.toFixed(1)}</div>
                    {/* 他のボーナスも必要に応じて */}
                  </div>
                  <div className="mt-2 border-t border-gray-600 pt-2 text-center">
                    最終得点: {xpInfo.gained}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 flex justify-between mb-1">
                <span>Lv.{xpInfo.level}</span>
                <span>{xpInfo.remainder}/{xpInfo.next} XP</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                  style={{ width: `${(xpInfo.remainder / xpInfo.next) * 100}%` }}
                />
              </div>
            </div>
          )}

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
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 