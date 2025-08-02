import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useTimeStore } from '@/stores/timeStore';
import { bgmManager } from '@/utils/BGMManager';
import { useRhythmGameEngine } from './RhythmGameEngine';
import { FantasyStage, ChordDefinition } from './FantasyGameEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import RhythmPIXIRenderer from './RhythmPIXIRenderer';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { resolveChord } from '@/utils/chord-utils';

interface RhythmGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const RhythmGameScreen: React.FC<RhythmGameScreenProps> = ({
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
  const [heartFlash, setHeartFlash] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(simpleNoteName);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ monsterId: string; name: string; isSpecial: boolean } | null>(null);
  
  // 時間管理
  const { currentBeat, currentMeasure, tick, startAt, readyDuration, isCountIn, setStart } = useTimeStore();
  const { settings, updateSettings } = useGameStore();
  
  // MIDI Controller
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // モンスターエリアの幅管理
  const [monsterAreaWidth, setMonsterAreaWidth] = useState<number>(window.innerWidth);
  const monsterAreaRef = useRef<HTMLDivElement>(null);
  
  // 自動開始フラグ
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  
  // リズムゲームエンジン
  const { gameState, handleChordInput, notes, isPlaying, isCountIn: engineCountIn } = useRhythmGameEngine({
    stage,
    onGameComplete: (result, score, successCount) => {
      onGameComplete(result, score, successCount, stage.enemyCount);
    }
  });
  
  /* 毎 100 ms で時間ストア tick */
  useEffect(() => {
    const id = setInterval(() => tick(), 100);
    return () => clearInterval(id);
  }, [tick]);
  
  /* Ready → Start 判定 */
  const isReady = startAt !== null && performance.now() - startAt < readyDuration;
  
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
  
  // Ready 終了時に BGM 再生
  useEffect(() => {
    if (!isReady && startAt) {
      bgmManager.play(
        stage.mp3_url || stage.bgmUrl || '/demo-1.mp3',
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount ?? 8,
        stage.countInMeasures ?? 0,
        settings.bgmVolume ?? 0.7
      );
    } else {
      bgmManager.stop();
    }
    return () => bgmManager.stop();
  }, [isReady, stage, settings.bgmVolume, startAt]);
  
  // ゲーム開始処理
  const startGame = useCallback(() => {
    devLog.debug('🎮 Starting rhythm game');
    setStart(
      stage.bpm || 120,
      stage.timeSignature || 4,
      stage.measureCount ?? 8,
      stage.countInMeasures ?? 0
    );
  }, [stage, setStart]);
  
  // 自動開始
  useEffect(() => {
    if (autoStart && !hasAutoStarted && !startAt) {
      setHasAutoStarted(true);
      // 少し遅延させて開始
      setTimeout(() => {
        startGame();
      }, 100);
    }
  }, [autoStart, hasAutoStarted, startAt, startGame]);
  
  // ノート入力のハンドリング用ref
  const handleNoteInputRef = useRef<(note: number, source?: 'mouse' | 'midi') => void>();
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number, source?: 'mouse' | 'midi') => {
    if (!isPlaying) return;
    
    // 単音を即座にコードとして判定
    const chord = resolveChord(note.toString());
    if (chord) {
      handleChordInput(chord.id);
    }
  }, [isPlaying, handleChordInput]);
  
  // refを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);
  
  // MIDIControllerの初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number, velocity?: number) => {
          devLog.debug('🎹 MIDI Note On:', { note, velocity });
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note, 'midi');
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
      
      controller.initialize().then(() => {
        devLog.debug('✅ リズムモードMIDIController初期化完了');
      }).catch(error => {
        devLog.debug('❌ MIDI初期化エラー:', error);
      });
    }
    
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []);
  
  // MIDIデバイス接続
  useEffect(() => {
    // MIDIデバイス接続は自動的に行われるため、特別な処理は不要
    // MIDIControllerが初期化時に自動的に接続を管理する
  }, []);
  
  // 設定の更新
  const handleSettingsUpdate = useCallback((updatedSettings: Partial<typeof settings>) => {
    updateSettings(updatedSettings);
    if (updatedSettings.bgmVolume !== undefined) {
      bgmManager.setVolume(updatedSettings.bgmVolume);
    }
  }, [updateSettings]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      {/* オーバーレイ */}
      {overlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-bold text-white animate-fade-out">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* メインコンテナ */}
      <div className={cn(
        "max-w-6xl mx-auto",
        damageShake && "animate-shake"
      )}>
        {/* ヘッダー部分 */}
        <div className="bg-white rounded-t-2xl shadow-lg p-4 flex justify-between items-center">
          <button
            onClick={onBackToStageSelect}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>ステージ選択に戻る</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">{stage.name}</h2>
            <p className="text-gray-600">リズムモード</p>
          </div>
          
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
        </div>
        
        {/* ゲーム情報バー */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            {/* プレイヤーHP */}
            <div className="flex items-center space-x-2">
              <i className={cn("fas fa-heart text-2xl", heartFlash ? "text-red-500 animate-pulse" : "text-pink-500")}></i>
              <span className="text-xl font-bold">{gameState.playerHp}/{stage.maxHp}</span>
            </div>
            
            {/* 撃破数 */}
            <div className="flex items-center space-x-2">
              <i className="fas fa-skull text-gray-600"></i>
              <span className="font-semibold">{gameState.currentMonsterIndex}/{stage.enemyCount}</span>
            </div>
            
            {/* 時間表示 */}
            <div className="flex items-center space-x-2">
              <i className="fas fa-music text-blue-500"></i>
              <span className="font-mono">
                {isCountIn ? `M / - B ${currentBeat}` : `M ${currentMeasure} - B ${currentBeat}`}
              </span>
            </div>
          </div>
          
          {/* MIDI接続状態 */}
          <div className="flex items-center space-x-2">
            {isMidiConnected && (
              <div className="flex items-center space-x-2 text-green-600">
                <i className="fas fa-plug"></i>
                <span className="text-sm">MIDI接続中</span>
              </div>
            )}
          </div>
        </div>
        
        {/* メインゲームエリア */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          {/* モンスターエリア（クイズモードと同じ） */}
          <div ref={monsterAreaRef} className="relative h-[200px] mb-6 bg-black bg-opacity-20 rounded-lg overflow-hidden">
            {gameState.monsters.length > 0 && gameState.monsters[gameState.currentMonsterIndex] && (
              <FantasyPIXIRenderer
                width={Math.max(monsterAreaWidth, 1)}
                height={200}
                monsterIcon={gameState.monsters[gameState.currentMonsterIndex].icon}
                enemyGauge={0} // リズムモードではゲージは使わない
                onMonsterDefeated={() => {}}
                onShowMagicName={(name: string, isSpecial: boolean, monsterId: string) => {
                  setMagicName({ monsterId, name, isSpecial });
                  setTimeout(() => setMagicName(null), 2000);
                }}
                className="w-full h-full"
                activeMonsters={gameState.monsters}
              />
            )}
          </div>
          
          {/* 魔法名表示 */}
          {magicName && (
            <div className="text-center mb-4">
              <span className={cn(
                "text-2xl font-bold",
                magicName.isSpecial ? "text-yellow-500 animate-pulse" : "text-purple-600"
              )}>
                {magicName.name}
              </span>
            </div>
          )}
          
          {/* リズムノーツ表示エリア */}
          <div className="relative h-[150px] mb-6 bg-gray-50 rounded-lg overflow-hidden">
            <RhythmPIXIRenderer
              notes={notes}
              currentTime={useTimeStore.getState().getCurrentTime()}
              width={monsterAreaWidth}
              height={150}
              displayOpts={{ lang: currentNoteNameLang, simpleNoteName: currentSimpleNoteName }}
            />
          </div>
          
          {/* 鍵盤表示（クイズモードと同じ） */}
          {stage.showGuide && (
            <div className="mb-6">
              <PIXINotesRenderer
                activeNotes={[]} // リズムモードでは常に空
                width={monsterAreaWidth}
                height={200}
                currentTime={0}
                className="w-full"
              />
            </div>
          )}
          
          {/* Ready/Start表示 */}
          {isReady && (
            <div className="text-center">
              <h1 className="text-6xl font-bold text-purple-600 animate-pulse">READY...</h1>
            </div>
          )}
          
          {/* ゲーム開始ボタン（開始前のみ） */}
          {!startAt && !autoStart && (
            <div className="text-center">
              <button
                onClick={startGame}
                className="bg-purple-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-purple-700 transition-colors"
              >
                ゲーム開始
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChange={(fantasySettings) => {
          // FantasySettings型からGameSettings型への変換
          handleSettingsUpdate({
            bgmVolume: fantasySettings.bgmVolume,
            soundEffectVolume: fantasySettings.soundEffectVolume,
            rootSoundVolume: fantasySettings.rootSoundVolume,
            playRootSound: fantasySettings.playRootSound
          });
        }}
        isMidiConnected={isMidiConnected}
        volume={0.8} // デフォルト音量
        soundEffectVolume={settings.soundEffectVolume}
        bgmVolume={settings.bgmVolume}
        noteNameLang={currentNoteNameLang}
        simpleNoteName={currentSimpleNoteName}
        playRootSound={settings.playRootSound}
        rootSoundVolume={settings.rootSoundVolume}
      />
    </div>
  );
};

export default RhythmGameScreen;