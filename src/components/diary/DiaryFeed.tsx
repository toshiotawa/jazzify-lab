import React, { useEffect, useState } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { FaHeart, FaTrash, FaEdit, FaChevronDown, FaTimes, FaSave, FaCrown, FaGem, FaStar, FaMedal } from 'react-icons/fa';
import { useToast } from '@/stores/toastStore';
import { DiaryComment } from '@/platform/supabaseDiary';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

const Avatar: React.FC<{ url?: string }> = ({ url }) => (
  <img
    src={url || DEFAULT_AVATAR_URL}
    alt="avatar"
    className="w-8 h-8 rounded-full object-cover"
  />
);

const DiaryFeed: React.FC = () => {
  const { diaries, loading, fetch: fetchAll, like, comments, fetchComments, addComment, deleteComment, deleteDiary, likeUsers, fetchLikeUsers, update } = useDiaryStore();
  const { user, isGuest } = useAuthStore();
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editText, setEditText] = useState<string>('');
  const toast = useToast();

  // ランクに応じたアイコンを取得する関数
  const getRankIcon = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'platinum':
        return <FaCrown className="text-purple-400 text-sm" />;
      case 'premium':
        return <FaGem className="text-yellow-400 text-sm" />;
      case 'standard':
        return <FaStar className="text-blue-400 text-xs" />;
      case 'free':
      default:
        return <FaMedal className="text-gray-400 text-xs" />;
    }
  };
  // Initialize realtime channels when the feed mounts
  useEffect(() => { useDiaryStore.getState().initRealtime(); }, []);
  useEffect(() => { void fetchAll(); }, []);
  
  // コメントを並行取得
  useEffect(() => {
    const commentPromises = diaries
      .filter(d => openComments[d.id])
      .map(d => fetchComments(d.id));
    
    if (commentPromises.length > 0) {
      Promise.all(commentPromises).catch(console.error);
    }
  }, [openComments, diaries]);

  if (!user || isGuest) return (
    <div className="p-4 text-center text-gray-400">
      コミュニティ機能はログインユーザー専用です。<br />
      <button className="btn btn-sm btn-primary mt-4" onClick={()=>{window.location.hash='#login';}}>
        ログイン / 会員登録
      </button>
    </div>
  );

  if (loading) return <p className="text-center text-gray-400">Loading...</p>;

  const goToMyDiary = () => {
    if (user) {
      window.location.hash = `#diary-user?id=${user.id}`;
    }
  };

  return (
    <div className="space-y-3">
      {user && (
        <div className="text-right mb-1">
          <button className="btn btn-xs btn-outline" onClick={goToMyDiary}>自分の日記を見る</button>
        </div>
      )}
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
              <span className="text-xs ml-2 text-yellow-400">Lv.{d.level}</span>
              <div className="flex items-center space-x-1 ml-1">
                {getRankIcon(d.rank)}
                <span className="text-xs text-green-400">{d.rank}</span>
              </div>
            </div>
          </div>
          {editingId===d.id ? (
            <div className="space-y-2 mb-3">
              <textarea
                className="w-full bg-slate-700 p-2 rounded text-sm"
                rows={4}
                value={editText}
                onChange={e=>setEditText(e.target.value)}
              />
              <div className="flex space-x-2 text-xs">
                <button
                  className="btn btn-xs btn-primary flex items-center" onClick={async()=>{
                    try{
                      await update(d.id, editText);
                      setEditingId(null);
                    }catch(e:any){ toast.error(e.message);} 
                  }}
                ><FaSave className="mr-1"/>保存</button>
                <button className="btn btn-xs btn-outline flex items-center" onClick={()=>setEditingId(null)}><FaTimes className="mr-1"/>キャンセル</button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-gray-100 mb-3 text-sm leading-relaxed">{d.content}</p>
              {d.image_url && (
                <div className="mb-3">
                  <img
                    src={d.image_url}
                    alt="日記の画像"
                    className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </>
          )}
          {d.user_id === user?.id && (
            <div className="flex space-x-2 mb-2 text-xs">
              <button
                className="flex items-center text-blue-400 hover:text-blue-300"
                onClick={() => {
                  setEditingId(d.id);
                  setEditText(d.content);
                }}
              ><FaEdit className="mr-1"/> 編集</button>
              <button
                className="flex items-center text-red-400 hover:text-red-300"
                onClick={async () => {
                  if(!confirm('この日記を削除しますか？')) return;
                  try { 
                    await deleteDiary(d.id);
                    toast.success('日記を削除しました');
                  } catch(e:any){ 
                    console.error('日記削除エラー:', e);
                    toast.error(e.message || '日記の削除に失敗しました');
                  }
                }}
              ><FaTrash className="mr-1"/>削除</button>
            </div>
          )}
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
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors mr-2"
              onClick={() => setOpenComments(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
            >
              返信 {comments[d.id]?.length ?? d.comment_count}
            </button>
            <div className="relative">
              <button
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center"
                onClick={async () => {
                  if(!likeUsers[d.id]) await fetchLikeUsers(d.id);
                  setOpenComments(prev=>({...prev, ['likes-'+d.id]: !prev['likes-'+d.id]}));
                }}
              >
                いいねした人 <FaChevronDown className="ml-1" />
              </button>
              {openComments['likes-'+d.id] && likeUsers[d.id] && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-slate-700 p-2 rounded shadow-lg w-52 max-h-60 overflow-y-auto space-y-1 whitespace-nowrap">
                  {likeUsers[d.id]?.map(u=> (
                    <div key={u.user_id} className="flex items-center space-x-2 text-xs text-gray-200">
                      <Avatar url={u.avatar_url} />
                      <button
                        onClick={()=>{window.location.hash=`#diary-user?id=${u.user_id}`;}}
                        className="font-semibold truncate hover:text-blue-400 transition-colors"
                      >{u.nickname}</button>
                      <span className="text-yellow-400">Lv.{u.level}</span>
                      <div className="flex items-center space-x-1">
                        {getRankIcon(u.rank)}
                        <span className="text-xs text-green-400">{u.rank}</span>
                      </div>
                    </div>
                  ))}
                  {likeUsers[d.id].length===0 && <p className="text-xs text-gray-400">まだいません</p>}
                </div>
              )}
            </div>
          </div>
          {openComments[d.id] && (
            <div className="mt-2 space-y-2">
              {comments[d.id]?.map(c => (
                <div key={c.id} className="text-xs text-gray-300 flex items-center space-x-2">
                  <Avatar url={c.avatar_url} />
                  <button
                    onClick={()=>{window.location.hash=`#diary-user?id=${c.user_id}`;}}
                    className="font-semibold hover:text-blue-400 transition-colors"
                  >{c.nickname}</button>
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