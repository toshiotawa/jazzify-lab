/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { playNote, stopNote, initializeAudioSystem, MIDIController } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterState } from './FantasyGameEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';

interface FantasyGameScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
}

// 不要な定数とインターフェースを削除（PIXI側で処理）

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect
}) => {
  // useGameStoreの使用を削除（ファンタジーモードでは不要）
  
  // エフェクト状態
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [damageShake, setDamageShake] = useState(false);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理（初期値はstageから取得）
  const [showGuide, setShowGuide] = useState(stage.showGuide);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ name: string; isSpecial: boolean } | null>(null);
  
  // MIDI接続状態を管理
  const [midiDeviceId, setMidiDeviceId] = useState<string | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // stage.showGuide の変更をコンポーネントの状態に同期させる
  useEffect(() => {
    setShowGuide(stage.showGuide);
  }, [stage.showGuide]);
  
  // MIDI入力処理用のRef（コールバックを保持）
  const handleNoteInputRef = useRef<(note: number) => void>();
  
  // MIDIControllerの初期化と管理
  useEffect(() => {
    // MIDIControllerのインスタンスを作成（一度だけ）
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number, velocity?: number) => {
          devLog.debug('🎹 MIDI Note On:', { note, velocity });
          // Refを通じて最新のhandleNoteInputBridgeを呼び出す
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note);
          }
        },
        onNoteOff: (note: number) => {
          devLog.debug('🎹 MIDI Note Off:', { note });
          stopNote(note);
        }
      });
      
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
        devLog.debug('🎹 MIDI接続状態変更:', { connected });
      });
      
      midiControllerRef.current = controller;
      
      // 初期化
      controller.initialize().then(() => {
        devLog.debug('✅ ファンタジーモードMIDIController初期化完了');
        
        // 保存されているデバイスIDがあれば自動接続
        const savedDeviceId = localStorage.getItem('fantasyMidiDeviceId');
        if (savedDeviceId) {
          setMidiDeviceId(savedDeviceId);
          const success = controller.connectDevice(savedDeviceId);
          if (success) {
            devLog.debug('✅ 保存されたMIDIデバイスに自動接続成功:', savedDeviceId);
          }
        }
      }).catch(error => {
        devLog.debug('❌ MIDI初期化エラー:', error);
      });
    }
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []); // 空の依存配列で一度だけ実行
  
  // MIDIデバイス接続管理
  useEffect(() => {
    if (midiControllerRef.current && midiDeviceId) {
      const success = midiControllerRef.current.connectDevice(midiDeviceId);
      if (success) {
        devLog.debug('✅ MIDIデバイス接続成功:', midiDeviceId);
        localStorage.setItem('fantasyMidiDeviceId', midiDeviceId);
      }
    } else if (midiControllerRef.current && !midiDeviceId) {
      midiControllerRef.current.disconnect();
      localStorage.removeItem('fantasyMidiDeviceId');
    }
  }, [midiDeviceId]);

  // ステージ変更時にMIDI接続を確認・復元
  useEffect(() => {
    const restoreMidiConnection = async () => {
      if (midiControllerRef.current && midiDeviceId) {
        const isRestored = await midiControllerRef.current.checkAndRestoreConnection();
        if (isRestored) {
          devLog.debug('✅ ステージ変更後のMIDI接続を復元しました');
        }
      }
    };

    // 少し遅延を入れて確実に復元
    const timer = setTimeout(restoreMidiConnection, 100);
    return () => clearTimeout(timer);
  }, [stage, midiDeviceId]); // stageが変更されたときに実行
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 }); // ファンタジーモード用に高さを大幅に縮小
  
  // ゲームエンジン コールバック
  const handleGameStateChange = useCallback((state: FantasyGameState) => {
    devLog.debug('🎮 ファンタジーゲーム状態更新:', {
      currentQuestion: state.currentQuestionIndex + 1,
      totalQuestions: state.totalQuestions,
      playerHp: state.playerHp,
      enemyGauge: state.enemyGauge.toFixed(1),
      isGameActive: state.isGameActive,
      currentChord: state.currentChordTarget?.displayName,
      score: state.score,
      correctAnswers: state.correctAnswers
    });
  }, []);
  
  const handleChordCorrect = useCallback((chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId?: string) => { // マルチモンスター対応
    devLog.debug('✅ 正解:', { name: chord.displayName, special: isSpecial, damage: damageDealt, defeated: defeated, monsterId });
    
    // ファンタジーPIXIエフェクトをトリガー（コード名を渡す）
    if (fantasyPixiInstance) {
      if (monsterId) {
        // マルチモンスター用の攻撃メソッドを呼ぶ
        fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, chord.displayName, isSpecial, damageDealt, defeated);
      } else {
        // 互換性のため従来のメソッドも残す
        fantasyPixiInstance.triggerAttackSuccess(chord.displayName, isSpecial, damageDealt, defeated);
      }
    }
    
  }, [fantasyPixiInstance]);
  
  const handleChordIncorrect = useCallback((expectedChord: ChordDefinition, inputNotes: number[]) => {
    devLog.debug('🎵 まだ構成音が足りません:', { expected: expectedChord.displayName, input: inputNotes });
    
    // 不正解エフェクトは削除（音の積み重ね方式のため）
    // setShowIncorrectEffect(true);
    // setTimeout(() => setShowIncorrectEffect(false), 500);
    
  }, []);
  
  const handleEnemyAttack = useCallback(() => {
    devLog.debug('💥 敵の攻撃!');
    
    // モンスター攻撃状態を設定
    setIsMonsterAttacking(true);
    setTimeout(() => setIsMonsterAttacking(false), 600);
    
    // ファンタジーPIXIでモンスター攻撃エフェクト
    if (fantasyPixiInstance) {
      fantasyPixiInstance.updateMonsterAttacking(true);
      setTimeout(() => {
        if (fantasyPixiInstance) {
          fantasyPixiInstance.updateMonsterAttacking(false);
        }
      }, 600);
    }
    
    // ダメージ時の画面振動
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
  }, [fantasyPixiInstance]);
  
  const handleGameCompleteCallback = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    devLog.debug('🏁 ゲーム終了:', { result, finalState });
    onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
  }, [onGameComplete]);
  
  // ★【最重要修正】 ゲームエンジンには、UIの状態を含まない初期stageを一度だけ渡す
  // これでガイドをON/OFFしてもゲームはリセットされなくなる
  const {
    gameState,
    inputBuffer,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    getCurrentEnemy,
    proceedToNextEnemy,
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: stage, // UI状態の`showGuide`を含めない！ propsのstageを直接渡す
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack
  });
  
  // 現在の敵情報を取得
  const currentEnemy = getCurrentEnemy(gameState.currentEnemyIndex);
  
  // MIDI番号から音名を取得する関数
  const getNoteNameFromMidi = (midiNote: number): string => {
    const noteNames = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
    return noteNames[midiNote % 12];
  };
  
  // MIDI/音声入力のハンドリング
  const handleNoteInputBridge = useCallback(async (note: number) => {
    // キーボードハイライト & ヒットエフェクト
    if (pixiRenderer) {
      pixiRenderer.highlightKey(note, true);
      pixiRenderer.triggerKeyPressEffect(note);
      // 少し遅れてハイライトを解除
      setTimeout(() => {
        if (pixiRenderer) {
          pixiRenderer.highlightKey(note, false);
        }
      }, 150);
    }

    // 音声システムの初期化（初回のみ）
    try {
      await initializeAudioSystem();
      await playNote(note, 100); // 通常プレイ時と同じ音量に統一
    } catch (error) {
      devLog.debug('🎹 音声再生エラー:', error);
    }
    
    // ファンタジーゲームエンジンにのみ送信（重複を防ぐため）
    engineHandleNoteInput(note);
  }, [engineHandleNoteInput, pixiRenderer]);
  
  // handleNoteInputBridgeが定義された後にRefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInputBridge;
  }, [handleNoteInputBridge]);
  
  // PIXI.jsレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    setPixiRenderer(renderer);
    
    if (renderer) {
      // ファンタジーモード用の設定を適用
      const screenWidth = window.innerWidth;
      
      // Piano.tsと同じ白鍵幅計算方法を使用
      const minNote = 21; // A0
      const maxNote = 108; // C8
      let totalWhiteKeys = 0;
      
      // 黒鍵判定関数
      const isBlackKey = (midiNote: number): boolean => {
        const noteInOctave = midiNote % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
      };
      
      // 白鍵の総数を計算
      for (let note = minNote; note <= maxNote; note++) {
        if (!isBlackKey(note)) {
          totalWhiteKeys++;
        }
      }
      
      // 画面幅に基づいて白鍵幅を計算
      const whiteKeyWidth = screenWidth / totalWhiteKeys;
      const dynamicNoteWidth = Math.max(whiteKeyWidth - 2, 16); // 最小16px
      
      renderer.updateSettings({
        noteNameStyle: 'abc',
        simpleDisplayMode: true, // シンプル表示モードを有効
        pianoHeight: 120, // ファンタジーモード用に大幅に縮小
        noteHeight: 16, // 音符の高さも縮小
        noteWidth: dynamicNoteWidth,
        transpose: 0,
        transposingInstrument: 'concert_pitch',
        practiceGuide: showGuide ? 'key' : 'off', // ガイド表示設定に基づく
        showHitLine: false, // ヒットラインを非表示
        viewportHeight: 120, // pianoHeightと同じ値に設定してノーツ下降部分を完全に非表示
        timingAdjustment: 0,
        effects: {
          glow: true,
          particles: true,
          trails: false
        }
      });
      
      // キーボードのクリックイベントを接続
      renderer.setKeyCallbacks(
        (note: number) => handleNoteInputBridge(note),
        (note: number) => stopNote(note) // マウスリリース時に音を止める
      );
      
      devLog.debug('🎮 PIXI.js ファンタジーモード準備完了:', {
        screenWidth,
        totalWhiteKeys,
        whiteKeyWidth: whiteKeyWidth.toFixed(2),
        noteWidth: dynamicNoteWidth.toFixed(2),
        showGuide: showGuide
      });
    }
  }, [handleNoteInputBridge, showGuide]);

  // ファンタジーPIXIレンダラーの準備完了ハンドラー
  const handleFantasyPixiReady = useCallback((instance: FantasyPIXIInstance) => {
    devLog.debug('🎨 FantasyPIXIインスタンス準備完了');
    setFantasyPixiInstance(instance);
  }, []);
  
  // 魔法名表示ハンドラー
  const handleShowMagicName = useCallback((name: string, isSpecial: boolean) => {
    setMagicName({ name, isSpecial });
    // 1秒後に自動的に非表示
    setTimeout(() => {
      setMagicName(null);
    }, 1000);
  }, []);
  
  // モンスター撃破時のコールバック（状態機械対応）
  const handleMonsterDefeated = useCallback(() => {
    devLog.debug('SCREEN: PIXIからモンスター消滅完了通知を受信しました。');
    // アニメーションが終わったので、エンジンに次の敵へ進むよう命令する
    proceedToNextEnemy();
  }, [proceedToNextEnemy]);
  
  // FontAwesome使用のため削除済み
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: Math.max(rect.width || window.innerWidth, window.innerWidth), // 画面幅を基準に設定
        height: 120 // ファンタジーモード用の固定高さ（大幅縮小）
      };
      setGameAreaSize(newSize);
      
      devLog.debug('🎮 ゲームエリアサイズ更新:', newSize);
    };

    // 初回サイズ取得
    updateSize();

    // ResizeObserver でコンテナサイズ変化を監視
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateSize);
    });
    
    observer.observe(gameAreaRef.current);

    return () => observer.disconnect();
  }, []);

  // 敵が変更された時にモンスタースプライトを更新（状態機械対応）
  useEffect(() => {
    if (fantasyPixiInstance && currentEnemy) {
      // 状態機械のガード処理により、適切なタイミングでのみモンスターが生成される
      // 遅延処理は不要になった（状態機械が適切なタイミングを制御）
      fantasyPixiInstance.createMonsterSprite(currentEnemy.icon);
      devLog.debug('🔄 モンスタースプライト更新要求:', { 
        monster: currentEnemy.icon,
        enemyIndex: gameState.currentEnemyIndex
      });
    }
  }, [fantasyPixiInstance, currentEnemy, gameState.currentEnemyIndex]);
  
  // 設定変更時にPIXIレンダラーを更新（鍵盤ハイライトは無効化）
  useEffect(() => {
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        practiceGuide: 'off' // 常にOFFにして鍵盤ハイライトを無効化
      });
      devLog.debug('🎮 PIXIレンダラー設定更新: 鍵盤ハイライト無効化');
    }
  }, [pixiRenderer]);
  
  // HPハート表示（プレイヤーと敵の両方を赤色のハートで表示）
  const renderHearts = useCallback((hp: number, maxHp: number, isPlayer: boolean = true) => {
    const hearts = [];
    // HP表示のデバッグログを追加
    devLog.debug(`💖 ${isPlayer ? 'プレイヤー' : '敵'}HP表示:`, { current: hp, max: maxHp });
    
    for (let i = 0; i < maxHp; i++) {
      hearts.push(
        <span key={i} className={cn(
          "text-2xl transition-all duration-300",
          i < hp 
            ? "text-red-500" // プレイヤーも敵も赤いハート
            : "text-gray-300" // 空のハートは薄いグレー
        )}>
          {i < hp ? "♡" : "×"}
        </span>
      );
    }
    return hearts;
  }, []);
  
  // 敵のゲージ表示（黄色系）
  const renderEnemyGauge = useCallback(() => {
    return (
      <div className="w-48 h-6 bg-gray-700 border-2 border-gray-600 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-200 ease-out"
          style={{ 
            width: `${Math.min(gameState.enemyGauge, 100)}%`,
            boxShadow: gameState.enemyGauge > 80 ? '0 0 10px rgba(245, 158, 11, 0.6)' : 'none'
          }}
        />
      </div>
    );
  }, [gameState.enemyGauge]);
  
  // NEXTコード表示（コード進行モード用）
  const getNextChord = useCallback(() => {
    if (stage.mode !== 'progression' || !stage.chordProgression) return null;
    
    const nextIndex = (gameState.currentQuestionIndex + 1) % stage.chordProgression.length;
    return stage.chordProgression[nextIndex];
  }, [stage.mode, stage.chordProgression, gameState.currentQuestionIndex]);
  
  // SPゲージ表示
  const renderSpGauge = useCallback((sp: number) => {
    const spBlocks = [];
    for (let i = 0; i < 3; i++) {
      spBlocks.push(
        <div
          key={i}
          className={cn(
            "w-12 h-3 rounded transition-all duration-300",
            i < sp ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]' : 'bg-gray-600'
          )}
        />
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-bold text-yellow-300">SP</span>
        {spBlocks}
      </div>
    );
  }, []);
  
  // ゲーム開始前画面（スタートボタン表示条件を修正）
  if (!gameState.isGameActive || !gameState.currentChordTarget) {
    devLog.debug('🎮 ゲーム開始前画面表示:', { 
      isGameActive: gameState.isGameActive,
      hasCurrentChord: !!gameState.currentChordTarget,
      stageName: stage.name
    });
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold mb-4">{stage.name}</h2>
          <p className="text-gray-200 mb-8">{stage.description || 'ステージの説明'}</p>
          <button
            onClick={() => {
              devLog.debug('🎮 ゲーム開始ボタンクリック');
              initializeGame(stage);
            }}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-xl rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            🎮 ゲーム開始！
          </button>
          
          {/* デバッグ情報 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-black bg-opacity-50 text-white text-xs p-3 rounded">
              <div>ゲーム状態: {gameState.isGameActive ? 'アクティブ' : '非アクティブ'}</div>
              <div>現在のコード: {gameState.currentChordTarget ? gameState.currentChordTarget.displayName : 'なし'}</div>
              <div>許可コード数: {stage.allowedChords?.length || 0}</div>
              <div>敵ゲージ秒数: {stage.enemyGaugeSeconds}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "h-screen bg-black text-white relative overflow-hidden select-none flex flex-col fantasy-game-screen",
      damageShake && "animate-pulse"
    )}>
      {/* ===== ヘッダー ===== */}
      <div className="relative z-30 p-1 text-white flex-shrink-0" style={{ minHeight: '40px' }}>
        <div className="flex justify-between items-center">
          {/* ステージ情報と敵の数 */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-bold">
              Stage {stage.stageNumber}
            </div>
            <div className="text-xs text-gray-300">
              敵の数: {stage.enemyCount}
            </div>
          </div>
          
          {/* 戻るボタン */}
          <button
            onClick={onBackToStageSelect}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
          >
            ステージ選択に戻る
          </button>
          
          {/* 設定ボタン */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors ml-2"
          >
            ⚙️ 設定
          </button>
        </div>
      </div>
      
      {/* ===== メインゲームエリア ===== */}
      <div className="flex-grow flex flex-col justify-center px-2 py-1 text-white text-center relative z-20" style={{ minHeight: '200px' }}>
        {/* マルチモンスター表示 */}
        <div className="mb-1 text-center">
          {gameState.activeMonsters && gameState.activeMonsters.length > 0 ? (
            <div className="flex justify-center items-start gap-2">
              {/* 各モンスターのコード表示 */}
              {gameState.activeMonsters.map((monster) => (
                <div key={monster.id} className="flex-1 max-w-[150px]">
                  <div className="text-yellow-300 text-lg font-bold tracking-wider drop-shadow-lg">
                    {monster.chordTarget.displayName}
                  </div>
                  {/* 音名表示（ヒントがONの場合は全表示、OFFでも正解した音は表示） */}
                  <div className="mt-1 text-sm font-medium h-6">
                    {monster.chordTarget.notes.map((note, index) => {
                      const noteMod12 = note % 12;
                      const noteName = getNoteNameFromMidi(note);
                      const isCorrect = monster.correctNotes.includes(noteMod12);
                      // showGuideがtrueなら全て表示、falseなら正解した音のみ表示
                      if (!showGuide && !isCorrect) {
                        return (
                          <span key={index} className="mx-0.5 opacity-0 text-xs">
                            {noteName}
                            {' ✓'}
                          </span>
                        );
                      }
                      return (
                        <span key={index} className={`mx-0.5 text-xs ${isCorrect ? 'text-green-400' : 'text-gray-300'}`}>
                          {noteName}
                          {isCorrect && ' ✓'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 互換性のための旧表示（モンスターがいない場合）
            <div>
              <div className="text-yellow-300 text-2xl font-bold tracking-wider drop-shadow-lg">
                {gameState.currentChordTarget?.displayName}
              </div>
              {gameState.currentChordTarget && (
                <div className="mt-1 text-lg font-medium h-7">
                  {gameState.currentChordTarget.notes.map((note, index) => {
                    const noteMod12 = note % 12;
                    const noteName = getNoteNameFromMidi(note);
                    const isCorrect = gameState.correctNotes.includes(noteMod12);
                    if (!showGuide && !isCorrect) {
                      return (
                        <span key={index} className="mx-1 opacity-0">
                          {noteName}
                          {' ✓'}
                        </span>
                      );
                    }
                    return (
                      <span key={index} className={`mx-1 ${isCorrect ? 'text-green-400' : 'text-gray-300'}`}>
                        {noteName}
                        {isCorrect && ' ✓'}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* ファンタジーPIXIレンダラー（モンスターとエフェクト） */}
        <div className="mb-2 text-center relative w-full">
          <div className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden" style={{ height: 'min(200px, 30vh)' }}>
            {/* 魔法名表示 */}
            {magicName && (
              <div className="absolute top-4 left-0 right-0 z-20 pointer-events-none">
                <div className={`text-2xl font-bold font-dotgothic16 ${
                  magicName.isSpecial ? 'text-yellow-300' : 'text-white'
                } drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                  {magicName.name}
                </div>
              </div>
            )}
            <FantasyPIXIRenderer
              width={window.innerWidth}
              height={200}
              monsterIcon={currentEnemy.icon}
              isMonsterAttacking={isMonsterAttacking}
              enemyGauge={gameState.enemyGauge}
              onReady={handleFantasyPixiReady}
              onMonsterDefeated={handleMonsterDefeated}
              onShowMagicName={handleShowMagicName}
              className="w-full h-full"
              activeMonsters={gameState.activeMonsters}
            />
          </div>
          
          {/* マルチモンスター情報表示 */}
          <div className="mt-2">
            {gameState.activeMonsters && gameState.activeMonsters.length > 0 ? (
              <div className="relative w-full" style={{ height: '100px' }}>
                {/* 各モンスターの情報を絶対位置で配置 */}
                {gameState.activeMonsters.map((monster) => {
                  // モンスターの位置に合わせて配置を計算
                  const getLeftPosition = (position: 'A' | 'B' | 'C') => {
                    const spacing = 25; // 25%間隔（画面の1/4, 2/4, 3/4の位置）
                    switch (position) {
                      case 'A': return `${spacing}%`;
                      case 'B': return `${spacing * 2}%`;
                      case 'C': return `${spacing * 3}%`;
                      default: return '50%';
                    }
                  };
                  
                  return (
                    <div 
                      key={monster.id} 
                      className="absolute transform -translate-x-1/2"
                      style={{ 
                        left: getLeftPosition(monster.position),
                        width: '140px'
                      }}
                    >
                      {/* コードネーム */}
                      <div className="text-yellow-300 text-lg font-bold text-center mb-1">
                        {monster.chordTarget.displayName}
                      </div>
                      
                      {/* 行動ゲージ */}
                      <div className="w-full h-2 bg-gray-700 border border-gray-600 rounded-full overflow-hidden relative mb-1">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-100"
                          style={{ width: `${monster.gauge}%` }}
                        />
                      </div>
                      
                      {/* モンスター名 */}
                      <div className="text-white text-xs font-bold text-center mb-1">
                        {monster.name}
                      </div>
                      
                      {/* HPゲージ */}
                      <div className="w-full h-3 bg-gray-700 border border-gray-600 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
                          style={{ width: `${(monster.currentHp / monster.maxHp) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                          {monster.currentHp}/{monster.maxHp}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 互換性のための旧表示
              <>
                <div className="text-white text-base font-bold mb-1">
                  {currentEnemy.name}
                </div>
                <div className="flex justify-center mb-1">
                  {renderEnemyGauge()}
                </div>
                <div className="flex flex-col items-center space-y-1 mt-1">
                  <div className="w-48 h-5 bg-gray-700 border-2 border-gray-600 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
                      style={{ width: `${(gameState.currentEnemyHp / gameState.maxEnemyHp) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {gameState.currentEnemyHp} / {gameState.maxEnemyHp}
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* プレイヤーのHP表示とSPゲージ */}
            <div className="flex items-center justify-center mt-2">
              <div className="flex items-center space-x-1">{renderHearts(gameState.playerHp, stage.maxHp, true)}</div>
              <div className="ml-4">{renderSpGauge(gameState.playerSp)}</div>
            </div>
          </div>
        </div>
        
        {/* NEXTコード表示（コード進行モード、サイズを縮小） */}
        {stage.mode === 'progression' && getNextChord() && (
          <div className="mb-1 text-right">
            <div className="text-white text-xs">NEXT:</div>
            <div className="text-blue-300 text-sm font-bold">
              {getNextChord()}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== ピアノ鍵盤エリア ===== */}
      <div 
        ref={gameAreaRef}
        className="relative mx-2 mb-1 bg-black bg-opacity-20 rounded-lg overflow-hidden flex-shrink-0 w-full"
        style={{ height: 'min(120px, 15vh)' }}
      >
        {(() => {
          // スクロール判定ロジック（GameEngine.tsxと同様）
          const VISIBLE_WHITE_KEYS = 14; // モバイル表示時の可視白鍵数
          const TOTAL_WHITE_KEYS = 52; // 88鍵中の白鍵数
          const gameAreaWidth = gameAreaRef.current?.clientWidth || window.innerWidth;
          const adjustedThreshold = 1100; // PC判定のしきい値
          
          let pixiWidth: number;
          let needsScroll: boolean;
          
          if (gameAreaWidth >= adjustedThreshold) {
            // PC等、画面が十分広い → 88鍵全表示（スクロール不要）
            pixiWidth = gameAreaWidth;
            needsScroll = false;
          } else {
            // モバイル等、画面が狭い → 横スクロール表示
            const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
            pixiWidth = Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth);
            needsScroll = true;
          }
          
          if (needsScroll) {
            // スクロールが必要な場合
            return (
              <div 
                className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x custom-game-scrollbar" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'x proximity',
                  scrollBehavior: 'smooth',
                  width: '100%',
                  touchAction: 'pan-x', // 横スクロールのみを許可
                  overscrollBehavior: 'contain' // スクロールの境界を制限
                }}
              >
                <PIXINotesRenderer
                  activeNotes={[]}
                  width={pixiWidth}
                  height={120}
                  currentTime={0}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          } else {
            // スクロールが不要な場合（全画面表示）
            return (
              <div className="absolute inset-0 overflow-hidden">
                <PIXINotesRenderer
                  activeNotes={[]}
                  width={pixiWidth}
                  height={120}
                  currentTime={0}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          }
        })()}
        
        {/* 入力中のノーツ表示 */}
        {inputBuffer.length > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg pointer-events-none">
            <div className="text-sm">入力中: {inputBuffer.length}音</div>
            <div className="text-xs text-gray-300">
              {inputBuffer.map(note => {
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                return noteNames[note % 12];
              }).join(', ')}
            </div>
          </div>
        )}
      </div>
      
      {/* エフェクト表示は削除 - PIXI側で処理 */}
      
      {/* デバッグ情報（FPSモニター削除済み） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-40">
          <div>Q: {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}</div>
          <div>HP: {gameState.playerHp}/{stage.maxHp}</div>
          <div>ゲージ: {gameState.enemyGauge.toFixed(1)}%</div>
          <div>スコア: {gameState.score}</div>
          <div>正解数: {gameState.correctAnswers}</div>
          <div>現在のコード: {gameState.currentChordTarget.displayName}</div>
          <div>SP: {gameState.playerSp}</div>
          <div>入力バッファ: [{inputBuffer.join(', ')}]</div>
          
          {/* ゲージ強制満タンテストボタン */}
          <button
            onClick={() => {
              devLog.debug('⚡ ゲージ強制満タンテスト実行');
              // ゲージを100にして敵攻撃をトリガー
              handleEnemyAttack();
            }}
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
          >
            敵攻撃テスト
          </button>
        </div>
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChange={(settings) => {
          devLog.debug('⚙️ ファンタジー設定変更:', settings);
          setShowGuide(settings.showGuide);
        }}
        midiDeviceId={midiDeviceId}
        onMidiDeviceChange={setMidiDeviceId}
        isMidiConnected={isMidiConnected}
      />
    </div>
  );
};

export default FantasyGameScreen;