'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RhythmGameState, RhythmPattern, UserInput, RhythmModeSettings, Beat } from '@/types/rhythm'
import { generateRhythmPattern } from '@/utils/audio/rhythmUtils'
import { playMetronomeClick } from '@/utils/audio/rhythmUtils'

const initialGameState: RhythmGameState = {
  isPlaying: false,
  currentBeat: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  hits: 0,
  misses: 0,
  accuracy: 100,
  pattern: null,
  userInputs: []
}

// タイミング判定の設定
const TIMING_WINDOWS = {
  perfect: 30,  // ±30ms
  great: 60,    // ±60ms
  good: 100     // ±100ms
}

const SCORE_MULTIPLIERS = {
  perfect: 100,
  great: 75,
  good: 50
}

export function useRhythmGameLogic(settings: RhythmModeSettings) {
  const [gameState, setGameState] = useState<RhythmGameState>(initialGameState)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const lastBeatRef = useRef<number>(-1)
  const audioContextRef = useRef<AudioContext>()

  // AudioContextの初期化
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // タイミング判定
  const judgeTiming = useCallback((userTime: number, targetTime: number): 'perfect' | 'great' | 'good' | 'miss' => {
    const difference = Math.abs(userTime - targetTime)
    
    if (difference <= TIMING_WINDOWS.perfect) return 'perfect'
    if (difference <= TIMING_WINDOWS.great) return 'great'
    if (difference <= TIMING_WINDOWS.good) return 'good'
    return 'miss'
  }, [])

  // スコア計算
  const calculateScore = useCallback((timing: 'perfect' | 'great' | 'good' | 'miss', combo: number): number => {
    if (timing === 'miss') return 0
    
    const baseScore = SCORE_MULTIPLIERS[timing]
    const comboBonus = combo > 10 ? Math.floor(combo / 10) * 10 : 0
    
    return baseScore + comboBonus
  }, [])

  // ユーザー入力の処理
  const handleUserInput = useCallback((timestamp: number) => {
    if (!gameState.isPlaying || !gameState.pattern) return

    const gameTime = timestamp - startTimeRef.current
    const currentBeat = gameState.pattern.beats[gameState.currentBeat]
    
    if (!currentBeat || currentBeat.isRest) return

    // タイミング判定
    const timing = judgeTiming(gameTime, currentBeat.time)
    const isHit = timing !== 'miss'
    
    // 新しいコンボとスコアの計算
    const newCombo = isHit ? gameState.combo + 1 : 0
    const scoreGain = calculateScore(timing, newCombo)
    
    // ユーザー入力を記録
    const userInput: UserInput = {
      timestamp: gameTime,
      accurate: isHit,
      timing,
      beatIndex: gameState.currentBeat
    }

    // 状態更新
    setGameState(prev => ({
      ...prev,
      score: prev.score + scoreGain,
      combo: newCombo,
      maxCombo: Math.max(prev.maxCombo, newCombo),
      hits: isHit ? prev.hits + 1 : prev.hits,
      misses: !isHit ? prev.misses + 1 : prev.misses,
      accuracy: prev.userInputs.length > 0 
        ? ((prev.hits + (isHit ? 1 : 0)) / (prev.userInputs.length + 1)) * 100
        : isHit ? 100 : 0,
      userInputs: [...prev.userInputs, userInput]
    }))

    // 音を鳴らす
    if (audioContextRef.current && settings.volume > 0) {
      playMetronomeClick(audioContextRef.current, isHit ? 'high' : 'low', settings.volume)
    }
  }, [gameState, settings.volume, judgeTiming, calculateScore])

  // ゲームループ
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || !gameState.pattern) return

    const currentTime = Date.now() - startTimeRef.current
    const currentBeatIndex = gameState.pattern.beats.findIndex(
      beat => beat.time > currentTime
    )

    // ビートが変わった場合
    if (currentBeatIndex !== lastBeatRef.current && currentBeatIndex > 0) {
      const beatIndex = currentBeatIndex - 1
      const beat = gameState.pattern.beats[beatIndex]
      
      if (!beat.isRest && audioContextRef.current && settings.volume > 0) {
        playMetronomeClick(
          audioContextRef.current,
          beat.isAccent ? 'high' : 'low',
          settings.volume
        )
      }
      
      lastBeatRef.current = currentBeatIndex
      
      setGameState(prev => ({
        ...prev,
        currentBeat: beatIndex
      }))
    }

    // ゲーム終了判定
    if (currentBeatIndex === -1 || currentBeatIndex >= gameState.pattern.beats.length) {
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        currentBeat: gameState.pattern!.beats.length
      }))
      return
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, settings.volume])

  // ゲーム開始
  const startGame = useCallback(() => {
    // リズムパターンを生成
    const pattern = generateRhythmPattern(
      settings.difficulty,
      settings.timeSignature,
      settings.tempo
    )

    startTimeRef.current = Date.now()
    lastBeatRef.current = -1
    
    setGameState({
      ...initialGameState,
      isPlaying: true,
      pattern
    })
  }, [settings])

  // ゲーム停止
  const stopGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false
    }))
  }, [])

  // ゲーム一時停止
  const pauseGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false
    }))
  }, [])

  // ゲーム再開
  const resumeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true
    }))
  }, [])

  // ゲームリスタート
  const restartGame = useCallback(() => {
    stopGame()
    startGame()
  }, [stopGame, startGame])

  // ゲームループの開始/停止
  useEffect(() => {
    if (gameState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState.isPlaying, gameLoop])

  return {
    gameState,
    handleUserInput,
    startGame,
    stopGame,
    pauseGame,
    resumeGame,
    restartGame
  }
}