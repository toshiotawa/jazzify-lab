/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState } from './FantasyGameEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';

interface FantasyGameScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
}

// ===== モンスターアイコンマッピング =====
const MONSTER_ICONS: Record<string, string> = {
  'ghost': '👻',
  'tree': '🌳',
  'seedling': '🌱',
  'droplet': '💧',
  'sun': '☀️',
  'rock': '🪨',
  'sparkles': '✨',
  'gem': '💎',
  'wind_face': '🌬️',
  'zap': '⚡',
  'star2': '⭐'
};

// ===== マジックエフェクト処理 =====
interface MagicEffect {
  id: string;
  type: 'magic_circle' | 'particles';
  x: number;
  y: number;
  timestamp: number;
}

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect
}) => {
  const { handleNoteInput } = useGameStore();
  
  // エフェクト状態
  const [magicEffects, setMagicEffects] = useState<MagicEffect[]>([]);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [showIncorrectEffect, setShowIncorrectEffect] = useState(false);
  const [isMonsterAttacking, setIsMonsterAttacking] = useState(false);
  const [damageShake, setDamageShake] = useState(false);
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 800, height: 600 });
  
  // ゲームエンジン コールバック
  const handleGameStateChange = useCallback((state: FantasyGameState) => {
    devLog.debug('🎮 ファンタジーゲーム状態更新:', state);
  }, []);
  
  const handleChordCorrect = useCallback((chord: ChordDefinition) => {
    devLog.debug('✅ 正解:', chord.displayName);
    
    // 魔法陣エフェクト表示
    setShowCorrectEffect(true);
    setTimeout(() => setShowCorrectEffect(false), 800);
    
    // パーティクルエフェクト生成
    const effect: MagicEffect = {
      id: `magic_${Date.now()}`,
      type: 'magic_circle',
      x: Math.random() * gameAreaSize.width,
      y: Math.random() * (gameAreaSize.height * 0.6),
      timestamp: Date.now()
    };
    
    setMagicEffects(prev => [...prev, effect]);
    
    // エフェクトを3秒後に削除
    setTimeout(() => {
      setMagicEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 3000);
    
  }, [gameAreaSize]);
  
  const handleChordIncorrect = useCallback((expectedChord: ChordDefinition, inputNotes: number[]) => {
    devLog.debug('❌ 不正解:', { expected: expectedChord.displayName, input: inputNotes });
    
    // 不正解エフェクト表示
    setShowIncorrectEffect(true);
    setTimeout(() => setShowIncorrectEffect(false), 500);
    
  }, []);
  
  const handleEnemyAttack = useCallback(() => {
    devLog.debug('💥 敵の攻撃!');
    
    // モンスター攻撃アニメーション
    setIsMonsterAttacking(true);
    setTimeout(() => setIsMonsterAttacking(false), 600);
    
    // ダメージ時の画面振動
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
  }, []);
  
  const handleGameCompleteCallback = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    devLog.debug('🏁 ゲーム終了:', { result, finalState });
    onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
  }, [onGameComplete]);
  
  // ゲームエンジンの初期化
  const {
    gameState,
    inputBuffer,
    handleNoteInput: engineHandleNoteInput,
    submitCurrentInput,
    initializeGame,
    stopGame
  } = useFantasyGameEngine({
    stage,
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack
  });
  
  // MIDI/音声入力のハンドリング
  const handleNoteInputBridge = useCallback((note: number) => {
    // 通常のゲームストアの入力処理
    handleNoteInput(note);
    
    // ファンタジーゲームエンジンにも送信
    engineHandleNoteInput(note);
  }, [handleNoteInput, engineHandleNoteInput]);
  
  // PIXI.jsレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    setPixiRenderer(renderer);
    
    if (renderer) {
      // ファンタジーモード用の設定を適用
      renderer.updateSettings({
        noteNameStyle: 'abc',
        simpleDisplayMode: false,
        pianoHeight: 100,
        transpose: 0,
        transposingInstrument: 'concert_pitch',
        practiceGuide: 'off' // ファンタジーモードでは練習ガイドを無効
      });
      
      // キーボードのクリックイベントを接続
      renderer.setKeyCallbacks(
        (note: number) => handleNoteInputBridge(note),
        (note: number) => { /* キー離す処理は必要に応じて */ }
      );
      
      devLog.debug('🎮 PIXI.js ファンタジーモード準備完了');
    }
  }, [handleNoteInputBridge]);
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: rect.width || 800,
        height: rect.height || 600
      };
      setGameAreaSize(newSize);
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
  
  // HPハート表示
  const renderHearts = useCallback(() => {
    const hearts = [];
    for (let i = 0; i < stage.maxHp; i++) {
      hearts.push(
        <span key={i} className={cn(
          "text-2xl transition-all duration-200",
          i < gameState.playerHp ? "text-red-500" : "text-gray-400"
        )}>
          ❤️
        </span>
      );
    }
    return hearts;
  }, [stage.maxHp, gameState.playerHp]);
  
  // 敵のゲージ表示
  const renderEnemyGauge = useCallback(() => {
    const filledBlocks = Math.floor(gameState.enemyGauge / 10);
    const blocks = [];
    
    for (let i = 0; i < 10; i++) {
      blocks.push(
        <div key={i} className={cn(
          "w-6 h-4 border border-gray-600 transition-all duration-100",
          i < filledBlocks ? "bg-red-500" : "bg-gray-700"
        )} />
      );
    }
    
    return (
      <div className="flex space-x-1 mt-2">
        {blocks}
      </div>
    );
  }, [gameState.enemyGauge]);
  
  // NEXTコード表示（コード進行モード用）
  const getNextChord = useCallback(() => {
    if (stage.mode !== 'progression' || !stage.chordProgression) return null;
    
    const nextIndex = (gameState.currentQuestionIndex + 1) % stage.chordProgression.length;
    return stage.chordProgression[nextIndex];
  }, [stage.mode, stage.chordProgression, gameState.currentQuestionIndex]);
  
  if (!gameState.currentChordTarget) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">ファンタジーモード準備中...</h2>
          <p className="text-indigo-200 mt-2">{stage.name}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden select-none",
      damageShake && "animate-pulse"
    )}>
      {/* ===== ヘッダー ===== */}
      <div className="relative z-30 p-4 text-white">
        <div className="flex justify-between items-center">
          {/* ステージ情報とスコア */}
          <div className="flex items-center space-x-6">
            <div className="text-lg font-bold">
              Stage {stage.stageNumber}
            </div>
            <div className="text-sm">
              Score: {gameState.score}/{gameState.totalQuestions * 1000}
            </div>
            <div className="flex items-center space-x-1">
              {renderHearts()}
            </div>
          </div>
          
          {/* 戻るボタン */}
          <button
            onClick={onBackToStageSelect}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            ステージ選択に戻る
          </button>
        </div>
      </div>
      
      {/* ===== メインゲームエリア ===== */}
      <div className="flex flex-col items-center px-4 pb-4 relative z-20">
        {/* 弱点コード表示 */}
        <div className="mb-4 text-center">
          <div className="text-white text-lg font-medium mb-1">弱点:</div>
          <div className="text-yellow-300 text-4xl font-bold tracking-wider">
            {gameState.currentChordTarget.displayName}
          </div>
        </div>
        
        {/* 楽譜表示エリア（オプション） */}
        {stage.showSheetMusic && (
          <div className="mb-4 bg-white bg-opacity-90 rounded-lg p-4 min-h-24 flex items-center justify-center">
            <div className="text-gray-600 text-sm">♪ 五線譜表示 ♪</div>
            {/* 実際の楽譜表示はOpenSheetMusicDisplayコンポーネントで実装予定 */}
          </div>
        )}
        
        {/* モンスターとゲージ */}
        <div className="mb-6 text-center relative">
          <div className={cn(
            "text-8xl transition-all duration-300 mb-2",
            isMonsterAttacking && "transform scale-125 text-red-500"
          )}>
            {MONSTER_ICONS[stage.monsterIcon] || '👻'}
          </div>
          
          {/* 敵の行動ゲージ */}
          <div className="flex justify-center">
            {renderEnemyGauge()}
          </div>
          
          {/* 怒りマーク（攻撃時） */}
          {isMonsterAttacking && (
            <div className="absolute top-0 right-0 text-red-500 text-3xl animate-bounce">
              💢
            </div>
          )}
        </div>
        
        {/* NEXTコード表示（コード進行モード） */}
        {stage.mode === 'progression' && getNextChord() && (
          <div className="mb-4 text-right">
            <div className="text-white text-sm">NEXT:</div>
            <div className="text-blue-300 text-xl font-bold">
              {getNextChord()}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== ピアノ鍵盤エリア ===== */}
      <div 
        ref={gameAreaRef}
        className="relative flex-1 min-h-32 bg-black bg-opacity-30 mx-4 rounded-lg overflow-hidden"
      >
        <PIXINotesRenderer
          activeNotes={[]} // ファンタジーモードでは通常のアクティブノーツは使用しない
          width={gameAreaSize.width}
          height={gameAreaSize.height}
          currentTime={0} // ファンタジーモードでは時間進行なし
          onReady={handlePixiReady}
          className="w-full h-full"
        />
        
        {/* 入力中のノーツ表示 */}
        {inputBuffer.length > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
            <div className="text-sm">入力中: {inputBuffer.length}音</div>
            <div className="text-xs text-gray-300">
              {inputBuffer.map(note => note % 12).join(', ')}
            </div>
          </div>
        )}
        
        {/* 手動判定ボタン */}
        {inputBuffer.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={submitCurrentInput}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all"
            >
              魔法発動！
            </button>
          </div>
        )}
      </div>
      
      {/* ===== エフェクト表示 ===== */}
      {/* 正解時の魔法陣エフェクト */}
      {showCorrectEffect && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="animate-spin text-9xl text-yellow-300">✨</div>
          <div className="absolute text-3xl font-bold text-white animate-bounce">
            SUCCESS!
          </div>
        </div>
      )}
      
      {/* 不正解エフェクト */}
      {showIncorrectEffect && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-6xl text-red-500 animate-pulse">❌</div>
        </div>
      )}
      
      {/* パーティクルエフェクト */}
      {magicEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none z-30 animate-ping"
          style={{
            left: effect.x,
            top: effect.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {effect.type === 'magic_circle' && (
            <div className="text-4xl text-blue-400">🔮</div>
          )}
        </div>
      ))}
      
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-40">
          <div>Q: {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}</div>
          <div>HP: {gameState.playerHp}/{stage.maxHp}</div>
          <div>ゲージ: {gameState.enemyGauge.toFixed(1)}%</div>
          <div>スコア: {gameState.score}</div>
          <div>正解数: {gameState.correctAnswers}</div>
          <div>現在のコード: {gameState.currentChordTarget.displayName}</div>
          <div>入力バッファ: [{inputBuffer.join(', ')}]</div>
        </div>
      )}
    </div>
  );
};

export default FantasyGameScreen;