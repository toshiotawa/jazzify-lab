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
    twitter_handle?: string | null;
    selected_title?: string | null;
    next_season_xp_multiplier?: number;
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
      const { data: { session } } = await supabase.auth.getSession();
      set(state => {
        state.session = session ?? null;
        state.user = session?.user ?? null;
        state.loading = false;
        state.isGuest = false;
      });

      // BroadcastChannel でタブ間認証同期
      let authChannel: BroadcastChannel | null = null;
      try {
        authChannel = new BroadcastChannel('supabase-auth');
        
        // 他のタブからの認証状態変更を監視
        authChannel.onmessage = ({ data }) => {
          const { event, session } = data;
          if (event === 'SIGNED_IN' && session) {
            set(state => {
              state.session = session;
              state.user = session.user;
              state.isGuest = false;
            });
            // プロフィール情報を再取得
            get().fetchProfile();
          } else if (event === 'SIGNED_OUT') {
            set(state => {
              state.session = null;
              state.user = null;
              state.isGuest = false;
              state.profile = null;
            });
          }
        };
      } catch (error) {
        console.warn('BroadcastChannel not supported, falling back to localStorage events');
        // フォールバック: localStorage イベント
        window.addEventListener('storage', (e) => {
          if (e.key === 'supabase-auth') {
            try {
              const data = JSON.parse(e.newValue || '{}');
              if (data.event === 'SIGNED_IN' && data.session) {
                set(state => {
                  state.session = data.session;
                  state.user = data.session.user;
                  state.isGuest = false;
                });
                get().fetchProfile();
              } else if (data.event === 'SIGNED_OUT') {
                set(state => {
                  state.session = null;
                  state.user = null;
                  state.isGuest = false;
                  state.profile = null;
                });
              }
            } catch (error) {
              console.error('Error parsing auth storage event:', error);
            }
          }
        });
      }

      // auth 状態変化監視
      supabase.auth.onAuthStateChange((event, session) => {
        set(state => {
          state.session = session ?? null;
          state.user = session?.user ?? null;
        });
        
        // ✅ 自タブでもプロフィールを取得する
        if (
          (event === 'SIGNED_IN'        && session?.user) ||
          (event === 'INITIAL_SESSION'  && session?.user) ||
          (event === 'TOKEN_REFRESHED'  && session?.user)
        ) {
          get().fetchProfile().catch(console.error);
        }
        
        // 他のタブに認証状態変更を通知
        if (authChannel) {
          authChannel.postMessage({ event, session });
        } else {
          // localStorage フォールバック
          try {
            localStorage.setItem('supabase-auth', JSON.stringify({ event, session }));
            localStorage.removeItem('supabase-auth'); // 即座に削除してイベントをトリガー
          } catch (error) {
            console.warn('localStorage not available for auth sync');
          }
        }
      });

      if (session?.user) {
        await get().fetchProfile();
      }
    },

    /**
     * Magic Link 送信
     */
    loginWithMagicLink: async (email: string, mode: 'signup' | 'login' = 'login') => {
      const supabase = getSupabaseClient();
      set(state => {
        state.loading = true;
        state.error = null;
      });
      // Supabase へ Magic Link を送信 (redirect URL を明示)
      const redirectUrl =
        import.meta.env.VITE_SUPABASE_REDIRECT_URL ??
        (typeof location !== 'undefined' ? location.origin : undefined);

      const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
        shouldCreateUser: mode === 'signup',
      };
      if (redirectUrl) {
        options.emailRedirectTo = redirectUrl;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options,
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
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, rank, level, xp, is_admin, avatar_url, bio, twitter_handle, next_season_xp_multiplier')
          .eq('id', user.id)
          .maybeSingle(); // singleの代わりにmaybeSingleを使用してNot Found エラーを防ぐ
        
        set(state => {
          state.hasProfile = !!data && !error;
          state.error = null; // エラー状態をクリア
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
              twitter_handle: data.twitter_handle,
              next_season_xp_multiplier: data.next_season_xp_multiplier,
            } as any;
          } else {
            state.profile = null;
          }
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        
        // ネットワークエラーや一時的なエラーの場合は hasProfile を変更しない
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
          set(state => {
            state.error = '一時的なネットワークエラーです。しばらくしてから再試行してください。';
          });
          return;
        }
        
        // その他のエラーの場合のみ hasProfile を false にする
        set(state => {
          state.hasProfile = false;
          state.profile = null;
          state.error = 'プロフィールの取得に失敗しました';
        });
      }
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
      if (!user) {
        set(state => {
          state.error = 'ユーザー情報が見つかりません';
        });
        return;
      }

      set(state => {
        state.loading = true;
        state.error = null;
      });

      try {
        // まず既存のプロフィールを確認
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('nickname, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          // 既存プロフィールがある場合
          set(state => {
            state.loading = false;
            state.error = `既にプロフィールが登録されています（ニックネーム: ${existingProfile.nickname}）`;
          });
          // 既存プロフィールの情報を再取得
          await get().fetchProfile();
          return;
        }

        // 新規プロフィール作成
        const { error } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          nickname,
          rank: 'free',
          xp: 0,
          level: 1,
          is_admin: false,
        });
        
        if (error) {
          throw error;
        }

        // 作成成功後、プロフィール情報を取得
        await get().fetchProfile();
        
        set(state => {
          state.loading = false;
          state.error = null;
        });
        
      } catch (error: any) {
        console.error('Profile creation error:', error);
        set(state => { 
          state.loading = false;
          state.error = error.message || 'プロフィールの作成に失敗しました';
        });
      }
    },
  }))
); 