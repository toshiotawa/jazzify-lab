/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterState, AttackType } from './FantasyGameEngine';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';
import { playNote, stopNote, initializeAudioSystem } from '@/utils/MidiController';
import FantasySettingsModal from './FantasySettingsModal';
import FantasyMonster from './FantasyMonster'; // 追加: FantasyMonsterコンポーネントをインポート

interface FantasyGameScreenProps {
  stage: FantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
}

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect
}) => {
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [healEffect, setHealEffect] = useState(false);
  const [shieldEffect, setShieldEffect] = useState(false);
  const [missTouchEffect, setMissTouchEffect] = useState(false);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理（初期値はstageから取得）
  const [showGuide, setShowGuide] = useState(stage.showGuide);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ name: string; isSpecial: boolean; isSelf?: boolean } | null>(null);
  
  // ダメージ表示
  const [damageNumbers, setDamageNumbers] = useState<{ id: string; damage: number; x: number; y: number; isHeal?: boolean }[]>([]);
  
  // stage.showGuide の変更をコンポーネントの状態に同期させる
  useEffect(() => {
    setShowGuide(stage.showGuide);
  }, [stage.showGuide]);
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 });
  
  // ゲームエンジン コールバック
  const handleGameStateChange = useCallback((state: FantasyGameState) => {
    devLog.debug('🎮 ファンタジーゲーム状態更新:', {
      playerHp: state.playerHp,
      playerMaxHp: state.playerMaxHp,
      playerSp: state.playerSp,
      playerShields: state.playerShields,
      activeMonsters: state.activeMonsters.length,
      enemiesDefeated: state.enemiesDefeated,
      totalEnemies: state.totalEnemies,
      isGameActive: state.isGameActive,
      score: state.score
    });
  }, []);
  
  const handleChordCorrect = useCallback((chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, attackType: AttackType) => {
    devLog.debug('✅ 正解:', { name: chord.displayName, special: isSpecial, damage: damageDealt, defeated, attackType });
    
    // 魔法名表示
    let magicNameText = '';
    if (attackType === 'fire') magicNameText = 'ファイア';
    else if (attackType === 'ice') magicNameText = 'ブリザード';
    else if (attackType === 'thunder') magicNameText = 'サンダー';
    else if (attackType === 'protect') magicNameText = 'プロテクト';
    else if (attackType === 'hyper_heal') magicNameText = 'ハイパーヒール';
    else if (attackType === 'aegis_protection') magicNameText = 'イージスプロテクション';
    else magicNameText = 'アタック';
    
    const isSelfMagic = ['protect', 'hyper_heal', 'aegis_protection'].includes(attackType);
    
    setMagicName({ name: magicNameText, isSpecial, isSelf: isSelfMagic });
    setTimeout(() => setMagicName(null), 2000);
    
    // エフェクト
    if (attackType === 'protect' || attackType === 'aegis_protection') {
      setShieldEffect(true);
      setTimeout(() => setShieldEffect(false), 1000);
    } else if (attackType === 'hyper_heal') {
      setHealEffect(true);
      setTimeout(() => setHealEffect(false), 1000);
    }
    
    // ファンタジーPIXIエフェクトをトリガー
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerAttackSuccess(chord.displayName, isSpecial, damageDealt, defeated);
    }
  }, [fantasyPixiInstance]);
  
  const handleChordIncorrect = useCallback((expectedChord: ChordDefinition, inputNotes: number[]) => {
    devLog.debug('🎵 まだ構成音が足りません:', { expected: expectedChord.displayName, input: inputNotes });
  }, []);
  
  const handleEnemyAttack = useCallback((damage: number, enemyId: string) => {
    devLog.debug('💥 敵の攻撃!', { damage, enemyId });
    
    // ダメージエフェクト
    if (damage > 0) {
      setDamageShake(true);
      setTimeout(() => setDamageShake(false), 600);
      
      // ダメージ数値表示
      const id = `damage_${Date.now()}`;
      setDamageNumbers(prev => [...prev, { id, damage, x: 500, y: 400 }]);
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== id));
      }, 1000);
    }
    
    // ファンタジーPIXIでモンスター攻撃エフェクト
    if (fantasyPixiInstance) {
      const monster = fantasyPixiInstance.getMonsterById?.(enemyId);
      if (monster) {
        fantasyPixiInstance.updateMonsterAttacking(true);
        setTimeout(() => {
          if (fantasyPixiInstance) {
            fantasyPixiInstance.updateMonsterAttacking(false);
          }
        }, 600);
      }
    }
  }, [fantasyPixiInstance]);
  
  const handlePlayerHeal = useCallback((amount: number) => {
    devLog.debug('💚 プレイヤー回復!', { amount });
    
    // 回復数値表示
    const id = `heal_${Date.now()}`;
    setDamageNumbers(prev => [...prev, { id, damage: amount, x: 500, y: 400, isHeal: true }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 1000);
  }, []);
  
  const handleStatusEffect = useCallback((monsterId: string, effect: 'burn' | 'freeze' | 'paralysis') => {
    devLog.debug('🔥 状態異常付与!', { monsterId, effect });
    
    // PIXIで状態異常エフェクトを表示
    if (fantasyPixiInstance) {
      fantasyPixiInstance.setMonsterStatusEffect?.(monsterId, effect);
    }
  }, [fantasyPixiInstance]);
  
  const handleMonsterHeal = useCallback((monsterId: string, amount: number) => {
    devLog.debug('💚 モンスター回復!', { monsterId, amount });
    
    // TODO: モンスターの回復エフェクト
  }, []);
  
  const handleMissTouch = useCallback(() => {
    devLog.debug('❌ ミスタッチ！');
    
    setMissTouchEffect(true);
    setTimeout(() => setMissTouchEffect(false), 500);
    
    // PIXIでミスタッチエフェクト
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerMissTouch?.();
    }
  }, [fantasyPixiInstance]);
  
  const handleGameComplete = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    devLog.debug('🎮 ゲーム終了:', { result, score: finalState.score });
    
    setTimeout(() => {
      onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
    }, result === 'clear' ? 1500 : 1000);
  }, [onGameComplete]);
  
  // ゲームエンジン初期化
  const { gameState, handleNoteInput, initializeGame } = useFantasyGameEngine({
    stage,
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameComplete,
    onEnemyAttack: handleEnemyAttack,
    onPlayerHeal: handlePlayerHeal,
    onStatusEffect: handleStatusEffect,
    onMonsterHeal: handleMonsterHeal,
    onMissTouch: handleMissTouch
  });
  
  // 現在の敵情報を取得
  const currentEnemy = gameState.activeMonsters[0]; // 仮に最初のモンスターを表示
  
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
      await playNote(note, 127);
    } catch (error) {
      devLog.debug('🎹 音声再生エラー:', error);
    }
    
    // ファンタジーゲームエンジンにのみ送信（重複を防ぐため）
    handleNoteInput(note);
  }, [handleNoteInput, pixiRenderer]);
  
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
    // ここでは、ゲームエンジンの proceedToNextEnemy は削除されたため、
    // モンスターが消滅したことをエンジンに伝える必要がある。
    // 仮に、ゲームエンジンの状態を更新するか、エンジンに新しい敵を生成させる。
    // 現在の実装では、ゲームエンジンは stage と onGameComplete を受け取るため、
    // モンスターの消滅はエンジンの内部で処理される。
    // このコールバックは、PIXI側でモンスターが消滅したことをエンジンに伝えるために残す。
  }, []);
  
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{stage.name}</h1>
          <p className="text-sm text-gray-300">{stage.description}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>⚙️</span>
            設定
          </button>
          <button
            onClick={onBackToStageSelect}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ステージ選択へ
          </button>
        </div>
      </div>
      
      {/* ゲーム画面 */}
      <div className={cn(
        "flex-1 p-4 transition-all duration-300",
        damageShake && "animate-shake",
        missTouchEffect && "bg-red-900"
      )}>
        <div className="max-w-7xl mx-auto flex gap-4 h-full">
          {/* 左側: プレイヤー情報 */}
          <div className="w-64 bg-gray-800 rounded-lg p-4">
            <h2 className="text-white text-lg font-bold mb-4">プレイヤー</h2>
            
            {/* HP */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>HP</span>
                <span>{gameState.playerHp}/{gameState.playerMaxHp}</span>
              </div>
              <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${(gameState.playerHp / gameState.playerMaxHp) * 100}%` }}
                />
              </div>
            </div>
            
            {/* SP */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>SP</span>
                <span>{gameState.playerSp}/5</span>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-4 rounded transition-all duration-300",
                      i < gameState.playerSp ? "bg-blue-500" : "bg-gray-700"
                    )}
                  />
                ))}
              </div>
            </div>
            
            {/* シールド */}
            {gameState.playerShields > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-300 mb-1">シールド</div>
                <div className="flex gap-1">
                  {[...Array(gameState.playerShields)].map((_, i) => (
                    <div key={i} className="text-2xl">🛡️</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* スコア */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-300">
                <div>スコア: {gameState.score}</div>
                <div>撃破数: {gameState.enemiesDefeated}/{gameState.totalEnemies}</div>
              </div>
            </div>
            
            {/* 魔法名表示（自分への魔法） */}
            {magicName && magicName.isSelf && (
              <div className={cn(
                "mt-4 text-center text-xl font-bold animate-fadeIn",
                magicName.isSpecial ? "text-yellow-400" : "text-white"
              )}>
                {magicName.name}
              </div>
            )}
          </div>
          
          {/* 中央: ゲームエリア */}
          <div className="flex-1 bg-gray-800 rounded-lg relative overflow-hidden">
            <div className="h-full relative" ref={gameAreaRef}>
              {/* モンスター表示エリア */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-8 max-w-4xl w-full">
                  {[0, 1, 2].map(position => {
                    const monster = gameState.activeMonsters.find(m => m.position === position);
                    if (!monster) {
                      return <div key={position} className="w-full" />;
                    }
                    
                    return (
                      <div key={monster.id} className="text-center">
                        {/* モンスターアイコン（FantasyMonsterコンポーネントを使用） */}
                        <FantasyMonster
                          monsterIcon={stage.monsterIcon}
                          isAttacking={false}
                          hp={monster.hp}
                          maxHp={monster.maxHp}
                          enemyGauge={monster.attackGauge}
                          size="medium"
                          className={cn(
                            "transition-all duration-300",
                            monster.isBoss && "scale-150",
                            monster.isHealer && "text-green-400"
                          )}
                        />
                        
                        {/* コード名 */}
                        <div className="mt-2 text-white text-lg font-bold">
                          {monster.chordDefinition.displayName}
                        </div>
                        
                        {/* 正解した音 */}
                        {monster.correctNotes.length > 0 && (
                          <div className="mt-1 text-green-400 text-sm">
                            ✓ {monster.correctNotes.length}/{monster.chordDefinition.notes.length}
                          </div>
                        )}
                        
                        {/* 状態異常 */}
                        {monster.statusEffect && (
                          <div className={cn(
                            "mt-1 text-sm font-bold",
                            monster.statusEffect.type === 'burn' && "text-orange-400",
                            monster.statusEffect.type === 'freeze' && "text-cyan-400",
                            monster.statusEffect.type === 'paralysis' && "text-yellow-400"
                          )}>
                            {monster.statusEffect.type === 'burn' && "やけど"}
                            {monster.statusEffect.type === 'freeze' && "こおり"}
                            {monster.statusEffect.type === 'paralysis' && "まひ"}
                            ({Math.ceil(monster.statusEffect.remainingTime)}s)
                          </div>
                        )}
                        
                        {/* シールド */}
                        {monster.shields > 0 && (
                          <div className="mt-1 flex justify-center gap-1">
                            {[...Array(monster.shields)].map((_, i) => (
                              <div key={i} className="text-lg">🛡️</div>
                            ))}
                          </div>
                        )}
                        
                        {/* ヒーラー/ボス表示 */}
                        {(monster.isHealer || monster.isBoss) && (
                          <div className="mt-1 text-xs text-gray-400">
                            {monster.isHealer && "ヒーラー"}
                            {monster.isBoss && "ボス"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 魔法名表示（敵への魔法） */}
              {magicName && !magicName.isSelf && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className={cn(
                    "text-4xl font-bold animate-fadeIn",
                    magicName.isSpecial ? "text-yellow-400" : "text-white"
                  )}>
                    {magicName.name}
                  </div>
                </div>
              )}
              
              {/* ダメージ数値 */}
              {damageNumbers.map(dmg => (
                <div
                  key={dmg.id}
                  className={cn(
                    "absolute text-3xl font-bold animate-damageFloat pointer-events-none",
                    dmg.isHeal ? "text-green-400" : "text-red-400"
                  )}
                  style={{ left: dmg.x, top: dmg.y }}
                >
                  {dmg.isHeal ? "+" : "-"}{dmg.damage}
                </div>
              ))}
              
              {/* エフェクト表示 */}
              {healEffect && (
                <div className="absolute inset-0 bg-green-400 opacity-20 animate-pulse pointer-events-none" />
              )}
              {shieldEffect && (
                <div className="absolute inset-0 bg-blue-400 opacity-20 animate-pulse pointer-events-none" />
              )}
              
              {/* ピアノロール表示エリア（ガイド表示時のみ） */}
              {showGuide && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gray-900 bg-opacity-50">
                  <PIXINotesRenderer
                    ref={setPixiRenderer}
                    onReady={handlePixiReady}
                    width={gameAreaSize.width}
                    height={120}
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 右側: ステージ情報 */}
          <div className="w-64 bg-gray-800 rounded-lg p-4">
            <h2 className="text-white text-lg font-bold mb-4">ステージ情報</h2>
            
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex justify-between">
                <span>Stage</span>
                <span>{stage.stageNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>残り敵数</span>
                <span>{gameState.totalEnemies - gameState.enemiesDefeated}</span>
              </div>
              <div className="flex justify-between">
                <span>同時出現数</span>
                <span>{stage.simultaneousMonsters}</span>
              </div>
              {stage.hasBoss && (
                <div className="text-red-400 font-bold">ボスステージ</div>
              )}
              {stage.hasHealer && (
                <div className="text-green-400">ヒーラー出現</div>
              )}
            </div>
            
            {/* 使用可能コード */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-white text-sm font-bold mb-2">使用可能コード</h3>
              <div className="flex flex-wrap gap-2">
                {stage.allowedChords.map(chordId => (
                  <div key={chordId} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                    {chordId}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 設定モーダル */}
      {isSettingsModalOpen && (
        <FantasySettingsModal
          onClose={() => setIsSettingsModalOpen(false)}
          onToggleGuide={() => {
            setShowGuide(prev => !prev);
            devLog.debug('⚙️ ガイド表示切替:', { showGuide: !showGuide });
          }}
          showGuide={showGuide}
        />
      )}
      
      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md">
          <div className="font-bold mb-2">デバッグ情報</div>
          <div>アクティブモンスター数: {gameState.activeMonsters.length}</div>
          <div>プレイヤーHP: {gameState.playerHp}/{gameState.playerMaxHp}</div>
          <div>SP: {gameState.playerSp}/5</div>
          <div>シールド: {gameState.playerShields}</div>
          <div>スコア: {gameState.score}</div>
          {gameState.activeMonsters.map(monster => (
            <div key={monster.id} className="mt-2 border-t border-gray-700 pt-2">
              <div>ID: {monster.id.substr(-6)}</div>
              <div>コード: {monster.chordDefinition.displayName}</div>
              <div>HP: {monster.hp}/{monster.maxHp}</div>
              <div>ゲージ: {monster.attackGauge.toFixed(1)}%</div>
              <div>正解音: {monster.correctNotes.length}/{monster.chordDefinition.notes.length}</div>
              {monster.statusEffect && (
                <div>状態異常: {monster.statusEffect.type} ({monster.statusEffect.remainingTime.toFixed(1)}s)</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FantasyGameScreen;