import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Challenge,
  ChallengeType,
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
import { FaMusic, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

interface FormValues {
  type: ChallengeType;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  reward_multiplier: number;
  diary_count?: number;
}

interface SongConditions {
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clear_count: number;
  notation_setting: string;
}

const ChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge & { songs: ChallengeSong[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [editingSong, setEditingSong] = useState<ChallengeSong | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      type: 'weekly',
      start_date: new Date().toISOString().substring(0, 10),
      end_date: new Date().toISOString().substring(0, 10),
      reward_multiplier: 1.3,
    },
  });
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listChallenges();
      setChallenges(data);
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
      await createChallenge({ ...v });
      toast.success('チャレンジを追加しました', {
        title: '追加完了',
        duration: 3000,
      });
      reset();
      await load();
    } catch (e) {
      toast.error(handleApiError(e, 'チャレンジ追加'), {
        title: '追加エラー',
      });
    }
  };

  const handleChallengeSelect = async (challengeId: string) => {
    try {
      const challenge = await getChallengeWithSongs(challengeId);
      setSelectedChallenge(challenge);
    } catch (error) {
      toast.error('チャレンジ詳細の取得に失敗しました');
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!selectedChallenge) return;

    const defaultConditions: SongConditions = {
      key_offset: 0,
      min_speed: 1.0,
      min_rank: 'B',
      min_clear_count: 1,
      notation_setting: 'both',
    };

    try {
      await addSongToChallenge(selectedChallenge.id, songId, defaultConditions);
      toast.success('楽曲を追加しました');
      // チャレンジ詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedChallenge.id);
      setSelectedChallenge(updatedChallenge);
      setShowSongSelector(false);
    } catch (error) {
      toast.error('楽曲の追加に失敗しました');
    }
  };

  const handleSongEdit = (song: ChallengeSong) => {
    setEditingSong(song);
  };

  const handleSongUpdate = async (songId: string, conditions: SongConditions) => {
    if (!selectedChallenge) return;

    try {
      await updateChallengeSong(selectedChallenge.id, songId, conditions);
      toast.success('楽曲条件を更新しました');
      // チャレンジ詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedChallenge.id);
      setSelectedChallenge(updatedChallenge);
      setEditingSong(null);
    } catch (error) {
      toast.error('楽曲条件の更新に失敗しました');
    }
  };

  const handleSongRemove = async (songId: string) => {
    if (!selectedChallenge) return;

    if (!confirm('この楽曲を削除しますか？')) return;

    try {
      await removeSongFromChallenge(selectedChallenge.id, songId);
      toast.success('楽曲を削除しました');
      // チャレンジ詳細を再読み込み
      const updatedChallenge = await getChallengeWithSongs(selectedChallenge.id);
      setSelectedChallenge(updatedChallenge);
    } catch (error) {
      toast.error('楽曲の削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">チャレンジ追加</h3>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">チャレンジタイプ</span>
            <select className="select select-bordered text-white" {...register('type')}>
              <option value="weekly">ウィークリー</option>
              <option value="monthly">マンスリー</option>
            </select>
          </label>
          <input className="input input-bordered text-white" placeholder="タイトル" {...register('title', { required: true })} />
          <label className="block">
            <span className="text-sm font-medium mb-1 block">開始日</span>
            <input className="input input-bordered text-white" type="date" {...register('start_date', { required: true })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">終了日</span>
            <input className="input input-bordered text-white" type="date" {...register('end_date', { required: true })} />
          </label>
          <input className="input input-bordered text-white" type="number" step="0.1" placeholder="報酬倍率(例 1.3)" {...register('reward_multiplier', { valueAsNumber: true, required: true })} />
          <input className="input input-bordered text-white" type="number" placeholder="日記投稿回数" {...register('diary_count')} />
          <textarea className="textarea textarea-bordered sm:col-span-2 text-white" rows={2} placeholder="説明" {...register('description')} />
          <button className="btn btn-primary sm:col-span-2" type="submit">追加</button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">チャレンジ一覧</h3>
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">チャレンジ選択</h4>
              <ul className="space-y-2">
                {challenges.map(c => (
                  <ChallengeItem 
                    key={c.id} 
                    challenge={c} 
                    onRefresh={load}
                    onSelect={() => handleChallengeSelect(c.id)}
                    isSelected={selectedChallenge?.id === c.id}
                  />
                ))}
              </ul>
            </div>

            {selectedChallenge && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">楽曲管理: {selectedChallenge.title}</h4>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowSongSelector(true)}
                  >
                    <FaPlus className="w-3 h-3 mr-1" />
                    楽曲追加
                  </button>
                </div>

                {selectedChallenge.songs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">楽曲が追加されていません</p>
                ) : (
                  <div className="space-y-2">
                    {selectedChallenge.songs.map(song => (
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
      {showSongSelector && selectedChallenge && (
        <SongSelectorModal
          onSelect={handleSongSelect}
          onClose={() => setShowSongSelector(false)}
          excludeSongIds={selectedChallenge.songs.map(s => s.song_id)}
        />
      )}

      {/* 楽曲条件編集モーダル */}
      {editingSong && (
        <SongConditionsModal
          song={editingSong}
          onSave={handleSongUpdate}
          onCancel={() => setEditingSong(null)}
        />
      )}
    </div>
  );
};

const ChallengeItem: React.FC<{ 
  challenge: Challenge; 
  onRefresh: () => void;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ challenge, onRefresh, onSelect, isSelected }) => {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm<Partial<Challenge>>({ defaultValues: challenge });
  const toast = useToast();

  const onUpdate = async (v: Partial<Challenge>) => {
    try {
      await updateChallenge(challenge.id, v);
      toast.success('更新しました', {
        title: '更新完了',
        duration: 2000,
      });
      setEditing(false);
      onRefresh();
    } catch(e) {
      toast.error(handleApiError(e, 'チャレンジ更新'), {
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
        <div className="space-y-2" onClick={onSelect}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{challenge.title}</h4>
              <p className="text-xs text-gray-400">
                {new Date(challenge.start_date).toLocaleDateString()} ~ {new Date(challenge.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>編集</button>
              <button className="btn btn-xs btn-error" onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('削除しますか？')) return;
                try {
                  await deleteChallenge(challenge.id);
                  toast.success('削除しました');
                  onRefresh();
                } catch (e) {
                  toast.error('削除に失敗しました');
                }
              }}>削除</button>
            </div>
          </div>
          {challenge.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{challenge.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge badge-sm">{challenge.type}</span>
            <span className="text-gray-400">報酬: x{challenge.reward_multiplier}</span>
            {challenge.diary_count && (
              <span className="text-gray-400">日記: {challenge.diary_count}回</span>
            )}
          </div>
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
            クリア回数: {song.min_clear_count}回
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
    min_clear_count: song.min_clear_count,
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
              value={conditions.min_clear_count}
              onChange={(e) => setConditions({...conditions, min_clear_count: parseInt(e.target.value) || 1})}
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

export default ChallengeManager; 