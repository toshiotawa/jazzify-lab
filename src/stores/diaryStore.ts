import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Diary, fetchDiaries, createDiary, likeDiary } from '@/platform/supabaseDiary';

interface DiaryState {
  diaries: Diary[];
  loading: boolean;
  error: string | null;
  todayPosted: boolean;
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
}

export const useDiaryStore = create<DiaryState & DiaryActions>()(
  immer((set, get) => ({
    diaries: [],
    loading: false,
    error: null,
    todayPosted: false,

    fetch: async () => {
      set(s => { s.loading = true; s.error = null; });
      try {
        const data = await fetchDiaries(50);
        set(s => { s.diaries = data; });
        // 今日投稿しているか判定
        const today = new Date().toISOString().substring(0,10);
        const posted = data.some(d => d.practice_date === today && d.user_id === get().diaries[0]?.user_id);
        set(s => { s.todayPosted = posted; });
      } catch (e:any) {
        set(s => { s.error = e.message; });
      } finally { set(s=>{s.loading=false;}); }
    },

    add: async (content: string) => {
      const result = await createDiary(content);
      await get().fetch();
      return result;
    },

    like: async (id: string) => {
      await likeDiary(id);
      set(s => {
        const d = s.diaries.find(di => di.id === id);
        if (d) d.likes += 1;
      });
    },
  }))
); 