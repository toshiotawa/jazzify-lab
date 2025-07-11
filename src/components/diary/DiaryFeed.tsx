import React, { useEffect, useState } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { useToast } from '@/stores/toastStore';
import { DiaryComment } from '@/platform/supabaseDiary';

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
  const toast = useToast();
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
              className={`flex items-center text-xs text-gray-400 hover:text-pink-400 transition-colors p-1 rounded ${
                d.user_id === user?.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={async () => {
                if (!user) return;
                if (d.user_id === user.id) {
                  toast.error('自分の日記にはいいねできません');
                  return;
                }
                try {
                  await like(d.id);
                } catch (e: any) {
                  toast.error(e.message || 'いいねに失敗しました');
                }
              }}
              disabled={d.user_id === user?.id}
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
                    const text = commentText[d.id]?.trim();
                    if (!text) return;
                    
                    try {
                      await addComment(d.id, text);
                      setCommentText(prev => ({ ...prev, [d.id]: '' }));
                    } catch (e: any) {
                      console.error('コメント追加エラー:', e);
                      toast.error(e.message || 'コメントの追加に失敗しました');
                    }
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