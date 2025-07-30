'use client'

import { useEffect } from 'react'
import { RhythmModeUI } from './RhythmModeUI'
import { useRhythmGameLogic } from '@/hooks/useRhythmGameLogic'
import { useRhythmMode } from '@/hooks/useRhythmMode'
import { Card } from '@/components/ui/Card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Music, Trophy, Target, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RhythmScore } from '@/types/rhythm'

interface RhythmGameProps {
  onComplete: (score: RhythmScore) => void
  onBack: () => void
}

export function RhythmGame({ onComplete, onBack }: RhythmGameProps) {
  const { settings, updateSettings } = useRhythmMode()
  const {
    gameState,
    handleUserInput,
    pauseGame,
    resumeGame,
    restartGame,
    startGame,
    stopGame
  } = useRhythmGameLogic(settings)

  // ゲーム開始
  useEffect(() => {
    startGame()
    return () => {
      stopGame()
    }
  }, [])

  // ゲーム終了時の処理
  useEffect(() => {
    if (gameState.pattern && gameState.currentBeat >= gameState.pattern.beats.length) {
      const score: RhythmScore = {
        score: gameState.score,
        accuracy: gameState.accuracy,
        maxCombo: gameState.maxCombo,
        perfectCount: gameState.userInputs.filter(i => i.timing === 'perfect').length,
        greatCount: gameState.userInputs.filter(i => i.timing === 'great').length,
        goodCount: gameState.userInputs.filter(i => i.timing === 'good').length,
        missCount: gameState.userInputs.filter(i => i.timing === 'miss').length,
        difficulty: settings.difficulty,
        timeSignature: settings.timeSignature,
        tempo: settings.tempo,
        timestamp: Date.now()
      }
      onComplete(score)
    }
  }, [gameState.currentBeat, gameState.pattern])

  const handleToggleMute = () => {
    updateSettings({ volume: settings.volume === 0 ? 1 : 0 })
  }

  // ゲーム開始前のカウントダウン
  if (!gameState.isPlaying && gameState.currentBeat === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <Music className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-2xl font-bold">リズムゲーム</h2>
            <p className="text-muted-foreground">
              音楽に合わせてスペースキーを押してリズムを刻もう！
            </p>
            
            <div className="space-y-2 py-4">
              <div className="flex items-center gap-3 text-left">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">目標</p>
                  <p className="text-sm text-muted-foreground">
                    タイミングよくキーを押して高得点を目指そう
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">スコア</p>
                  <p className="text-sm text-muted-foreground">
                    Perfect > Great > Good でスコアが変わる
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">コンボ</p>
                  <p className="text-sm text-muted-foreground">
                    連続成功でコンボボーナス獲得
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={onBack} variant="outline">
                戻る
              </Button>
              <Button onClick={startGame}>
                ゲームスタート
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full">
      <RhythmModeUI
        gameState={gameState}
        onUserInput={handleUserInput}
        onPause={pauseGame}
        onResume={resumeGame}
        onRestart={restartGame}
        isMuted={settings.volume === 0}
        onToggleMute={handleToggleMute}
        showGuide={settings.showGuide}
      />
    </div>
  )
}