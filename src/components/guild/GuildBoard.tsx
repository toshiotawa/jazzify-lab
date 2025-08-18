import React, { useEffect, useState } from 'react';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { addGuildComment, createGuildPost, fetchGuildComments, fetchGuildPostsInfinite, likeGuildPost, GuildPost, GuildComment, deleteGuildPost, deleteGuildComment } from '@/platform/supabaseGuildBoard';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  guildId: string;
}

const GuildBoard: React.FC<Props> = ({ guildId }) => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<GuildPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, GuildComment[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void reload();
  }, [guildId]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetchGuildPostsInfinite({ guildId, limit: 10 });
      setPosts(res.posts);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchGuildPostsInfinite({ guildId, limit: 10, beforeCreatedAt: cursor || undefined });
      setPosts(prev => [...prev, ...res.posts]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        void loadMore();
      }
    }, { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const submitPost = async () => {
    const text = newContent.trim();
    if (!text) return;
    try {
      await createGuildPost(text, guildId);
      setNewContent('');
      await reload();
    } catch (e: any) {
      alert(e?.message || '投稿に失敗しました');
    }
  };

  const toggleComments = async (postId: string) => {
    const next = !openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: next }));
    if (next && !comments[postId]) {
      const list = await fetchGuildComments(postId);
      setComments(prev => ({ ...prev, [postId]: list }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = (commentInput[postId] || '').trim();
    if (!text) return;
    await addGuildComment(postId, text);
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    const list = await fetchGuildComments(postId);
    setComments(prev => ({ ...prev, [postId]: list }));
  };

  if (!user) return null;

  return (
    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
      <h4 className="font-semibold mb-2">メンバー掲示板</h4>
      <div className="mb-3">
        <textarea className="w-full bg-slate-800 p-2 rounded text-sm" rows={3} placeholder="メッセージを入力（画像は不可）" value={newContent} onChange={(e)=>setNewContent(e.target.value)} />
        <div className="flex justify-end mt-2">
          <button className="btn btn-sm btn-primary" onClick={submitPost}>投稿</button>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">まだ投稿はありません</p>
      ) : (
        <ul className="space-y-3">
          {posts.map(p => (
            <li key={p.id} className="bg-slate-800 p-3 rounded">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={()=>{ window.location.href = `/main#diary-user?id=${p.user_id}`; }} aria-label="メンバー詳細へ">
                  <img src={p.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                </button>
                <div className="text-sm">
                  <button className="font-medium text-left" onClick={()=>{ window.location.href = `/main#diary-user?id=${p.user_id}`; }}>{p.nickname}</button>
                  <div className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleString('ja-JP')}</div>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{p.content}</div>
              <div className="mt-2 text-xs text-gray-300 flex items-center gap-3">
                <button className="hover:text-pink-400" onClick={async ()=>{ try{ await likeGuildPost(p.id); await reload(); } catch(e:any){ alert(e?.message||'いいねに失敗しました'); } }}>いいね {p.likes_count}</button>
                <button className="hover:text-blue-400" onClick={()=>toggleComments(p.id)}>コメント {p.comments_count}</button>
                {p.user_id === user?.id && (
                  <button className="text-red-400 hover:text-red-300" onClick={async ()=>{ if(!confirm('この投稿を削除しますか？')) return; try{ await deleteGuildPost(p.id); setPosts(prev=>prev.filter(x=>x.id!==p.id)); } catch(e:any){ alert(e?.message||'削除に失敗しました'); } }}>削除</button>
                )}
              </div>
              {openComments[p.id] && (
                <div className="mt-2 space-y-2">
                  {(comments[p.id] || []).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <button onClick={()=>{ window.location.href = `/main#diary-user?id=${c.user_id}`; }} aria-label="メンバー詳細へ">
                        <img src={c.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                      </button>
                      <button className="font-semibold text-left" onClick={()=>{ window.location.href = `/main#diary-user?id=${c.user_id}`; }}>{c.nickname}</button>
                      <div className="text-gray-200 flex-1">{c.content}</div>
                      <div className="text-gray-500">{new Date(c.created_at).toLocaleString('ja-JP')}</div>
                      {c.user_id === user?.id && (
                        <button className="text-red-400 hover:text-red-300" onClick={async ()=>{ if(!confirm('このコメントを削除しますか？')) return; try{ await deleteGuildComment(c.id); const list = await fetchGuildComments(p.id); setComments(prev=>({ ...prev, [p.id]: list })); } catch(e:any){ alert(e?.message||'削除に失敗しました'); } }}>削除</button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="flex-1 bg-slate-700 p-1 rounded" placeholder="コメントを書く" value={commentInput[p.id] || ''} onChange={(e)=>setCommentInput(prev=>({ ...prev, [p.id]: e.target.value }))} />
                    <button className="btn btn-xs btn-primary" onClick={async()=>{ try{ await submitComment(p.id); } catch(e:any){ alert(e?.message||'コメントに失敗しました'); } }}>送信</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div ref={sentinelRef} className="h-8" />
      {loadingMore && <p className="text-center text-gray-500 text-xs mt-2">読み込み中...</p>}
      {!hasMore && posts.length>0 && <p className="text-center text-gray-500 text-xs mt-2">これ以上はありません</p>}
    </div>
  );
};

export default GuildBoard;

