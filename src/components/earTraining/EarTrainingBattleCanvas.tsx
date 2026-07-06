import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
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
import {
  drawEarTrainingBattle,
  EFFECT_IMAGE_URLS,
  preloadEarTrainingBattleImages,
} from '@/game/earTraining/canvas/drawEarTrainingBattle';
import { BACKGROUND_IMAGE_URLS } from '@/game/earTraining/canvas/earTrainingBattleBackground';
import { createCameraRuntime, isCameraActive } from '@/game/earTraining/canvas/earTrainingBattleCamera';
import { getBattleAnchors, resolveStaffReservedBottomY } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import type { EarTrainingBattleDrawRuntime } from '@/game/earTraining/canvas/earTrainingBattleDrawState';
import {
  pruneExpiredEffects,
  scheduleEarTrainingBattleEffect,
} from '@/game/earTraining/canvas/earTrainingBattleEffectScheduler';

interface EarTrainingBattleCanvasProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
  disableCorrectSe?: boolean;
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
  backgroundCache: { width: 0, height: 0, canvas: null },
  camera: createCameraRuntime(),
  structuralKey: '',
  hudLayoutKey: '',
  phraseSlotKey: '',
  lastEffectId: 0,
  staffReservedBottomY: resolveStaffReservedBottomY(height, width, snapshot.staffBand),
  activeThinRingCount: 0,
  effectByCommandId: new Map(),
  visualSlow: null,
  yokoIssenPoseAlternate: false,
});

const EarTrainingBattleCanvas = forwardRef<EarTrainingBattleSceneHandle, EarTrainingBattleCanvasProps>(({
  snapshot,
  effectCommand,
  callbacks,
  className,
  disableCorrectSe = true,
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

  snapshotRef.current = snapshot;
  callbacksRef.current = callbacks;

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
    runtimeRef.current.staffReservedBottomY = resolveStaffReservedBottomY(
      height,
      width,
      snapshotRef.current.staffBand,
    );
    return runtimeRef.current;
  }, []);

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
      const anchors = getBattleAnchors(width, height, runtime.player.x, runtime.enemy.x);
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
    if (disableCorrectSe) return;
    preloadFireMagicSe();
  }, [disableCorrectSe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    const avatarUrls = [
      snapshotRef.current.playerAvatarUrl,
      snapshotRef.current.enemyAvatarUrl,
    ];
    const battleImageUrls = [
      ...Object.values(EFFECT_IMAGE_URLS),
      ...Object.values(BACKGROUND_IMAGE_URLS),
    ];
    void preloadEarTrainingBattleImages([...avatarUrls, ...battleImageUrls]).then((map) => {
      if (cancelled || !runtimeRef.current) return;
      avatarUrls.forEach(url => {
        const img = map.get(url);
        if (img) runtimeRef.current?.loadedImages.set(url, img);
      });
      Object.entries(EFFECT_IMAGE_URLS).forEach(([key, url]) => {
        const img = map.get(url);
        if (img) runtimeRef.current?.loadedImages.set(key, img);
      });
      Object.entries(BACKGROUND_IMAGE_URLS).forEach(([key, url]) => {
        const img = map.get(url);
        if (img) runtimeRef.current?.loadedImages.set(key, img);
      });
      markDirty();
      window.requestAnimationFrame(() => markDirty());
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
  }, [ensureRuntime, markDirty]);

  useEffect(() => {
    applySnapshotToRuntime(snapshot);
  }, [snapshot, applySnapshotToRuntime]);

  useEffect(() => {
    if (!effectCommand) return;
    if (
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
    const anchors = getBattleAnchors(width, height, runtime.player.x, runtime.enemy.x);
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
  }, [disableCorrectSe, effectCommand, markDirty, scheduleImpact]);

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
        );

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
