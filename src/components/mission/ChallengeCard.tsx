import React, { useEffect, useState } from 'react';
import { Mission, UserMissionProgress } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/utils/cn';
import { FaTrophy, FaMusic, FaCalendarAlt, FaClock, FaCheck, FaPlay } from 'react-icons/fa';
import MissionSongProgress from './MissionSongProgress';

interface Props {
  mission: Mission;
  progress?: UserMissionProgress;
}

const ChallengeCard: React.FC<Props> = ({ mission, progress }) => {
  const { claim, fetchSongProgress, songProgress } = useMissionStore();
  const [showSongProgress, setShowSongProgress] = useState(false);
  
  const total = mission.diary_count ?? mission.clears_required ?? 1;
  const cleared = progress?.clear_count ?? 0;
  const completed = progress?.completed ?? false;
  const progressPercentage = Math.min((cleared / total) * 100, 100);
  
  // 曲進捗を取得
  useEffect(() => {
    console.log('ChallengeCard useEffect:', { 
      missionId: mission.id, 
      songsCount: mission.songs?.length || 0,
      songs: mission.songs?.map(s => ({ id: s.song_id, title: s.songs?.title }))
    });
    if (mission.songs && mission.songs.length > 0) {
      console.log('曲進捗を取得中:', mission.id);
      fetchSongProgress(mission.id);
    }
  }, [mission.id, mission.songs, fetchSongProgress]);
  
  const currentSongProgress = songProgress[mission.id] || [];
  const allSongsCompleted = currentSongProgress.length > 0 && 
    currentSongProgress.every(song => song.is_completed);
  
  console.log('ChallengeCard render:', { 
    missionId: mission.id, 
    currentSongProgressLength: currentSongProgress.length,
    allSongsCompleted,
    songProgress: currentSongProgress.map(s => ({ id: s.song_id, title: s.song?.title, completed: s.is_completed }))
  });
  
  // ミッションタイプアイコンの決定
  const getMissionIcon = () => {
    if (mission.type === 'weekly') return <FaCalendarAlt className="w-4 h-4 text-green-400" />;
    if (mission.type === 'monthly') return <FaClock className="w-4 h-4 text-purple-400" />;
    return <FaMusic className="w-4 h-4 text-blue-400" />;
  };

  // 進捗バーの色を動的に変更
  const getProgressBarColor = () => {
    if (completed) return 'bg-emerald-500';
    if (progressPercentage >= 80) return 'bg-yellow-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  // 残り日数計算
  const getRemainingDays = () => {
    const endDate = new Date(mission.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays();

  return (
    <div className={cn(
      "p-4 rounded-lg space-y-3 border-2 transition-all duration-300",
      completed 
        ? "bg-emerald-900/30 border-emerald-500/50 shadow-emerald-500/20 shadow-lg" 
        : "bg-slate-800 border-slate-700 hover:border-slate-600"
    )}>
      {/* ヘッダー部分 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 flex-1">
          {getMissionIcon()}
          <div className="flex-1">
            <div className="font-bold text-gray-100 leading-tight">{mission.title}</div>
            {mission.type && (
              <div className="text-xs text-gray-400 mt-1">
                {mission.type === 'weekly' ? 'ウィークリーチャレンジ' : 'マンスリーミッション'}
              </div>
            )}
          </div>
        </div>
        
        {completed && (
          <div className="flex items-center space-x-1 text-emerald-400">
            <FaCheck className="w-3 h-3" />
            <span className="text-xs font-medium">完了</span>
          </div>
        )}
      </div>

      {/* 説明文 */}
      {mission.description && (
        <div className="text-gray-300 text-xs leading-relaxed">
          {mission.description}
        </div>
      )}

      {/* 曲一覧（簡易表示） */}
      {mission.songs && mission.songs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">登録曲</span>
            <button
              onClick={() => setShowSongProgress(!showSongProgress)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showSongProgress ? '詳細を隠す' : '詳細を見る'}
            </button>
          </div>
          
          {!showSongProgress && (
            <div className="grid grid-cols-1 gap-2">
              {mission.songs.slice(0, 3).map(s => (
                <div key={s.song_id} className="flex items-center space-x-2 text-xs">
                  <FaMusic className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-300">
                    {s.songs?.title || s.song_id}
                  </span>
                </div>
              ))}
              {mission.songs.length > 3 && (
                <div className="text-xs text-gray-500">
                  他 {mission.songs.length - 3} 曲...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 曲進捗詳細表示 */}
      {showSongProgress && mission.songs && mission.songs.length > 0 && (
        <div className="border-t border-slate-700 pt-3">
          <MissionSongProgress 
            missionId={mission.id} 
            songProgress={currentSongProgress} 
          />
        </div>
      )}

      {/* 詳細進捗バー */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">進捗状況</span>
          <span className={cn(
            "text-xs font-bold",
            completed ? "text-emerald-400" : "text-gray-300"
          )}>
            {cleared}/{total} 回
          </span>
        </div>
        
        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
          {/* 背景グラデーション */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600" />
          
          {/* 進捗バー */}
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out relative",
              getProgressBarColor()
            )}
            style={{ width: `${progressPercentage}%` }}
          >
            {/* 進捗バーのグラデーション効果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
          
          {/* 進捗パーセンテージ表示 */}
          {progressPercentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>

        {/* 詳細情報 */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center space-x-3">
            {/* 残り日数 */}
            <div className={cn(
              "flex items-center space-x-1",
              remainingDays <= 3 ? "text-red-400" : "text-gray-400"
            )}>
              <FaClock className="w-3 h-3" />
              <span>
                {remainingDays > 0 ? `あと${remainingDays}日` : '期限切れ'}
              </span>
            </div>
            
            {/* 報酬倍率 */}
            {mission.reward_multiplier && mission.reward_multiplier > 1 && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <FaTrophy className="w-3 h-3" />
                <span>{mission.reward_multiplier}x ボーナス</span>
              </div>
            )}
          </div>
          
          {/* 達成状況 */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            completed 
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : progressPercentage >= 80
              ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
              : "bg-slate-600/20 text-slate-400 border border-slate-500/30"
          )}>
            {completed ? '達成済み' : progressPercentage >= 80 ? 'もう少し' : '進行中'}
          </div>
        </div>
      </div>

      {/* 報酬受取ボタン */}
      <button
        disabled={!completed && !allSongsCompleted}
        className={cn(
          'btn btn-sm w-full transition-all duration-300 flex items-center justify-center space-x-2',
          (completed || allSongsCompleted)
            ? 'btn-primary hover:scale-105 shadow-lg' 
            : 'btn-disabled opacity-50'
        )}
        onClick={() => claim(mission.id)}
      >
        <FaTrophy className="w-4 h-4" />
        <span>
          {completed ? '報酬を受け取る' : 
           allSongsCompleted ? '報酬を受け取る（曲クリア済み）' : 
           '報酬受取（未達成）'}
        </span>
      </button>
    </div>
  );
};

export default ChallengeCard; 