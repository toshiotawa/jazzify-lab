import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RhythmGameEngine, RhythmStageInfo } from '@/utils/rhythmGameEngine'

// モック: requestAnimationFrame / cancelAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 0) as unknown as number
})
vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))

describe('RhythmGameEngine', () => {
  let stage: RhythmStageInfo

  beforeEach(() => {
    stage = {
      id: 'stage1',
      allowedChords: ['C'],
      bpm: 120,
      measureCount: 2,
      timeSignature: 4,
      countInMeasures: 0,
      chordProgressionData: null,
      mode: 'random',
      simultaneousMonsterCount: 1
    }
  })

  it('generates one question per measure in random mode', () => {
    const engine = new RhythmGameEngine({
      onSuccess: vi.fn(),
      onFail: vi.fn(),
      onComplete: vi.fn()
    })

    engine.loadStage(stage)
    expect((engine as any).questions).toHaveLength(stage.measureCount)
  })

  it('calls onSuccess when correct chord is played within window', () => {
    const onSuccess = vi.fn()
    const engine = new RhythmGameEngine({
      onSuccess,
      onFail: vi.fn(),
      onComplete: vi.fn()
    })

    engine.loadStage(stage)
    engine.start(0) // startAt = 0ms

    // active window 対象の質問を取得し activeQuestions に追加
    const q = (engine as any).questions[0]
    ;(engine as any).activeQuestions.add(q.id)

    // C コード (C4,E4,G4)
    engine.handleInput([60, 64, 67])

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('computes gauge progress', () => {
    const engine = new RhythmGameEngine({
      onSuccess: vi.fn(),
      onFail: vi.fn(),
      onComplete: vi.fn()
    })
    engine.loadStage(stage)
    engine.start(0)

    const q = (engine as any).questions[0]
    const preStart = q.windowStart - 1000
    const mid = (preStart + q.windowEnd) / 2

    expect(engine.getGaugeProgress(preStart)).toBeCloseTo(0, 1)
    expect(engine.getGaugeProgress(mid)).toBeGreaterThan(0.4)
    expect(engine.getGaugeProgress(q.windowEnd)).toBeCloseTo(1, 1)
  })
})
