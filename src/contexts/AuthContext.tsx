import React, { createContext, useEffect, useReducer, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AuthState, AuthContextType, User } from '../types/auth'
import { UserProfile, MemberRank, getRankByExp } from '../types/user'

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
}

type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User | null; session: any } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_SIGNOUT' }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        loading: false,
        error: null,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      }
    case 'AUTH_SIGNOUT':
      return {
        ...state,
        user: null,
        session: null,
        loading: false,
        error: null,
      }
    default:
      return state
  }
}

const transformSupabaseUser = (supabaseUser: any, profile?: UserProfile): User | null => {
  if (!supabaseUser) return null
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    displayName: profile?.displayName || null,
    avatarUrl: profile?.avatarUrl || null,
    memberRank: profile?.memberRank || MemberRank.FREE,
    isAdmin: profile?.isAdmin || false,
    totalExp: profile?.totalExp || 0,
    createdAt: supabaseUser.created_at,
    updatedAt: profile?.updatedAt || new Date().toISOString(),
  }
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const signIn = useCallback(async (email: string) => {
    try {
      dispatch({ type: 'AUTH_LOADING' })
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'ログインに失敗しました' })
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'AUTH_LOADING' })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      dispatch({ type: 'AUTH_SIGNOUT' })
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'ログアウトに失敗しました' })
    }
  }, [])

  const updateProfile = useCallback(async (profile: Partial<User>) => {
    try {
      dispatch({ type: 'AUTH_LOADING' })
      
      if (!state.user) {
        throw new Error('ユーザーがログインしていません')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id)

      if (error) {
        throw error
      }

      // Re-fetch user data
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session) {
        // Fetch updated profile
        const { data: updatedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        const user = transformSupabaseUser(session.user, updatedProfile)
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } })
      } else {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: null, session: null } })
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'プロフィールの更新に失敗しました' })
    }
  }, [state.user])

  const addExp = useCallback(async (amount: number) => {
    try {
      if (!state.user) throw new Error('ユーザーがログインしていません')
      const newExp = state.user.totalExp + amount
      const newRank = getRankByExp(newExp)
      const { error } = await supabase
        .from('profiles')
        .update({
          total_exp: newExp,
          member_rank: newRank,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id)

      if (error) throw error

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: { ...state.user, totalExp: newExp, memberRank: newRank },
          session: state.session,
        },
      })
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : '経験値の更新に失敗しました' })
    }
  }, [state.user, state.session])



  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_LOADING' })
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (session && isMounted) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError
          }

          const user = transformSupabaseUser(session.user, profile)
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } })
        } else if (isMounted) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user: null, session: null } })
        }
      } catch (error) {
        if (isMounted) {
          dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'セッションの更新に失敗しました' })
        }
      }
    }

    // Initial session check
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'AUTH_SIGNOUT' })
        } else if (session) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            dispatch({ type: 'AUTH_ERROR', payload: profileError.message })
            return
          }

          const user = transformSupabaseUser(session.user, profile)
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } })
        } else {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user: null, session: null } })
        }
      }
    )

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    }
  }, []) // 空の依存配列で無限ループを防ぐ

  const value: AuthContextType = {
    state,
    signIn,
    signOut,
    updateProfile,
    addExp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}