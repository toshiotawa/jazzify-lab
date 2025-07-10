import React, { useEffect, useState } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { FaHeart, FaTrash } from 'react-icons/fa';

const Avatar: React.FC<{ url?: string }> = ({ url }) => (
  <img
    src={url || 'https://api.dicebear.com/7.x/identicon/svg?seed=user'}
    alt="avatar"
    className="w-8 h-8 rounded-full object-cover"
  />
);

const DiaryFeed: React.FC = () => {
  const { diaries, loading, fetch: fetchAll, like, comments, fetchComments, addComment, deleteComment } = useDiaryStore();
  const { user, isGuest } = useAuthStore();
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  useEffect(() => { void fetchAll(); }, []);
  useEffect(() => {
    diaries.forEach(d => {
      if (openComments[d.id]) fetchComments(d.id);
    });
  }, [openComments]);

  if (!user || isGuest) return (
    <div className="p-4 text-center text-gray-400">
      コミュニティ機能はログインユーザー専用です。<br />
      <button className="btn btn-sm btn-primary mt-4" onClick={()=>{window.location.hash='#login';}}>
        ログイン / 会員登録
      </button>
    </div>
  );

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
              onClick={()=> user && like(d.id)}
            >
              <FaHeart className="mr-1" /> {d.likes}
            </button>
            <button 
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              onClick={() => setOpenComments(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
            >
              返信 {comments[d.id]?.length || 0}
            </button>
          </div>
          {openComments[d.id] && (
            <div className="mt-2 space-y-2">
              {comments[d.id]?.map(c => (
                <div key={c.id} className="text-xs text-gray-300 flex items-center space-x-2">
                  <Avatar url={c.avatar_url} />
                  <span className="font-semibold">{c.nickname}:</span>
                  <p>{c.content}</p>
                  {c.user_id === user?.id && (
                    <button onClick={() => deleteComment(c.id, d.id)} className="text-red-400"><FaTrash /></button>
                  )}
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  className="flex-1 p-1 bg-slate-700 rounded"
                  value={commentText[d.id] || ''}
                  onChange={e => setCommentText(prev => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder="コメントを追加..."
                  disabled={!user}
                />
                <button 
                  className="btn btn-xs btn-primary"
                  onClick={async () => {
                    if (!user) return;
                    await addComment(d.id, commentText[d.id]);
                    setCommentText(prev => ({ ...prev, [d.id]: '' }));
                  }}
                  disabled={!commentText[d.id]?.trim() || !user}
                >
                  送信
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DiaryFeed; 