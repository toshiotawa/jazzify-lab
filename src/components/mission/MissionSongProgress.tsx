import React, { useEffect } from 'react';
import type { MissionSongProgress as MissionSongProgressType } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { FaPlay, FaMusic, FaCheck } from 'react-icons/fa';

interface Props {
  missionId: string;
  songProgress: MissionSongProgressType[];
}

const MissionSongProgress: React.FC<Props> = ({ missionId, songProgress }) => {
  const { fetchSongProgress } = useMissionStore();
  const { loadSong } = useGameStore();

  useEffect(() => {
    console.log('MissionSongProgress useEffect:', { missionId, songProgressLength: songProgress.length });
    if (songProgress.length === 0) {
      console.log('曲進捗を取得中:', missionId);
      fetchSongProgress(missionId);
    }
  }, [missionId, songProgress.length, fetchSongProgress]);

  const handlePlaySong = async (songId: string) => {
    try {
      console.log('ミッション曲をプレイ:', { songId, missionId });
      // 曲をロードしてゲーム画面に移動
      window.location.href = `/main#play-mission?song=${songId}&mission=${missionId}`;
    } catch (error) {
      console.error('曲の読み込みに失敗:', error);
    }
  };

  const allSongsCompleted = songProgress.length > 0 && songProgress.every(song => song.is_completed);
  
  console.log('MissionSongProgress render:', { 
    missionId, 
    songProgressLength: songProgress.length, 
    allSongsCompleted,
    songProgress: songProgress.map(s => ({ id: s.song_id, title: s.song?.title, completed: s.is_completed }))
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">曲の進捗</h4>
        {allSongsCompleted && (
          <div className="flex items-center space-x-2 text-emerald-400">
            <FaCheck className="w-4 h-4" />
            <span className="text-sm font-medium">全ての曲をクリアしました！</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {songProgress.map((song) => (
          <div
            key={song.song_id}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-300",
              song.is_completed
                ? "bg-emerald-900/30 border-emerald-500/50"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <FaMusic className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-medium text-white">
                    {song.song?.title || `曲 ${song.song_id}`}
                  </div>
                  {song.song?.artist && (
                    <div className="text-sm text-gray-400">{song.song.artist}</div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handlePlaySong(song.song_id)}
                className={cn(
                  "btn btn-sm flex items-center space-x-2 transition-all duration-300",
                  song.is_completed
                    ? "btn-success hover:scale-105"
                    : "btn-primary"
                )}
              >
                <FaPlay className="w-3 h-3" />
                <span>{song.is_completed ? '再プレイ' : 'プレイ'}</span>
              </button>
            </div>

            {/* 進捗バー */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">クリア回数</span>
                <span className={cn(
                  "text-xs font-bold",
                  song.is_completed ? "text-emerald-400" : "text-gray-300"
                )}>
                  {song.clear_count}/{song.required_count} 回
                </span>
              </div>
              
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                {/* 背景グラデーション */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600" />
                
                {/* 進捗バー */}
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-out relative",
                    song.is_completed ? "bg-emerald-500" : "bg-blue-500"
                  )}
                  style={{ 
                    width: `${Math.min(100, (song.clear_count / song.required_count) * 100)}%` 
                  }}
                >
                  {/* 進捗バーのグラデーション効果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                </div>
                
                {/* 進捗パーセンテージ表示 */}
                {song.clear_count > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">
                      {Math.round((song.clear_count / song.required_count) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* 完了マーク */}
              {song.is_completed && (
                <div className="flex items-center justify-center mt-2">
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <FaCheck className="w-3 h-3" />
                    <span className="text-xs font-medium">クリア済み</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {songProgress.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎵</div>
          <p className="text-gray-400">このミッションには曲が登録されていません</p>
        </div>
      )}
    </div>
  );
};

export default MissionSongProgress; 