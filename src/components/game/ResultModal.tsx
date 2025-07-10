import React, { useEffect, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { addXp, calcLevel } from '@/platform/supabaseXp';
import { useAuthStore } from '@/stores/authStore';

const ResultModal: React.FC = () => {
  const { currentSong, score, settings, resultModalOpen } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    score: s.score,
    settings: s.settings,
    resultModalOpen: s.resultModalOpen
  }));
  const { closeResultModal, resetScore, seek, setCurrentTab } = useGameActions();

  const { profile, fetchProfile } = useAuthStore();

  const [xpInfo, setXpInfo] = useState<{
    gained: number;
    total: number;
    level: number;
    remainder: number;
    next: number;
    levelUp: boolean;
  } | null>(null);

  // XP計算・加算
  useEffect(() => {
    if (resultModalOpen && currentSong && profile) {
      (async () => {
        const baseXp = 1000; // TODO: 難易度などで可変化
        const speedMul = settings.playbackSpeed;
        const rankMul = score.rank === 'S' ? 1 : score.rank === 'A' ? 0.8 : 0.5;
        const transposeMul = settings.transpose !== 0 ? 1.3 : 1;
        const memberMul = profile.rank === 'premium' ? 1.5 : profile.rank === 'platinum' ? 2 : 1;

        const res = await addXp({
          songId: currentSong.id,
          baseXp,
          speedMultiplier: speedMul,
          rankMultiplier: rankMul,
          transposeMultiplier: transposeMul,
          membershipMultiplier: memberMul,
        });

        const levelDetail = calcLevel(res.totalXp);

        setXpInfo({
          gained: res.gainedXp,
          total: res.totalXp,
          level: res.level,
          remainder: levelDetail.remainder,
          next: levelDetail.nextLevelXp,
          levelUp: res.level > profile.level,
        });

        await fetchProfile();
      })();
    } else {
      setXpInfo(null);
    }
  }, [resultModalOpen]);

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
      <div className="modal-content p-0 space-y-0 max-w-md w-full bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 shadow-2xl">
        {/* ヘッダー部分 */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 border-b border-gray-700">
          <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-wider">
            RESULT
          </h2>
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-100 mb-1">{currentSong.title}</div>
            <div className="text-sm text-gray-400">{currentSong.artist}</div>
          </div>
        </div>

        {/* ランク表示 */}
        <div className="text-center py-6">
          <div className={`text-8xl font-black ${getRankStyle(score.rank)} animate-pulse-slow`}>
            {score.rank}
          </div>
          <div className="text-yellow-300 text-lg mt-2">
            {getStars(score.accuracy)}
          </div>
        </div>

        {/* スコア詳細 */}
        <div className="px-6 pb-6">
          {/* メインスコア */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white">
              {score.score.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">SCORE</div>
          </div>

          {/* 詳細統計 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-emerald-400 text-2xl font-bold">{score.goodCount}</div>
              <div className="text-xs text-gray-400">GOOD</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-red-400 text-2xl font-bold">{score.missCount}</div>
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
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleRetry} 
              className="control-btn control-btn-primary flex items-center space-x-2"
            >
              <span>もう一度</span>
            </button>
            <button 
              onClick={handleChooseSong} 
              className="control-btn control-btn-secondary flex items-center space-x-2"
            >
              <span>曲選択</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal; 