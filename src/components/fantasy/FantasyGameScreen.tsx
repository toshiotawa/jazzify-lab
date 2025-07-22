/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// ファンタジーモード設定の型定義
interface FantasySettings {
  midiDeviceId: string | null;
  volume: number;
  showGuide: boolean;
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
  
  // 設定モーダル状態と設定値
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [fantasySettings, setFantasySettings] = useState<FantasySettings>({
    midiDeviceId: null,
    volume: 0.8,
    showGuide: true // デフォルトでハイライトON
  });
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 }); // ファンタジーモード用に高さを大幅に縮小
  
  // 🎹 鍵盤ハイライト更新関数
  const updateKeyboardHighlight = useCallback((currentChord: ChordDefinition | null) => {
    if (!pixiRenderer) return;

    // まず全ての鍵盤のハイライトをクリア
    for (let note = 21; note <= 108; note++) {
      pixiRenderer.highlightKey(note, false);
    }

    // ガイド表示がONかつ現在のコードがある場合のみハイライト
    if (fantasySettings.showGuide && currentChord) {
      devLog.debug('🎹 鍵盤ハイライト更新:', {
        chord: currentChord.displayName,
        notes: currentChord.notes,
        showGuide: fantasySettings.showGuide
      });

      // 現在のコードの構成音をハイライト
      currentChord.notes.forEach(note => {
        pixiRenderer.highlightKey(note, true);
      });
    }
  }, [pixiRenderer, fantasySettings.showGuide]);

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

    // 🎹 鍵盤ハイライト更新
    updateKeyboardHighlight(state.currentChordTarget);
  }, [updateKeyboardHighlight]);

  // 設定変更ハンドラー
  const handleFantasySettingsChange = useCallback((newSettings: FantasySettings) => {
    devLog.debug('⚙️ ファンタジー設定変更:', newSettings);
    const prevShowGuide = fantasySettings.showGuide;
    setFantasySettings(newSettings);
    
    // 鍵盤ハイライト設定が変更された場合、即座に反映
    if (newSettings.showGuide !== prevShowGuide) {
      // setStateの更新は非同期なので、新しい設定値を直接使用
      if (!pixiRenderer) return;
      
      // まず全ての鍵盤のハイライトをクリア
      for (let note = 21; note <= 108; note++) {
        pixiRenderer.highlightKey(note, false);
      }
      
      // 新しい設定でハイライト更新
      if (newSettings.showGuide && gameState.currentChordTarget) {
        gameState.currentChordTarget.notes.forEach(note => {
          pixiRenderer.highlightKey(note, true);
        });
      }
    }
  }, [fantasySettings.showGuide, pixiRenderer, gameState.currentChordTarget]);
  
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
    stage,
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
  }, [handleNoteInput, engineHandleNoteInput]);
  
  // PIXI.jsレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    setPixiRenderer(renderer);
    
    if (renderer) {
      // ファンタジーモード用の設定を適用（動的幅計算）
      const totalKeys = 52; // 白鍵の数（C1〜C5）
      const dynamicNoteWidth = Math.max(gameAreaSize.width / totalKeys, 16); // 動的計算、最小16px
      
      renderer.updateSettings({
        noteNameStyle: 'abc',
        simpleDisplayMode: true, // シンプル表示モードを有効
        pianoHeight: 120, // ファンタジーモード用に大幅に縮小
        noteHeight: 16, // 音符の高さも縮小
        noteWidth: dynamicNoteWidth, // コンテナ幅に基づく動的計算
        transpose: 0,
        transposingInstrument: 'concert_pitch',
        practiceGuide: stage.showGuide ? 'key' : 'off', // ガイド表示設定に基づく
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
        (note: number) => { /* キー離す処理は必要に応じて */ }
      );
      
      // 🎹 初期ハイライト設定を適用
      setTimeout(() => {
        updateKeyboardHighlight(gameState.currentChordTarget);
      }, 100); // PIXIレンダラーの初期化完了を待つ
      
      devLog.debug('🎮 PIXI.js ファンタジーモード準備完了');
    }
  }, [handleNoteInputBridge, gameAreaSize, updateKeyboardHighlight, gameState.currentChordTarget]);

  // ファンタジーPIXIレンダラーの準備完了ハンドラー
  const handleFantasyPixiReady = useCallback((instance: FantasyPIXIInstance) => {
    setFantasyPixiInstance(instance);
    
    // 現在の敵に基づいてモンスターを設定
    instance.createMonsterSprite(currentEnemy.icon);
    
    devLog.debug('🎮 ファンタジーPIXI準備完了:', { monster: currentEnemy.icon });
  }, [currentEnemy.icon]);
  
  // FontAwesome使用のため削除済み
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: Math.max(rect.width || 1000, 800), // 最小幅800pxを確保
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
      fantasyPixiInstance.createMonsterSprite(currentEnemy.icon);
      devLog.debug('🔄 モンスタースプライト更新:', { monster: currentEnemy.icon });
    }
  }, [fantasyPixiInstance, currentEnemy]);

  // 🎹 ゲーム状態変更時にハイライト更新
  useEffect(() => {
    updateKeyboardHighlight(gameState.currentChordTarget);
  }, [gameState.currentChordTarget, updateKeyboardHighlight]);

  // 🎹 設定変更時にハイライト更新
  useEffect(() => {
    updateKeyboardHighlight(gameState.currentChordTarget);
  }, [fantasySettings.showGuide, updateKeyboardHighlight, gameState.currentChordTarget]);
  
  // HPハート表示（モノクロ）
  const renderHearts = useCallback(() => {
    const hearts = [];
    // gameState.playerHpが正しく更新されているか確認
    console.log('現在のHP:', gameState.playerHp, '/', stage.maxHp);
    
    for (let i = 0; i < stage.maxHp; i++) {
      hearts.push(
        <span key={i} className={cn(
          "text-2xl transition-all duration-200",
          i < gameState.playerHp ? "text-gray-800" : "text-gray-300"
        )}>
          ♡
        </span>
      );
    }
    return hearts;
  }, [stage.maxHp, gameState.playerHp]);
  
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
        <div className="mb-2 text-center relative">
          <div className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden" style={{ height: 'min(200px, 30vh)' }}>
            <FantasyPIXIRenderer
              width={800}
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
          
          {/* HP表示 */}
          <div className="flex justify-center items-center space-x-1">
            <span className="text-white text-xs mr-1">HP:</span>
            {renderHearts()}
          </div>
          
          {/* 敵のHP表示 */}
          <div className="flex justify-center items-center space-x-1 mt-1">
            <span className="text-white text-xs mr-1">敵HP:</span>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="text-lg text-gray-400">♡</span>
            ))}
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
        className="relative mx-2 mb-1 bg-black bg-opacity-20 rounded-lg overflow-hidden flex-shrink-0"
        style={{ height: 'min(120px, 15vh)' }}
      >
        <div 
          className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x custom-game-scrollbar" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity',
            scrollBehavior: 'smooth'
          }}
        >
          <PIXINotesRenderer
            activeNotes={[]}
            width={Math.max(gameAreaSize.width, 1200)} // 横幅いっぱいに設定
            height={120}
            currentTime={0}
            onReady={handlePixiReady}
            className="w-full h-full"
          />
        </div>
        
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
        onSettingsChange={handleFantasySettingsChange}
      />
    </div>
  );
};

export default FantasyGameScreen;