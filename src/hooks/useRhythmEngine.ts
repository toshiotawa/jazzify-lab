import { useEffect, useRef, useState } from 'react'
import { RhythmGameEngine, RhythmQuestion, RhythmStageInfo } from '@/utils/rhythmGameEngine'

export interface RhythmGameState {
  defeated: number
  total: number
  activeQuestions: RhythmQuestion[]
}

export const useRhythmEngine = (
  stage: RhythmStageInfo | null,
  onComplete?: () => void,
  onEnemyAttack?: (monsterId: string) => void
) => {
  const engineRef = useRef<RhythmGameEngine | null>(null)

  const [state, setState] = useState<RhythmGameState>(() => ({
    defeated: 0,
    total: stage?.measureCount ?? 0,
    activeQuestions: []
  }))

  useEffect(() => {
    if (!stage) return

    const engine = new RhythmGameEngine({
      onSuccess: q => {
        setState(s => ({
          ...s,
          defeated: s.defeated + 1,
          activeQuestions: s.activeQuestions.filter(a => a.id !== q.id)
        }))
      },
      onFail: q => {
        setState(s => ({
          ...s,
          activeQuestions: s.activeQuestions.filter(a => a.id !== q.id)
        }))
        // Call enemy attack callback if provided
        if (onEnemyAttack) {
          onEnemyAttack(q.id);
        }
      },
      onComplete: () => {
        onComplete?.()
      }
    })
    engine.loadStage(stage)
    engine.start()
    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage?.id])

  const handleInput = (midiNotes: number[]) => {
    engineRef.current?.handleInput(midiNotes)
  }

  const [gauge, setGauge] = useState(0)

  // RAF でゲージ進捗を取得
  useEffect(() => {
    let frame: number
    const loop = () => {
      if (engineRef.current) {
        const progress = engineRef.current.getGaugeProgress(performance.now())
        setGauge(progress)
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return {
    gameState: state,
    gaugeProgress: gauge,
    handleInput
  }
}
