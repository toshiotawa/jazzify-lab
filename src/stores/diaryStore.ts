import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Diary, DiaryComment, fetchDiaries, createDiary, likeDiary, updateDiary, fetchComments, addComment, deleteComment } from '@/platform/supabaseDiary';
import { getSupabaseClient } from '@/platform/supabaseClient';

// グローバルなRealtime初期化状態管理
let globalRealtimeInitialized = false;
let globalRealtimeUnsubscribers: Array<() => void> = [];

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
  // infinite scroll state
  nextCursor: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  lastFetchedAt: number | null;
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
  // infinite scroll actions
  fetchInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  likeComment: (commentId: string, diaryId: string) => Promise<void>;
  disposeRealtime: () => void;
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
    nextCursor: null,
    hasMore: true,
    loadingMore: false,
    lastFetchedAt: null,

    fetch: async (date?: string) => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const supabase = getSupabaseClient();
        const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
        set(s => { s.currentDate = date ?? today; });

        // 直近30秒以内の再取得はスキップ（タブ切替対策）
        const now = Date.now();
        const { lastFetchedAt } = get();
        if (lastFetchedAt && now - lastFetchedAt < 30_000) {
          set(s => { s.loading = false; });
          return;
        }

        const { getCurrentUserIdCached } = await import('@/platform/supabaseClient');
        const uid = await getCurrentUserIdCached();
        if (uid) {
          // 今日の投稿済み判定を軽量化（TTLキャッシュ + count/head）
          const { fetchWithCache } = await import('@/platform/supabaseClient');
          const headKey = `today_diary_head:${uid}:${today}`;
          const { count } = await fetchWithCache(
            headKey,
            async () => await supabase
              .from('practice_diaries')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', uid)
              .eq('practice_date', today),
            1000 * 30
          );
          set(s => { s.todayPosted = !!(count && count > 0); });
        } else {
          set(s => { s.todayPosted = false; });
        }

        // switch to infinite initial fetch
        const { fetchDiariesInfinite } = await import('@/platform/supabaseDiary');
        const { diaries, nextCursor, hasMore } = await fetchDiariesInfinite({ limit: 10 });
        set(s => {
          s.diaries = diaries;
          s.nextCursor = nextCursor;
          s.hasMore = hasMore;
          s.lastFetchedAt = Date.now();
        });
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

        // 楽観的にトゥームストーン化
        set(s => {
          const d = s.diaries.find(x => x.id === diaryId);
          if (d) {
            d.content = '';
            d.is_deleted = true;
            d.image_url = undefined;
          }
          // コメント・いいね一覧は残す（文脈維持）。必要ならクリア
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

    // new infinite actions
    fetchInitial: async () => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const { fetchDiariesInfinite } = await import('@/platform/supabaseDiary');
        const { diaries, nextCursor, hasMore } = await fetchDiariesInfinite({ limit: 10 });
        set(s => {
          s.diaries = diaries;
          s.nextCursor = nextCursor;
          s.hasMore = hasMore;
        });
      } catch (e:any) {
        set(s => { s.error = e.message; });
      } finally { set(s => { s.loading = false; }); }
    },

    loadMore: async () => {
      const { nextCursor, hasMore, loadingMore } = get();
      if (!hasMore || loadingMore) return;
      set(s => { s.loadingMore = true; });
      try {
        const { fetchDiariesInfinite } = await import('@/platform/supabaseDiary');
        const { diaries, nextCursor: nc, hasMore: hm } = await fetchDiariesInfinite({ limit: 10, beforeCreatedAt: nextCursor || undefined });
        set(s => {
          s.diaries = s.diaries.concat(diaries);
          s.nextCursor = nc;
          s.hasMore = hm;
        });
      } finally {
        set(s => { s.loadingMore = false; });
      }
    },

    likeComment: async (commentId: string, diaryId: string) => {
      const { likeComment } = await import('@/platform/supabaseDiary');
      await likeComment(commentId);
      // refresh comments to update counts
      await get().fetchComments(diaryId);
    },

    initRealtime: () => {
      // グローバル状態もチェック（重複購読防止）
      if (get().realtimeInitialized || globalRealtimeInitialized) return;
      const supabase = getSupabaseClient();

      // 既存のチャンネルを除去してから購読（ホットリロード時の重複防止）
      try { (globalRealtimeUnsubscribers || []).forEach(fn => fn()); } catch {}
      globalRealtimeUnsubscribers = [];

      // JSTの今日 (yyyy-mm-dd)
      const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');

      // 日記新規投稿（当日分のみ監視）
      const diariesChannel = supabase.channel('realtime-diaries')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'practice_diaries', filter: `practice_date=eq.${today}` }, async (payload) => {
          try {
            const newDiaryId = (payload.new as any)?.id;
            if (!newDiaryId) return;
            const { data } = await supabase
              .from('practice_diaries')
              .select('*, profiles(nickname, avatar_url, level, rank, email)')
              .eq('id', newDiaryId)
              .maybeSingle();
            if (!data) return;
            // いいね/コメント件数を最小限で取得
            const [likesRes, commentsRes] = await Promise.all([
              supabase.from('diary_likes').select('diary_id').eq('diary_id', newDiaryId),
              supabase.from('diary_comments').select('diary_id').eq('diary_id', newDiaryId),
            ]);
            const likes = (likesRes.data || []).length;
            const comments = (commentsRes.data || []).length;
            set(s => {
              const row: any = data;
              const insert = {
                id: row.id,
                content: row.content,
                practice_date: row.practice_date,
                created_at: row.created_at,
                likes,
                comment_count: comments,
                nickname: row.profiles?.nickname || 'User',
                avatar_url: row.profiles?.avatar_url,
                level: row.profiles?.level || 1,
                rank: row.profiles?.rank || 'free',
                image_url: row.image_url,
              } as any;
              s.diaries = [insert, ...s.diaries];
            });
          } catch {}
        })
        .subscribe();
      globalRealtimeUnsubscribers.push(() => { try { supabase.removeChannel(diariesChannel); } catch {} });

      // コメント新規投稿（当日分のみ監視 + 既に表示している日記のみ再取得）
      const todayStart = `${today}T00:00:00+09:00`;
      const commentsChannel = supabase.channel('realtime-diary-comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diary_comments', filter: `created_at=gte.${todayStart}` }, async (payload) => {
          const diaryId = (payload.new as any).diary_id;
          if (!diaryId) return;
          // その日記のコメントを既にロードしている場合のみ再取得
          const loaded = get().comments[diaryId];
          if (!loaded) return;
          await get().fetchComments(diaryId);
        })
        .subscribe();
      globalRealtimeUnsubscribers.push(() => { try { supabase.removeChannel(commentsChannel); } catch {} });

      set(s => { s.realtimeInitialized = true; });
      globalRealtimeInitialized = true;
    },
    disposeRealtime: () => {
      if (!globalRealtimeInitialized && !get().realtimeInitialized) return;
      const unsubs = [...globalRealtimeUnsubscribers];
      globalRealtimeUnsubscribers = [];
      unsubs.forEach(unsub => { try { unsub(); } catch {} });
      set(s => { s.realtimeInitialized = false; });
      globalRealtimeInitialized = false;
    },
  }))
);

// NOTE: Realtime initialization is now triggered from the UI to avoid
// creating multiple channels inadvertently during hot reloads or when the
// store is imported in different contexts.