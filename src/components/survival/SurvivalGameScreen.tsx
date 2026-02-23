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
  SurvivalCharacter,
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
  createProjectileFromAngle,
  calculateDamage,
  calculateAProjectileDamage,
  calculateBMeleeDamage,
  generateLevelUpOptions,
  generateAutoSelectBonus,
  applyLevelUpBonus,
  applyCharacterToPlayerState,
  applyLevel10Bonuses,
  addExp,
  createDamageText,
  getMagicCooldown,
  castMagic,
  getDirectionVector,
  getClockwiseBulletAngles,
  getDirectionAngle,
  createCoinsFromEnemy,
  collectCoins,
  cleanupExpiredCoins,
  calculateWaveQuota,
  getWaveSpeedMultiplier,
  shouldEnemyShoot,
  createEnemyProjectile,
  updateEnemyProjectiles,
  getConditionalSkillMultipliers,
  checkLuck,
  getAvailableMagics,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_COINS,
} from './SurvivalGameEngine';
import { WAVE_DURATION } from './SurvivalTypes';
import SurvivalCanvas from './SurvivalCanvas';
import SurvivalCodeSlots from './SurvivalCodeSlots';
import SurvivalLevelUp from './SurvivalLevelUp';
import SurvivalGameOver from './SurvivalGameOver';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import SurvivalSettingsModal, { loadSurvivalDisplaySettings, SurvivalDisplaySettings } from './SurvivalSettingsModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

// ===== バーチャルスティック =====
interface VirtualStickProps {
  onDirectionChange: (keys: Set<string>) => void;
}

const THUNDER_LIGHTNING_DURATION_MS = 260;
const MAX_THUNDER_LIGHTNING_PER_CAST = 8;
const MAX_ACTIVE_THUNDER_LIGHTNING = 24;
const FIRE_AURA_PROJECTILE_ERASE_BASE_RADIUS = 60;
const FIRE_AURA_PROJECTILE_ERASE_PER_LEVEL = 8;

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
  aBulletCount?: number;      // A列の弾数（時計方向システム）
  bKnockbackBonus?: number;   // ノックバック距離増加（上限なし）
  bRangeBonus?: number;       // 攻撃範囲拡大（上限なし）
  bDeflect?: boolean;         // 拳でかきけす（上限1）
  multiHitLevel?: number;     // 多段攻撃レベル（上限3）
  expBonusLevel?: number;     // 獲得経験値+1（上限10）
  haisuiNoJin?: boolean;      // 背水の陣（上限1）
  zekkouchou?: boolean;       // 絶好調（上限1）
  alwaysHaisuiNoJin?: boolean; // 常時背水の陣（HP条件無視）
  alwaysZekkouchou?: boolean;  // 常時絶好調（HP条件無視）
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
    time?: number;
    luck?: number;
    skills?: DebugSkillSettings;
    tapSkillActivation?: boolean;
    initialLevel?: number;
    magics?: {
      thunder?: number;
      ice?: number;
      fire?: number;
      heal?: number;
      buffer?: number;
      hint?: number;
    };
  };
  character?: SurvivalCharacter;
}

const SurvivalGameScreen: React.FC<SurvivalGameScreenProps> = ({
  difficulty,
  config,
  onBackToSelect,
  onBackToMenu,
  debugSettings,
  character,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const { settings } = useGameStore();
  
  // 初期化エラー状態
  const [initError, setInitError] = useState<string | null>(null);
  // MIDI初期化完了状態
  const [isMidiInitialized, setIsMidiInitialized] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  
  // ゲーム状態
  const [gameState, setGameState] = useState<SurvivalGameState>(() => {
    const initial = createInitialGameState(difficulty, config);
    // キャラクター能力を適用
    if (character) {
      initial.player = applyCharacterToPlayerState(initial.player, character);
      // 魔法不可キャラの場合、C/Dスロットを永続無効化
      if (character.noMagic) {
        initial.codeSlots.current[2].isEnabled = false;
        initial.codeSlots.current[3].isEnabled = false;
        initial.codeSlots.next[2].isEnabled = false;
        initial.codeSlots.next[3].isEnabled = false;
      }
    }
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
      // LUCK（運）設定
      if (debugSettings.luck !== undefined) {
        initial.player.stats.luck = Math.min(40, debugSettings.luck);
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
        if (skills.bKnockbackBonus !== undefined) {
          initial.player.skills.bKnockbackBonus = skills.bKnockbackBonus;
        }
        if (skills.bRangeBonus !== undefined) {
          initial.player.skills.bRangeBonus = skills.bRangeBonus;
        }
        if (skills.bDeflect !== undefined) {
          initial.player.skills.bDeflect = skills.bDeflect;
        }
        if (skills.multiHitLevel !== undefined) {
          initial.player.skills.multiHitLevel = Math.min(3, skills.multiHitLevel);
        }
        if (skills.expBonusLevel !== undefined) {
          initial.player.skills.expBonusLevel = Math.min(10, skills.expBonusLevel);
        }
        if (skills.haisuiNoJin !== undefined) {
          initial.player.skills.haisuiNoJin = skills.haisuiNoJin;
        }
        if (skills.zekkouchou !== undefined) {
          initial.player.skills.zekkouchou = skills.zekkouchou;
        }
        if (skills.alwaysHaisuiNoJin !== undefined) {
          initial.player.skills.alwaysHaisuiNoJin = skills.alwaysHaisuiNoJin;
        }
        if (skills.alwaysZekkouchou !== undefined) {
          initial.player.skills.alwaysZekkouchou = skills.alwaysZekkouchou;
        }
      }
    }
    return initial;
  });
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  // レベルアップ時の正解ノートをrefで管理（setGameState内から最新値を参照するため）
  const bonusChoiceCount = character?.bonusChoiceCount ?? 3;
  const emptyCorrectNotes = () => Array.from({ length: bonusChoiceCount }, () => [] as number[]);
  const levelUpCorrectNotesRef = useRef<number[][]>(emptyCorrectNotes());
  // UIの再レンダリング用のステート（refと同期）
  const [levelUpCorrectNotes, setLevelUpCorrectNotes] = useState<number[][]>(emptyCorrectNotes());
  
  // 衝撃波エフェクト
  const [shockwaves, setShockwaves] = useState<ShockwaveEffect[]>([]);
  
  // 雷エフェクト
  const [lightningEffects, setLightningEffects] = useState<LightningEffect[]>([]);
  const appendThunderEffectsFromDamageTexts = useCallback((damageTexts: SurvivalGameState['damageTexts']) => {
    if (damageTexts.length === 0) {
      return;
    }

    const castTime = Date.now();
    const newLightning = damageTexts
      .slice(0, MAX_THUNDER_LIGHTNING_PER_CAST)
      .map((damageText, index) => ({
        id: `lightning_${castTime}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        x: damageText.x,
        y: damageText.y,
        startTime: castTime,
        duration: THUNDER_LIGHTNING_DURATION_MS,
      }));

    setLightningEffects((effects) => {
      const merged = [...effects, ...newLightning];
      return merged.length > MAX_ACTIVE_THUNDER_LIGHTNING
        ? merged.slice(merged.length - MAX_ACTIVE_THUNDER_LIGHTNING)
        : merged;
    });
  }, []);
  
  // オート選択で取得したスキル通知
  interface SkillNotification {
    id: string;
    icon: string;
    displayName: string;
    startTime: number;
  }
  const [skillNotifications, setSkillNotifications] = useState<SkillNotification[]>([]);
  
  // BGM制御用refs
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmUrlRef = useRef<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState<number>(0.3);
  const bgmVolumeRef = useRef<number>(0.3);
  
  // キー入力状態
  const keysRef = useRef<Set<string>>(new Set());
  const virtualKeysRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  
  // フローティングスティック用
  const [floatingStick, setFloatingStick] = useState<{
    baseX: number; baseY: number;
    stickX: number; stickY: number;
    visible: boolean;
  }>({ baseX: 0, baseY: 0, stickX: 0, stickY: 0, visible: false });
  const floatingStickRef = useRef<{ baseX: number; baseY: number } | null>(null);
  
  // MIDI/ピアノ関連
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<SurvivalDisplaySettings>(loadSurvivalDisplaySettings);
  
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
  
  // BGM再生制御（WAVEごとに切り替え）
  useEffect(() => {
    // ゲームオーバーまたはポーズ中はBGMを停止
    if (gameState.isGameOver || gameState.isPaused || !gameState.isPlaying) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
      return;
    }
    
    // WAVEに応じたBGM URLを決定
    const isOddWave = gameState.wave.currentWave % 2 === 1;
    const targetBgmUrl = isOddWave ? config.bgmOddWaveUrl : config.bgmEvenWaveUrl;
    
    // BGMが設定されていない場合は何もしない
    if (!targetBgmUrl) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
        currentBgmUrlRef.current = null;
      }
      return;
    }
    
    // 同じBGMが既に再生中の場合は何もしない
    if (currentBgmUrlRef.current === targetBgmUrl && bgmAudioRef.current && !bgmAudioRef.current.paused) {
      return;
    }
    
    // BGMを切り替え
    const playBgm = async () => {
      try {
        // 既存のBGMを停止
        if (bgmAudioRef.current) {
          bgmAudioRef.current.pause();
          bgmAudioRef.current = null;
        }
        
        // 新しいBGMを作成
        const audio = new Audio(targetBgmUrl);
        audio.loop = true;
        audio.volume = bgmVolumeRef.current;
        
        bgmAudioRef.current = audio;
        currentBgmUrlRef.current = targetBgmUrl;
        
        await audio.play();
      } catch (error) {
        // BGM再生に失敗しても、ゲームは続行
        console.warn('BGM playback failed:', error);
      }
    };
    
    playBgm();
    
    // クリーンアップ
    return () => {
      // コンポーネントアンマウント時はBGMを停止
      // 注: WAVEが変わるたびに呼ばれるので、この中ではBGMを停止しない
    };
  }, [gameState.wave.currentWave, gameState.isGameOver, gameState.isPaused, gameState.isPlaying, config.bgmOddWaveUrl, config.bgmEvenWaveUrl]);
  
  // コンポーネントアンマウント時にBGMを停止
  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);
  
  // MIDIコントローラー初期化（ファンタジーモードと同様の挙動）
  useEffect(() => {
    // MIDIControllerのインスタンスを作成（一度だけ）
    // ファンタジーモードと同様に、先にインスタンスを作成してから非同期初期化
    if (!midiControllerRef.current) {
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
        playMidiSound: true // 通常プレイと同様に共通音声システムを有効化
      });
      
      // MIDI接続状態変更コールバック（ファンタジーモードと同様）
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
      });
      
      midiControllerRef.current = controller;
      
      // 非同期初期化を開始し、完了を追跡
      const initPromise = (async () => {
        try {
          await controller.initialize();
          
          // 音声システムとFantasySoundManagerを並列初期化（ファンタジーモードと同様）
          const seVol = settings.soundEffectVolume ?? 0.8;
          const rootVol = settings.rootSoundVolume ?? 0.7;
          await Promise.all([
            initializeAudioSystem().then(() => {
              updateGlobalVolume(settings.midiVolume ?? 0.8);
            }),
            FantasySoundManager.init(seVol, rootVol, true).then(() => {
              FantasySoundManager.enableRootSound(true);
            })
          ]);
          
          // MIDIControllerにキーハイライト機能を設定（初期化後に設定）
          controller.setKeyHighlightCallback((note: number, active: boolean) => {
            pixiRendererRef.current?.highlightKey(note, active);
          });
          
          // 初期化完了を記録
          setIsMidiInitialized(true);
          setInitError(null);
        } catch (error) {
          // MIDI初期化エラーが発生しても、タッチ/クリック入力でプレイ可能
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setInitError(`Audio initialization warning: ${errorMessage}. Touch/click input available.`);
          // エラーでも初期化完了とする（ゲームは開始可能）
          setIsMidiInitialized(true);
        }
      })();
      
      // promiseを保持（初期化完了待ちで使用）
      initPromiseRef.current = initPromise;
    }
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []); // 空の依存配列で一度だけ実行
  
  // gameStoreのデバイスIDを監視して接続/切断（ファンタジーモードと同様）
  // 初期化完了を待ってから接続を試みる
  useEffect(() => {
    const connect = async () => {
      // 初期化完了を待つ
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }
      
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        await midiControllerRef.current.connectDevice(deviceId);
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
      }
    };
    connect();
  }, [settings.selectedMidiDevice, isMidiInitialized]);
  
  // 難易度変更時（ゲーム開始時）にMIDI接続を復元（ファンタジーモードのstage依存と同様）
  useEffect(() => {
    const restoreMidiConnection = async () => {
      // 初期化完了を待つ
      if (initPromiseRef.current) {
        await initPromiseRef.current;
      }
      
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
    
    // コンポーネントが表示されたときに接続復元を試みる
    const timer = setTimeout(restoreMidiConnection, 100);
    return () => clearTimeout(timer);
  }, [config.difficulty, isMidiInitialized, settings.selectedMidiDevice]); // 難易度が変更されたときに実行（ステージ開始時）
  
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
  
  // フローティングスティック操作ハンドラー（モバイル用：キャンバスエリア全体で操作）
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || e.touches.length === 0) return;
    const touch = e.touches[0];
    floatingStickRef.current = { baseX: touch.clientX, baseY: touch.clientY };
    setFloatingStick({
      baseX: touch.clientX, baseY: touch.clientY,
      stickX: 0, stickY: 0, visible: true,
    });
  }, [isMobile]);
  
  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (!floatingStickRef.current || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const base = floatingStickRef.current;
    let dx = touch.clientX - base.baseX;
    let dy = touch.clientY - base.baseY;
    
    const maxRadius = 44;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    
    setFloatingStick(prev => ({
      ...prev, stickX: dx, stickY: dy,
    }));
    
    const threshold = 12;
    const keys = new Set<string>();
    if (dy < -threshold) keys.add('w');
    if (dy > threshold) keys.add('s');
    if (dx < -threshold) keys.add('a');
    if (dx > threshold) keys.add('d');
    virtualKeysRef.current = keys;
  }, []);
  
  const handleCanvasTouchEnd = useCallback(() => {
    floatingStickRef.current = null;
    setFloatingStick(prev => ({ ...prev, visible: false }));
    virtualKeysRef.current = new Set();
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
  
  // キャラクター固有のボーナス除外リストとnoMagicフラグ
  const charExcludedBonuses = character?.excludedBonuses;
  const charNoMagic = character?.noMagic;
  const isLiraMagicMode = character?.name === 'リラ' || character?.nameEn === 'Lira';
  const isAbColumnMagicMode = character?.abColumnMagic ?? false;
  const isAMagicSlot = isAbColumnMagicMode;
  const isBMagicSlot = isLiraMagicMode || isAbColumnMagicMode;

  // レベルアップボーナス選択処理
  const handleLevelUpBonusSelect = useCallback((option: LevelUpBonus) => {
    setGameState(gs => {
      if (!gs.isLevelingUp) return gs;
      
      const newPlayer = applyLevelUpBonus(gs.player, option);
      const newPendingLevelUps = gs.pendingLevelUps - 1;
      
      // 魔法を取得したらC列とD列を有効化（魔法不可キャラの場合は常に無効）
      const hasMagic = !charNoMagic && Object.values(newPlayer.magics).some(l => l > 0);
      const newCodeSlots = {
        ...gs.codeSlots,
        current: gs.codeSlots.current.map((slot, i) => 
          (i === 2 || i === 3) ? { ...slot, isEnabled: hasMagic, chord: hasMagic ? selectRandomChord(config.allowedChords) : null } : slot
        ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
        next: gs.codeSlots.next.map((slot, i) =>
          (i === 2 || i === 3) ? { ...slot, isEnabled: hasMagic, chord: hasMagic ? selectRandomChord(config.allowedChords) : null } : slot
        ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
      };
      
      if (newPendingLevelUps > 0) {
        const newOptions = generateLevelUpOptions(newPlayer, config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount);
        levelUpCorrectNotesRef.current = emptyCorrectNotes();
        setLevelUpCorrectNotes(emptyCorrectNotes());
        return {
          ...gs,
          player: newPlayer,
          pendingLevelUps: newPendingLevelUps,
          levelUpOptions: newOptions,
          codeSlots: newCodeSlots,
        };
      } else {
        levelUpCorrectNotesRef.current = emptyCorrectNotes();
        setLevelUpCorrectNotes(emptyCorrectNotes());
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
  }, [config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount]);
  
  // レベルアップタイムアウト処理
  const handleLevelUpTimeout = useCallback(() => {
    setGameState(gs => {
      if (!gs.isLevelingUp) return gs;
      
      const newPendingLevelUps = gs.pendingLevelUps - 1;
      
      if (newPendingLevelUps > 0) {
        const newOptions = generateLevelUpOptions(gs.player, config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount);
        levelUpCorrectNotesRef.current = emptyCorrectNotes();
        setLevelUpCorrectNotes(emptyCorrectNotes());
        return {
          ...gs,
          pendingLevelUps: newPendingLevelUps,
          levelUpOptions: newOptions,
        };
      } else {
        levelUpCorrectNotesRef.current = emptyCorrectNotes();
        setLevelUpCorrectNotes(emptyCorrectNotes());
        return {
          ...gs,
          pendingLevelUps: 0,
          isLevelingUp: false,
          levelUpOptions: [],
        };
      }
    });
  }, [config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    const pendingShockwaves: ShockwaveEffect[] = [];
    
    setGameState(prev => {
      // ゲームオーバーまたはポーズ中は何もしない
      if (prev.isGameOver || prev.isPaused) return prev;
      
      // レベルアップ中もボーナス選択とABCD攻撃を同時に処理
      if (prev.isLevelingUp) {
        const currentCorrectNotes = levelUpCorrectNotesRef.current.map(arr => [...arr]);
        let matchedOptionIndex = -1;
        
        prev.levelUpOptions.forEach((option, index) => {
          if (option.chord && matchedOptionIndex === -1) {
            const prevNotes = currentCorrectNotes[index] || [];
            const correct = getCorrectNotes([...prevNotes, note], option.chord);
            currentCorrectNotes[index] = correct;
            
            if (checkChordMatch(correct, option.chord)) {
              matchedOptionIndex = index;
            }
          }
        });
        
        levelUpCorrectNotesRef.current = currentCorrectNotes;
        setTimeout(() => setLevelUpCorrectNotes([...currentCorrectNotes]), 0);
      }
      
      // 通常のコード入力処理（レベルアップ中も実行）
      const newState = {
        ...prev,
        codeSlots: {
          current: [...prev.codeSlots.current] as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
          next: [...prev.codeSlots.next] as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
        },
        damageTexts: [...prev.damageTexts],
        projectiles: [...prev.projectiles],
        enemyProjectiles: [...prev.enemyProjectiles],
      };
      const noteMod12 = note % 12;
      
      // 各スロットをチェック - 完了したすべてのスロットを追跡
      const completedSlotIndices: number[] = [];
      const availableMagicsForSlot = getAvailableMagics(prev.player);
      
      newState.codeSlots.current = newState.codeSlots.current.map((slot, index) => {
        if (!slot.isEnabled || !slot.chord) return slot;
        // 既に完了済み or リセット待ち中のスロットはスキップ
        if (slot.isCompleted || slot.completedTime) return slot;
        
        // 魔法スロットのクールダウンをチェック（A/B/C/Dで独立）
        if (index === 0 && isAMagicSlot && prev.aSlotCooldown > 0) return slot;
        if (index === 1 && isBMagicSlot && prev.bSlotCooldown > 0) return slot;
        if (index === 2 && prev.cSlotCooldown > 0) return slot;
        if (index === 3 && prev.dSlotCooldown > 0) return slot;
        
        const isMagicSlot = (index === 0 && isAMagicSlot) || (index === 1 && isBMagicSlot) || index === 2 || index === 3;
        if (isMagicSlot && availableMagicsForSlot.length === 0) return slot;
        
        const targetNotes = [...new Set(slot.chord.notes.map(n => n % 12))];
        if (!targetNotes.includes(noteMod12)) return slot;
        if (slot.correctNotes.includes(noteMod12)) return slot;
        
        const newCorrectNotes = [...slot.correctNotes, noteMod12];
        const isComplete = newCorrectNotes.length >= targetNotes.length;
        
        // 完了したスロットをすべて記録
        if (isComplete) {
          completedSlotIndices.push(index);
        }
        
        return {
          ...slot,
          correctNotes: newCorrectNotes,
          isCompleted: isComplete,
          completedTime: isComplete ? Date.now() : undefined,  // 完了時刻を設定
        };
      }) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
      
      // コード完成時の処理 - すべての完了スロットに対してスキル発動
      for (const completedSlotIndex of completedSlotIndices) {
        const slotType = ['A', 'B', 'C', 'D'][completedSlotIndex] as 'A' | 'B' | 'C' | 'D';
        
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
          if (isAMagicSlot) {
            // A列魔法モード: ランダム魔法発動
            const availableMagics = getAvailableMagics(prev.player);
            
            if (availableMagics.length > 0 && prev.aSlotCooldown <= 0) {
              const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
              const castPlayer = newState.player;
              const castEnemies = newState.enemies;
              const result = castMagic(
                magicType as Parameters<typeof castMagic>[0],
                level,
                castPlayer,
                castEnemies
              );
              
              newState.enemies = result.enemies;
              newState.player = result.player;
              newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
              const condMultipliers = getConditionalSkillMultipliers(castPlayer);
              const luckReloadMultiplier = result.luckResult?.reloadReduction ? (1 / 3) : 1;
              newState.aSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliers.reloadMultiplier * luckReloadMultiplier;
              
              if (magicType === 'thunder') {
                appendThunderEffectsFromDamageTexts(result.damageTexts);
              }
            }
          } else {
            // 遠距離弾発射 - 時計方向システム
            const bulletCount = prev.player.stats.aBulletCount || 1;
            const baseAngle = getDirectionAngle(prev.player.direction);
            const bulletAngles = getClockwiseBulletAngles(bulletCount, baseAngle);
            
            // 各角度に弾を発射（A ATK +1で+10ダメージ増加）
            const newProjectiles = bulletAngles.map((angle) => {
              return createProjectileFromAngle(prev.player, angle, calculateAProjectileDamage(prev.player.stats.aAtk));
            });
            newState.projectiles = [...newState.projectiles, ...newProjectiles];
          }
        } else if (slotType === 'B') {
          if (isBMagicSlot) {
            const availableMagics = getAvailableMagics(prev.player);
            
            if (availableMagics.length > 0 && prev.bSlotCooldown <= 0) {
              const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
              const castPlayer = newState.player;
              const castEnemies = newState.enemies;
              const result = castMagic(
                magicType as Parameters<typeof castMagic>[0],
                level,
                castPlayer,
                castEnemies
              );
              
              newState.enemies = result.enemies;
              newState.player = result.player;
              newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
              const condMultipliers = getConditionalSkillMultipliers(castPlayer);
              const luckReloadMultiplier = result.luckResult?.reloadReduction ? (1 / 3) : 1;
              newState.bSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliers.reloadMultiplier * luckReloadMultiplier;
              
              if (magicType === 'thunder') {
                appendThunderEffectsFromDamageTexts(result.damageTexts);
              }
            }
          } else {
            // 近接攻撃 - 衝撃波エフェクト追加
          const baseRange = 80;
          const bonusRange = prev.player.skills.bRangeBonus * 20;
          const totalRange = baseRange + bonusRange;
          const dirVec = getDirectionVector(prev.player.direction);
          const attackX = prev.player.x + dirVec.x * 40;
          const attackY = prev.player.y + dirVec.y * 40;
          
          // 衝撃波エフェクト追加（前方のみ大きい範囲）
          const newShockwave: ShockwaveEffect = {
            id: `shock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            x: attackX,
            y: attackY,
            radius: 0,
            maxRadius: totalRange,
            startTime: Date.now(),
            duration: 300,
            direction: prev.player.direction,
          };
          pendingShockwaves.push(newShockwave);
          
          // 拳でかきけす - B列攻撃で敵弾消去
          if (prev.player.skills.bDeflect) {
            newState.enemyProjectiles = newState.enemyProjectiles.filter(proj => {
              const dx = proj.x - attackX;
              const dy = proj.y - attackY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              return dist >= totalRange;
            });
          }
          
          // ノックバック力
          const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
          
          newState.enemies = newState.enemies.map(enemy => {
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
              // 背水の陣・絶好調の攻撃力倍率
              const condMultB = getConditionalSkillMultipliers(prev.player);
              // B列ダメージ計算（+1で10ダメージ増加）に倍率適用
              const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultB.atkMultiplier);
              const luckResultB = checkLuck(prev.player.stats.luck);
              
              const damage = calculateDamage(
                baseBDamage,
                0,  // attackerAtkは0（baseBDamageに含まれる）
                enemy.stats.def,
                prev.player.statusEffects.some(e => e.type === 'buffer'),
                enemy.statusEffects.some(e => e.type === 'debuffer'),
                getBufferLevel(prev.player.statusEffects),
                getDebufferLevel(enemy.statusEffects),
                prev.player.stats.cAtk,
                luckResultB.doubleDamage
              );
              
              // ノックバック（近接は強め）
              const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
              const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
              
              newState.damageTexts = [...newState.damageTexts, createDamageText(
                enemy.x,
                enemy.y,
                damage,
                luckResultB.doubleDamage,
                luckResultB.doubleDamage ? '#ffd700' : undefined
              )];
              
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
                const multiShockwave: ShockwaveEffect = {
                  id: `shock_multi_${Date.now()}_${hit}_${Math.random().toString(36).slice(2, 8)}`,
                  x: 0,
                  y: 0,
                  radius: 0,
                  maxRadius: 0,
                  startTime: Date.now(),
                  duration: 300,
                  direction: 'right' as Direction,
                };
                
                setGameState(gs => {
                  if (gs.isPaused || gs.isGameOver) return gs;
                  
                  const bBaseRange = 80;
                  const bBonusRange = gs.player.skills.bRangeBonus * 20;
                  const bTotalRange = bBaseRange + bBonusRange;
                  const bDirVec = getDirectionVector(gs.player.direction);
                  const bAttackX = gs.player.x + bDirVec.x * 40;
                  const bAttackY = gs.player.y + bDirVec.y * 40;
                  
                  multiShockwave.x = bAttackX;
                  multiShockwave.y = bAttackY;
                  multiShockwave.maxRadius = bTotalRange;
                  multiShockwave.direction = gs.player.direction;
                  
                  let updatedEnemyProjectiles = gs.enemyProjectiles;
                  if (gs.player.skills.bDeflect) {
                    updatedEnemyProjectiles = gs.enemyProjectiles.filter(proj => {
                      const dx = proj.x - bAttackX;
                      const dy = proj.y - bAttackY;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      return dist >= bTotalRange;
                    });
                  }
                  
                  const bKnockbackForce = 150 + gs.player.skills.bKnockbackBonus * 50;
                  const newDamageTexts = [...gs.damageTexts];
                  
                  const updatedEnemies = gs.enemies.map(enemy => {
                    const dx = enemy.x - bAttackX;
                    const dy = enemy.y - bAttackY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const toEnemyX = enemy.x - gs.player.x;
                    const toEnemyY = enemy.y - gs.player.y;
                    const dotProduct = toEnemyX * bDirVec.x + toEnemyY * bDirVec.y;
                    const isInFront = dotProduct > 0;
                    const effectiveRange = isInFront ? bTotalRange : bBaseRange;
                    
                    if (dist < effectiveRange) {
                      const condMultBMulti = getConditionalSkillMultipliers(gs.player);
                      const baseBDamage = Math.floor(calculateBMeleeDamage(gs.player.stats.bAtk) * condMultBMulti.atkMultiplier);
                      const luckResultBMulti = checkLuck(gs.player.stats.luck);
                      
                      const damage = calculateDamage(
                        baseBDamage,
                        0,
                        enemy.stats.def,
                        gs.player.statusEffects.some(e => e.type === 'buffer'),
                        enemy.statusEffects.some(e => e.type === 'debuffer'),
                        getBufferLevel(gs.player.statusEffects),
                        getDebufferLevel(enemy.statusEffects),
                        gs.player.stats.cAtk,
                        luckResultBMulti.doubleDamage
                      );
                      
                      const knockbackX = dist > 0 ? (dx / dist) * bKnockbackForce : 0;
                      const knockbackY = dist > 0 ? (dy / dist) * bKnockbackForce : 0;
                      
                      newDamageTexts.push(createDamageText(
                        enemy.x,
                        enemy.y,
                        damage,
                        luckResultBMulti.doubleDamage,
                        luckResultBMulti.doubleDamage ? '#ffd700' : undefined
                      ));
                      
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
                  enemyProjectiles: updatedEnemyProjectiles,
                  damageTexts: newDamageTexts,
                };
              });
              
              setShockwaves(sw => [...sw, multiShockwave]);
            }, hit * 200);
          }
        }
        }
        
      } else if (slotType === 'C' && prev.cSlotCooldown <= 0) {
          // C列魔法発動
          const availableMagics = getAvailableMagics(prev.player);
          
          if (availableMagics.length > 0) {
            const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
            const castPlayer = newState.player;
            const castEnemies = newState.enemies;
            const result = castMagic(
              magicType as Parameters<typeof castMagic>[0],
              level,
              castPlayer,
              castEnemies
            );
            
            newState.enemies = result.enemies;
            newState.player = result.player;
            newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
            // 背水の陣・絶好調の効果を適用したクールダウン（C列のみ）
            const condMultipliers = getConditionalSkillMultipliers(castPlayer);
            const luckReloadMultiplier = result.luckResult?.reloadReduction ? (1/3) : 1;
            newState.cSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliers.reloadMultiplier * luckReloadMultiplier;
            
            // サンダーの場合は雷エフェクトを追加
            if (magicType === 'thunder') {
              appendThunderEffectsFromDamageTexts(result.damageTexts);
            }
          }
        } else if (slotType === 'D' && prev.dSlotCooldown <= 0) {
          // D列魔法発動
          const availableMagics = getAvailableMagics(prev.player);
          
          if (availableMagics.length > 0) {
            const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
            const castPlayer = newState.player;
            const castEnemies = newState.enemies;
            const result = castMagic(
              magicType as Parameters<typeof castMagic>[0],
              level,
              castPlayer,
              castEnemies
            );
            
            newState.enemies = result.enemies;
            newState.player = result.player;
            newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
            // 背水の陣・絶好調の効果を適用したクールダウン（D列のみ）
            const condMultipliers = getConditionalSkillMultipliers(castPlayer);
            const luckReloadMultiplier = result.luckResult?.reloadReduction ? (1/3) : 1;
            newState.dSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliers.reloadMultiplier * luckReloadMultiplier;
            
            // サンダーの場合は雷エフェクトを追加
            if (magicType === 'thunder') {
              appendThunderEffectsFromDamageTexts(result.damageTexts);
            }
          }
        }
        
        // スロットをリセット（短い遅延でスムーズに次のコードへ）
        // クロージャでインデックスをキャプチャ
        const slotIdxToReset = completedSlotIndex;
        setTimeout(() => {
          setGameState(gs => {
            const nextChord = gs.codeSlots.next[slotIdxToReset].chord;
            const newNextChord = selectRandomChord(config.allowedChords, nextChord?.id);
            
            return {
              ...gs,
              codeSlots: {
                current: gs.codeSlots.current.map((slot, i) => 
                  i === slotIdxToReset 
                    ? { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT }
                    : slot
                ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
                next: gs.codeSlots.next.map((slot, i) =>
                  i === slotIdxToReset
                    ? { ...slot, chord: newNextChord }
                    : slot
                ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
              },
            };
          });
        }, 50);  // 50msで素早くリセット
      }
      
      return newState;
    });
    
    if (pendingShockwaves.length > 0) {
      setShockwaves(sw => [...sw, ...pendingShockwaves]);
    }
  }, [config.allowedChords, levelUpCorrectNotes, handleLevelUpBonusSelect, isAMagicSlot, isBMagicSlot, appendThunderEffectsFromDamageTexts]);
  
  // handleNoteInputが更新されるたびにrefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);
  
  // タップでスキル発動（デバッグ用）
  const handleTapSkillActivation = useCallback((slotIndex: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    const slotType = ['A', 'B', 'C', 'D'][slotIndex] as 'A' | 'B' | 'C' | 'D';
    const tapPendingShockwaves: ShockwaveEffect[] = [];
    
    setGameState(prev => {
      const newState = {
        ...prev,
        damageTexts: [...prev.damageTexts],
        projectiles: [...prev.projectiles],
        enemyProjectiles: [...prev.enemyProjectiles],
      };
      const slot = prev.codeSlots.current[slotIndex];
      
      if (!slot || !slot.isEnabled) return prev;
      
      if (slotType === 'A') {
        if (isAMagicSlot) {
          const availableMagics = getAvailableMagics(prev.player);
          
          if (availableMagics.length > 0 && prev.aSlotCooldown <= 0) {
            const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
            const castPlayer = newState.player;
            const castEnemies = newState.enemies;
            const result = castMagic(
              magicType as Parameters<typeof castMagic>[0],
              level,
              castPlayer,
              castEnemies
            );
            
            newState.enemies = result.enemies;
            newState.player = result.player;
            newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
            const condMultipliersTap = getConditionalSkillMultipliers(castPlayer);
            const luckReloadMultiplierTap = result.luckResult?.reloadReduction ? (1 / 3) : 1;
            newState.aSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliersTap.reloadMultiplier * luckReloadMultiplierTap;
            
            if (magicType === 'thunder') {
              appendThunderEffectsFromDamageTexts(result.damageTexts);
            }
          }
        } else {
          const bulletCount = prev.player.stats.aBulletCount || 1;
          const baseAngle = getDirectionAngle(prev.player.direction);
          const bulletAngles = getClockwiseBulletAngles(bulletCount, baseAngle);
          
          const newProjectiles = bulletAngles.map((angle) => {
            return createProjectileFromAngle(prev.player, angle, calculateAProjectileDamage(prev.player.stats.aAtk));
          });
          newState.projectiles = [...newState.projectiles, ...newProjectiles];
        }
      
    } else if (slotType === 'B') {
      if (isBMagicSlot) {
        const availableMagics = getAvailableMagics(prev.player);
        
        if (availableMagics.length > 0 && prev.bSlotCooldown <= 0) {
          const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
          const castPlayer = newState.player;
          const castEnemies = newState.enemies;
          const result = castMagic(
            magicType as Parameters<typeof castMagic>[0],
            level,
            castPlayer,
            castEnemies
          );
          
          newState.enemies = result.enemies;
          newState.player = result.player;
          newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
          const condMultipliersTap = getConditionalSkillMultipliers(castPlayer);
          const luckReloadMultiplierTap = result.luckResult?.reloadReduction ? (1 / 3) : 1;
          newState.bSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliersTap.reloadMultiplier * luckReloadMultiplierTap;
          
          if (magicType === 'thunder') {
            appendThunderEffectsFromDamageTexts(result.damageTexts);
          }
        }
      } else {
      const baseRange = 80;
      const bonusRange = prev.player.skills.bRangeBonus * 20;
      const totalRange = baseRange + bonusRange;
      const dirVec = getDirectionVector(prev.player.direction);
      const attackX = prev.player.x + dirVec.x * 40;
      const attackY = prev.player.y + dirVec.y * 40;
      
      const newShockwave: ShockwaveEffect = {
        id: `shock_tap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        x: attackX,
        y: attackY,
        radius: 0,
        maxRadius: totalRange,
        startTime: Date.now(),
        duration: 300,
        direction: prev.player.direction,
      };
      tapPendingShockwaves.push(newShockwave);
      
      if (prev.player.skills.bDeflect) {
        newState.enemyProjectiles = newState.enemyProjectiles.filter(proj => {
          const dx = proj.x - attackX;
          const dy = proj.y - attackY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist >= totalRange;
        });
      }
        
      const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
      
      newState.enemies = newState.enemies.map(enemy => {
        const dx = enemy.x - attackX;
        const dy = enemy.y - attackY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const toEnemyX = enemy.x - prev.player.x;
        const toEnemyY = enemy.y - prev.player.y;
        const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
        const isInFront = dotProduct > 0;
        
        const effectiveRange = isInFront ? totalRange : baseRange;
        
        if (dist < effectiveRange) {
          const condMultBTap = getConditionalSkillMultipliers(prev.player);
          const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultBTap.atkMultiplier);
          const luckResultBTap = checkLuck(prev.player.stats.luck);
          
          const damage = calculateDamage(
            baseBDamage,
            0,
            enemy.stats.def,
            prev.player.statusEffects.some(e => e.type === 'buffer'),
            enemy.statusEffects.some(e => e.type === 'debuffer'),
            getBufferLevel(prev.player.statusEffects),
            getDebufferLevel(enemy.statusEffects),
            prev.player.stats.cAtk,
            luckResultBTap.doubleDamage
          );
          
          const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
          const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
          
          newState.damageTexts = [...newState.damageTexts, createDamageText(
            enemy.x,
            enemy.y,
            damage,
            luckResultBTap.doubleDamage,
            luckResultBTap.doubleDamage ? '#ffd700' : undefined
          )];
          
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
        
        const tapBMultiHitLevel = prev.player.skills.multiHitLevel;
        if (tapBMultiHitLevel > 0) {
          for (let hit = 1; hit <= tapBMultiHitLevel; hit++) {
            setTimeout(() => {
              const multiShockwave: ShockwaveEffect = {
                id: `shock_tap_multi_${Date.now()}_${hit}_${Math.random().toString(36).slice(2, 8)}`,
                x: 0,
                y: 0,
                radius: 0,
                maxRadius: 0,
                startTime: Date.now(),
                duration: 300,
                direction: 'right' as Direction,
              };
              
              setGameState(gs => {
                if (gs.isPaused || gs.isGameOver) return gs;
                
                const bBaseRange = 80;
                const bBonusRange = gs.player.skills.bRangeBonus * 20;
                const bTotalRange = bBaseRange + bBonusRange;
                const bDirVec = getDirectionVector(gs.player.direction);
                const bAttackX = gs.player.x + bDirVec.x * 40;
                const bAttackY = gs.player.y + bDirVec.y * 40;
                
                multiShockwave.x = bAttackX;
                multiShockwave.y = bAttackY;
                multiShockwave.maxRadius = bTotalRange;
                multiShockwave.direction = gs.player.direction;
                
                let updatedEnemyProjectilesTap = gs.enemyProjectiles;
                if (gs.player.skills.bDeflect) {
                  updatedEnemyProjectilesTap = gs.enemyProjectiles.filter(proj => {
                    const dx = proj.x - bAttackX;
                    const dy = proj.y - bAttackY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return dist >= bTotalRange;
                  });
                }
                
                const bKnockbackForce = 150 + gs.player.skills.bKnockbackBonus * 50;
                const newDamageTexts = [...gs.damageTexts];
                
                const updatedEnemies = gs.enemies.map(enemy => {
                  const dx = enemy.x - bAttackX;
                  const dy = enemy.y - bAttackY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  
                  const toEnemyX = enemy.x - gs.player.x;
                  const toEnemyY = enemy.y - gs.player.y;
                  const dotProduct = toEnemyX * bDirVec.x + toEnemyY * bDirVec.y;
                  const isInFront = dotProduct > 0;
                  const effectiveRange = isInFront ? bTotalRange : bBaseRange;
                  
                  if (dist < effectiveRange) {
                    const condMultBTapMulti = getConditionalSkillMultipliers(gs.player);
                    const baseBDamage = Math.floor(calculateBMeleeDamage(gs.player.stats.bAtk) * condMultBTapMulti.atkMultiplier);
                    const luckResultBTapMulti = checkLuck(gs.player.stats.luck);
                    
                    const damage = calculateDamage(
                      baseBDamage,
                      0,
                      enemy.stats.def,
                      gs.player.statusEffects.some(e => e.type === 'buffer'),
                      enemy.statusEffects.some(e => e.type === 'debuffer'),
                      getBufferLevel(gs.player.statusEffects),
                      getDebufferLevel(enemy.statusEffects),
                      gs.player.stats.cAtk,
                      luckResultBTapMulti.doubleDamage
                    );
                    
                    const knockbackX = dist > 0 ? (dx / dist) * bKnockbackForce : 0;
                    const knockbackY = dist > 0 ? (dy / dist) * bKnockbackForce : 0;
                    
                    newDamageTexts.push(createDamageText(
                      enemy.x,
                      enemy.y,
                      damage,
                      luckResultBTapMulti.doubleDamage,
                      luckResultBTapMulti.doubleDamage ? '#ffd700' : undefined
                    ));
                    
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
                enemyProjectiles: updatedEnemyProjectilesTap,
                damageTexts: newDamageTexts,
              };
            });
            
            setShockwaves(sw => [...sw, multiShockwave]);
          }, hit * 200);
        }
      }
      }
      
    } else if (slotType === 'C' && prev.cSlotCooldown <= 0) {
      // C列魔法発動（タップ）
      const availableMagics = getAvailableMagics(prev.player);
      
      if (availableMagics.length > 0) {
        const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
        const castPlayer = newState.player;
        const castEnemies = newState.enemies;
        const result = castMagic(
          magicType as Parameters<typeof castMagic>[0],
          level,
          castPlayer,
          castEnemies
        );
        
        newState.enemies = result.enemies;
        newState.player = result.player;
        newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
        const condMultipliersTap = getConditionalSkillMultipliers(castPlayer);
        const luckReloadMultiplierTap = result.luckResult?.reloadReduction ? (1/3) : 1;
        newState.cSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliersTap.reloadMultiplier * luckReloadMultiplierTap;
        
        if (magicType === 'thunder') {
          appendThunderEffectsFromDamageTexts(result.damageTexts);
        }
      }
    } else if (slotType === 'D' && prev.dSlotCooldown <= 0) {
      // D列魔法発動（タップ）
      const availableMagics = getAvailableMagics(prev.player);
      
      if (availableMagics.length > 0) {
        const [magicType, level] = availableMagics[Math.floor(Math.random() * availableMagics.length)];
        const castPlayer = newState.player;
        const castEnemies = newState.enemies;
        const result = castMagic(
          magicType as Parameters<typeof castMagic>[0],
          level,
          castPlayer,
          castEnemies
        );
        
        newState.enemies = result.enemies;
        newState.player = result.player;
        newState.damageTexts = [...newState.damageTexts, ...result.damageTexts];
        const condMultipliersTap = getConditionalSkillMultipliers(castPlayer);
        const luckReloadMultiplierTap = result.luckResult?.reloadReduction ? (1/3) : 1;
        newState.dSlotCooldown = getMagicCooldown(castPlayer.stats.reloadMagic) * condMultipliersTap.reloadMultiplier * luckReloadMultiplierTap;
        
        if (magicType === 'thunder') {
          appendThunderEffectsFromDamageTexts(result.damageTexts);
        }
      }
    }
    
    return newState;
  });
  
  if (tapPendingShockwaves.length > 0) {
    setShockwaves(sw => [...sw, ...tapPendingShockwaves]);
  }
}, [gameState.isGameOver, gameState.isPaused, isAMagicSlot, isBMagicSlot, appendThunderEffectsFromDamageTexts]);
  
  // ゲームループ
  // 注意: isLevelingUp中もゲームは継続（一時停止しない）
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      return;
    }
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastUpdateRef.current) / 1000, 0.1);
      lastUpdateRef.current = timestamp;
      
      // キーボードとバーチャルスティックのキーをマージ
      const combinedKeys = new Set([...keysRef.current, ...virtualKeysRef.current]);
      
      setGameState(prev => {
        // isLevelingUp中もゲームは継続
        if (!prev.isPlaying || prev.isPaused || prev.isGameOver) {
          return prev;
        }
        
        const newState = { ...prev };
        
        // 時間更新
        newState.elapsedTime = prev.elapsedTime + deltaTime;
        
        // プレイヤー移動（常に新しいオブジェクトを生成し、shared referenceによるミューテーション汚染を防止）
        const movedPlayer = updatePlayerPosition(prev.player, combinedKeys, deltaTime);
        newState.player = {
          ...movedPlayer,
          stats: { ...movedPlayer.stats },
          statusEffects: [...movedPlayer.statusEffects],
        };
        
        // 敵移動（WAVE倍率適用）
        const waveSpeedMult = getWaveSpeedMultiplier(prev.wave.currentWave);
        newState.enemies = updateEnemyPositions(prev.enemies, newState.player.x, newState.player.y, deltaTime, waveSpeedMult);
        
        // 弾丸更新
        newState.projectiles = updateProjectiles(prev.projectiles, deltaTime);
        
        // 弾丸と敵の当たり判定（イミュータブル）
        const hitResults: { enemyId: string; damage: number; projId: string; isLucky: boolean; knockbackX: number; knockbackY: number }[] = [];
        const hitEnemyUpdates = new Set<string>();
        newState.projectiles.forEach(proj => {
          newState.enemies.forEach(enemy => {
            if (proj.hitEnemies.has(enemy.id)) return;
            
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 25) {
              const condMultA = getConditionalSkillMultipliers(prev.player);
              const effectiveADamage = Math.floor(proj.damage * condMultA.atkMultiplier);
              const luckResultHit = checkLuck(prev.player.stats.luck);
              
              const damage = calculateDamage(
                effectiveADamage,
                0,
                enemy.stats.def,
                prev.player.statusEffects.some(e => e.type === 'buffer'),
                enemy.statusEffects.some(e => e.type === 'debuffer'),
                getBufferLevel(prev.player.statusEffects),
                getDebufferLevel(enemy.statusEffects),
                prev.player.stats.cAtk,
                luckResultHit.doubleDamage
              );
              const dirVec = getDirectionVector(proj.direction);
              const knockbackForce = 80;
              hitResults.push({
                enemyId: enemy.id,
                damage,
                projId: proj.id,
                isLucky: luckResultHit.doubleDamage,
                knockbackX: dirVec.x * knockbackForce,
                knockbackY: dirVec.y * knockbackForce,
              });
              hitEnemyUpdates.add(enemy.id);
              proj.hitEnemies.add(enemy.id);
            }
          });
        });
        
        // ダメージ適用（イミュータブルに新しいオブジェクトを生成）
        if (hitResults.length > 0) {
          const damageMap = new Map<string, { totalDamage: number; knockbackX: number; knockbackY: number; isLucky: boolean }>();
          hitResults.forEach(({ enemyId, damage, isLucky, knockbackX, knockbackY }) => {
            const existing = damageMap.get(enemyId);
            if (existing) {
              existing.totalDamage += damage;
              existing.knockbackX = knockbackX;
              existing.knockbackY = knockbackY;
              existing.isLucky = existing.isLucky || isLucky;
            } else {
              damageMap.set(enemyId, { totalDamage: damage, knockbackX, knockbackY, isLucky });
            }
          });
          
          newState.enemies = newState.enemies.map(enemy => {
            const hit = damageMap.get(enemy.id);
            if (hit) {
              newState.damageTexts.push(createDamageText(
                enemy.x, enemy.y, hit.totalDamage, hit.isLucky, hit.isLucky ? '#ffd700' : undefined
              ));
              return {
                ...enemy,
                stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - hit.totalDamage) },
                knockbackVelocity: { x: hit.knockbackX, y: hit.knockbackY },
              };
            }
            return enemy;
          });
        }
        
        // 貫通でない弾を削除
        newState.projectiles = newState.projectiles.filter(proj => {
          if (proj.penetrating) return true;
          return !hitResults.some(h => h.projId === proj.id);
        });
        
        // 炎オーラダメージ（FIRE魔法） - 当たった敵にデバフ付与
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
                  ...enemy.statusEffects.filter(e => e.type !== 'debuffer'),
                  { type: 'debuffer' as const, duration: 3, startTime: Date.now(), level: fireLevel },
                ],
              };
            }
            return enemy;
          });
        }
        
        // 敵の攻撃（体当たり）- イミュータブルに蓄積
        let contactDamageTotal = 0;
        newState.enemies.forEach(enemy => {
          const dx = enemy.x - newState.player.x;
          const dy = enemy.y - newState.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 30) {
            const luckResultContact = checkLuck(newState.player.stats.luck);
            if (!luckResultContact.noDamageTaken) {
              const defMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
              const condMult = getConditionalSkillMultipliers(newState.player);
              const effectiveDef = condMult.defOverride !== null ? condMult.defOverride : newState.player.stats.def;
              const damage = Math.max(1, Math.floor(enemy.stats.atk - effectiveDef * defMultiplier * 0.5));
              contactDamageTotal += damage * deltaTime * 2;
            }
          }
        });
        if (contactDamageTotal > 0) {
          newState.player = {
            ...newState.player,
            stats: {
              ...newState.player.stats,
              hp: Math.max(0, newState.player.stats.hp - contactDamageTotal),
            },
          };
        }
        
        // 敵の射撃処理
        newState.enemies.forEach(enemy => {
          if (shouldEnemyShoot(enemy, newState.player.x, newState.player.y, newState.elapsedTime)) {
            const proj = createEnemyProjectile(enemy, newState.player.x, newState.player.y);
            newState.enemyProjectiles.push(proj);
          }
        });
        
        // 敵の弾丸更新
        newState.enemyProjectiles = updateEnemyProjectiles(prev.enemyProjectiles, deltaTime);

        // FIREの渦に触れた敵弾を消去
        const fireStatus = newState.player.statusEffects.find((effect) => effect.type === 'fire');
        if (fireStatus) {
          const fireLevel = fireStatus.level ?? Math.max(1, newState.player.magics.fire);
          const fireAuraRadius =
            FIRE_AURA_PROJECTILE_ERASE_BASE_RADIUS +
            Math.max(0, fireLevel - 1) * FIRE_AURA_PROJECTILE_ERASE_PER_LEVEL;
          const fireAuraRadiusSq = fireAuraRadius * fireAuraRadius;
          newState.enemyProjectiles = newState.enemyProjectiles.filter((proj) => {
            const dx = proj.x - newState.player.x;
            const dy = proj.y - newState.player.y;
            return dx * dx + dy * dy > fireAuraRadiusSq;
          });
        }
        
        // 敵の弾丸とプレイヤーの当たり判定（小さめ）- イミュータブル
        const ENEMY_PROJECTILE_HIT_RADIUS = 15;
        let projDamageTotal = 0;
        newState.enemyProjectiles = newState.enemyProjectiles.filter(proj => {
          const dx = proj.x - newState.player.x;
          const dy = proj.y - newState.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < ENEMY_PROJECTILE_HIT_RADIUS) {
            const luckResultProj = checkLuck(newState.player.stats.luck);
            if (luckResultProj.noDamageTaken) {
              newState.damageTexts.push(createDamageText(newState.player.x, newState.player.y, 0, false, '#ffd700'));
              return false;
            }
            
            const defMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
            const condMultProj = getConditionalSkillMultipliers(newState.player);
            const effectiveDefProj = condMultProj.defOverride !== null ? condMultProj.defOverride : newState.player.stats.def;
            const damage = Math.max(1, Math.floor(proj.damage - effectiveDefProj * defMultiplier * 0.3));
            projDamageTotal += damage;
            newState.damageTexts.push(createDamageText(newState.player.x, newState.player.y, damage));
            return false;
          }
          return true;
        });
        if (projDamageTotal > 0) {
          newState.player = {
            ...newState.player,
            stats: {
              ...newState.player.stats,
              hp: Math.max(0, newState.player.stats.hp - projDamageTotal),
            },
          };
        }
        
        // 自動経験値取得でのレベルアップ追跡用
        let autoCollectLeveledUp = false;
        let autoCollectLevelUpCount = 0;
        let autoCollectOldLevel = newState.player.level;
        
        // 死んだ敵を処理 - コインをドロップ or 自動経験値取得
        const defeatedEnemies = newState.enemies.filter(e => e.stats.hp <= 0);
        newState.enemies = newState.enemies.filter(e => e.stats.hp > 0);
        
        if (defeatedEnemies.length > 0) {
          const isAutoCollect = character?.autoCollectExp ?? false;
          
          if (isAutoCollect) {
            // 自動経験値取得: コインを生成せず直接経験値を付与
            const expBonus = newState.player.skills.expBonusLevel;
            let totalDirectExp = 0;
            defeatedEnemies.forEach(enemy => {
              const baseExp = enemy.isBoss ? 50 : 10;
              totalDirectExp += Math.floor(baseExp * config.expMultiplier) + expBonus;
            });
            if (totalDirectExp > 0) {
              const levelBefore = newState.player.level;
              const { player: expPlayer, leveledUp: directLevelUp, levelUpCount: directLevelUpCount } = addExp(newState.player, totalDirectExp);
              newState.player = expPlayer;
              // 自動取得分のレベルアップをautoCollectLevelUpに蓄積
              if (directLevelUp) {
                autoCollectLeveledUp = true;
                autoCollectLevelUpCount += directLevelUpCount;
                autoCollectOldLevel = Math.min(autoCollectOldLevel, levelBefore);
              }
            }
          } else {
            // コインをスポーン（上限チェック付き）
            defeatedEnemies.forEach(enemy => {
              if (newState.coins.length < MAX_COINS) {
                const coins = createCoinsFromEnemy(enemy, config.expMultiplier);
                const allowedCoins = coins.slice(0, MAX_COINS - newState.coins.length);
                newState.coins = [...newState.coins, ...allowedCoins];
              }
            });
          }
          newState.enemiesDefeated += defeatedEnemies.length;
          
          // WAVEキル数を更新
          newState.wave = {
            ...newState.wave,
            waveKills: newState.wave.waveKills + defeatedEnemies.length,
          };
        }
        
        // コイン拾得処理
        const { player: playerAfterCoins, remainingCoins, leveledUp: coinLeveledUp, levelUpCount: coinLevelUpCount } = collectCoins(
          newState.player,
          newState.coins
        );
        newState.player = playerAfterCoins;
        newState.coins = remainingCoins;
        
        // 自動経験値取得 + コイン拾得の合算レベルアップ判定
        const leveledUp = coinLeveledUp || autoCollectLeveledUp;
        const levelUpCount = coinLevelUpCount + autoCollectLevelUpCount;
        
        // キャラクターレベル5ボーナス判定
        if (leveledUp && levelUpCount > 0 && character && character.level10Bonuses.length > 0) {
          const oldLevel = autoCollectLeveledUp
            ? Math.min(autoCollectOldLevel, playerAfterCoins.level - coinLevelUpCount)
            : playerAfterCoins.level - coinLevelUpCount;
          const newLevel = playerAfterCoins.level;
          // レベル5の倍数を跨いだ回数をチェック
          const oldMilestone = Math.floor(oldLevel / 5);
          const newMilestone = Math.floor(newLevel / 5);
          if (newMilestone > oldMilestone) {
            const milestoneCount = newMilestone - oldMilestone;
            let charPlayer = newState.player;
            const allMessages: string[] = [];
            for (let m = 0; m < milestoneCount; m++) {
              const { player: updated, messages } = applyLevel10Bonuses(charPlayer, character.level10Bonuses);
              charPlayer = updated;
              allMessages.push(...messages);
            }
            newState.player = charPlayer;
            // 能力値アップメッセージを通知（設定で有効な場合のみ）
            if (allMessages.length > 0 && displaySettings.showCharacterBonusPopup) {
              const now = Date.now();
              const notifications = allMessages.map((msg, idx) => ({
                id: `lv5_${now}_${idx}`,
                icon: '⭐',
                displayName: `Lv${newMilestone * 5}: ${msg}`,
                startTime: now + idx * 400,
              }));
              setSkillNotifications(prev => [...prev, ...notifications]);
            }
          }
        }

        // レベルアップ処理
        if (leveledUp && levelUpCount > 0) {
          // オート選択スキルがある場合は自動的にボーナスを選択
          if (newState.player.skills.autoSelect) {
            // 複数回のレベルアップに対応
            let currentPlayer = newState.player;
            const acquiredBonuses: LevelUpBonus[] = [];
            
            for (let i = 0; i < levelUpCount; i++) {
              const selectedBonus = generateAutoSelectBonus(
                currentPlayer,
                config.allowedChords,
                charExcludedBonuses,
                charNoMagic
              );
              if (!selectedBonus) {
                break;
              }
              currentPlayer = applyLevelUpBonus(currentPlayer, selectedBonus);
              acquiredBonuses.push(selectedBonus);
            }
            newState.player = currentPlayer;
            
            // 魔法を取得したらC列とD列を有効化（魔法不可キャラの場合は常に無効）
            const hasMagic = !charNoMagic && Object.values(newState.player.magics).some(l => l > 0);
            newState.codeSlots = {
              ...newState.codeSlots,
              current: newState.codeSlots.current.map((slot, i) => 
                (i === 2 || i === 3) ? { ...slot, isEnabled: hasMagic, chord: hasMagic && !slot.chord ? selectRandomChord(config.allowedChords) : slot.chord } : slot
              ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
              next: newState.codeSlots.next.map((slot, i) =>
                (i === 2 || i === 3) ? { ...slot, isEnabled: hasMagic, chord: hasMagic && !slot.chord ? selectRandomChord(config.allowedChords) : slot.chord } : slot
              ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
            };
            
            // オート選択でも音を再生し、取得スキルを通知（setStateコールバック外で実行）
            if (acquiredBonuses.length > 0) {
              setTimeout(() => {
                // レベルアップ音を再生
                const playSound = async () => {
                  try {
                    const originalVolume = FantasySoundManager.getVolume();
                    if (typeof originalVolume === 'number' && originalVolume > 0) {
                      FantasySoundManager.setVolume(Math.min(originalVolume, 0.3));
                      await FantasySoundManager.playStageClear();
                      FantasySoundManager.setVolume(originalVolume);
                    } else {
                      FantasySoundManager.setVolume(0.3);
                      await FantasySoundManager.playStageClear();
                    }
                  } catch {
                    // 音声再生エラーは無視
                  }
                };
                playSound();
                
                // 取得スキル通知を追加（設定で有効な場合のみ）
                if (displaySettings.showAutoSelectPopup) {
                  const now = Date.now();
                  const notifications = acquiredBonuses.map((bonus, idx) => ({
                    id: `skill_${now}_${idx}`,
                    icon: bonus.icon,
                    displayName: bonus.displayName,
                    startTime: now + idx * 300,
                  }));
                  setSkillNotifications(prev => [...prev, ...notifications]);
                }
              }, 0);
            }
          } else if (newState.isLevelingUp) {
            // 既にレベルアップ中の場合は、保留中のレベルアップ回数に加算
            newState.pendingLevelUps = newState.pendingLevelUps + levelUpCount;
          } else {
            // 新しくレベルアップを開始
            const options = generateLevelUpOptions(playerAfterCoins, config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount);
            newState.isLevelingUp = true;
            newState.levelUpOptions = options;
            newState.pendingLevelUps = levelUpCount;
            setLevelUpCorrectNotes(emptyCorrectNotes());
          }
        }
        
        // キャラクター固有: HP回復
        // 既にHPが0以下なら死亡確定として回復させない（ゲームオーバー判定を優先）
        if (newState.player.stats.hp > 0 && character && character.hpRegenPerSecond > 0) {
          const regenAmount = character.hpRegenPerSecond * deltaTime;
          newState.player.stats.hp = Math.min(
            newState.player.stats.maxHp,
            newState.player.stats.hp + regenAmount
          );
        }

        // キャラクター固有: 永続効果の維持
        if (character && character.permanentEffects.length > 0) {
          for (const eff of character.permanentEffects) {
            const existing = newState.player.statusEffects.find(se => se.type === eff.type as never);
            if (!existing) {
              newState.player.statusEffects = [
                ...newState.player.statusEffects,
                {
                  type: eff.type as never,
                  duration: 999999,
                  startTime: Date.now(),
                  level: eff.level,
                },
              ];
            } else if (existing.duration < 999990) {
              existing.duration = 999999;
              existing.level = eff.level;
            }
          }
        }

        // 期限切れコインのクリーンアップ
        newState.coins = cleanupExpiredCoins(newState.coins);
        
        // 敵スポーン（上限チェック付き）
        // 全難易度共通: 設定値ベース + WAVEごとに+1
        const effectiveSpawnRate = config.enemySpawnRate;
        const baseSpawnCount = config.enemySpawnCount;
        const waveBonus = newState.wave.currentWave - 1;
        const effectiveSpawnCount = baseSpawnCount + waveBonus;
        
        const isFirstSpawn = newState.enemies.length === 0 && newState.enemiesDefeated === 0;
        if (isFirstSpawn) {
          spawnTimerRef.current = effectiveSpawnRate;
        } else {
          spawnTimerRef.current += deltaTime;
        }
        if (spawnTimerRef.current >= effectiveSpawnRate && newState.enemies.length < MAX_ENEMIES) {
          spawnTimerRef.current = 0;
          const spawnCount = Math.min(effectiveSpawnCount, MAX_ENEMIES - newState.enemies.length);
          for (let i = 0; i < spawnCount; i++) {
            const newEnemy = spawnEnemy(
              newState.player.x,
              newState.player.y,
              newState.elapsedTime,
              config,
              newState.wave.currentWave,
              isFirstSpawn && i === 0
            );
            newState.enemies.push(newEnemy);
          }
        }
        
        // パフォーマンス: プロジェクタイルの数を制限
        if (newState.projectiles.length > MAX_PROJECTILES) {
          newState.projectiles = newState.projectiles.slice(-MAX_PROJECTILES);
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
              ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
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
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
            
            return { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
          }
          return { ...slot, timer: newTimer };
        }) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
        
        // 魔法クールダウン更新（A/B/C/D列で独立）
        if (newState.aSlotCooldown > 0) {
          newState.aSlotCooldown = Math.max(0, newState.aSlotCooldown - deltaTime);
        }
        if (newState.bSlotCooldown > 0) {
          newState.bSlotCooldown = Math.max(0, newState.bSlotCooldown - deltaTime);
        }
        if (newState.cSlotCooldown > 0) {
          newState.cSlotCooldown = Math.max(0, newState.cSlotCooldown - deltaTime);
        }
        if (newState.dSlotCooldown > 0) {
          newState.dSlotCooldown = Math.max(0, newState.dSlotCooldown - deltaTime);
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
        
        // 背水の陣と絶好調のステータスエフェクト管理
        const hpPercent = newState.player.stats.hp / newState.player.stats.maxHp;
        const hasHaisui = newState.player.statusEffects.some(e => e.type === 'haisui');
        const hasZekkouchou = newState.player.statusEffects.some(e => e.type === 'zekkouchou');
        
        // 背水の陣（HP15%以下で発動）
        if (newState.player.skills.haisuiNoJin && hpPercent <= 0.15) {
          if (!hasHaisui) {
            newState.player.statusEffects.push({
              type: 'haisui',
              duration: Infinity,
              startTime: now,
            });
          }
        } else {
          newState.player.statusEffects = newState.player.statusEffects.filter(e => e.type !== 'haisui');
        }
        
        // 絶好調（HP満タンで発動）
        if (newState.player.skills.zekkouchou && newState.player.stats.hp >= newState.player.stats.maxHp) {
          if (!hasZekkouchou) {
            newState.player.statusEffects.push({
              type: 'zekkouchou',
              duration: Infinity,
              startTime: now,
            });
          }
        } else {
          newState.player.statusEffects = newState.player.statusEffects.filter(e => e.type !== 'zekkouchou');
        }
        
        // ダメージテキストのクリーンアップ
        newState.damageTexts = newState.damageTexts.filter(
          d => now - d.startTime < d.duration
        );
        
        // WAVEチェック
        const waveElapsedTime = newState.elapsedTime - newState.wave.waveStartTime;
        
        // WAVEノルマ達成マーク（ノルマ達成しても1分経つまでは同じWAVEに留まる）
        if (newState.wave.waveKills >= newState.wave.waveQuota && !newState.wave.waveCompleted) {
          newState.wave = {
            ...newState.wave,
            waveCompleted: true,
          };
        }
        
        // 1分経過後にWAVE進行チェック
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
      
      // スキル通知の更新（2秒後に消える）
      const SKILL_NOTIFICATION_DURATION = 2000;
      setSkillNotifications(sn => sn.filter(n => Date.now() - n.startTime < SKILL_NOTIFICATION_DURATION));
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, config]);
  
  // リトライ
  const handleRetry = useCallback(() => {
    setResult(null);
    setShockwaves([]);
    setLightningEffects([]);
    setSkillNotifications([]);
    setLevelUpCorrectNotes(emptyCorrectNotes());
    const initial = createInitialGameState(difficulty, config);
    // キャラクター能力を再適用
    if (character) {
      initial.player = applyCharacterToPlayerState(initial.player, character);
      if (character.noMagic) {
        initial.codeSlots.current[2].isEnabled = false;
        initial.codeSlots.current[3].isEnabled = false;
        initial.codeSlots.next[2].isEnabled = false;
        initial.codeSlots.next[3].isEnabled = false;
      }
    }
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
      // LUCK（運）設定
      if (debugSettings.luck !== undefined) {
        initial.player.stats.luck = Math.min(40, debugSettings.luck);
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
        if (skills.bKnockbackBonus !== undefined) {
          initial.player.skills.bKnockbackBonus = skills.bKnockbackBonus;
        }
        if (skills.bRangeBonus !== undefined) {
          initial.player.skills.bRangeBonus = skills.bRangeBonus;
        }
        if (skills.bDeflect !== undefined) {
          initial.player.skills.bDeflect = skills.bDeflect;
        }
        if (skills.multiHitLevel !== undefined) {
          initial.player.skills.multiHitLevel = Math.min(3, skills.multiHitLevel);
        }
        if (skills.expBonusLevel !== undefined) {
          initial.player.skills.expBonusLevel = Math.min(10, skills.expBonusLevel);
        }
        if (skills.haisuiNoJin !== undefined) {
          initial.player.skills.haisuiNoJin = skills.haisuiNoJin;
        }
        if (skills.zekkouchou !== undefined) {
          initial.player.skills.zekkouchou = skills.zekkouchou;
        }
        if (skills.alwaysHaisuiNoJin !== undefined) {
          initial.player.skills.alwaysHaisuiNoJin = skills.alwaysHaisuiNoJin;
        }
        if (skills.alwaysZekkouchou !== undefined) {
          initial.player.skills.alwaysZekkouchou = skills.alwaysZekkouchou;
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
      if (isAMagicSlot && i === 0 && gameState.aSlotCooldown > 0) {
        continue;
      }
      if (isBMagicSlot && i === 1 && gameState.bSlotCooldown > 0) {
        continue;
      }
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
  
  // バッファー/デバッファーレベル取得ヘルパー
  const getBufferLevel = (statusEffects: { type: string; level?: number }[]): number => {
    const buffer = statusEffects.find(e => e.type === 'buffer');
    return buffer?.level ?? 0;
  };
  
  const getDebufferLevel = (statusEffects: { type: string; level?: number }[]): number => {
    const debuffer = statusEffects.find(e => e.type === 'debuffer');
    return debuffer?.level ?? 0;
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
  
  // 時間フォーマット（60分以上の場合はh:mm:ss形式）
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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
              <span className="text-gray-400">{isEnglishCopy ? 'Left' : '残り'}</span>
              <span className={cn(
                'font-bold',
                gameState.wave.waveKills >= gameState.wave.waveQuota 
                  ? 'text-green-400' 
                  : (gameState.elapsedTime - gameState.wave.waveStartTime) > WAVE_DURATION * 0.7
                    ? 'text-red-400'
                    : 'text-white'
              )}>
                {Math.max(0, gameState.wave.waveQuota - gameState.wave.waveKills)}
              </span>
            </div>
            <div className="flex flex-col items-center text-xs">
              <span className="text-gray-400">{isEnglishCopy ? 'Limit' : '制限'}</span>
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
      
      {/* オート選択で取得したスキル通知 */}
      {skillNotifications.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
          {skillNotifications.map((notification, index) => {
            const now = Date.now();
            const elapsed = now - notification.startTime;
            // 表示開始前は非表示
            if (elapsed < 0) return null;
            // フェードアウト計算（1.5秒後からフェード開始）
            const fadeStart = 1500;
            const fadeDuration = 500;
            const opacity = elapsed < fadeStart ? 1 : Math.max(0, 1 - (elapsed - fadeStart) / fadeDuration);
            // Y方向のオフセット（重ならないように）
            const yOffset = index * 50;
            
            return (
              <div
                key={notification.id}
                className="bg-gradient-to-r from-yellow-600/90 to-amber-600/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-400/50 shadow-lg animate-bounce"
                style={{
                  opacity,
                  transform: `translateY(${yOffset}px)`,
                  transition: 'opacity 0.3s ease-out',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{notification.icon}</span>
                  <div>
                    <div className="text-xs text-yellow-200 font-sans">LEVEL UP!</div>
                    <div className="text-white font-bold font-sans">{notification.displayName}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* メインゲームエリア */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 relative">
        {/* フローティングスティック（モバイル時のみ・タッチ位置に出現） */}
        {isMobile && floatingStick.visible && (
          <div
            className="fixed z-40 pointer-events-none"
            style={{
              left: floatingStick.baseX - 48,
              top: floatingStick.baseY - 48,
            }}
          >
            <div className="relative w-24 h-24 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-sm">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute top-1 text-white/40 text-xs">▲</div>
                <div className="absolute bottom-1 text-white/40 text-xs">▼</div>
                <div className="absolute left-1 text-white/40 text-xs">◀</div>
                <div className="absolute right-1 text-white/40 text-xs">▶</div>
              </div>
              <div
                className="absolute w-10 h-10 rounded-full shadow-lg"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${floatingStick.stickX}px), calc(-50% + ${floatingStick.stickY}px))`,
                  background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(180,180,200,0.7))',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.4)',
                }}
              />
            </div>
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
        <div
          className="relative rounded-xl overflow-hidden border-2 border-gray-700 touch-none"
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
        >
          <SurvivalCanvas
            gameState={gameState}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            shockwaves={shockwaves}
            lightningEffects={lightningEffects}
            characterAvatarUrl={character?.avatarUrl}
          />
          
          {/* ポーズ画面 */}
          {gameState.isPaused && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 overflow-y-auto">
              <div className="text-center w-full max-w-md px-4 py-4">
                <div className="text-3xl font-bold text-white font-sans mb-3">PAUSED</div>
                
                {/* ステータス表示 */}
                <div className="bg-gray-900/90 rounded-lg p-3 mb-3 text-left text-sm max-h-[50vh] overflow-y-auto">
                  {/* 基本情報 */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
                    <span className="text-gray-400 font-sans">Lv.{gameState.player.level}</span>
                    <span className="text-gray-400 font-sans">WAVE {gameState.wave.currentWave}</span>
                    <span className="font-sans">
                      <span className="text-red-400">HP</span>{' '}
                      <span className="text-white">{Math.floor(gameState.player.stats.hp)}/{gameState.player.stats.maxHp}</span>
                    </span>
                  </div>
                  
                  {/* ステータス */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 pb-2 border-b border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-blue-400 font-sans">🔫 A ATK</span>
                      <span className="text-white font-sans">{gameState.player.stats.aAtk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-400 font-sans">👊 B ATK</span>
                      <span className="text-white font-sans">{gameState.player.stats.bAtk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-sans">🔮 C ATK</span>
                      <span className="text-white font-sans">{gameState.player.stats.cAtk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-400 font-sans">🛡️ DEF</span>
                      <span className="text-white font-sans">{gameState.player.stats.def}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400 font-sans">💨 SPD</span>
                      <span className="text-white font-sans">{gameState.player.stats.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400 font-sans">🍀 LUCK</span>
                      <span className="text-white font-sans">{gameState.player.stats.luck}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-400 font-sans">⏱️ TIME</span>
                      <span className="text-white font-sans">{gameState.player.stats.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400 font-sans">🔄 RELOAD</span>
                      <span className="text-white font-sans">{gameState.player.stats.reloadMagic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-300 font-sans">💎 A弾数</span>
                      <span className="text-white font-sans">{gameState.player.stats.aBulletCount}</span>
                    </div>
                  </div>
                  
                  {/* 特殊スキル */}
                  {(() => {
                    const sk = gameState.player.skills;
                    const activeSkills: string[] = [];
                    if (sk.aPenetration) activeSkills.push('🔫 貫通');
                    if (sk.bKnockbackBonus > 0) activeSkills.push(`👊 ノックバック+${sk.bKnockbackBonus}`);
                    if (sk.bRangeBonus > 0) activeSkills.push(`👊 範囲+${sk.bRangeBonus}`);
                    if (sk.bDeflect) activeSkills.push('👊 弾消去');
                    if (sk.multiHitLevel > 0) activeSkills.push(`⚔️ 多段Lv${sk.multiHitLevel}`);
                    if (sk.expBonusLevel > 0) activeSkills.push(`✨ EXP+${sk.expBonusLevel}`);
                    if (sk.haisuiNoJin || sk.alwaysHaisuiNoJin) activeSkills.push(`🔥 背水${sk.alwaysHaisuiNoJin ? '(常時)' : ''}`);
                    if (sk.zekkouchou || sk.alwaysZekkouchou) activeSkills.push(`⭐ 絶好調${sk.alwaysZekkouchou ? '(常時)' : ''}`);
                    if (sk.autoSelect) activeSkills.push('🤖 オート');
                    
                    if (activeSkills.length === 0) return null;
                    return (
                      <div className="mb-2 pb-2 border-b border-gray-700">
                        <div className="text-gray-500 text-xs font-sans mb-1">{isEnglishCopy ? 'SKILLS' : 'スキル'}</div>
                        <div className="flex flex-wrap gap-1">
                          {activeSkills.map((s, i) => (
                            <span key={i} className="bg-gray-800 text-gray-200 px-2 py-0.5 rounded text-xs font-sans">{s}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* 魔法 */}
                  {(() => {
                    const mg = gameState.player.magics;
                    const activeMagics: { name: string; level: number; icon: string }[] = [];
                    if (mg.thunder > 0) activeMagics.push({ name: isEnglishCopy ? 'Thunder' : 'サンダー', level: mg.thunder, icon: '⚡' });
                    if (mg.ice > 0) activeMagics.push({ name: isEnglishCopy ? 'Ice' : 'アイス', level: mg.ice, icon: '❄️' });
                    if (mg.fire > 0) activeMagics.push({ name: isEnglishCopy ? 'Fire' : 'ファイア', level: mg.fire, icon: '🔥' });
                    if (mg.heal > 0) activeMagics.push({ name: isEnglishCopy ? 'Heal' : 'ヒール', level: mg.heal, icon: '💚' });
                    if (mg.buffer > 0) activeMagics.push({ name: isEnglishCopy ? 'Buffer' : 'バフ', level: mg.buffer, icon: '⬆️' });
                    if (mg.hint > 0) activeMagics.push({ name: isEnglishCopy ? 'Hint' : 'ヒント', level: mg.hint, icon: '💡' });
                    
                    if (activeMagics.length === 0) return null;
                    return (
                      <div>
                        <div className="text-gray-500 text-xs font-sans mb-1">{isEnglishCopy ? 'MAGIC' : '魔法'}</div>
                        <div className="flex flex-wrap gap-1">
                          {activeMagics.map((m, i) => (
                            <span key={i} className="bg-gray-800 text-gray-200 px-2 py-0.5 rounded text-xs font-sans">
                              {m.icon} {m.name} Lv{m.level}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex gap-4 justify-center">
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
          aSlotCooldown={gameState.aSlotCooldown}
          bSlotCooldown={gameState.bSlotCooldown}
          cSlotCooldown={gameState.cSlotCooldown}
          dSlotCooldown={gameState.dSlotCooldown}
          hasMagic={Object.values(gameState.player.magics).some(l => l > 0)}
          isAMagicSlot={isAMagicSlot}
          isBMagicSlot={isBMagicSlot}
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
          characterId={character?.id ?? null}
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
        displaySettings={displaySettings}
        onDisplaySettingsChange={setDisplaySettings}
        bgmVolume={bgmVolume}
        onBgmVolumeChange={(v) => {
          setBgmVolume(v);
          bgmVolumeRef.current = v;
          if (bgmAudioRef.current) {
            bgmAudioRef.current.volume = v;
          }
        }}
      />
    </div>
  );
};

export default SurvivalGameScreen;
