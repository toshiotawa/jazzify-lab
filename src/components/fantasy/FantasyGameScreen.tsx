/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState } from './FantasyGameEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';
import { playNote, stopNote, initializeAudioSystem } from '@/utils/MidiController';
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
  const { handleNoteInput } = useGameStore();
  
  // エフェクト状態
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [damageShake, setDamageShake] = useState(false);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理（初期値はstageから取得）
  const [showGuide, setShowGuide] = useState(stage.showGuide);
  
  // stage.showGuide の変更をコンポーネントの状態に同期させる
  useEffect(() => {
    setShowGuide(stage.showGuide);
  }, [stage.showGuide]);
  
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
  
  const handleChordCorrect = useCallback((chord: ChordDefinition) => {
    devLog.debug('✅ 正解:', chord.displayName);
    
    // ファンタジーPIXIエフェクトをトリガー
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerAttackSuccess();
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
  
  // useMemoを使って、stageオブジェクトをメモ化（安定化）させる
  const memoizedStage = useMemo(() => ({
    ...stage,
    showGuide,
  }), [stage, showGuide]);
  
  // ゲームエンジンの初期化
  const {
    gameState,
    inputBuffer,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    getCurrentEnemy,
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: memoizedStage, // メモ化したstageを渡す
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack
  });
  
  // 現在の敵情報を取得
  const currentEnemy = getCurrentEnemy(gameState.currentEnemyIndex);
  
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
      await playNote(note, 127);
    } catch (error) {
      devLog.debug('🎹 音声再生エラー:', error);
    }
    
    // 通常のゲームストアの入力処理
    handleNoteInput(note);
    
    // ファンタジーゲームエンジンにも送信
    engineHandleNoteInput(note);
  }, [handleNoteInput, engineHandleNoteInput, pixiRenderer]);
  
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
        },
        // スクロール設定を追加
        keyboardRange: {
          startNote: 36, // C2
          endNote: 84   // C6 (48音域)
        }
      });
      
      // キーボードのクリックイベントを接続
      renderer.setKeyCallbacks(
        (note: number) => handleNoteInputBridge(note),
        (note: number) => { /* キー離す処理は必要に応じて */ }
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
    setFantasyPixiInstance(instance);
    
    // 現在の敵に基づいてモンスターを設定
    if (currentEnemy) {
      instance.createMonsterSprite(currentEnemy.icon);
    }
    
    devLog.debug('🎮 ファンタジーPIXI準備完了:', { monster: currentEnemy?.icon });
  }, [currentEnemy]);
  
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

  // 敵が変更された時にモンスタースプライトを更新
  useEffect(() => {
    if (fantasyPixiInstance && currentEnemy) {
      // 敵が倒された後の場合は、少し遅延を入れて新しいモンスターを生成
      // これにより、前の敵のフェードアウトが完了してから新しい敵が出現する
      const isEnemyDefeated = gameState.currentEnemyHits === 0 && gameState.currentEnemyIndex > 0;
      const delay = isEnemyDefeated ? 1000 : 0; // 1秒の遅延
      
      const timeoutId = setTimeout(() => {
        if (fantasyPixiInstance && currentEnemy) {
          fantasyPixiInstance.createMonsterSprite(currentEnemy.icon);
          devLog.debug('🔄 モンスタースプライト更新:', { 
            monster: currentEnemy.icon,
            enemyIndex: gameState.currentEnemyIndex,
            delay: delay
          });
        }
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fantasyPixiInstance, currentEnemy, gameState.currentEnemyIndex, gameState.currentEnemyHits]);
  
  // 設定変更時にPIXIレンダラーを更新
  useEffect(() => {
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        practiceGuide: showGuide ? 'key' : 'off'
      });
      devLog.debug('🎮 PIXIレンダラー設定更新:', { showGuide });
    }
  }, [pixiRenderer, showGuide]);
  
  // 現在のコードターゲットのノートをハイライト
  useEffect(() => {
    if (pixiRenderer && showGuide && gameState.currentChordTarget) {
      // 全てのキーのハイライトを一度クリア
      for (let note = 0; note < 128; note++) {
        pixiRenderer.highlightKey(note, false);
      }
      
      // 現在のコードのノートをハイライト
      gameState.currentChordTarget.notes.forEach(note => {
        // オクターブ違いの音もハイライト（ピッチクラスで判定）
        const pitchClass = note % 12;
        for (let octave = 0; octave < 11; octave++) {
          const midiNote = octave * 12 + pitchClass;
          if (midiNote < 128) {
            pixiRenderer.highlightKey(midiNote, true);
          }
        }
      });
      
      devLog.debug('🎹 コードノートハイライト:', { 
        chord: gameState.currentChordTarget.displayName,
        notes: gameState.currentChordTarget.notes,
        showGuide
      });
    } else if (pixiRenderer && !showGuide) {
      // ガイドがOFFの場合は全てのハイライトをクリア
      for (let note = 0; note < 128; note++) {
        pixiRenderer.highlightKey(note, false);
      }
    }
  }, [pixiRenderer, showGuide, gameState.currentChordTarget]);
  
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
              initializeGame();
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
              敵の数: {Math.ceil(stage.questionCount / 5)}
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
        {/* コード表示（サイズを縮小） */}
        <div className="mb-1 text-center">
          <div className="text-yellow-300 text-2xl font-bold tracking-wider drop-shadow-lg">
            {gameState.currentChordTarget.displayName}
          </div>
        </div>
        
        {/* ファンタジーPIXIレンダラー（モンスターとエフェクト） */}
        <div className="mb-2 text-center relative w-full">
          <div className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden" style={{ height: 'min(200px, 30vh)' }}>
            <FantasyPIXIRenderer
              width={window.innerWidth}
              height={200}
              monsterIcon={currentEnemy.icon}
              isMonsterAttacking={isMonsterAttacking}
              enemyGauge={gameState.enemyGauge}
              onReady={handleFantasyPixiReady}
              className="w-full h-full"
            />
          </div>
          
          {/* 敵の名前 */}
          <div className="text-white text-base font-bold mb-1">
            {currentEnemy.name}
          </div>
          
          {/* 敵の行動ゲージ */}
          <div className="flex justify-center mb-1">
            {renderEnemyGauge()}
          </div>
          
          {/* HP表示（縦並び、相手が上、自分が下） */}
          <div className="flex flex-col items-center space-y-2 mt-1">
            {/* 敵のHP表示（上） */}
            <div className="flex items-center">
              {renderHearts(gameState.currentEnemyHp, gameState.maxEnemyHp, false)}
            </div>
            
            {/* プレイヤーのHP表示（下） */}
            <div className="flex items-center">
              {renderHearts(gameState.playerHp, stage.maxHp, true)}
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
      />
    </div>
  );
};

export default FantasyGameScreen;