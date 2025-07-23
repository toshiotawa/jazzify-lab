/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterInstance, AttackMagicType, PlayerMagicType } from './FantasyGameEngine';
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

// 状態異常の色定義
const STATUS_AILMENT_COLORS = {
  burn: 'text-red-500',
  freeze: 'text-blue-400',
  paralysis: 'text-yellow-400'
};

// 状態異常の表示名
const STATUS_AILMENT_NAMES = {
  burn: 'やけど',
  freeze: 'こおり',
  paralysis: 'まひ'
};

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  onGameComplete,
  onBackToStageSelect
}) => {
  // エフェクト状態
  const [isMonsterAttacking, setIsMonsterAttacking] = useState<string | null>(null);
  const [damageShake, setDamageShake] = useState(false);
  const [missEffect, setMissEffect] = useState(false);
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理（初期値はstageから取得）
  const [showGuide, setShowGuide] = useState(stage.showGuide);
  
  // 魔法名表示状態
  const [magicName, setMagicName] = useState<{ name: string; isSpecial: boolean } | null>(null);
  
  // エフェクト表示状態
  const [damageNumbers, setDamageNumbers] = useState<{ [monsterId: string]: { damage: number; timestamp: number } }>({});
  const [healNumbers, setHealNumbers] = useState<{ [monsterId: string]: { heal: number; timestamp: number } }>({});
  
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
      playerMaxHp: state.playerMaxHp,
      isGameActive: state.isGameActive,
      currentChord: state.currentChordTarget?.displayName,
      score: state.score,
      correctAnswers: state.correctAnswers,
      monstersAlive: state.monsters.filter(m => m.hp > 0).length,
      playerSp: state.playerSp
    });
  }, []);
  
  const handleChordCorrect = useCallback((
    chord: ChordDefinition, 
    isSpecial: boolean, 
    damageDealt: number, 
    defeatedMonsterIds: string[],
    magicType: AttackMagicType | PlayerMagicType
  ) => {
    devLog.debug('✅ 正解:', { 
      name: chord.displayName, 
      special: isSpecial, 
      damage: damageDealt, 
      defeatedCount: defeatedMonsterIds.length,
      magicType 
    });
    
    // 魔法名を表示
    let displayName = '';
    if (magicType === 'fire') {
      displayName = isSpecial ? 'インフェルノ' : 'フレア';
    } else if (magicType === 'ice') {
      displayName = isSpecial ? 'ブリザード' : 'フロスト';
    } else if (magicType === 'lightning') {
      displayName = isSpecial ? 'サンダー・ストライク' : 'スパーク';
    } else if (magicType === 'protect') {
      displayName = 'プロテクト';
    } else if (magicType === 'hyper_heal') {
      displayName = 'ハイパーヒール';
    } else if (magicType === 'aegis_protection') {
      displayName = 'イージスプロテクション';
    }
    
    if (displayName) {
      setMagicName({ name: displayName, isSpecial });
      setTimeout(() => setMagicName(null), 1500);
    }
    
    // ファンタジーPIXIエフェクトをトリガー（コード名を渡す）
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerAttackSuccess(chord.displayName, isSpecial, damageDealt, defeatedMonsterIds.length > 0);
    }
    
  }, [fantasyPixiInstance]);
  
  const handleChordIncorrect = useCallback((expectedChord: ChordDefinition, inputNotes: number[]) => {
    devLog.debug('🎵 まだ構成音が足りません:', { expected: expectedChord.displayName, input: inputNotes });
  }, []);
  
  const handleEnemyAttack = useCallback((monsterId: string, damage: number, attackType: 'normal' | 'heal' | 'defense') => {
    devLog.debug('💥 敵の行動!', { monsterId, damage, attackType });
    
    if (attackType === 'normal' && damage > 0) {
      // モンスター攻撃状態を設定
      setIsMonsterAttacking(monsterId);
      setTimeout(() => setIsMonsterAttacking(null), 600);
      
      // ダメージ時の画面振動
      setDamageShake(true);
      setTimeout(() => setDamageShake(false), 500);
    } else if (attackType === 'heal') {
      // ヒール数値表示
      setHealNumbers(prev => ({
        ...prev,
        [monsterId]: { heal: damage, timestamp: Date.now() }
      }));
      
      // 3秒後に削除
      setTimeout(() => {
        setHealNumbers(prev => {
          const newNumbers = { ...prev };
          delete newNumbers[monsterId];
          return newNumbers;
        });
      }, 3000);
    }
    
    // ファンタジーPIXIでモンスター攻撃エフェクト
    if (fantasyPixiInstance && attackType === 'normal') {
      fantasyPixiInstance.updateMonsterAttacking(true);
      setTimeout(() => {
        if (fantasyPixiInstance) {
          fantasyPixiInstance.updateMonsterAttacking(false);
        }
      }, 600);
    }
    
  }, [fantasyPixiInstance]);
  
  const handleMissTouch = useCallback(() => {
    devLog.debug('❌ ミスタッチ!');
    
    // ミスエフェクト
    setMissEffect(true);
    setTimeout(() => setMissEffect(false), 500);
    
    // 画面振動
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 300);
  }, []);
  
  const handleStatusAilmentApplied = useCallback((monsterId: string, ailment: any) => {
    devLog.debug('🔥 状態異常付与:', { monsterId, ailment });
  }, []);
  
  const handlePlayerShieldAdded = useCallback((shieldCount: number) => {
    devLog.debug('🛡️ シールド追加:', { shieldCount });
  }, []);
  
  const handleGameCompleteCallback = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    devLog.debug('🏁 ゲーム終了:', { result, finalState });
    onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
  }, [onGameComplete]);
  
  // ゲームエンジンには、UIの状態を含まない初期stageを一度だけ渡す
  const {
    gameState,
    inputBuffer,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    playerShields,
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: stage,
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack,
    onMissTouch: handleMissTouch,
    onStatusAilmentApplied: handleStatusAilmentApplied,
    onPlayerShieldAdded: handlePlayerShieldAdded
  });
  
  // 現在の敵情報を取得
  const currentEnemy = gameState.monsters.find(m => m.hp > 0);
  
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
    engineHandleNoteInput(note);
  }, [engineHandleNoteInput, pixiRenderer]);
  
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
    // 新しいマルチモンスターシステムでは不要
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

  // 敵が変更された時にモンスタースプライトを更新（マルチモンスター対応）
  useEffect(() => {
    if (fantasyPixiInstance && gameState.monsters.length > 0) {
      // 各モンスターのスプライト更新
      gameState.monsters.forEach(monster => {
        if (monster.hp > 0) {
          fantasyPixiInstance.updateMonsterSprite(monster);
        }
      });
      
      devLog.debug('🔄 モンスタースプライト更新要求:', { 
        monstersCount: gameState.monsters.length,
        aliveMonsters: gameState.monsters.filter(m => m.hp > 0).length
      });
    }
  }, [fantasyPixiInstance, gameState.monsters]);
  
  // 設定変更時にPIXIレンダラーを更新（鍵盤ハイライトは無効化）
  useEffect(() => {
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        practiceGuide: 'off' // 常にOFFにして鍵盤ハイライトを無効化
      });
      devLog.debug('🎮 PIXIレンダラー設定更新: 鍵盤ハイライト無効化');
    }
  }, [pixiRenderer]);
  
  // HPハート表示（削除）
  
  // 敵のゲージ表示（黄色系）
  const renderEnemyGauge = useCallback((monster: MonsterInstance) => {
    return (
      <div className="w-32 h-4 bg-gray-700 border border-gray-600 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-200 ease-out"
          style={{ 
            width: `${Math.min(monster.attackGauge, 100)}%`,
            boxShadow: monster.attackGauge > 80 ? '0 0 10px rgba(245, 158, 11, 0.6)' : 'none'
          }}
        />
      </div>
    );
  }, []);
  
  // NEXTコード表示（コード進行モード用）
  const getNextChord = useCallback(() => {
    if (stage.mode !== 'progression' || !stage.chordProgression) return null;
    
    const nextIndex = (gameState.currentQuestionIndex + 1) % stage.chordProgression.length;
    return stage.chordProgression[nextIndex];
  }, [stage.mode, stage.chordProgression, gameState.currentQuestionIndex]);
  
  // SPゲージ表示（5段階に拡張）
  const renderSpGauge = useCallback((sp: number) => {
    const spBlocks = [];
    for (let i = 0; i < 5; i++) {
      spBlocks.push(
        <div
          key={i}
          className={cn(
            "w-10 h-3 rounded transition-all duration-300",
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
  
  // シールド表示
  const renderShields = useCallback((shields: number) => {
    const shieldIcons = [];
    for (let i = 0; i < shields; i++) {
      shieldIcons.push(
        <span key={i} className="text-2xl">🛡️</span>
      );
    }
    return shieldIcons;
  }, []);
  
  // モンスター情報表示
  const renderMonsterInfo = useCallback((monster: MonsterInstance) => {
    return (
      <div key={monster.id} className="text-center">
        <div className="text-xs text-gray-300 mb-1">{monster.position}列</div>
        
        {/* モンスターアイコン（絵文字または特殊表示） */}
        <div className="text-4xl mb-1">
          {monster.icon === 'vampire' && '☠'}
          {monster.icon === 'monster' && '🕷'}
          {monster.icon === 'reaper' && '🎩'}
          {monster.icon === 'kraken' && '👁'}
          {monster.icon === 'werewolf' && '🐦'}
          {monster.icon === 'demon' && '🔥'}
          {monster.icon === 'sparkles' && '✨'}
          {monster.icon === 'fire' && '🔥'}
          {monster.icon === 'snowflake' && '❄️'}
          {monster.icon === 'zap' && '⚡'}
        </div>
        
        {/* モンスター名 */}
        <div className={cn(
          "text-sm font-bold mb-1",
          monster.isBoss && "text-red-400",
          monster.isHealer && "text-green-400"
        )}>
          {monster.name}
          {monster.isBoss && " (BOSS)"}
        </div>
        
        {/* 状態異常表示 */}
        {monster.statusAilment && (
          <div className={cn(
            "text-xs font-bold mb-1",
            STATUS_AILMENT_COLORS[monster.statusAilment.type]
          )}>
            {STATUS_AILMENT_NAMES[monster.statusAilment.type]} ({monster.statusAilment.duration}秒)
          </div>
        )}
        
        {/* シールド表示 */}
        {monster.defenseShields > 0 && (
          <div className="mb-1">
            {Array.from({ length: monster.defenseShields }).map((_, i) => (
              <span key={i} className="text-sm">🛡️</span>
            ))}
          </div>
        )}
        
        {/* HPゲージ */}
        <div className="w-32 h-5 bg-gray-700 border border-gray-600 rounded-full overflow-hidden relative mb-1">
          <div
            className={cn(
              "h-full transition-all duration-300",
              monster.isBoss ? "bg-gradient-to-r from-red-600 to-red-800" : "bg-gradient-to-r from-red-500 to-red-700"
            )}
            style={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {monster.hp} / {monster.maxHp}
          </div>
        </div>
        
        {/* 攻撃ゲージ */}
        {renderEnemyGauge(monster)}
        
        {/* ダメージ数値表示 */}
        {damageNumbers[monster.id] && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none animate-bounce">
            <span className="text-2xl font-bold text-red-500">
              -{damageNumbers[monster.id].damage}
            </span>
          </div>
        )}
        
        {/* ヒール数値表示 */}
        {healNumbers[monster.id] && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none animate-bounce">
            <span className="text-2xl font-bold text-green-500">
              +{healNumbers[monster.id].heal}
            </span>
          </div>
        )}
      </div>
    );
  }, [renderEnemyGauge, damageNumbers, healNumbers]);
  
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
      damageShake && "animate-pulse",
      missEffect && "bg-red-900"
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
              敵の数: {gameState.totalEnemies} / 倒した数: {gameState.enemiesDefeated}
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
      <div className="flex-grow flex flex-col justify-center px-2 py-1 text-white text-center relative z-20" style={{ minHeight: '300px' }}>
        {/* コード表示（サイズを縮小） */}
        <div className="mb-1 text-center">
          <div className="text-yellow-300 text-2xl font-bold tracking-wider drop-shadow-lg">
            {gameState.currentChordTarget.displayName}
          </div>
          {/* 音名表示（ヒントがONの場合は全表示、OFFでも正解した音は表示） */}
          {gameState.currentChordTarget && (
            <div className="mt-1 text-lg font-medium h-7">
              {gameState.currentChordTarget.notes.map((note, index) => {
                const noteMod12 = note % 12;
                const noteName = getNoteNameFromMidi(note);
                const isCorrect = gameState.correctNotes.includes(noteMod12);
                // showGuideがtrueなら全て表示、falseなら正解した音のみ表示
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
        
        {/* プレイヤー情報（上部） */}
        <div className="mb-2 flex justify-center items-center space-x-4">
          {/* プレイヤーHPゲージ */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold">HP</span>
            <div className="w-48 h-6 bg-gray-700 border-2 border-gray-600 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-700 transition-all duration-300"
                style={{ width: `${(gameState.playerHp / gameState.playerMaxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {gameState.playerHp} / {gameState.playerMaxHp}
              </div>
            </div>
          </div>
          
          {/* シールド表示 */}
          {playerShields > 0 && (
            <div className="flex">
              {renderShields(playerShields)}
            </div>
          )}
          
          {/* SPゲージ */}
          <div>{renderSpGauge(gameState.playerSp)}</div>
        </div>
        
        {/* モンスター表示エリア（マルチモンスター対応） */}
        <div className="mb-2 text-center relative w-full">
          <div className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden" style={{ minHeight: '250px' }}>
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
            
            {/* モンスター配置（横並び） */}
            <div className="flex justify-center items-center h-full space-x-8 px-4">
              {gameState.monsters.filter(m => m.hp > 0).map(monster => (
                <div key={monster.id} className="relative">
                  {renderMonsterInfo(monster)}
                </div>
              ))}
            </div>
            
            {/* ファンタジーPIXIレンダラー（エフェクト用） */}
            <div className="absolute inset-0 pointer-events-none">
              <FantasyPIXIRenderer
                width={window.innerWidth}
                height={250}
                monsterIcon={gameState.monsters[0]?.icon || 'vampire'}
                isMonsterAttacking={!!isMonsterAttacking}
                enemyGauge={0}
                onReady={handleFantasyPixiReady}
                onMonsterDefeated={handleMonsterDefeated}
                onShowMagicName={handleShowMagicName}
                className="w-full h-full"
              />
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
      
      {/* デバッグ情報（FPSモニター削除済み） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-40 max-w-xs">
          <div>Q: {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}</div>
          <div>HP: {gameState.playerHp}/{gameState.playerMaxHp}</div>
          <div>モンスター数: {gameState.monsters.filter(m => m.hp > 0).length}</div>
          <div>スコア: {gameState.score}</div>
          <div>正解数: {gameState.correctAnswers}</div>
          <div>現在のコード: {gameState.currentChordTarget.displayName}</div>
          <div>SP: {gameState.playerSp}/5</div>
          <div>シールド: {playerShields}</div>
          <div>入力バッファ: [{inputBuffer.join(', ')}]</div>
          
          {/* モンスター情報 */}
          <div className="mt-2">
            {gameState.monsters.map((m, i) => (
              <div key={m.id} className="text-xs">
                {m.position}: {m.name} HP:{m.hp}/{m.maxHp} G:{m.attackGauge.toFixed(0)}%
              </div>
            ))}
          </div>
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