import React, { useEffect } from 'react';
import type { MissionSongProgress as MissionSongProgressType } from '@/platform/supabaseMissions';
import { useMissionStore } from '@/stores/missionStore';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { FaPlay, FaMusic, FaCheck, FaKey, FaTachometerAlt, FaStar, FaListUl } from 'react-icons/fa';
import { log } from '@/utils/logger';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

interface Props {
  missionId: string;
  songProgress: MissionSongProgressType[];
}

const MissionSongProgress: React.FC<Props> = ({ missionId, songProgress }) => {
  const { fetchSongProgress } = useMissionStore();
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });


  useEffect(() => {
    log.debug('MissionSongProgress useEffect:', { missionId, songProgressLength: songProgress.length });
    if (songProgress.length === 0) {
      log.debug('曲進捗を取得中:', missionId);
      fetchSongProgress(missionId);
    }
  }, [missionId, songProgress.length, fetchSongProgress]);

  const handlePlaySong = async (songId: string, songProgress: MissionSongProgressType) => {
    try {
      log.info('🎵 ミッション曲をプレイ開始:', { 
        songId, 
        missionId, 
        songTitle: songProgress.song?.title,
        songProgress: {
          clear_count: songProgress.clear_count,
          required_count: songProgress.required_count,
          is_completed: songProgress.is_completed
        }
      });
      
      // ミッションから曲をプレイする際はsongとmissionのみを渡す
      // 条件はGameScreenでデータベースから取得する
      const params = new URLSearchParams();
      params.set('song', songId);
      params.set('mission', missionId);
      
      const hash = `#play-mission?${params.toString()}`;
      log.info('🔗 生成されたハッシュ:', hash);
      
      // ハッシュを設定してGameScreenの処理をトリガー
      window.location.hash = hash;
      
      log.info('✅ ミッション曲プレイ処理完了、GameScreenで処理中...');
    } catch (error) {
      log.error('❌ ミッション曲プレイ処理エラー:', {
        error,
        songId,
        missionId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // エラー時はミッション一覧に戻る
      setTimeout(() => {
        window.location.hash = '#missions';
      }, 100);
    }
  };

  const allSongsCompleted = songProgress.length > 0 && songProgress.every(song => song.is_completed);
  
  log.debug('MissionSongProgress render:', { 
    missionId, 
    songProgressLength: songProgress.length, 
    allSongsCompleted,
    songProgress: songProgress.map(s => ({ id: s.song_id, title: s.song?.title, completed: s.is_completed }))
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">{isEnglishCopy ? 'Song Progress' : '曲の進捗'}</h4>
        {allSongsCompleted && (
          <div className="flex items-center space-x-2 text-emerald-400">
            <FaCheck className="w-4 h-4" />
            <span className="text-sm font-medium">{isEnglishCopy ? 'All songs cleared!' : '全ての曲をクリアしました！'}</span>
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
                    {song.song?.title || (isEnglishCopy ? `Song ${song.song_id}` : `曲 ${song.song_id}`)}
                  </div>
                  {song.song?.artist && (
                    <div className="text-sm text-gray-400">{song.song.artist}</div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => {
                  console.log('🎯 ミッション曲プレイボタンクリック:', {
                    songId: song.song_id,
                    songTitle: song.song?.title,
                    missionId,
                    isCompleted: song.is_completed
                  });
                  handlePlaySong(song.song_id, song);
                }}
                className={cn(
                  "btn btn-sm flex items-center space-x-2 transition-all duration-300",
                  song.is_completed
                    ? "btn-success hover:scale-105"
                    : "btn-primary"
                )}
              >
                <FaPlay className="w-3 h-3" />
                <span>{song.is_completed ? (isEnglishCopy ? 'Replay' : '再プレイ') : (isEnglishCopy ? 'Play' : 'プレイ')}</span>
              </button>
            </div>

            {/* クリア条件の詳細表示 */}
            <div className="mb-3 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-xs font-medium text-gray-300 mb-2">{isEnglishCopy ? 'Clear Conditions' : 'クリア条件'}</div>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <FaStar className="w-3 h-3 text-yellow-400" />
                  <span>{isEnglishCopy ? `Rank ${song.min_rank || 'B'} or higher` : `ランク${song.min_rank || 'B'}以上`}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaListUl className="w-3 h-3 text-blue-400" />
                  <span>{isEnglishCopy ? `Clear ${song.required_count || 1}x` : `${song.required_count || 1}回クリア`}</span>
                </div>
                {song.min_speed && song.min_speed !== 1.0 && (
                  <div className="flex items-center space-x-2">
                    <FaTachometerAlt className="w-3 h-3 text-green-400" />
                    <span>{isEnglishCopy ? `Speed ${song.min_speed}x or faster` : `速度${song.min_speed}倍以上`}</span>
                  </div>
                )}
                {song.key_offset && song.key_offset !== 0 && (
                  <div className="flex items-center space-x-2">
                    <FaKey className="w-3 h-3 text-purple-400" />
                    <span>{isEnglishCopy
                      ? `Key ${song.key_offset > 0 ? '+' : ''}${song.key_offset}`
                      : `キー${song.key_offset > 0 ? '+' : ''}${song.key_offset} (${song.key_offset > 0 ? '高く' : '低く'})`}</span>
                  </div>
                )}
                {song.notation_setting && (
                  <div className="flex items-center space-x-2">
                    <FaMusic className="w-3 h-3 text-orange-400" />
                    <span>
                      {isEnglishCopy ? 'Notation' : '楽譜'}: {song.notation_setting === 'notes_chords'
                        ? (isEnglishCopy ? 'Notes + Chords' : 'ノート+コード')
                        : song.notation_setting === 'chords_only'
                          ? (isEnglishCopy ? 'Chords Only' : 'コードのみ')
                          : (isEnglishCopy ? 'Both' : '両方')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 進捗バー */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{isEnglishCopy ? 'Clears' : 'クリア回数'}</span>
                <span className={cn(
                  "text-xs font-bold",
                  song.is_completed ? "text-emerald-400" : "text-gray-300"
                )}>
                  {song.clear_count}/{song.required_count}{isEnglishCopy ? 'x' : ' 回'}
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
                    <span className="text-xs font-medium">{isEnglishCopy ? 'Cleared' : 'クリア済み'}</span>
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
          <p className="text-gray-400">{isEnglishCopy ? 'No songs registered for this mission' : 'このミッションには曲が登録されていません'}</p>
        </div>
      )}
    </div>
  );
};

export default MissionSongProgress; 