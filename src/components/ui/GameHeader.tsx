import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useGameActions } from '@/stores/helpers';
import { FaHome, FaUserCircle } from 'react-icons/fa';
import { FaBell } from 'react-icons/fa';
import { useNotificationStore } from '@/stores/notificationStore';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

/**
 * ゲーム画面で用いるヘッダーを共通化したコンポーネント。
 * GameScreen だけでなくマイページやアカウントページでも再利用する。
 */
const GameHeader: React.FC = () => {
  const gameActions = useGameActions();
  const { isGuest, profile } = useAuthStore();
  const isStandardGlobal = profile?.rank === 'standard_global';
  const isFree = profile?.rank === 'free';

  return (
    <header className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-3 py-1 z-[60]">
      <div className="flex justify-between items-center">
        {/* 左側ナビゲーション */}
        <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {/* トップ (ダッシュボード) */}
          <button
            className="text-white hover:text-primary-400 font-bold px-2"
            onClick={() => {
              window.location.href = '/main#dashboard';
            }}
          >
            トップ
          </button>

          {/* 曲選択タブ */}
          {!isStandardGlobal && !isFree && (
            <HashButton
              hash="#songs"
              onClick={() => {
                gameActions.setCurrentTab?.('songs');
              }}
              disabled={isGuest}
            >
              曲選択
            </HashButton>
          )}

          {!isStandardGlobal && !isFree && <HashButton hash="#lessons" disabled={isGuest}>レッスン</HashButton>}
          {!isFree && <HashButton hash="#fantasy">ファンタジー</HashButton>}
          {!isFree && <HashButton hash="#ranking" disabled={isGuest}>ランキング</HashButton>}
          {!isStandardGlobal && !isFree && <HashButton hash="#missions" disabled={isGuest}>ミッション</HashButton>}
          {!isStandardGlobal && !isFree && <HashButton hash="#diary" disabled={isGuest}>日記</HashButton>}
          {!isFree && <HashButton hash="#information" disabled={isGuest}>お知らせ</HashButton>}
        </div>

        {/* 右側のコントロール */}
        <HeaderRightControls />
      </div>
    </header>
  );
};

/******************** サブコンポーネント ********************/
interface HashButtonProps {
  hash: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const HashButton: React.FC<HashButtonProps> = ({ hash, children, onClick, disabled }) => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const active = currentHash === hash;

  return (
    <button
      onClick={() => {
        if (!disabled) {
          window.location.hash = hash;
          onClick?.();
        }
      }}
      className={`tab-xs ${active ? 'tab-active' : 'tab-inactive'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const HeaderRightControls: React.FC = () => {
  const { user, isGuest, logout } = useAuthStore();
  const notif = useNotificationStore();

  useEffect(() => {
    if (user && !isGuest) {
      notif.fetch().catch(()=>{});
    }
  }, [user, isGuest]);

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      {user && !isGuest ? (
        <>
          {/* モバイル時はアイコン表示 */}
          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 text-white hover:text-primary-400 transition-colors relative"
              aria-label="通知"
              onClick={async ()=>{ const open = !notif.open; notif.setOpen(open); if (open) { await notif.fetch(); const unreadIds = notif.items.filter(i=>!i.read).map(i=>i.id); if (unreadIds.length>0) { await notif.markRead(unreadIds); } } }}
            >
              <FaBell size={20} />
              {notif.unread && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            {notif.open && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded shadow-lg z-50">
                <div className="p-2 border-b border-slate-700 font-semibold">通知</div>
                <div className="max-h-80 overflow-y-auto">
                  {notif.loading ? (
                    <div className="p-3 text-sm text-gray-400">読み込み中...</div>
                  ) : notif.items.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400">新しい通知はありません</div>
                  ) : (
                    notif.items.map(n => (
                      <button
                        key={n.id}
                        className={`w-full text-left p-3 hover:bg-slate-700 flex items-center space-x-2 ${!n.read ? 'bg-slate-700/50' : ''}`}
                        onClick={() => {
                          // go to diary detail
                          if (n.diary_id) {
                            window.location.href = `/main#diary-detail?id=${n.diary_id}`;
                            useNotificationStore.getState().setOpen(false);
                          }
                        }}
                      >
                        <img src={n.actor_avatar_url || DEFAULT_AVATAR_URL} className="w-6 h-6 rounded-full object-cover bg-slate-600" />
                        <div className="flex-1 text-sm">
                          <div className="text-gray-200">
                            {n.actor_nickname || 'ユーザー'}
                            {n.type === 'diary_like' && ' があなたの日記にいいねしました'}
                            {n.type === 'diary_comment' && ' があなたの日記に返信しました'}
                            {n.type === 'comment_thread_reply' && ' がコメントを追加しました'}
                          </div>
                          <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <a 
            href="#mypage" 
            className="sm:hidden p-2 text-white hover:text-primary-400 transition-colors"
            aria-label="マイページ"
          >
            <FaHome size={20} />
          </a>
          {/* デスクトップ時はテキスト表示 */}
          <a href="#mypage" className="hidden sm:inline-flex btn btn-sm btn-ghost text-white hover:text-primary-400">
            マイページ
          </a>
          <a href="#account" className="hidden sm:inline-flex btn btn-sm btn-primary">
            アカウント
          </a>
        </>
      ) : isGuest ? (
        <>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => {
              logout();
              window.location.hash = '#login';
            }}
          >
            会員登録
          </button>
        </>
      ) : (
        <button className="btn btn-sm btn-outline" onClick={logout}>ログアウト</button>
      )}
    </div>
  );
};

export default GameHeader; 