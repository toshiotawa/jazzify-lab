import React, { useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import GameScreen from '../components/game/GameScreen'
import LoadingScreen from '../components/ui/LoadingScreen'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { cn } from '../lib/utils'

export const GamePage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [initProgress, setInitProgress] = useState(0)
  
  const settings = useGameStore((state) => state.settings)
  
  useEffect(() => {
    const initializeGame = async () => {
      try {
        console.log('🎵 Initializing Jazz Learning Game...')
        setInitProgress(0.1)
        
        setInitProgress(0.3)
        if (typeof window === 'undefined') {
          throw new Error('Window object not available')
        }
        
        setInitProgress(0.5)
        
        console.log('🔊 Checking basic browser features...')
        
        if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
          console.log('🔊 Audio context available')
        } else {
          console.warn('⚠️ Web Audio API not supported')
        }
        
        setInitProgress(0.7)
        
        if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess !== undefined) {
          console.log('🎹 MIDI API available')
        } else {
          console.warn('⚠️ Web MIDI API not supported')
        }
        
        setInitProgress(0.9)
        
        await new Promise(resolve => setTimeout(resolve, 300))
        
        setInitProgress(1.0)
        setIsInitialized(true)
        console.log('✅ Jazz Learning Game initialized successfully')
        
      } catch (error) {
        console.error('❌ Failed to initialize game:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown error occurred')
        setInitProgress(0)
      }
    }
    
    const timeoutId = setTimeout(initializeGame, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])
  
  if (!isInitialized) {
    return (
      <LoadingScreen 
        progress={initProgress}
        message={
          initProgress < 0.3 ? 'システムを初期化中...' :
          initProgress < 0.7 ? 'ブラウザ機能をチェック中...' :
          initProgress < 1.0 ? '準備を完了中...' :
          'まもなく完了...'
        }
        error={initError}
        onRetry={() => {
          setInitError(null)
          setIsInitialized(false)
          setInitProgress(0)
          setTimeout(() => {
            window.location.reload()
          }, 100)
        }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <div 
        className={cn(
          'game-container',
          'relative w-full h-screen overflow-hidden',
          'bg-gradient-game text-white',
          'font-sans antialiased'
        )}
      >
        <GameScreen />
        
        {settings.showFPS && (
          <FPSCounter />
        )}
      </div>
    </ErrorBoundary>
  )
}

const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(60)
  const debug = useGameStore((state) => state.debug)
  
  useEffect(() => {
    const updateFPSFromPerformanceMonitor = () => {
      if ((window as any).performanceMonitor) {
        const currentFPS = (window as any).performanceMonitor.getFPS()
        setFps(currentFPS)
        
        useGameStore.getState().updateDebugInfo({ fps: currentFPS })
      }
    }
    
    const intervalId = setInterval(updateFPSFromPerformanceMonitor, 1000)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [])
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-70 text-green-400 px-4 py-2 rounded text-lg font-mono">
      FPS: {fps}
      <br />
      Render: {debug.renderTime.toFixed(1)}ms
    </div>
  )
}