import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Diary, DiaryComment, fetchDiaries, createDiary, likeDiary, updateDiary, fetchComments, addComment, deleteComment } from '@/platform/supabaseDiary';
import { getSupabaseClient } from '@/platform/supabaseClient';

// グローバルなRealtime初期化状態管理
let globalRealtimeInitialized = false;

interface DiaryState {
  diaries: Diary[];
  loading: boolean;
  error: string | null;
  todayPosted: boolean;
  comments: Record<string, DiaryComment[]>;
  realtimeInitialized: boolean;
  likeUsers: Record<string, import('@/platform/supabaseDiary').DiaryLikeUser[]>;
  updating: Record<string, boolean>; // 個別の更新状態
  deleting: Record<string, boolean>; // 個別の削除状態
  currentDate: string | null; // 現在の表示日 (yyyy-mm-dd)
}

interface DiaryActions {
  fetch: (date?: string) => Promise<void>;
  add: (content: string, imageUrl?: string) => Promise<{
    success: boolean;
    xpGained: number;
    totalXp: number;
    level: number;
    levelUp: boolean;
    missionsUpdated: number;
    diaryId: string;
  }>;
  like: (id: string) => Promise<void>;
  update: (id: string, content: string, imageUrl?: string) => Promise<void>;
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
    updating: {},
    deleting: {},
    currentDate: null,

    fetch: async (date?: string) => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const supabase = getSupabaseClient();
        const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
        // 現在の表示日を更新
        set(s => { s.currentDate = date ?? today; });

        // まず今日投稿済みかどうかを独立に計算
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from('practice_diaries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('practice_date', today);
          set(s => { s.todayPosted = !!(count && count > 0); });
        } else {
          set(s => { s.todayPosted = false; });
        }

        // 一覧の取得
        if (date) {
          const { fetchDiariesByDate } = await import('@/platform/supabaseDiary');
          const list = await fetchDiariesByDate(date, 500);
          set(s => { s.diaries = list; });
        } else {
          const data = await fetchDiaries(50);
          // 当日の日記のみ表示
          const todayDiaries = data.filter(d => d.practice_date === today);
          set(s => { s.diaries = todayDiaries; });
        }
      } catch (e:any) {
        set(s => { s.error = e.message; });
      } finally { set(s=>{s.loading=false;}); }
    },

    add: async (content: string, imageUrl?: string) => {
      const result = await createDiary(content, imageUrl);
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

    update: async (id: string, content: string, imageUrl?: string) => {
      set(s => { 
        s.updating[id] = true; 
        s.error = null; 
      });
      
      try {
        await updateDiary(id, content, imageUrl);
        
        // 楽観的更新
        set(s => {
          const diary = s.diaries.find(d => d.id === id);
          if (diary) {
            diary.content = content;
            if (imageUrl !== undefined) {
              diary.image_url = imageUrl;
            }
          }
        });
      } catch (error) {
        set(s => { 
          s.error = error instanceof Error ? error.message : '更新に失敗しました'; 
        });
        throw error;
      } finally {
        set(s => { 
          s.updating[id] = false; 
        });
      }
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
      set(s => { 
        s.deleting[diaryId] = true; 
        s.error = null; 
      });
      
      try {
        const { deleteDiary } = await import('@/platform/supabaseDiary');
        await deleteDiary(diaryId);
        
        // 楽観的削除
        set(s => {
          s.diaries = s.diaries.filter(d => d.id !== diaryId);
          // 関連するコメントも削除
          delete s.comments[diaryId];
          delete s.likeUsers[diaryId];
        });
      } catch (error) {
        set(s => { 
          s.error = error instanceof Error ? error.message : '削除に失敗しました'; 
        });
        throw error;
      } finally {
        set(s => { 
          s.deleting[diaryId] = false; 
        });
      }
    },

    fetchLikeUsers: async (diaryId: string) => {
      const { fetchDiaryLikes } = await import('@/platform/supabaseDiary');
      const users = await fetchDiaryLikes(diaryId, 50);
      set(s => { s.likeUsers[diaryId] = users; });
    },

    initRealtime: () => {
      // グローバル状態もチェック
      if (get().realtimeInitialized || globalRealtimeInitialized) return;
      
      const supabase = getSupabaseClient();

      // 日記新規投稿（最適化: キャッシュクリアを最小限に）
      supabase.channel('realtime-diaries')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'practice_diaries' }, async () => {
          // 現在の表示日を保持したまま再取得
          await get().fetch(get().currentDate || undefined);
        })
        .subscribe();

      // コメント新規投稿（最適化: 特定の日記のコメントのみ更新）
      supabase.channel('realtime-diary-comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diary_comments' }, async (payload) => {
          const diaryId = (payload.new as any).diary_id;
          if (diaryId) {
            await get().fetchComments(diaryId);
          }
        })
        .subscribe();

      set(s => { s.realtimeInitialized = true; });
      globalRealtimeInitialized = true;
    },
  }))
);

// NOTE: Realtime initialization is now triggered from the UI to avoid
// creating multiple channels inadvertently during hot reloads or when the
// store is imported in different contexts.