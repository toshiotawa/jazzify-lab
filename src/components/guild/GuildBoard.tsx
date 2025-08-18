import React, { useEffect, useState } from 'react';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';
import { addGuildComment, createGuildPost, fetchGuildComments, fetchGuildPosts, likeGuildPost, GuildPost, GuildComment } from '@/platform/supabaseGuildBoard';
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

  useEffect(() => {
    void reload();
  }, [guildId]);

  const reload = async () => {
    setLoading(true);
    try {
      const p = await fetchGuildPosts(guildId, 50);
      setPosts(p);
    } finally {
      setLoading(false);
    }
  };

  const submitPost = async () => {
    const text = newContent.trim();
    if (!text) return;
    await createGuildPost(text);
    setNewContent('');
    await reload();
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
                <img src={p.avatar_url || DEFAULT_AVATAR_URL} className="w-8 h-8 rounded-full" />
                <div className="text-sm">
                  <div className="font-medium">{p.nickname}</div>
                  <div className="text-gray-400 text-xs">{new Date(p.created_at).toLocaleString('ja-JP')}</div>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap">{p.content}</div>
              <div className="mt-2 text-xs text-gray-300 flex items-center gap-3">
                <button className="hover:text-pink-400" onClick={async ()=>{ await likeGuildPost(p.id); await reload(); }}>いいね {p.likes_count}</button>
                <button className="hover:text-blue-400" onClick={()=>toggleComments(p.id)}>コメント {p.comments_count}</button>
              </div>
              {openComments[p.id] && (
                <div className="mt-2 space-y-2">
                  {(comments[p.id] || []).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <img src={c.avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full" />
                      <div className="font-semibold">{c.nickname}</div>
                      <div className="text-gray-200 flex-1">{c.content}</div>
                      <div className="text-gray-500">{new Date(c.created_at).toLocaleString('ja-JP')}</div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="flex-1 bg-slate-700 p-1 rounded" placeholder="コメントを書く" value={commentInput[p.id] || ''} onChange={(e)=>setCommentInput(prev=>({ ...prev, [p.id]: e.target.value }))} />
                    <button className="btn btn-xs btn-primary" onClick={()=>submitComment(p.id)}>送信</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GuildBoard;

