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
} from './SurvivalGameEngine';
import SurvivalCanvas from './SurvivalCanvas';
import SurvivalCodeSlots from './SurvivalCodeSlots';
import SurvivalLevelUp from './SurvivalLevelUp';
import SurvivalGameOver from './SurvivalGameOver';
import { MIDIController, playNote, stopNote, initializeAudioSystem } from '@/utils/MidiController';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import FantasySettingsModal from '../fantasy/FantasySettingsModal';
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

interface SurvivalGameScreenProps {
  difficulty: SurvivalDifficulty;
  config: DifficultyConfig;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
  debugSettings?: {
    aAtk?: number;
    bAtk?: number;
    skills?: string[];
    tapSkillActivation?: boolean;
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
      if (debugSettings.aAtk !== undefined) {
        initial.player.stats.aAtk = debugSettings.aAtk;
      }
      if (debugSettings.bAtk !== undefined) {
        initial.player.stats.bAtk = debugSettings.bAtk;
      }
      if (debugSettings.skills) {
        debugSettings.skills.forEach(skill => {
          switch (skill) {
            case 'a_penetration':
              initial.player.skills.aPenetration = true;
              break;
            case 'a_back_bullet':
              initial.player.skills.aBackBullet = 3;
              break;
            case 'a_right_bullet':
              initial.player.skills.aRightBullet = 3;
              break;
            case 'a_left_bullet':
              initial.player.skills.aLeftBullet = 3;
              break;
            case 'multi_hit':
              initial.player.skills.multiHitLevel = 3;
              break;
            case 'magic_all':
              initial.player.magics = {
                thunder: 3, ice: 3, fire: 3, heal: 3,
                buffer: 3, debuffer: 3, hint: 3,
              };
              break;
          }
        });
      }
    }
    return initial;
  });
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  const [levelUpCorrectNotes, setLevelUpCorrectNotes] = useState<number[][]>([[], [], []]);
  
  // 衝撃波エフェクト
  const [shockwaves, setShockwaves] = useState<ShockwaveEffect[]>([]);
  
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
  
  // ビューポートサイズ
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // MIDIコントローラー初期化
  useEffect(() => {
    const initMidi = async () => {
      try {
        await initializeAudioSystem();
        
        midiControllerRef.current = new MIDIController({
          onNoteOn: (note: number) => {
            handleNoteInput(note);
            playNote(note, 100);
            pixiRendererRef.current?.highlightKey(note, true);
          },
          onNoteOff: (note: number) => {
            stopNote(note);
            pixiRendererRef.current?.highlightKey(note, false);
          },
          playMidiSound: false,
        });
        
        await midiControllerRef.current.initialize();
        
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
  }, []);
  
  // PIXIレンダラーの準備
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    pixiRendererRef.current = renderer;
    if (renderer) {
      renderer.updateSettings({
        showHitLine: false,
        noteNameStyle: settings.noteNameStyle,
        simpleDisplayMode: settings.simpleDisplayMode,
      });
      
      // タッチ/クリックハンドラー設定
      renderer.setKeyCallbacks(
        (note: number) => {
          handleNoteInput(note);
          playNote(note, 100);
        },
        (note: number) => {
          stopNote(note);
        }
      );
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
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // バーチャルスティックの方向変更
  const handleVirtualStickChange = useCallback((keys: Set<string>) => {
    virtualKeysRef.current = keys;
  }, []);
  
  // ゲーム開始
  const startGame = useCallback(() => {
    const hasMagic = Object.values(gameState.player.magics).some(l => l > 0);
    const codeSlots = initializeCodeSlots(config.allowedChords, hasMagic);
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      codeSlots,
    }));
    
    lastUpdateRef.current = performance.now();
    spawnTimerRef.current = 0;
  }, [config.allowedChords, gameState.player.magics]);
  
  // ゲーム開始（初回）
  useEffect(() => {
    startGame();
  }, []);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    // レベルアップ中の処理
    if (gameState.isLevelingUp) {
      setLevelUpCorrectNotes(prev => {
        const newNotes = [...prev];
        gameState.levelUpOptions.forEach((option, index) => {
          if (option.chord) {
            const correct = getCorrectNotes([...prev[index], note], option.chord);
            newNotes[index] = correct;
            
            // 完成チェック
            if (checkChordMatch([...prev[index], note], option.chord)) {
              // ボーナス適用
              setGameState(gs => {
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
                  setLevelUpCorrectNotes([[], [], []]);
                  return {
                    ...gs,
                    player: newPlayer,
                    pendingLevelUps: newPendingLevelUps,
                    levelUpOptions: newOptions,
                    codeSlots: newCodeSlots,
                  };
                } else {
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
            }
          }
        });
        return newNotes;
      });
      return;
    }
    
    // 通常のコード入力処理
    setGameState(prev => {
      const newState = { ...prev };
      const noteMod12 = note % 12;
      
      // 各スロットをチェック
      let completedSlotIndex: number | null = null;
      
      newState.codeSlots.current = prev.codeSlots.current.map((slot, index) => {
        if (!slot.isEnabled || slot.isCompleted || !slot.chord) return slot;
        
        const targetNotes = [...new Set(slot.chord.notes.map(n => n % 12))];
        if (!targetNotes.includes(noteMod12)) return slot;
        if (slot.correctNotes.includes(noteMod12)) return slot;
        
        const newCorrectNotes = [...slot.correctNotes, noteMod12];
        const isComplete = newCorrectNotes.length >= targetNotes.length;
        
        if (isComplete) {
          completedSlotIndex = index;
        }
        
        return {
          ...slot,
          correctNotes: newCorrectNotes,
          isCompleted: isComplete,
        };
      }) as [CodeSlot, CodeSlot, CodeSlot];
      
      // コード完成時の処理
      if (completedSlotIndex !== null) {
        const slotType = ['A', 'B', 'C'][completedSlotIndex] as 'A' | 'B' | 'C';
        
        // 攻撃処理
        if (slotType === 'A') {
          // 遠距離弾発射
          const directions: Direction[] = [prev.player.direction];
          
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
          
          const newProjectiles = directions.map(dir => 
            createProjectile(prev.player, dir, prev.player.stats.aAtk)
          );
          newState.projectiles = [...prev.projectiles, ...newProjectiles];
          
        } else if (slotType === 'B') {
          // 近接攻撃 - 衝撃波エフェクト追加
          const attackRange = 80 + prev.player.skills.bRangeBonus * 20;
          const dirVec = getDirectionVector(prev.player.direction);
          const attackX = prev.player.x + dirVec.x * 40;
          const attackY = prev.player.y + dirVec.y * 40;
          
          // 衝撃波エフェクト追加
          const newShockwave: ShockwaveEffect = {
            id: `shock_${Date.now()}`,
            x: attackX,
            y: attackY,
            radius: 0,
            maxRadius: attackRange,
            startTime: Date.now(),
            duration: 300,
          };
          setShockwaves(sw => [...sw, newShockwave]);
          
          // ノックバック力
          const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
          
          newState.enemies = prev.enemies.map(enemy => {
            const dx = enemy.x - attackX;
            const dy = enemy.y - attackY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < attackRange) {
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
                    ? { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, timer: SLOT_TIMEOUT }
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
  }, [gameState.isGameOver, gameState.isPaused, gameState.isLevelingUp, gameState.levelUpOptions, config.allowedChords]);
  
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
        const directions: Direction[] = [prev.player.direction];
        
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
        
        const newProjectiles = directions.map(dir => 
          createProjectile(prev.player, dir, prev.player.stats.aAtk)
        );
        newState.projectiles = [...prev.projectiles, ...newProjectiles];
        
      } else if (slotType === 'B') {
        // 近接攻撃 - 衝撃波エフェクト追加
        const attackRange = 80 + prev.player.skills.bRangeBonus * 20;
        const dirVec = getDirectionVector(prev.player.direction);
        const attackX = prev.player.x + dirVec.x * 40;
        const attackY = prev.player.y + dirVec.y * 40;
        
        // 衝撃波エフェクト追加
        const newShockwave: ShockwaveEffect = {
          id: `shock_${Date.now()}`,
          x: attackX,
          y: attackY,
          radius: 0,
          maxRadius: attackRange,
          startTime: Date.now(),
          duration: 300,
        };
        setShockwaves(sw => [...sw, newShockwave]);
        
        // ノックバック力
        const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
        
        newState.enemies = prev.enemies.map(enemy => {
          const dx = enemy.x - attackX;
          const dy = enemy.y - attackY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < attackRange) {
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
        
        // 敵移動
        newState.enemies = updateEnemyPositions(prev.enemies, newState.player.x, newState.player.y, deltaTime);
        
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
        
        // 死んだ敵を処理
        const defeatedEnemies = newState.enemies.filter(e => e.stats.hp <= 0);
        newState.enemies = newState.enemies.filter(e => e.stats.hp > 0);
        
        // 経験値獲得とレベルアップ
        if (defeatedEnemies.length > 0) {
          const expGained = defeatedEnemies.reduce((sum, e) => sum + (e.isBoss ? 50 : 10) * config.expMultiplier, 0);
          const { player: newPlayer, leveledUp } = addExp(newState.player, expGained);
          newState.player = newPlayer;
          newState.enemiesDefeated += defeatedEnemies.length;
          
          if (leveledUp) {
            let pendingLevelUps = 0;
            let tempPlayer = newPlayer;
            while (tempPlayer.exp >= tempPlayer.expToNextLevel) {
              pendingLevelUps++;
              tempPlayer = { ...tempPlayer, exp: tempPlayer.exp - tempPlayer.expToNextLevel };
            }
            
            const options = generateLevelUpOptions(newPlayer, config.allowedChords);
            newState.isLevelingUp = true;
            newState.levelUpOptions = options;
            newState.pendingLevelUps = pendingLevelUps + 1;
            setLevelUpCorrectNotes([[], [], []]);
          }
        }
        
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
        newState.codeSlots.current = newState.codeSlots.current.map(slot => {
          if (!slot.isEnabled || slot.isCompleted) return slot;
          const newTimer = slot.timer - deltaTime;
          if (newTimer <= 0) {
            const nextChord = newState.codeSlots.next[['A', 'B', 'C'].indexOf(slot.type)].chord;
            return { ...slot, chord: nextChord, correctNotes: [], timer: SLOT_TIMEOUT };
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
        
        // ゲームオーバー判定
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
    const initial = createInitialGameState(difficulty, config);
    // デバッグ設定を再適用
    if (debugSettings) {
      if (debugSettings.aAtk !== undefined) {
        initial.player.stats.aAtk = debugSettings.aAtk;
      }
      if (debugSettings.bAtk !== undefined) {
        initial.player.stats.bAtk = debugSettings.bAtk;
      }
    }
    setGameState(initial);
    startGame();
  }, [difficulty, config, startGame, debugSettings]);
  
  // ヒントスロット判定
  const getHintSlotIndex = (): number | null => {
    if (!gameState.player.statusEffects.some(e => e.type === 'hint')) return null;
    for (let i = 0; i < 3; i++) {
      if (gameState.codeSlots.current[i].isEnabled && !gameState.codeSlots.current[i].isCompleted) {
        return i;
      }
    }
    return null;
  };
  
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
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* 時間・レベル・撃破数 */}
          <div className="flex items-center gap-4 text-white font-sans">
            <div className="flex items-center gap-2">
              <span className="text-xl">⏱️</span>
              <span className="text-2xl font-bold">{formatTime(gameState.elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="text-xl">Lv.{gameState.player.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💀</span>
              <span className="text-xl">{gameState.enemiesDefeated}</span>
            </div>
          </div>
          
          {/* HP */}
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-200',
                  gameState.player.stats.hp / gameState.player.stats.maxHp > 0.5 ? 'bg-green-500' :
                  gameState.player.stats.hp / gameState.player.stats.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${(gameState.player.stats.hp / gameState.player.stats.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-white font-sans text-sm">
              {Math.floor(gameState.player.stats.hp)}/{gameState.player.stats.maxHp}
            </span>
          </div>
          
          {/* 設定/ポーズボタン */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-sans text-white"
              title={isEnglishCopy ? 'Settings' : '設定'}
            >
              ⚙️
            </button>
            <button
              onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-sans text-white"
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
          onSelect={() => {}}
          level={gameState.player.level}
          pendingLevelUps={gameState.pendingLevelUps}
          onNoteInput={handleNoteInput}
          correctNotes={levelUpCorrectNotes}
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
        />
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChange={() => {}}
      />
    </div>
  );
};

export default SurvivalGameScreen;
