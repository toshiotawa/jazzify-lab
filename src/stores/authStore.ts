import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/platform/supabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isGuest: boolean;
  guestId: string | null;
  hasProfile: boolean;
  profile: {
    nickname: string;
    rank: 'free' | 'standard' | 'premium' | 'platinum';
    level: number;
    xp: number;
    isAdmin: boolean;
    id: string;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
}

interface AuthActions {
  init: () => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  fetchProfile: () => Promise<void>;
  createProfile: (nickname: string, agreed: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set, get) => ({
    user: null,
    session: null,
    loading: false,
    error: null,
    isGuest: false,
    guestId: null,
    hasProfile: false,
    profile: null,

    /**
     * 初期化: Supabase の auth 状態を取得し、リスナーを張る
     */
    init: async () => {
      const supabase = getSupabaseClient();
      set(state => {
        state.loading = true;
      });
      
      // URLからのマジックリンクトークン処理
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('🔑 Magic link tokens detected in URL');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('❌ Failed to set session from magic link:', error);
          } else {
            console.log('✅ Successfully logged in via magic link');
            // URLからトークンを削除
            window.location.hash = '#dashboard';
          }
        }
      } catch (error) {
        console.error('❌ Error processing magic link:', error);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      set(state => {
        state.session = session ?? null;
        state.user = session?.user ?? null;
        state.loading = false;
        state.isGuest = false;
      });

      // auth 状態変化監視
      supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('🔄 Auth state changed:', _event, session?.user?.email);
        set(state => {
          state.session = session ?? null;
          state.user = session?.user ?? null;
        });
        
        // ログイン成功時にプロフィールを取得
        if (_event === 'SIGNED_IN' && session?.user) {
          await get().fetchProfile();
        }
      });

      if (session?.user) {
        await get().fetchProfile();
      }
    },

    /**
     * Magic Link 送信
     */
    loginWithMagicLink: async (email: string) => {
      const supabase = getSupabaseClient();
      set(state => {
        state.loading = true;
        state.error = null;
      });
      // Supabase へ Magic Link を送信 (redirect URL を明示)
      const redirectUrl =
        (import.meta.env?.VITE_SUPABASE_REDIRECT_URL as string | undefined) ??
        (typeof location !== 'undefined' ? location.origin : undefined);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
      });
      set(state => {
        state.loading = false;
        if (error) {
          state.error = error.message;
        }
      });
    },

    /**
     * ログアウト
     */
    logout: async () => {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      set(state => {
        state.user = null;
        state.session = null;
        state.isGuest = false;
        state.guestId = null;
        state.hasProfile = false;
        state.profile = null;
      });
    },

    /**
     * ゲストモードに入る
     */
    enterGuestMode: () => {
      set(state => {
        state.isGuest = true;
        state.user = null;
        state.session = null;
        // 既に guestId がある場合は再利用
        const stored = localStorage.getItem('guest_id');
        const id = stored ?? crypto.randomUUID();
        state.guestId = id;
        if (!stored) {
          localStorage.setItem('guest_id', id);
        }
      });
    },

    fetchProfile: async () => {
      const supabase = getSupabaseClient();
      const { user } = get();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, rank, level, xp, is_admin, avatar_url, bio')
        .eq('id', user.id)
        .single();
      set(state => {
        state.hasProfile = !!data && !error;
        if (data && !error) {
          state.profile = {
            nickname: data.nickname,
            rank: data.rank,
            level: data.level,
            xp: data.xp,
            isAdmin: data.is_admin,
            id: user.id,
            avatar_url: data.avatar_url,
            bio: data.bio,
          } as any;
        }
      });
    },

    createProfile: async (nickname, agreed) => {
      if (!agreed) {
        set(state => {
          state.error = '利用規約に同意してください';
        });
        return;
      }
      const supabase = getSupabaseClient();
      const { user } = get();
      if (!user) return;
      
      // プロフィール作成（upsertを使用してRLSエラーを回避）
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email!,
        nickname,
        rank: 'free',
        xp: 0,
        level: 1,
        is_admin: false,
      }, {
        onConflict: 'id'
      });
      
      if (error) {
        set(state => { state.error = error.message; });
      } else {
        await get().fetchProfile();
      }
    },
  }))
); 