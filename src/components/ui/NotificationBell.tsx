import React, { useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const NotificationBell: React.FC = () => {
  const { user, isGuest, profile } = useAuthStore();
  const { unread, fetch, markRead } = useNotificationStore();

  useEffect(() => {
    if (user && !isGuest) {
      fetch().catch(() => {});
    }
  }, [user, isGuest, fetch]);

  if (!user || isGuest) return null;
  const rank = profile?.rank;
  const allowed = rank === 'standard' || rank === 'premium' || rank === 'platinum';
  if (!allowed) return null;

  return (
    <button
      type="button"
      aria-label="通知"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-800 text-white"
      onClick={async () => { try { await markRead(); } catch {} window.location.href = '/main#information'; }}
    >
      <FaBell size={16} />
      {unread && <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full"></span>}
    </button>
  );
};

export default NotificationBell;