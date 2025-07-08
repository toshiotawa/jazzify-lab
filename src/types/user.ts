export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  memberRank: MemberRank
  isAdmin: boolean
  totalExp: number
  createdAt: string
  updatedAt: string
}

export enum MemberRank {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  PLATINUM = 'platinum',
}

export interface MemberRankInfo {
  label: string
  color: string
  xpMultiplier: number
  features: string[]
  minExp: number
  maxExp: number
}

export const MemberRankConfig: Record<MemberRank, MemberRankInfo> = {
  [MemberRank.FREE]: {
    label: 'Free',
    color: '#9CA3AF',
    xpMultiplier: 1,
    features: ['基本ゲーム', 'おためしプレイ'],
    minExp: 0,
    maxExp: 999,
  },
  [MemberRank.STANDARD]: {
    label: 'Standard',
    color: '#60A5FA',
    xpMultiplier: 1.5,
    features: ['基本ゲーム', 'レッスン機能', 'コミュニティ'],
    minExp: 1000,
    maxExp: 9999,
  },
  [MemberRank.PREMIUM]: {
    label: 'Premium',
    color: '#F59E0B',
    xpMultiplier: 2,
    features: ['全機能', 'レッスン解放', 'チャレンジ'],
    minExp: 10000,
    maxExp: 49999,
  },
  [MemberRank.PLATINUM]: {
    label: 'Platinum',
    color: '#E5E4E2',
    xpMultiplier: 2,
    features: ['全機能', 'レッスンスキップ', '管理者機能'],
    minExp: 50000,
    maxExp: Infinity,
  },
}

export interface UserPreferences {
＝
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
  notifications: {
    email: boolean
    push: boolean
    practice: boolean
    achievements: boolean
  }
  privacy: {
    showProfile: boolean
    showRank: boolean
    showProgress: boolean
  }
}