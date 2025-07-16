import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Challenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeSong,
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  subscribeChallenges,
  getChallengeWithSongs,
  addSongToChallenge,
  updateChallengeSong,
  removeSongFromChallenge,
} from '@/platform/supabaseChallenges';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';
import SongSelector from './SongSelector';
import { fetchUserMissionProgress } from '@/platform/supabaseMissions';
import { fetchSongs } from '@/platform/supabaseSongs';
import { FaMusic, FaTrash, FaEdit, FaPlus, FaBook, FaPlay, FaCalendar, FaTrophy } from 'react-icons/fa';

interface FormValues {
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  reward_multiplier: number;
  diary_count?: number;
  song_clear_count?: number;
}

interface SongConditions {
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clears_required: number;
  notation_setting: string;
}

const MissionManager: React.FC = () => {
  const [missions, setMissions] = useState<Challenge[]>([]);
  const [selectedMission, setSelectedMission] = useState<Challenge & { songs: ChallengeSong[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [editingSong, setEditingSong] = useState<ChallengeSong | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, {clear_count:number; completed:boolean}>>({});
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showFormSongSelector, setShowFormSongSelector] = useState(false);
  const [songInfo, setSongInfo] = useState<Record<string, { title: string; artist?: string }>>({});
  const [songConditions, setSongConditions] = useState<Record<string, SongConditions>>({});
  const [editingFormSong, setEditingFormSong] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      type: 'monthly',
      category: 'song_clear',
      start_date: new Date().toISOString().substring(0, 10), // 今日の日付
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 30日後
      reward_multiplier: 1.3,
    },
  });
  const toast = useToast();
  const watchedCategory = watch('category');

  const load = async () => {
    setLoading(true);
    try {
      // アクティブなミッションのみを取得（ユーザー側と同じ条件）
      const data = await listChallenges({ activeOnly: true });
      setMissions(data);
      try {
        const progress = await fetchUserMissionProgress();
        const map: Record<string, {clear_count:number; completed:boolean}> = {};
        progress.forEach(p=>{ map[p.challenge_id] = {clear_count:p.clear_count, completed:p.completed}; });
        setProgressMap(map);
      } catch (e) {
        console.error('progress fetch failed', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeChallenges(() => load());
    return unsub;
  }, []);

  const onSubmit = async (v: FormValues) => {
    try {
      // 日付の妥当性チェック
      const startDate = new Date(v.start_date);
      const endDate = new Date(v.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);



      if (endDate <= startDate) {
        toast.error('終了日は開始日より後の日付を設定してください');
        return;
      }

      if (startDate < today) {
        toast.error('開始日は今日以降の日付を設定してください');
        return;
      }

      // カテゴリに応じて適切なフィールドを設定
      const payload = {
        type: v.type,
        category: v.category,
        title: v.title,
        description: v.description,
        start_date: v.start_date,
        end_date: v.end_date,
        reward_multiplier: v.reward_multiplier,
        diary_count: v.category === 'diary' ? v.diary_count : null,
        song_clear_count: v.category === 'song_clear' ? v.song_clear_count : null,
      };
      
      const newChallengeId = await createChallenge(payload);
      
      // 曲クリアタイプで楽曲が選択されている場合、楽曲を追加
      if (v.category === 'song_clear' && selectedSongs.length > 0) {
        for (const songId of selectedSongs) {
          const conditions = songConditions[songId] || {
            key_offset: 0,
            min_speed: 1.0,
            min_rank: 'B',
            min_clears_required: 1,
            notation_setting: 'both',
          };
          await addSongToChallenge(newChallengeId, songId, conditions);
        }
        
        toast.success(`ミッションを追加し、${selectedSongs.length}曲を追加しました`, {
          title: '追加完了',
          duration: 3000,
        });
      } else {
        toast.success('ミッションを追加しました', {
          title: '追加完了',
          duration: 3000,
        });
      }
      
      reset();
      setSelectedSongs([]);
      setSongConditions({});
      
      // キャッシュをクリアして最新データを取得
      await load();
    } catch (e) {
      toast.error(handleApiError(e, 'ミッション追加'), {
        title: '追加エラー',
      });
    }
  };

  const handleMissionSelect = async (missionId: string) => {
    try {
      const mission = await getChallengeWithSongs(missionId);
      setSelectedMission(mission);
    } catch (error) {
      toast.error('ミッション詳細の取得に失敗しました');
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!selectedMission) return;

    const defaultConditions: SongConditions = {
      key_offset: 0,
      min_speed: 1.0,
      min_rank: 'B',
      min_clears_required: 1,
      notation_setting: 'both',
    };

    try {
      await addSongToChallenge(selectedMission.id, songId, defaultConditions);
      toast.success('楽曲を追加しました');
      // ミッション詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
      setShowSongSelector(false);
    } catch (error) {
      toast.error('楽曲の追加に失敗しました');
    }
  };

  const handleFormSongSelect = (songId: string) => {
    if (!selectedSongs.includes(songId)) {
      setSelectedSongs([...selectedSongs, songId]);
      // 楽曲情報を取得して保存
      fetchSongInfo(songId);
      // デフォルト条件を設定
      setSongConditions(prev => ({
        ...prev,
        [songId]: {
          key_offset: 0,
          min_speed: 1.0,
          min_rank: 'B',
          min_clears_required: 1,
          notation_setting: 'both',
        }
      }));
    }
  };

  const fetchSongInfo = async (songId: string) => {
    try {
      const songs = await fetchSongs();
      const song = songs.find((s: any) => s.id === songId);
      if (song) {
        setSongInfo(prev => ({
          ...prev,
          [songId]: { title: song.title, artist: song.artist }
        }));
      }
    } catch (error) {
      console.error('楽曲情報取得エラー:', error);
    }
  };

  const handleFormSongRemove = (songId: string) => {
    setSelectedSongs(selectedSongs.filter(id => id !== songId));
    setSongInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[songId];
      return newInfo;
    });
    setSongConditions(prev => {
      const newConditions = { ...prev };
      delete newConditions[songId];
      return newConditions;
    });
  };

  const handleSongEdit = (song: ChallengeSong) => {
    setEditingSong(song);
  };

  const handleSongUpdate = async (songId: string, conditions: SongConditions) => {
    if (!selectedMission) return;

    try {
      await updateChallengeSong(selectedMission.id, songId, conditions);
      toast.success('楽曲条件を更新しました');
      // ミッション詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
      setEditingSong(null);
    } catch (error) {
      toast.error('楽曲条件の更新に失敗しました');
    }
  };

  const handleSongRemove = async (songId: string) => {
    if (!selectedMission) return;

    if (!confirm('この楽曲を削除しますか？')) return;

    try {
      await removeSongFromChallenge(selectedMission.id, songId);
      toast.success('楽曲を削除しました');
      // ミッション詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
    } catch (error) {
      toast.error('楽曲の削除に失敗しました');
    }
  };

  const getCategoryIcon = (category: ChallengeCategory) => {
    return category === 'diary' ? <FaBook className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: ChallengeCategory) => {
    return category === 'diary' ? '日記投稿' : '曲クリア';
  };

  const getTypeLabel = (type: ChallengeType) => {
    return type === 'weekly' ? 'ウィークリー' : 'マンスリー';
  };

  return (
    <div className="space-y-8">
      {/* ミッション追加セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <FaPlus className="w-5 h-5 mr-2" />
          ミッション追加
        </h3>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">ミッションタイプ</span>
              <select className="select select-bordered w-full text-white" {...register('type')}>
                <option value="monthly">マンスリー（推奨）</option>
                <option value="weekly">ウィークリー</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">マンスリー: 月間ミッション、ウィークリー: 週間ミッション</p>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium mb-1 block">ミッションカテゴリ</span>
              <select className="select select-bordered w-full text-white" {...register('category')}>
                <option value="song_clear">曲クリア</option>
                <option value="diary">日記投稿</option>
              </select>
            </label>
          </div>

          <input 
            className="input input-bordered w-full text-white" 
            placeholder="ミッションタイトル" 
            {...register('title', { required: true })} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">開始日</span>
              <input className="input input-bordered w-full text-white" type="date" {...register('start_date', { required: true })} />
              <p className="text-xs text-gray-400 mt-1">ミッションが開始される日</p>
            </label>
            <label className="block">
              <span className="text-sm font-medium mb-1 block">終了日</span>
              <input className="input input-bordered w-full text-white" type="date" {...register('end_date', { required: true })} />
              <p className="text-xs text-gray-400 mt-1">ミッションが終了する日（開始日以降）</p>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="input input-bordered text-white" 
              type="number" 
              step="0.1" 
              placeholder="報酬倍率(例 1.3)" 
              {...register('reward_multiplier', { valueAsNumber: true, required: true })} 
            />
            
            {watchedCategory === 'diary' ? (
              <input 
                className="input input-bordered text-white" 
                type="number" 
                placeholder="必要日記投稿数" 
                {...register('diary_count', { valueAsNumber: true, required: true })} 
              />
            ) : (
              <input 
                className="input input-bordered text-white" 
                type="number" 
                placeholder="必要曲クリア数" 
                {...register('song_clear_count', { valueAsNumber: true, required: true })} 
              />
            )}
          </div>

          <textarea 
            className="textarea textarea-bordered w-full text-white" 
            rows={3} 
            placeholder="ミッションの説明" 
            {...register('description')} 
          />

          {/* 曲クリアタイプの場合、楽曲選択セクション */}
          {watchedCategory === 'song_clear' && (
            <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg">楽曲選択</h4>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowFormSongSelector(true)}
                >
                  <FaMusic className="w-4 h-4 mr-2" />
                  楽曲を追加
                </button>
              </div>
              
              {selectedSongs.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <FaMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>楽曲が選択されていません</p>
                  <p className="text-sm">「楽曲を追加」ボタンから楽曲を選択してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSongs.map(songId => {
                    const info = songInfo[songId];
                    const conditions = songConditions[songId];
                    return (
                      <div key={songId} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {info ? info.title : `楽曲ID: ${songId}`}
                          </div>
                          {info?.artist && (
                            <div className="text-sm text-gray-400 truncate">{info.artist}</div>
                          )}
                          {conditions && (
                            <div className="text-xs text-gray-500 mt-1">
                              キー: {conditions.key_offset > 0 ? '+' : ''}{conditions.key_offset} | 
                              速度: {conditions.min_speed}x | 
                              ランク: {conditions.min_rank} | 
                              クリア回数: {conditions.min_clears_required}回 | 
                              楽譜: {conditions.notation_setting === 'both' ? 'ノート+コード' : 'コードのみ'}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => setEditingFormSong(songId)}
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-error"
                            onClick={() => handleFormSongRemove(songId)}
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <button className="btn btn-primary w-full md:w-auto" type="submit">
            <FaPlus className="w-4 h-4 mr-2" />
            ミッションを追加
          </button>
        </form>
      </div>

      {/* ミッション一覧セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <FaTrophy className="w-5 h-5 mr-2" />
          ミッション一覧
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ミッション選択 */}
            <div>
              <h4 className="font-medium mb-4 text-lg">ミッション選択</h4>
              <div className="space-y-3">
                {missions.map(c => (
                  <MissionItem
                    key={c.id}
                    mission={c}
                    progress={progressMap[c.id]}
                    onRefresh={load}
                    onSelect={() => handleMissionSelect(c.id)}
                    isSelected={selectedMission?.id === c.id}
                  />
                ))}
              </div>
            </div>

            {/* 楽曲管理 */}
            {selectedMission && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">楽曲管理</h4>
                    <p className="text-sm text-gray-400">
                      {selectedMission.title} ({getCategoryLabel(selectedMission.category)})
                    </p>
                  </div>
                  {selectedMission.category === 'song_clear' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowSongSelector(true)}
                    >
                      <FaMusic className="w-4 h-4 mr-2" />
                      楽曲追加
                    </button>
                  )}
                </div>

                {selectedMission.category === 'diary' ? (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaBook className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="font-medium">日記投稿ミッション</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      必要投稿数: {selectedMission.diary_count || 0}回
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      楽曲の追加は不要です。日記投稿数で判定されます。
                    </p>
                  </div>
                ) : selectedMission.songs.length === 0 ? (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                    <FaMusic className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                    <p className="text-gray-300 mb-2">楽曲が追加されていません</p>
                    <p className="text-sm text-gray-400">「楽曲追加」ボタンから楽曲を追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMission.songs.map(song => (
                      <SongItem
                        key={song.song_id}
                        song={song}
                        onEdit={handleSongEdit}
                        onRemove={handleSongRemove}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 楽曲選択モーダル */}
      {showSongSelector && selectedMission && (
        <SongSelectorModal
          onSelect={handleSongSelect}
          onClose={() => setShowSongSelector(false)}
          excludeSongIds={selectedMission.songs.map(s => s.song_id)}
        />
      )}

      {/* フォーム用楽曲選択モーダル */}
      {showFormSongSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">楽曲を選択</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowFormSongSelector(false)}>✕</button>
            </div>
            <SongSelector
              onSelect={handleFormSongSelect}
              excludeSongIds={selectedSongs}
            />
          </div>
        </div>
      )}

      {/* 楽曲条件編集モーダル */}
      {editingSong && (
        <SongConditionsModal
          song={editingSong}
          onSave={handleSongUpdate}
          onCancel={() => setEditingSong(null)}
        />
      )}

      {/* フォーム用楽曲条件編集モーダル */}
      {editingFormSong && (
        <FormSongConditionsModal
          songId={editingFormSong}
          songInfo={songInfo[editingFormSong]}
          conditions={songConditions[editingFormSong]}
          onSave={(songId, conditions) => {
            setSongConditions(prev => ({
              ...prev,
              [songId]: conditions
            }));
            setEditingFormSong(null);
          }}
          onCancel={() => setEditingFormSong(null)}
        />
      )}
    </div>
  );
};

const MissionItem: React.FC<{
  mission: Challenge;
  progress?: { clear_count: number; completed: boolean };
  onRefresh: () => void;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ mission, progress, onRefresh, onSelect, isSelected }) => {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm<Partial<Challenge>>({ defaultValues: mission });
  const toast = useToast();

  const getCategoryIcon = (category: ChallengeCategory) => {
    return category === 'diary' ? <FaBook className="w-3 h-3" /> : <FaPlay className="w-3 h-3" />;
  };

  const getCategoryLabel = (category: ChallengeCategory) => {
    return category === 'diary' ? '日記投稿' : '曲クリア';
  };

  const getTypeLabel = (type: ChallengeType) => {
    return type === 'weekly' ? 'ウィークリー' : 'マンスリー';
  };

  const onUpdate = async (v: Partial<Challenge>) => {
    try {
      await updateChallenge(mission.id, v);
      toast.success('更新しました', {
        title: '更新完了',
        duration: 2000,
      });
      setEditing(false);
      onRefresh();
    } catch(e) {
      toast.error(handleApiError(e, 'ミッション更新'), {
        title: '更新エラー',
      });
    }
  };

  return (
    <li className={`border border-slate-700 rounded-lg p-4 bg-slate-800/50 cursor-pointer transition-colors ${
      isSelected ? 'border-primary-500 bg-slate-700/50' : 'hover:bg-slate-700/30'
    }`}>
      {editing ? (
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit(onUpdate)}>
          <input className="input input-bordered sm:col-span-2 text-white" placeholder="タイトル" {...register('title')} />
          <textarea className="textarea textarea-bordered sm:col-span-2 text-white" rows={2} placeholder="説明" {...register('description')} />
          <input className="input input-bordered text-white" type="number" step="0.1" placeholder="報酬倍率" {...register('reward_multiplier', { valueAsNumber: true })} />
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn btn-xs btn-primary" type="submit">保存</button>
            <button className="btn btn-xs btn-secondary" type="button" onClick={() => setEditing(false)}>キャンセル</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3" onClick={onSelect}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getCategoryIcon(mission.category)}
                <h4 className="font-medium truncate">{mission.title}</h4>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(mission.start_date).toLocaleDateString()} ~ {new Date(mission.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>編集</button>
              <button className="btn btn-xs btn-error" onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('削除しますか？')) return;
                try {
                  await deleteChallenge(mission.id);
                  toast.success('削除しました');
                  onRefresh();
                } catch (e) {
                  toast.error('削除に失敗しました');
                }
              }}>削除</button>
            </div>
          </div>
          
          {mission.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{mission.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge badge-sm badge-primary">{getTypeLabel(mission.type)}</span>
            <span className="badge badge-sm badge-secondary">{getCategoryLabel(mission.category)}</span>
            <span className="text-gray-400">報酬: x{mission.reward_multiplier}</span>
            {mission.category === 'diary' && mission.diary_count && (
              <span className="text-blue-400">必要投稿: {mission.diary_count}回</span>
            )}
          {mission.category === 'song_clear' && mission.song_clear_count && (
            <span className="text-green-400">必要クリア: {mission.song_clear_count}曲</span>
          )}
        </div>

        {progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs">
              <span>進捗</span>
              <span>{progress.clear_count}/{mission.diary_count ?? mission.song_clear_count ?? 1}</span>
            </div>
            <div className="w-full bg-slate-700 rounded h-2 overflow-hidden">
              <div className="h-full bg-primary-500" style={{width:`${Math.min(100, (progress.clear_count / (mission.diary_count ?? mission.song_clear_count ?? 1))*100)}%`}} />
            </div>
          </div>
        )}
      </div>
    )}
  </li>
  );
};

const SongItem: React.FC<{
  song: ChallengeSong;
  onEdit: (song: ChallengeSong) => void;
  onRemove: (songId: string) => void;
}> = ({ song, onEdit, onRemove }) => {
  return (
    <div className="border border-slate-600 rounded-lg p-3 bg-slate-800/30">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">{song.song?.title || '不明'}</div>
          <div className="text-sm text-gray-400">{song.song?.artist || '不明'}</div>
          <div className="text-xs text-gray-500 mt-1">
            キー: {song.key_offset > 0 ? '+' : ''}{song.key_offset} | 
            速度: {song.min_speed}x | 
            ランク: {song.min_rank} | 
            クリア回数: {song.clears_required}回
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            className="btn btn-xs btn-primary"
            onClick={() => onEdit(song)}
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            className="btn btn-xs btn-error"
            onClick={() => onRemove(song.song_id)}
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SongSelectorModal: React.FC<{
  onSelect: (songId: string) => void;
  onClose: () => void;
  excludeSongIds: string[];
}> = ({ onSelect, onClose, excludeSongIds }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">楽曲を追加</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <SongSelector
          onSelect={onSelect}
          excludeSongIds={excludeSongIds}
        />
      </div>
    </div>
  );
};

const SongConditionsModal: React.FC<{
  song: ChallengeSong;
  onSave: (songId: string, conditions: any) => void;
  onCancel: () => void;
}> = ({ song, onSave, onCancel }) => {
  const [conditions, setConditions] = useState({
    key_offset: song.key_offset,
    min_speed: song.min_speed,
    min_rank: song.min_rank,
    min_clears_required: song.clears_required,
    notation_setting: song.notation_setting,
  });

  const handleSave = () => {
    onSave(song.song_id, conditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          楽曲条件編集: {song.song?.title}
        </h3>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">キーオフセット</span>
            <input
              type="number"
              value={conditions.key_offset}
              onChange={(e) => setConditions({...conditions, key_offset: parseInt(e.target.value) || 0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小速度</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={conditions.min_speed}
              onChange={(e) => setConditions({...conditions, min_speed: parseFloat(e.target.value) || 1.0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小ランク</span>
            <select
              value={conditions.min_rank}
              onChange={(e) => setConditions({...conditions, min_rank: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="C">C</option>
              <option value="B">B</option>
              <option value="A">A</option>
              <option value="S">S</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">クリア回数</span>
            <input
              type="number"
              min="1"
              value={conditions.min_clears_required}
              onChange={(e) => setConditions({...conditions, min_clears_required: parseInt(e.target.value) || 1})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">楽譜表示</span>
            <select
              value={conditions.notation_setting}
              onChange={(e) => setConditions({...conditions, notation_setting: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="both">ノート+コード</option>
              <option value="chords">コードのみ</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-outline flex-1" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

const FormSongConditionsModal: React.FC<{
  songId: string;
  songInfo?: { title: string; artist?: string };
  conditions?: SongConditions;
  onSave: (songId: string, conditions: SongConditions) => void;
  onCancel: () => void;
}> = ({ songId, songInfo, conditions, onSave, onCancel }) => {
  const [formConditions, setFormConditions] = useState<SongConditions>(
    conditions || {
      key_offset: 0,
      min_speed: 1.0,
      min_rank: 'B',
      min_clears_required: 1,
      notation_setting: 'both',
    }
  );

  const handleSave = () => {
    onSave(songId, formConditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          楽曲条件編集: {songInfo?.title || `楽曲ID: ${songId}`}
        </h3>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">キーオフセット</span>
            <input
              type="number"
              value={formConditions.key_offset}
              onChange={(e) => setFormConditions({...formConditions, key_offset: parseInt(e.target.value) || 0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小速度</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formConditions.min_speed}
              onChange={(e) => setFormConditions({...formConditions, min_speed: parseFloat(e.target.value) || 1.0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小ランク</span>
            <select
              value={formConditions.min_rank}
              onChange={(e) => setFormConditions({...formConditions, min_rank: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="C">C</option>
              <option value="B">B</option>
              <option value="A">A</option>
              <option value="S">S</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">クリア回数</span>
            <input
              type="number"
              min="1"
              value={formConditions.min_clears_required}
              onChange={(e) => setFormConditions({...formConditions, min_clears_required: parseInt(e.target.value) || 1})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">楽譜表示</span>
            <select
              value={formConditions.notation_setting}
              onChange={(e) => setFormConditions({...formConditions, notation_setting: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="both">ノート+コード</option>
              <option value="chords">コードのみ</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-outline flex-1" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionManager; 
