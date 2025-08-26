import React, { useState } from 'react';
import { Mission, UserMissionProgress } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { cn } from '@/utils/cn';
import { FaMusic, FaCalendarAlt, FaClock, FaCheck, FaHatWizard } from 'react-icons/fa';
import MissionSongProgress from './MissionSongProgress';
import MissionFantasyProgress from './MissionFantasyProgress';
import type { MissionFantasyStageProgressItem } from '@/platform/supabaseChallengeFantasy';

interface Props {
  mission: Mission;
  progress?: UserMissionProgress;
}

const ChallengeCard: React.FC<Props> = ({ mission, progress }) => {
  const { claim, songProgress } = useMissionStore();
  const [showSongProgress, setShowSongProgress] = useState(false);
  const [fantasyProgress, setFantasyProgress] = useState<MissionFantasyStageProgressItem[] | null>(null);
  
  const currentSongProgress = songProgress[mission.id] || [];
  
  // ミッション全体の進捗を計算（日記/曲/ファンタジー対応）
  const totalDiary = mission.diary_count ?? 0;
  const totalSongs = mission.songs?.length ?? 0;
  const totalFantasy = fantasyProgress?.length ?? 0;
  const total = mission.category === 'diary' ? totalDiary : mission.category === 'fantasy_clear' ? totalFantasy : totalSongs;
  
  const clearedDiary = totalDiary ? (progress?.clear_count ?? 0) : 0;
  const clearedSongs = currentSongProgress.filter(s => s.is_completed).length;
  const clearedFantasy = (fantasyProgress || []).filter(s => s.is_completed).length;
  
  const cleared = mission.category === 'diary' ? clearedDiary : mission.category === 'fantasy_clear' ? clearedFantasy : clearedSongs;
  
  const isCompleted = cleared >= total && total > 0;
  const isRewardClaimed = progress?.reward_claimed ?? false;
  const completed = progress?.completed ?? isCompleted;
  
  const progressPercentage = total > 0 ? Math.min((cleared / total) * 100, 100) : 0;
  
  const getMissionIcon = () => {
    if (mission.category === 'fantasy_clear') return <FaHatWizard className="w-4 h-4 text-purple-300" />;
    if (mission.type === 'weekly') return <FaCalendarAlt className="w-4 h-4 text-green-400" />;
    if (mission.type === 'monthly') return <FaClock className="w-4 h-4 text-purple-400" />;
    return <FaMusic className="w-4 h-4 text-blue-400" />;
  };

  const getRemainingDays = () => {
    const endDate = new Date(mission.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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

      {mission.description && (
        <div className="text-gray-300 text-xs leading-relaxed">
          {mission.description}
        </div>
      )}

      {/* 日記ミッション */}
      {mission.category === 'diary' && totalDiary > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">日記投稿</span>
            <div className="flex items-center space-x-1">
              <FaCalendarAlt className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-300">{clearedDiary}/{totalDiary} 件</span>
            </div>
          </div>
        </div>
      )}

      {/* 曲ミッション（概要） */}
      {mission.category === 'song_clear' && mission.songs && mission.songs.length > 0 && (
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
                const sp = currentSongProgress.find(p => p.song_id === s.song_id);
                return (
                  <div key={s.song_id} className="bg-slate-700/50 p-2 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaMusic className="w-3 h-3 text-blue-400" />
                        <span className="text-sm font-medium text-gray-200">{s.songs?.title || s.song_id}</span>
                        {sp?.is_completed && (<FaCheck className="w-3 h-3 text-emerald-400" />)}
                      </div>
                      <div className="text-xs text-gray-400">{sp?.clear_count || 0}/{s.clears_required || 1}回</div>
                    </div>
                  </div>
                );
              })}
              {mission.songs.length > 3 && (
                <div className="text-xs text-gray-500">他 {mission.songs.length - 3} 曲...</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 詳細進捗: 曲 or ファンタジー */}
      <div className="border-t border-slate-700 pt-3">
        {mission.category === 'song_clear' && mission.songs && mission.songs.length > 0 && (
          <MissionSongProgress missionId={mission.id} songProgress={currentSongProgress} />
        )}
        {mission.category === 'fantasy_clear' && (
          <MissionFantasyProgress missionId={mission.id} progressItems={fantasyProgress} onLoad={setFantasyProgress} />
        )}
      </div>

      {/* 詳細進捗バー */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">進捗状況</span>
          <span className={cn("text-xs font-bold", completed ? "text-emerald-400" : "text-gray-300")}>{cleared}/{total} {mission.category === 'diary' ? '件' : '課題'}</span>
        </div>
        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600" />
          <div className={cn("h-full transition-all duration-500 ease-out relative", completed ? 'bg-emerald-500' : 'bg-blue-500')} style={{ width: `${progressPercentage}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
          {progressPercentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">{Math.round(progressPercentage)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn("flex items-center space-x-1", getRemainingDays() <= 3 ? "text-red-400" : "text-gray-400")}> 
            <FaClock className="w-3 h-3" />
            <span>{getRemainingDays() > 0 ? `あと${getRemainingDays()}日` : '期限切れ'}</span>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          isRewardClaimed ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
            : (completed ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
            : (progressPercentage >= 80 ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30" : "bg-slate-600/20 text-slate-400 border border-slate-500/30"))
        )}>
          {isRewardClaimed ? '報酬受取済み' : completed ? '達成済み' : progressPercentage >= 80 ? 'もう少し' : '進行中'}
        </div>
      </div>

      {/* 報酬受取ボタン */}
      <button
        disabled={isRewardClaimed || !completed}
        onClick={() => claim(mission.id)}
        className={cn(
          "w-full btn btn-sm transition-all duration-300",
          isRewardClaimed ? "btn-success opacity-50 cursor-not-allowed" : (completed ? "btn-success hover:scale-105" : "btn-disabled opacity-50")
        )}
      >
        {isRewardClaimed ? '報酬受取済み' : completed ? '報酬を受取る' : '条件未達成'}
      </button>
    </div>
  );
};

export default ChallengeCard; 