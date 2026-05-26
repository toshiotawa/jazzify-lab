/**
 * サバイバルモード ゲーム画面
 * ゲームループ、入力処理、UI統合
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  SHOCKWAVE_DURATION,
  SPECIAL_ATTACK_RADIUS_MULTIPLIER,
} from './SurvivalTypes';
import {
  createInitialGameState,
  initializeCodeSlots,
  selectRandomChord,
  selectProgressionChord,
  spawnEnemy,
  updatePlayerPosition,
  updateEnemyPositions,
  updateProjectiles,
  checkChordMatch,
  getCorrectNotes,
  createProjectile,
  createAProjectilesFromPlayer,
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
  createChordNameText,
  getMagicCooldown,
  castMagic,
  getDirectionVector,
  createCoinsFromEnemy,
  collectCoins,
  cleanupExpiredCoins,
  calculateWaveQuota,
  calculateWaveSpawnCount,
  getWaveSpeedMultiplier,
  shouldEnemyShoot,
  createEnemyProjectile,
  updateEnemyProjectiles,
  getConditionalSkillMultipliers,
  checkLuck,
  getAvailableMagics,
  calculateEnemyExpGain,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_COINS,
  spawnStageEnemy,
  spawnScenarioTutorialEnemyAt,
  getStageSpawnConfig,
  resetIncompleteOtherSlotCorrectNotes,
  updateComboOnABHit,
  expireComboIfTimedOut,
} from './SurvivalGameEngine';
import { WAVE_DURATION, DroppedItem, Projectile as SurvivalProjectile } from './SurvivalTypes';
import {
  STAGE_TIME_LIMIT_SECONDS,
  getSurvivalStageBattleKind,
  isBlockLastStage,
} from './SurvivalStageDefinitions';
import { fetchSurvivalStageIntroScript } from '@/components/survival/stageIntro/fetchSurvivalStageIntroScript';
import { fetchSurvivalStagePlayDialogue } from '@/components/survival/stageIntro/fetchSurvivalStagePlayDialogue';
import { fetchSurvivalBlockBossIntroScript } from '@/components/survival/stageIntro/fetchSurvivalBlockBossIntroScript';
import {
  scheduleSurvivalStageIntroLines,
  type SurvivalStageIntroScheduleHandle,
} from '@/components/survival/stageIntro/scheduleSurvivalStageIntroLines';
import {
  getStageKillQuotaForStage,
  hasBeginnerStageAssistForStage,
  isFirstBlockBossStageDef,
} from './survivalFirstBlockStage';
import { getBlockForStage } from './descent/descentBlocks';
import { buildProgressionChordDefinitions } from '@/utils/survivalProgressionChords';
import type { ChordDefinition as SurvivalChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import {
  createBossBattleState,
  resolveBossMaxHp,
  resolveBossPlayerMaxHp,
  tickBossBattle,
  applyPlayerProjectileToBoss,
  applyPlayerMeleeToBossBattle,
  applyBossPlayerMotion,
  healPlayerByAmount,
  drainPendingDrops,
  drainBossHealTexts,
} from './boss/SurvivalBossEngine';
import {
  BossBattleState,
  BOSS_HITBOX_RADIUS,
  HEALING_AMOUNT,
} from './boss/SurvivalBossTypes';
import SurvivalCanvas from './SurvivalCanvas';
import {
  SurvivalProgressionStaff,
  type SurvivalProgressionStaffSnapshot,
} from './SurvivalProgressionStaff';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';
import { SurvivalPhraseStaff } from './phrases/SurvivalPhraseStaff';
import {
  clampPhraseOutgoingDamage,
  PHRASE_EARLY_COMBO_CAP_UNTIL,
  PHRASE_EARLY_COMBO_DAMAGE_CAP,
  shouldFirePhrasePlayerAttacks,
} from './phrases/survivalPhraseComboDamageCap';
import {
  INACTIVE_SCENARIO_OVERRIDES,
  type SurvivalScenarioOverrides,
} from './scenario/survivalScenarioTypes';
import type { SurvivalScenarioHandle } from './scenario/survivalScenarioHandle';
import { chordToPhraseChord } from './tutorial/tutorialOnboardingChords';
import type { ChordDefinition } from '../fantasy/FantasyGameEngine';
import {
  shouldEnableJajiiSupport,
  createInitialJajiiState,
  updateJajiiMovementInPlace,
  getJajiiWorldPosition,
  tryScheduleMiniSpecial,
  consumeDueMiniSpecialIfDue,
  JAJII_MINI_RADIUS_MULTIPLIER,
  type JajiiState,
} from '@/components/survival/jajii/SurvivalJajiiEngine';
import { applyJajiiGaugeSpecialAtWorld } from '@/components/survival/jajii/applyJajiiSpecialShockwave';
import {
  createInitialPhraseState,
  evaluatePhraseNoteOn,
  getPhraseDisplayChords,
  getPhraseTargetMidi,
  type SurvivalPhraseRuntimeState,
} from './phrases/SurvivalPhraseEngine';
import {
  fetchSurvivalPhraseByStage,
  type SurvivalPhraseDefinition,
} from '@/utils/survivalPhraseDefinitions';
import { parseSurvivalQuestionId } from '@/utils/survivalQuestionTypes';
import {
  SurvivalPhraseDrumLoop,
  SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL,
} from '@/utils/survivalPhraseDrumLoop';
import { buildSurvivalRandomHintStaffVoicing } from '@/utils/survivalRandomHintStaff';
import { computeUnpressedNoteOpacity } from '@/utils/survivalStaffHintOpacity';
import SurvivalLevelUp from './SurvivalLevelUp';
import SurvivalGameOver from './SurvivalGameOver';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { VoiceInputController } from '@/utils/VoiceInputController';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import SurvivalSettingsModal, { loadSurvivalDisplaySettings, SurvivalDisplaySettings } from './SurvivalSettingsModal';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { playTutorialChordPreview } from '@/components/survival/tutorial/tutorialAudioUnlock';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { isIOSWebView, sendGameCallback, getIOSParam } from '@/utils/iosbridge';
import {
  SURVIVAL_STICK_DEAD_ZONE_FRACTION,
  SURVIVAL_STICK_SMOOTHING_LAMBDA,
  computeAnalogFromOffset,
  smoothAnalogToward,
} from '@/utils/survivalVirtualStickInput';

// ===== バーチャルスティック =====
interface VirtualStickProps {
  onAnalogChange: (v: { x: number; y: number }) => void;
}

const THUNDER_LIGHTNING_DURATION_MS = 260;
const MAX_THUNDER_LIGHTNING_PER_CAST = 8;
const MAX_ACTIVE_THUNDER_LIGHTNING = 24;
const FIRE_AURA_PROJECTILE_ERASE_BASE_RADIUS = 60;
const FIRE_AURA_PROJECTILE_ERASE_PER_LEVEL = 8;

const VIRTUAL_STICK_MAX_RADIUS_PX = 40;

const VirtualStick: React.FC<VirtualStickProps> = ({ onAnalogChange }) => {
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
    
    const maxRadius = VIRTUAL_STICK_MAX_RADIUS_PX;
    let dx = e.clientX - centerRef.current.x;
    let dy = e.clientY - centerRef.current.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    
    setStickPos({ x: dx, y: dy });
    onAnalogChange(computeAnalogFromOffset(dx, dy, maxRadius, SURVIVAL_STICK_DEAD_ZONE_FRACTION));
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
    onAnalogChange({ x: 0, y: 0 });
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

/** チュートリアル／シナリオ中の楽譜背後モンスター視認抑制用 */
interface SurvivalTutorialStaffBackdropProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

const SurvivalTutorialStaffBackdrop: React.FC<SurvivalTutorialStaffBackdropProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'w-fit rounded-xl border border-white/20 bg-black/50 px-3 py-2 pointer-events-none',
      className,
    )}
  >
    {children}
  </div>
);

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
  stageDefinition?: import('./SurvivalStageDefinitions').StageDefinition;
  onLessonStageClear?: () => void;
  onMissionStageClear?: () => void;
  isLessonMode?: boolean;
  hintMode?: boolean;
  onRetryWithHint?: () => void;
  onRetryWithoutHint?: () => void;
  onNextStage?: () => void;
  /** 設定から HINT/本番を切り替えてセッションをやり直す（親が key でリマウント） */
  onSurvivalRunModeRestart?: (nextHintMode: boolean) => void;
  /** LPデモ等で親コンテナに収める場合 true。min-h の代わりに h-full min-h-0 を使用 */
  embeddedFullHeight?: boolean;
  /** チュートリアル／オンボーディング時: embedded でもピアノ 120px と dvh に近い確保を優先する */
  survivalTutorialLayout?: boolean;
  /** チュートリアル台本用シナリオモード */
  scenarioMode?: boolean;
  initialScenarioOverrides?: SurvivalScenarioOverrides;
  onScenarioHandleReady?: (handle: SurvivalScenarioHandle) => void;
  scenarioUserInputPulseRef?: React.MutableRefObject<number>;
  scenarioSlotBCompletionPulseRef?: React.MutableRefObject<number>;
  scenarioMidiNoteReceivedRef?: React.MutableRefObject<boolean>;
  /** phrases ステージでも Supabase を叩かず、インライン定義のみ使う（v3 チュートリアルなど） */
  tutorialPhraseInlineDefinition?: import('@/utils/survivalPhraseDefinitions').SurvivalPhraseDefinition | null;
  /** phrases モードで全コードを一周して先頭コードに戻ったタイミングでのみインクリメント（親が tutorial 終了判定に利用） */
  scenarioPhraseFullLoopPulseRef?: React.MutableRefObject<number>;
  /** v3 dialogue_only でジャ爺話者があるシーンのみ。`shouldEnableJajiiSupport` の特例へ渡す */
  tutorialDialogueJajii?: boolean;
  /** ジャ爺吹き出しの segments。`.current` を親が書き換え、Canvas が毎フレーム参照 */
  tutorialJajiiSpeechSegmentsRef?: React.MutableRefObject<readonly TutorialResolvedTextSegment[]>;
}

const SurvivalGameScreen: React.FC<SurvivalGameScreenProps> = ({
  difficulty,
  config,
  onBackToSelect,
  onBackToMenu,
  debugSettings,
  character,
  stageDefinition,
  onLessonStageClear,
  onMissionStageClear,
  isLessonMode = false,
  hintMode = false,
  onRetryWithHint,
  onRetryWithoutHint,
  onNextStage,
  onSurvivalRunModeRestart,
  embeddedFullHeight = false,
  survivalTutorialLayout = false,
  scenarioMode = false,
  initialScenarioOverrides,
  onScenarioHandleReady,
  scenarioUserInputPulseRef,
  scenarioSlotBCompletionPulseRef,
  scenarioMidiNoteReceivedRef,
  tutorialPhraseInlineDefinition = null,
  scenarioPhraseFullLoopPulseRef,
  tutorialDialogueJajii = false,
  tutorialJajiiSpeechSegmentsRef,
}) => {
  const profile = useAuthStore(state => state.profile);
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const settings = useGameStore(state => state.settings);
  
  // ステージ1 / 第一ブロックボス のタイムドセリフ（本番のみ。両者は同時に走らせない）
  const [stageIntroCharacterLine, setStageIntroCharacterLine] = useState('');
  const [stageIntroJajiiLine, setStageIntroJajiiLine] = useState('');
  const stageIntroSchedulerRef = useRef<SurvivalStageIntroScheduleHandle | null>(null);
  const [blockBossIntroCharacterLine, setBlockBossIntroCharacterLine] = useState('');
  const [blockBossIntroJajiiLine, setBlockBossIntroJajiiLine] = useState('');
  const blockBossIntroSchedulerRef = useRef<SurvivalStageIntroScheduleHandle | null>(null);
  const [playDialogueFaiLine, setPlayDialogueFaiLine] = useState('');
  const [playDialogueJajiiLine, setPlayDialogueJajiiLine] = useState('');
  const playDialogueSchedulerRef = useRef<SurvivalStageIntroScheduleHandle | null>(null);

  const timedFaiBubbleCharacterLine =
    playDialogueFaiLine || blockBossIntroCharacterLine || stageIntroCharacterLine;
  const timedJajiiBubbleLine =
    playDialogueJajiiLine || blockBossIntroJajiiLine || stageIntroJajiiLine;

  // 初期化エラー状態
  const [initError, setInitError] = useState<string | null>(null);
  // MIDI初期化完了状態
  const [isMidiInitialized, setIsMidiInitialized] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const survivalPianoHeightRef = useRef(120);
  survivalPianoHeightRef.current = embeddedFullHeight && !survivalTutorialLayout ? 80 : 120;
  
  const isStageMode = !!stageDefinition;
  const stageBattleKind = stageDefinition
    ? getSurvivalStageBattleKind(
        stageDefinition.stageType,
        isBlockLastStage(stageDefinition.stageNumber, stageDefinition.mapCategory),
      )
    : null;
  const isBossStage = stageBattleKind === 'boss';
  // Progression コード進行ステージは、ブロック末尾のボス戦であっても DB の `chord_progression`
  // を順番通りに出題する設計（iOS ネイティブ `SurvivalGameLoop` と整合）。
  // `getSurvivalStageBattleKind` は isBlockLast を優先して 'boss' を返すため、ここで
  // 出題ロジック判定だけは `stageType === 'progression'` を直接見る。
  const isProgressionStage = stageDefinition?.stageType === 'progression';
  const isBasicMapStage = stageDefinition?.mapCategory === 'basic';
  const isPhraseMode = stageDefinition?.mapCategory === 'phrases';
  const shouldRunStageIntroDialogue =
    isStageMode
    && !!stageDefinition
    && stageDefinition.stageNumber === 1
    && (stageDefinition.mapCategory === 'basic'
      || stageDefinition.mapCategory === 'songs'
      || stageDefinition.mapCategory === 'phrases')
    && !isLessonMode
    && !scenarioMode
    && !survivalTutorialLayout;
  const beginnerAssistActive = stageDefinition
    ? hasBeginnerStageAssistForStage(stageDefinition)
    : false;
  const isFirstBlockBoss = stageDefinition && isBossStage
    ? isFirstBlockBossStageDef(stageDefinition)
    : false;
  const shouldRunBlockBossIntroDialogue =
    isStageMode
    && !!stageDefinition
    && isBossStage
    && isFirstBlockBoss
    && (stageDefinition.mapCategory === 'basic'
      || stageDefinition.mapCategory === 'songs'
      || stageDefinition.mapCategory === 'phrases')
    && !isLessonMode
    && !scenarioMode
    && !survivalTutorialLayout
    && !shouldRunStageIntroDialogue;
  const shouldRunStagePlayDialogue =
    isStageMode
    && !!stageDefinition
    && !scenarioMode
    && !survivalTutorialLayout
    && !shouldRunStageIntroDialogue
    && !shouldRunBlockBossIntroDialogue;
  const stageKillQuota = stageDefinition ? getStageKillQuotaForStage(stageDefinition) : 150;
  const shouldShowKeyboardHints = hintMode || beginnerAssistActive;
  const bossType = isBossStage && stageDefinition
    ? (getBlockForStage(stageDefinition.stageNumber, stageDefinition.mapCategory)?.bossType ?? null)
    : null;

  // Progression（コード進行）モード: B列のみで進行を循環。
  // DB の `chord_progression` から事前構築済みの ChordDefinition 配列を保持する。
  const progressionChordsRef = useRef<SurvivalChordDefinition[]>([]);
  const progressionIndexRef = useRef(0);

  const phraseDefinitionRef = useRef<SurvivalPhraseDefinition | null>(null);
  const phraseStateRef = useRef<SurvivalPhraseRuntimeState | null>(null);
  const [phraseUiTick, setPhraseUiTick] = useState(0);
  const phraseDrumLoopRef = useRef<SurvivalPhraseDrumLoop | null>(null);
  const phraseBgmUrlRef = useRef<string | null>(null);
  const phraseAudioContextRef = useRef<AudioContext | null>(null);
  const [phraseBgmReadyTick, setPhraseBgmReadyTick] = useState(0);

  const jajiiStateRef = useRef<JajiiState | null>(null);
  const jajiiWorldPosRef = useRef<{ x: number; y: number } | null>(null);

  const jajiiEnabled = useMemo(
    () =>
      shouldEnableJajiiSupport({
        isStageMode,
        scenarioMode,
        survivalTutorialLayout,
        mapCategory: stageDefinition?.mapCategory,
        tutorialDialogueJajii: tutorialDialogueJajii || undefined,
      }),
    [
      isStageMode,
      scenarioMode,
      survivalTutorialLayout,
      stageDefinition?.mapCategory,
      tutorialDialogueJajii,
    ],
  );

  useEffect(() => {
    if (!jajiiEnabled) {
      jajiiStateRef.current = null;
      jajiiWorldPosRef.current = null;
    }
  }, [jajiiEnabled]);

  const scenarioOverridesRef = useRef<SurvivalScenarioOverrides>(
    initialScenarioOverrides ?? INACTIVE_SCENARIO_OVERRIDES,
  );
  const scenarioPhraseChordRef = useRef<ChordDefinition | null>(null);
  const [scenarioUiTick, setScenarioUiTick] = useState(0);
  const scenarioHandleReadyRef = useRef(false);
  const emitAttackSlotRef = useRef<(slot: 'A' | 'B') => void>(() => undefined);
  const emitScenarioAttackOnlyRef = useRef<(slot: 'A' | 'B') => void>(() => undefined);
  const emitSpecialShockwaveRef = useRef<() => void>(() => undefined);

  const bumpScenarioUi = useCallback(() => {
    setScenarioUiTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!isPhraseMode || !stageDefinition) {
      phraseDefinitionRef.current = null;
      phraseStateRef.current = null;
      phraseBgmUrlRef.current = null;
      return;
    }

    const resolvePhraseBgmUrl = (
      phraseBgmUrl: string | null | undefined,
    ): string =>
      phraseBgmUrl?.trim() ||
      config.bgmUrl?.trim() ||
      SURVIVAL_PHRASE_DEFAULT_DRUM_LOOP_URL;

    const inline = tutorialPhraseInlineDefinition ?? null;
    if (inline !== null && inline.chords.length > 0) {
      phraseDefinitionRef.current = inline;
      phraseStateRef.current = createInitialPhraseState(inline);
      phraseBgmUrlRef.current = resolvePhraseBgmUrl(inline.bgmUrl);
      setPhraseUiTick((t) => t + 1);
      setPhraseBgmReadyTick((t) => t + 1);
      return undefined;
    }

    let cancelled = false;
    void fetchSurvivalPhraseByStage(stageDefinition.mapCategory, stageDefinition.stageNumber).then((phrase) => {
      if (cancelled || !phrase) return;
      phraseDefinitionRef.current = phrase;
      phraseStateRef.current = createInitialPhraseState(phrase);
      phraseBgmUrlRef.current = resolvePhraseBgmUrl(phrase.bgmUrl);
      setPhraseUiTick((t) => t + 1);
      setPhraseBgmReadyTick((t) => t + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [isPhraseMode, stageDefinition?.mapCategory, stageDefinition?.stageNumber, tutorialPhraseInlineDefinition, config.bgmUrl]);

  useEffect(() => {
    if (!isProgressionStage) {
      progressionChordsRef.current = [];
      progressionIndexRef.current = 0;
      return;
    }
    progressionChordsRef.current = buildProgressionChordDefinitions(stageDefinition?.chordProgression);
    progressionIndexRef.current = 0;
  }, [isProgressionStage, stageDefinition?.chordProgression]);

  // モバイル Safari のアドレスバー表示変化に合わせてレイアウト高さを同期（LP デモと同系）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const setDvh = (): void => {
      const vv = window.visualViewport;
      const vals = [window.innerHeight, document.documentElement.clientHeight];
      if (vv) vals.push(vv.height);
      const dvh = Math.min(...vals);
      document.documentElement.style.setProperty('--dvh', `${dvh}px`);
    };
    setDvh();
    window.addEventListener('resize', setDvh, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', setDvh, { passive: true });
      vv.addEventListener('scroll', setDvh, { passive: true });
    }
    const t1 = window.setTimeout(setDvh, 200);
    const t2 = window.setTimeout(setDvh, 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', setDvh);
      if (vv) {
        vv.removeEventListener('resize', setDvh);
        vv.removeEventListener('scroll', setDvh);
      }
      document.documentElement.style.removeProperty('--dvh');
    };
  }, []);

  /** Progression の B 列が完成したときに、進行 index を進めて次の current/next chord を返す。 */
  const advanceProgressionPair = useCallback((): { current: SurvivalChordDefinition | null; next: SurvivalChordDefinition | null } => {
    const chords = progressionChordsRef.current;
    if (chords.length === 0) return { current: null, next: null };
    progressionIndexRef.current = (progressionIndexRef.current + 1) % chords.length;
    const idx = progressionIndexRef.current;
    return {
      current: chords[idx],
      next: chords[(idx + 1) % chords.length],
    };
  }, []);

  // ボス戦状態（ref 管理: 毎フレーム破壊的に更新するため）
  const bossBattleRef = useRef<BossBattleState | null>(null);
  // ボス戦 UI 更新用の強制再レンダリングトリガ（HP バー等）
  const [bossUiTick, setBossUiTick] = useState(0);
  // 毎フレーム setBossUiTick を呼ぶと React コミットが頻発するので 100ms 間引き
  const lastBossUiFlushRef = useRef(0);

  // ゲーム状態
  const [gameState, setGameState] = useState<SurvivalGameState>(() => {
    const initial = createInitialGameState(difficulty, config, isStageMode);
    if (isPhraseMode && !isBossStage) {
      initial.player.stats.hp = 1000;
      initial.player.stats.maxHp = 1000;
      for (let si = 0; si < 4; si += 1) {
        initial.codeSlots.current[si].isEnabled = false;
        initial.codeSlots.next[si].isEnabled = false;
      }
    }
    if (isBossStage) {
      const bossPlayerMaxHp = resolveBossPlayerMaxHp(isPhraseMode);
      initial.player.stats.hp = bossPlayerMaxHp;
      initial.player.stats.maxHp = bossPlayerMaxHp;
      initial.codeSlots.current[2].isEnabled = false;
      initial.codeSlots.current[3].isEnabled = false;
      initial.codeSlots.next[2].isEnabled = false;
      initial.codeSlots.next[3].isEnabled = false;
    }
    // ステージモード時: HINTモードなら永続ヒントエフェクト付与
    if (isStageMode && hintMode) {
      initial.player.statusEffects = [
        ...initial.player.statusEffects,
        { type: 'hint' as never, duration: 999999, startTime: Date.now(), level: 1 },
      ];
    }
    // キャラクター能力を適用（ステージモードでは初期ステータスが既に強化済みなのでスキップ）
    if (character && !isStageMode) {
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
    // ボス戦では背水の陣を強制的に無効化（HPが1000固定で常時発動してしまうため）
    if (isBossStage) {
      initial.player.skills.haisuiNoJin = false;
      initial.player.skills.alwaysHaisuiNoJin = false;
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
  const pendingShockwavesRef = useRef<ShockwaveEffect[]>([]);
  // gameLoop 内で setShockwaves 呼び出しの要否を判定するためのカウント ref
  const shockwavesCountRef = useRef(0);
  useEffect(() => { shockwavesCountRef.current = shockwaves.length; }, [shockwaves]);

  // B 列マルチヒットの遅延発火キュー（setTimeout 連打を避け gameLoop で集約処理）
  const pendingMultiHitCallbacksRef = useRef<Array<{ scheduledAt: number; exec: () => void }>>([]);

  // 性能計測用 HUD（iOS URL param ?perfHud=true でのみ有効）
  const perfHudEnabled = useMemo(() => getIOSParam('perfHud') === 'true', []);
  const perfFrameCountRef = useRef(0);
  const perfLastSampleAtRef = useRef(0);
  const [perfHud, setPerfHud] = useState<{ fps: number }>({ fps: 0 });
  
  // B列多段攻撃のN回目ごとの色（1回目=オレンジ, 2回目=赤, ...）
  const B_HIT_COLORS = [
    '#f97316', // 1: オレンジ
    '#ef4444', // 2: 赤
    '#ec4899', // 3: マゼンタ
    '#a855f7', // 4: 紫
    '#3b82f6', // 5: 青
    '#06b6d4', // 6: シアン
    '#22c55e', // 7: 緑
    '#eab308', // 8: ゴールド
    '#ffffff', // 9+: 白
  ];
  
  // 雷エフェクト
  const [lightningEffects, setLightningEffects] = useState<LightningEffect[]>([]);
  // gameLoop 内で setLightningEffects 呼び出しの要否を判定するためのカウント ref
  const lightningEffectsCountRef = useRef(0);
  useEffect(() => { lightningEffectsCountRef.current = lightningEffects.length; }, [lightningEffects]);
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
  
  // スキル取得通知（オート選択・手動選択・キャラボーナス）
  interface SkillNotification {
    id: string;
    icon: string;
    displayName: string;
    startTime: number;
  }
  const [skillNotifications, setSkillNotifications] = useState<SkillNotification[]>([]);
  // gameLoop 内で setSkillNotifications 呼び出しの要否を判定するためのカウント ref
  const skillNotificationsCountRef = useRef(0);
  useEffect(() => { skillNotificationsCountRef.current = skillNotifications.length; }, [skillNotifications]);
  
  // ステージモード: 残り30秒パワーアップ済みフラグ
  const stagePowerUpTriggeredRef = useRef(false);

  // BGM制御用refs
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmUrlRef = useRef<string | null>(null);
  const [bgmVolume, setBgmVolume] = useState<number>(0.3);
  const bgmVolumeRef = useRef<number>(0.3);

  useEffect(() => {
    if (!isPhraseMode) {
      phraseDrumLoopRef.current?.dispose();
      phraseDrumLoopRef.current = null;
      return undefined;
    }
    if (!phraseDrumLoopRef.current) {
      phraseDrumLoopRef.current = new SurvivalPhraseDrumLoop();
    }
    return () => {
      phraseDrumLoopRef.current?.stop();
      phraseDrumLoopRef.current?.dispose();
      phraseDrumLoopRef.current = null;
    };
  }, [isPhraseMode, stageDefinition?.stageNumber]);

  useEffect(() => {
    const phraseDrum = phraseDrumLoopRef.current;
    const url = phraseBgmUrlRef.current;
    if (!isPhraseMode || !phraseDrum || !url) {
      return undefined;
    }
    if (gameState.isGameOver || gameState.isPaused || !gameState.isPlaying) {
      phraseDrum.stop();
      return undefined;
    }

    let cancelled = false;
    void (async () => {
      try {
        await initializeAudioSystem();
        if (cancelled) return;
        let ctx = phraseAudioContextRef.current;
        if (!ctx || ctx.state === 'closed') {
          ctx = new AudioContext();
          phraseAudioContextRef.current = ctx;
        }
        await ctx.resume();
        await phraseDrum.prepare(url, ctx);
        if (cancelled) return;
        phraseDrum.start();
        phraseDrum.setVolume(bgmVolumeRef.current);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      phraseDrum.stop();
    };
  }, [
    isPhraseMode,
    gameState.isGameOver,
    gameState.isPaused,
    gameState.isPlaying,
    phraseBgmReadyTick,
    config.bgmUrl,
  ]);
  
  // キー入力状態
  const keysRef = useRef<Set<string>>(new Set());
  /** 仮想スティックの目標アナログ（タッチ/ポインターで更新、ゲームループで平滑化） */
  const virtualAnalogTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const virtualAnalogSmoothedRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
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
  const voiceControllerRef = useRef<VoiceInputController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);
  const pianoScrollInitializedRef = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<SurvivalDisplaySettings>(loadSurvivalDisplaySettings);
  
  // handleNoteInputの最新参照を保持するref
  const handleNoteInputRef = useRef<(note: number) => void>(() => {});
  
  // ビューポートサイズ（Canvasラッパーを計測して設定）
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 500 });
  const [isMobile, setIsMobile] = useState(false);
  const isTouchDevice = useRef(false);
  // MIDI接続状態
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // ビューポートサイズ更新（Canvasラッパーを計測、マウント後にResizeObserverを設定）
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isTouchDevice.current = hasTouch;
    const detectMobile = () => window.innerWidth < 768 || hasTouch;
    const updateFromWindow = () => {
      const width = Math.min(window.innerWidth - 32, 1200);
      const height = Math.min(window.innerHeight - 350, 600);
      setViewportSize({ width, height });
      setIsMobile(detectMobile());
    };
    setIsMobile(detectMobile());
    const onWindowResize = () => setIsMobile(detectMobile());
    window.addEventListener('resize', onWindowResize);
    let cleanup: (() => void) | null = null;
    const id = setTimeout(() => {
      const wrapper = canvasWrapperRef.current;
      if (wrapper) {
        const ro = new ResizeObserver(() => {
          const w = Math.max(1, wrapper.clientWidth);
          const h = Math.max(1, wrapper.clientHeight);
          setViewportSize({ width: w, height: h });
        });
        ro.observe(wrapper);
        const w = Math.max(1, wrapper.clientWidth);
        const h = Math.max(1, wrapper.clientHeight);
        setViewportSize({ width: w, height: h });
        cleanup = () => ro.disconnect();
      } else {
        updateFromWindow();
        const onResize = updateFromWindow;
        window.addEventListener('resize', onResize);
        cleanup = () => window.removeEventListener('resize', onResize);
      }
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', onWindowResize);
      cleanup?.();
    };
  }, []);
  
  // BGM再生制御（ステージ種別ごとに決まる1曲をループ再生）
  useEffect(() => {
    if (
      scenarioMode
      && scenarioOverridesRef.current.disableSurvivalBgm
    ) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
        currentBgmUrlRef.current = null;
      }
      return;
    }
    if (isPhraseMode) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
        currentBgmUrlRef.current = null;
      }
      return;
    }
    // ゲームオーバーまたはポーズ中はBGMを停止
    if (gameState.isGameOver || gameState.isPaused || !gameState.isPlaying) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
      }
      return;
    }
    
    const targetBgmUrl = config.bgmUrl;
    
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
      } catch {
        // BGM再生に失敗しても、ゲームは続行
      }
    };
    
    playBgm();
    
    // クリーンアップ
    return () => {
      // コンポーネントアンマウント時はBGMを停止
    };
  }, [isPhraseMode, gameState.isGameOver, gameState.isPaused, gameState.isPlaying, config.bgmUrl]);
  
  // コンポーネントアンマウント時にBGMを停止
  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  // ステージクリア音をボス戦／通常ステージ共通で単一経路から再生
  // setGameState のアップデータ内部で副作用として呼んでいた経路を廃止し、
  // result.isStageClear の遷移を監視して一度だけ鳴らすことで一貫性を確保。
  const stageClearSoundPlayedRef = useRef(false);
  useEffect(() => {
    if (result?.isStageClear === true) {
      if (!stageClearSoundPlayedRef.current) {
        stageClearSoundPlayedRef.current = true;
        // BGM を即座にフェードアウトさせ、クリア音を確実に聴かせる
        if (bgmAudioRef.current) {
          try { bgmAudioRef.current.pause(); } catch { /* noop */ }
        }
        try { FantasySoundManager.playStageClear(); } catch { /* noop */ }
      }
    } else {
      stageClearSoundPlayedRef.current = false;
    }
  }, [result]);
  
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
      
      const initPromise = (async () => {
        try {
          if (isIOSWebView()) {
            controller.setKeyHighlightCallback((note: number, active: boolean) => {
              pixiRendererRef.current?.highlightKey(note, active);
            });
            setIsMidiInitialized(true);
            return;
          }
          const seVol = settings.soundEffectVolume ?? 0.8;
          const rootVol = settings.rootSoundVolume ?? 0.7;
          // ファンタジー／レジェンドと同様、GMピアノ読み込みまで待つ（数秒で打ち切ると低品質フォールバックになる）
          await Promise.all([
            initializeAudioSystem().then(() => {
              updateGlobalVolume(settings.midiVolume ?? 0.8);
            }),
            FantasySoundManager.init(seVol, rootVol, true).then(() => {
              FantasySoundManager.enableRootSound(true);
            }),
          ]);
          await controller.initialize();
          
          // MIDIControllerにキーハイライト機能を設定（初期化後に設定）
          controller.setKeyHighlightCallback((note: number, active: boolean) => {
            pixiRendererRef.current?.highlightKey(note, active);
          });
          
          FantasySoundManager.ensureContextsRunning();

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

  // 音声入力初期化（レジェンドモードと同様）
  useEffect(() => {
    if (settings.inputMethod !== 'voice') {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      return;
    }
    if (!settings.selectedAudioDevice) {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      return;
    }
    if (!VoiceInputController.isSupported()) return;

    const initVoiceInput = async () => {
      try {
        if (!voiceControllerRef.current) {
          voiceControllerRef.current = new VoiceInputController({
            onNoteOn: (note: number) => {
              if (handleNoteInputRef.current) {
                handleNoteInputRef.current(note);
              }
              const renderer = pixiRendererRef.current;
              if (renderer) {
                renderer.highlightKey(note, true);
                setTimeout(() => {
                  pixiRendererRef.current?.highlightKey(note, false);
                }, 150);
              }
            },
            onNoteOff: (note: number) => {
              pixiRendererRef.current?.highlightKey(note, false);
            },
            onConnectionChange: () => {},
            onError: () => {}
          });
          voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
        }
        if (settings.selectedAudioDevice) {
          const deviceId = settings.selectedAudioDevice === 'default' ? undefined : settings.selectedAudioDevice;
          await voiceControllerRef.current.connect(deviceId);
        }
      } catch {
        // エラー時はタッチ入力で続行可能
      }
    };
    void initVoiceInput();
  }, [settings.inputMethod, settings.selectedAudioDevice]);

  // 音声認識感度の反映
  useEffect(() => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
    }
  }, [settings.voiceSensitivity]);

  // 音声入力コントローラーのクリーンアップ
  useEffect(() => {
    return () => {
      if (voiceControllerRef.current) {
        voiceControllerRef.current.destroy();
        voiceControllerRef.current = null;
      }
    };
  }, []);

  // 入力方式切り替え時のMIDI/Voice切り替え処理
  useEffect(() => {
    if (settings.inputMethod === 'midi') {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      if (midiControllerRef.current && settings.selectedMidiDevice) {
        void midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
      }
    } else if (settings.inputMethod === 'voice') {
      if (midiControllerRef.current) {
        midiControllerRef.current.disconnect();
      }
    }
    // iOS: 入力方式切り替え後にBGM音量が低下する問題への対策
    const timer = setTimeout(() => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = bgmVolumeRef.current;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [settings.inputMethod, settings.selectedMidiDevice]);

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
        pianoHeight: survivalPianoHeightRef.current,
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

      renderer.setTouchActionMode('pan-x');
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
  
  // フローティングスティック操作ハンドラー（モバイル用：キャンバスエリア全体で操作）
  // iOS Safari ではReact合成イベントがpassiveリスナーとして登録されるため
  // preventDefault()が無視される。ネイティブリスナーで { passive: false } を使用。
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const isInteractiveElement = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
      if (el.closest('button, a, [role="button"], .pointer-events-auto')) return true;
      return false;
    };

    const FLOATING_STICK_MAX_RADIUS_PX = 44;

    // touchmove は iOS で 60〜120Hz 発火する。毎回 setFloatingStick すると
    // SurvivalGameScreen 全体が再レンダーされ、タッチ演奏と競合して重くなる。
    // 位置は ref に即時反映し、React state の更新は rAF で 1 フレーム 1 回に間引く。
    let pendingStickUpdate: { stickX: number; stickY: number } | null = null;
    let stickRafId: number | null = null;
    const flushStickUpdate = (): void => {
      stickRafId = null;
      if (!pendingStickUpdate) return;
      const { stickX, stickY } = pendingStickUpdate;
      pendingStickUpdate = null;
      setFloatingStick(prev => {
        if (prev.stickX === stickX && prev.stickY === stickY) return prev;
        return { ...prev, stickX, stickY };
      });
    };
    const scheduleStickUpdate = (stickX: number, stickY: number): void => {
      pendingStickUpdate = { stickX, stickY };
      if (stickRafId !== null) return;
      stickRafId = requestAnimationFrame(flushStickUpdate);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isTouchDevice.current || e.touches.length === 0) return;
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      const touch = e.touches[0];
      floatingStickRef.current = { baseX: touch.clientX, baseY: touch.clientY };
      virtualAnalogSmoothedRef.current = { x: 0, y: 0 };
      virtualAnalogTargetRef.current = { x: 0, y: 0 };
      pendingStickUpdate = null;
      setFloatingStick({
        baseX: touch.clientX, baseY: touch.clientY,
        stickX: 0, stickY: 0, visible: true,
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!floatingStickRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      const base = floatingStickRef.current;
      let dx = touch.clientX - base.baseX;
      let dy = touch.clientY - base.baseY;

      const maxRadius = FLOATING_STICK_MAX_RADIUS_PX;
      const distSq = dx * dx + dy * dy;
      const maxSq = maxRadius * maxRadius;
      if (distSq > maxSq) {
        const dist = Math.sqrt(distSq);
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      // analog target はゲームループから読まれるので ref に即時反映、
      // UI 側のスティック位置は rAF 間引きで React コミット数を削減する
      virtualAnalogTargetRef.current = computeAnalogFromOffset(
        dx,
        dy,
        maxRadius,
        SURVIVAL_STICK_DEAD_ZONE_FRACTION
      );
      scheduleStickUpdate(dx, dy);
    };

    const onTouchEnd = () => {
      floatingStickRef.current = null;
      if (stickRafId !== null) {
        cancelAnimationFrame(stickRafId);
        stickRafId = null;
      }
      pendingStickUpdate = null;
      setFloatingStick(prev => ({ ...prev, visible: false }));
      virtualAnalogTargetRef.current = { x: 0, y: 0 };
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd);
    wrapper.addEventListener('touchcancel', onTouchEnd);

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
      wrapper.removeEventListener('touchcancel', onTouchEnd);
      if (stickRafId !== null) {
        cancelAnimationFrame(stickRafId);
        stickRafId = null;
      }
    };
  }, []);
  
  // ゲーム開始
  const startGame = useCallback(() => {
    setGameState(prev => {
      const hasMagic = Object.values(prev.player.magics).some(l => l > 0);
      const progressionChords = isProgressionStage ? progressionChordsRef.current : null;
      // Progression 起動時は index を 0 から開始
      if (isProgressionStage) progressionIndexRef.current = 0;
      const randomHintShotDisabled =
        !isProgressionStage &&
        (isBasicMapStage ||
          hintMode ||
          prev.player.statusEffects.some(e => e.type === 'hint'));
      const codeSlots = initializeCodeSlots(
        config.allowedChords,
        hasMagic,
        isStageMode,
        progressionChords,
        randomHintShotDisabled,
      );
      if (isBossStage) {
        codeSlots.current[2].isEnabled = false;
        codeSlots.current[3].isEnabled = false;
        codeSlots.next[2].isEnabled = false;
        codeSlots.next[3].isEnabled = false;
      }

      return {
        ...prev,
        isPlaying: true,
        codeSlots,
      };
    });

    if (isBossStage && bossType) {
      bossBattleRef.current = createBossBattleState(bossType, performance.now(), {
        maxHp: resolveBossMaxHp(isPhraseMode, { isFirstBlockBoss }),
        playerMaxHp: resolveBossPlayerMaxHp(isPhraseMode),
      });
    } else {
      bossBattleRef.current = null;
    }

    lastUpdateRef.current = performance.now();
    spawnTimerRef.current = 0;
  }, [config.allowedChords, isStageMode, isBossStage, bossType, isProgressionStage, isBasicMapStage, hintMode, isPhraseMode, isFirstBlockBoss]);

  // ゲーム開始（初回のみ）。
  // 親側がコンポーネントを unmount→mount することでステージ切替時に再起動する想定。
  useEffect(() => {
    startGame();
  }, []);

  useEffect(() => {
    stageIntroSchedulerRef.current?.cancel();
    stageIntroSchedulerRef.current = null;

    if (
      !shouldRunStageIntroDialogue
      || stageDefinition === undefined
      || !gameState.isPlaying
      || gameState.isGameOver
    ) {
      setStageIntroCharacterLine('');
      setStageIntroJajiiLine('');
      return undefined;
    }

    let cancelled = false;

    fetchSurvivalStageIntroScript(stageDefinition.mapCategory).then((scriptPayload) => {
      if (cancelled) return;
      stageIntroSchedulerRef.current?.cancel();
      stageIntroSchedulerRef.current = scheduleSurvivalStageIntroLines({
        script: scriptPayload,
        isEnglishCopy,
        setFaiLine: (t) => {
          if (!cancelled) setStageIntroCharacterLine(t);
        },
        setJajiiLine: (t) => {
          if (!cancelled) setStageIntroJajiiLine(t);
        },
      });
    });

    return () => {
      cancelled = true;
      stageIntroSchedulerRef.current?.cancel();
      stageIntroSchedulerRef.current = null;
    };
  }, [
    shouldRunStageIntroDialogue,
    gameState.isPlaying,
    gameState.isGameOver,
    isEnglishCopy,
    stageDefinition?.mapCategory,
    stageDefinition?.stageNumber,
  ]);

  useEffect(() => {
    blockBossIntroSchedulerRef.current?.cancel();
    blockBossIntroSchedulerRef.current = null;

    if (
      !shouldRunBlockBossIntroDialogue
      || stageDefinition === undefined
      || !gameState.isPlaying
      || gameState.isGameOver
    ) {
      setBlockBossIntroCharacterLine('');
      setBlockBossIntroJajiiLine('');
      return undefined;
    }

    let cancelled = false;

    fetchSurvivalBlockBossIntroScript(stageDefinition.mapCategory).then((scriptPayload) => {
      if (cancelled) return;
      blockBossIntroSchedulerRef.current?.cancel();
      blockBossIntroSchedulerRef.current = scheduleSurvivalStageIntroLines({
        script: scriptPayload,
        isEnglishCopy,
        setFaiLine: (t) => {
          if (!cancelled) setBlockBossIntroCharacterLine(t);
        },
        setJajiiLine: (t) => {
          if (!cancelled) setBlockBossIntroJajiiLine(t);
        },
      });
    });

    return () => {
      cancelled = true;
      blockBossIntroSchedulerRef.current?.cancel();
      blockBossIntroSchedulerRef.current = null;
    };
  }, [
    shouldRunBlockBossIntroDialogue,
    gameState.isPlaying,
    gameState.isGameOver,
    isEnglishCopy,
    stageDefinition?.mapCategory,
    stageDefinition?.stageNumber,
    isBossStage,
    isFirstBlockBoss,
  ]);

  useEffect(() => {
    playDialogueSchedulerRef.current?.cancel();
    playDialogueSchedulerRef.current = null;

    if (
      !shouldRunStagePlayDialogue
      || stageDefinition === undefined
      || !gameState.isPlaying
      || gameState.isGameOver
    ) {
      setPlayDialogueFaiLine('');
      setPlayDialogueJajiiLine('');
      return undefined;
    }

    let cancelled = false;

    void fetchSurvivalStagePlayDialogue(
      stageDefinition.mapCategory,
      stageDefinition.stageNumber,
    ).then((scriptPayload) => {
      if (cancelled || !scriptPayload) return;
      playDialogueSchedulerRef.current?.cancel();
      playDialogueSchedulerRef.current = scheduleSurvivalStageIntroLines({
        script: scriptPayload,
        isEnglishCopy,
        setFaiLine: (t) => {
          if (!cancelled) setPlayDialogueFaiLine(t);
        },
        setJajiiLine: (t) => {
          if (!cancelled) setPlayDialogueJajiiLine(t);
        },
      });
    });

    return () => {
      cancelled = true;
      playDialogueSchedulerRef.current?.cancel();
      playDialogueSchedulerRef.current = null;
    };
  }, [
    shouldRunStagePlayDialogue,
    gameState.isPlaying,
    gameState.isGameOver,
    isEnglishCopy,
    stageDefinition?.mapCategory,
    stageDefinition?.stageNumber,
  ]);

  // キャラクター固有のボーナス除外リストとnoMagicフラグ
  const charExcludedBonuses = character?.excludedBonuses;
  const charNoMagic = character?.noMagic;
  const isLiraMagicMode = character?.name === 'リラ' || character?.nameEn === 'Lira';
  const isAbColumnMagicMode = character?.abColumnMagic ?? false;
  // ボス戦中は A/B 列を常に通常攻撃扱いにする
  const isAMagicSlot = isAbColumnMagicMode && !isBossStage;
  const isBMagicSlot = (isLiraMagicMode || isAbColumnMagicMode) && !isBossStage;

  // レベルアップボーナス選択処理（異名同音対応: 複数ボーナス一括適用）
  const handleLevelUpBonusSelect = useCallback((options: LevelUpBonus[]) => {
    if (options.length === 0) return;
    
    setGameState(gs => {
      if (!gs.isLevelingUp) return gs;
      
      let newPlayer = gs.player;
      for (const option of options) {
        newPlayer = applyLevelUpBonus(newPlayer, option);
      }
      const newPendingLevelUps = gs.pendingLevelUps - 1;
      
      // 魔法を取得したらC列とD列を有効化（魔法不可キャラの場合は常に無効）
      const hasMagic = !charNoMagic && Object.values(newPlayer.magics).some(l => l > 0);
      const newCodeSlots = isProgressionStage ? gs.codeSlots : {
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

    if (displaySettings.showLevelUpBonusPopup) {
      const now = Date.now();
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        setSkillNotifications(prev => [...prev, {
          id: `levelup_${now}_${i}`,
          icon: option.icon,
          displayName: isEnglishCopy && option.displayNameEn ? option.displayNameEn : option.displayName,
          startTime: now,
        }]);
      }
    }
  }, [config.allowedChords, charExcludedBonuses, charNoMagic, bonusChoiceCount, displaySettings.showLevelUpBonusPopup, isEnglishCopy, isProgressionStage]);
  
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
    const scenario = scenarioOverridesRef.current;
    const midiBlocked = scenario.isActive && scenario.blockMidiGameInput;
    const inputFullyBlocked =
      scenario.isActive && scenario.blockMidiGameInput && scenario.blockChordPadInput;

    if (!inputFullyBlocked && scenarioUserInputPulseRef) {
      scenarioUserInputPulseRef.current += 1;
    }
    if (!midiBlocked && scenarioMidiNoteReceivedRef) {
      scenarioMidiNoteReceivedRef.current = true;
    }

    setGameState(prev => {
      // ゲームオーバーまたはポーズ中は何もしない
      if (prev.isGameOver || prev.isPaused) return prev;

      const scenario = scenarioOverridesRef.current;
      if (
        scenario.isActive
        && scenario.blockMidiGameInput
        && scenario.blockChordPadInput
      ) {
        return prev;
      }

      if (isPhraseMode && phraseStateRef.current) {
        const noteMod12 = ((note % 12) + 12) % 12;
        const evaluation = evaluatePhraseNoteOn(phraseStateRef.current, noteMod12);
        phraseStateRef.current = evaluation.nextState;

        if (
          evaluation.result === 'measure-complete'
          && scenarioPhraseFullLoopPulseRef
          && evaluation.nextState.chordIndex === 0
        ) {
          scenarioPhraseFullLoopPulseRef.current += 1;
        }

        setPhraseUiTick((t) => t + 1);

        if (evaluation.result === 'miss') {
          return {
            ...prev,
            comboCount: 0,
            comboGauge: 0,
            comboReady: false,
          };
        }

        const phraseComboAfter = prev.comboCount + 1;
        const firePlayerCombat = shouldFirePhrasePlayerAttacks(phraseComboAfter);
        const capPhraseDmg = (raw: number): number => clampPhraseOutgoingDamage(phraseComboAfter, raw);
        const phraseJajiiCap =
          phraseComboAfter <= PHRASE_EARLY_COMBO_CAP_UNTIL ? PHRASE_EARLY_COMBO_DAMAGE_CAP : undefined;

        const newState: SurvivalGameState = {
          ...prev,
          comboCount: phraseComboAfter,
          enemyProjectiles: [...prev.enemyProjectiles],
          damageTexts: [...prev.damageTexts],
          enemies: [...prev.enemies],
        };

        if (firePlayerCombat) {
          const attackInstanceId = isBossStage ? `a_${performance.now()}` : undefined;
          const newProjectiles = createAProjectilesFromPlayer(
            prev.player,
            capPhraseDmg(calculateAProjectileDamage(prev.player.stats.aAtk)),
            attackInstanceId,
          );
          newState.projectiles = [...prev.projectiles, ...newProjectiles];

          if (evaluation.result === 'measure-complete') {
            const baseRange = 80;
            const bonusRange = prev.player.skills.bRangeBonus * 20;
            const totalRange = (baseRange + bonusRange) * SPECIAL_ATTACK_RADIUS_MULTIPLIER;
            const attackX = prev.player.x;
            const attackY = prev.player.y;
            pendingShockwavesRef.current.push({
              id: `shock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              x: attackX,
              y: attackY,
              radius: 0,
              maxRadius: totalRange,
              startTime: Date.now(),
              duration: SHOCKWAVE_DURATION,
              direction: prev.player.direction,
              color: '#f9d332',
              isSpecial: true,
            });
            newState.enemyProjectiles = newState.enemyProjectiles.filter((proj) => {
              const dx = proj.x - attackX;
              const dy = proj.y - attackY;
              return Math.sqrt(dx * dx + dy * dy) >= totalRange;
            });
            const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
            if (isBossStage && bossBattleRef.current?.active) {
              const condMultBoss = getConditionalSkillMultipliers(prev.player);
              let bossDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultBoss.atkMultiplier);
              bossDamage = capPhraseDmg(bossDamage);
              const meleeRes = applyPlayerMeleeToBossBattle(
                bossBattleRef.current,
                attackX,
                attackY,
                totalRange,
                bossDamage,
                prev.player.x,
                prev.player.y,
                true,
              );
              if (meleeRes.bossDamage > 0) {
                newState.damageTexts = [...newState.damageTexts, createDamageText(
                  bossBattleRef.current.boss.x,
                  bossBattleRef.current.boss.y - 30,
                  meleeRes.bossDamage,
                  false,
                )];
              }
              for (const m of meleeRes.minionKills) {
                newState.damageTexts = [...newState.damageTexts, createDamageText(m.x, m.y - 10, bossDamage, false)];
              }
              if (meleeRes.drops.length > 0) {
                newState.items = [...newState.items, ...meleeRes.drops];
              }
            }
            newState.enemies = newState.enemies.map((enemy) => {
              const dx = enemy.x - attackX;
              const dy = enemy.y - attackY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < totalRange) {
                const condMultB = getConditionalSkillMultipliers(prev.player);
                const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultB.atkMultiplier);
                const luckResultB = checkLuck(prev.player.stats.luck);
                let damage = calculateDamage(
                  baseBDamage, 0, enemy.stats.def,
                  prev.player.statusEffects.some((e) => e.type === 'buffer'),
                  enemy.statusEffects.some((e) => e.type === 'debuffer'),
                  getBufferLevel(prev.player.statusEffects),
                  getDebufferLevel(enemy.statusEffects),
                  prev.player.stats.cAtk,
                  luckResultB.doubleDamage,
                );
                damage = capPhraseDmg(damage);
                const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
                const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
                newState.damageTexts = [...newState.damageTexts, createDamageText(
                  enemy.x, enemy.y, damage,
                  luckResultB.doubleDamage,
                  luckResultB.doubleDamage ? '#ffd700' : undefined,
                )];
                return {
                  ...enemy,
                  stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
                  knockbackVelocity: { x: knockbackX, y: knockbackY },
                };
              }
              return enemy;
            });
          }
        }

        if (jajiiEnabled && jajiiStateRef.current && evaluation.result === 'measure-complete') {
          const jp = getJajiiWorldPosition(jajiiStateRef.current);
          applyJajiiGaugeSpecialAtWorld({
            draft: newState,
            jajiiX: jp.x,
            jajiiY: jp.y,
            radiusMultiplier: 1,
            isBossStage,
            bossBattle: bossBattleRef.current,
            queueShockwave: (w) => {
              pendingShockwavesRef.current.push(w);
            },
            maxOutgoingDamagePerHit: phraseJajiiCap,
          });
        }

        return newState;
      }
      
      // レベルアップ中もボーナス選択とABCD攻撃を同時に処理
      // 異名同音対応: 全オプションのcorrectNotesを更新（同じ音で複数マッチ可能に）
      if (prev.isLevelingUp) {
        const currentCorrectNotes = levelUpCorrectNotesRef.current.map(arr => [...arr]);
        
        prev.levelUpOptions.forEach((option, index) => {
          if (option.chord) {
            const prevNotes = currentCorrectNotes[index] || [];
            const correct = getCorrectNotes([...prevNotes, note], option.chord);
            currentCorrectNotes[index] = correct;
          }
        });
        
        levelUpCorrectNotesRef.current = currentCorrectNotes;
        setTimeout(() => setLevelUpCorrectNotes([...currentCorrectNotes]), 0);
      }
      
      // 通常のコード入力処理（レベルアップ中も実行）
      const noteMod12 = note % 12;
      const availableMagicsForSlot = getAvailableMagics(prev.player);

      // ===== 事前判定: このノートで変化が起きるか =====
      // 変化しない場合は React コミットを避けるため `prev` を返す。
      // iOS WebView では 1 コミットの節約がタッチ演奏の滑らかさに直結する。
      const slotAcceptsNote = (slot: CodeSlot, index: number): boolean => {
        if (!slot.isEnabled || !slot.chord) return false;
        if (slot.isCompleted || slot.completedTime) return false;
        if (index === 0 && isAMagicSlot && prev.aSlotCooldown > 0) return false;
        if (index === 1 && isBMagicSlot && prev.bSlotCooldown > 0) return false;
        if (index === 2 && prev.cSlotCooldown > 0) return false;
        if (index === 3 && prev.dSlotCooldown > 0) return false;
        const isMagicSlot = (index === 0 && isAMagicSlot) || (index === 1 && isBMagicSlot) || index === 2 || index === 3;
        if (isMagicSlot && availableMagicsForSlot.length === 0) return false;
        if (slot.correctNotes.includes(noteMod12)) return false;
        // targetNotes に含まれるかチェック（アロケーション最小化のため Set を作らない）
        const notes = slot.chord.notes;
        let matched = false;
        for (let k = 0; k < notes.length; k += 1) {
          if ((notes[k] % 12) === noteMod12) { matched = true; break; }
        }
        return matched;
      };

      let anyAccepts = false;
      for (let i = 0; i < prev.codeSlots.current.length; i += 1) {
        if (slotAcceptsNote(prev.codeSlots.current[i], i)) { anyAccepts = true; break; }
      }
      // どのスロットも受け付けない場合は何もしない（ gameState を変更しない）。
      // レベルアップ中の正解ノート表示は levelUpCorrectNotesRef + setLevelUpCorrectNotes
      // 経由で既に更新済みのため、ここで setGameState をコミットする必要はない。
      if (!anyAccepts) return prev;

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

      // 各スロットをチェック - 完了したすべてのスロットを追跡
      const completedSlotIndices: number[] = [];

      newState.codeSlots.current = newState.codeSlots.current.map((slot, index) => {
        if (!slot.isEnabled || !slot.chord) return slot;
        if (slot.isCompleted || slot.completedTime) return slot;
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
        const blockEval = scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.blockSlotEvaluation;
        const isComplete = !blockEval && newCorrectNotes.length >= targetNotes.length;

        if (isComplete) {
          completedSlotIndices.push(index);
          if (index === 1 && scenarioSlotBCompletionPulseRef) {
            scenarioSlotBCompletionPulseRef.current += 1;
          }
        }

        return {
          ...slot,
          correctNotes: newCorrectNotes,
          isCompleted: isComplete,
          completedTime: isComplete ? Date.now() : undefined,
        };
      }) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];

      newState.codeSlots.current = resetIncompleteOtherSlotCorrectNotes(
        newState.codeSlots.current,
        completedSlotIndices,
      );

      if (
        completedSlotIndices.includes(1)
        && scenarioOverridesRef.current.isActive
        && scenarioOverridesRef.current.hideStaffOnBSlotCompletion
      ) {
        scenarioOverridesRef.current = {
          ...scenarioOverridesRef.current,
          hideStaff: true,
        };
        bumpScenarioUi();
      }

      // コード完成時の処理 - すべての完了スロットに対してスキル発動
      for (const completedSlotIndex of completedSlotIndices) {
        if (
          scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.blockSlotEvaluation
        ) {
          continue;
        }
        const slotType = ['A', 'B', 'C', 'D'][completedSlotIndex] as 'A' | 'B' | 'C' | 'D';
        const scenarioOnComplete = scenarioOverridesRef.current;
        const completedChord = prev.codeSlots.current[completedSlotIndex].chord;
        if (completedChord && scenarioOnComplete.isActive) {
          newState.damageTexts.push(createChordNameText(prev.player.x, prev.player.y, completedChord.displayName));
        }
        if (
          completedSlotIndex === 1
          && scenarioOnComplete.isActive
          && scenarioOnComplete.bChordCompletionUseSpecial
        ) {
          emitSpecialShockwaveRef.current();
          continue;
        }
        if (
          completedSlotIndex === 1
          && scenarioOnComplete.isActive
          && scenarioOnComplete.bChordCompletionAttackSlot
        ) {
          emitScenarioAttackOnlyRef.current(scenarioOnComplete.bChordCompletionAttackSlot);
          continue;
        }
        
        // 正解時にルート音を鳴らす（ファンタジーモードと同様）
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
                castEnemies,
                undefined,
                { isStageMode }
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
            const comboAB = updateComboOnABHit(
              {
                comboCount: newState.comboCount,
                comboGauge: newState.comboGauge,
                comboReady: newState.comboReady,
                lastComboHitAt: newState.lastComboHitAt,
              },
              prev.elapsedTime,
            );
            newState.comboCount = comboAB.comboCount;
            newState.comboGauge = comboAB.comboGauge;
            newState.comboReady = comboAB.comboReady;
            newState.lastComboHitAt = comboAB.lastComboHitAt;
            const triggeredSpecialA = comboAB.triggeredSpecial;

            const attackInstanceId = isBossStage ? `a_${performance.now()}` : undefined;
            const newProjectiles = createAProjectilesFromPlayer(
              prev.player,
              calculateAProjectileDamage(prev.player.stats.aAtk),
              attackInstanceId,
            );
            newState.projectiles = [...newState.projectiles, ...newProjectiles];

            if (triggeredSpecialA) {
              const baseRange = 80;
              const bonusRange = prev.player.skills.bRangeBonus * 20;
              const totalRange = (baseRange + bonusRange) * SPECIAL_ATTACK_RADIUS_MULTIPLIER;
              const attackX = prev.player.x;
              const attackY = prev.player.y;
              pendingShockwavesRef.current.push({
                id: `shock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                x: attackX,
                y: attackY,
                radius: 0,
                maxRadius: totalRange,
                startTime: Date.now(),
                duration: SHOCKWAVE_DURATION,
                direction: prev.player.direction,
                color: '#f9d332',
                isSpecial: true,
              });
              newState.enemyProjectiles = newState.enemyProjectiles.filter((proj) => {
                const dx = proj.x - attackX;
                const dy = proj.y - attackY;
                return Math.sqrt(dx * dx + dy * dy) >= totalRange;
              });
              const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
              if (isBossStage && bossBattleRef.current?.active) {
                const condMultBoss = getConditionalSkillMultipliers(prev.player);
                const bossDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultBoss.atkMultiplier);
                const meleeRes = applyPlayerMeleeToBossBattle(
                  bossBattleRef.current,
                  attackX,
                  attackY,
                  totalRange,
                  bossDamage,
                  prev.player.x,
                  prev.player.y,
                  true,
                );
                if (meleeRes.bossDamage > 0) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    bossBattleRef.current.boss.x,
                    bossBattleRef.current.boss.y - 30,
                    meleeRes.bossDamage,
                    false,
                  )];
                }
                for (const m of meleeRes.minionKills) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(m.x, m.y - 10, bossDamage, false)];
                }
                if (meleeRes.drops.length > 0) {
                  newState.items = [...newState.items, ...meleeRes.drops];
                }
              }
              newState.enemies = newState.enemies.map((enemy) => {
                const dx = enemy.x - attackX;
                const dy = enemy.y - attackY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < totalRange) {
                  const condMultB = getConditionalSkillMultipliers(prev.player);
                  const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultB.atkMultiplier);
                  const luckResultB = checkLuck(prev.player.stats.luck);
                  const damage = calculateDamage(
                    baseBDamage, 0, enemy.stats.def,
                    prev.player.statusEffects.some((e) => e.type === 'buffer'),
                    enemy.statusEffects.some((e) => e.type === 'debuffer'),
                    getBufferLevel(prev.player.statusEffects),
                    getDebufferLevel(enemy.statusEffects),
                    prev.player.stats.cAtk,
                    luckResultB.doubleDamage,
                  );
                  const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
                  const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    enemy.x, enemy.y, damage,
                    luckResultB.doubleDamage,
                    luckResultB.doubleDamage ? '#ffd700' : undefined,
                  )];
                  return {
                    ...enemy,
                    stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
                    knockbackVelocity: { x: knockbackX, y: knockbackY },
                  };
                }
                return enemy;
              });
            }
            if (triggeredSpecialA && jajiiEnabled && jajiiStateRef.current) {
              const jp = getJajiiWorldPosition(jajiiStateRef.current);
              applyJajiiGaugeSpecialAtWorld({
                draft: newState,
                jajiiX: jp.x,
                jajiiY: jp.y,
                radiusMultiplier: 1,
                isBossStage,
                bossBattle: bossBattleRef.current,
                queueShockwave: (w) => {
                  pendingShockwavesRef.current.push(w);
                },
              });
            } else if (!triggeredSpecialA && jajiiEnabled && jajiiStateRef.current) {
              tryScheduleMiniSpecial(jajiiStateRef.current, prev.elapsedTime);
            }
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
                castEnemies,
                undefined,
                { isStageMode }
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
            const comboBB = updateComboOnABHit(
              {
                comboCount: newState.comboCount,
                comboGauge: newState.comboGauge,
                comboReady: newState.comboReady,
                lastComboHitAt: newState.lastComboHitAt,
              },
              prev.elapsedTime,
            );
            newState.comboCount = comboBB.comboCount;
            newState.comboGauge = comboBB.comboGauge;
            newState.comboReady = comboBB.comboReady;
            newState.lastComboHitAt = comboBB.lastComboHitAt;
            const triggeredSpecialB = comboBB.triggeredSpecial;

            const baseRange = 80;
            const bonusRange = prev.player.skills.bRangeBonus * 20;
            const totalRange = baseRange + bonusRange;
            const dirVec = getDirectionVector(prev.player.direction);

            if (triggeredSpecialB) {
              const specRange = totalRange * SPECIAL_ATTACK_RADIUS_MULTIPLIER;
              const attackX = prev.player.x;
              const attackY = prev.player.y;
              pendingShockwavesRef.current.push({
                id: `shock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                x: attackX,
                y: attackY,
                radius: 0,
                maxRadius: specRange,
                startTime: Date.now(),
                duration: SHOCKWAVE_DURATION,
                direction: prev.player.direction,
                color: '#f9d332',
                isSpecial: true,
              });
              newState.enemyProjectiles = newState.enemyProjectiles.filter((proj) => {
                const dx = proj.x - attackX;
                const dy = proj.y - attackY;
                return Math.sqrt(dx * dx + dy * dy) >= specRange;
              });
              const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
              if (isBossStage && bossBattleRef.current?.active) {
                const condMultBoss = getConditionalSkillMultipliers(prev.player);
                const bossDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultBoss.atkMultiplier);
                const meleeRes = applyPlayerMeleeToBossBattle(
                  bossBattleRef.current,
                  attackX,
                  attackY,
                  specRange,
                  bossDamage,
                  prev.player.x,
                  prev.player.y,
                  true,
                );
                if (meleeRes.bossDamage > 0) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    bossBattleRef.current.boss.x,
                    bossBattleRef.current.boss.y - 30,
                    meleeRes.bossDamage,
                    false,
                  )];
                }
                for (const m of meleeRes.minionKills) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(m.x, m.y - 10, bossDamage, false)];
                }
                if (meleeRes.drops.length > 0) {
                  newState.items = [...newState.items, ...meleeRes.drops];
                }
              }
              newState.enemies = newState.enemies.map((enemy) => {
                const dx = enemy.x - attackX;
                const dy = enemy.y - attackY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < specRange) {
                  const condMultB = getConditionalSkillMultipliers(prev.player);
                  const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultB.atkMultiplier);
                  const luckResultB = checkLuck(prev.player.stats.luck);
                  const damage = calculateDamage(
                    baseBDamage, 0, enemy.stats.def,
                    prev.player.statusEffects.some((e) => e.type === 'buffer'),
                    enemy.statusEffects.some((e) => e.type === 'debuffer'),
                    getBufferLevel(prev.player.statusEffects),
                    getDebufferLevel(enemy.statusEffects),
                    prev.player.stats.cAtk,
                    luckResultB.doubleDamage,
                  );
                  const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
                  const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    enemy.x, enemy.y, damage,
                    luckResultB.doubleDamage,
                    luckResultB.doubleDamage ? '#ffd700' : undefined,
                  )];
                  return {
                    ...enemy,
                    stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
                    knockbackVelocity: { x: knockbackX, y: knockbackY },
                  };
                }
                return enemy;
              });
            } else {
              const attackX = prev.player.x + dirVec.x * 40;
              const attackY = prev.player.y + dirVec.y * 40;
              pendingShockwavesRef.current.push({
                id: `shock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                x: attackX,
                y: attackY,
                radius: 0,
                maxRadius: totalRange,
                startTime: Date.now(),
                duration: SHOCKWAVE_DURATION,
                direction: prev.player.direction,
                color: B_HIT_COLORS[0],
              });
              if (prev.player.skills.bDeflect) {
                newState.enemyProjectiles = newState.enemyProjectiles.filter((proj) => {
                  const dx = proj.x - attackX;
                  const dy = proj.y - attackY;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  return dist >= totalRange;
                });
              }
              const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
              if (isBossStage && bossBattleRef.current?.active) {
                const condMultBoss = getConditionalSkillMultipliers(prev.player);
                const bossDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultBoss.atkMultiplier);
                const meleeRes = applyPlayerMeleeToBossBattle(
                  bossBattleRef.current,
                  attackX,
                  attackY,
                  totalRange,
                  bossDamage,
                  prev.player.x,
                  prev.player.y,
                );
                if (meleeRes.bossDamage > 0) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    bossBattleRef.current.boss.x,
                    bossBattleRef.current.boss.y - 30,
                    meleeRes.bossDamage,
                    false,
                  )];
                }
                for (const m of meleeRes.minionKills) {
                  newState.damageTexts = [...newState.damageTexts, createDamageText(m.x, m.y - 10, bossDamage, false)];
                }
                if (meleeRes.drops.length > 0) {
                  newState.items = [...newState.items, ...meleeRes.drops];
                }
              }
              newState.enemies = newState.enemies.map((enemy) => {
                const dx = enemy.x - attackX;
                const dy = enemy.y - attackY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const toEnemyX = enemy.x - prev.player.x;
                const toEnemyY = enemy.y - prev.player.y;
                const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
                const isInFront = dotProduct > 0;
                const effectiveRange = isInFront ? totalRange : baseRange;
                if (dist < effectiveRange) {
                  const condMultB = getConditionalSkillMultipliers(prev.player);
                  const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultB.atkMultiplier);
                  const luckResultB = checkLuck(prev.player.stats.luck);
                  const damage = calculateDamage(
                    baseBDamage, 0, enemy.stats.def,
                    prev.player.statusEffects.some((e) => e.type === 'buffer'),
                    enemy.statusEffects.some((e) => e.type === 'debuffer'),
                    getBufferLevel(prev.player.statusEffects),
                    getDebufferLevel(enemy.statusEffects),
                    prev.player.stats.cAtk,
                    luckResultB.doubleDamage,
                  );
                  const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
                  const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
                  newState.damageTexts = [...newState.damageTexts, createDamageText(
                    enemy.x, enemy.y, damage,
                    luckResultB.doubleDamage,
                    luckResultB.doubleDamage ? '#ffd700' : undefined,
                  )];
                  return {
                    ...enemy,
                    stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
                    knockbackVelocity: { x: knockbackX, y: knockbackY },
                  };
                }
                return enemy;
              });
            }

            if (triggeredSpecialB && jajiiEnabled && jajiiStateRef.current) {
              const jp = getJajiiWorldPosition(jajiiStateRef.current);
              applyJajiiGaugeSpecialAtWorld({
                draft: newState,
                jajiiX: jp.x,
                jajiiY: jp.y,
                radiusMultiplier: 1,
                isBossStage,
                bossBattle: bossBattleRef.current,
                queueShockwave: (w) => {
                  pendingShockwavesRef.current.push(w);
                },
              });
            } else if (!triggeredSpecialB && jajiiEnabled && jajiiStateRef.current) {
              tryScheduleMiniSpecial(jajiiStateRef.current, prev.elapsedTime);
            }

            const bMultiHitLevel = prev.player.skills.multiHitLevel;
            if (!triggeredSpecialB && bMultiHitLevel > 0) {
            for (let hit = 1; hit <= bMultiHitLevel; hit++) {
              const hitColor = B_HIT_COLORS[Math.min(hit, B_HIT_COLORS.length - 1)];
              pendingMultiHitCallbacksRef.current.push({ scheduledAt: Date.now() + hit * 200, exec: () => {
                const multiShockwave: ShockwaveEffect = {
                  id: `shock_multi_${Date.now()}_${hit}_${Math.random().toString(36).slice(2, 8)}`,
                  x: 0, y: 0, radius: 0, maxRadius: 0,
                  startTime: Date.now(), duration: SHOCKWAVE_DURATION,
                  direction: 'right' as Direction,
                  color: hitColor,
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
                        baseBDamage, 0, enemy.stats.def,
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
                        enemy.x, enemy.y, damage,
                        luckResultBMulti.doubleDamage,
                        luckResultBMulti.doubleDamage ? '#ffd700' : undefined
                      ));
                      
                      return {
                        ...enemy,
                        stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
                        knockbackVelocity: { x: knockbackX, y: knockbackY },
                      };
                    }
                    return enemy;
                  });
                  
                  let updatedItems = gs.items;
                  if (isBossStage && bossBattleRef.current?.active) {
                    const condMultBoss = getConditionalSkillMultipliers(gs.player);
                    const bossDamage = Math.floor(calculateBMeleeDamage(gs.player.stats.bAtk) * condMultBoss.atkMultiplier);
                    const meleeRes = applyPlayerMeleeToBossBattle(
                      bossBattleRef.current,
                      bAttackX,
                      bAttackY,
                      bTotalRange,
                      bossDamage,
                      gs.player.x,
                      gs.player.y
                    );
                    if (meleeRes.bossDamage > 0) {
                      newDamageTexts.push(createDamageText(
                        bossBattleRef.current.boss.x,
                        bossBattleRef.current.boss.y - 30,
                        meleeRes.bossDamage,
                        false
                      ));
                    }
                    for (const m of meleeRes.minionKills) {
                      newDamageTexts.push(createDamageText(m.x, m.y - 10, bossDamage, false));
                    }
                    if (meleeRes.drops.length > 0) {
                      updatedItems = [...updatedItems, ...meleeRes.drops];
                    }
                  }

                  return {
                    ...gs,
                    enemies: updatedEnemies,
                    enemyProjectiles: updatedEnemyProjectiles,
                    damageTexts: newDamageTexts,
                    items: updatedItems,
                  };
                });

                // setShockwaves は gameLoop 集約経路に統一して追加の React コミットを避ける
                pendingShockwavesRef.current.push(multiShockwave);
              } });
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
              castEnemies,
              undefined,
              { isStageMode }
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
              castEnemies,
              undefined,
              { isStageMode }
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
        
        // スロットのリセットは gameLoop のフォールバック経路に委譲する。
        // 以前は setTimeout(50ms) で setGameState を直接呼んでいたが、
        // 毎スキル発動につき React コミットが追加で発生し、iOS WebView で
        // タッチ操作が重くなる原因になっていた。
        // completedTime は上で設定済みのため、gameLoop が次フレームで自動リセットする。
      }
      
      return newState;
    });
  }, [
    config.allowedChords,
    levelUpCorrectNotes,
    handleLevelUpBonusSelect,
    isAMagicSlot,
    isBMagicSlot,
    appendThunderEffectsFromDamageTexts,
    isBossStage,
    isStageMode,
    isPhraseMode,
    scenarioPhraseFullLoopPulseRef,
    jajiiEnabled,
    bumpScenarioUi,
  ]);
  
  // handleNoteInputが更新されるたびにrefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);
  
  // タップでスキル発動（デバッグ用）
  const handleTapSkillActivation = useCallback((slotIndex: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    const slotType = ['A', 'B', 'C', 'D'][slotIndex] as 'A' | 'B' | 'C' | 'D';
    
    setGameState(prev => {
      if (isProgressionStage && slotIndex !== 1) return prev;

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
              castEnemies,
              undefined,
              { isStageMode }
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
          const attackInstanceId = isBossStage ? `a_${performance.now()}` : undefined;
          const newProjectiles = createAProjectilesFromPlayer(
            prev.player,
            calculateAProjectileDamage(prev.player.stats.aAtk),
            attackInstanceId,
          );
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
            castEnemies,
            undefined,
            { isStageMode }
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
      // 近接攻撃 - ダメージ即時適用 + 衝撃波エフェクト
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
        duration: SHOCKWAVE_DURATION,
        direction: prev.player.direction,
        color: B_HIT_COLORS[0],
      };
      pendingShockwavesRef.current.push(newShockwave);
      
      // 拳でかきけす
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
            baseBDamage, 0, enemy.stats.def,
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
            enemy.x, enemy.y, damage,
            luckResultBTap.doubleDamage,
            luckResultBTap.doubleDamage ? '#ffd700' : undefined
          )];
          
          return {
            ...enemy,
            stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
            knockbackVelocity: { x: knockbackX, y: knockbackY },
          };
        }
        return enemy;
      });
        
      const tapBMultiHitLevel = prev.player.skills.multiHitLevel;
      if (tapBMultiHitLevel > 0) {
        for (let hit = 1; hit <= tapBMultiHitLevel; hit++) {
          const tapHitColor = B_HIT_COLORS[Math.min(hit, B_HIT_COLORS.length - 1)];
          // setTimeout 連打 → gameLoop 側のキュー集約へ変更
          pendingMultiHitCallbacksRef.current.push({ scheduledAt: Date.now() + hit * 200, exec: () => {
            const multiShockwave: ShockwaveEffect = {
              id: `shock_tap_multi_${Date.now()}_${hit}_${Math.random().toString(36).slice(2, 8)}`,
              x: 0, y: 0, radius: 0, maxRadius: 0,
              startTime: Date.now(), duration: SHOCKWAVE_DURATION,
              direction: 'right' as Direction,
              color: tapHitColor,
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
                    baseBDamage, 0, enemy.stats.def,
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
                    enemy.x, enemy.y, damage,
                    luckResultBTapMulti.doubleDamage,
                    luckResultBTapMulti.doubleDamage ? '#ffd700' : undefined
                  ));
                  
                  return {
                    ...enemy,
                    stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
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

            // setShockwaves は gameLoop 集約経路に統一
            pendingShockwavesRef.current.push(multiShockwave);
          } });
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
          castEnemies,
          undefined,
          { isStageMode }
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
          castEnemies,
          undefined,
          { isStageMode }
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
}, [gameState.isGameOver, gameState.isPaused, isAMagicSlot, isBMagicSlot, isProgressionStage, appendThunderEffectsFromDamageTexts]);

  emitAttackSlotRef.current = (slot: 'A' | 'B') => {
    handleTapSkillActivation(slot === 'A' ? 0 : 1);
  };

  emitSpecialShockwaveRef.current = () => {
    setGameState((prev) => {
      if (prev.isPaused || prev.isGameOver) return prev;
      const baseRange = 80;
      const bonusRange = prev.player.skills.bRangeBonus * 20;
      const totalRange = (baseRange + bonusRange) * SPECIAL_ATTACK_RADIUS_MULTIPLIER;
      const attackX = prev.player.x;
      const attackY = prev.player.y;
      pendingShockwavesRef.current.push({
        id: `scenario_special_${Date.now()}`,
        x: attackX,
        y: attackY,
        radius: 0,
        maxRadius: totalRange,
        startTime: Date.now(),
        duration: SHOCKWAVE_DURATION,
        direction: prev.player.direction,
        color: '#f9d332',
        isSpecial: true,
      });
      const condMult = getConditionalSkillMultipliers(prev.player);
      const bossDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMult.atkMultiplier);
      const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;
      const newState = {
        ...prev,
        damageTexts: [...prev.damageTexts],
        enemies: [...prev.enemies],
      };
      newState.enemies = newState.enemies.map((enemy) => {
        const dx = enemy.x - attackX;
        const dy = enemy.y - attackY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= totalRange) return enemy;
        const luckResult = checkLuck(prev.player.stats.luck);
        const damage = calculateDamage(
          bossDamage,
          0,
          enemy.stats.def,
          prev.player.statusEffects.some((e) => e.type === 'buffer'),
          enemy.statusEffects.some((e) => e.type === 'debuffer'),
          getBufferLevel(prev.player.statusEffects),
          getDebufferLevel(enemy.statusEffects),
          prev.player.stats.cAtk,
          luckResult.doubleDamage,
        );
        const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
        const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;
        newState.damageTexts = [
          ...newState.damageTexts,
          createDamageText(
            enemy.x,
            enemy.y,
            damage,
            luckResult.doubleDamage,
            luckResult.doubleDamage ? '#ffd700' : undefined,
          ),
        ];
        return {
          ...enemy,
          x: enemy.x + knockbackX * 0.15,
          y: enemy.y + knockbackY * 0.15,
          stats: {
            ...enemy.stats,
            hp: Math.max(0, enemy.stats.hp - damage),
          },
        };
      });
      return newState;
    });
  };

  emitScenarioAttackOnlyRef.current = (slot: 'A' | 'B') => {
    setGameState((prev) => {
      if (prev.isPaused || prev.isGameOver) return prev;
      if (slot === 'A') {
        const attackInstanceId = bossBattleRef.current ? `scenario_a_${performance.now()}` : undefined;
        const newProjectiles = createAProjectilesFromPlayer(
          prev.player,
          calculateAProjectileDamage(prev.player.stats.aAtk),
          attackInstanceId,
        );
        return {
          ...prev,
          projectiles: [...prev.projectiles, ...newProjectiles],
        };
      }

      const newState = {
        ...prev,
        damageTexts: [...prev.damageTexts],
        enemies: [...prev.enemies],
        enemyProjectiles: [...prev.enemyProjectiles],
      };

      const baseRange = 80;
      const bonusRange = prev.player.skills.bRangeBonus * 20;
      const totalRange = baseRange + bonusRange;
      const dirVec = getDirectionVector(prev.player.direction);
      const attackX = prev.player.x + dirVec.x * 40;
      const attackY = prev.player.y + dirVec.y * 40;

      pendingShockwavesRef.current.push({
        id: `scenario_b_only_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        x: attackX,
        y: attackY,
        radius: 0,
        maxRadius: totalRange,
        startTime: Date.now(),
        duration: SHOCKWAVE_DURATION,
        direction: prev.player.direction,
        color: B_HIT_COLORS[0],
      });

      if (prev.player.skills.bDeflect) {
        newState.enemyProjectiles = prev.enemyProjectiles.filter((proj) => {
          const dx = proj.x - attackX;
          const dy = proj.y - attackY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist >= totalRange;
        });
      }

      const knockbackForce = 150 + prev.player.skills.bKnockbackBonus * 50;

      newState.enemies = newState.enemies.map((enemy) => {
        const dx = enemy.x - attackX;
        const dy = enemy.y - attackY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const toEnemyX = enemy.x - prev.player.x;
        const toEnemyY = enemy.y - prev.player.y;
        const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
        const isInFront = dotProduct > 0;
        const effectiveRange = isInFront ? totalRange : baseRange;

        if (dist < effectiveRange) {
          const condMultScenarioB = getConditionalSkillMultipliers(prev.player);
          const baseBDamage = Math.floor(calculateBMeleeDamage(prev.player.stats.bAtk) * condMultScenarioB.atkMultiplier);
          const luckResultScenarioB = checkLuck(prev.player.stats.luck);

          const damage = calculateDamage(
            baseBDamage,
            0,
            enemy.stats.def,
            prev.player.statusEffects.some((e) => e.type === 'buffer'),
            enemy.statusEffects.some((e) => e.type === 'debuffer'),
            getBufferLevel(prev.player.statusEffects),
            getDebufferLevel(enemy.statusEffects),
            prev.player.stats.cAtk,
            luckResultScenarioB.doubleDamage,
          );

          const knockbackX = dist > 0 ? (dx / dist) * knockbackForce : 0;
          const knockbackY = dist > 0 ? (dy / dist) * knockbackForce : 0;

          newState.damageTexts = [
            ...newState.damageTexts,
            createDamageText(
              enemy.x,
              enemy.y,
              damage,
              luckResultScenarioB.doubleDamage,
              luckResultScenarioB.doubleDamage ? '#ffd700' : undefined,
            ),
          ];

          return {
            ...enemy,
            stats: { ...enemy.stats, hp: Math.max(0, enemy.stats.hp - damage) },
            knockbackVelocity: { x: knockbackX, y: knockbackY },
          };
        }
        return enemy;
      });

      return newState;
    });
  };

  useEffect(() => {
    if (!scenarioMode || !onScenarioHandleReady || scenarioHandleReadyRef.current) return;
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const spawnStationaryAt = (x: number, y: number) => {
      setGameState((prev) => ({
        ...prev,
        enemies: [...prev.enemies, spawnScenarioTutorialEnemyAt(x, y)],
      }));
    };

    const handle: SurvivalScenarioHandle = {
      setOverrides: (overrides) => {
        scenarioOverridesRef.current = overrides;
        bumpScenarioUi();
      },
      applyMutation: (mutate) => {
        const next = { ...scenarioOverridesRef.current };
        mutate(next);
        scenarioOverridesRef.current = next;
        bumpScenarioUi();
      },
      getOverrides: () => scenarioOverridesRef.current,
      clearEnemies: () => {
        setGameState((prev) => ({ ...prev, enemies: [] }));
      },
      spawnEnemyInFront: (distance) => {
        setGameState((prev) => {
          const dir = getDirectionVector(prev.player.direction);
          const x = prev.player.x + dir.x * distance;
          const y = prev.player.y + dir.y * distance;
          return {
            ...prev,
            enemies: [...prev.enemies, spawnScenarioTutorialEnemyAt(x, y)],
          };
        });
      },
      spawnStationaryAt,
      spawnStationaryRing: (count, radius) => {
        setGameState((prev) => {
          const added = [];
          for (let i = 0; i < count; i += 1) {
            const angle = (i / count) * Math.PI * 2;
            const x = prev.player.x + Math.cos(angle) * radius;
            const y = prev.player.y + Math.sin(angle) * radius;
            added.push(spawnScenarioTutorialEnemyAt(x, y));
          }
          return { ...prev, enemies: [...prev.enemies, ...added] };
        });
      },
      emitAttackOnly: (slot) => {
        emitScenarioAttackOnlyRef.current(slot);
      },
      emitChordNameText: (chordName) => {
        setGameState((prev) => ({
          ...prev,
          damageTexts: [
            ...prev.damageTexts,
            createChordNameText(prev.player.x, prev.player.y, chordName),
          ],
        }));
      },
      spawnTutorialPerpendicularOffsets: (forward, perpOffsetsPx) => {
        setGameState((prev) => {
          const dir = getDirectionVector(prev.player.direction);
          const perp = { x: -dir.y, y: dir.x };
          const extras = perpOffsetsPx.map((t) => {
            const x = prev.player.x + dir.x * forward + perp.x * t;
            const y = prev.player.y + dir.y * forward + perp.y * t;
            return spawnScenarioTutorialEnemyAt(x, y);
          });
          return { ...prev, enemies: [...prev.enemies, ...extras] };
        });
      },
      emitAttackSlot: (slot) => emitAttackSlotRef.current(slot),
      emitSpecialShockwave: () => emitSpecialShockwaveRef.current(),
      setSlotBChord: (chord) => {
        setGameState((prev) => ({
          ...prev,
          codeSlots: {
            current: prev.codeSlots.current.map((slot, i) =>
              i === 1 ? { ...slot, chord, correctNotes: [], isCompleted: false, completedTime: undefined } : slot,
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
            next: prev.codeSlots.next,
          },
        }));
      },
      setSlotAEnabled: (enabled) => {
        setGameState((prev) => ({
          ...prev,
          codeSlots: {
            current: prev.codeSlots.current.map((slot, i) =>
              i === 0 ? { ...slot, isEnabled: enabled } : slot,
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
            next: prev.codeSlots.next.map((slot, i) =>
              i === 0 ? { ...slot, isEnabled: enabled } : slot,
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
          },
        }));
      },
      setSlotBEnabled: (enabled) => {
        setGameState((prev) => ({
          ...prev,
          codeSlots: {
            current: prev.codeSlots.current.map((slot, i) =>
              i === 1 ? { ...slot, isEnabled: enabled } : slot,
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
            next: prev.codeSlots.next.map((slot, i) =>
              i === 1 ? { ...slot, isEnabled: enabled } : slot,
            ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
          },
        }));
      },
      playChordAudio: (midis) => {
        void playTutorialChordPreview(midis, initPromiseRef.current ?? undefined);
      },
      getSlotBCompletionPulse: () => scenarioSlotBCompletionPulseRef?.current ?? 0,
      getUserInputPulse: () => scenarioUserInputPulseRef?.current ?? 0,
      setPhraseStaffChord: (chord) => {
        scenarioPhraseChordRef.current = chord;
        bumpScenarioUi();
      },
      setStaffMode: (mode) => {
        scenarioOverridesRef.current = {
          ...scenarioOverridesRef.current,
          staffMode: mode,
          hideStaff: mode === 'hidden',
        };
        bumpScenarioUi();
      },
    };

    scenarioHandleReadyRef.current = true;
    onScenarioHandleReady(handle);
  }, [
    scenarioMode,
    onScenarioHandleReady,
    gameState.isPlaying,
    gameState.isGameOver,
    bumpScenarioUi,
    scenarioSlotBCompletionPulseRef,
    scenarioUserInputPulseRef,
  ]);
  
  // ゲームループ
  // 注意: isLevelingUp中もゲームは継続（一時停止しない）
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      return;
    }
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min((timestamp - lastUpdateRef.current) / 1000, 0.1);
      lastUpdateRef.current = timestamp;

      // perfHud: 1 秒ごとに fps を集計して表示する
      if (perfHudEnabled) {
        perfFrameCountRef.current += 1;
        if (perfLastSampleAtRef.current === 0) perfLastSampleAtRef.current = timestamp;
        const elapsed = timestamp - perfLastSampleAtRef.current;
        if (elapsed >= 1000) {
          const fps = Math.round((perfFrameCountRef.current * 1000) / elapsed);
          perfFrameCountRef.current = 0;
          perfLastSampleAtRef.current = timestamp;
          setPerfHud({ fps });
        }
      }

      // B 列マルチヒットの遅延キューを消化（setTimeout 連打の代替）
      if (pendingMultiHitCallbacksRef.current.length > 0) {
        const nowMs = Date.now();
        const remaining: typeof pendingMultiHitCallbacksRef.current = [];
        const due: typeof pendingMultiHitCallbacksRef.current = [];
        for (const cb of pendingMultiHitCallbacksRef.current) {
          if (cb.scheduledAt <= nowMs) due.push(cb);
          else remaining.push(cb);
        }
        if (due.length > 0) {
          pendingMultiHitCallbacksRef.current = remaining;
          // 同一 rAF 内で連続発火 → React 18 自動バッチングで 1 コミットに集約される
          for (const cb of due) cb.exec();
        }
      }

      virtualAnalogSmoothedRef.current = smoothAnalogToward(
        virtualAnalogSmoothedRef.current,
        virtualAnalogTargetRef.current,
        deltaTime,
        SURVIVAL_STICK_SMOOTHING_LAMBDA
      );
      const smoothed = virtualAnalogSmoothedRef.current;
      const analogForMove =
        smoothed.x * smoothed.x + smoothed.y * smoothed.y > 1e-6 ? smoothed : null;

      const combinedKeys = new Set(keysRef.current);
      
      setGameState(prev => {
        // isLevelingUp中もゲームは継続
        if (!prev.isPlaying || prev.isPaused || prev.isGameOver) {
          return prev;
        }

        // ===== ボス戦ループ（通常ループを完全に置き換える） =====
        if (isBossStage && bossBattleRef.current) {
          const bossState = bossBattleRef.current;
          const newState = {
            ...prev,
            player: {
              ...prev.player,
              stats: { ...prev.player.stats },
              statusEffects: [...prev.player.statusEffects],
            },
            projectiles: [...prev.projectiles],
            damageTexts: [...prev.damageTexts],
            items: [...prev.items],
          };
          newState.elapsedTime = prev.elapsedTime + deltaTime;

          const bossComboExpired = expireComboIfTimedOut(prev, newState.elapsedTime);
          newState.comboCount = bossComboExpired.comboCount;
          newState.comboGauge = bossComboExpired.comboGauge;
          newState.comboReady = bossComboExpired.comboReady;

          // プレイヤー移動
          const movedPlayerBoss = updatePlayerPosition(prev.player, combinedKeys, deltaTime, analogForMove);
          newState.player.x = movedPlayerBoss.x;
          newState.player.y = movedPlayerBoss.y;
          newState.player.direction = movedPlayerBoss.direction;

          // ボスAI・ハザード・弾・被ダメ処理
          tickBossBattle(bossState, deltaTime * 1000, newState.player);
          const adjusted = applyBossPlayerMotion(
            bossState,
            newState.player.x,
            newState.player.y,
            deltaTime * 1000
          );
          newState.player.x = adjusted.x;
          newState.player.y = adjusted.y;

          // プレイヤー弾の更新とボス/雑魚への当たり判定
          newState.projectiles = updateProjectiles(prev.projectiles, deltaTime);
          const remainingProjs: SurvivalProjectile[] = [];
          const condMultBossProj = getConditionalSkillMultipliers(prev.player);
          for (const p of newState.projectiles) {
            const effectiveDamage = Math.floor(p.damage * condMultBossProj.atkMultiplier);
            const hitBoss = applyPlayerProjectileToBoss(
              bossState,
              p.x,
              p.y,
              effectiveDamage,
              p.hitEnemies,
              p.attackInstanceId,
            );
            if (hitBoss.hitBoss) {
              newState.damageTexts.push(createDamageText(
                bossState.boss.x,
                bossState.boss.y - 30,
                effectiveDamage,
                false
              ));
              if (p.penetrating) {
                p.hitEnemies.add(bossState.boss.id);
                remainingProjs.push(p);
              }
              continue;
            }
            if (hitBoss.hitMinionId) {
              newState.damageTexts.push(createDamageText(p.x, p.y, effectiveDamage, false));
              if (hitBoss.drops.length > 0) {
                newState.items = [...newState.items, ...hitBoss.drops];
              }
              if (p.penetrating) {
                p.hitEnemies.add(hitBoss.hitMinionId);
                remainingProjs.push(p);
              }
              continue;
            }
            remainingProjs.push(p);
          }
          newState.projectiles = remainingProjs;

          // 自爆雑魚由来の pending drops をアイテム化
          const pendingDrops = drainPendingDrops(bossState);
          if (pendingDrops.length > 0) {
            newState.items = [...newState.items, ...pendingDrops];
          }

          // C ボス自己回復の "+N" テキストを damageTexts に変換。
          // heal スキル発動時に積まれたイベントを drain し、緑色で表示する。
          const bossHealEvents = drainBossHealTexts(bossState);
          for (const ev of bossHealEvents) {
            const healText = createDamageText(
              ev.x,
              ev.y - BOSS_HITBOX_RADIUS,
              ev.amount,
              false,
              '#4ade80'
            );
            healText.text = `+${ev.amount}`;
            newState.damageTexts.push(healText);
          }

          // アイテム（ハート）のピックアップ（変化なしなら元配列を維持）
          const HEART_PICKUP_RADIUS = 28;
          const HEART_PICKUP_RADIUS_SQ = HEART_PICKUP_RADIUS * HEART_PICKUP_RADIUS;
          let itemsChanged = false;
          const keptItems: DroppedItem[] = [];
          for (const item of newState.items) {
            const dx = item.x - newState.player.x;
            const dy = item.y - newState.player.y;
            if (item.type === 'heart' && dx * dx + dy * dy < HEART_PICKUP_RADIUS_SQ) {
              healPlayerByAmount(bossState, HEALING_AMOUNT);
              itemsChanged = true;
              continue;
            }
            keptItems.push(item);
          }
          if (itemsChanged) newState.items = keptItems;

          // プレイヤー HP をボス戦 HP にミラー
          newState.player.stats.maxHp = resolveBossPlayerMaxHp(isPhraseMode);
          newState.player.stats.hp = bossState.player.hp;

          // スロット状態更新（A/B 列のみ、時間切れによる自動切替えは廃止）
          newState.codeSlots = {
            current: newState.codeSlots.current.map((slot, slotIndex) => {
              if (!slot.isEnabled) return slot;
              if (slotIndex >= 2) return slot; // C/D 封印
              if (slot.isCompleted) {
                if (!slot.completedTime) return { ...slot, completedTime: Date.now() };
                // 50ms 経過でリセット。以前は 500ms だったが、handleNoteInput の
                // setTimeout(50ms) 経路を撤去したので、ここで素早くリセットする。
                if (Date.now() - slot.completedTime >= 50) {
                  // Progression（コード進行）モード: B列のみ進行を進める
                  if (isProgressionStage && slotIndex === 1) {
                    if (scenarioOverridesRef.current.isActive) {
                      return { ...slot, isCompleted: false, completedTime: undefined };
                    }
                    const advanced = advanceProgressionPair();
                    newState.codeSlots.next = newState.codeSlots.next.map((ns, i) =>
                      i === slotIndex ? { ...ns, chord: advanced.next } : ns
                    ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
                    return { ...slot, chord: advanced.current, correctNotes: [], isCompleted: false, timer: SLOT_TIMEOUT, completedTime: undefined };
                  }
                  let nextChord = newState.codeSlots.next[slotIndex]?.chord;
                  if (!nextChord) nextChord = selectRandomChord(config.allowedChords, slot.chord?.id);
                  const newNextChord = selectRandomChord(config.allowedChords, nextChord?.id);
                  newState.codeSlots.next = newState.codeSlots.next.map((ns, i) =>
                    i === slotIndex ? { ...ns, chord: newNextChord } : ns
                  ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
                  return { ...slot, chord: nextChord, correctNotes: [], isCompleted: false, timer: SLOT_TIMEOUT, completedTime: undefined };
                }
                return slot;
              }
              if (!slot.chord) {
                if (isProgressionStage && slotIndex === 1) {
                  if (scenarioOverridesRef.current.isActive) {
                    return slot;
                  }
                  const idx = progressionIndexRef.current;
                  const chord = selectProgressionChord(progressionChordsRef.current, idx);
                  if (chord) {
                    return { ...slot, chord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
                  }
                  return slot;
                }
                const newChord = selectRandomChord(config.allowedChords);
                if (newChord) {
                  return { ...slot, chord: newChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
                }
                return slot;
              }
              // コードはスキル発動するまで保持し、時間切れで差し替えない。
              return slot;
            }) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot],
            next: newState.codeSlots.next,
          };

          // A/B クールダウン更新
          if (newState.aSlotCooldown > 0) newState.aSlotCooldown = Math.max(0, newState.aSlotCooldown - deltaTime);
          if (newState.bSlotCooldown > 0) newState.bSlotCooldown = Math.max(0, newState.bSlotCooldown - deltaTime);

          if (jajiiEnabled) {
            if (!jajiiStateRef.current) {
              jajiiStateRef.current = createInitialJajiiState(newState.player.x, newState.player.y);
            }
            const jst = jajiiStateRef.current;
            updateJajiiMovementInPlace(jst, newState.player.x, newState.player.y, newState.elapsedTime, deltaTime);
            const pos = getJajiiWorldPosition(jst);
            jajiiWorldPosRef.current = pos;
            if (!isPhraseMode && consumeDueMiniSpecialIfDue(jst, newState.elapsedTime)) {
              applyJajiiGaugeSpecialAtWorld({
                draft: newState,
                jajiiX: pos.x,
                jajiiY: pos.y,
                radiusMultiplier: JAJII_MINI_RADIUS_MULTIPLIER,
                isBossStage,
                bossBattle: bossBattleRef.current,
                queueShockwave: (w) => {
                  pendingShockwavesRef.current.push(w);
                },
              });
            }
          } else {
            jajiiWorldPosRef.current = null;
          }

          // ダメージテキストのクリーンアップ（変化なしなら元配列を維持）
          if (newState.damageTexts.length > 0) {
            const bossNow = Date.now();
            const filtered = newState.damageTexts.filter(d => bossNow - d.startTime < d.duration);
            if (filtered.length !== newState.damageTexts.length) {
              newState.damageTexts = filtered;
            }
          }

          // UI 側の HP バー等を再レンダリングさせるためのトリガ（100ms 間引き）
          {
            const nowMs = Date.now();
            if (nowMs - lastBossUiFlushRef.current >= 100) {
              lastBossUiFlushRef.current = nowMs;
              setBossUiTick(t => (t + 1) & 0x7fffffff);
            }
          }

          // 勝敗判定
          if (bossState.result === 'win') {
            newState.isGameOver = true;
            newState.isPlaying = false;
            const clearResult: SurvivalGameResult = {
              survivalTime: newState.elapsedTime,
              finalLevel: newState.player.level,
              enemiesDefeated: 1,
              playerStats: newState.player.stats,
              skills: newState.player.skills,
              magics: newState.player.magics,
              earnedXp: 0,
              isStageClear: true,
              isHintMode: hintMode,
            };
            setResult(clearResult);
            if (!hintMode) {
              onLessonStageClear?.();
              onMissionStageClear?.();
            }
            // クリア音は result の変化を監視する useEffect で一括再生（通常ステージと同一経路）
          } else if (bossState.result === 'lose' || bossState.player.hp <= 0) {
            newState.isGameOver = true;
            newState.isPlaying = false;
            const loseResult: SurvivalGameResult = {
              survivalTime: newState.elapsedTime,
              finalLevel: newState.player.level,
              enemiesDefeated: 0,
              playerStats: newState.player.stats,
              skills: newState.player.skills,
              magics: newState.player.magics,
              earnedXp: 0,
              isStageClear: false,
              isHintMode: hintMode,
            };
            setResult(loseResult);
          }

          return newState;
        }

        const newState = { ...prev };
        
        // 時間更新
        newState.elapsedTime = prev.elapsedTime + deltaTime;

        if (!isPhraseMode) {
          const comboExpired = expireComboIfTimedOut(prev, newState.elapsedTime);
          newState.comboCount = comboExpired.comboCount;
          newState.comboGauge = comboExpired.comboGauge;
          newState.comboReady = comboExpired.comboReady;
        }
        
        // プレイヤー移動（常に新しいオブジェクトを生成し、shared referenceによるミューテーション汚染を防止）
        const movedPlayer = updatePlayerPosition(prev.player, combinedKeys, deltaTime, analogForMove);
        newState.player = {
          ...movedPlayer,
          stats: { ...movedPlayer.stats },
          statusEffects: [...movedPlayer.statusEffects],
        };

        if (jajiiEnabled) {
          if (!jajiiStateRef.current) {
            jajiiStateRef.current = createInitialJajiiState(newState.player.x, newState.player.y);
          }
          const jst = jajiiStateRef.current;
          updateJajiiMovementInPlace(jst, newState.player.x, newState.player.y, newState.elapsedTime, deltaTime);
          const pos = getJajiiWorldPosition(jst);
          jajiiWorldPosRef.current = pos;
          if (!isPhraseMode && consumeDueMiniSpecialIfDue(jst, newState.elapsedTime)) {
            applyJajiiGaugeSpecialAtWorld({
              draft: newState,
              jajiiX: pos.x,
              jajiiY: pos.y,
              radiusMultiplier: JAJII_MINI_RADIUS_MULTIPLIER,
              isBossStage,
              bossBattle: bossBattleRef.current,
              queueShockwave: (w) => {
                pendingShockwavesRef.current.push(w);
              },
            });
          }
        } else {
          jajiiWorldPosRef.current = null;
        }
        
        // 敵移動（WAVE倍率適用）
        const waveSpeedMult = getWaveSpeedMultiplier(prev.wave.currentWave);
        newState.enemies = updateEnemyPositions(prev.enemies, newState.player.x, newState.player.y, deltaTime, waveSpeedMult);
        
        // 弾丸更新
        newState.projectiles = updateProjectiles(prev.projectiles, deltaTime);
        
        // 弾丸と敵の当たり判定（イミュータブル）
        const hitResults: { enemyId: string; damage: number; projId: string; isLucky: boolean; knockbackX: number; knockbackY: number }[] = [];
        const hitEnemyUpdates = new Set<string>();
        // ループ外で 1 回だけ計算（プレイヤー状態はフレーム内で不変）
        const condMultProjLoop = getConditionalSkillMultipliers(prev.player);
        const playerHasBufferLoop = prev.player.statusEffects.some(e => e.type === 'buffer');
        const playerBufferLvLoop = getBufferLevel(prev.player.statusEffects);
        // O(P*E) 全探索を避けるために簡易セル空間分割で敵をバケット化する
        const COLLISION_CELL_SIZE = 64;
        const COLLISION_HIT_RADIUS_SQ = 25 * 25;
        const enemyGrid = new Map<string, typeof newState.enemies>();
        for (const enemy of newState.enemies) {
          const cx = Math.floor(enemy.x / COLLISION_CELL_SIZE);
          const cy = Math.floor(enemy.y / COLLISION_CELL_SIZE);
          const key = `${cx}|${cy}`;
          const bucket = enemyGrid.get(key);
          if (bucket) bucket.push(enemy);
          else enemyGrid.set(key, [enemy]);
        }
        newState.projectiles.forEach(proj => {
          const pcx = Math.floor(proj.x / COLLISION_CELL_SIZE);
          const pcy = Math.floor(proj.y / COLLISION_CELL_SIZE);
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const bucket = enemyGrid.get(`${pcx + ox}|${pcy + oy}`);
              if (!bucket) continue;
              for (const enemy of bucket) {
                if (proj.hitEnemies.has(enemy.id)) continue;

                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < COLLISION_HIT_RADIUS_SQ) {
                  const effectiveADamage = Math.floor(proj.damage * condMultProjLoop.atkMultiplier);
                  const luckResultHit = checkLuck(prev.player.stats.luck);

                  const damage = calculateDamage(
                    effectiveADamage,
                    0,
                    enemy.stats.def,
                    playerHasBufferLoop,
                    enemy.statusEffects.some(e => e.type === 'debuffer'),
                    playerBufferLvLoop,
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
              }
            }
          }
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
        const scenarioEnemyAttacksDisabled =
          scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.disableEnemyAttacks;
        // ループ外で 1 回だけ計算（プレイヤー防御計算はフレーム内で不変）
        const contactCondMult = getConditionalSkillMultipliers(newState.player);
        const contactDefMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
        const contactEffectiveDef = contactCondMult.defOverride !== null ? contactCondMult.defOverride : newState.player.stats.def;
        const contactLuckBase = newState.player.stats.luck;
        if (!scenarioEnemyAttacksDisabled) {
        newState.enemies.forEach(enemy => {
          const dx = enemy.x - newState.player.x;
          const dy = enemy.y - newState.player.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 900) { // 30^2
            const luckResultContact = checkLuck(contactLuckBase);
            if (!luckResultContact.noDamageTaken) {
              const damage = Math.max(1, Math.floor(enemy.stats.atk - contactEffectiveDef * contactDefMultiplier * 0.5));
              contactDamageTotal += damage * deltaTime * 2;
            }
          }
        });
        }
        if (contactDamageTotal > 0) {
          newState.player = {
            ...newState.player,
            stats: {
              ...newState.player.stats,
              hp: Math.max(0, newState.player.stats.hp - contactDamageTotal),
            },
          };
        }
        
        // 敵の射撃処理（フレーズモードまたはシナリオで無効時は発射しない）
        const scenarioEnemyShootingDisabled =
          scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.disableEnemyAttacks;
        if (!isPhraseMode && !scenarioEnemyShootingDisabled && !beginnerAssistActive) {
        newState.enemies.forEach(enemy => {
          if (shouldEnemyShoot(enemy, newState.player.x, newState.player.y, newState.elapsedTime)) {
            const proj = createEnemyProjectile(enemy, newState.player.x, newState.player.y);
            newState.enemyProjectiles.push(proj);
          }
        });
        }
        
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
        const ENEMY_PROJECTILE_HIT_RADIUS_SQ = ENEMY_PROJECTILE_HIT_RADIUS * ENEMY_PROJECTILE_HIT_RADIUS;
        let projDamageTotal = 0;
        // ループ外で 1 回だけ計算（プレイヤー防御計算はフレーム内で不変）
        const projCondMult = getConditionalSkillMultipliers(newState.player);
        const projDefMultiplier = newState.player.statusEffects.some(e => e.type === 'def_up') ? 2 : 1;
        const projEffectiveDef = projCondMult.defOverride !== null ? projCondMult.defOverride : newState.player.stats.def;
        const projLuckBase = newState.player.stats.luck;
        newState.enemyProjectiles = newState.enemyProjectiles.filter(proj => {
          const dx = proj.x - newState.player.x;
          const dy = proj.y - newState.player.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < ENEMY_PROJECTILE_HIT_RADIUS_SQ) {
            const luckResultProj = checkLuck(projLuckBase);
            if (luckResultProj.noDamageTaken) {
              newState.damageTexts.push(createDamageText(newState.player.x, newState.player.y, 0, false, '#ffd700'));
              return false;
            }

            const damage = Math.max(1, Math.floor(proj.damage - projEffectiveDef * projDefMultiplier * 0.3));
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
          if (isStageMode) {
            // ステージモード: コインもEXPも無し（レベルアップなし）
          } else {
            const isAutoCollect = character?.autoCollectExp ?? false;
            
            if (isAutoCollect) {
              const expBonus = newState.player.skills.expBonusLevel;
              let totalDirectExp = 0;
              defeatedEnemies.forEach(enemy => {
                totalDirectExp += calculateEnemyExpGain(enemy.isBoss, config.expMultiplier, expBonus);
              });
              if (totalDirectExp > 0) {
                const levelBefore = newState.player.level;
                const { player: expPlayer, leveledUp: directLevelUp, levelUpCount: directLevelUpCount } = addExp(newState.player, totalDirectExp);
                newState.player = expPlayer;
                if (directLevelUp) {
                  autoCollectLeveledUp = true;
                  autoCollectLevelUpCount += directLevelUpCount;
                  autoCollectOldLevel = Math.min(autoCollectOldLevel, levelBefore);
                }
              }
            } else {
              defeatedEnemies.forEach(enemy => {
                if (newState.coins.length < MAX_COINS) {
                  const coins = createCoinsFromEnemy(enemy, config.expMultiplier, newState.player.skills.expBonusLevel);
                  const allowedCoins = coins.slice(0, MAX_COINS - newState.coins.length);
                  newState.coins = [...newState.coins, ...allowedCoins];
                }
              });
            }
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
            newState.codeSlots = isProgressionStage ? newState.codeSlots : {
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
                    displayName: isEnglishCopy && bonus.displayNameEn ? bonus.displayNameEn : bonus.displayName,
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
        if (
          scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.suppressAutoSpawn
        ) {
          /* チュートリアル: 台本からのみスポーン */
        } else if (isStageMode) {
          const stageSpawn = getStageSpawnConfig(newState.elapsedTime, beginnerAssistActive);
          const stageSpawnRate = isPhraseMode ? stageSpawn.spawnRate / 0.7 : stageSpawn.spawnRate;
          const isFirstSpawn = newState.enemies.length === 0 && newState.enemiesDefeated === 0;
          if (isFirstSpawn) {
            spawnTimerRef.current = stageSpawnRate;
          } else {
            spawnTimerRef.current += deltaTime;
          }
          if (spawnTimerRef.current >= stageSpawnRate && newState.enemies.length < MAX_ENEMIES) {
            spawnTimerRef.current = 0;
            const spawnCount = Math.min(stageSpawn.spawnCount, MAX_ENEMIES - newState.enemies.length);
            for (let i = 0; i < spawnCount; i++) {
              const newEnemy = spawnStageEnemy(
                newState.player.x,
                newState.player.y,
                newState.elapsedTime,
                beginnerAssistActive,
              );
              newState.enemies.push(newEnemy);
            }
          }
        } else {
          const effectiveSpawnRate = Math.max(1.5, config.enemySpawnRate);
          const baseSpawnCount = config.enemySpawnCount;
          const effectiveSpawnCount = calculateWaveSpawnCount(baseSpawnCount, newState.wave.currentWave);
          
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
        }
        
        // パフォーマンス: プロジェクタイルの数を制限
        if (newState.projectiles.length > MAX_PROJECTILES) {
          newState.projectiles = newState.projectiles.slice(-MAX_PROJECTILES);
        }
        
        // スロット状態更新（時間切れによる自動切替えは廃止）
        newState.codeSlots.current = newState.codeSlots.current.map((slot, slotIndex) => {
          if (!slot.isEnabled) return slot;

          // 完了状態のスロットは一定時間後に自動リセット
          // （handleNoteInput の setTimeout(50ms) 経路を撤去したため、
          //   ここで 50ms 経過後にリセットする）
          if (slot.isCompleted) {
            // completedTimeが設定されていない場合は設定
            if (!slot.completedTime) {
              return { ...slot, completedTime: Date.now() };
            }
            // 50ms以上経過していたらリセット
            if (Date.now() - slot.completedTime >= 50) {
              // Progression（コード進行）モード: B列のみ進行を進める
              if (isProgressionStage && slotIndex === 1) {
                if (scenarioOverridesRef.current.isActive) {
                  return { ...slot, isCompleted: false, completedTime: undefined };
                }
                const advanced = advanceProgressionPair();
                newState.codeSlots.next = newState.codeSlots.next.map((ns, i) =>
                  i === slotIndex ? { ...ns, chord: advanced.next } : ns
                ) as [CodeSlot, CodeSlot, CodeSlot, CodeSlot];
                return { ...slot, chord: advanced.current, correctNotes: [], isCompleted: false, timer: SLOT_TIMEOUT, completedTime: undefined };
              }

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
            if (isProgressionStage && slotIndex === 1) {
              if (scenarioOverridesRef.current.isActive) {
                return slot;
              }
              const idx = progressionIndexRef.current;
              const chord = selectProgressionChord(progressionChordsRef.current, idx);
              if (chord) {
                return { ...slot, chord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
              }
              return slot;
            }
            const newChord = selectRandomChord(config.allowedChords);
            if (newChord) {
              return { ...slot, chord: newChord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT };
            }
            return slot;
          }

          // コードはスキル発動するまで保持し、時間切れで差し替えない。
          return slot;
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
        
        if (isStageMode) {
          const scNoStageTimers =
            scenarioMode
            && scenarioOverridesRef.current.isActive
            && scenarioOverridesRef.current.disableTimeLimitClear
            && scenarioOverridesRef.current.disableKillQuotaClear;
          if (!scNoStageTimers) {
          // ステージモード: 残り30秒パワーアップ
          const remainingTime = STAGE_TIME_LIMIT_SECONDS - newState.elapsedTime;
          if (remainingTime <= 30 && !stagePowerUpTriggeredRef.current) {
            stagePowerUpTriggeredRef.current = true;
            newState.player = {
              ...newState.player,
              stats: {
                ...newState.player.stats,
                aBulletCount: Math.min(25, newState.player.stats.aBulletCount + 16),
                speed: newState.player.stats.speed + 10,
              },
              skills: {
                ...newState.player.skills,
                bRangeBonus: newState.player.skills.bRangeBonus + 10,
                multiHitLevel: Math.min(3, newState.player.skills.multiHitLevel + 1),
              },
              magics: {
                ...newState.player.magics,
                thunder: Math.max(newState.player.magics.thunder, 1),
              },
            };
            FantasySoundManager.playStageClear();
            setSkillNotifications(prev => [
              ...prev,
              { id: `powerup_${Date.now()}`, icon: '⚡', displayName: isEnglishCopy ? 'All Stats Boost' : '全能力強化', startTime: Date.now() },
            ]);
          }

          // ステージモード: 90秒生存 + 撃破ノルマ
          if (newState.wave.waveKills >= stageKillQuota && !newState.wave.waveCompleted) {
            newState.wave = { ...newState.wave, waveCompleted: true };
          }

          if (newState.elapsedTime >= STAGE_TIME_LIMIT_SECONDS && !newState.isGameOver) {
            newState.isGameOver = true;
            newState.isPlaying = false;
            const earnedXp = Math.floor(newState.elapsedTime / 60) * EXP_PER_MINUTE;
            const cleared = newState.enemiesDefeated >= stageKillQuota;
            // クリア音は result の変化を監視する useEffect で一括再生（ボス戦と同一経路）
            setResult({
              survivalTime: newState.elapsedTime,
              finalLevel: newState.player.level,
              enemiesDefeated: newState.enemiesDefeated,
              playerStats: newState.player.stats,
              skills: newState.player.skills,
              magics: newState.player.magics,
              earnedXp,
              isStageClear: cleared,
              isHintMode: hintMode,
            });
            if (cleared && !hintMode && onLessonStageClear) {
              onLessonStageClear();
            }
            if (cleared && !hintMode && onMissionStageClear) {
              onMissionStageClear();
            }
            if (!cleared) {
              newState.wave.waveFailedReason = 'quota_failed';
            }
            return newState;
          }
          }
        } else {
          // フリープレイ: WAVEチェック
          const waveElapsedTime = newState.elapsedTime - newState.wave.waveStartTime;
          
          if (newState.wave.waveKills >= newState.wave.waveQuota && !newState.wave.waveCompleted) {
            newState.wave = { ...newState.wave, waveCompleted: true };
          }
          
          if (waveElapsedTime >= WAVE_DURATION) {
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
        }

        // HPゲームオーバー判定
        const scenarioInvincible =
          scenarioOverridesRef.current.isActive
          && scenarioOverridesRef.current.playerInvincible;
        if (newState.player.stats.hp <= 0 && !scenarioInvincible) {
          if (
            scenarioOverridesRef.current.isActive
            && scenarioOverridesRef.current.disableResultScreen
          ) {
            newState.player.stats.hp = Math.max(1, newState.player.stats.hp);
          } else {
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
        }
        
        return newState;
      });
      
      // 衝撃波エフェクトの更新（対象がある場合のみ setState）
      const newShockwaves = pendingShockwavesRef.current;
      if (newShockwaves.length > 0) pendingShockwavesRef.current = [];
      if (newShockwaves.length > 0 || shockwavesCountRef.current > 0) {
        setShockwaves(sw => {
          const now = Date.now();
          const active = sw.filter(s => now - s.startTime < s.duration);
          if (newShockwaves.length === 0 && active.length === sw.length) return sw;
          return newShockwaves.length > 0 ? [...active, ...newShockwaves] : active;
        });
      }

      // 雷エフェクトの更新（対象がある場合のみ setState）
      if (lightningEffectsCountRef.current > 0) {
        setLightningEffects(le => {
          const now = Date.now();
          const active = le.filter(l => now - l.startTime < l.duration);
          return active.length === le.length ? le : active;
        });
      }

      // スキル通知の更新（2秒後に消える。対象がある場合のみ setState）
      const SKILL_NOTIFICATION_DURATION = 2000;
      if (skillNotificationsCountRef.current > 0) {
        setSkillNotifications(sn => {
          const now = Date.now();
          const active = sn.filter(n => now - n.startTime < SKILL_NOTIFICATION_DURATION);
          return active.length === sn.length ? sn : active;
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, config, isBossStage, isProgressionStage, advanceProgressionPair, hintMode, stageKillQuota, beginnerAssistActive, onLessonStageClear, onMissionStageClear, perfHudEnabled, jajiiEnabled]);
  
  // リトライ
  const handleRetry = useCallback(() => {
    setResult(null);
    setShockwaves([]);
    pendingShockwavesRef.current = [];
    jajiiStateRef.current = null;
    jajiiWorldPosRef.current = null;
    pendingMultiHitCallbacksRef.current = [];
    setLightningEffects([]);
    setSkillNotifications([]);
    setLevelUpCorrectNotes(emptyCorrectNotes());
    stagePowerUpTriggeredRef.current = false;
    bossBattleRef.current = null;
    const initial = createInitialGameState(difficulty, config, isStageMode);
    if (isPhraseMode && !isBossStage) {
      initial.player.stats.hp = 1000;
      initial.player.stats.maxHp = 1000;
      for (let si = 0; si < 4; si += 1) {
        initial.codeSlots.current[si].isEnabled = false;
        initial.codeSlots.next[si].isEnabled = false;
      }
    }
    if (isBossStage) {
      const bossPlayerMaxHp = resolveBossPlayerMaxHp(isPhraseMode);
      initial.player.stats.hp = bossPlayerMaxHp;
      initial.player.stats.maxHp = bossPlayerMaxHp;
      initial.codeSlots.current[2].isEnabled = false;
      initial.codeSlots.current[3].isEnabled = false;
      initial.codeSlots.next[2].isEnabled = false;
      initial.codeSlots.next[3].isEnabled = false;
    }
    // ステージモード: HINTモードなら永続ヒントエフェクト付与
    if (isStageMode && hintMode) {
      initial.player.statusEffects = [
        ...initial.player.statusEffects,
        { type: 'hint' as never, duration: 999999, startTime: Date.now(), level: 1 },
      ];
    }
    if (isPhraseMode && phraseDefinitionRef.current) {
      phraseStateRef.current = createInitialPhraseState(phraseDefinitionRef.current);
      setPhraseUiTick((t) => t + 1);
      setPhraseBgmReadyTick((t) => t + 1);
    }
    // キャラクター能力を再適用（ステージモードではスキップ）
    if (character && !isStageMode) {
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
    // ボス戦では背水の陣を強制的に無効化（HPが1000固定で常時発動してしまうため）
    if (isBossStage) {
      initial.player.skills.haisuiNoJin = false;
      initial.player.skills.alwaysHaisuiNoJin = false;
    }
    setGameState(initial);
    startGame();
  }, [difficulty, config, startGame, debugSettings, isStageMode, isBossStage, character, hintMode]);
  
  // ヒントスロット追跡（ローテーション用）
  const lastHintSlotRef = useRef<number>(0);
  const lastCompletedSlotRef = useRef<number | null>(null);
  
  // ヒントスロット判定（A/B列を交互に表示）
  const getHintSlotIndex = (): number | null => {
    if (!shouldShowKeyboardHints && !gameState.player.statusEffects.some(e => e.type === 'hint')) {
      return null;
    }
    
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

  const progressionPunchSlot = gameState.codeSlots.current[1];
  const progressionStaffCorrectNotesSig = progressionPunchSlot.correctNotes.join(',');

  const progressionStaffVoicingNamesSig =
    progressionPunchSlot.chord?.progressionStaffVoicingNames?.join('|') ?? '';

  const playerHasHintBuff =
    gameState.player.statusEffects.some(effect => effect.type === 'hint');

  const phraseStaffProps = useMemo(() => {
    void phraseUiTick;
    const state = phraseStateRef.current;
    if (!isPhraseMode || !state) return null;
    const { current, next } = getPhraseDisplayChords(state);
    return {
      currentChord: current,
      nextChord: next,
      keyFifths: state.phrase.keyFifths,
      correctNoteIndices: state.correctNoteIndices,
      revealedNoteIndices: state.revealedNoteIndices,
      targetNoteIndex: state.targetNoteIndex,
      hintMode: hintMode || beginnerAssistActive,
    };
  }, [isPhraseMode, phraseUiTick, hintMode, beginnerAssistActive]);

  const scenarioPhraseStaff = useMemo(() => {
    void scenarioUiTick;
    const sc = scenarioOverridesRef.current;
    if (!scenarioMode || !sc.isActive || sc.hideStaff || sc.staffMode !== 'phrase') {
      return null;
    }
    const chord = scenarioPhraseChordRef.current;
    if (!chord) return null;
    const phraseChord = chordToPhraseChord(chord, 0);
    const slot = gameState.codeSlots.current[1];
    const correctSet = new Set(slot.correctNotes);
    const revealedSet = new Set(slot.correctNotes);
    let targetNoteIndex = 0;
    for (let i = 0; i < phraseChord.notes.length; i += 1) {
      if (!correctSet.has(phraseChord.notes[i].pitchClass)) {
        targetNoteIndex = i;
        break;
      }
    }
    return {
      currentChord: phraseChord,
      nextChord: null,
      keyFifths: chord.progressionStaffKeyFifths ?? 0,
      correctNoteIndices: correctSet,
      revealedNoteIndices: revealedSet,
      targetNoteIndex,
      hintMode: true,
    };
  }, [scenarioMode, scenarioUiTick, gameState.codeSlots.current[1].correctNotes]);

  const scenarioProgressionStaff = useMemo((): SurvivalProgressionStaffSnapshot | null => {
    void scenarioUiTick;
    const sc = scenarioOverridesRef.current;
    if (!scenarioMode || !sc.isActive || sc.hideStaff || sc.staffMode !== 'progression') return null;

    const slot = gameState.codeSlots.current[1];
    const ch = slot.chord;
    if (!slot.isEnabled || !ch) return null;

    const names = ch.progressionStaffVoicingNames;
    const kf = ch.progressionStaffKeyFifths;

    if (!names || names.length === 0 || typeof kf !== 'number') return null;

    const staves = ch.progressionStaffVoicingStaves;
    const snapshot: SurvivalProgressionStaffSnapshot = {
      voicingNames: names,
      keyFifths: kf,
      correctPitchClasses: slot.correctNotes,
      chordDisplayName: ch.displayName,
      staffClef: sc.scenarioStaffClef === 1 ? 'treble' : 'bass',
    };
    if (staves && staves.length === names.length) {
      return { ...snapshot, voicingStaves: staves };
    }
    return snapshot;
  }, [
    scenarioMode,
    scenarioUiTick,
    gameState.codeSlots.current[1].correctNotes,
    gameState.codeSlots.current[1].isEnabled,
    gameState.codeSlots.current[1].chord?.id,
    gameState.codeSlots.current[1].chord?.progressionStaffVoicingNames,
  ]);

  const scenarioUi = useMemo(() => {
    void scenarioUiTick;
    return scenarioOverridesRef.current;
  }, [scenarioUiTick]);

  const scenarioHideHp =
    scenarioMode && scenarioUi.isActive && scenarioUi.hidePlayerHpBar;
  const scenarioHideHud =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideHud;
  const scenarioHideTimer =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideTimerDisplay;
  const scenarioHideKill =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideKillCounter;
  const scenarioHidePause =
    scenarioMode && scenarioUi.isActive && scenarioUi.hidePauseButton;
  const scenarioHideHintBadge =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideHintBadge;
  const scenarioHideComboBadge =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideComboBadge;
  const scenarioHideChordPadOverlay =
    scenarioMode && scenarioUi.isActive && scenarioUi.hideChordPad;

  useEffect(() => {
    if (scenarioHideChordPadOverlay) return;
    const el = gameAreaRef.current;
    const renderer = pixiRendererRef.current;
    if (!el || !renderer) return;

    const syncPianoSize = (): void => {
      const width = Math.max(1, el.clientWidth || window.innerWidth);
      const height = survivalPianoHeightRef.current;
      renderer.resize(width, height);
      renderer.updateSettings({
        pianoHeight: height,
        showHitLine: false,
      });
    };

    syncPianoSize();
    const ro = new ResizeObserver(syncPianoSize);
    ro.observe(el);
    const rafId = requestAnimationFrame(syncPianoSize);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [scenarioHideChordPadOverlay, embeddedFullHeight, survivalTutorialLayout]);

  const elapsedSecondsFloor = Math.floor(gameState.elapsedTime);

  const survivalCenterStaffUnpressedNoteOpacity = useMemo(
    () => computeUnpressedNoteOpacity(elapsedSecondsFloor, {
      hintMode,
      hintBuffActive: playerHasHintBuff,
      beginnerAssistActive,
      isStageMode,
      isPlaying: gameState.isPlaying,
      isGameOver: gameState.isGameOver,
    }),
    [
      elapsedSecondsFloor,
      hintMode,
      playerHasHintBuff,
      beginnerAssistActive,
      isStageMode,
      gameState.isPlaying,
      gameState.isGameOver,
    ],
  );

  const progressionStaffSnapshot = useMemo((): SurvivalProgressionStaffSnapshot | null => {
    void scenarioUiTick;
    if (isPhraseMode) return null;
    const sc = scenarioOverridesRef.current;
    if (
      scenarioMode
      && sc.isActive
      && (sc.hideStaff || sc.staffMode === 'phrase' || sc.staffMode === 'progression')
    ) {
      return null;
    }
    if (!isProgressionStage) return null;
    if (!(isStageMode || hintMode || playerHasHintBuff)) return null;

    const slot = progressionPunchSlot;
    const ch = slot.chord;

    if (!slot.isEnabled || !ch || ch.quality !== 'progression') return null;

    const names = ch.progressionStaffVoicingNames;
    const kf = ch.progressionStaffKeyFifths;

    if (!names || names.length === 0 || typeof kf !== 'number') return null;

    const staves = ch.progressionStaffVoicingStaves;
    const base: SurvivalProgressionStaffSnapshot = {
      voicingNames: names,
      keyFifths: kf,
      correctPitchClasses: slot.correctNotes,
      chordDisplayName: ch.displayName,
      staffClef: 'bass',
    };
    if (staves && staves.length === names.length) {
      return { ...base, voicingStaves: staves };
    }
    return base;
  }, [
    isStageMode,
    hintMode,
    playerHasHintBuff,
    isProgressionStage,
    progressionPunchSlot.isEnabled,
    progressionStaffCorrectNotesSig,
    progressionPunchSlot.chord?.id,
    progressionPunchSlot.chord?.displayName,
    progressionStaffVoicingNamesSig,
    progressionPunchSlot.chord?.progressionStaffKeyFifths,
    progressionPunchSlot.chord?.quality,
    progressionPunchSlot.chord?.progressionStaffVoicingStaves,
    scenarioUiTick,
    scenarioMode,
  ]);

  const randomPunchStaffSnapshot = useMemo((): SurvivalProgressionStaffSnapshot | null => {
    void scenarioUiTick;
    if (isPhraseMode) return null;
    if (isProgressionStage) return null;
    const scRand = scenarioOverridesRef.current;
    if (
      scenarioMode
      && scRand.isActive
      && (scRand.hideStaff || scRand.staffMode === 'phrase' || scRand.staffMode === 'progression')
    ) {
      return null;
    }
    if (!(isStageMode || hintMode || playerHasHintBuff)) return null;

    const slot = progressionPunchSlot;
    const ch = slot.chord;
    if (!slot.isEnabled || !ch || ch.quality === 'progression') return null;

    const tutNames = ch.progressionStaffVoicingNames;
    const tutKf = ch.progressionStaffKeyFifths;

    const survivalQuestion = parseSurvivalQuestionId(ch.id);
    const typeLabel = survivalQuestion
      ? (isEnglishCopy
          ? (stageDefinition?.chordDisplayNameEn || ch.displayName)
          : (stageDefinition?.chordDisplayName || ch.displayName))
      : ch.displayName;

    if (tutNames && tutNames.length > 0 && typeof tutKf === 'number') {
      const staves = ch.progressionStaffVoicingStaves;
      const baseRand: SurvivalProgressionStaffSnapshot = {
        voicingNames: tutNames,
        keyFifths: tutKf,
        correctPitchClasses: slot.correctNotes,
        chordDisplayName: typeLabel,
        rootDisplayName: survivalQuestion ? ch.root : undefined,
        staffClef: 'treble',
      };
      if (staves && staves.length === tutNames.length) {
        return { ...baseRand, voicingStaves: staves };
      }
      return baseRand;
    }

    const built = buildSurvivalRandomHintStaffVoicing(ch.id);
    if (!built) return null;

    const typeLabelResolved = survivalQuestion
      ? (isEnglishCopy
          ? (stageDefinition?.chordDisplayNameEn || ch.displayName)
          : (stageDefinition?.chordDisplayName || ch.displayName))
      : ch.displayName;

    return {
      voicingNames: built.voicingNames,
      keyFifths: built.keyFifths,
      correctPitchClasses: slot.correctNotes,
      chordDisplayName: typeLabelResolved,
      rootDisplayName: survivalQuestion ? ch.root : undefined,
      staffClef: 'treble',
    };
  }, [
    isStageMode,
    hintMode,
    playerHasHintBuff,
    isProgressionStage,
    isEnglishCopy,
    stageDefinition?.chordDisplayName,
    stageDefinition?.chordDisplayNameEn,
    progressionPunchSlot.isEnabled,
    progressionStaffCorrectNotesSig,
    progressionPunchSlot.chord?.id,
    progressionPunchSlot.chord?.displayName,
    progressionPunchSlot.chord?.quality,
    progressionPunchSlot.chord?.root,
    scenarioUiTick,
    scenarioMode,
  ]);

  const punchStaffSnapshot = progressionStaffSnapshot ?? randomPunchStaffSnapshot;

  const survivalStaffOverlayTopPadding = isBossStage
    ? 'pt-[calc(max(4px,env(safe-area-inset-top))+80px)]'
    : 'pt-[calc(max(4px,env(safe-area-inset-top))+52px)]';
  
  // フレーズモード: HINT / 第一ブロックアシスト時は判定対象音をオレンジハイライト
  useEffect(() => {
    if (
      scenarioMode
      && scenarioOverridesRef.current.isActive
      && scenarioOverridesRef.current.hideStaff
    ) {
      pixiRendererRef.current?.clearVoicingHints();
      return undefined;
    }

    if (isPhraseMode) {
      if (!shouldShowKeyboardHints) {
        pixiRendererRef.current?.clearVoicingHints();
        return undefined;
      }
      const renderer = pixiRendererRef.current;
      const targetMidi = phraseStateRef.current ? getPhraseTargetMidi(phraseStateRef.current) : null;
      if (!renderer || targetMidi === null) {
        pixiRendererRef.current?.clearVoicingHints();
        return undefined;
      }
      renderer.setVoicingHints([targetMidi], []);
      return undefined;
    }

    if (!shouldShowKeyboardHints) {
      pixiRendererRef.current?.clearVoicingHints();
      return undefined;
    }

    const hintSlotIndex = getHintSlotIndex();
    const renderer = pixiRendererRef.current;

    if (hintSlotIndex === null || renderer === null) {
      pixiRendererRef.current?.clearVoicingHints();
      return;
    }

    const slot = gameState.codeSlots.current[hintSlotIndex];
    const notes = slot.chord?.notes;
    if (!notes || notes.length === 0) {
      renderer.clearVoicingHints();
      return;
    }

    const pendingMidi: number[] = [];
    const completedMidi: number[] = [];
    const useExactChordMidis =
      scenarioMode
      && scenarioOverridesRef.current.isActive
      && scenarioOverridesRef.current.useChordMidiNotesForHintHighlights;

    if (useExactChordMidis) {
      for (let i = 0; i < notes.length; i += 1) {
        const midiNote = notes[i];
        const noteMod12 = ((midiNote % 12) + 12) % 12;
        if (slot.correctNotes.includes(noteMod12)) {
          completedMidi.push(midiNote);
        } else {
          pendingMidi.push(midiNote);
        }
      }
    } else {
      const baseOctave = 4;

      const uniqueNoteMod12 = [...new Set(notes.map((n) => ((n % 12) + 12) % 12))];

      let lastMidi = 0;
      for (let i = 0; i < uniqueNoteMod12.length; i += 1) {
        const noteMod12 = uniqueNoteMod12[i];
        let midiNote = noteMod12 + baseOctave * 12;
        while (midiNote <= lastMidi) {
          midiNote += 12;
        }
        lastMidi = midiNote;
        if (slot.correctNotes.includes(noteMod12)) {
          completedMidi.push(midiNote);
        } else {
          pendingMidi.push(midiNote);
        }
      }
    }

    renderer.setVoicingHints(pendingMidi, completedMidi);

    return undefined;
  }, [isPhraseMode, shouldShowKeyboardHints, phraseUiTick, scenarioMode, scenarioUiTick, gameState.player.statusEffects, gameState.codeSlots.current]);
  
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
    const rawWidth = gameAreaRef.current?.clientWidth ?? window.innerWidth;
    const gameAreaWidth = Math.max(1, rawWidth);
    const adjustedThreshold = 1100;
    const VISIBLE_WHITE_KEYS = 14;
    const TOTAL_WHITE_KEYS = 52;
    // iOS ネイティブでは画面が広くても全鍵を1画面に詰めると鍵が細すぎるため、横スクロールを優先する
    const forceScrollOnIos = isIOSWebView() && gameAreaWidth < 1400;

    if (gameAreaWidth >= adjustedThreshold && !forceScrollOnIos) {
      return { width: gameAreaWidth, needsScroll: false };
    }
    const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
    return { width: Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth), needsScroll: true };
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-b from-gray-900 via-purple-900 to-black flex flex-col fantasy-game-screen',
        embeddedFullHeight && survivalTutorialLayout
          ? 'h-full min-h-0 flex-1 overflow-hidden'
          : embeddedFullHeight
            ? 'flex-1 min-h-0 overflow-hidden'
            : 'min-h-[var(--dvh,100dvh)]',
        isIOSWebView() && 'overflow-x-hidden max-w-full ios-no-backdrop-blur'
      )}
    >
      {/* 性能計測 HUD（iOS URL param ?perfHud=true でのみ表示） */}
      {perfHudEnabled && (
        <div className="fixed top-2 right-2 z-[60] px-2 py-1 rounded bg-black/60 text-green-300 font-mono text-[10px] pointer-events-none tabular-nums">
          {perfHud.fps} fps
        </div>
      )}

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
      
      {/* スキル取得通知（オート選択・手動選択・キャラボーナス） */}
      {skillNotifications.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
          {skillNotifications.map((notification, index) => {
            // opacity フェードは CSS アニメーション（survival-skill-notify-fade）に委譲し、
            // gameLoop 由来の再レンダーで毎回 Date.now() が再計算されるのを避ける。
            const yOffset = index * 50;

            return (
              <div
                key={notification.id}
                className="survival-skill-notify bg-gradient-to-r from-yellow-600/90 to-amber-600/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-400/50 shadow-lg animate-bounce"
                style={{
                  transform: `translateY(${yOffset}px)`,
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
      
      {/* メインゲームエリア（Canvasが全高さ・ヘッダーはCanvas上にオーバーレイ） */}
      <div
        className={cn(
          'flex-1 flex flex-col items-center relative min-h-0 w-full max-w-full',
          embeddedFullHeight && !survivalTutorialLayout ? 'justify-start gap-1 px-2' : 'justify-center gap-2 px-4'
        )}
      >
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
            {!isProgressionStage && (
              <button
                onClick={() => handleTapSkillActivation(0)}
                className="w-16 h-16 bg-blue-600/80 hover:bg-blue-500 rounded-lg font-bold text-white text-xl shadow-lg border-2 border-blue-400 active:scale-95 transition-transform"
              >
                🔫 Shot
              </button>
            )}
            <button
              onClick={() => handleTapSkillActivation(1)}
              className="w-16 h-16 bg-orange-600/80 hover:bg-orange-500 rounded-lg font-bold text-white text-xl shadow-lg border-2 border-orange-400 active:scale-95 transition-transform"
            >
              👊 Punch
            </button>
            {!isProgressionStage && (
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
                🪄 Magic
              </button>
            )}
          </div>
        )}
        
        {/* Canvasエリア（全高さ占有・ヘッダーはCanvas上にオーバーレイで配置） */}
        <div
          ref={canvasWrapperRef}
          className={cn(
            'flex-1 min-h-0 w-full relative overflow-hidden touch-none flex items-center justify-center',
            survivalTutorialLayout
              ? 'rounded-none border-0'
              : 'rounded-xl border-2 border-gray-700',
          )}
        >
          {/* ヘッダー（ゲーム画面上部にオーバーレイ・レイアウトを圧迫しない・safe-area対応） */}
          {!scenarioHideHud ? (
          <div className="absolute top-0 left-0 right-0 z-10 px-2 pt-[max(4px,env(safe-area-inset-top))] pb-1 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
            {/* ボス戦 HP バー（画面最上部） */}
            {isBossStage && bossBattleRef.current && (
              <div className="flex flex-col gap-0.5 mb-1">
                <div className="flex justify-end items-center text-[10px] md:text-xs font-sans">
                  <span className="text-white tabular-nums shrink-0">
                    {Math.floor(bossBattleRef.current.boss.hp)}/{bossBattleRef.current.boss.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 md:h-2.5 bg-gray-800/80 rounded-full overflow-hidden border border-red-900/70">
                  <div
                    className="h-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400"
                    style={{ width: `${Math.max(0, (bossBattleRef.current.boss.hp / bossBattleRef.current.boss.maxHp) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {!isStageMode && (
                <div className="w-full h-1 md:h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${(gameState.player.exp / gameState.player.expToNextLevel) * 100}%` }}
                  />
                </div>
              )}
              <div className="flex justify-between items-center gap-1 flex-nowrap">
                <div className="flex items-center gap-1 md:gap-2 text-white font-sans text-[10px] md:text-sm min-w-0">
                  {!isStageMode && (
                    <span className="bg-yellow-600/60 px-1 py-0.5 rounded font-bold text-yellow-200 shrink-0">W{gameState.wave.currentWave}</span>
                  )}
                  {isBossStage ? (
                    <span className="font-bold shrink-0 text-white">{formatTime(gameState.elapsedTime)}</span>
                  ) : isStageMode && !scenarioHideTimer ? (
                    <span className={cn('font-bold shrink-0', Math.max(0, STAGE_TIME_LIMIT_SECONDS - gameState.elapsedTime) < 30 ? 'text-red-400' : 'text-white')}>
                      {formatTime(Math.max(0, STAGE_TIME_LIMIT_SECONDS - gameState.elapsedTime))}
                    </span>
                  ) : isStageMode && scenarioHideTimer ? null : (
                    <span className="font-bold shrink-0">{formatTime(gameState.elapsedTime)}</span>
                  )}
                  {!isStageMode && <span className="shrink-0">Lv.{gameState.player.level}</span>}
                  {isStageMode && hintMode && !scenarioHideHintBadge && (
                    <span className="bg-yellow-500/60 px-1 py-0.5 rounded font-bold text-yellow-200 shrink-0 text-[9px]">HINT</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] md:text-xs shrink-0">
                  {isBossStage ? null : isStageMode && !scenarioHideKill ? (
                    <span className={cn('font-bold', gameState.enemiesDefeated >= stageKillQuota ? 'text-green-400' : 'text-white')}>
                      {gameState.enemiesDefeated}/{stageKillQuota}
                    </span>
                  ) : isStageMode && scenarioHideKill ? null : (
                    <>
                      <span className={cn('font-bold', gameState.wave.waveKills >= gameState.wave.waveQuota ? 'text-green-400' : (gameState.elapsedTime - gameState.wave.waveStartTime) > WAVE_DURATION * 0.7 ? 'text-red-400' : 'text-white')}>
                        {Math.max(0, gameState.wave.waveQuota - gameState.wave.waveKills)}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className={cn('font-bold', (WAVE_DURATION - (gameState.elapsedTime - gameState.wave.waveStartTime)) < 30 ? 'text-red-400' : 'text-white')}>
                        {formatTime(Math.max(0, WAVE_DURATION - (gameState.elapsedTime - gameState.wave.waveStartTime)))}
                      </span>
                    </>
                  )}
                </div>
                {!scenarioHideHp ? (
                <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                  <span className="text-[10px]">❤️</span>
                  <div className="w-10 md:w-16 h-1.5 md:h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full',
                        gameState.player.stats.hp / gameState.player.stats.maxHp > 0.5 ? 'bg-green-500' :
                        gameState.player.stats.hp / gameState.player.stats.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${(gameState.player.stats.hp / gameState.player.stats.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-sans text-[10px] md:text-xs tabular-nums">{Math.floor(gameState.player.stats.hp)}/{gameState.player.stats.maxHp}</span>
                </div>
                ) : null}
                {!scenarioHidePause ? (
                <div className="flex gap-0.5 shrink-0 pointer-events-auto">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setGameState(prev => ({ ...prev, isPaused: true }));
                    }}
                    className="p-1.5 min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center bg-gray-700/90 hover:bg-gray-600 rounded text-white touch-manipulation"
                    title={isEnglishCopy ? 'Settings' : '設定'}
                    aria-label={isEnglishCopy ? 'Settings' : '設定'}
                  >
                    <span className="text-sm md:text-base">⚙️</span>
                  </button>
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
                    className="p-1.5 min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center bg-gray-700/90 hover:bg-gray-600 rounded text-white touch-manipulation"
                    aria-label={gameState.isPaused ? (isEnglishCopy ? 'Resume' : '再開') : (isEnglishCopy ? 'Pause' : '一時停止')}
                  >
                    <span className="text-sm md:text-base">{gameState.isPaused ? '▶️' : '⏸️'}</span>
                  </button>
                </div>
                ) : null}
              </div>
            </div>
          </div>
          ) : null}
          <SurvivalCanvas
            gameState={gameState}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            contentScale={isMobile ? (viewportSize.width >= 768 ? 0.95 : 0.75) : 1}
            shockwaves={shockwaves}
            lightningEffects={lightningEffects}
            bossBattle={bossBattleRef.current}
            bossUiTick={bossUiTick}
            hideComboGauge={isPhraseMode || scenarioHideComboBadge}
            hidePlayerHintStatusIcon={scenarioHideHintBadge}
            jajiiWorldPosRef={jajiiWorldPosRef}
            jajiiBubbleText={timedJajiiBubbleLine}
            jajiiSpeechSegmentsRef={tutorialJajiiSpeechSegmentsRef}
            faiBubbleText={timedFaiBubbleCharacterLine}
          />
          {gameState.comboCount > 0 && gameState.isPlaying && !gameState.isGameOver && !scenarioHideComboBadge && (
            <div
              className="absolute right-4 bottom-[140px] z-[8] pointer-events-none flex items-center gap-1 rounded-full border border-yellow-500/60 bg-black/55 px-2 py-0.5 font-sans tabular-nums"
              aria-live="polite"
              aria-label={`コンボ ${gameState.comboCount}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-200 md:text-xs">
                COMBO
              </span>
              <span className="text-sm font-extrabold text-yellow-300 md:text-base">
                {gameState.comboCount}
              </span>
            </div>
          )}
          {/* コードスロットは非表示。中央に楽譜オーバーレイのみ */}
          {scenarioPhraseStaff &&
            gameState.isPlaying &&
            !gameState.isGameOver && (
              <div
                className={cn(
                  'absolute inset-0 z-[5] flex items-start justify-center px-3 pointer-events-none',
                  survivalStaffOverlayTopPadding,
                )}
                aria-hidden
              >
                <SurvivalPhraseStaff
                  currentChord={scenarioPhraseStaff.currentChord}
                  nextChord={scenarioPhraseStaff.nextChord}
                  keyFifths={scenarioPhraseStaff.keyFifths}
                  correctNoteIndices={scenarioPhraseStaff.correctNoteIndices}
                  revealedNoteIndices={scenarioPhraseStaff.revealedNoteIndices}
                  targetNoteIndex={scenarioPhraseStaff.targetNoteIndex}
                  hintMode={scenarioPhraseStaff.hintMode}
                  unpressedNoteOpacity={survivalCenterStaffUnpressedNoteOpacity}
                  className="max-w-[min(520px,92vw)] md:max-w-[min(620px,90vw)]"
                />
              </div>
            )}
          {scenarioProgressionStaff &&
            gameState.isPlaying &&
            !gameState.isGameOver && (
              <div
                className={cn(
                  'absolute inset-0 z-[5] flex items-start justify-center px-3 pointer-events-none',
                  survivalStaffOverlayTopPadding,
                )}
                aria-hidden
              >
                {survivalTutorialLayout && scenarioMode ? (
                  <SurvivalTutorialStaffBackdrop>
                    <SurvivalProgressionStaff
                      chordDisplayName={scenarioProgressionStaff.chordDisplayName}
                      voicingNames={scenarioProgressionStaff.voicingNames}
                      voicingStaves={scenarioProgressionStaff.voicingStaves}
                      keyFifths={scenarioProgressionStaff.keyFifths}
                      correctPitchClasses={scenarioProgressionStaff.correctPitchClasses}
                      staffClef={scenarioProgressionStaff.staffClef ?? 'treble'}
                      unpressedNoteOpacity={survivalCenterStaffUnpressedNoteOpacity}
                      className="max-w-[min(420px,78vw)] md:max-w-[min(440px,75vw)]"
                    />
                  </SurvivalTutorialStaffBackdrop>
                ) : (
                  <SurvivalProgressionStaff
                    chordDisplayName={scenarioProgressionStaff.chordDisplayName}
                    voicingNames={scenarioProgressionStaff.voicingNames}
                    voicingStaves={scenarioProgressionStaff.voicingStaves}
                    keyFifths={scenarioProgressionStaff.keyFifths}
                    correctPitchClasses={scenarioProgressionStaff.correctPitchClasses}
                    staffClef={scenarioProgressionStaff.staffClef ?? 'treble'}
                    unpressedNoteOpacity={survivalCenterStaffUnpressedNoteOpacity}
                    className="max-w-[min(420px,78vw)] md:max-w-[min(440px,75vw)]"
                  />
                )}
              </div>
            )}
          {phraseStaffProps &&
            gameState.isPlaying &&
            !gameState.isGameOver &&
            !(scenarioMode && scenarioUi.hideStaff) && (
              <div
                className={cn(
                  'absolute inset-0 z-[5] flex items-start justify-center px-3 pointer-events-none',
                  survivalStaffOverlayTopPadding,
                )}
                aria-hidden
              >
                <SurvivalPhraseStaff
                  currentChord={phraseStaffProps.currentChord}
                  nextChord={phraseStaffProps.nextChord}
                  keyFifths={phraseStaffProps.keyFifths}
                  correctNoteIndices={phraseStaffProps.correctNoteIndices}
                  revealedNoteIndices={phraseStaffProps.revealedNoteIndices}
                  targetNoteIndex={phraseStaffProps.targetNoteIndex}
                  hintMode={phraseStaffProps.hintMode}
                  unpressedNoteOpacity={survivalCenterStaffUnpressedNoteOpacity}
                  className="max-w-[min(520px,92vw)] md:max-w-[min(620px,90vw)]"
                />
              </div>
            )}
          {!isPhraseMode &&
            punchStaffSnapshot &&
            punchStaffSnapshot.voicingNames.length > 0 &&
            !(scenarioMode &&
              scenarioUi.isActive &&
              (scenarioUi.hideStaff ||
                scenarioUi.staffMode === 'phrase' ||
                scenarioUi.staffMode === 'progression')) &&
            gameState.isPlaying &&
            !gameState.isGameOver && (
              <div
                className={cn(
                  'absolute inset-0 z-[5] flex items-start justify-center px-3 pointer-events-none',
                  survivalStaffOverlayTopPadding,
                )}
                aria-hidden
              >
                <SurvivalProgressionStaff
                  chordDisplayName={punchStaffSnapshot.chordDisplayName}
                  rootDisplayName={punchStaffSnapshot.rootDisplayName}
                  voicingNames={punchStaffSnapshot.voicingNames}
                  keyFifths={punchStaffSnapshot.keyFifths}
                  correctPitchClasses={punchStaffSnapshot.correctPitchClasses}
                  unpressedNoteOpacity={survivalCenterStaffUnpressedNoteOpacity}
                  staffClef={punchStaffSnapshot.staffClef ?? 'bass'}
                  className="max-w-[min(360px,78vw)] md:max-w-[min(400px,75vw)]"
                />
              </div>
            )}
          
          {/* ポーズ画面（全画面モーダル・PAUSEDを確実に表示） */}
          {gameState.isPaused && (
            <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-start pt-[max(1rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] overflow-y-auto">
              <div className="text-center w-full max-w-md px-4 py-4 flex-shrink-0">
                <div className="text-3xl md:text-4xl font-bold text-white font-sans mb-3">PAUSED</div>
                
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
                      <span className="text-blue-400 font-sans">🔫 Shot ATK</span>
                      <span className="text-white font-sans">{gameState.player.stats.aAtk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-400 font-sans">👊 Punch ATK</span>
                      <span className="text-white font-sans">{gameState.player.stats.bAtk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-400 font-sans">🔮 Magic ATK</span>
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
                      <span className="text-blue-300 font-sans">💎 {isEnglishCopy ? 'Shot Bullets' : 'Shot弾数'}</span>
                      <span className="text-white font-sans">{gameState.player.stats.aBulletCount}</span>
                    </div>
                  </div>
                  
                  {/* 特殊スキル */}
                  {(() => {
                    const sk = gameState.player.skills;
                    const activeSkills: string[] = [];
                    if (sk.aPenetration) activeSkills.push(isEnglishCopy ? '🔫 Penetrate' : '🔫 貫通');
                    if (sk.bKnockbackBonus > 0) activeSkills.push(isEnglishCopy ? `👊 KB+${sk.bKnockbackBonus}` : `👊 ノックバック+${sk.bKnockbackBonus}`);
                    if (sk.bRangeBonus > 0) activeSkills.push(isEnglishCopy ? `👊 Range+${sk.bRangeBonus}` : `👊 範囲+${sk.bRangeBonus}`);
                    if (sk.bDeflect) activeSkills.push(isEnglishCopy ? '👊 Deflect' : '👊 弾消去');
                    if (sk.multiHitLevel > 0) activeSkills.push(isEnglishCopy ? `⚔️ Multi Lv${sk.multiHitLevel}` : `⚔️ 多段Lv${sk.multiHitLevel}`);
                    if (sk.expBonusLevel > 0) activeSkills.push(`✨ EXP+${sk.expBonusLevel}`);
                    if (sk.haisuiNoJin || sk.alwaysHaisuiNoJin) activeSkills.push(isEnglishCopy ? `🔥 L.Stand${sk.alwaysHaisuiNoJin ? '(Always)' : ''}` : `🔥 背水${sk.alwaysHaisuiNoJin ? '(常時)' : ''}`);
                    if (sk.zekkouchou || sk.alwaysZekkouchou) activeSkills.push(isEnglishCopy ? `⭐ Peak${sk.alwaysZekkouchou ? '(Always)' : ''}` : `⭐ 絶好調${sk.alwaysZekkouchou ? '(常時)' : ''}`);
                    if (sk.autoSelect) activeSkills.push(isEnglishCopy ? '🤖 Auto' : '🤖 オート');
                    
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
                
                <div className="flex flex-wrap gap-3 justify-center items-center">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, isPaused: false }))}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-sans text-white"
                  >
                    {isEnglishCopy ? 'Resume' : '再開'}
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-sans text-white flex items-center gap-2"
                  >
                    ⚙️ {isEnglishCopy ? 'Settings' : '設定'}
                  </button>
                  <button
                    onClick={() => {
                      if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                      onBackToSelect();
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-sans text-white"
                  >
                    {isEnglishCopy ? 'Quit' : 'やめる'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ピアノ（PIXINotesRenderer使用） */}
      {!scenarioHideChordPadOverlay &&
      (() => {
        const pianoHeight = survivalPianoHeightRef.current;
        const tutorialPianoInFlow = embeddedFullHeight && survivalTutorialLayout;
        return (
      <div
        ref={gameAreaRef}
        className={cn(
          'bg-black bg-opacity-20 overflow-hidden w-full flex-shrink-0',
          tutorialPianoInFlow
            ? 'relative z-20 mx-0 mb-0 rounded-none pb-[env(safe-area-inset-bottom)]'
            : 'relative mx-2 mb-1 rounded-lg',
        )}
        style={{ height: `${pianoHeight}px` }}
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
                  if (el && !pianoScrollInitializedRef.current) {
                    pianoScrollInitializedRef.current = true;
                    requestAnimationFrame(() => {
                      requestAnimationFrame(centerPianoC4);
                    });
                  }
                }}
              >
                <PIXINotesRenderer
                  width={pixiWidth}
                  height={pianoHeight}
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
                  height={pianoHeight}
                  onReady={handlePixiReady}
                  className="w-full h-full"
                />
              </div>
            );
          }
        })()}
      </div>
    );
  })()}
      
      {/* レベルアップ画面（ステージモードでは非表示） */}
      {!isStageMode && gameState.isLevelingUp && (
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
          stageDefinition={stageDefinition}
          isLessonMode={isLessonMode}
          hintMode={hintMode}
          onRetryWithHint={onRetryWithHint}
          onRetryWithoutHint={onRetryWithoutHint}
          onNextStage={onNextStage}
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
        stageRunMode={
          isStageMode && onSurvivalRunModeRestart
            ? {
                hintMode,
                onApplyHintModeAndRestart: onSurvivalRunModeRestart,
              }
            : undefined
        }
      />
    </div>
  );
};

export default SurvivalGameScreen;
