export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  memberRank: MemberRank
  totalExp: number
  createdAt: string
  updatedAt: string
}

export enum MemberRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
}

export const MemberRankConfig = {
  [MemberRank.BRONZE]: {
    label: 'ブロンズ',
    color: '#CD7F32',
    minExp: 0,
    maxExp: 999,
  },
  [MemberRank.SILVER]: {
    label: 'シルバー',
    color: '#C0C0C0',
    minExp: 1000,
    maxExp: 2499,
  },
  [MemberRank.GOLD]: {
    label: 'ゴールド',
    color: '#FFD700',
    minExp: 2500,
    maxExp: 4999,
  },
  [MemberRank.PLATINUM]: {
    label: 'プラチナ',
    color: '#E5E4E2',
    minExp: 5000,
    maxExp: 9999,
  },
  [MemberRank.DIAMOND]: {
    label: 'ダイヤモンド',
    color: '#B9F2FF',
    minExp: 10000,
    maxExp: 19999,
  },
  [MemberRank.MASTER]: {
    label: 'マスター',
    color: '#FF6B6B',
    minExp: 20000,
    maxExp: Infinity,
  },
}

export interface UserPreferences {
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