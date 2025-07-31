/**
 * ファンタジーリズムモード画面
 * リズムモードのUI実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useTimeStore } from '@/stores/timeStore';
import { bgmManager } from '@/utils/BGMManager';
import { useFantasyRhythmEngine, type FantasyStage } from './FantasyRhythmEngine';
import { PIXINotesRenderer } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { note as parseNote } from 'tonal';

interface FantasyRhythmScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

const FantasyRhythmScreen: React.FC<FantasyRhythmScreenProps> = ({
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
  
  // 設定状態を管理
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(simpleNoteName);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ monsterId: string; name: string; isSpecial: boolean } | null>(null);
  
  // 時間管理
  const { currentBeat, currentMeasure, tick, startAt, readyDuration, isCountIn, setStart } = useTimeStore();
  
  // ゲーム設定
  const { settings, updateSettings } = useGameStore();
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // モンスターエリアの幅管理
  const [monsterAreaWidth, setMonsterAreaWidth] = useState<number>(window.innerWidth);
  const monsterAreaRef = useRef<HTMLDivElement>(null);
  
  // PIXI レンダラーインスタンス（今は使用していないが、将来的な拡張のために残す）
  // const pixiRendererRef = useRef<FantasyPIXIInstance | null>(null);
  // const noteRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  
  // 毎 100 ms で時間ストア tick
  useEffect(() => {
    const id = setInterval(() => tick(), 100);
    return () => clearInterval(id);
  }, [tick]);

  // Ready → Start 判定
  const isReady = startAt !== null && performance.now() - startAt < readyDuration;
  
  // リズムエンジンの初期化
  const {
    gameState,
    startGame,
    handleNoteInput,
    displayOpts
  } = useFantasyRhythmEngine({
    stage,
    onGameStateChange: (state) => {
      devLog.debug('🎵 リズムゲーム状態更新', state);
    },
    onChordCorrect: (chord, damage, defeated, monsterId) => {
      devLog.debug('🎵 コード正解', { chord, damage, defeated, monsterId });
      
      // 魔法名表示
      const magicNames = [
        'ファイア',
        'ブリザド',
        'サンダー',
        'ケアル',
        'プロテス',
        'シェル',
        'ヘイスト',
        'スロウ'
      ];
      const isSpecial = damage > 1;
      const name = isSpecial ? 'メテオ' : magicNames[Math.floor(Math.random() * magicNames.length)];
      
      setMagicName({ monsterId, name, isSpecial });
      setTimeout(() => setMagicName(null), 2000);
      
      // ダメージエフェクト
      // PIXIレンダラーのshowDamageメソッドがあれば使用
      // TODO: PIXIレンダラーのインターフェースに合わせて実装
      
      // 効果音再生
      import('@/utils/FantasySoundManager').then(({ FantasySoundManager }) => {
        FantasySoundManager.playMyAttack();
      });
    },
    onChordIncorrect: (expectedChord, inputNotes) => {
      devLog.debug('🎵 コード不正解', { expectedChord, inputNotes });
    },
    onGameComplete: (result, finalState) => {
      devLog.debug('🎵 ゲーム完了', { result, finalState });
      
      // オーバーレイ表示
      setOverlay({ text: result === 'clear' ? 'STAGE CLEAR!' : 'GAME OVER' });
      
      // 完了コールバック
      setTimeout(() => {
        onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
      }, 2000);
    },
    onEnemyAttack: (attackingMonsterId) => {
      devLog.debug('🎵 敵の攻撃', { attackingMonsterId });
      
      // ダメージエフェクト
      setDamageShake(true);
      setHeartFlash(true);
      setTimeout(() => {
        setDamageShake(false);
        setHeartFlash(false);
      }, 500);
      
      // 効果音再生
      import('@/utils/FantasySoundManager').then(({ FantasySoundManager }) => {
        FantasySoundManager.playEnemyAttack();
      });
    }
  });
  
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
        stage.bgmUrl ?? '/demo-1.mp3',
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount ?? 8,
        stage.countInMeasures ?? 0,
        settings.bgmVolume ?? 0.7,
        true // リズムモード
      );
    } else {
      bgmManager.stop();
    }
    return () => bgmManager.stop();
  }, [isReady, stage, settings.bgmVolume, startAt]);
  
  // ノート入力のハンドリング用ref
  const handleNoteInputRef = useRef<(note: number, source?: 'mouse' | 'midi') => void>();
  
  // MIDIControllerの初期化と管理
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
  
  // MIDI接続処理
  useEffect(() => {
    if (midiControllerRef.current && settings.selectedMidiDevice && settings.selectedMidiDevice !== 'none') {
      midiControllerRef.current.connectDevice(settings.selectedMidiDevice).catch((error: any) => {
        devLog.debug('❌ MIDIデバイス接続エラー:', error);
      });
    }
  }, [settings.selectedMidiDevice]);
  
  // ノート入力ハンドラーの更新
  useEffect(() => {
    handleNoteInputRef.current = (note: number, source?: 'mouse' | 'midi') => {
      devLog.debug('🎵 ノート入力', { note, source });
      handleNoteInput(note);
    };
  }, [handleNoteInput]);
  
  // ゲーム開始処理
  useEffect(() => {
    if (autoStart && !gameState.isGameActive && !gameState.isGameOver) {
      // 時間ストアを初期化
      setStart(
        stage.bpm || 120,
        stage.timeSignature || 4,
        stage.measureCount || 8,
        stage.countInMeasures || 0
      );
      
      // ゲーム開始
      setTimeout(() => {
        startGame();
      }, 100);
    }
  }, [autoStart, gameState.isGameActive, gameState.isGameOver, stage, setStart, startGame]);
  
  // タイミングゲージの描画
  const renderTimingGauge = useCallback((monster: any) => {
    const gaugeWidth = monster.gaugeProgress;
    const isNearTarget = monster.gaugeProgress >= 70 && monster.gaugeProgress <= 90;
    
    return (
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-100",
            isNearTarget ? "bg-yellow-500" : "bg-blue-500"
          )}
          style={{ width: `${gaugeWidth}%` }}
        />
        {/* 80%マーカー */}
        <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-white opacity-50" />
      </div>
    );
  }, []);
  
  // UI表示
  const displayMeasure = isCountIn ? '/' : currentMeasure;
  
  return (
    <div className={cn(
      "relative h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden",
      damageShake && "animate-shake"
    )}>
      {/* オーバーレイ */}
      {overlay && (
        <div className="absolute inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="text-6xl font-bold text-white animate-bounce">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex justify-between items-start">
          {/* 左側: ステージ情報 */}
          <div className="text-white">
            <h2 className="text-2xl font-bold">{stage.name}</h2>
            <p className="text-sm opacity-75">リズムモード - {stage.chordProgressionData ? 'プログレッション' : 'ランダム'}</p>
          </div>
          
          {/* 中央: タイミング情報 */}
          <div className="text-white text-center">
            <div className="text-3xl font-bold">
              M {displayMeasure} - B {currentBeat}
            </div>
            <div className="text-sm opacity-75">
              {stage.bpm} BPM / {stage.timeSignature}/4
            </div>
          </div>
          
          {/* 右側: スコア・設定 */}
          <div className="text-white text-right">
            <div className="text-xl mb-2">
              スコア: {gameState.score}
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              設定
            </button>
          </div>
        </div>
      </div>
      
      {/* プレイヤーHP */}
      <div className="absolute top-20 left-4 z-20">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">HP</span>
          <div className="flex gap-1">
            {Array.from({ length: stage.maxHp }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-6 h-6 transition-all duration-300",
                  i < gameState.playerHp
                    ? heartFlash && i === gameState.playerHp - 1
                      ? "text-red-500 animate-pulse"
                      : "text-red-500"
                    : "text-gray-600"
                )}
              >
                ❤️
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* モンスターエリア */}
      <div ref={monsterAreaRef} className="absolute top-32 left-0 right-0 bottom-32 px-8">
        <div className="relative h-full">
          {/* PIXIレンダラー */}
          {/* @ts-ignore - リズムモード用の型定義は今後実装 */}
          <FantasyPIXIRenderer
            width={monsterAreaWidth}
            height={400}
            monsterIcon={stage.monsterIcon || 'dragon'}
            enemyGauge={0} // リズムモードではゲージ不要
            activeMonsters={gameState.activeMonsters.map(m => ({
              id: m.id,
              index: m.index,
              position: m.position,
              currentHp: m.currentHp,
              maxHp: m.maxHp,
              gauge: 0,
              chordTarget: m.chordTarget,
              correctNotes: m.correctNotes,
              icon: m.icon,
              name: m.name
            })) as any}
            onReady={(instance) => {
              devLog.debug('🎵 PIXIレンダラー準備完了');
            }}
          />
          
          {/* タイミングゲージ */}
          {gameState.activeMonsters.map(monster => {
            if (!monster.isActive) return null;
            
            const position = {
              A: 'left-[10%]',
              B: 'left-[35%]',
              C: 'left-[60%]',
              D: 'left-[85%]'
            }[monster.position];
            
            return (
              <div
                key={monster.id}
                className={cn(
                  "absolute bottom-20 w-32 transform -translate-x-1/2",
                  position
                )}
              >
                {renderTimingGauge(monster)}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 魔法名表示 */}
      {magicName && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className={cn(
            "text-4xl font-bold animate-bounce",
            magicName.isSpecial ? "text-yellow-400" : "text-white"
          )}>
            {magicName.name}!
          </div>
        </div>
      )}
      
      {/* ピアノレンダラー */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent">
        {/* @ts-ignore - 型定義の問題を一時的に回避 */}
        <PIXINotesRenderer
          onNoteClick={(note: number) => {
            if (handleNoteInputRef.current) {
              handleNoteInputRef.current(note, 'mouse');
            }
          }}
          config={{
            width: window.innerWidth,
            height: 120,
            keyStartOctave: 3,
            keyEndOctave: 6,
            backgroundColor: 0x1a1a1a,
            alwaysShowNoteName: settings.showNoteNames ?? false,
            noteNameLang: currentNoteNameLang,
            simpleNoteName: currentSimpleNoteName
          }}
        />
      </div>
      
      {/* Ready/Start オーバーレイ */}
      {isReady && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="text-6xl font-bold text-white animate-pulse">
            READY...
          </div>
        </div>
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        bgmVolume={settings.bgmVolume ?? 0.7}
        soundEffectVolume={settings.soundEffectVolume ?? 0.8}
        rootSoundVolume={settings.rootSoundVolume ?? 0.5}
        showNoteNames={settings.showNoteNames ?? false}
        noteNameLang={currentNoteNameLang}
        simpleNoteName={currentSimpleNoteName}
        playRootSound={settings.playRootSound ?? true}
        onSettingsChange={(newSettings) => {
          updateSettings({
            bgmVolume: newSettings.bgmVolume,
            soundEffectVolume: newSettings.soundEffectVolume,
            rootSoundVolume: newSettings.rootSoundVolume,
            showNoteNames: newSettings.showNoteNames,
            playRootSound: newSettings.playRootSound
          });
          setCurrentNoteNameLang(newSettings.noteNameLang);
          setCurrentSimpleNoteName(newSettings.simpleNoteName);
          
          // BGM音量を即座に反映
          bgmManager.setVolume(newSettings.bgmVolume);
          
          // 効果音とルート音の設定を反映
          import('@/utils/FantasySoundManager').then(({ FantasySoundManager }) => {
            FantasySoundManager.init(
              newSettings.soundEffectVolume,
              newSettings.rootSoundVolume,
              newSettings.playRootSound
            );
          });
        }}
      />
      
      {/* 戻るボタン */}
      <button
        onClick={onBackToStageSelect}
        className="absolute top-4 right-4 z-20 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        ステージ選択へ
      </button>
    </div>
  );
};

export default FantasyRhythmScreen;