import React, { useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

const NotificationBell: React.FC = () => {
  const { user, isGuest, profile } = useAuthStore();
  const { items, unread, open, fetch, setOpen, loading, markRead } = useNotificationStore();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const allowedRank = profile?.rank === 'standard' || profile?.rank === 'premium' || profile?.rank === 'platinum';
  const canShow = !!user && !isGuest && allowedRank;

  // 初回自動取得は削除し、開いた時のみ取得（API削減）

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [open, setOpen]);

  if (!canShow) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative p-2 rounded hover:bg-slate-800 text-white"
        aria-label="通知"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            fetch();
            // 開いたタイミングで即未読を消す
            markRead();
          }
        }}
      >
        <FaBell className="w-5 h-5" />
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 inline-block w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[70] overflow-hidden">
          <div className="p-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">通知</p>
            <p className="text-xs text-gray-400">最新10件</p>
          </div>
          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="p-3 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : items.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">新しい通知はありません</div>
            ) : (
              <ul className="divide-y divide-slate-700">
                {items.map(n => (
                  <li key={n.id} className="p-3 hover:bg-slate-700/60 transition-colors">
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        onClick={() => {
                          window.location.href = `/main#diary-user?id=${n.actor_id}`;
                          setOpen(false);
                        }}
                        className="shrink-0"
                        aria-label="ユーザー詳細へ"
                      >
                        <img
                          src={n.actor_avatar_url || DEFAULT_AVATAR_URL}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      </button>
                      <button
                        className="text-left flex-1 min-w-0"
                        onClick={() => {
                          if (n.type === 'guild_post_like' || n.type === 'guild_post_comment') {
                            window.location.href = '/main#guilds';
                          } else if (n.diary_id) {
                            window.location.href = `/main#diary-detail?id=${n.diary_id}`;
                          } else {
                            window.location.href = '/main#diary';
                          }
                          setOpen(false);
                        }}
                      >
                        <p className="text-sm text-white whitespace-normal break-words">
                          {(n.type === 'diary_like' || n.type === 'guild_post_like') && (
                            <>
                              <span className="font-semibold">{n.actor_nickname || 'ユーザー'}</span>
                              <span> さんがあなたの{n.type === 'guild_post_like' ? 'ギルド投稿' : '日記'}にいいねしました</span>
                            </>
                          )}
                          {(n.type === 'diary_comment' || n.type === 'guild_post_comment') && (
                            <>
                              <span className="font-semibold">{n.actor_nickname || 'ユーザー'}</span>
                              <span> さんがあなたの{n.type === 'guild_post_comment' ? 'ギルド投稿' : '日記'}にコメントしました</span>
                            </>
                          )}
                          {n.type === 'comment_thread_reply' && (
                            <>
                              <span className="font-semibold">{n.actor_nickname || 'ユーザー'}</span>
                              <span> さんがあなたのコメントに返信しました</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(n.created_at).toLocaleString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}
                        </p>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

