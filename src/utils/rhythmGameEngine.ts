import { useTimeStore } from '@/stores/timeStore'
import { resolveChord } from '@/utils/chord-utils'
import { note as parseNote } from 'tonal'

/**
 * リズムモードで 1 つの判定対象となる問題
 */
export interface RhythmQuestion {
  /** ユニーク ID */
  id: string
  /** 小節番号 (1〜) */
  measure: number
  /** 拍位置。16 分精度など小数を許容 (例: 3.75) */
  beat: number
  /** コード ID (例: "C", "G7") */
  chord: string
  /** 判定開始絶対時刻 (ms) */
  windowStart: number
  /** 判定終了絶対時刻 (ms) */
  windowEnd: number
  /** 何列目のモンスターに対応しているか (UI 用)。A〜H */
  position: string
}

export interface RhythmStageInfo {
  id: string
  allowedChords: string[]
  bpm: number
  measureCount: number
  timeSignature: number
  countInMeasures: number
  chordProgressionData?: { measure: number; beat: number; chord: string }[] | null
  mode: 'random' | 'progression'
  simultaneousMonsterCount: number
}

export interface RhythmGameCallbacks {
  /** 正解した時 */
  onSuccess: (question: RhythmQuestion) => void
  /** 失敗した時 */
  onFail: (question: RhythmQuestion) => void
  /** 全敵撃破などゲーム完了 */
  onComplete: () => void
  /** 新しい問題が有効になった時 */
  onQuestionActivated: (question: RhythmQuestion) => void
}

/** ±200ms の判定幅 */
const WINDOW_MS = 200

/**
 * リズムモード専用ゲームエンジン
 * 既存 FantasyGameEngine から独立し、内部で zustand timeStore を使用する。
 */
export class RhythmGameEngine {
  private stage!: RhythmStageInfo
  private questions: RhythmQuestion[] = []
  private activeQuestions = new Set<string>()
  private disposed = false

  constructor(private callbacks: RhythmGameCallbacks) {}

  /** ステージをロードし question 配列を準備 */
  loadStage(stage: RhythmStageInfo): void {
    this.stage = stage
    this.questions = []

    if (stage.mode === 'progression' && stage.chordProgressionData && stage.chordProgressionData.length) {
      // progression モード: JSON データをそのまま使用
      this.questions = stage.chordProgressionData.map((d, i) => {
        const { msStart, msEnd } = this.toWindow(d.measure, d.beat)
        return {
          id: `q${i}`,
          measure: d.measure,
          beat: d.beat,
          chord: d.chord,
          windowStart: msStart,
          windowEnd: msEnd,
          position: this.pickPositionByIndex(i)
        }
      })
    } else {
      // ランダムモード: 1 小節に 1 つ allowedChords からランダムに生成
      for (let m = 1; m <= stage.measureCount; m += 1) {
        const chordIdx = Math.floor(Math.random() * stage.allowedChords.length)
        const chordId = stage.allowedChords[chordIdx]
        const { msStart, msEnd } = this.toWindow(m, 1)
        this.questions.push({
          id: `q${m}`,
          measure: m,
          beat: 1,
          chord: chordId,
          windowStart: msStart,
          windowEnd: msEnd,
          position: 'D' // ランダムでは常に中央 1 体
        })
      }
    }
  }

  /** BGM 再生と timeStore を開始 */
  start(now: number = performance.now()): void {
    const ts = this.stage.timeSignature
    const store = useTimeStore.getState()
    store.setStart(this.stage.bpm, ts, this.stage.measureCount, this.stage.countInMeasures, now)
    this.disposed = false
    this.tick() // ループ開始
  }

  /** ゲームループ */
  private tick = (): void => {
    if (this.disposed) return
    // timeStore 更新
    useTimeStore.getState().tick()

    const nowMs = performance.now()

    // ウィンドウ突入チェック
    this.questions.forEach(q => {
      if (nowMs >= q.windowStart && nowMs <= q.windowEnd) {
        if (!this.activeQuestions.has(q.id)) {
          this.activeQuestions.add(q.id)
          this.callbacks.onQuestionActivated(q)
        }
      } else if (nowMs > q.windowEnd && this.activeQuestions.has(q.id)) {
        // 失敗
        this.activeQuestions.delete(q.id)
        this.callbacks.onFail(q)
      }
    })

    requestAnimationFrame(this.tick)
  }

  /** キーボード / MIDI 入力 */
  handleInput(midiNotes: number[]): void {
    const matches: RhythmQuestion[] = []
    this.activeQuestions.forEach(id => {
      const q = this.questions.find(qq => qq.id === id)
      if (!q) return
      const def = resolveChord(q.chord, 4)
      if (!def) return
      // note 名を MIDI 番号へ変換
      const targetMidi = def.notes.map(noteName => {
        const parsed = parseNote(noteName + '4')
        return typeof parsed?.midi === 'number' ? parsed.midi : 60
      })
      const targetMod = new Set(targetMidi.map(n => n % 12))
      const inputMod = new Set(midiNotes.map(n => n % 12))
      const ok = [...targetMod].every(n => inputMod.has(n))
      if (ok) matches.push(q)
    })

    if (matches.length) {
      matches.forEach(q => {
        this.activeQuestions.delete(q.id)
        this.callbacks.onSuccess(q)
      })
    }
  }

  /** 破棄 */
  dispose(): void {
    this.disposed = true
    this.activeQuestions.clear()
    this.questions = []
  }

  /** measure & beat -> 判定ウィンドウの開始/終了時刻(ms) を算出 */
  private toWindow(measure: number, beat: number): { msStart: number; msEnd: number } {
    const bpm = this.stage.bpm
    const ts = this.stage.timeSignature
    const msecPerBeat = 60000 / bpm
    const beatsFromCountIn = this.stage.countInMeasures * ts

    const totalBeats = (measure - 1) * ts + (beat - 1) - beatsFromCountIn
    const baseMs = useTimeStore.getState().startAt ?? performance.now()
    const ms = baseMs + totalBeats * msecPerBeat
    return {
      msStart: ms - WINDOW_MS,
      msEnd: ms + WINDOW_MS
    }
  }

  /** progression 用: index -> 列位置 */
  /** 現在時刻からゲージ進捗を計算 (0-1) */
  public getGaugeProgress(nowMs: number): number {
    const PRE_WINDOW_MS = 1000 // 判定 1 秒前を 0% とする
    for (const q of this.questions) {
      const preStart = q.windowStart - PRE_WINDOW_MS
      if (nowMs >= preStart && nowMs <= q.windowEnd) {
        const total = q.windowEnd - preStart
        return Math.min(1, Math.max(0, (nowMs - preStart) / total))
      }
    }
    return 0
  }

  /** 現在アクティブな問題を取得 */
  public getActiveQuestions(): RhythmQuestion[] {
    return this.questions.filter(q => this.activeQuestions.has(q.id))
  }

  private pickPositionByIndex(i: number): string {
    const cols3 = ['A', 'B', 'C']
    const cols4 = ['A', 'B', 'C', 'D']
    return this.stage.timeSignature === 3 ? cols3[i % 3] : cols4[i % 4]
  }
}
