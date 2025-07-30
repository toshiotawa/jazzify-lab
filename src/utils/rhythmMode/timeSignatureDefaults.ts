import type { TimeSignature, RhythmPattern, Beat, NoteType } from '@/types/rhythm'

// 拍子ごとのデフォルト設定
export const timeSignatureDefaults: Record<TimeSignature, {
  beatsPerMeasure: number
  beatUnit: number
  defaultTempo: number
  accentPattern: number[]
  description: string
}> = {
  '4/4': {
    beatsPerMeasure: 4,
    beatUnit: 4,
    defaultTempo: 120,
    accentPattern: [1, 0.5, 0.75, 0.5],  // 強拍、弱拍のパターン
    description: '最も一般的な拍子'
  },
  '3/4': {
    beatsPerMeasure: 3,
    beatUnit: 4,
    defaultTempo: 100,
    accentPattern: [1, 0.5, 0.5],
    description: 'ワルツなどで使用'
  },
  '6/8': {
    beatsPerMeasure: 6,
    beatUnit: 8,
    defaultTempo: 140,
    accentPattern: [1, 0.3, 0.3, 0.75, 0.3, 0.3],
    description: '複合拍子、流れるようなリズム'
  }
}

// 音符の長さを計算（ミリ秒）
export function calculateNoteDuration(
  noteType: NoteType,
  tempo: number,
  beatUnit: number = 4
): number {
  const beatDuration = 60000 / tempo  // 1拍の長さ（ミリ秒）
  
  const noteDurations: Record<NoteType, number> = {
    whole: beatDuration * 4,
    half: beatDuration * 2,
    quarter: beatDuration,
    eighth: beatDuration / 2,
    sixteenth: beatDuration / 4,
    triplet: beatDuration / 3
  }
  
  // 拍の単位が8分音符の場合の調整
  if (beatUnit === 8) {
    return noteDurations[noteType] / 2
  }
  
  return noteDurations[noteType]
}

// 拍子情報を取得
export function getTimeSignatureDefaults(timeSignature: TimeSignature) {
  return timeSignatureDefaults[timeSignature]
}

// 1小節の長さを計算（ミリ秒）
export function calculateMeasureDuration(
  timeSignature: TimeSignature,
  tempo: number
): number {
  const defaults = timeSignatureDefaults[timeSignature]
  const beatDuration = 60000 / tempo
  
  if (defaults.beatUnit === 8) {
    // 6/8拍子の場合、8分音符が基準
    return beatDuration * defaults.beatsPerMeasure / 2
  }
  
  return beatDuration * defaults.beatsPerMeasure
}

// ビートの位置を計算
export function calculateBeatPositions(
  timeSignature: TimeSignature,
  tempo: number,
  measureCount: number = 1
): number[] {
  const defaults = timeSignatureDefaults[timeSignature]
  const beatDuration = 60000 / tempo
  const positions: number[] = []
  
  for (let measure = 0; measure < measureCount; measure++) {
    for (let beat = 0; beat < defaults.beatsPerMeasure; beat++) {
      if (defaults.beatUnit === 8) {
        positions.push(measure * defaults.beatsPerMeasure * beatDuration / 2 + beat * beatDuration / 2)
      } else {
        positions.push(measure * defaults.beatsPerMeasure * beatDuration + beat * beatDuration)
      }
    }
  }
  
  return positions
}

// アクセントの強さを取得
export function getAccentStrength(
  timeSignature: TimeSignature,
  beatIndex: number
): number {
  const defaults = timeSignatureDefaults[timeSignature]
  const beatInMeasure = beatIndex % defaults.beatsPerMeasure
  return defaults.accentPattern[beatInMeasure] || 0.5
}