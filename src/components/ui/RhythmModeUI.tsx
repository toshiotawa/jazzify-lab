'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/utils/cn'
import type { RhythmGameState, Beat, UserInput } from '@/types/rhythm'

interface RhythmModeUIProps {
  gameState: RhythmGameState
  onUserInput: (timestamp: number) => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
  isMuted: boolean
  onToggleMute: () => void
  showGuide: boolean
}

export function RhythmModeUI({
  gameState,
  onUserInput,
  onPause,
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  showGuide
}: RhythmModeUIProps) {
  const [hitEffects, setHitEffects] = useState<Array<{
    id: string
    x: number
    y: number
    timing: 'perfect' | 'great' | 'good' | 'miss'
  }>>([])

  // キーボード入力のハンドリング
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.isPlaying) {
        e.preventDefault()
        onUserInput(Date.now())
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.isPlaying, onUserInput])

  // ヒットエフェクトの追加
  const addHitEffect = (timing: 'perfect' | 'great' | 'good' | 'miss') => {
    const id = `${Date.now()}-${Math.random()}`
    const x = Math.random() * 40 - 20  // -20 to 20
    const y = Math.random() * 40 - 20  // -20 to 20
    
    setHitEffects(prev => [...prev, { id, x, y, timing }])
    
    // エフェクトを削除
    setTimeout(() => {
      setHitEffects(prev => prev.filter(effect => effect.id !== id))
    }, 1000)
  }

  // 最新の入力に基づいてエフェクトを表示
  useEffect(() => {
    const lastInput = gameState.userInputs[gameState.userInputs.length - 1]
    if (lastInput) {
      addHitEffect(lastInput.timing)
    }
  }, [gameState.userInputs.length])

  const timingColors = {
    perfect: 'text-yellow-500 dark:text-yellow-400',
    great: 'text-green-500 dark:text-green-400',
    good: 'text-blue-500 dark:text-blue-400',
    miss: 'text-red-500 dark:text-red-400'
  }

  const timingBgColors = {
    perfect: 'bg-yellow-500/20 dark:bg-yellow-400/20',
    great: 'bg-green-500/20 dark:bg-green-400/20',
    good: 'bg-blue-500/20 dark:bg-blue-400/20',
    miss: 'bg-red-500/20 dark:bg-red-400/20'
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">リズムモード</span>
          </div>
          
          {/* スコア表示 */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              スコア: {gameState.score.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              コンボ: {gameState.combo}
            </Badge>
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={gameState.isPlaying ? onPause : onResume}
          >
            {gameState.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestart}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* メインゲームエリア */}
      <div className="flex-1 relative overflow-hidden">
        {/* ビートトラック */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-2xl h-32">
            {/* ヒットゾーン */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className={cn(
                "w-24 h-24 rounded-full border-4",
                "border-primary/50 bg-primary/10",
                "flex items-center justify-center"
              )}>
                <Music className="h-8 w-8 text-primary" />
              </div>
              
              {/* ヒットエフェクト */}
              <AnimatePresence>
                {hitEffects.map(effect => (
                  <motion.div
                    key={effect.id}
                    initial={{ scale: 0.5, opacity: 1, x: 0, y: 0 }}
                    animate={{ 
                      scale: 2, 
                      opacity: 0,
                      x: effect.x,
                      y: effect.y
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className={cn(
                      "text-2xl font-bold",
                      timingColors[effect.timing]
                    )}>
                      {effect.timing === 'perfect' && 'PERFECT!'}
                      {effect.timing === 'great' && 'GREAT!'}
                      {effect.timing === 'good' && 'GOOD'}
                      {effect.timing === 'miss' && 'MISS'}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ビートインジケーター */}
            {gameState.pattern && gameState.pattern.beats.map((beat, index) => {
              const progress = (gameState.currentBeat - index) / gameState.pattern!.beats.length
              const isActive = index === gameState.currentBeat
              const isPassed = index < gameState.currentBeat
              
              return (
                <motion.div
                  key={`${beat.time}-${index}`}
                  initial={{ x: 600, opacity: 0 }}
                  animate={{ 
                    x: -600,
                    opacity: beat.isRest ? 0.3 : 1
                  }}
                  transition={{ 
                    duration: (60000 / gameState.pattern!.tempo) * 4,
                    ease: "linear"
                  }}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2",
                    "w-8 h-8 rounded-full",
                    beat.isRest ? "bg-muted" : "bg-primary",
                    beat.isAccent && "ring-4 ring-primary/30",
                    isActive && "scale-125"
                  )}
                  style={{
                    left: `${50 + progress * 100}%`
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* ガイド表示 */}
        {showGuide && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              スペースキーでリズムを刻もう！
            </Badge>
          </div>
        )}
      </div>

      {/* 統計情報 */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-muted-foreground">精度: </span>
              <span className="font-semibold">{gameState.accuracy.toFixed(1)}%</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">最大コンボ: </span>
              <span className="font-semibold">{gameState.maxCombo}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {['perfect', 'great', 'good', 'miss'].map(timing => {
              const count = gameState.userInputs.filter(
                input => input.timing === timing
              ).length
              
              return (
                <div
                  key={timing}
                  className={cn(
                    "px-2 py-1 rounded text-sm font-medium",
                    timingBgColors[timing as keyof typeof timingBgColors]
                  )}
                >
                  <span className={timingColors[timing as keyof typeof timingColors]}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}