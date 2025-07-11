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
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">チャレンジ追加</h3>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium mb-1 block">チャレンジタイプ</span>
            <select className="select select-bordered text-white" {...register('type')}>
              <option value="diary">日記投稿回数</option>
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
          <ul className="space-y-2">
            {challenges.map(c => (
              <ChallengeItem key={c.id} challenge={c} onRefresh={load} />
            ))}
          </ul>
        )}
      </div>
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
    <li className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
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
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{challenge.title}</h4>
              <p className="text-xs text-gray-400">
                {new Date(challenge.start_date).toLocaleDateString()} ~ {new Date(challenge.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-xs btn-primary" onClick={() => setEditing(true)}>編集</button>
              <button className="btn btn-xs btn-error" onClick={async () => {
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