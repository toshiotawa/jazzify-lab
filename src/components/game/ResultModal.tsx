import React, { useEffect, useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import { useLessonContext } from '@/stores/gameStore';
import { addXp, calcLevel } from '@/platform/supabaseXp';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { updateMissionSongProgress, fetchMissionSongProgress } from '@/platform/supabaseMissions';
import { useAuthStore } from '@/stores/authStore';
import { useMissionStore } from '@/stores/missionStore';
import { calculateXP, calculateXPDetailed, XPDetailed } from '@/utils/xpCalculator';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaAward } from 'react-icons/fa';

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
  const missionContext = useGameSelector((s) => s.missionContext);
  const { fetchSongProgress } = useMissionStore();

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
  const [missionRequirementSuccess, setMissionRequirementSuccess] = useState<boolean | null>(null);
  const [clearStats, setClearStats] = useState<{current: number; goal: number} | null>(null);

  // XP計算・加算（一度だけ実行）
  const [xpProcessed, setXpProcessed] = useState(false);
  
  useEffect(() => {
    if (resultModalOpen && currentSong && profile && !xpProcessed) {
      setXpProcessed(true);
      
      (async () => {
        // ローカルで詳細計算
        const detailed = calculateXPDetailed({
          membershipRank: profile.rank,
          scoreRank: score.rank as any,
          playbackSpeed: settings.playbackSpeed,
          transposed: settings.transpose !== 0,
          lessonBonusMultiplier: lessonContext ? 2 : 1,
          missionBonusMultiplier: missionContext ? 2 : 1,
          challengeBonusMultiplier: 1, // TODO: challengeから
          seasonMultiplier: profile.next_season_xp_multiplier ?? 1,
        });

        const res = await addXp({
          songId: currentSong.id,
          baseXp: 1000, // サーバー側でも再計算するため placeholder
          speedMultiplier: settings.playbackSpeed,
          rankMultiplier: score.rank === 'S' ? 1 : score.rank === 'A' ? 0.8 : 0.5,
          transposeMultiplier: settings.transpose !== 0 ? 1.3 : 1,
          membershipMultiplier: profile.rank === 'premium' ? 1.5 : profile.rank === 'platinum' ? 2 : 1,
          missionMultiplier: missionContext ? 2 : 1,
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
        
        // ミッションモードの場合、進捗を更新
        if (missionContext && currentSong) {
          try {
            // ミッションの曲条件を取得（実際の条件を使用）
            const missionSong = await fetchMissionSongConditions(missionContext.missionId, currentSong.id);
            
            // 課題条件を満たしているかチェック
            let success = true;
            
            // ランク条件
            if (missionSong.min_rank) {
              const requiredRankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1, 'D': 0 };
              const currentRankOrder = requiredRankOrder[score.rank as keyof typeof requiredRankOrder];
              const requiredOrder = requiredRankOrder[missionSong.min_rank as keyof typeof requiredRankOrder];
              if (currentRankOrder < requiredOrder) {
                success = false;
              }
            }
            
            // 速度条件
            if (missionSong.min_speed && settings.playbackSpeed < missionSong.min_speed) {
              success = false;
            }
            
            // キー条件
            if (missionSong.key_offset !== undefined && settings.transpose !== missionSong.key_offset) {
              success = false;
            }
            
            setMissionRequirementSuccess(success);
            
            // 成功した場合、ミッション進捗を更新
            if (success) {
              await updateMissionSongProgress(
                missionContext.missionId,
                currentSong.id,
                score.rank,
                {
                  min_rank: missionSong.min_rank || 'B',
                  min_speed: missionSong.min_speed || 1.0
                }
              );
              
              // ミッション進捗キャッシュを強制更新
              await fetchSongProgress(missionContext.missionId, true);
              
              // クリア回数統計を設定
              const songProgress = await fetchMissionSongProgress(missionContext.missionId);
              const newCount = songProgress.find((s: any) => s.song_id === currentSong.id)?.clear_count || 0;
              setClearStats({ 
                current: newCount, 
                goal: missionSong.clears_required || 1 
              });
            }
          } catch (error) {
            console.error('ミッション進捗の更新に失敗:', error);
          }
        }
        
        // レッスンモードの場合、クリア回数統計を設定
        if (lessonContext && currentSong) {
          try {
            const result = await updateLessonRequirementProgress(
              lessonContext.lessonId,
              currentSong.id,
              score.rank,
              lessonContext.clearConditions
            );
            const newCount = typeof result === 'object' && result !== null ? (result as any).clear_count || 0 : 0;
            setClearStats({ 
              current: newCount, 
              goal: lessonContext.clearConditions.count || 1 
            });
          } catch (error) {
            console.error('レッスン進捗の更新に失敗:', error);
          }
        }
        
        // 通常曲の場合、クリア回数統計を設定
        if (!lessonContext && !missionContext && currentSong) {
          try {
            const { getSupabaseClient } = await import('@/platform/supabaseClient');
            const supabase = getSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              const { data: progress } = await supabase
                .from('user_song_progress')
                .select('clear_count')
                .eq('user_id', user.id)
                .eq('song_id', currentSong.id)
                .single();
              
              const currentCount = progress?.clear_count || 0;
              setClearStats({ current: currentCount, goal: 50 });
            }
          } catch (error) {
            console.error('通常曲のクリア回数取得に失敗:', error);
          }
        }
      })();
    } else if (!resultModalOpen) {
      setXpInfo(null);
      setLessonRequirementSuccess(null);
      setMissionRequirementSuccess(null);
      setClearStats(null);
      setXpProcessed(false);
    }
  }, [resultModalOpen, lessonContext, missionContext, currentSong, profile, xpProcessed]);

  // ミッションの曲条件を取得するヘルパー関数
  const fetchMissionSongConditions = async (missionId: string, songId: string) => {
    const { getSupabaseClient } = await import('@/platform/supabaseClient');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('challenge_tracks')
      .select('min_rank, min_speed, key_offset, notation_setting, clears_required')
      .eq('challenge_id', missionId)
      .eq('song_id', songId)
      .single();
    
    if (error) {
      console.error('ミッション曲条件の取得に失敗:', error);
      return {
        min_rank: 'B',
        min_speed: 1.0,
        key_offset: 0,
        notation_setting: 'both',
        clears_required: 1
      };
    }
    
    return data;
  };

  if (!resultModalOpen || !currentSong) return null;

  const handleRetry = () => {
    resetScore();
    seek(0);
    closeResultModal();
    setXpProcessed(false);
  };

  const handleChooseSong = () => {
    resetScore();
    seek(0);
    closeResultModal();
    setCurrentTab('songs');
    setXpProcessed(false);
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
                      ? `${lessonContext.clearConditions.count}日間クリアが必要`
                      : `${lessonContext.clearConditions.count}回クリアが必要`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ミッション課題条件の成否表示 */}
        {missionContext && missionRequirementSuccess !== null && (
          <div className="px-4 sm:px-6 py-4">
            <div className={`text-center p-4 rounded-lg ${
              missionRequirementSuccess 
                ? 'bg-emerald-900/30 border-2 border-emerald-500' 
                : 'bg-red-900/30 border-2 border-red-500'
            }`}>
              <div className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
                {missionRequirementSuccess ? (
                  <>
                    <FaCheckCircle className="text-emerald-400" />
                    ミッション条件クリア！
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-400" />
                    ミッション条件未達成
                  </>
                )}
              </div>
              <div className="text-sm text-gray-300">
                <div>ミッション課題条件:</div>
                <div className="mt-1 text-xs">
                  ランク: B以上 / 速度: 1.0倍以上 / キー: 0
                </div>
              </div>
            </div>
          </div>
        )}

        {clearStats && (
          <div className="px-4 sm:px-6 py-2">
            <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-slate-600">
              <div className="text-sm font-medium text-gray-300 mb-1">
                クリア回数
              </div>
              <div className="text-lg font-bold text-blue-400">
                {clearStats.current} / {clearStats.goal}
              </div>
              {clearStats.current >= clearStats.goal && (
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
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

          {/* 獲得XP & レベル進捗 */}
          {xpInfo && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 mb-6 border border-yellow-500/30">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-yellow-400">
                  +{xpInfo.gained.toLocaleString()} XP
                </div>
                <div className="text-sm text-gray-300">
                  レベル {xpInfo.level} ({xpInfo.remainder.toLocaleString()} / {xpInfo.next.toLocaleString()} XP)
                </div>
              </div>
              
              {xpInfo.levelUp && (
                <div className="text-center py-2 bg-yellow-500/20 rounded-lg mb-3">
                  <div className="text-lg font-bold text-yellow-400 flex items-center justify-center gap-2">
                    <FaAward className="text-yellow-400" />
                    レベルアップ！
                  </div>
                  <div className="text-sm text-yellow-300">レベル {profile?.level || 1} → {xpInfo.level}</div>
                </div>
              )}
              
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>基本XP:</span>
                  <span>{xpInfo.detailed?.base || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>レッスンボーナス:</span>
                  <span>x{xpInfo.detailed?.multipliers?.lesson || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>ミッションボーナス:</span>
                  <span>x{xpInfo.detailed?.multipliers?.mission || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>速度ボーナス:</span>
                  <span>x{xpInfo.detailed?.multipliers?.speed || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>移調ボーナス:</span>
                  <span>x{xpInfo.detailed?.multipliers?.transpose || 1}</span>
                </div>
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
            {/* レッスンに戻るボタン（レッスンコンテキストがある場合のみ表示） */}
            {lessonContext && (
              <button 
                onClick={() => {
                  // レッスン詳細ページに戻る
                  resetScore();
                  seek(0);
                  closeResultModal();
                  setXpProcessed(false);
                  window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
                }}
                className="control-btn control-btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <FaArrowLeft />
                <span>レッスンに戻る</span>
              </button>
            )}
            
            {/* ミッションに戻るボタン（ミッションコンテキストがある場合のみ表示） */}
            {missionContext && (
              <button 
                onClick={() => {
                  // ミッション一覧に戻る
                  resetScore();
                  seek(0);
                  closeResultModal();
                  setXpProcessed(false);
                  window.location.hash = '#missions';
                }}
                className="control-btn control-btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <FaArrowLeft />
                <span>ミッションに戻る</span>
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