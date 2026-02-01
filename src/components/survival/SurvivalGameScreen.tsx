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
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

// ===== シンプルなオンスクリーンピアノ =====
interface SimplePianoProps {
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
  activeNotes: Set<number>;
}

const SimplePiano: React.FC<SimplePianoProps> = ({ onNoteOn, onNoteOff, activeNotes }) => {
  const startMidi = 48; // C3
  const endMidi = 72;   // C5
  
  const isBlack = (midi: number): boolean => {
    const n = midi % 12;
    return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
  };
  
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const whiteKeys: number[] = [];
  const blackKeys: number[] = [];
  for (let n = startMidi; n <= endMidi; n++) {
    if (isBlack(n)) blackKeys.push(n);
    else whiteKeys.push(n);
  }
  
  const handlePointerDown = (note: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onNoteOn(note);
  };
  
  const handlePointerUp = (note: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    onNoteOff(note);
  };
  
  const whiteKeyWidth = 100 / whiteKeys.length;
  
  const blackKeyOffsets: Record<number, number> = {
    1: 0.66, 3: 1.58, 6: 3.66, 8: 4.58, 10: 5.66
  };
  
  return (
    <div className="relative h-32 mx-auto max-w-4xl select-none touch-none">
      {/* 白鍵 */}
      <div className="absolute inset-0 flex">
        {whiteKeys.map((note, i) => (
          <div
            key={note}
            className={cn(
              'flex-1 border border-gray-600 rounded-b-md flex items-end justify-center pb-2 cursor-pointer transition-colors',
              activeNotes.has(note) ? 'bg-green-400' : 'bg-white hover:bg-gray-100'
            )}
            onPointerDown={handlePointerDown(note)}
            onPointerUp={handlePointerUp(note)}
            onPointerLeave={handlePointerUp(note)}
          >
            <span className="text-xs text-gray-600 font-mono">
              {noteNames[note % 12]}
            </span>
          </div>
        ))}
      </div>
      
      {/* 黒鍵 */}
      {blackKeys.map(note => {
        const semitone = note % 12;
        const octave = Math.floor(note / 12);
        const octaveStart = octave * 12;
        const whitesBefore = whiteKeys.filter(w => w < octaveStart).length;
        const offset = blackKeyOffsets[semitone] || 0;
        const leftPercent = (whitesBefore + offset) * whiteKeyWidth;
        
        return (
          <div
            key={note}
            className={cn(
              'absolute top-0 h-[60%] rounded-b-md cursor-pointer transition-colors z-10',
              activeNotes.has(note) ? 'bg-green-600' : 'bg-gray-800 hover:bg-gray-700'
            )}
            style={{
              left: `${leftPercent}%`,
              width: `${whiteKeyWidth * 0.6}%`,
            }}
            onPointerDown={handlePointerDown(note)}
            onPointerUp={handlePointerUp(note)}
            onPointerLeave={handlePointerUp(note)}
          />
        );
      })}
    </div>
  );
};

interface SurvivalGameScreenProps {
  difficulty: SurvivalDifficulty;
  config: DifficultyConfig;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
}

const SurvivalGameScreen: React.FC<SurvivalGameScreenProps> = ({
  difficulty,
  config,
  onBackToSelect,
  onBackToMenu,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  // ゲーム状態
  const [gameState, setGameState] = useState<SurvivalGameState>(() => 
    createInitialGameState(difficulty, config)
  );
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  const [levelUpCorrectNotes, setLevelUpCorrectNotes] = useState<number[][]>([[], [], []]);
  
  // キー入力状態
  const keysRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  
  // MIDI関連
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  
  // ビューポートサイズ
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  
  // ビューポートサイズ更新
  useEffect(() => {
    const updateSize = () => {
      const width = Math.min(window.innerWidth - 32, 1200);
      const height = Math.min(window.innerHeight - 350, 600);
      setViewportSize({ width, height });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // MIDIコントローラー初期化
  useEffect(() => {
    const initMidi = async () => {
      await initializeAudioSystem();
      
      midiControllerRef.current = new MIDIController({
        onNoteOn: (note: number) => {
          setActiveNotes(prev => new Set(prev).add(note));
          handleNoteInput(note);
          playNote(note, 100);
        },
        onNoteOff: (note: number) => {
          setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });
          stopNote(note);
        },
        playMidiSound: false,
      });
      
      await midiControllerRef.current.initialize();
    };
    
    initMidi();
    
    return () => {
      midiControllerRef.current?.destroy();
    };
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
  
  // ゲーム開始
  const startGame = useCallback(() => {
    const hasMagic = false;  // 最初は魔法なし
    const codeSlots = initializeCodeSlots(config.allowedChords, hasMagic);
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      codeSlots,
    }));
    
    lastUpdateRef.current = performance.now();
    spawnTimerRef.current = 0;
  }, [config.allowedChords]);
  
  // ゲーム開始（初回）
  useEffect(() => {
    startGame();
  }, [startGame]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    // レベルアップ中の処理
    if (gameState.isLevelingUp) {
      setLevelUpCorrectNotes(prev => {
        const newNotes = [...prev];
        gameState.levelUpOptions.forEach((option, index) => {
          if (option.chord) {
            const correct = getCorrectNotes([...prev[index].map(n => n), note], option.chord);
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
                  // まだレベルアップが残っている
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
                  // レベルアップ完了
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
          // 近接攻撃
          const attackRange = 80 + prev.player.skills.bRangeBonus * 20;
          const dirVec = getDirectionVector(prev.player.direction);
          const attackX = prev.player.x + dirVec.x * 40;
          const attackY = prev.player.y + dirVec.y * 40;
          
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
              
              // ノックバック
              const knockbackForce = 200 + prev.player.skills.bKnockbackBonus * 50;
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
              magicType as any,
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
  
  // ゲームループ
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver || gameState.isLevelingUp) {
      return;
    }
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastUpdateRef.current) / 1000, 0.1);
      lastUpdateRef.current = timestamp;
      
      setGameState(prev => {
        if (!prev.isPlaying || prev.isPaused || prev.isGameOver || prev.isLevelingUp) {
          return prev;
        }
        
        const newState = { ...prev };
        
        // 時間更新
        newState.elapsedTime = prev.elapsedTime + deltaTime;
        
        // プレイヤー移動
        newState.player = updatePlayerPosition(prev.player, keysRef.current, deltaTime);
        
        // 敵移動
        newState.enemies = updateEnemyPositions(prev.enemies, newState.player.x, newState.player.y, deltaTime);
        
        // 弾丸更新
        newState.projectiles = updateProjectiles(prev.projectiles, deltaTime);
        
        // 弾丸と敵の当たり判定
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
              if (damage > 0 && Math.random() < 0.1) {  // ダメージテキストは間引く
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
            // レベルアップ処理
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
            // タイムアウト - 次のコードに切り替え
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
          
          // 結果を生成
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
    setGameState(createInitialGameState(difficulty, config));
    startGame();
  }, [difficulty, config, startGame]);
  
  // ヒントスロット判定
  const getHintSlotIndex = (): number | null => {
    if (!gameState.player.statusEffects.some(e => e.type === 'hint')) return null;
    // 順番にA, B, Cの未完成スロットをヒント
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex flex-col">
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-2 sm:p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* 時間・レベル・撃破数 */}
          <div className="flex items-center gap-4 text-white font-mono">
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
            <span className="text-white font-mono text-sm">
              {Math.floor(gameState.player.stats.hp)}/{gameState.player.stats.maxHp}
            </span>
          </div>
          
          {/* ポーズボタン */}
          <button
            onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-mono text-white"
          >
            {gameState.isPaused ? '▶️' : '⏸️'}
          </button>
        </div>
      </div>
      
      {/* メインゲームエリア */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
        {/* Canvasエリア */}
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-700">
          <SurvivalCanvas
            gameState={gameState}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
          />
          
          {/* ポーズ画面 */}
          {gameState.isPaused && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white font-mono mb-4">PAUSED</div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-mono text-white"
                  >
                    {isEnglishCopy ? 'Resume' : '再開'}
                  </button>
                  <button
                    onClick={onBackToSelect}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-mono text-white"
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
      
      {/* ピアノ（シンプルなオンスクリーンピアノ） */}
      <div className="flex-shrink-0 bg-gray-900/80 py-2 px-4">
        <SimplePiano
          onNoteOn={(note) => {
            handleNoteInput(note);
            playNote(note, 100);
            setActiveNotes(prev => new Set(prev).add(note));
          }}
          onNoteOff={(note) => {
            stopNote(note);
            setActiveNotes(prev => {
              const next = new Set(prev);
              next.delete(note);
              return next;
            });
          }}
          activeNotes={activeNotes}
        />
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
    </div>
  );
};

export default SurvivalGameScreen;
