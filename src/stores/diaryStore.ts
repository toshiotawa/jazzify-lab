import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Diary, DiaryComment, fetchDiaries, createDiary, likeDiary, updateDiary, fetchComments, addComment, deleteComment } from '@/platform/supabaseDiary';
import { getSupabaseClient } from '@/platform/supabaseClient';

interface DiaryState {
  diaries: Diary[];
  loading: boolean;
  error: string | null;
  todayPosted: boolean;
  comments: Record<string, DiaryComment[]>;
  realtimeInitialized: boolean;
  likeUsers: Record<string, import('@/platform/supabaseDiary').DiaryLikeUser[]>;
}

interface DiaryActions {
  fetch: () => Promise<void>;
  add: (content: string) => Promise<{
    success: boolean;
    xpGained: number;
    totalXp: number;
    level: number;
    levelUp: boolean;
    missionsUpdated: number;
  }>;
  like: (id: string) => Promise<void>;
  update: (id: string, content: string) => Promise<void>;
  fetchComments: (diaryId: string) => Promise<void>;
  addComment: (diaryId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, diaryId: string) => Promise<void>;
  initRealtime: () => void;
  deleteDiary: (diaryId: string) => Promise<void>;
  fetchLikeUsers: (diaryId: string) => Promise<void>;
}

export const useDiaryStore = create<DiaryState & DiaryActions>()(
  immer((set, get) => ({
    diaries: [],
    loading: false,
    error: null,
    todayPosted: false,
    comments: {},
    realtimeInitialized: false,
    likeUsers: {},

    fetch: async () => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const data = await fetchDiaries(50);
        // 当日の日記のみ表示
        const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
        const todayDiaries = data.filter(d => d.practice_date === today);
        set(s => { s.diaries = todayDiaries; });
        // 今日投稿しているか判定
        const { data: { user } } = await getSupabaseClient().auth.getUser();
        const posted = user ? todayDiaries.some(d => d.user_id === user.id) : false;
        set(s => { s.todayPosted = posted; });
      } catch (e:any) {
        set(s => { s.error = e.message; });
      } finally { set(s=>{s.loading=false;}); }
    },

    add: async (content: string) => {
      const result = await createDiary(content);
      await get().fetch();
      // ミッションストアを同期
      const { useMissionStore } = await import('@/stores/missionStore');
      await useMissionStore.getState().fetchAll();
      return result;
    },

    like: async (id: string) => {
      await likeDiary(id);
      set(s => {
        const d = s.diaries.find(di => di.id === id);
        if (d) d.likes += 1;
      });
    },

    update: async (id: string, content: string) => {
      await updateDiary(id, content);
      await get().fetch();
    },

    fetchComments: async (diaryId: string) => {
      const comments = await fetchComments(diaryId);
      set(s => { s.comments[diaryId] = comments; });
    },

    addComment: async (diaryId: string, content: string) => {
      await addComment(diaryId, content);
      await get().fetchComments(diaryId);
    },

    deleteComment: async (commentId: string, diaryId: string) => {
      await deleteComment(commentId);
      await get().fetchComments(diaryId);
    },

    deleteDiary: async (diaryId: string) => {
      const { deleteDiary } = await import('@/platform/supabaseDiary');
      await deleteDiary(diaryId);
      await get().fetch();
    },

    fetchLikeUsers: async (diaryId: string) => {
      const { fetchDiaryLikes } = await import('@/platform/supabaseDiary');
      const users = await fetchDiaryLikes(diaryId, 50);
      set(s => { s.likeUsers[diaryId] = users; });
    },

    initRealtime: () => {
      if (get().realtimeInitialized) return;
      const supabase = getSupabaseClient();

      // 日記新規投稿
      supabase.channel('realtime-diaries')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'practice_diaries' }, async () => {
          // 最新データを取得
          await get().fetch();
        })
        .subscribe();

      // コメント新規投稿
      supabase.channel('realtime-diary-comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diary_comments' }, async (payload) => {
          const diaryId = (payload.new as any).diary_id;
          if (diaryId) {
            await get().fetchComments(diaryId);
          }
        })
        .subscribe();

      set(s => { s.realtimeInitialized = true; });
    },
  }))
);

// NOTE: Realtime initialization is now triggered from the UI to avoid
// creating multiple channels inadvertently during hot reloads or when the
// store is imported in different contexts.