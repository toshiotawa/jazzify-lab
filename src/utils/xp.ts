import { MemberRankConfig, MemberRank } from '@/types/user'
import { ScoreRank } from '@/types'

export const RankBaseExp: Record<ScoreRank, number> = {
  S: 1000,
  A: 800,
  B: 600,
  C: 400,
  D: 200,
}

export interface ExpBreakdown {
  base: number
  speedMultiplier: number
  transposeBonus: number
  rankMultiplier: number
  total: number
}

export function calculateExp(rank: ScoreRank, speed: number, transposed: boolean, memberRank: MemberRank): ExpBreakdown {
  const base = RankBaseExp[rank]
  const speedMultiplier = Math.min(speed, 1)
  const transposeBonus = transposed ? 1.3 : 1
  const rankMultiplier = MemberRankConfig[memberRank].xpMultiplier
  const total = Math.round(base * speedMultiplier * transposeBonus * rankMultiplier)
  return { base, speedMultiplier, transposeBonus, rankMultiplier, total }
}

export interface LevelInfo {
  level: number
  currentExp: number
  nextExp: number
}

export function getLevelInfo(exp: number): LevelInfo {
  if (exp < 0) exp = 0
  if (exp < 20000) {
    const level = Math.floor(exp / 2000) + 1
    const currentExp = (level - 1) * 2000
    const nextExp = level < 10 ? level * 2000 : 20000
    return { level, currentExp, nextExp }
  }
  if (exp < 220000) {
    const level = 10 + Math.floor((exp - 20000) / 5000) + 1
    const currentExp = 20000 + (level - 11) * 5000
    const nextExp = level < 50 ? 20000 + (level - 10) * 5000 : 220000
    return { level, currentExp, nextExp }
  }
  const level = 50 + Math.floor((exp - 220000) / 20000) + 1
  const currentExp = 220000 + (level - 51) * 20000
  const nextExp = 220000 + (level - 50) * 20000
  return { level, currentExp, nextExp }
}
