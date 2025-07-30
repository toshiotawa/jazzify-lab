import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { useUserStatsStore } from './userStatsStore';
import { 
  logMagicLinkDebugInfo, 
  logMagicLinkLoginProcess, 
  logMagicLinkError, 
  logMagicLinkSuccess,
  parseMagicLinkFromUrl
} from '@/utils/magicLinkConfig';

/**
 * 有効なリダイレクトURLを取得・検証する
 * @returns 有効なリダイレクトURL、またはnull
 */
function getValidRedirectUrl(): string | null {
  // 開発環境でデバッグ情報を出力
  if (import.meta.env.DEV) {
    logMagicLinkDebugInfo();
  }

  // 環境変数から取得を試行
  const envRedirectUrl = import.meta.env.VITE_SUPABASE_REDIRECT_URL;
  
  console.log('🔍 Magic Link リダイレクトURL検証開始');
  console.log('環境変数 VITE_SUPABASE_REDIRECT_URL:', envRedirectUrl);
  
  if (envRedirectUrl) {
    try {
      const url = new URL(envRedirectUrl);
      console.log('解析されたURL:', {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname
      });
      
      // HTTPSまたはlocalhostの場合のみ許可
      if (url.protocol === 'https:' || url.hostname === 'localhost') {
        console.log('✅ 有効なリダイレクトURL:', envRedirectUrl);
        return envRedirectUrl;
      } else {
        console.warn('❌ 無効なプロトコル:', url.protocol);
      }
    } catch (error) {
      console.warn('❌ 無効なURL形式:', envRedirectUrl, error);
    }
  } else {
    console.warn('⚠️ 環境変数 VITE_SUPABASE_REDIRECT_URL が設定されていません');
  }

  // フォールバック: 現在のorigin
  if (typeof location !== 'undefined') {
    const currentOrigin = location.origin;
    console.log('🔄 フォールバック: 現在のoriginを使用:', currentOrigin);
    return currentOrigin;
  }

  console.error('❌ リダイレクトURLを取得できませんでした');
  return null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isGuest: boolean;
  guestId: string | null;
  hasProfile: boolean;
  emailChangeStatus: {
    type: 'success' | 'warning' | null;
    message: string;
    title: string;
  } | null;
  profile: {
    nickname: string;
    rank: 'free' | 'standard' | 'premium' | 'platinum';
    level: number;
    xp: number;
    isAdmin: boolean;
    id: string;
    email?: string;
    avatar_url?: string | null;
    bio?: string | null;
    twitter_handle?: string | null;
    selected_title?: string | null;
    next_season_xp_multiplier?: number;
    // Stripe subscription fields
    stripe_customer_id?: string;
    will_cancel?: boolean;
    cancel_date?: string;
    downgrade_to?: 'free' | 'standard' | 'premium' | 'platinum';
    downgrade_date?: string;
  } | null;
}

interface AuthActions {
  init: () => Promise<void>;
  loginWithMagicLink: (email: string, mode?: 'signup' | 'login', useOtp?: boolean) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  fetchProfile: () => Promise<void>;
  createProfile: (nickname: string, agreed: boolean) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; message: string }>;
  clearEmailChangeStatus: () => void;
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
    emailChangeStatus: null,
    profile: null,

    /**
     * 初期化: Supabase の auth 状態を取得し、リスナーを張る
     */
    init: async () => {
      const supabase = getSupabaseClient();
      
      // URLからマジックリンク情報を解析
      const magicLinkInfo = parseMagicLinkFromUrl();
      
      console.group('🔐 認証初期化開始');
      console.log('🌐 現在のURL:', typeof location !== 'undefined' ? location.href : 'N/A');
      console.log('🔍 マジックリンク検出:', magicLinkInfo.hasMagicLink);
      if (magicLinkInfo.hasMagicLink) {
        console.log('📋 マジックリンク詳細:', magicLinkInfo);
      }
      console.groupEnd();
      
      set(state => {
        state.loading = true;
      });
      
      // マジックリンクが検出された場合、セッションを確立
      if (magicLinkInfo.hasMagicLink && magicLinkInfo.tokenHash) {
        console.log('🔐 マジックリンクトークンでセッション確立を試行');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: magicLinkInfo.tokenHash,
            type: 'email'
          });
          
          if (error) {
            console.error('❌ マジックリンク検証エラー:', error);
            set(state => {
              state.error = `認証エラー: ${error.message}`;
            });
          } else if (data.session) {
            console.log('✅ マジックリンクセッション確立成功');
            logMagicLinkSuccess(data.user?.email || 'unknown', data.session);
            
            // URLパラメータをクリア（セキュリティのため）
            if (typeof window !== 'undefined' && window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('token_hash');
              url.searchParams.delete('type');
              url.searchParams.delete('access_token');
              url.searchParams.delete('refresh_token');
              window.history.replaceState({}, '', url.toString());
              console.log('🧹 URLパラメータをクリアしました');
            }
          }
        } catch (error) {
          console.error('❌ マジックリンク処理エラー:', error);
          set(state => {
            state.error = '認証処理中にエラーが発生しました';
          });
        }
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔑 セッション取得結果:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        sessionCreated: session ? '存在します' : 'なし',
        sessionExpires: session ? '存在します' : 'なし'
      });
      
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
      supabase.auth.onAuthStateChange(async (event, session) => {
        const previousUser = get().user;
        
        console.group('🔄 認証状態変化');
        console.log('📝 イベント:', event);
        console.log('👤 前のユーザー:', previousUser?.id);
        console.log('👤 新しいユーザー:', session?.user?.id);
        console.log('📧 ユーザーメール:', session?.user?.email);
        console.log('🔑 セッション存在:', !!session);
        console.groupEnd();
        
        set(state => {
          state.session = session ?? null;
          state.user = session?.user ?? null;
          // エラーをクリア
          if (session) {
            state.error = null;
          }
        });
        
        // ✅ 自タブでもプロフィールを取得する
        if (
          (event === 'SIGNED_IN'        && session?.user) ||
          (event === 'INITIAL_SESSION'  && session?.user) ||
          (event === 'TOKEN_REFRESHED'  && session?.user)
        ) {
          console.log('✅ プロフィール取得開始');
          get().fetchProfile().catch(error => {
            console.error('❌ プロフィール取得エラー:', error);
          });
        }

        // メールアドレス変更完了の検出とStripe同期
        if (event === 'USER_UPDATED' && session?.user && previousUser) {
          const oldEmail = previousUser.email;
          const newEmail = session.user.email;
          
          if (oldEmail && newEmail && oldEmail !== newEmail) {
            console.log('Email change detected, syncing with Stripe...', { oldEmail, newEmail });
            
            // Stripe Customer emailを同期
            try {
              const response = await fetch('/.netlify/functions/updateCustomerEmail', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ email: newEmail }),
              });

              if (response.ok) {
                const result = await response.json();
                console.log('Stripe email sync successful:', result);
                
                // プロフィール情報を再取得してUIに反映
                await get().fetchProfile();
                
                // 成功状態をセット
                set(state => {
                  state.emailChangeStatus = {
                    type: 'success',
                    message: 'メールアドレスが正常に更新されました',
                    title: 'メールアドレス変更完了'
                  };
                });
              } else {
                console.error('Failed to sync email with Stripe:', await response.text());
                
                // 警告状態をセット
                set(state => {
                  state.emailChangeStatus = {
                    type: 'warning',
                    message: 'メールアドレスの更新は完了しましたが、請求情報の同期でエラーが発生しました',
                    title: 'メールアドレス変更'
                  };
                });
              }
            } catch (error) {
              console.error('Error syncing email with Stripe:', error);
              
              // ネットワークエラー等の警告状態をセット
              set(state => {
                state.emailChangeStatus = {
                  type: 'warning',
                  message: 'メールアドレスの更新は完了しましたが、請求情報の同期中にエラーが発生しました',
                  title: 'メールアドレス変更'
                };
              });
            }
          }
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
     * Magic Link でのログイン（修正前はマジックリンクもOTPも同じ処理）
     */
    loginWithMagicLink: async (email: string, mode: 'signup' | 'login' = 'login', useOtp: boolean = false) => {
      const supabase = getSupabaseClient();
      set(state => {
        state.loading = true;
        state.error = null;
      });

      try {
        if (useOtp) {
          // OTPモードの場合: 6桁のコードを送信
          console.log('🔐 OTP送信モード');
          
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: mode === 'signup',
            },
          });

          if (error) {
            // サインアップ無効エラーの特別処理
            if (error.message.includes('Signups not allowed') || error.message.includes('signups not allowed')) {
              console.warn('⚠️ サインアップが無効です。ログインモードで再試行します。');
              
              // ログインモードで再試行
              const { error: loginError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  shouldCreateUser: false,
                },
              });

              if (loginError) {
                logMagicLinkError(loginError, 'ログインモード再試行失敗');
                throw new Error(`ログインに失敗しました: ${loginError.message}`);
              }
            } else {
              logMagicLinkError(error, 'OTP送信失敗');
              throw error;
            }
          }

          console.log('✅ OTP送信成功');
        } else {
          // マジックリンクモードの場合: リダイレクトURLを含めて送信
          // リダイレクトURLの検証と設定
          const redirectUrl = getValidRedirectUrl();
          
          if (!redirectUrl) {
            throw new Error('リダイレクトURLの設定が不正です。環境変数 VITE_SUPABASE_REDIRECT_URL を確認してください。');
          }

          // 詳細ログ出力
          logMagicLinkLoginProcess(email, mode, redirectUrl);

          // コールバックページへのリダイレクトURLを設定
          const callbackUrl = new URL('/auth/callback', redirectUrl).toString();
          
          const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
            shouldCreateUser: mode === 'signup',
            emailRedirectTo: callbackUrl,
          };

          console.log('🔐 Magic Link 送信オプション:', options);

          // メールベースのMagic Link送信
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options,
          });

          if (error) {
            // サインアップ無効エラーの特別処理
            if (error.message.includes('Signups not allowed') || error.message.includes('signups not allowed')) {
              console.warn('⚠️ サインアップが無効です。ログインモードで再試行します。');
              
              // ログインモードで再試行
                              const { error: loginError } = await supabase.auth.signInWithOtp({
                  email,
                  options: {
                    shouldCreateUser: false,
                    emailRedirectTo: callbackUrl,
                  },
                });

              if (loginError) {
                logMagicLinkError(loginError, 'ログインモード再試行失敗');
                throw new Error(`ログインに失敗しました: ${loginError.message}`);
              }
            } else {
              logMagicLinkError(error, 'Magic Link送信失敗');
              throw error;
            }
          }

          console.log('✅ Magic Link 送信成功');
        }

        set(state => {
          state.loading = false;
          state.error = null;
        });

      } catch (error) {
        logMagicLinkError(error, useOtp ? 'OTP送信処理エラー' : 'Magic Link送信処理エラー');
        
        let errorMessage = useOtp ? 'OTP送信に失敗しました' : 'Magic Link送信に失敗しました';
        
        if (error instanceof Error) {
          if (error.message.includes('Signups not allowed')) {
            errorMessage = '現在サインアップが無効になっています。既存のアカウントでログインしてください。';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = '無効なメールアドレスです。';
          } else if (error.message.includes('rate limit')) {
            errorMessage = '送信回数制限に達しました。しばらく待ってから再試行してください。';
          } else {
            errorMessage = error.message;
          }
        }
        
        set(state => {
          state.loading = false;
          state.error = errorMessage;
        });
        
        throw new Error(errorMessage);
      }
    },

    /**
     * OTP検証
     */
    verifyOtp: async (email: string, token: string) => {
      const supabase = getSupabaseClient();
      set(state => {
        state.loading = true;
        state.error = null;
      });

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          set(state => {
            state.user = data.session!.user; // すでにチェック済みなので!を追加
            state.loading = false;
            state.error = null;
          });
          
          // プロファイルを取得
          await get().fetchProfile();
        }

      } catch (error) {
        console.error('OTP検証エラー:', error);
        let errorMessage = 'OTP検証に失敗しました';
        
        if (error instanceof Error) {
          if (error.message.includes('Token has expired')) {
            errorMessage = 'OTPコードの有効期限が切れています。再度送信してください。';
          } else if (error.message.includes('Invalid')) {
            errorMessage = '無効なOTPコードです。';
          } else {
            errorMessage = error.message;
          }
        }
        
        set(state => {
          state.loading = false;
          state.error = errorMessage;
        });
        
        throw new Error(errorMessage);
      }
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
      if (!user) {
        console.log('❌ fetchProfile: ユーザーが存在しません');
        return;
      }
      
      console.log('🔍 fetchProfile: プロフィール取得開始', { userId: user.id, userEmail: user.email });
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname, rank, level, xp, is_admin, avatar_url, bio, twitter_handle, next_season_xp_multiplier, selected_title, stripe_customer_id, will_cancel, cancel_date, downgrade_to, downgrade_date, email')
          .eq('id', user.id)
          .maybeSingle(); // singleの代わりにmaybeSingleを使用してNot Found エラーを防ぐ
        
        console.log('📊 fetchProfile: 取得結果', { data, error, hasData: !!data, hasError: !!error });
        
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
              email: data.email || user.email,
              avatar_url: data.avatar_url,
              bio: data.bio,
              twitter_handle: data.twitter_handle,
              selected_title: data.selected_title,
              next_season_xp_multiplier: data.next_season_xp_multiplier,
              stripe_customer_id: data.stripe_customer_id,
              will_cancel: data.will_cancel,
              cancel_date: data.cancel_date,
              downgrade_to: data.downgrade_to,
              downgrade_date: data.downgrade_date,
            };
          } else {
            state.profile = null;
          }
        });

        // プロフィール取得成功後、ユーザー統計も並行で取得
        if (data && !error) {
          console.log('✅ fetchProfile: プロフィール取得成功', { nickname: data.nickname, rank: data.rank });
          const { fetchStats } = useUserStatsStore.getState();
          fetchStats(user.id).catch(console.error); // エラーは無視（統計は重要ではない）
        } else if (error) {
          console.log('❌ fetchProfile: プロフィール取得エラー', { error });
        } else {
          console.log('⚠️ fetchProfile: プロフィールが見つかりません（新規ユーザー）');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        
        // ネットワークエラーや一時的なエラーの場合は hasProfile を変更しない
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
          console.log('🌐 fetchProfile: ネットワークエラー', { errorMessage });
          set(state => {
            state.error = '一時的なネットワークエラーです。しばらくしてから再試行してください。';
          });
          return;
        }
        
        // その他のエラーの場合のみ hasProfile を false にする
        console.log('💥 fetchProfile: 致命的エラー', { errorMessage });
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
        
      } catch (error) {
        console.error('Profile creation error:', error);
        set(state => { 
          state.loading = false;
          state.error = (error instanceof Error ? error.message : String(error)) || 'プロフィールの作成に失敗しました';
        });
      }
    },

    /**
     * メールアドレス更新 (Supabase Auth)
     */
    updateEmail: async (newEmail: string) => {
      const supabase = getSupabaseClient();
      const { user } = get();
      
      if (!user) {
        return { success: false, message: 'ログインが必要です' };
      }

      if (!newEmail || !newEmail.includes('@')) {
        return { success: false, message: '有効なメールアドレスを入力してください' };
      }

      if (user.email === newEmail) {
        return { success: false, message: '現在のメールアドレスと同じです' };
      }

      try {
        set(state => {
          state.loading = true;
          state.error = null;
        });

        const { error } = await supabase.auth.updateUser({
          email: newEmail
        });

        if (error) {
          throw error;
        }

        // 確認メール送信成功
        set(state => {
          state.loading = false;
        });

        return { 
          success: true, 
          message: `${newEmail} に確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。` 
        };

      } catch (error) {
        console.error('Email update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'メールアドレスの更新に失敗しました';
        set(state => {
          state.loading = false;
          state.error = errorMessage;
        });
        
        return { 
          success: false, 
          message: errorMessage
        };
      }
    },

    /**
     * メールアドレス変更ステータスをクリア
     */
    clearEmailChangeStatus: () => {
      set(state => {
        state.emailChangeStatus = null;
      });
    },
  }))
); 