/**
 * サバイバルモード ゲーム画面
 * ゲームループ、入力処理、UI統合
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import {
  SurvivalGameState,
  SurvivalDifficulty,
  DifficultyConfig,
  SurvivalGameResult,
  LevelUpBonus,
  CodeSlot,
  Direction,
  ShockwaveEffect,
  LightningEffect,
  SLOT_TIMEOUT,
  EXP_PER_MINUTE,
} from './SurvivalTypes';
import {
  createInitialGameState,
  initializeCodeSlots,
  selectRandomChord,
  spawnEnemy,
  updatePlayerPosition,
  updateEnemyPositions,
  updateProjectiles,
  checkChordMatch,
  getCorrectNotes,
  createProjectile,
  calculateDamage,
  generateLevelUpOptions,
  applyLevelUpBonus,
  addExp,
  createDamageText,
  getMagicCooldown,
  castMagic,
  getDirectionVector,
  createCoinsFromEnemy,
  collectCoins,
  cleanupExpiredCoins,
  calculateWaveQuota,
  getWaveSpeedMultiplier,
  shouldEnemyShoot,
  createEnemyProjectile,
  updateEnemyProjectiles,
} from './SurvivalGameEngine';
import { WAVE_DURATION } from './SurvivalTypes';
import SurvivalCanvas from './SurvivalCanvas';
import SurvivalCodeSlots from './SurvivalCodeSlots';
import SurvivalLevelUp from './SurvivalLevelUp';
import SurvivalGameOver from './SurvivalGameOver';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import SurvivalSettingsModal from './SurvivalSettingsModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

// ===== バーチャルスティック =====
interface VirtualStickProps {
  onDirectionChange: (keys: Set<string>) => void;
}

const VirtualStick: React.FC<VirtualStickProps> = ({ onDirectionChange }) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const centerRef = useRef({ x: 0, y: 0 });
  
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!stickRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    const rect = stickRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setIsDragging(true);
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const maxRadius = 40;
    let dx = e.clientX - centerRef.current.x;
    let dy = e.clientY - centerRef.current.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    
    setStickPos({ x: dx, y: dy });
    
    // 方向を計算してキーセットに変換
    const keys = new Set<string>();
    const threshold = 15;
    
    if (dy < -threshold) keys.add('w');
    if (dy > threshold) keys.add('s');
    if (dx < -threshold) keys.add('a');
    if (dx > threshold) keys.add('d');
    
    onDirectionChange(keys);
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
    onDirectionChange(new Set());
  };
  
  return (
    <div
      ref={stickRef}
      className="relative w-28 h-28 bg-black/40 rounded-full border-2 border-white/30 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 方向矢印 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-2 text-white/50 text-xl">▲</div>
        <div className="absolute bottom-2 text-white/50 text-xl">▼</div>
        <div className="absolute left-2 text-white/50 text-xl">◀</div>
        <div className="absolute right-2 text-white/50 text-xl">▶</div>
      </div>
      
      {/* スティック */}
      <div
        className="absolute w-12 h-12 bg-white/80 rounded-full shadow-lg"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${stickPos.x}px), calc(-50% + ${stickPos.y}px))`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      />
    </div>
  );
};

interface DebugSkillSettings {
  aPenetration?: boolean;     // 貫通（上限1）
  aBackBullet?: number;       // 後方弾（上限なし）
  aRightBullet?: number;      // 右側弾（上限なし）
  aLeftBullet?: number;       // 左側弾（上限なし）
  bKnockbackBonus?: number;   // ノックバック距離増加（上限なし）
  bRangeBonus?: number;       // 攻撃範囲拡大（上限なし）
  multiHitLevel?: number;     // 多段攻撃レベル（上限3）
}

interface SurvivalGameScreenProps {
  difficulty: SurvivalDifficulty;
  config: DifficultyConfig;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
  debugSettings?: {
    aAtk?: number;
    bAtk?: number;
    cAtk?: number;
    skills?: DebugSkillSettings;
    tapSkillActivation?: boolean;
    initialLevel?: number;
    magics?: {
      thunder?: number;
      ice?: number;
      fire?: number;
      heal?: number;
      buffer?: number;
      debuffer?: number;
      hint?: number;
    };
  };
}

const SurvivalGameScreen: React.FC<SurvivalGameScreenProps> = ({
  difficulty,
  config,
  onBackToSelect,
  onBackToMenu,
  debugSettings,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const { settings } = useGameStore();
  
  // 初期化エラー状態
  const [initError, setInitError] = useState<string | null>(null);
  
  // ゲーム状態
  const [gameState, setGameState] = useState<SurvivalGameState>(() => {
    const initial = createInitialGameState(difficulty, config);
    // デバッグ設定を適用
    if (debugSettings) {
      // 攻撃力設定
      if (debugSettings.aAtk !== undefined) {
        initial.player.stats.aAtk = debugSettings.aAtk;
      }
      if (debugSettings.bAtk !== undefined) {
        initial.player.stats.bAtk = debugSettings.bAtk;
      }
      if (debugSettings.cAtk !== undefined) {
        initial.player.stats.cAtk = debugSettings.cAtk;
      }
      // TIME（効果時間延長）設定
      if (debugSettings.time !== undefined) {
        initial.player.stats.time = debugSettings.time;
      }
      
      // 初期レベル設定
      if (debugSettings.initialLevel !== undefined && debugSettings.initialLevel > 1) {
        initial.player.level = debugSettings.initialLevel;
        // レベルに応じて経験値要求量を更新
        let expToNext = 10;
        for (let i = 1; i < debugSettings.initialLevel; i++) {
          expToNext = Math.floor(expToNext * 1.5);
        }
        initial.player.expToNextLevel = expToNext;
      }
      
      // 魔法の個別設定
      if (debugSettings.magics) {
        if (debugSettings.magics.thunder !== undefined) {
          initial.player.magics.thunder = debugSettings.magics.thunder;
        }
        if (debugSettings.magics.ice !== undefined) {
          initial.player.magics.ice = debugSettings.magics.ice;
        }
        if (debugSettings.magics.fire !== undefined) {
          initial.player.magics.fire = debugSettings.magics.fire;
        }
        if (debugSettings.magics.heal !== undefined) {
          initial.player.magics.heal = debugSettings.magics.heal;
        }
        if (debugSettings.magics.buffer !== undefined) {
          initial.player.magics.buffer = debugSettings.magics.buffer;
        }
        if (debugSettings.magics.debuffer !== undefined) {
          initial.player.magics.debuffer = debugSettings.magics.debuffer;
        }
        if (debugSettings.magics.hint !== undefined) {
          initial.player.magics.hint = debugSettings.magics.hint;
        }
      }
      
      // スキル設定
      if (debugSettings.skills) {
        const skills = debugSettings.skills;
        if (skills.aPenetration !== undefined) {
          initial.player.skills.aPenetration = skills.aPenetration;
        }
        if (skills.aBulletCount !== undefined) {
          initial.player.stats.aBulletCount = skills.aBulletCount;
        }
        if (skills.aBackBullet !== undefined) {
          initial.player.skills.aBackBullet = skills.aBackBullet;
        }
        if (skills.aRightBullet !== undefined) {
          initial.player.skills.aRightBullet = skills.aRightBullet;
        }
        if (skills.aLeftBullet !== undefined) {
          initial.player.skills.aLeftBullet = skills.aLeftBullet;
        }
        if (skills.bKnockbackBonus !== undefined) {
          initial.player.skills.bKnockbackBonus = skills.bKnockbackBonus;
        }
        if (skills.bRangeBonus !== undefined) {
          initial.player.skills.bRangeBonus = skills.bRangeBonus;
        }
        if (skills.multiHitLevel !== undefined) {
          initial.player.skills.multiHitLevel = Math.min(3, skills.multiHitLevel);
        }
      }
    }
    return initial;
  });
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  // レベルアップ時の正解ノートをrefで管理（setGameState内から最新値を参照するため）
  const levelUpCorrectNotesRef = useRef<number[][]>([[], [], []]);
  // UIの再レンダリング用のステート（refと同期）
  const [levelUpCorrectNotes, setLevelUpCorrectNotes] = useState<number[][]>([[], [], []]);
  
  // 衝撃波エフェクト
  const [shockwaves, setShockwaves] = useState<ShockwaveEffect[]>([]);
  
  // 雷エフェクト
  const [lightningEffects, setLightningEffects] = useState<LightningEffect[]>([]);
  
  // キー入力状態
  const keysRef = useRef<Set<string>>(new Set());
  const virtualKeysRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  
  // MIDI/ピアノ関連
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // handleNoteInputの最新参照を保持するref
  const handleNoteInputRef = useRef<(note: number) => void>(() => {});
  
  // ビューポートサイズ
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);
  // MIDI接続状態
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // ビューポートサイズ更新
  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth - 32, 1200);
      const height = Math.min(window.innerHeight - 350, 600);
      setViewportSize({ width, height });
      setIsMobile(window.innerWidth < 768);
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // MIDIコントローラー初期化（ファンタジーモードと同様の挙動）
  useEffect(() => {
    const initMidi = async () => {
      try {
        // 音声システムとFantasySoundManagerを並列初期化（ファンタジーモードと同様）
        await Promise.all([
          // 音声システム初期化
          initializeAudioSystem().then(() => {
            updateGlobalVolume(0.8);
          }),
          // FantasySoundManagerの初期化（ルート音再生用）
          FantasySoundManager.init(0.8, 0.5, true).then(() => {
            FantasySoundManager.enableRootSound(true);
          })
        ]);
        
        // MIDIControllerのインスタンスを作成（ファンタジーモードと同様）
        // 注意: onNoteOn内では音の再生やハイライトを直接呼ばない
        // MIDIController内のhandleNoteOnで処理される（playMidiSound=trueがデフォルト）
        const controller = new MIDIController({
          onNoteOn: (note: number, _velocity?: number) => {
            // refを使用して常に最新のhandleNoteInputを呼び出す
            if (handleNoteInputRef.current) {
              handleNoteInputRef.current(note);
            }
          },
          onNoteOff: (_note: number) => {
            // Note off - MIDIController内で処理される
          },
          // playMidiSoundはデフォルト（true）を使用
        });
        
        // MIDI接続状態変更コールバック（ファンタジーモードと同様）
        controller.setConnectionChangeCallback((connected: boolean) => {
          setIsMidiConnected(connected);
        });
        
        midiControllerRef.current = controller;
        
        await controller.initialize();
        
        // MIDIControllerにキーハイライト機能を設定（初期化後に設定）
        controller.setKeyHighlightCallback((note: number, active: boolean) => {
          pixiRendererRef.current?.highlightKey(note, active);
        });
        
        // 初期化エラーをクリア
        setInitError(null);
      } catch (error) {
        // MIDI初期化エラーが発生しても、タッチ/クリック入力でプレイ可能
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setInitError(`Audio initialization warning: ${errorMessage}. Touch/click input available.`);
      }
    };
    
    initMidi();
    
    return () => {
      midiControllerRef.current?.destroy();
    };
  }, []); // 空の依存配列で一度だけ実行
  
  // gameStoreのデバイスIDを監視して接続/切断（ファンタジーモードと共有）
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        await midiControllerRef.current.connectDevice(deviceId);
        setIsMidiConnected(true);
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
        setIsMidiConnected(false);
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);
  
  // コンポーネントマウント時にMIDI接続を復元（ファンタジーモードと同様）
  useEffect(() => {
    const restoreMidiConnection = async () => {
      if (midiControllerRef.current) {
        // 現在接続中のデバイスがあれば接続を確認・復元
        if (midiControllerRef.current.getCurrentDeviceId()) {
          await midiControllerRef.current.checkAndRestoreConnection();
        } else if (settings.selectedMidiDevice) {
          // gameStoreにデバイスIDがあれば接続を試みる
          await midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
        }
      }
    };
    
    // 初期化が完了してから接続復元を試みる
    const timer = setTimeout(restoreMidiConnection, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // PIXIレンダラーの準備（ファンタジーモードと同様の挙動）
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    pixiRendererRef.current = renderer;
    if (renderer) {
      // サバイバルモードではノーツ表示エリアを使わないため、
      // pianoHeightを全体の高さに設定してノーツコンテナを非表示にする
      renderer.updateSettings({
        showHitLine: false,
        noteNameStyle: settings.noteNameStyle,
        simpleDisplayMode: settings.simpleDisplayMode,
        pianoHeight: 120, // 全体の高さと同じにしてノーツエリアをなくす
      });
      
      // タッチ/クリックハンドラー設定（ファンタジーモードと同様）
      // refを使用して常に最新のhandleNoteInputを呼び出す
      renderer.setKeyCallbacks(
        (note: number) => {
          // ゲーム入力として処理
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note);
          }
          // 音の再生
          playNote(note, 100);
        },
        (note: number) => {
          // マウスリリース時に音を止める
          stopNote(note);
        }
      );
      
      // MIDIControllerにキーハイライト機能を設定（ファンタジーモードと同様）
      if (midiControllerRef.current) {
        midiControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
          renderer.highlightKey(note, active);
        });
      }
    }
  }, [settings.noteNameStyle, settings.simpleDisplayMode]);
  
  // ピアノをC4中心にスクロール
  const centerPianoC4 = useCallback(() => {
    if (!pianoScrollRef.current) return;
    const container = pianoScrollRef.current;
    const c4Position = (60 - 21) / 88;
    const scrollTarget = container.scrollWidth * c4Position - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollTarget);
  }, []);
  
  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
      if (key === 'escape') {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);
    };
    
    // フォーカス喪失時にキーをクリア（タブ切り替え、右クリック対策）
    const handleBlur = () => {
      keysRef.current.clear();
    };
    
    // visibility変更時にキーをクリア
    const handleVisibilityChange = () => {
      if (document.hidden) {
        keysRef.current.clear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // バーチャルスティックの方向変更
  const handleVirtualStickChange = useCallback((keys: Set<string>) => {
    virtualKeysRef.current = keys;
  }, []);
  
  // ゲーム開始
  const startGame = useCallback(() => {
    setGameState(prev => {
      // 現在のプレイヤーの魔法状態を確認
      const hasMagic = Object.values(prev.player.magics).some(l => l > 0);
      const codeSlots = initializeCodeSlots(config.allowedChords, hasMagic);
      
      return {
        ...prev,
        isPlaying: true,
        codeSlots,
      };
    });
    
    lastUpdateRef.current = performance.now();
    spawnTimerRef.current = 0;
  }, [config.allowedChords]);
  
  // ゲーム開始（初回）
  useEffect(() => {
    startGame();
  }, []);
  
  // レベルアップボーナス選択処理
  const handleLevelUpBonusSelect = useCallback((option: LevelUpBonus) => {
    setGameState(gs => {
      if (!gs.isLevelingUp) return gs;
      
      const newPlayer = applyLevelUpBonus(gs.player, option);
      const newPendingLevelUps = gs.pendingLevelUps - 1;
      
      // 魔法を取得したらC列を有効化
      const hasMagic = Object.values(newPlayer.magics).some(l => l > 0);
      const newCodeSlots = {
        ...gs.codeSlots,
        current: gs.codeSlots.current.map((slot, i) => 
          i === 2 ? { ...slot, isEnabled: hasMagic, chord: hasMagic ? selectRandomChord(config.allowedChords) : null } : slot
        ) as [CodeSlot, CodeSlot, CodeSlot],
        next: gs.codeSlots.next.map((slot, i) =>
          i === 2 ? { ...slot, isEnabled: hasMagic, chord: hasMagic ? selectRandomChord(config.allowedChords) : null } : slot
        ) as [CodeSlot, CodeSlot, CodeSlot],
      };
      
      if (newPendingLevelUps > 0) {
        const newOptions = generateLevelUpOptions(newPlayer, config.allowedChords);
        levelUpCorrectNotesRef.current = [[], [], []];
        setLevelUpCorrectNotes([[], [], []]);
        return {
          ...gs,
          player: newPlayer,
          pendingLevelUps: newPendingLevelUps,
          levelUpOptions: newOptions,
          codeSlots: newCodeSlots,
        };
      } else {
        levelUpCorrectNotesRef.current = [[], [], []];
        setLevelUpCorrectNotes([[], [], []]);
        return {
          ...gs,
          player: newPlayer,
          pendingLevelUps: 0,
          isLevelingUp: false,
          levelUpOptions: [],
          codeSlots: newCodeSlots,
        };
      }
    });
  }, [config.allowedChords]);
  
  // レベルアップタイムアウト処理
  const handleLevelUpTimeout = useCallback(() => {
    setGameState(gs => {
      if (!gs.isLevelingUp) return gs;
      
      const newPendingLevelUps = gs.pendingLevelUps - 1;
      
      if (newPendingLevelUps > 0) {
        const newOptions = generateLevelUpOptions(gs.player, config.allowedChords);
        levelUpCorrectNotesRef.current = [[], [], []];
        setLevelUpCorrectNotes([[], [], []]);
        return {
          ...gs,
          pendingLevelUps: newPendingLevelUps,
          levelUpOptions: newOptions,
        };
      } else {
        levelUpCorrectNotesRef.current = [[], [], []];
        setLevelUpCorrectNotes([[], [], []]);
        return {
          ...gs,
          pendingLevelUps: 0,
          isLevelingUp: false,
          levelUpOptions: [],
        };
      }
    });
  }, [config.allowedChords]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    // 通常のコード入力処理
    // 注意: gameStateを直接参照せず、setGameState内でprevを使用して最新の状態を取得する
    setGameState(prev => {
      // ゲームオーバーまたはポーズ中は何もしない
      if (prev.isGameOver || prev.isPaused) return prev;
      
      // レベルアップ中の処理
      if (prev.isLevelingUp) {
        // 現在の正解ノートを取得して新しいノートを追加（refから最新値を取得）
        const currentCorrectNotes = levelUpCorrectNotesRef.current.map(arr => [...arr]);
        let matchedOptionIndex = -1;
        
        prev.levelUpOptions.forEach((option, index) => {
          if (option.chord && matchedOptionIndex === -1) {
            const prevNotes = currentCorrectNotes[index] || [];
            const correct = getCorrectNotes([...prevNotes, note], option.chord);
            currentCorrectNotes[index] = correct;
            
            // 完成チェック
            if (checkChordMatch(correct, option.chord)) {
              matchedOptionIndex = index;
            }
          }
        });
        
        // refを即座に更新（次の入力で最新値を参照できるように）
        levelUpCorrectNotesRef.current = currentCorrectNotes;
        // UIの再レンダリング用にステートも更新
        setTimeout(() => setLevelUpCorrectNotes([...currentCorrectNotes]), 0);
        
        // マッチしたオプションがあれば選択（状態更新後に非同期で実行）
        if (matchedOptionIndex >= 0) {
          const matchedOption = prev.levelUpOptions[matchedOptionIndex];
          // 次のイベントループで実行して状態更新の競合を避ける
          setTimeout(() => {
            handleLevelUpBonusSelect(matchedOption);
          }, 0);
        }
        return prev; // レベルアップ中は他の処理をスキップ
      }
      
      // 以下、通常のコード入力処理
      const newState = { ...prev };
      const noteMod12 = note % 12;
      
      // 各スロットをチェック
      let completedSlotIndex: number | null = null;
      
      newState.codeSlots.current = prev.codeSlots.current.map((slot, index) => {
        if (!slot.isEnabled || !slot.chord) return slot;
        // 既に完了済み or リセット待ち中のスロットはスキップ
        if (slot.isCompleted || slot.completedTime) return slot;
        
        const targetNotes = [...new Set(slot.chord.notes.map(n => n % 12))];
        if (!targetNotes.includes(noteMod12)) return slot;
        if (slot.correctNotes.includes(noteMod12)) return slot;
        
        const newCorrectNotes = [...slot.correctNotes, noteMod12];
        const isComplete = newCorrectNotes.length >= targetNotes.length;
        
        // 完了したスロットを記録（最初に完了したもののみ攻撃処理を行う）
        if (isComplete && completedSlotIndex === null) {
          completedSlotIndex = index;
        }
        
        return {
          ...slot,
          correctNotes: newCorrectNotes,
          isCompleted: isComplete,
          completedTime: isComplete ? Date.now() : undefined,  // 完了時刻を設定
        };
      }) as [CodeSlot, CodeSlot, CodeSlot];
      
      // コード完成時の処理
      if (completedSlotIndex !== null) {
        const slotType = ['A', 'B', 'C'][completedSlotIndex] as 'A' | 'B' | 'C';
        
        // 正解時にルート音を鳴らす（ファンタジーモードと同様）
        const completedChord = prev.codeSlots.current[completedSlotIndex].chord;
        if (completedChord) {
          const rootNote = completedChord.root || completedChord.noteNames?.[0];
          if (rootNote) {
            FantasySoundManager.playRootNote(rootNote).catch(() => {});
          }
        }
        
        // 攻撃処理
        if (slotType === 'A') {
          // 遠距離弾発射
          const directions: Direction[] = [];
          
          // 前方弾（aBulletCount分）
          const bulletCount = prev.player.stats.aBulletCount || 1;
          for (let i = 0; i < bulletCount; i++) {
            directions.push(prev.player.direction);
          }
          
          // 追加弾
          if (prev.player.skills.aBackBullet > 0) {
            const backDir = getOppositeDirection(prev.player.direction);
            for (let i = 0; i < prev.player.skills.aBackBullet; i++) {
              directions.push(backDir);
            }
          }
          if (prev.player.skills.aLeftBullet > 0) {
            const leftDir = getLeftDirection(prev.player.direction);
            for (let i = 0; i < prev.player.skills.aLeftBullet; i++) {
              directions.push(leftDir);
            }
          }
          if (prev.player.skills.aRightBullet > 0) {
            const rightDir = getRightDirection(prev.player.direction);
            for (let i = 0; i < prev.player.skills.aRightBullet; i++) {
              directions.push(rightDir);
            }
          }
          
          // 複数弾を少しずらして発射
          const newProjectiles = directions.map((dir, index) => {
            const proj = createProjectile(prev.player, dir, prev.player.stats.aAtk);
            // 同じ方向の弾は少しずらして発射
            const offset = (index % bulletCount) * 5;
            const dirVec = getDirectionVector(dir);
            proj.x += dirVec.y * offset;  // 垂直方向にオフセット
            proj.y -= dirVec.x * offset;  // 垂直方向にオフセット
            return proj;
          });
          newState.projectiles = [...prev.projectiles, ...newProjectiles];
          
          // 多段攻撃処理（A列）
          const multiHitLevel = prev.player.skills.multiHitLevel;
          if (multiHitLevel > 0) {
            for (let hit = 1; hit <= multiHitLevel; hit++) {
              setTimeout(() => {
                setGameState(gs => {
                  // ゲーム中断中は発動しない
                  if (gs.isPaused || gs.isGameOver || gs.isLevelingUp) return gs;
                  
                  const multiDirections: Direction[] = [];
                  const bulletCount = gs.player.stats.aBulletCount || 1;
                  for (let i = 0; i < bulletCount; i++) {
                    multiDirections.push(gs.player.direction);
                  }
                  if (gs.player.skills.aBackBullet > 0) {
                    const backDir = getOppositeDirection(gs.player.direction);
                    for (let i = 0; i < gs.player.skills.aBackBullet; i++) {
                      multiDirections.push(backDir);
                    }
                  }
                  if (gs.player.skills.aLeftBullet > 0) {
                    const leftDir = getLeftDirection(gs.player.direction);
                    for (let i = 0; i < gs.player.skills.aLeftBullet; i++) {
                      multiDirections.push(leftDir);
                    }
                  }
                  if (gs.player.skills.aRightBullet > 0) {
                    const rightDir = getRightDirection(gs.player.direction);
                    for (let i = 0; i < gs.player.skills.aRightBullet; i++) {
                      multiDirections.push(rightDir);
                    }
                  }
                  
                  const additionalProjectiles = multiDirections.map((dir, index) => {
                    const proj = createProjectile(gs.player, dir, gs.player.stats.aAtk);
                    const offset = (index % bulletCount) * 5;
                    const dirVec = getDirectionVector(dir);
                    proj.x += dirVec.y * offset;
                    proj.y -= dirVec.x * offset;
                    return proj;
                  });
                  
                  return {
                    ...gs,
                    projectiles: [...gs.projectiles, ...additionalProjectiles],
                  };
                });
              }, hit * 500); // 0.5秒ごと
            }
          }
          
        } else if (slotType === 'B') {
          // 近接攻撃 - 衝撃波エフェクト追加
          const baseRange = 80;
          const bonusRange = prev.player.skills.bRangeBonus * 20;
          const totalRange = baseRange + bonusRange;
          const dirVec = getDirectionVector(prev.player.direction);
          const attackX = prev.player.x + dirVec.x * 40;
          const attackY = prev.player.y + dirVec.y * 40;
          
          // 衝撃波エフェクト追加（前方のみ大きい範囲）
          const newShockwave: ShockwaveEffect = {
            id: `shock_${Date.now()}`,
            x: attackX,
            y: attackY,
            radius: 0,
            maxRadius: totalRange,
            startTime: Date.now(),
            duration: 300,
            direction: prev.player.direction,  // プレイヤーの向きを追加
          };
          setShockwaves(sw => [...sw, newShockwave]);
          
          // ノックバック力
          const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
          
          newState.enemies = prev.enemies.map(enemy => {
            const dx = enemy.x - attackX;
            const dy = enemy.y - attackY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 敵が前方にいるかどうかをチェック（内積で判定）
            const toEnemyX = enemy.x - prev.player.x;
            const toEnemyY = enemy.y - prev.player.y;
            const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
            const isInFront = dotProduct > 0;
            
            // 前方ならボーナス範囲を適用、それ以外は基本範囲のみ
            const effectiveRange = isInFront ? totalRange : baseRange;
            
            if (dist < effectiveRange) {
              const damage = calculateDamage(
                prev.player.stats.bAtk,
                prev.player.stats.bAtk,
                enemy.stats.def,
                prev.player.statusEffects.some(e => e.type === 'buffer'),
                enemy.statusEffects.some(e => e.type === 'debuffer')
              );
              
              // ノックバック（B列は強め）
              const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
              const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
              
              newState.damageTexts.push(createDamageText(enemy.x, enemy.y, damage));
              
              return {
                ...enemy,
                stats: {
                  ...enemy.stats,
                  hp: Math.max(0, enemy.stats.hp - damage),
                },
                knockbackVelocity: { x: knockbackX, y: knockbackY },
              };
            }
            return enemy;
          });
          
          // 多段攻撃処理（B列）
          const bMultiHitLevel = prev.player.skills.multiHitLevel;
          if (bMultiHitLevel > 0) {
            for (let hit = 1; hit <= bMultiHitLevel; hit++) {
              setTimeout(() => {
                setGameState(gs => {
                  // ゲーム中断中は発動しない
                  if (gs.isPaused || gs.isGameOver || gs.isLevelingUp) return gs;
                  
                  const bBaseRange = 80;
                  const bBonusRange = gs.player.skills.bRangeBonus * 20;
                  const bTotalRange = bBaseRange + bBonusRange;
                  const bDirVec = getDirectionVector(gs.player.direction);
                  const bAttackX = gs.player.x + bDirVec.x * 40;
                  const bAttackY = gs.player.y + bDirVec.y * 40;
                  
                  // 衝撃波エフェクト追加
                  const multiShockwave: ShockwaveEffect = {
                    id: `shock_multi_${Date.now()}_${hit}`,
                    x: bAttackX,
                    y: bAttackY,
                    radius: 0,
                    maxRadius: bTotalRange,
                    startTime: Date.now(),
                    duration: 300,
                    direction: gs.player.direction,  // プレイヤーの向きを追加
                  };
                  setShockwaves(sw => [...sw, multiShockwave]);
                  
                  const bKnockbackForce = 150 + gs.player.skills.bKnockbackBonus * 50;
                  const newDamageTexts = [...gs.damageTexts];
                  
                  const updatedEnemies = gs.enemies.map(enemy => {
                    const dx = enemy.x - bAttackX;
                    const dy = enemy.y - bAttackY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // 敵が前方にいるかどうか
                    const toEnemyX = enemy.x - gs.player.x;
                    const toEnemyY = enemy.y - gs.player.y;
                    const dotProduct = toEnemyX * bDirVec.x + toEnemyY * bDirVec.y;
                    const isInFront = dotProduct > 0;
                    const effectiveRange = isInFront ? bTotalRange : bBaseRange;
                    
                    if (dist < effectiveRange) {
                      const damage = calculateDamage(
                        gs.player.stats.bAtk,
                        gs.player.stats.bAtk,
                        enemy.stats.def,
                        gs.player.statusEffects.some(e => e.type === 'buffer'),
                        enemy.statusEffects.some(e => e.type === 'debuffer')
                      );
                      
                      const knockbackX = dist > 0 ? (dx / dist) * bKnockbackForce : 0;
                      const knockbackY = dist > 0 ? (dy / dist) * bKnockbackForce : 0;
                      
                      newDamageTexts.push(createDamageText(enemy.x, enemy.y, damage));
                      
                      return {
                        ...enemy,
                        stats: {
                          ...enemy.stats,
                          hp: Math.max(0, enemy.stats.hp - damage),
                        },
                        knockbackVelocity: { x: knockbackX, y: knockbackY },
                      };
                    }
                    return enemy;
                  });
                  
                  return {
                    ...gs,
                    enemies: updatedEnemies,
                    damageTexts: newDamageTexts,
                  };
                });
              }, hit * 500); // 0.5秒ごと
            }
          }
          
        } else if (slotType === 'C' && prev.magicCooldown <= 0) {
          // 魔法発動
          const availableMagics = Object.entries(prev.player.magics)
            .filter(([_, level]) => level > 0);
          
          if (availableMagics.length > 0) {
            const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
            const result = castMagic(
              magicType as Parameters<typeof castMagic>[0],
              level,
              prev.player,
              prev.enemies
            );
            
            newState.enemies = result.enemies;
            newState.player = result.player;
            newState.damageTexts = [...prev.damageTexts, ...result.damageTexts];
            newState.magicCooldown = getMagicCooldown(prev.player.stats.reloadMagic);
            
            // サンダーの場合は雷エフェクトを追加
            if (magicType === 'thunder') {
              const newLightning = prev.enemies.map(enemy => ({
                id: `lightning_${Date.now()}_${enemy.id}`,
                x: enemy.x,
                y: enemy.y,
                startTime: Date.now(),
                duration: 500,
              }));
              setLightningEffects(le => [...le, ...newLightning]);
            }
          }
        }
        
        // スロットをリセット
        setTimeout(() => {
          setGameState(gs => {
            const nextChord = gs.codeSlots.next[completedSlotIndex!].chord;
            const newNextChord = selectRandomChord(config.allowedChords, nextChord?.id);
            
            return {
              ...gs,
              codeSlots: {
                current: gs.codeSlots.current.map((slot, i) => 
                  i === completedSlotIndex 
                    ? { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT }
                    : slot
                ) as [CodeSlot, CodeSlot, CodeSlot],
                next: gs.codeSlots.next.map((slot, i) =>
                  i === completedSlotIndex
                    ? { ...slot, chord: newNextChord }
                    : slot
                ) as [CodeSlot, CodeSlot, CodeSlot],
              },
            };
          });
        }, 200);
      }
      
      return newState;
    });
  }, [config.allowedChords, levelUpCorrectNotes, handleLevelUpBonusSelect]);
  
  // handleNoteInputが更新されるたびにrefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);
  
  // タップでスキル発動（デバッグ用）
  const handleTapSkillActivation = useCallback((slotIndex: number) => {
    if (gameState.isGameOver || gameState.isPaused || gameState.isLevelingUp) return;
    
    const slotType = ['A', 'B', 'C'][slotIndex] as 'A' | 'B' | 'C';
    
    setGameState(prev => {
      const newState = { ...prev };
      const slot = prev.codeSlots.current[slotIndex];
      
      if (!slot.isEnabled) return prev;
      
      // 攻撃処理
      if (slotType === 'A') {
        // 遠距離弾発射
        const directions: Direction[] = [];
        
        // 前方弾（aBulletCount分）
        const bulletCount = prev.player.stats.aBulletCount || 1;
        for (let i = 0; i < bulletCount; i++) {
          directions.push(prev.player.direction);
        }
        
        if (prev.player.skills.aBackBullet > 0) {
          const backDir = getOppositeDirection(prev.player.direction);
          for (let i = 0; i < prev.player.skills.aBackBullet; i++) {
            directions.push(backDir);
          }
        }
        if (prev.player.skills.aLeftBullet > 0) {
          const leftDir = getLeftDirection(prev.player.direction);
          for (let i = 0; i < prev.player.skills.aLeftBullet; i++) {
            directions.push(leftDir);
          }
        }
        if (prev.player.skills.aRightBullet > 0) {
          const rightDir = getRightDirection(prev.player.direction);
          for (let i = 0; i < prev.player.skills.aRightBullet; i++) {
            directions.push(rightDir);
          }
        }
        
        // 複数弾を少しずらして発射
        const newProjectiles = directions.map((dir, index) => {
          const proj = createProjectile(prev.player, dir, prev.player.stats.aAtk);
          // 同じ方向の弾は少しずらして発射
          const offset = (index % bulletCount) * 5;
          const dirVec = getDirectionVector(dir);
          proj.x += dirVec.y * offset;
          proj.y -= dirVec.x * offset;
          return proj;
        });
        newState.projectiles = [...prev.projectiles, ...newProjectiles];
        
        // 多段攻撃処理（A列・タップ）
        const tapMultiHitLevel = prev.player.skills.multiHitLevel;
        if (tapMultiHitLevel > 0) {
          for (let hit = 1; hit <= tapMultiHitLevel; hit++) {
            setTimeout(() => {
              setGameState(gs => {
                if (gs.isPaused || gs.isGameOver || gs.isLevelingUp) return gs;
                
                const multiDirections: Direction[] = [];
                const bulletCount = gs.player.stats.aBulletCount || 1;
                for (let i = 0; i < bulletCount; i++) {
                  multiDirections.push(gs.player.direction);
                }
                if (gs.player.skills.aBackBullet > 0) {
                  const backDir = getOppositeDirection(gs.player.direction);
                  for (let i = 0; i < gs.player.skills.aBackBullet; i++) {
                    multiDirections.push(backDir);
                  }
                }
                if (gs.player.skills.aLeftBullet > 0) {
                  const leftDir = getLeftDirection(gs.player.direction);
                  for (let i = 0; i < gs.player.skills.aLeftBullet; i++) {
                    multiDirections.push(leftDir);
                  }
                }
                if (gs.player.skills.aRightBullet > 0) {
                  const rightDir = getRightDirection(gs.player.direction);
                  for (let i = 0; i < gs.player.skills.aRightBullet; i++) {
                    multiDirections.push(rightDir);
                  }
                }
                
                const additionalProjectiles = multiDirections.map((dir, index) => {
                  const proj = createProjectile(gs.player, dir, gs.player.stats.aAtk);
                  const offset = (index % bulletCount) * 5;
                  const dirVec = getDirectionVector(dir);
                  proj.x += dirVec.y * offset;
                  proj.y -= dirVec.x * offset;
                  return proj;
                });
                
                return {
                  ...gs,
                  projectiles: [...gs.projectiles, ...additionalProjectiles],
                };
              });
            }, hit * 500);
          }
        }
        
      } else if (slotType === 'B') {
        // 近接攻撃 - 衝撃波エフェクト追加
        const baseRange = 80;
        const bonusRange = prev.player.skills.bRangeBonus * 20;
        const totalRange = baseRange + bonusRange;
        const dirVec = getDirectionVector(prev.player.direction);
        const attackX = prev.player.x + dirVec.x * 40;
        const attackY = prev.player.y + dirVec.y * 40;
        
        // 衝撃波エフェクト追加（前方のみ大きい範囲）
        const newShockwave: ShockwaveEffect = {
          id: `shock_${Date.now()}`,
          x: attackX,
          y: attackY,
          radius: 0,
          maxRadius: totalRange,
          startTime: Date.now(),
          duration: 300,
          direction: prev.player.direction,  // プレイヤーの向きを追加
        };
        setShockwaves(sw => [...sw, newShockwave]);
        
        // ノックバック力
        const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
        
        newState.enemies = prev.enemies.map(enemy => {
          const dx = enemy.x - attackX;
          const dy = enemy.y - attackY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // 敵が前方にいるかどうかをチェック（内積で判定）
          const toEnemyX = enemy.x - prev.player.x;
          const toEnemyY = enemy.y - prev.player.y;
          const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
          const isInFront = dotProduct > 0;
          
          // 前方ならボーナス範囲を適用、それ以外は基本範囲のみ
          const effectiveRange = isInFront ? totalRange : baseRange;
          
          if (dist < effectiveRange) {
            const damage = calculateDamage(
              prev.player.stats.bAtk,
              prev.player.stats.bAtk,
              enemy.stats.def,
              prev.player.statusEffects.some(e => e.type === 'buffer'),
              enemy.statusEffects.some(e => e.type === 'debuffer')
            );
            
            const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
            const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
            
            newState.damageTexts.push(createDamageText(enemy.x, enemy.y, damage));
            
            return {
              ...enemy,
              stats: {
                ...enemy.stats,
                hp: Math.max(0, enemy.stats.hp - damage),
              },
              knockbackVelocity: { x: knockbackX, y: knockbackY },
            };
          }
          return enemy;
        });
        
        // 多段攻撃処理（B列・タップ）
        const tapBMultiHitLevel = prev.player.skills.multiHitLevel;
        if (tapBMultiHitLevel > 0) {
          for (let hit = 1; hit <= tapBMultiHitLevel; hit++) {
            setTimeout(() => {
              setGameState(gs => {
                if (gs.isPaused || gs.isGameOver || gs.isLevelingUp) return gs;
                
                const bBaseRange = 80;
                const bBonusRange = gs.player.skills.bRangeBonus * 20;
                const bTotalRange = bBaseRange + bBonusRange;
                const bDirVec = getDirectionVector(gs.player.direction);
                const bAttackX = gs.player.x + bDirVec.x * 40;
                const bAttackY = gs.player.y + bDirVec.y * 40;
                
                const multiShockwave: ShockwaveEffect = {
                  id: `shock_tap_${Date.now()}_${hit}`,
                  x: bAttackX,
                  y: bAttackY,
                  radius: 0,
                  maxRadius: bTotalRange,
                  startTime: Date.now(),
                  duration: 300,
                  direction: gs.player.direction,  // プレイヤーの向きを追加
                };
                setShockwaves(sw => [...sw, multiShockwave]);
                
                const bKnockbackForce = 150 + gs.player.skills.bKnockbackBonus * 50;
                const newDamageTexts = [...gs.damageTexts];
                
                const updatedEnemies = gs.enemies.map(enemy => {
                  const dx = enemy.x - bAttackX;
                  const dy = enemy.y - bAttackY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  
                  // 敵が前方にいるかどうか
                  const toEnemyX = enemy.x - gs.player.x;
                  const toEnemyY = enemy.y - gs.player.y;
                  const dotProduct = toEnemyX * bDirVec.x + toEnemyY * bDirVec.y;
                  const isInFront = dotProduct > 0;
                  const effectiveRange = isInFront ? bTotalRange : bBaseRange;
                  
                  if (dist < effectiveRange) {
                    const damage = calculateDamage(
                      gs.player.stats.bAtk,
                      gs.player.stats.bAtk,
                      enemy.stats.def,
                      gs.player.statusEffects.some(e => e.type === 'buffer'),
                      enemy.statusEffects.some(e => e.type === 'debuffer')
                    );
                    
                    const knockbackX = dist > 0 ? (dx / dist) * bKnockbackForce : 0;
                    const knockbackY = dist > 0 ? (dy / dist) * bKnockbackForce : 0;
                    
                    newDamageTexts.push(createDamageText(enemy.x, enemy.y, damage));
                    
                    return {
                      ...enemy,
                      stats: {
                        ...enemy.stats,
                        hp: Math.max(0, enemy.stats.hp - damage),
                      },
                      knockbackVelocity: { x: knockbackX, y: knockbackY },
                    };
                  }
                  return enemy;
                });
                
                return {
                  ...gs,
                  enemies: updatedEnemies,
                  damageTexts: newDamageTexts,
                };
              });
            }, hit * 500);
          }
        }
        
      } else if (slotType === 'C' && prev.magicCooldown <= 0) {
        // 魔法発動
        const availableMagics = Object.entries(prev.player.magics)
          .filter(([_, level]) => level > 0);
        
        if (availableMagics.length > 0) {
          const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
          const result = castMagic(
            magicType as Parameters<typeof castMagic>[0],
            level,
            prev.player,
            prev.enemies
          );
          
          newState.enemies = result.enemies;
          newState.player = result.player;
          newState.damageTexts = [...prev.damageTexts, ...result.damageTexts];
          newState.magicCooldown = getMagicCooldown(prev.player.stats.reloadMagic);
          
          // サンダーの場合は雷エフェクトを追加
          if (magicType === 'thunder') {
            const newLightning = prev.enemies.map(enemy => ({
              id: `lightning_${Date.now()}_${enemy.id}`,
              x: enemy.x,
              y: enemy.y,
              startTime: Date.now(),
              duration: 500,
            }));
            setLightningEffects(le => [...le, ...newLightning]);
          }
        }
      }
      
      return newState;
    });
  }, [gameState.isGameOver, gameState.isPaused, gameState.isLevelingUp]);
  
  // ゲームループ
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver || gameState.isLevelingUp) {
      return;
    }
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastUpdateRef.current) / 1000, 0.1);
      lastUpdateRef.current = timestamp;
      
      // キーボードとバーチャルスティックのキーをマージ
      const combinedKeys = new Set([...keysRef.current, ...virtualKeysRef.current]);
      
      setGameState(prev => {
        if (!prev.isPlaying || prev.isPaused || prev.isGameOver || prev.isLevelingUp) {
          return prev;
        }
        
        const newState = { ...prev };
        
        // 時間更新
        newState.elapsedTime = prev.elapsedTime + deltaTime;
        
        // プレイヤー移動
        newState.player = updatePlayerPosition(prev.player, combinedKeys, deltaTime);
        
        // 敵移動（WAVE倍率適用）
        const waveSpeedMult = getWaveSpeedMultiplier(prev.wave.currentWave);
        newState.enemies = updateEnemyPositions(prev.enemies, newState.player.x, newState.player.y, deltaTime, waveSpeedMult);
        
        // 弾丸更新
        newState.projectiles = updateProjectiles(prev.projectiles, deltaTime);
        
        // 弾丸と敵の当たり判定（軽いノックバック追加）
        const hitResults: { enemyId: string; damage: number; projId: string }[] = [];
        newState.projectiles.forEach(proj => {
          newState.enemies.forEach(enemy => {
            if (proj.hitEnemies.has(enemy.id)) return;
            
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 20) {
              const damage = calculateDamage(
                proj.damage,
                0,
                enemy.stats.def,
                prev.player.statusEffects.some(e => e.type === 'buffer'),
                enemy.statusEffects.some(e => e.type === 'debuffer')
              );
              hitResults.push({ enemyId: enemy.id, damage, projId: proj.id });
              proj.hitEnemies.add(enemy.id);
              
              // A列ヒット時の軽いノックバック
              const dirVec = getDirectionVector(proj.direction);
              const knockbackForce = 80;
              enemy.knockbackVelocity = {
                x: dirVec.x * knockbackForce,
                y: dirVec.y * knockbackForce,
              };
            }
          });
        });
        
        // ダメージ適用
        hitResults.forEach(({ enemyId, damage }) => {
          const enemy = newState.enemies.find(e => e.id === enemyId);
          if (enemy) {
            enemy.stats.hp = Math.max(0, enemy.stats.hp - damage);
            newState.damageTexts.push(createDamageText(enemy.x, enemy.y, damage));
          }
        });
        
        // 貫通でない弾を削除
        newState.projectiles = newState.projectiles.filter(proj => {
          if (proj.penetrating) return true;
          return !hitResults.some(h => h.projId === proj.id);
        });
        
        // 炎オーラダメージ（FIRE魔法）
        if (prev.player.statusEffects.some(e => e.type === 'fire')) {
          newState.enemies = newState.enemies.map(enemy => {
            const dx = enemy.x - newState.player.x;
            const dy = enemy.y - newState.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 60) {
              const fireLevel = prev.player.magics.fire;
              const damage = Math.floor(5 * fireLevel * deltaTime);
              if (damage > 0 && Math.random() < 0.1) {
                newState.damageTexts.push(createDamageText(enemy.x, enemy.y, damage, true));
              }
              return {
                ...enemy,
                stats: {
                  ...enemy.stats,
                  hp: Math.max(0, enemy.stats.hp - damage),
                },
                statusEffects: [
                  ...enemy.statusEffects.filter(e => e.type !== 'fire'),
                  { type: 'fire' as const, duration: 3, startTime: Date.now(), level: fireLevel },
                ],
              };
            }
            return enemy;
          });
        }
        
        // 敵の攻撃（体当たり）
        newState.enemies.forEach(enemy => {
          const dx = enemy.x - newState.player.x;
          const dy = enemy.y - newState.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 30) {
            const defMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
            const damage = Math.max(1, Math.floor(enemy.stats.atk - newState.player.stats.def * defMultiplier * 0.5));
            newState.player.stats.hp = Math.max(0, newState.player.stats.hp - damage * deltaTime * 2);
          }
        });
        
        // 敵の射撃処理
        newState.enemies.forEach(enemy => {
          if (shouldEnemyShoot(enemy, newState.player.x, newState.player.y, newState.elapsedTime)) {
            const proj = createEnemyProjectile(enemy, newState.player.x, newState.player.y);
            newState.enemyProjectiles.push(proj);
          }
        });
        
        // 敵の弾丸更新
        newState.enemyProjectiles = updateEnemyProjectiles(prev.enemyProjectiles, deltaTime);
        
        // 敵の弾丸とプレイヤーの当たり判定（小さめ）
        const ENEMY_PROJECTILE_HIT_RADIUS = 15;
        newState.enemyProjectiles = newState.enemyProjectiles.filter(proj => {
          const dx = proj.x - newState.player.x;
          const dy = proj.y - newState.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < ENEMY_PROJECTILE_HIT_RADIUS) {
            // プレイヤーにダメージ
            const defMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
            const damage = Math.max(1, Math.floor(proj.damage - newState.player.stats.def * defMultiplier * 0.3));
            newState.player.stats.hp = Math.max(0, newState.player.stats.hp - damage);
            newState.damageTexts.push(createDamageText(newState.player.x, newState.player.y, damage));
            return false;  // 弾を削除
          }
          return true;  // 弾を残す
        });
        
        // 死んだ敵を処理 - コインをドロップ
        const defeatedEnemies = newState.enemies.filter(e => e.stats.hp <= 0);
        newState.enemies = newState.enemies.filter(e => e.stats.hp > 0);
        
        if (defeatedEnemies.length > 0) {
          // コインをスポーン
          defeatedEnemies.forEach(enemy => {
            const coins = createCoinsFromEnemy(enemy, config.expMultiplier);
            newState.coins = [...newState.coins, ...coins];
          });
          newState.enemiesDefeated += defeatedEnemies.length;
          
          // WAVEキル数を更新
          newState.wave = {
            ...newState.wave,
            waveKills: newState.wave.waveKills + defeatedEnemies.length,
          };
        }
        
        // コイン拾得処理
        const { player: playerAfterCoins, remainingCoins, leveledUp, levelUpCount } = collectCoins(
          newState.player,
          newState.coins
        );
        newState.player = playerAfterCoins;
        newState.coins = remainingCoins;
        
        // レベルアップ処理
        if (leveledUp && levelUpCount > 0) {
          const options = generateLevelUpOptions(playerAfterCoins, config.allowedChords);
          newState.isLevelingUp = true;
          newState.levelUpOptions = options;
          newState.pendingLevelUps = levelUpCount;
          setLevelUpCorrectNotes([[], [], []]);
        }
        
        // 期限切れコインのクリーンアップ
        newState.coins = cleanupExpiredCoins(newState.coins);
        
        // 敵スポーン
        spawnTimerRef.current += deltaTime;
        if (spawnTimerRef.current >= config.enemySpawnRate) {
          spawnTimerRef.current = 0;
          for (let i = 0; i < config.enemySpawnCount; i++) {
            const newEnemy = spawnEnemy(
              newState.player.x,
              newState.player.y,
              newState.elapsedTime,
              config
            );
            newState.enemies.push(newEnemy);
          }
        }
        
        // スロットタイマー更新
        newState.codeSlots.current = newState.codeSlots.current.map((slot, slotIndex) => {
          if (!slot.isEnabled) return slot;
          
          // 完了状態のスロットは一定時間後に自動リセット（setTimeoutが失敗した場合のフォールバック）
          if (slot.isCompleted) {
            // completedTimeが設定されていない場合は設定
            if (!slot.completedTime) {
              return { ...slot, completedTime: Date.now() };
            }
            // 500ms以上経過していたら強制リセット
            if (Date.now() - slot.completedTime > 500) {
              let nextChord = newState.codeSlots.next[slotIndex]?.chord;
              if (!nextChord) {
                nextChord = selectRandomChord(config.allowedChords, slot.chord?.id);
              }
              const newNextChord = selectRandomChord(config.allowedChords, nextChord?.id);
              newState.codeSlots.next = newState.codeSlots.next.map((ns, i) =>
                i === slotIndex ? { ...ns, chord: newNextChord } : ns
              ) as [CodeSlot, CodeSlot, CodeSlot];
              return { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, timer: SLOT_TIMEOUT, completedTime: undefined };
            }
            return slot;
          }
          
          // コードが空の場合、新しいコードを生成
          if (!slot.chord) {
            const newChord = selectRandomChord(config.allowedChords);
            if (newChord) {
              return { ...slot, chord: newChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
            }
            return slot;
          }
          
          const newTimer = slot.timer - deltaTime;
          if (newTimer <= 0) {
            // 次のコードを取得し、無ければ新しく生成
            let nextChord = newState.codeSlots.next[slotIndex]?.chord;
            if (!nextChord) {
              nextChord = selectRandomChord(config.allowedChords, slot.chord?.id);
            }
            
            // 次のスロットのコードも更新
            const newNextChord = selectRandomChord(config.allowedChords, nextChord?.id);
            newState.codeSlots.next = newState.codeSlots.next.map((ns, i) =>
              i === slotIndex ? { ...ns, chord: newNextChord } : ns
            ) as [CodeSlot, CodeSlot, CodeSlot];
            
            return { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
          }
          return { ...slot, timer: newTimer };
        }) as [CodeSlot, CodeSlot, CodeSlot];
        
        // 魔法クールダウン更新
        if (newState.magicCooldown > 0) {
          newState.magicCooldown = Math.max(0, newState.magicCooldown - deltaTime);
        }
        
        // ステータス効果の時間更新
        const now = Date.now();
        newState.player.statusEffects = newState.player.statusEffects.filter(
          e => (now - e.startTime) / 1000 < e.duration
        );
        newState.enemies = newState.enemies.map(enemy => ({
          ...enemy,
          statusEffects: enemy.statusEffects.filter(
            e => (now - e.startTime) / 1000 < e.duration
          ),
        }));
        
        // ダメージテキストのクリーンアップ
        newState.damageTexts = newState.damageTexts.filter(
          d => now - d.startTime < d.duration
        );
        
        // WAVEチェック
        const waveElapsedTime = newState.elapsedTime - newState.wave.waveStartTime;
        
        // WAVEノルマ達成マーク（ノルマ達成しても2分経つまでは同じWAVEに留まる）
        if (newState.wave.waveKills >= newState.wave.waveQuota && !newState.wave.waveCompleted) {
          newState.wave = {
            ...newState.wave,
            waveCompleted: true,
          };
        }
        
        // 2分経過後にWAVE進行チェック
        if (waveElapsedTime >= WAVE_DURATION) {
          // ノルマ未達成でゲームオーバー
          if (!newState.wave.waveCompleted) {
            newState.isGameOver = true;
            newState.isPlaying = false;
            newState.wave.waveFailedReason = 'quota_failed';
            
            const earnedXp = Math.floor(newState.elapsedTime / 60) * EXP_PER_MINUTE;
            setResult({
              survivalTime: newState.elapsedTime,
              finalLevel: newState.player.level,
              enemiesDefeated: newState.enemiesDefeated,
              playerStats: newState.player.stats,
              skills: newState.player.skills,
              magics: newState.player.magics,
              earnedXp,
            });
            return newState;
          }
          
          // ノルマ達成済み：次のWAVEへ
          const nextWave = newState.wave.currentWave + 1;
          newState.wave = {
            currentWave: nextWave,
            waveStartTime: newState.elapsedTime,
            waveKills: 0,
            waveQuota: calculateWaveQuota(nextWave),
            waveDuration: WAVE_DURATION,
            waveCompleted: false,
          };
        }
        
        // HPゲームオーバー判定
        if (newState.player.stats.hp <= 0) {
          newState.isGameOver = true;
          newState.isPlaying = false;
          
          const earnedXp = Math.floor(newState.elapsedTime / 60) * EXP_PER_MINUTE;
          setResult({
            survivalTime: newState.elapsedTime,
            finalLevel: newState.player.level,
            enemiesDefeated: newState.enemiesDefeated,
            playerStats: newState.player.stats,
            skills: newState.player.skills,
            magics: newState.player.magics,
            earnedXp,
          });
        }
        
        return newState;
      });
      
      // 衝撃波エフェクトの更新
      setShockwaves(sw => sw.filter(s => Date.now() - s.startTime < s.duration));
      
      // 雷エフェクトの更新
      setLightningEffects(le => le.filter(l => Date.now() - l.startTime < l.duration));
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.isLevelingUp, config]);
  
  // リトライ
  const handleRetry = useCallback(() => {
    setResult(null);
    setShockwaves([]);
    setLightningEffects([]);
    setLevelUpCorrectNotes([[], [], []]);
    const initial = createInitialGameState(difficulty, config);
    // デバッグ設定を再適用
    if (debugSettings) {
      // 攻撃力設定
      if (debugSettings.aAtk !== undefined) {
        initial.player.stats.aAtk = debugSettings.aAtk;
      }
      if (debugSettings.bAtk !== undefined) {
        initial.player.stats.bAtk = debugSettings.bAtk;
      }
      if (debugSettings.cAtk !== undefined) {
        initial.player.stats.cAtk = debugSettings.cAtk;
      }
      // TIME（効果時間延長）設定
      if (debugSettings.time !== undefined) {
        initial.player.stats.time = debugSettings.time;
      }
      
      // 初期レベル設定
      if (debugSettings.initialLevel !== undefined && debugSettings.initialLevel > 1) {
        initial.player.level = debugSettings.initialLevel;
        let expToNext = 10;
        for (let i = 1; i < debugSettings.initialLevel; i++) {
          expToNext = Math.floor(expToNext * 1.5);
        }
        initial.player.expToNextLevel = expToNext;
      }
      
      // 魔法の個別設定
      if (debugSettings.magics) {
        if (debugSettings.magics.thunder !== undefined) {
          initial.player.magics.thunder = debugSettings.magics.thunder;
        }
        if (debugSettings.magics.ice !== undefined) {
          initial.player.magics.ice = debugSettings.magics.ice;
        }
        if (debugSettings.magics.fire !== undefined) {
          initial.player.magics.fire = debugSettings.magics.fire;
        }
        if (debugSettings.magics.heal !== undefined) {
          initial.player.magics.heal = debugSettings.magics.heal;
        }
        if (debugSettings.magics.buffer !== undefined) {
          initial.player.magics.buffer = debugSettings.magics.buffer;
        }
        if (debugSettings.magics.debuffer !== undefined) {
          initial.player.magics.debuffer = debugSettings.magics.debuffer;
        }
        if (debugSettings.magics.hint !== undefined) {
          initial.player.magics.hint = debugSettings.magics.hint;
        }
      }
      
      // スキル設定
      if (debugSettings.skills) {
        const skills = debugSettings.skills;
        if (skills.aPenetration !== undefined) {
          initial.player.skills.aPenetration = skills.aPenetration;
        }
        if (skills.aBulletCount !== undefined) {
          initial.player.stats.aBulletCount = skills.aBulletCount;
        }
        if (skills.aBackBullet !== undefined) {
          initial.player.skills.aBackBullet = skills.aBackBullet;
        }
        if (skills.aRightBullet !== undefined) {
          initial.player.skills.aRightBullet = skills.aRightBullet;
        }
        if (skills.aLeftBullet !== undefined) {
          initial.player.skills.aLeftBullet = skills.aLeftBullet;
        }
        if (skills.bKnockbackBonus !== undefined) {
          initial.player.skills.bKnockbackBonus = skills.bKnockbackBonus;
        }
        if (skills.bRangeBonus !== undefined) {
          initial.player.skills.bRangeBonus = skills.bRangeBonus;
        }
        if (skills.multiHitLevel !== undefined) {
          initial.player.skills.multiHitLevel = Math.min(3, skills.multiHitLevel);
        }
      }
    }
    setGameState(initial);
    startGame();
  }, [difficulty, config, startGame, debugSettings]);
  
  // ヒントスロット追跡（ローテーション用）
  const lastHintSlotRef = useRef<number>(0);
  const lastCompletedSlotRef = useRef<number | null>(null);
  
  // ヒントスロット判定（A/B列を交互に表示）
  const getHintSlotIndex = (): number | null => {
    if (!gameState.player.statusEffects.some(e => e.type === 'hint')) return null;
    
    // 有効で未完了のスロットを収集（A=0, B=1のみ、C=2は除外）
    const availableSlots: number[] = [];
    for (let i = 0; i < 2; i++) {  // A列とB列のみ（C列は除外）
      if (gameState.codeSlots.current[i].isEnabled && !gameState.codeSlots.current[i].isCompleted) {
        availableSlots.push(i);
      }
    }
    
    if (availableSlots.length === 0) return null;
    
    // スロットが完了した場合、次のスロットに切り替え
    const currentSlot = gameState.codeSlots.current[lastHintSlotRef.current];
    if (currentSlot?.isCompleted && lastCompletedSlotRef.current !== lastHintSlotRef.current) {
      // 完了したスロットを記録
      lastCompletedSlotRef.current = lastHintSlotRef.current;
      // 次の有効なスロットに切り替え
      const nextSlot = (lastHintSlotRef.current + 1) % 2;  // A↔B切り替え
      if (availableSlots.includes(nextSlot)) {
        lastHintSlotRef.current = nextSlot;
      } else if (availableSlots.length > 0) {
        lastHintSlotRef.current = availableSlots[0];
      }
    }
    
    // 現在のヒントスロットが利用可能でなければ、利用可能な最初のスロットに切り替え
    if (!availableSlots.includes(lastHintSlotRef.current)) {
      lastHintSlotRef.current = availableSlots[0];
      lastCompletedSlotRef.current = null;  // 完了記録をリセット
    }
    
    return lastHintSlotRef.current;
  };
  
  // HINT鍵盤ハイライト
  const prevHintNotesRef = useRef<number[]>([]);
  useEffect(() => {
    const hintSlotIndex = getHintSlotIndex();
    const renderer = pixiRendererRef.current;
    
    // 以前のハイライトをクリア
    prevHintNotesRef.current.forEach(note => {
      renderer?.highlightKey(note, false);
    });
    prevHintNotesRef.current = [];
    
    // HINTが有効な場合、該当スロットのコードの構成音をハイライト
    if (hintSlotIndex !== null && renderer) {
      const slot = gameState.codeSlots.current[hintSlotIndex];
      if (slot.chord?.notes) {
        // 基本形のみ表示: オクターブ4を基準に、各構成音を1つずつハイライト
        // 3和音なら3鍵盤、4和音なら4鍵盤のみ表示
        const highlightNotes: number[] = [];
        const baseOctave = 4;
        
        // 元のノート配列（重複なし）を基本形の順序で取得
        const uniqueNoteMod12 = [...new Set(slot.chord.notes.map(n => n % 12))];
        
        // 各構成音をオクターブ4基準で昇順に配置
        let lastMidi = 0;
        for (const noteMod12 of uniqueNoteMod12) {
          // オクターブ4基準のMIDIノート
          let midiNote = noteMod12 + baseOctave * 12;
          // 前の音より低い場合はオクターブを上げる（基本形の昇順）
          while (midiNote <= lastMidi) {
            midiNote += 12;
          }
          highlightNotes.push(midiNote);
          lastMidi = midiNote;
        }
        
        highlightNotes.forEach(note => {
          renderer.highlightKey(note, true);
        });
        prevHintNotesRef.current = highlightNotes;
      }
    }
  }, [gameState.player.statusEffects, gameState.codeSlots.current]);
  
  // 方向ヘルパー
  const getOppositeDirection = (dir: Direction): Direction => {
    const opposites: Record<Direction, Direction> = {
      'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left',
      'up-left': 'down-right', 'up-right': 'down-left',
      'down-left': 'up-right', 'down-right': 'up-left',
    };
    return opposites[dir];
  };
  
  const getLeftDirection = (dir: Direction): Direction => {
    const lefts: Record<Direction, Direction> = {
      'up': 'left', 'down': 'right', 'left': 'down', 'right': 'up',
      'up-left': 'down-left', 'up-right': 'up-left',
      'down-left': 'down-right', 'down-right': 'up-right',
    };
    return lefts[dir];
  };
  
  const getRightDirection = (dir: Direction): Direction => {
    const rights: Record<Direction, Direction> = {
      'up': 'right', 'down': 'left', 'left': 'up', 'right': 'down',
      'up-left': 'up-right', 'up-right': 'down-right',
      'down-left': 'up-left', 'down-right': 'down-left',
    };
    return rights[dir];
  };
  
  // フォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ピアノ幅計算（ファンタジーモードと同じロジック）
  const calculatePianoWidth = () => {
    const gameAreaWidth = gameAreaRef.current?.clientWidth || window.innerWidth;
    const adjustedThreshold = 1100;
    const VISIBLE_WHITE_KEYS = 14;
    const TOTAL_WHITE_KEYS = 52;
    
    if (gameAreaWidth >= adjustedThreshold) {
      return { width: gameAreaWidth, needsScroll: false };
    } else {
      const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
      return { width: Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth), needsScroll: true };
    }
  };

  return (
    <div className="min-h-[var(--dvh,100dvh)] bg-gradient-to-b from-gray-900 via-purple-900 to-black flex flex-col fantasy-game-screen">
      {/* ヘッダー - 薄く */}
      <div className="flex-shrink-0 px-2 py-1">
        {/* EXPバー（画面上部全体） */}
        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
            style={{ width: `${(gameState.player.exp / gameState.player.expToNextLevel) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* WAVE・時間・レベル */}
          <div className="flex items-center gap-3 text-white font-sans text-sm">
            {/* WAVE表示 */}
            <div className="flex items-center gap-1 bg-yellow-600/50 px-2 py-0.5 rounded">
              <span className="font-bold text-yellow-300">WAVE {gameState.wave.currentWave}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span className="text-lg font-bold">{formatTime(gameState.elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span>Lv.{gameState.player.level}</span>
            </div>
          </div>
          
          {/* WAVEノルマ表示 */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center text-xs">
              <span className="text-gray-400">残り</span>
              <span className={cn(
                'font-bold',
                gameState.wave.waveKills >= gameState.wave.waveQuota 
                  ? 'text-green-400' 
                  : (gameState.elapsedTime - gameState.wave.waveStartTime) > WAVE_DURATION * 0.7
                    ? 'text-red-400'
                    : 'text-white'
              )}>
                {Math.max(0, gameState.wave.waveQuota - gameState.wave.waveKills)}体
              </span>
            </div>
            <div className="flex flex-col items-center text-xs">
              <span className="text-gray-400">制限</span>
              <span className={cn(
                'font-bold',
                (WAVE_DURATION - (gameState.elapsedTime - gameState.wave.waveStartTime)) < 30 
                  ? 'text-red-400 animate-pulse' 
                  : 'text-white'
              )}>
                {formatTime(Math.max(0, WAVE_DURATION - (gameState.elapsedTime - gameState.wave.waveStartTime)))}
              </span>
            </div>
          </div>
          
          {/* HP */}
          <div className="flex items-center gap-2">
            <span>❤️</span>
            <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-200',
                  gameState.player.stats.hp / gameState.player.stats.maxHp > 0.5 ? 'bg-green-500' :
                  gameState.player.stats.hp / gameState.player.stats.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${(gameState.player.stats.hp / gameState.player.stats.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-white font-sans text-xs">
              {Math.floor(gameState.player.stats.hp)}/{gameState.player.stats.maxHp}
            </span>
          </div>
          
          {/* 設定/ポーズボタン */}
          <div className="flex gap-1">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded font-sans text-white text-sm"
              title={isEnglishCopy ? 'Settings' : '設定'}
            >
              ⚙️
            </button>
            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded font-sans text-white text-sm"
            >
              {gameState.isPaused ? '▶️' : '⏸️'}
            </button>
          </div>
        </div>
      </div>
      
      {/* 初期化エラー表示（閉じられるトースト） */}
      {initError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md">
          <div className="bg-yellow-900/90 border border-yellow-600 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-yellow-200 text-sm flex-1">{initError}</span>
            <button
              onClick={() => setInitError(null)}
              className="text-yellow-400 hover:text-yellow-200 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* メインゲームエリア */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 relative">
        {/* バーチャルスティック（モバイル時のみ） */}
        {isMobile && (
          <div className="absolute left-4 bottom-4 z-30">
            <VirtualStick onDirectionChange={handleVirtualStickChange} />
          </div>
        )}
        
        {/* A/B/Cタップボタン（デバッグ用） */}
        {debugSettings?.tapSkillActivation && (
          <div className="absolute right-4 bottom-4 z-30 flex flex-col gap-2">
            <button
              onClick={() => handleTapSkillActivation(0)}
              className="w-16 h-16 bg-blue-600/80 hover:bg-blue-500 rounded-lg font-bold text-white text-xl shadow-lg border-2 border-blue-400 active:scale-95 transition-transform"
            >
              🔫 A
            </button>
            <button
              onClick={() => handleTapSkillActivation(1)}
              className="w-16 h-16 bg-orange-600/80 hover:bg-orange-500 rounded-lg font-bold text-white text-xl shadow-lg border-2 border-orange-400 active:scale-95 transition-transform"
            >
              👊 B
            </button>
            <button
              onClick={() => handleTapSkillActivation(2)}
              disabled={!gameState.codeSlots.current[2].isEnabled}
              className={cn(
                "w-16 h-16 rounded-lg font-bold text-white text-xl shadow-lg border-2 active:scale-95 transition-transform",
                gameState.codeSlots.current[2].isEnabled
                  ? "bg-purple-600/80 hover:bg-purple-500 border-purple-400"
                  : "bg-gray-600/50 border-gray-500 cursor-not-allowed opacity-50"
              )}
            >
              🪄 C
            </button>
          </div>
        )}
        
        {/* Canvasエリア */}
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-700">
          <SurvivalCanvas
            gameState={gameState}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            shockwaves={shockwaves}
            lightningEffects={lightningEffects}
          />
          
          {/* ポーズ画面 */}
          {gameState.isPaused && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white font-sans mb-4">PAUSED</div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-sans text-white"
                  >
                    {isEnglishCopy ? 'Resume' : '再開'}
                  </button>
                  <button
                    onClick={onBackToSelect}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-sans text-white"
                  >
                    {isEnglishCopy ? 'Quit' : 'やめる'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* コードスロット */}
        <SurvivalCodeSlots
          currentSlots={gameState.codeSlots.current}
          nextSlots={gameState.codeSlots.next}
          hintSlotIndex={getHintSlotIndex()}
          magicCooldown={gameState.magicCooldown}
          hasMagic={Object.values(gameState.player.magics).some(l => l > 0)}
        />
      </div>
      
      {/* ピアノ（PIXINotesRenderer使用） */}
      <div 
        ref={gameAreaRef}
        className="relative mx-2 mb-1 bg-black bg-opacity-20 rounded-lg overflow-hidden flex-shrink-0 w-full"
        style={{ height: '120px' }}
      >
        {(() => {
          const { width: pixiWidth, needsScroll } = calculatePianoWidth();
          
          if (needsScroll) {
            return (
              <div 
                className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x custom-game-scrollbar" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'none',
                  scrollBehavior: 'auto',
                  width: '100%',
                  touchAction: 'pan-x',
                  overscrollBehavior: 'contain'
                }}
                ref={(el) => {
                  pianoScrollRef.current = el;
                  if (el) {
                    requestAnimationFrame(() => {
                      requestAnimationFrame(centerPianoC4);
                    });
                  }
                }}
              >
                <PIXINotesRenderer
                  width={pixiWidth}
                  height={120}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          } else {
            return (
              <div className="absolute inset-0 overflow-hidden">
                <PIXINotesRenderer
                  width={pixiWidth}
                  height={120}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          }
        })()}
      </div>
      
      {/* レベルアップ画面 */}
      {gameState.isLevelingUp && (
        <SurvivalLevelUp
          options={gameState.levelUpOptions}
          onSelect={handleLevelUpBonusSelect}
          onTimeout={handleLevelUpTimeout}
          level={gameState.player.level}
          pendingLevelUps={gameState.pendingLevelUps}
          onNoteInput={handleNoteInput}
          correctNotes={levelUpCorrectNotes}
          tapSelectionEnabled={debugSettings?.tapSkillActivation}
        />
      )}
      
      {/* ゲームオーバー画面 */}
      {result && (
        <SurvivalGameOver
          result={result}
          difficulty={difficulty}
          onRetry={handleRetry}
          onBackToSelect={onBackToSelect}
          onBackToMenu={onBackToMenu}
          waveFailedReason={gameState.wave.waveFailedReason}
          finalWave={gameState.wave.currentWave}
        />
      )}
      
      {/* 設定モーダル */}
      <SurvivalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMidiConnected={isMidiConnected}
      />
    </div>
  );
};

export default SurvivalGameScreen;
