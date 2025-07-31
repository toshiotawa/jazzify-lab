import React, { useState } from 'react';
import { Mission, UserMissionProgress } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/utils/cn';
import { FaTrophy, FaMusic, FaCalendarAlt, FaClock, FaCheck } from 'react-icons/fa';
import MissionSongProgress from './MissionSongProgress';

interface Props {
  mission: Mission;
  progress?: UserMissionProgress;
}

const ChallengeCard: React.FC<Props> = ({ mission, progress }) => {
  const { claim, songProgress } = useMissionStore();
  const [showSongProgress, setShowSongProgress] = useState(false);
  
  const currentSongProgress = songProgress[mission.id] || [];
  const allSongsCompleted = currentSongProgress.length > 0 && 
    currentSongProgress.every(song => song.is_completed);
  
  // ミッション全体の進捗を計算（日記ミッション対応）
  const totalDiary = mission.diary_count ?? 0;
  const totalSongs = mission.songs?.length ?? 0;
  const total = totalDiary || totalSongs;
  
  const clearedDiary = totalDiary
    ? (progress?.clear_count ?? 0)      // RPC で更新済み
    : 0;
  const clearedSongs = currentSongProgress
    .filter(s => s.is_completed).length;
  
  const cleared = totalDiary ? clearedDiary : clearedSongs;
  
  // 進捗判定ロジックを修正
  const isCompleted = cleared >= total && total > 0;
  const isRewardClaimed = progress?.reward_claimed ?? false;
  const completed = progress?.completed ?? isCompleted;
  
  const progressPercentage = total > 0
    ? Math.min((cleared / total) * 100, 100)
    : 0;
  
  // デバッグログを追加
  // console.log(    missionId: mission.id, 
    currentSongProgressLength: currentSongProgress.length,
    allSongsCompleted,
    progress: progress,
    reward_claimed: progress?.reward_claimed,
    completed: completed,
    isCompleted: isCompleted,
    isRewardClaimed: isRewardClaimed,
    cleared: cleared,
    total: total,
    songProgress: currentSongProgress.map(s => ({ id: s.song_id, title: s.song?.title, completed: s.is_completed  {
// }))
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

  // クリア条件の表示用ヘルパー関数
  const getClearConditionText = (song: unknown) => {
    const conditions = [];
    
    if (song.min_rank) {
      conditions.push(`ランク${song.min_rank}以上`);
    }
    
    if (song.required_count && song.required_count > 1) {
      conditions.push(`${song.required_count}回クリア`);
    } else {
      conditions.push('1回クリア');
    }
    
    if (song.min_speed && song.min_speed !== 1.0) {
      conditions.push(`速度${song.min_speed}倍以上`);
    }
    
    if (song.key_offset && song.key_offset !== 0) {
      conditions.push(`キー${song.key_offset > 0 ? '+' : ''}${song.key_offset} (${song.key_offset > 0 ? '高く' : '低く'})`);
    }
    
    if (song.notation_setting) {
      const notationText = song.notation_setting === 'notes_chords' ? 'ノート+コード' :
                          song.notation_setting === 'chords_only' ? 'コードのみ' : '両方';
      conditions.push(`楽譜: ${notationText}`);
    }
    
    return conditions.join(' / ');
  };

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

      {/* 日記ミッション表示 */}
      {totalDiary > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">日記投稿</span>
            <div className="flex items-center space-x-1">
              <FaCalendarAlt className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-300">
                {clearedDiary}/{totalDiary} 件
              </span>
            </div>
          </div>
          <div className="bg-slate-700/50 p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="w-3 h-3 text-green-400" />
              <span className="text-sm font-medium text-gray-200">
                日記を投稿しよう
              </span>
              {clearedDiary >= totalDiary && (
                <FaCheck className="w-3 h-3 text-emerald-400" />
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              毎日の練習記録を投稿してミッションをクリア
            </div>
          </div>
        </div>
      )}

      {/* 曲一覧（詳細表示） */}
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
              {mission.songs.slice(0, 3).map(s => {
                const songProgress = currentSongProgress.find(sp => sp.song_id === s.song_id);
                return (
                  <div key={s.song_id} className="bg-slate-700/50 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaMusic className="w-3 h-3 text-blue-400" />
                        <span className="text-sm font-medium text-gray-200">
                          {s.songs?.title || s.song_id}
                        </span>
                        {songProgress?.is_completed && (
                          <FaCheck className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {songProgress?.clear_count || 0}/{s.clears_required || 1}回
                      </div>
                    </div>
                    {/* クリア条件の簡易表示 */}
                    <div className="mt-1 text-xs text-gray-500">
                      {getClearConditionText(s)}
                    </div>
                  </div>
                );
              })}
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
            {cleared}/{total} {totalDiary ? '件' : '曲'}
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
            
            {/* 報酬XP */}
            {mission.reward_multiplier && mission.reward_multiplier > 0 && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <FaTrophy className="w-3 h-3" />
                <span>報酬: {mission.reward_multiplier.toLocaleString()} XP</span>
              </div>
            )}
          </div>
          
          {/* 達成状況 */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isRewardClaimed
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : isCompleted
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : progressPercentage >= 80
              ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30"
              : "bg-slate-600/20 text-slate-400 border border-slate-500/30"
          )}>
            {isRewardClaimed ? '報酬受取済み' : isCompleted ? '達成済み' : progressPercentage >= 80 ? 'もう少し' : '進行中'}
          </div>
        </div>
      </div>

      {/* 報酬受取ボタン */}
      <button
        disabled={isRewardClaimed || (!isCompleted && !allSongsCompleted)}
        onClick={() => claim(mission.id)}
        className={cn(
          "w-full btn btn-sm transition-all duration-300",
          isRewardClaimed
            ? "btn-success opacity-50 cursor-not-allowed"
            : (isCompleted || allSongsCompleted)
            ? "btn-success hover:scale-105"
            : "btn-disabled opacity-50"
        )}
      >
        {isRewardClaimed ? '報酬受取済み' : (isCompleted || allSongsCompleted) ? '報酬を受取る' : '条件未達成'}
      </button>
    </div>
  );
};

export default ChallengeCard; 