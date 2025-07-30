import type { RhythmPattern, Beat, RhythmDifficulty, TimeSignature, NoteType } from '@/types/rhythm'
import { getTimeSignatureDefaults, calculateNoteDuration, getAccentStrength } from '../rhythmMode/timeSignatureDefaults'

// 難易度ごとのパターン設定
const difficultyPatterns: Record<RhythmDifficulty, {
  noteTypes: NoteType[]
  restProbability: number
  patternComplexity: number
  measureCount: number
}> = {
  easy: {
    noteTypes: ['quarter', 'half'],
    restProbability: 0.2,
    patternComplexity: 1,
    measureCount: 2
  },
  normal: {
    noteTypes: ['quarter', 'eighth', 'half'],
    restProbability: 0.15,
    patternComplexity: 2,
    measureCount: 2
  },
  hard: {
    noteTypes: ['quarter', 'eighth', 'sixteenth'],
    restProbability: 0.1,
    patternComplexity: 3,
    measureCount: 4
  },
  expert: {
    noteTypes: ['eighth', 'sixteenth', 'triplet'],
    restProbability: 0.05,
    patternComplexity: 4,
    measureCount: 4
  }
}

// リズムパターンを生成
export function generateRhythmPattern(
  difficulty: RhythmDifficulty,
  timeSignature: TimeSignature,
  tempo: number
): RhythmPattern {
  const config = difficultyPatterns[difficulty]
  const defaults = getTimeSignatureDefaults(timeSignature)
  const beats: Beat[] = []
  let currentTime = 0

  // 各小節のビートを生成
  for (let measure = 0; measure < config.measureCount; measure++) {
    for (let beat = 0; beat < defaults.beatsPerMeasure; beat++) {
      // 休符にするかどうか
      const isRest = Math.random() < config.restProbability
      
      // 音符の種類をランダムに選択
      const noteType = config.noteTypes[
        Math.floor(Math.random() * config.noteTypes.length)
      ]
      
      // 音符の長さを計算
      const duration = calculateNoteDuration(noteType, tempo, defaults.beatUnit)
      
      // アクセントを設定
      const beatIndex = measure * defaults.beatsPerMeasure + beat
      const accentStrength = getAccentStrength(timeSignature, beatIndex)
      const isAccent = accentStrength > 0.7

      beats.push({
        time: currentTime,
        duration,
        noteType,
        isRest,
        isAccent
      })

      currentTime += duration
    }
  }

  return {
    id: `${difficulty}-${timeSignature}-${tempo}-${Date.now()}`,
    beats,
    timeSignature,
    tempo,
    difficulty
  }
}

// メトロノーム音を再生
export function playMetronomeClick(
  audioContext: AudioContext,
  type: 'high' | 'low' = 'low',
  volume: number = 1
) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // 音の高さを設定
  oscillator.frequency.value = type === 'high' ? 1000 : 800
  
  // 音量を設定
  gainNode.gain.value = volume * 0.3
  
  // エンベロープ
  const currentTime = audioContext.currentTime
  gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1)
  
  // 再生
  oscillator.start(currentTime)
  oscillator.stop(currentTime + 0.1)
}

// ビープ音を再生（ゲーム効果音用）
export function playBeep(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  volume: number = 1
) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = frequency
  gainNode.gain.value = volume * 0.2
  
  const currentTime = audioContext.currentTime
  gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration)
  
  oscillator.start(currentTime)
  oscillator.stop(currentTime + duration)
}

// タイミング判定音を再生
export function playTimingSound(
  audioContext: AudioContext,
  timing: 'perfect' | 'great' | 'good' | 'miss',
  volume: number = 1
) {
  const frequencies = {
    perfect: 1200,
    great: 1000,
    good: 800,
    miss: 400
  }
  
  const durations = {
    perfect: 0.15,
    great: 0.12,
    good: 0.1,
    miss: 0.08
  }
  
  playBeep(audioContext, frequencies[timing], durations[timing], volume)
}