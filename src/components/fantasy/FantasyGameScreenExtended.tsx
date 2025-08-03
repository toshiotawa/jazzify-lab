/**
 * ファンタジーゲーム拡張画面
 * chord_progression_dataがある場合に使用される拡張版
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useTimeStoreExtended } from '@/stores/timeStoreExtended';
import { bgmManagerExtended } from '@/utils/BGMManagerExtended';
import { FantasyProgressionEngine } from './FantasyProgressionEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { note as parseNote } from 'tonal';

interface FantasyProgressionStage {
  id: string;
  stageNumber: string;
  name: string;
  description: string;
  maxHp: number;
  enemyGaugeSeconds: number;
  enemyCount: number;
  enemyHp: number;
  minDamage: number;
  maxDamage: number;
  mode: 'progression';
  allowedChords: string[];
  chordProgression?: string[];
  chordProgressionData?: any; // JSON data for timing
  showSheetMusic: boolean;
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  mp3Url?: string;
  simultaneousMonsterCount: number;
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
}

interface FantasyGameScreenExtendedProps {
  stage: FantasyProgressionStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const FantasyGameScreenExtended: React.FC<FantasyGameScreenExtendedProps> = ({
  stage,
  autoStart = false,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode = false
}) => {
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  const [heartFlash, setHeartFlash] = useState(false);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(simpleNoteName);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ monsterId: string; name: string; isSpecial: boolean } | null>(null);
  
  // 時間管理（拡張版）
  const timeState = useTimeStoreExtended();
  const { currentBeat, currentMeasure, beatInMeasure, isCountIn, totalBeats, currentChord, setStart } = timeState;
  
  // gameStore設定
  const { settings, updateSettings } = useGameStore();
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // モンスターエリアの幅管理
  const [monsterAreaWidth, setMonsterAreaWidth] = useState<number>(window.innerWidth);
  const monsterAreaRef = useRef<HTMLDivElement>(null);
  
  // ゲーム状態
  const [gameState, setGameState] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 });
  
  // アニメーションフレーム参照
  const animationFrameRef = useRef<number | null>(null);
  
  // Ready状態の判定
  const isReady = timeState.startAt !== null && 
                  performance.now() - timeState.startAt < timeState.readyDuration;
  
  // モンスターエリアのサイズ監視
  useEffect(() => {
    const update = () => {
      if (monsterAreaRef.current) {
        setMonsterAreaWidth(monsterAreaRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (monsterAreaRef.current) {
      ro.observe(monsterAreaRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  // コールバック関数
  const handleGameStateChange = useCallback((state: any) => {
    setGameState(state);
    devLog.debug('🎮 拡張プログレッションゲーム状態更新:', {
      currentQuestion: state.currentQuestionIndex + 1,
      totalQuestions: state.totalQuestions,
      playerHp: state.playerHp,
      isGameActive: state.isGameActive,
      currentChord: state.currentChordTarget?.displayName,
      score: state.score,
      correctAnswers: state.correctAnswers,
      isInNullPeriod: state.isInNullPeriod
    });
  }, []);
  
  const handleMonsterReady = useCallback((monsterId: string) => {
    devLog.debug('👾 モンスター準備完了:', monsterId);
    if (fantasyPixiInstance) {
      // PIXIレンダラーに通知
    }
  }, [fantasyPixiInstance]);
  
  const handleMonsterBeat = useCallback((monsterId: string) => {
    devLog.debug('💓 モンスター鼓動:', monsterId);
    if (fantasyPixiInstance) {
      // TODO: 実装が必要な場合は追加
      // fantasyPixiInstance.triggerMonsterBeat(monsterId);
    }
  }, [fantasyPixiInstance]);
  
  const handleMonsterComplete = useCallback((monsterId: string) => {
    devLog.debug('✨ モンスター撃破:', monsterId);
    if (fantasyPixiInstance) {
      // 既存のメソッドを使用してモンスター撃破エフェクトを表現
      fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, 'Complete', true, 999, true);
    }
  }, [fantasyPixiInstance]);
  
  const handleMonsterDamage = useCallback((monsterId: string, damage: number) => {
    devLog.debug('⚔️ モンスターダメージ:', { monsterId, damage });
    if (fantasyPixiInstance) {
      // 既存のメソッドを使用してダメージエフェクトを表現
      fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, 'Damage', false, damage, false);
    }
  }, [fantasyPixiInstance]);
  
  const handlePlayerTakeDamage = useCallback((damage: number) => {
    devLog.debug('💔 プレイヤーダメージ:', damage);
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    setHeartFlash(true);
    setTimeout(() => setHeartFlash(false), 150);
  }, []);
  
  const handleScoreUpdate = useCallback((score: number, correct: number, total: number) => {
    devLog.debug('🎯 スコア更新:', { score, correct, total });
  }, []);
  
  const handleGameCompleteCallback = useCallback(() => {
    const result = gameState?.gameResult || 'gameover';
    const text = result === 'clear' ? 'Stage Clear' : 'Game Over';
    setOverlay({ text });
    setTimeout(() => {
      setOverlay(null);
      onGameComplete(
        result,
        gameState?.score || 0,
        gameState?.correctAnswers || 0,
        gameState?.totalQuestions || 0
      );
    }, 2000);
  }, [gameState, onGameComplete]);
  
  const handlePlayerAttack = useCallback(async () => {
    devLog.debug('⚔️ プレイヤー攻撃!');
    try {
      const { FantasySoundManager } = await import('@/utils/FantasySoundManager');
      await FantasySoundManager.playAttackSuccess();
    } catch (error) {
      console.error('Failed to play attack sound:', error);
    }
  }, []);
  
  const handleEnemyAttack = useCallback(async (monsterId: string) => {
    devLog.debug('💥 敵の攻撃!', { monsterId });
    try {
      const { FantasySoundManager } = await import('@/utils/FantasySoundManager');
      FantasySoundManager.playEnemyAttack();
    } catch (error) {
      console.error('Failed to play enemy attack sound:', error);
    }
    
    if (fantasyPixiInstance) {
      // TODO: 敵の攻撃エフェクトの実装が必要な場合は追加
      // fantasyPixiInstance.triggerEnemyAttack(monsterId);
    }
  }, [fantasyPixiInstance]);
  
  const handleSPGaugeUpdate = useCallback((sp: number) => {
    devLog.debug('⚡ SPゲージ更新:', sp);
  }, []);
  
  const handleDebugInfo = useCallback((info: string) => {
    setDebugInfo(info);
  }, []);
  
  // カウントイン処理
  const handleCountInStarted = useCallback(() => {
    devLog.debug('🎵 カウントイン開始');
  }, []);
  
  const handleCountInEnded = useCallback(() => {
    devLog.debug('🎮 カウントイン終了、ゲーム開始!');
  }, []);
  
  // MIDIコントローラーの初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number, velocity?: number) => {
          devLog.debug('🎹 MIDI Note On:', { note, velocity });
          if ((window as any).fantasyProgressionHandleNote) {
            (window as any).fantasyProgressionHandleNote(note);
          }
        },
        onNoteOff: (note: number) => {
          devLog.debug('🎹 MIDI Note Off:', { note });
        },
        playMidiSound: true
      });
      
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
        devLog.debug('🎹 MIDI接続状態変更:', { connected });
      });
      
      midiControllerRef.current = controller;
    }
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.cleanup();
        midiControllerRef.current = null;
      }
    };
  }, []);
  
  // gameStoreのデバイスIDを監視して接続/切断
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        const success = await midiControllerRef.current.connectDevice(deviceId);
        if (success) {
          devLog.debug('✅ MIDIデバイス接続成功:', deviceId);
        }
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);
  
  // ゲームエリアのサイズ監視
  useEffect(() => {
    const updateSize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        setGameAreaSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
  // PIXIレンダラーの初期化
  useEffect(() => {
    if (!gameAreaRef.current) return;
    
    const rendererInstance = PIXINotesRenderer({
      container: gameAreaRef.current,
      width: gameAreaSize.width,
      height: gameAreaSize.height,
      backgroundColor: 0x000000,
      noteRange: { min: 36, max: 95 },
      onNotePress: (note: number) => {
        if ((window as any).fantasyProgressionHandleNote) {
          (window as any).fantasyProgressionHandleNote(note);
        }
      },
      onNoteRelease: (note: number) => {
        devLog.debug('🎹 Note released:', note);
      },
      scrollSpeed: 120,
      displayOpts: { lang: currentNoteNameLang, simple: currentSimpleNoteName },
      fantasyMode: true,
      showKeyboard: true,
      showGuide: stage.showGuide
    });
    
    if (rendererInstance) {
      setPixiRenderer(rendererInstance);
    }
    
    return () => {
      if (rendererInstance) {
        rendererInstance.cleanup();
      }
    };
  }, [gameAreaSize, currentNoteNameLang, currentSimpleNoteName, stage.showGuide]);
  
  // ファンタジーPIXIレンダラーの初期化
  useEffect(() => {
    if (!monsterAreaRef.current || !pixiRenderer || !stage) return;
    
    const instance = FantasyPIXIRenderer({
      container: monsterAreaRef.current,
      width: monsterAreaWidth,
      height: 300,
      pixiNoteRenderer: pixiRenderer,
      stage: stage as any, // FantasyStageの型の違いを回避
      isCountIn: isCountIn
    });
    
    setFantasyPixiInstance(instance);
    
    return () => {
      if (instance && typeof instance.cleanup === 'function') {
        instance.cleanup();
      }
    };
  }, [monsterAreaWidth, pixiRenderer, stage, isCountIn]);
  
  // ゲームの自動開始
  useEffect(() => {
    if (autoStart && stage) {
      setStart(
        stage.bpm,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 0
      );
    }
  }, [autoStart, stage, setStart]);
  
  return (
    <>
      <div className={cn(
        'flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden',
        damageShake && 'animate-shake'
      )}>
        {/* デバッグ情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 left-0 bg-black/50 text-white text-xs p-2 z-50 font-mono">
            {debugInfo}
          </div>
        )}
        
        {/* オーバーレイ */}
        {overlay && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-6xl font-bold text-white animate-pulse">
              {overlay.text}
            </div>
          </div>
        )}
        
        {/* ヘッダー */}
        <div className="flex-none h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-4">
          <button
            onClick={onBackToStageSelect}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            ← ステージ選択
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-white">
              <span className="text-sm opacity-70">Stage</span>
              <span className="ml-2 font-bold">{stage.stageNumber}</span>
            </div>
            
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        {/* ゲームコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* ステータスバー */}
          <div className="flex-none h-20 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-8">
            <div className="flex items-center gap-8">
              {/* HP表示 */}
              <div className="flex items-center gap-2">
                <span className="text-white/70">HP</span>
                <div className="flex gap-1">
                  {[...Array(stage.maxHp)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-6 h-6 transition-all duration-300',
                        i < (gameState?.playerHp || stage.maxHp)
                          ? 'text-red-500'
                          : 'text-gray-600',
                        heartFlash && i === (gameState?.playerHp || stage.maxHp) - 1 && 'animate-pulse'
                      )}
                    >
                      ❤️
                    </div>
                  ))}
                </div>
              </div>
              
              {/* SP表示 */}
              <div className="flex items-center gap-2">
                <span className="text-white/70">SP</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-4 h-4 rounded-full transition-all duration-300',
                        i < (gameState?.playerSp || 0)
                          ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
                          : 'bg-gray-700'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* スコア表示 */}
            <div className="flex items-center gap-8 text-white">
              <div>
                <span className="text-sm opacity-70">Score</span>
                <span className="ml-2 font-bold text-xl">{gameState?.score || 0}</span>
              </div>
              <div>
                <span className="text-sm opacity-70">Progress</span>
                <span className="ml-2 font-bold">
                  {gameState?.enemiesDefeated || 0} / {stage.enemyCount}
                </span>
              </div>
            </div>
          </div>
          
          {/* モンスターエリア */}
          <div 
            ref={monsterAreaRef}
            className="flex-none h-[300px] relative bg-gradient-to-b from-slate-800/30 to-transparent"
          >
            {/* FantasyPIXIRendererがここに描画される */}
          </div>
          
          {/* 魔法名表示 */}
          {magicName && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className={cn(
                'text-4xl font-bold animate-magic-name',
                magicName.isSpecial ? 'text-yellow-400' : 'text-white'
              )}>
                {magicName.name}
              </div>
            </div>
          )}
          
          {/* Ready/Start表示 */}
          {isReady && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                Ready...
              </div>
            </div>
          )}
          
          {/* カウントイン表示 */}
          {isCountIn && !isReady && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-4xl font-bold text-blue-400 animate-bounce">
                Count In: {Math.abs(currentMeasure)}
              </div>
            </div>
          )}
          
          {/* 鍵盤エリア */}
          <div 
            ref={gameAreaRef}
            className="flex-1 relative bg-black"
            style={{ minHeight: '120px' }}
          >
            {/* PIXINotesRendererがここに描画される */}
          </div>
          
          {/* 現在のコード表示（NULL期間の表示） */}
          {gameState?.isInNullPeriod && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-gray-800/80 px-6 py-3 rounded-lg">
              <div className="text-gray-400 text-lg">Waiting...</div>
            </div>
          )}
        </div>
      </div>
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        noteNameLang={currentNoteNameLang}
        simpleNoteName={currentSimpleNoteName}
        onNoteNameLangChange={(lang) => {
          setCurrentNoteNameLang(lang);
          pixiRenderer?.updateDisplayOpts({ lang });
        }}
        onSimpleNoteNameChange={(simple) => {
          setCurrentSimpleNoteName(simple);
          pixiRenderer?.updateDisplayOpts({ simple });
        }}
      />
      
      {/* プログレッションエンジン */}
      <FantasyProgressionEngine
        stage={stage}
        onGameStateChange={handleGameStateChange}
        onMonsterReady={handleMonsterReady}
        onMonsterBeat={handleMonsterBeat}
        onMonsterComplete={handleMonsterComplete}
        onMonsterDamage={handleMonsterDamage}
        onPlayerTakeDamage={handlePlayerTakeDamage}
        onScoreUpdate={handleScoreUpdate}
        onGameComplete={handleGameCompleteCallback}
        onPlayerAttack={handlePlayerAttack}
        onEnemyAttack={handleEnemyAttack}
        onSPGaugeUpdate={handleSPGaugeUpdate}
        onDebugInfo={handleDebugInfo}
        onCountInStarted={handleCountInStarted}
        onCountInEnded={handleCountInEnded}
      />
    </>
  );
};

export default FantasyGameScreenExtended;