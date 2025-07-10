import React, { useEffect } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { FaHeart } from 'react-icons/fa';

const Avatar: React.FC<{ url?: string }> = ({ url }) => (
  <img
    src={url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
    alt="avatar"
    className="w-8 h-8 rounded-full object-cover"
  />
);

const DiaryFeed: React.FC = () => {
  const { diaries, loading, fetch: fetchAll, like } = useDiaryStore();
  useEffect(() => { void fetchAll(); }, []);

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  return (
    <div className="space-y-3">
      {diaries.map(d => (
        <div key={d.id} className="p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center mb-2 space-x-2 text-sm text-gray-300">
            <Avatar url={d.avatar_url} />
            <span className="font-semibold">{d.nickname || 'User'}</span>
            <span className="text-gray-500 text-xs">{d.practice_date}</span>
          </div>
          <p className="whitespace-pre-wrap text-gray-100 mb-2 text-sm">{d.content}</p>
          <button className="flex items-center text-xs text-gray-400 hover:text-pink-400" onClick={()=>like(d.id)}>
            <FaHeart className="mr-1" /> {d.likes}
          </button>
        </div>
      ))}
    </div>
  );
};

export default DiaryFeed; 