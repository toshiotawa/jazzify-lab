import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { EarTrainingMode } from '@/types';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
  EarTrainingPlayerQuoteOptions,
  EarTrainingQuotePayload,
} from '@/game/earTraining/types';
import { applyIOSCanvasOptimizations, getEffectiveCanvasDpr } from '@/utils/canvasOptimizations';
import { playFireMagicSe, preloadFireMagicSe } from '@/utils/earTrainingFireMagicSe';
import { playOsmdParrySe, unlockOsmdParrySe } from '@/utils/earTrainingOsmdParrySe';
import {
  earTrainingQuoteSegmentsCacheKey,
  normalizeEarTrainingQuotePayload,
} from '@/utils/earTrainingQuotePayload';
import { PLAYER_QUOTE_FONT_PX } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import {
  clearCharacterMotionTimers,
  createCharacterMotionTimers,
  createCharacterRuntime,
  ensureCharacterAutoMotion,
  isCharacterKnockbackActive,
  shouldRunCharacterAutoMotion,
  syncCharactersFromSnapshot,
} from '@/game/earTraining/canvas/earTrainingBattleCharacterMotion';
import { drawEarTrainingBattle } from '@/game/earTraining/canvas/drawEarTrainingBattle';
import {
  applyEarTrainingBattleImageMap,
  preloadEarTrainingBattleCriticalImages,
  preloadEarTrainingBattleSecondaryImages,
  scheduleEarTrainingBattleDeferredImages,
} from '@/game/earTraining/canvas/earTrainingBattleImagePreload';
import { createCameraRuntime, isCameraActive } from '@/game/earTraining/canvas/earTrainingBattleCamera';
import { getBattleAnchors, resolveStaffReservedBottomY } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import {
  createParryBeatSyncFromSlowPhaseMs,
  PARRY_SLOW_PHASE_MS,
  PARRY_TOTAL_MS,
  type EarTrainingBattleDrawRuntime,
} from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  createOsuCirclePool,
  hasActiveOsuCircles,
  resyncOsuCircleTimings,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCirclePool';
import {
  createOsuCircleShatterPool,
  hasActiveOsuCircleShatter,
} from '@/game/earTraining/canvas/earTrainingBattleOsuCircleShatterPool';
import {
  createParrySparkPool,
  hasActiveParrySparks,
} from '@/game/earTraining/canvas/earTrainingBattleParrySparkPool';
import {
  pruneExpiredEffects,
  scheduleEarTrainingBattleEffect,
  clearParryMotionTimers,
} from '@/game/earTraining/canvas/earTrainingBattleEffectScheduler';

interface EarTrainingBattleCanvasProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
  disableCorrectSe?: boolean;
  battleMode?: EarTrainingMode;
  /** OSMD: 描画フレームごとに最新 phrase タイムライン秒を取得 */
  getPhraseTimelineSec?: () => number | null;
}

const createInitialRuntime = (
  width: number,
  height: number,
  snapshot: EarTrainingBattleSnapshot,
): EarTrainingBattleDrawRuntime => ({
  width,
  height,
  player: createCharacterRuntime('player', width, snapshot),
  enemy: createCharacterRuntime('enemy', width, snapshot),
  enemyAttackGaugePercent: snapshot.enemyAttackGaugePercent,
  playerQuote: { segments: null, fontPx: PLAYER_QUOTE_FONT_PX, showCue: false, cuePhase: 0 },
  partnerQuote: { segments: null, fontPx: PLAYER_QUOTE_FONT_PX, showCue: false, cuePhase: 0 },
  phraseIntro: null,
  floatingTexts: [],
  damageTexts: [],
  effects: [],
  hudHitRegions: [],
  screenFlash: null,
  startButtonPulsePhase: 0,
  loadedImages: new Map(),
  backgroundCache: { width: 0, height: 0, timingCalibrationLayout: false, canvas: null },
  camera: createCameraRuntime(),
  structuralKey: '',
  hudLayoutKey: '',
  phraseSlotKey: '',
  lastEffectId: 0,
  staffReservedBottomY: resolveStaffReservedBottomY(height, width, snapshot.staffBand),
  effectByCommandId: new Map(),
  visualSlow: null,
  parryMotionGeneration: 0,
  parryFinishTimer: null,
  parryMotionEndTimer: null,
  osuCirclePool: createOsuCirclePool(),
  osuCircleShatterPool: createOsuCircleShatterPool(),
  phraseTimelineSec: null,
  chordOsmdBattle: false,
  timingCalibrationLayout: Boolean(snapshot.timingCalibrationLayout),
  lastParryAt: 0,
  parryFinishLocked: false,
  parryBeatSync: createParryBeatSyncFromSlowPhaseMs(PARRY_SLOW_PHASE_MS),
  reflectImpactCallbacks: null,
  parrySparkPool: createParrySparkPool(),
});

const EarTrainingBattleCanvas = forwardRef<EarTrainingBattleSceneHandle, EarTrainingBattleCanvasProps>(({
  snapshot,
  effectCommand,
  callbacks,
  className,
  disableCorrectSe = true,
  battleMode,
  getPhraseTimelineSec,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef(snapshot);
  const callbacksRef = useRef(callbacks);
  const runtimeRef = useRef<EarTrainingBattleDrawRuntime | null>(null);
  const dirtyRef = useRef(true);
  const rafRef = useRef(0);
  const drawFrameRef = useRef<(now: number) => void>(() => undefined);
  const playerTimersRef = useRef(createCharacterMotionTimers());
  const enemyTimersRef = useRef(createCharacterMotionTimers());
  const impactTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const hudHitRegionsRef = useRef<EarTrainingBattleDrawRuntime['hudHitRegions']>([]);
  const deferredImagesScheduledRef = useRef(false);
  const getPhraseTimelineSecRef = useRef(getPhraseTimelineSec);

  snapshotRef.current = snapshot;
  callbacksRef.current = callbacks;
  getPhraseTimelineSecRef.current = getPhraseTimelineSec;

  const scheduleDrawFrame = useCallback(() => {
    if (rafRef.current !== 0) return;
    rafRef.current = requestAnimationFrame((now) => {
      rafRef.current = 0;
      drawFrameRef.current(now);
    });
  }, []);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    scheduleDrawFrame();
  }, [scheduleDrawFrame]);

  const scheduleImpact = useCallback((effectId: number, delayMs: number) => {
    const existing = impactTimersRef.current.get(effectId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      impactTimersRef.current.delete(effectId);
      callbacksRef.current.onEffectImpact(effectId);
    }, delayMs);
    impactTimersRef.current.set(effectId, timer);
  }, []);

  const ensureRuntime = useCallback((width: number, height: number): EarTrainingBattleDrawRuntime => {
    if (!runtimeRef.current) {
      runtimeRef.current = createInitialRuntime(width, height, snapshotRef.current);
    }
    runtimeRef.current.width = width;
    runtimeRef.current.height = height;
    runtimeRef.current.chordOsmdBattle = battleMode === 'chord_osmd';
    runtimeRef.current.timingCalibrationLayout = snapshotRef.current.timingCalibrationLayout === true;
    runtimeRef.current.staffReservedBottomY = resolveStaffReservedBottomY(
      height,
      width,
      snapshotRef.current.timingCalibrationLayout ? undefined : snapshotRef.current.staffBand,
    );
    return runtimeRef.current;
  }, [battleMode]);

  const bindHudHitRegions = useCallback((runtime: EarTrainingBattleDrawRuntime) => {
    runtime.hudHitRegions = runtime.hudHitRegions.map(region => {
      if (region.id === 'settings') {
        return { ...region, onClick: () => callbacksRef.current.onOpenSettings() };
      }
      if (region.id === 'back' || region.id === 'lobbyBack') {
        return { ...region, onClick: () => callbacksRef.current.onBack() };
      }
      if (region.id === 'start') {
        return { ...region, onClick: () => callbacksRef.current.onStart() };
      }
      if (region.id === 'battleMode') {
        return { ...region, onClick: () => callbacksRef.current.onPracticeModeChange(false) };
      }
      if (region.id === 'practiceMode') {
        return { ...region, onClick: () => callbacksRef.current.onPracticeModeChange(true) };
      }
      return region;
    });
    hudHitRegionsRef.current = runtime.hudHitRegions;
  }, []);

  const applySnapshotToRuntime = useCallback((nextSnapshot: EarTrainingBattleSnapshot) => {
    const container = containerRef.current;
    if (!container) return;
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(480, container.clientHeight);
    const runtime = ensureRuntime(width, height);
    runtime.timingCalibrationLayout = nextSnapshot.timingCalibrationLayout === true;
    runtime.staffReservedBottomY = resolveStaffReservedBottomY(
      height,
      width,
      nextSnapshot.timingCalibrationLayout ? undefined : nextSnapshot.staffBand,
    );
    runtime.enemyAttackGaugePercent = nextSnapshot.enemyAttackGaugePercent;
    syncCharactersFromSnapshot(runtime, nextSnapshot, width);

    const introTrimmed = nextSnapshot.phraseIntroLine.trim();
    if (
      !nextSnapshot.showLobbyControls
      && introTrimmed
      && nextSnapshot.totalPhrases > 0
    ) {
      const introKey = `${nextSnapshot.phraseIntroSeq}:${nextSnapshot.phraseIndex}:${nextSnapshot.totalPhrases}`;
      if (!runtime.phraseIntro || runtime.phraseIntro.key !== introKey) {
        runtime.phraseIntro = {
          key: introKey,
          text: introTrimmed,
          emphasis: Boolean(nextSnapshot.phraseIntroEmphasis),
          startedAt: performance.now(),
        };
        markDirty();
      }
    } else if (runtime.phraseIntro) {
      runtime.phraseIntro = null;
    }

    if (shouldRunCharacterAutoMotion(nextSnapshot)) {
      ensureCharacterAutoMotion(
        runtime,
        nextSnapshot,
        width,
        playerTimersRef.current,
        enemyTimersRef.current,
        markDirty,
      );
    } else {
      clearCharacterMotionTimers(playerTimersRef.current);
      clearCharacterMotionTimers(enemyTimersRef.current);
    }
    markDirty();
  }, [ensureRuntime, markDirty]);

  useImperativeHandle(ref, () => ({
    updateSnapshot: (nextSnapshot: EarTrainingBattleSnapshot) => {
      snapshotRef.current = nextSnapshot;
      applySnapshotToRuntime(nextSnapshot);
    },
    setEnemyAttackGaugePercent: (percent: number) => {
      if (!runtimeRef.current) return;
      runtimeRef.current.enemyAttackGaugePercent = percent;
      markDirty();
    },
    triggerEffect: (command: EarTrainingBattleEffectCommand) => {
      const container = containerRef.current;
      if (!container || !runtimeRef.current) return;
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(480, container.clientHeight);
      const runtime = runtimeRef.current;
      const anchors = getBattleAnchors(
        width,
        height,
        runtime.player.x,
        runtime.enemy.x,
        runtime.timingCalibrationLayout,
      );
      scheduleEarTrainingBattleEffect({
        runtime,
        snapshot: snapshotRef.current,
        anchors,
        width,
        height,
        playerTimers: playerTimersRef.current,
        enemyTimers: enemyTimersRef.current,
        onDirty: markDirty,
        onImpact: callbacksRef.current.onEffectImpact,
        scheduleImpact,
      }, command);
    },
    resyncOsuApproachCircles: (updates) => {
      const runtime = runtimeRef.current;
      if (!runtime || !runtime.chordOsmdBattle || updates.length === 0) {
        return;
      }
      if (resyncOsuCircleTimings(runtime.osuCirclePool, updates) > 0) {
        markDirty();
      }
    },
    highlightKey: (_midiNote: number, _active: boolean) => {
      void _midiNote;
      void _active;
    },
    setPlayerQuote: (content: EarTrainingQuotePayload | null, options?: EarTrainingPlayerQuoteOptions) => {
      if (!runtimeRef.current) return;
      const segments = normalizeEarTrainingQuotePayload(content);
      runtimeRef.current.playerQuote = {
        segments,
        fontPx: options?.fontSizePx ?? PLAYER_QUOTE_FONT_PX,
        showCue: options?.showAdvanceCue ?? false,
        cuePhase: 0,
      };
      void earTrainingQuoteSegmentsCacheKey(segments);
      markDirty();
    },
    setPartnerQuote: (content: EarTrainingQuotePayload | null, options?: EarTrainingPlayerQuoteOptions) => {
      if (!runtimeRef.current) return;
      const segments = normalizeEarTrainingQuotePayload(content);
      runtimeRef.current.partnerQuote = {
        segments,
        fontPx: options?.fontSizePx ?? PLAYER_QUOTE_FONT_PX,
        showCue: options?.showAdvanceCue ?? false,
        cuePhase: 0,
      };
      markDirty();
    },
  }), [applySnapshotToRuntime, markDirty, scheduleImpact]);

  useEffect(() => {
    if (battleMode === 'chord_osmd') {
      unlockOsmdParrySe();
      return;
    }
    if (disableCorrectSe) return;
    preloadFireMagicSe();
  }, [battleMode, disableCorrectSe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    deferredImagesScheduledRef.current = false;

    const avatarUrls = [
      snapshot.playerAvatarUrl,
      snapshot.enemyAvatarUrl,
    ];

    void preloadEarTrainingBattleCriticalImages(avatarUrls, battleMode).then((map) => {
      if (cancelled || !runtimeRef.current) {
        return;
      }
      applyEarTrainingBattleImageMap(runtimeRef.current, map, avatarUrls, battleMode);
      markDirty();
      window.requestAnimationFrame(() => markDirty());

      void preloadEarTrainingBattleSecondaryImages(battleMode).then((secondaryMap) => {
        if (cancelled || !runtimeRef.current) {
          return;
        }
        applyEarTrainingBattleImageMap(runtimeRef.current, secondaryMap, [], battleMode);
        markDirty();
        window.requestAnimationFrame(() => markDirty());
      });

      if (deferredImagesScheduledRef.current) {
        return;
      }
      deferredImagesScheduledRef.current = true;
      scheduleEarTrainingBattleDeferredImages(
        runtimeRef.current,
        () => {
          markDirty();
          window.requestAnimationFrame(() => markDirty());
        },
        () => cancelled,
        battleMode,
      );
    });

    const resizeCanvas = (): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(480, container.clientHeight);
      const dpr = getEffectiveCanvasDpr();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ensureRuntime(width, height);
      markDirty();
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [
    battleMode,
    ensureRuntime,
    markDirty,
    snapshot.enemyAvatarUrl,
    snapshot.playerAvatarUrl,
  ]);

  useEffect(() => {
    applySnapshotToRuntime(snapshot);
  }, [snapshot, applySnapshotToRuntime]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.chordOsmdBattle = battleMode === 'chord_osmd';
  }, [battleMode]);

  useEffect(() => {
    if (!effectCommand) return;
    if (battleMode === 'chord_osmd' && effectCommand.kind === 'osmdHammerReflect') {
      const tier = effectCommand.parryFinishOnly
        ? 'finish'
        : effectCommand.extendParryVisualSlow
          ? 'chain'
          : 'normal';
      playOsmdParrySe(tier);
    } else if (
      !disableCorrectSe && (
        effectCommand.kind === 'correct'
        || effectCommand.kind === 'voicingCast'
        || effectCommand.kind === 'complete'
        || effectCommand.kind === 'osmdHammerReflect'
        || effectCommand.kind === 'osmdMeteor'
      )
    ) {
      playFireMagicSe();
    }
    const container = containerRef.current;
    if (!container || !runtimeRef.current) return;
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(480, container.clientHeight);
    const runtime = runtimeRef.current;
    const anchors = getBattleAnchors(
      width,
      height,
      runtime.player.x,
      runtime.enemy.x,
      runtime.timingCalibrationLayout,
    );
    scheduleEarTrainingBattleEffect({
      runtime,
      snapshot: snapshotRef.current,
      anchors,
      width,
      height,
      playerTimers: playerTimersRef.current,
      enemyTimers: enemyTimersRef.current,
      onDirty: markDirty,
      onImpact: callbacksRef.current.onEffectImpact,
      scheduleImpact,
    }, effectCommand);
  }, [battleMode, disableCorrectSe, effectCommand, markDirty, scheduleImpact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const drawFrame = (now: number): void => {
      const container = containerRef.current;
      const runtime = runtimeRef.current;
      if (!container || !runtime) {
        rafRef.current = 0;
        return;
      }

      runtime.phraseTimelineSec = getPhraseTimelineSecRef.current?.() ?? null;

      const hasActiveMotion =
        runtime.player.motionState === 'walk'
        || runtime.enemy.motionState === 'walk'
        || isCharacterKnockbackActive(runtime.player)
        || isCharacterKnockbackActive(runtime.enemy)
        || runtime.effects.length > 0
        || runtime.floatingTexts.length > 0
        || runtime.damageTexts.length > 0
        || runtime.phraseIntro !== null
        || runtime.screenFlash !== null
        || isCameraActive(runtime.camera, now)
        || (
          runtime.visualSlow !== null
          && now < runtime.visualSlow.startedAt + runtime.visualSlow.durationMs
        )
        || (runtime.chordOsmdBattle && runtime.phraseTimelineSec !== null && hasActiveOsuCircles(runtime.osuCirclePool, runtime.phraseTimelineSec))
        || (runtime.chordOsmdBattle && hasActiveOsuCircleShatter(runtime.osuCircleShatterPool, now))
        || (
          runtime.lastParryAt > 0
          && now < runtime.lastParryAt + PARRY_TOTAL_MS + 250
        )
        || hasActiveParrySparks(runtime.parrySparkPool, now);

      if (!dirtyRef.current && !hasActiveMotion) {
        rafRef.current = 0;
        return;
      }

      dirtyRef.current = false;
      pruneExpiredEffects(runtime, now);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      const dpr = getEffectiveCanvasDpr();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyIOSCanvasOptimizations(ctx);
      ctx.imageSmoothingEnabled = false;

      drawEarTrainingBattle(ctx, snapshotRef.current, runtime, now);
      bindHudHitRegions(runtime);

      if (hasActiveMotion || runtime.effects.length > 0) {
        dirtyRef.current = true;
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrameRef.current = drawFrame;

    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (dirtyRef.current) {
      scheduleDrawFrame();
    } else {
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (runtimeRef.current) {
        clearParryMotionTimers(runtimeRef.current);
      }
    };
  }, [bindHudHitRegions, scheduleDrawFrame]);

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (const region of hudHitRegionsRef.current) {
      const { rect: hit } = region;
      if (x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height) {
        region.onClick();
        return;
      }
    }
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
        onPointerDown={event => {
          handlePointer(event.clientX, event.clientY);
        }}
      />
    </div>
  );
});

EarTrainingBattleCanvas.displayName = 'EarTrainingBattleCanvas';

export default EarTrainingBattleCanvas;
