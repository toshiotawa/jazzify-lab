import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addSong, fetchSongs, deleteSong, Song } from '@/platform/supabaseSongs';
import { useToast } from '@/stores/toastStore';

const SongManager: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<Omit<Song, 'id' | 'is_public'>>();
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSongs();
      setSongs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (values: any) => {
    try {
      await addSong({ ...values, data: JSON.parse(values.data) });
      reset();
      await load();
    } catch (e) {
      toast.error('曲の追加に失敗しました');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">曲登録</h3>
      <form className="space-y-2 mb-8" onSubmit={handleSubmit(onSubmit)}>
        <input className="input input-bordered w-full" placeholder="タイトル" {...register('title', { required: true })} />
        <input className="input input-bordered w-full" placeholder="アーティスト" {...register('artist')} />
        <input className="input input-bordered w-full" placeholder="BPM" type="number" {...register('bpm')} />
        <input className="input input-bordered w-full" placeholder="難易度(1-10)" type="number" {...register('difficulty')} />
        <textarea className="textarea textarea-bordered w-full" placeholder="JSON ノーツデータ" {...register('data', { required: true })} />
        <select className="select select-bordered w-full" {...register('min_rank')} defaultValue="free">
          <option value="free">フリー</option>
          <option value="standard">スタンダード</option>
          <option value="premium">プレミアム</option>
          <option value="platinum">プラチナ</option>
        </select>
        <button type="submit" className="btn btn-primary w-full">追加</button>
      </form>

      <h3 className="text-xl font-bold mb-4">曲一覧</h3>
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <ul className="divide-y divide-slate-700">
            {songs.map(s => (
              <li key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {s.artist && `${s.artist} • `}
                    {s.min_rank} • {s.difficulty && `難易度 ${s.difficulty}`}
                  </p>
                </div>
                <button className="btn btn-xs btn-error ml-2 flex-shrink-0" onClick={async () => {
                  if (!confirm(`「${s.title}」を削除しますか？`)) return;
                  try {
                    await deleteSong(s.id);
                    toast.success('削除しました');
                    await load();
                  } catch(e) {
                    toast.error('削除に失敗しました');
                  }
                }}>削除</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SongManager; 