import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RhythmScore, RhythmDifficulty, TimeSignature } from '@/types/rhythm'

interface RhythmScoreStore {
  scores: RhythmScore[]
  highScores: Record<RhythmDifficulty, RhythmScore | null>
  totalGamesPlayed: number
  averageAccuracy: number
  addScore: (score: RhythmScore) => void
  getHighScore: (difficulty: RhythmDifficulty) => RhythmScore | null
  getScoresByDifficulty: (difficulty: RhythmDifficulty) => RhythmScore[]
  getRecentScores: (limit?: number) => RhythmScore[]
  clearScores: () => void
}

export const useRhythmScoreStore = create<RhythmScoreStore>()(
  persist(
    (set, get) => ({
      scores: [],
      highScores: {
        easy: null,
        normal: null,
        hard: null,
        expert: null
      },
      totalGamesPlayed: 0,
      averageAccuracy: 0,
      
      addScore: (score) => set((state) => {
        const newScores = [...state.scores, score]
        
        // 高スコアの更新
        const currentHighScore = state.highScores[score.difficulty]
        const isNewHighScore = !currentHighScore || score.score > currentHighScore.score
        
        const newHighScores = isNewHighScore
          ? { ...state.highScores, [score.difficulty]: score }
          : state.highScores
        
        // 統計の更新
        const totalGamesPlayed = newScores.length
        const averageAccuracy = newScores.reduce((sum, s) => sum + s.accuracy, 0) / totalGamesPlayed
        
        return {
          scores: newScores,
          highScores: newHighScores,
          totalGamesPlayed,
          averageAccuracy
        }
      }),
      
      getHighScore: (difficulty) => get().highScores[difficulty],
      
      getScoresByDifficulty: (difficulty) => 
        get().scores.filter(score => score.difficulty === difficulty),
      
      getRecentScores: (limit = 10) => {
        const scores = get().scores
        return scores
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
      },
      
      clearScores: () => set({
        scores: [],
        highScores: {
          easy: null,
          normal: null,
          hard: null,
          expert: null
        },
        totalGamesPlayed: 0,
        averageAccuracy: 0
      })
    }),
    {
      name: 'rhythm-score-store',
      partialize: (state) => ({
        scores: state.scores.slice(-100), // 最新100件のみ保存
        highScores: state.highScores,
        totalGamesPlayed: state.totalGamesPlayed,
        averageAccuracy: state.averageAccuracy
      })
    }
  )
)