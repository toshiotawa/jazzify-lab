import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addSong, fetchSongs, deleteSong, Song } from '@/platform/supabaseSongs';

const SongManager: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<Omit<Song, 'id' | 'is_public'>>();

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
      alert('追加に失敗しました');
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

      <h3 className="text-xl font-bold mb-2">曲一覧</h3>
      {loading ? <p>Loading...</p> : (
        <ul className="space-y-1">
          {songs.map(s => (
            <li key={s.id} className="flex justify-between items-center border-b border-slate-700 py-1">
              <span>{s.title}</span>
              <button className="btn btn-xs btn-error" onClick={async () => { await deleteSong(s.id); await load(); }}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SongManager; 