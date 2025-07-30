export type RhythmDifficulty = 'easy' | 'normal' | 'hard' | 'expert'
export type TimeSignature = '4/4' | '3/4' | '6/8'
export type NoteType = 'quarter' | 'eighth' | 'sixteenth' | 'half' | 'whole' | 'triplet'

export interface RhythmPattern {
  id: string
  beats: Beat[]
  timeSignature: TimeSignature
  tempo: number
  difficulty: RhythmDifficulty
}

export interface Beat {
  time: number          // タイミング（ミリ秒）
  duration: number      // 音符の長さ（ミリ秒）
  noteType: NoteType   // 音符の種類
  isRest: boolean      // 休符かどうか
  isAccent?: boolean   // アクセントかどうか
}

export interface RhythmGameState {
  isPlaying: boolean
  currentBeat: number
  score: number
  combo: number
  maxCombo: number
  hits: number
  misses: number
  accuracy: number
  pattern: RhythmPattern | null
  userInputs: UserInput[]
}

export interface UserInput {
  timestamp: number
  accurate: boolean
  timing: 'perfect' | 'great' | 'good' | 'miss'
  beatIndex: number
}

export interface RhythmScore {
  score: number
  accuracy: number
  maxCombo: number
  perfectCount: number
  greatCount: number
  goodCount: number
  missCount: number
  difficulty: RhythmDifficulty
  timeSignature: TimeSignature
  tempo: number
  timestamp: number
}

export interface RhythmModeSettings {
  difficulty: RhythmDifficulty
  timeSignature: TimeSignature
  tempo: number
  volume: number
  visualEffects: boolean
  showGuide: boolean
  autoPlay: boolean
}

export interface RhythmGameConfig {
  timingWindows: {
    perfect: number  // ±30ms
    great: number    // ±60ms
    good: number     // ±100ms
  }
  scoreMultipliers: {
    perfect: number
    great: number
    good: number
  }
  comboBonus: {
    threshold: number
    multiplier: number
  }
}

export interface RhythmVisualConfig {
  colors: {
    perfect: string
    great: string
    good: string
    miss: string
    guide: string
    beat: string
  }
  animations: {
    hitDuration: number
    fadeDuration: number
    scaleFactor: number
  }
}