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
        <div key={d.id} className="p-3 sm:p-4 bg-slate-800 rounded-lg">
          <div className="flex items-center mb-2 space-x-2 text-sm text-gray-300">
            <Avatar url={d.avatar_url} />
            <div className="flex-1 min-w-0">
              <button
                onClick={() => {
                  window.location.hash = `#diary-user?id=${d.user_id}`;
                }}
                className="font-semibold truncate block sm:inline hover:text-blue-400 transition-colors cursor-pointer"
              >
                {d.nickname || 'User'}
              </button>
              <span className="text-gray-500 text-xs ml-0 sm:ml-2 block sm:inline">{d.practice_date}</span>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-gray-100 mb-3 text-sm leading-relaxed">{d.content}</p>
          <div className="flex items-center justify-between">
            <button 
              className="flex items-center text-xs text-gray-400 hover:text-pink-400 transition-colors p-1 rounded"
              onClick={()=>like(d.id)}
            >
              <FaHeart className="mr-1" /> {d.likes}
            </button>
            <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              返信
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiaryFeed; 