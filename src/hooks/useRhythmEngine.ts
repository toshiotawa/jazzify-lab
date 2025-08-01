import { useEffect, useRef, useState } from 'react'
import { RhythmGameEngine, RhythmQuestion, RhythmStageInfo } from '@/utils/rhythmGameEngine'
import { useTimeStore } from '@/stores/timeStore'

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
  const [isStarted, setIsStarted] = useState(false)

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
    // ★ 自動開始を削除 - engine.start() を呼ばない
    engineRef.current = engine

    return () => {
      engine.dispose()
      engineRef.current = null
      setIsStarted(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage?.id])

  // ★ 明示的な開始関数を追加
  const startGame = () => {
    if (engineRef.current && !isStarted && stage) {
      console.log('🎵 Starting rhythm game with stage:', stage);
      
      // ★ リズムモードでもTimeStoreを開始
      useTimeStore
        .getState()
        .setStart(
          stage.bpm || 120,
          stage.timeSignature || 4,
          stage.measureCount || 8,
          stage.countInMeasures || 0
        );
      
      engineRef.current.start()
      setIsStarted(true)
      
      // 開始直後のアクティブな質問を確認
      setTimeout(() => {
        const activeQuestions = engineRef.current?.getActiveQuestions();
        console.log('🎵 Active questions after start:', activeQuestions);
      }, 100);
    }
  }

  const handleInput = (midiNotes: number[]) => {
    engineRef.current?.handleInput(midiNotes)
  }

  const [gauge, setGauge] = useState(0)

  // RAF でゲージ進捗を取得
  useEffect(() => {
    let frame: number
    const loop = () => {
      if (engineRef.current) {
        const now = performance.now()
        const progress = engineRef.current.getGaugeProgress(now)
        setGauge(progress)
        
        // ★ 表示用の質問を取得（ゲージが表示されているもの）
        const visibleQuestions = engineRef.current.getVisibleQuestions(now)
        setState(prevState => {
          // activeQuestionsには表示用の質問を設定
          return {
            ...prevState,
            activeQuestions: visibleQuestions
          };
        })
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return {
    gameState: state,
    gaugeProgress: gauge,
    handleInput,
    startGame,  // ★ 開始関数を公開
    isStarted   // ★ 開始状態を公開
  }
}
