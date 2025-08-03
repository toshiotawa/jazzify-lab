export interface RawProgressionEvent {
  bar: number      // 1-based
  beat: number     // 0.5 単位
  chord: string
}

export interface CompiledProgressionEvent {
  chord: string
  appearAtBeat: number  // 絶対拍 (count-in 後 0-start)
  acceptFrom: number   // appearAtBeat - 0.5
  acceptUntil: number  // 次イベントの acceptFrom
}