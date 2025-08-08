import React, { useEffect, useState } from 'react';
import GameHeader from '@/components/ui/GameHeader';
import { fetchDiaryById, fetchComments } from '@/platform/supabaseDiary';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { FaHeart } from 'react-icons/fa';

const DiaryDetailPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [diaryId, setDiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diary, setDiary] = useState<Awaited<ReturnType<typeof fetchDiaryById>> | null>(null);
  const { comments, fetchComments: loadComments, addComment, like, likeComment } = useDiaryStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#diary-detail')) {
        const id = new URLSearchParams(hash.split('?')[1] || '').get('id');
        setDiaryId(id);
        setOpen(!!id);
      } else {
        setOpen(false);
        setDiaryId(null);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!diaryId) return;
      setLoading(true);
      setError(null);
      try {
        const d = await fetchDiaryById(diaryId);
        setDiary(d);
        await loadComments(diaryId);
      } catch (e:any) {
        setError(e.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    if (open) run();
  }, [open, diaryId]);

  if (!open) return null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-game text-white">
      <GameHeader />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto bg-slate-900 rounded-lg p-4 border border-slate-700">
          {loading ? (
            <p className="text-center text-gray-400">読み込み中...</p>
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
          ) : !diary ? (
            <p className="text-center text-gray-400">見つかりません</p>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                <img src={diary.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full object-cover cursor-pointer" onClick={()=>{window.location.href=`/main#diary-user?id=${diary.user_id}`;}} />
                <button className="font-semibold hover:text-blue-400" onClick={()=>{window.location.href=`/main#diary-user?id=${diary.user_id}`;}}>{diary.nickname}</button>
                <span className="text-gray-500">{diary.practice_date}</span>
                <span className="text-yellow-400">Lv.{diary.level}</span>
              </div>
              <p className="whitespace-pre-wrap text-gray-100 mb-3 text-sm leading-relaxed">{diary.content}</p>
              {diary.image_url && (
                <div className="mb-3">
                  <img src={diary.image_url} className="w-full max-w-lg mx-auto rounded-lg shadow-md" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <button className="flex items-center text-xs text-gray-400 hover:text-pink-400" onClick={()=>{ if(diary) like(diary.id); }}>
                  <FaHeart className="mr-1"/> {diary.likes}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {(comments[diary.id] || []).map(c => (
                  <div key={c.id} className="text-xs text-gray-300 flex items-center space-x-2">
                    <img src={c.avatar_url||DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-semibold">{c.nickname}</span>
                    <p className="flex-1 break-words">{c.content}</p>
                    <button className="text-pink-400 hover:text-pink-300 disabled:opacity-50" onClick={()=>likeComment(c.id, diary.id)} disabled={c.user_id===user?.id} title={c.user_id===user?.id ? '自分のコメントにはいいねできません' : 'いいね'}>
                      <FaHeart className="inline mr-1"/> {c.likes ?? 0}
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input className="flex-1 p-1 bg-slate-700 rounded" value={text} onChange={e=>setText(e.target.value)} placeholder="コメントを追加..." />
                  <button className="btn btn-xs btn-primary" onClick={async ()=>{ if(!diary) return; const t=text.trim(); if(!t) return; await addComment(diary.id, t); setText(''); await loadComments(diary.id); }}>送信</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryDetailPage;