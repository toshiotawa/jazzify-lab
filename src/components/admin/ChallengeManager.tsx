import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Challenge,
  ChallengeType,
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  subscribeChallenges,
} from '@/platform/supabaseChallenges';
import { useToast } from '@/stores/toastStore';

interface FormValues {
  type: ChallengeType;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  reward_multiplier: number;
  diary_count?: number;
}

const ChallengeManager: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast('チャレンジを追加しました','success');
      reset();
      await load();
    } catch (e) {
      toast('追加に失敗しました','error');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">チャレンジ追加</h3>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8" onSubmit={handleSubmit(onSubmit)}>
        <select className="select select-bordered" {...register('type')}> 
          <option value="weekly">ウィークリー</option>
          <option value="monthly">マンスリー</option>
        </select>
        <input className="input input-bordered" placeholder="タイトル" {...register('title', { required: true })} />
        <input className="input input-bordered" type="date" {...register('start_date', { required: true })} />
        <input className="input input-bordered" type="date" {...register('end_date', { required: true })} />
        <input className="input input-bordered" type="number" step="0.1" placeholder="報酬倍率(例 1.3)" {...register('reward_multiplier', { valueAsNumber: true, required: true })} />
        <input className="input input-bordered" type="number" placeholder="日記投稿回数" {...register('diary_count')} />
        <textarea className="textarea textarea-bordered md:col-span-2" placeholder="説明" {...register('description')} />
        <button className="btn btn-primary md:col-span-2" type="submit">追加</button>
      </form>

      <h3 className="text-xl font-bold mb-2">チャレンジ一覧</h3>
      {loading ? <p>Loading...</p> : (
        <ul className="space-y-1">
          {challenges.map(c => (
            <ChallengeItem key={c.id} challenge={c} onRefresh={load} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChallengeManager;

const ChallengeItem: React.FC<{ challenge: Challenge; onRefresh: () => void }> = ({ challenge, onRefresh }) => {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm<Partial<Challenge>>({ defaultValues: challenge });
  const toast = useToast();

  const onUpdate = async (v: Partial<Challenge>) => {
    try {
      await updateChallenge(challenge.id, v);
      toast('更新しました','success');
      setEditing(false);
      onRefresh();
    } catch(e) {
      toast('更新に失敗しました','error');
    }
  };

  return (
    <li className="border-b border-slate-700 py-1">
      {editing ? (
        <form className="grid grid-cols-1 md:grid-cols-2 gap-2" onSubmit={handleSubmit(onUpdate)}>
          <input className="input input-bordered" {...register('title')} />
          <textarea className="textarea textarea-bordered md:col-span-2" {...register('description')} />
          <input className="input input-bordered" type="number" step="0.1" {...register('reward_multiplier', { valueAsNumber: true })} />
          <button className="btn btn-xs btn-primary" type="submit">保存</button>
          <button className="btn btn-xs btn-secondary" type="button" onClick={() => setEditing(false)}>キャンセル</button>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          <span className="truncate text-sm">[{challenge.type}] {challenge.title}</span>
          <div className="space-x-1">
            <button className="btn btn-xs btn-outline" onClick={() => setEditing(true)}>編集</button>
            <button className="btn btn-xs btn-error" onClick={async () => { try{await deleteChallenge(challenge.id); toast('削除しました','success'); onRefresh();}catch(e){toast('削除に失敗しました','error');} }}>削除</button>
          </div>
        </div>
      )}
    </li>
  );
}; 