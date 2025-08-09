import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { fetchLatestNotifications, markNotificationsRead, type NotificationItem } from '@/platform/supabaseNotifications';

interface NotificationState {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  unread: boolean;
  open: boolean;
}

interface NotificationActions {
  fetch: () => Promise<void>;
  markRead: (ids?: string[]) => Promise<void>;
  setOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  immer((set, get) => ({
    items: [],
    loading: false,
    error: null,
    unread: false,
    open: false,

    fetch: async () => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const items = await fetchLatestNotifications(10);
        set(s => { s.items = items; s.unread = items.some(n => !n.read); });
      } catch (e:any) {
        set(s => { s.error = e.message || '通知の取得に失敗しました'; });
      } finally {
        set(s => { s.loading = false; });
      }
    },

    markRead: async (ids?: string[]) => {
      // 楽観的にバッジを消す
      set(s => {
        if (ids && ids.length > 0) {
          s.items.forEach(i => { if (ids.includes(i.id)) i.read = true; });
        } else {
          s.items.forEach(i => { i.read = true; });
        }
        s.unread = s.items.some(i => !i.read);
      });
      await markNotificationsRead(ids);
    },

    setOpen: (open: boolean) => set(s => { s.open = open; }),
  }))
);