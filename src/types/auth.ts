export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  memberRank: string
  isAdmin: boolean
  totalExp: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: User
}

export interface AuthContextType {
  state: AuthState
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<User>) => Promise<void>
  refreshSession: () => Promise<void>
}

export interface LoginFormData {
  email: string
}

export interface ProfileFormData {
  displayName: string
  avatarUrl?: string
}