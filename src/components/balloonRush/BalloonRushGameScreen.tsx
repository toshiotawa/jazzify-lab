/** 風船ラッシュ — refs + rAF、コードスロットのみ React state */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import EarTrainingPianoOverlay, {
  type EarTrainingPianoOverlayHandle,
} from '@/components/earTraining/EarTrainingPianoOverlay';
import {
  initializeCodeSlots,
  resetIncompleteOtherSlotCorrectNotes,
  selectRandomChord,
  selectProgressionChord,
  applyCharacterToPlayerState,
  createInitialGameState,
  updatePlayerPosition,
} from '@/components/survival/SurvivalGameEngine';
import { SurvivalProgressionStaff, type SurvivalProgressionStaffSnapshot } from '@/components/survival/SurvivalProgressionStaff';
import { fetchBalloonRushPlayDialogue } from '@/platform/supabaseBalloonRush';
import { scheduleSurvivalStageIntroLines } from '@/components/survival/stageIntro/scheduleSurvivalStageIntroLines';
import type { SurvivalCharacter, SurvivalGameState, DifficultyConfig } from '@/components/survival/SurvivalTypes';
import { SHOCKWAVE_DURATION, SLOT_TIMEOUT } from '@/components/survival/SurvivalTypes';
import type { LessonContext } from '@/types';
import { buildSurvivalRandomHintStaffVoicing } from '@/utils/survivalRandomHintStaff';
import { parseSurvivalQuestionId } from '@/utils/survivalQuestionTypes';
import { buildProgressionChordDefinitions } from '@/utils/survivalProgressionChords';
import { computeUnpressedNoteOpacity } from '@/utils/survivalStaffHintOpacity';
import type { BalloonRushResolvedStage } from '@/utils/balloonRushStageDefinitions';
import { resolveBalloonRushAllowedChordIds } from '@/utils/balloonRushStageDefinitions';
import type { BalloonRunState } from '@/utils/balloonRushEngine';
import { balloonBlinkVisibleAt, isBalloonExpired } from '@/utils/balloonRushEngine';
import { pickInitialFivePositions, pickRespawnPosition, MAP_MARGIN_PX } from '@/utils/balloonRushSpawn';
import {
  createMeleeShockwaveBurst,
  findBalloonsHitByMelee,
  knockVelocityFromBalloonBurst,
} from '@/utils/balloonRushMelee';
import type { ShockwaveBurst } from '@/utils/balloonRushMelee';
import { drawBalloonRushWorld } from '@/components/balloonRush/balloonRushWorldDraw';
import type { BalloonRushDrawSnapshot } from '@/components/balloonRush/balloonRushWorldDraw';
import { createInitialJajiiState, getJajiiWorldPosition, updateJajiiMovementInPlace } from '@/components/survival/jajii/SurvivalJajiiEngine';
import type { JajiiState } from '@/components/survival/jajii/SurvivalJajiiEngine';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { cn } from '@/utils/cn';
import { useGameStore } from '@/stores/gameStore';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
type BallInst = BalloonRunState & { popped: boolean };

interface Physics {
  balloons: BallInst[];
  popped: number;
  respawnDue: number[];
  knockVx: number;
  knockVy: number;
}

const mergeQueues = (prev: readonly number[], adds: readonly number[]): number[] =>
  [...prev, ...adds].slice().sort((a, b) => a - b);

export interface BalloonRushGameScreenProps {
  readonly stage: BalloonRushResolvedStage;
  readonly hintMode: boolean;
  readonly character: SurvivalCharacter | null | undefined;
  readonly lessonContext: LessonContext | null;
  readonly isEnglishCopy: boolean;
  readonly onLessonClear?: () => void | Promise<void>;
  readonly onBack: () => void;
}

const noop = (): void => {};

const clampPlayerEdges = (
  px: number,
  py: number,
): { x: number; y: number } => {
  /* PLAYER_SIZE half 16 from survival MAP_CONFIG clamps */
  const half = 16;
  const w = 3200;
  const h = 2400;
  return {
    x: Math.max(half, Math.min(px, w - half)),
    y: Math.max(half, Math.min(py, h - half)),
  };
};

const BalloonRushGameScreen: React.FC<BalloonRushGameScreenProps> = ({
  stage,
  hintMode,
  character,
  lessonContext,
  isEnglishCopy,
  onLessonClear,
  onBack,
}) => {
  const physicsRef = useRef<Physics>({
    balloons: [],
    popped: 0,
    respawnDue: [],
    knockVx: 0,
    knockVy: 0,
  });
  const gameRef = useRef<SurvivalGameState>(createInitialGameState(
    'easy',
    {
      difficulty: 'easy',
      displayName: stage.slug,
      description: '',
      allowedChords: ['Dm7'],
      enemySpawnRate: 999,
      enemySpawnCount: 0,
      enemyStatMultiplier: 1,
      expMultiplier: 1,
      itemDropRate: 0,
      bgmUrl: stage.bgmUrl,
    },
    true,
  ));

  const shockwavesRef = useRef<readonly ShockwaveBurst[]>([]);
  const jajiiRef = useRef<JajiiState | null>(null);

  const [codeSlotsState, setCodeSlotsState] = useState(gameRef.current.codeSlots);
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [remainPopHud, setRemainPopHud] = useState(stage.popQuota);
  const [timeLeftHud, setTimeLeftHud] = useState(stage.timeLimitSec);
  const [playFaiLine, setPlayFaiLine] = useState('');
  const [playJajiiLine, setPlayJajiiLine] = useState('');

  const keysRef = useRef<Set<string>>(new Set());
  const progressionIdxRef = useRef(0);
  const progChordsRef = useRef<ChordDefinition[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pianoRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const midiRef = useRef<MIDIController | null>(null);
  const midiInitPromiseRef = useRef<Promise<void> | null>(null);
  const lastFrameTsRef = useRef(performance.now());
  const lastHudElapsedIntRef = useRef(-1);

  const cfgSlice = useGameStore(s => ({
    midiVol: s.settings?.midiVolume,
    midiDev: s.settings?.selectedMidiDevice,
    sfx: s.settings?.soundEffectVolume,
    rootVol: s.settings?.rootSoundVolume,
  }));

  const allowedChordIds = useMemo(() => [...resolveBalloonRushAllowedChordIds(stage)], [stage]);
  const progChordsBuilt = useMemo((): readonly ChordDefinition[] => {
    if (stage.stageType !== 'progression' || !stage.chordProgression?.length) return [];
    return buildProgressionChordDefinitions([...stage.chordProgression]) as unknown as readonly ChordDefinition[];
  }, [stage.chordProgression, stage.stageType]);
  const isProgression = stage.stageType === 'progression' && progChordsBuilt.length > 0;

  const stageRef = useRef(stage);
  stageRef.current = stage;

  const bumpProg = useCallback((): { cur: ChordDefinition | null; nxt: ChordDefinition | null } => {
    const ch = progChordsRef.current;
    if (!ch.length) return { cur: null, nxt: null };
    progressionIdxRef.current = (progressionIdxRef.current + 1) % ch.length;
    const i = progressionIdxRef.current;
    return { cur: selectProgressionChord(ch, i), nxt: selectProgressionChord(ch, i + 1) };
  }, []);

  useEffect(() => {
    progChordsRef.current = [...progChordsBuilt];
    progressionIdxRef.current = 0;

    const diffCfg: DifficultyConfig = {
      difficulty: 'easy',
      displayName: stage.slug,
      description: '',
      allowedChords: allowedChordIds.length > 0 ? allowedChordIds : ['Dm7'],
      enemySpawnRate: 999,
      enemySpawnCount: 0,
      enemyStatMultiplier: 1,
      expMultiplier: 1,
      itemDropRate: 0,
      bgmUrl: stage.bgmUrl,
    };

    const base = createInitialGameState('easy', diffCfg, true);
    const pl = character ? applyCharacterToPlayerState(base.player, character) : base.player;
    const slots = initializeCodeSlots(
      allowedChordIds.length > 0 ? allowedChordIds : ['Dm7'],
      false,
      true,
      isProgression ? [...progChordsBuilt] : undefined,
      stage.stageType === 'random',
    );

    physicsRef.current = { balloons: [], popped: 0, respawnDue: [], knockVx: 0, knockVy: 0 };
    const pos = pickInitialFivePositions({ x: pl.x, y: pl.y }, MAP_MARGIN_PX, Math.random);
    physicsRef.current.balloons = pos.map((p, i) => ({
      id: `b_${i}_${Date.now()}`,
      x: p.x,
      y: p.y,
      spawnedAtSec: 0,
      lifetimeSec: stage.balloonLifetimeSec,
      popped: false,
    }));

    gameRef.current = {
      ...base,
      player: pl,
      codeSlots: slots,
      isPlaying: true,
      isGameOver: false,
      elapsedTime: 0,
      enemies: [],
      projectiles: [],
      damageTexts: [],
    };

    shockwavesRef.current = [];
    jajiiRef.current = createInitialJajiiState(pl.x, pl.y);
    lastFrameTsRef.current = performance.now();
    lastHudElapsedIntRef.current = -1;
    setCodeSlotsState(slots);
    setPhase('playing');
    setRemainPopHud(stage.popQuota);
    setTimeLeftHud(stage.timeLimitSec);

    let a: HTMLAudioElement | null = null;
    if (stage.bgmUrl) {
      a = new Audio(stage.bgmUrl);
      a.loop = true;
      a.volume = 0.38;
      void a.play().catch(noop);
    }

    let stopDialogue = false;
    void fetchBalloonRushPlayDialogue(stage.id).then(sc => {
      if (!sc || stopDialogue) return;
      scheduleSurvivalStageIntroLines({
        script: sc,
        isEnglishCopy,
        setFaiLine: setPlayFaiLine,
        setJajiiLine: setPlayJajiiLine,
      });
    });

    return () => {
      stopDialogue = true;
      if (a) {
        a.pause();
        a.src = '';
      }
    };
  }, [
    stage,
    allowedChordIds,
    progChordsBuilt,
    isProgression,
    character,
    isEnglishCopy,
  ]);

  const handleMeleeComplete = (
    meleePlayer: SurvivalGameState['player'],
    elapsed: number,
  ): void => {
    const bs = physicsRef.current.balloons.filter(b => !b.popped);
    const hits = findBalloonsHitByMelee(meleePlayer, bs);
    if (hits.length === 0) return;
    shockwavesRef.current = [...shockwavesRef.current, createMeleeShockwaveBurst(meleePlayer, performance.now())];
    physicsRef.current.balloons = physicsRef.current.balloons.map(b =>
      hits.includes(b.id) ? { ...b, popped: true } : b,
    );
    physicsRef.current.popped += hits.length;
    physicsRef.current.respawnDue = mergeQueues(
      physicsRef.current.respawnDue,
      hits.map(() => elapsed + stageRef.current.respawnDelaySec),
    );
  };

  const handleNoteDown = useCallback(
    (note: number): void => {
      if (phase !== 'playing') return;
      const gs = gameRef.current;
      if (!gs.isPlaying || gs.isGameOver) return;

      const sB = gs.codeSlots.current[1];
      if (!sB.isEnabled || !sB.chord || sB.isCompleted || sB.completedTime) return;

      const n12 = ((note % 12) + 12) % 12;
      const pcs = [...new Set(sB.chord.notes.map(n => ((n % 12) + 12) % 12))];
      if (!pcs.includes(n12) || sB.correctNotes.includes(n12)) return;

      const correct = [...sB.correctNotes, n12];
      const done = correct.length >= pcs.length;

      let curSlots = gs.codeSlots.current.map((sl, ix) =>
        ix === 1 ? { ...sl, correctNotes: correct, isCompleted: done, completedTime: done ? Date.now() : undefined } : sl,
      ) as SurvivalGameState['codeSlots']['current'];
      curSlots = resetIncompleteOtherSlotCorrectNotes(curSlots, done ? [1] : []) as typeof curSlots;

      if (!done) {
        gameRef.current = { ...gs, codeSlots: { current: [...curSlots], next: [...gs.codeSlots.next] } };
        setCodeSlotsState(gameRef.current.codeSlots);
        return;
      }

      handleMeleeComplete(gs.player, gs.elapsedTime);

      let nextCurr = [...curSlots];
      let nextNx = [...gs.codeSlots.next];
      const chUsed = nextCurr[1].chord;

      if (isProgression) {
        const { cur, nxt } = bumpProg();
        nextCurr = nextCurr.map((sl, ix) =>
          ix === 1 ? { ...sl, chord: cur ?? sl.chord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT } : sl,
        ) as typeof nextCurr;
        nextNx = nextNx.map((sl, ix) => (ix === 1 ? { ...sl, chord: nxt } : sl)) as typeof nextNx;
      } else {
        const nextChordVal = selectRandomChord(allowedChordIds, chUsed?.id);
        const newNextChord = selectRandomChord(allowedChordIds, nextChordVal?.id);
        nextCurr = nextCurr.map((sl, ix) =>
          ix === 1 ? { ...sl, chord: nextChordVal ?? sl.chord, correctNotes: [], isCompleted: false, completedTime: undefined, timer: SLOT_TIMEOUT }
            : sl,
        ) as typeof nextCurr;
        nextNx = nextNx.map((sl, ix) => (ix === 1 ? { ...sl, chord: newNextChord } : sl)) as typeof nextNx;
      }

      const nextGs: SurvivalGameState = {
        ...gs,
        codeSlots: {
          current: [...nextCurr] as SurvivalGameState['codeSlots']['current'],
          next: [...nextNx] as SurvivalGameState['codeSlots']['next'],
        },
      };
      gameRef.current = nextGs;
      setCodeSlotsState(nextGs.codeSlots);

      const quotaHit = physicsRef.current.popped >= stageRef.current.popQuota;
      if (quotaHit) {
        setPhase('won');
        gameRef.current = { ...nextGs, isGameOver: true, isPlaying: false };
        try {
          void FantasySoundManager.playStageClear();
        } catch {
          noop();
        }
        if (!hintMode && lessonContext) {
          void onLessonClear?.();
        }
      }
    },
    [allowedChordIds, bumpProg, hintMode, isProgression, lessonContext, onLessonClear, phase],
  );

  const noteHandlerRef = useRef(handleNoteDown);
  noteHandlerRef.current = handleNoteDown;

  useEffect(() => {
    const d = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
      }
    };
    const u = (e: KeyboardEvent): void => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    const b = (): void => {
      keysRef.current.clear();
    };
    window.addEventListener('keydown', d);
    window.addEventListener('keyup', u);
    window.addEventListener('blur', b);
    return () => {
      window.removeEventListener('keydown', d);
      window.removeEventListener('keyup', u);
      window.removeEventListener('blur', b);
    };
  }, []);

  useEffect(() => {
    const c = new MIDIController({
      onNoteOn: (n: number) => noteHandlerRef.current(n),
      onNoteOff: noop,
      playMidiSound: true,
    });
    midiRef.current = c;
    midiInitPromiseRef.current = (async (): Promise<void> => {
      const se = cfgSlice.sfx ?? 0.8;
      const rv = cfgSlice.rootVol ?? 0.7;
      await Promise.all([
        initializeAudioSystem().then(() => updateGlobalVolume(cfgSlice.midiVol ?? 0.8)),
        FantasySoundManager.init(se, rv, true).then(() => FantasySoundManager.enableRootSound(true)),
      ]);
      await c.initialize();
      FantasySoundManager.ensureContextsRunning();
    })();
    return () => {
      void c.destroy();
    };
  }, []);

  useEffect(() => {
    void (async (): Promise<void> => {
      await midiInitPromiseRef.current;
      if (cfgSlice.midiDev) await midiRef.current?.connectDevice(cfgSlice.midiDev);
    })();
  }, [cfgSlice.midiDev]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return undefined;
    const apply = (): void => {
      const r = window.devicePixelRatio || 1;
      const bb = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.floor(bb.width));
      const h = Math.max(240, Math.floor(bb.height));
      cv.width = Math.floor(w * r);
      cv.height = Math.floor(h * r);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      const ctx = cv.getContext('2d');
      ctx?.setTransform(r, 0, 0, r, 0, 0);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  const elapsedInt = Math.floor(gameRef.current.elapsedTime);

  const punchStaff = useMemo((): SurvivalProgressionStaffSnapshot | null => {
    if (!hintMode) return null;
    const slot = codeSlotsState.current[1];
    const ch = slot?.chord;
    if (!phase || phase !== 'playing' || !ch || !slot.isEnabled) return null;
    const sq = parseSurvivalQuestionId(ch.id);
    if (ch.quality === 'progression') {
      const nm = ch.progressionStaffVoicingNames;
      const kf = ch.progressionStaffKeyFifths;
      if (nm && nm.length && typeof kf === 'number')
        return {
          voicingNames: [...nm],
          keyFifths: kf,
          chordDisplayName: ch.displayName,
          correctPitchClasses: slot.correctNotes,
          staffClef: 'bass',
          ...(ch.progressionStaffVoicingStaves ? { voicingStaves: [...ch.progressionStaffVoicingStaves] } : {}),
        };
    }
    const tn = ch.progressionStaffVoicingNames;
    const tk = ch.progressionStaffKeyFifths;
    if (tn && tn.length && typeof tk === 'number')
      return {
        voicingNames: [...tn],
        keyFifths: tk,
        chordDisplayName: sq ? ch.displayName : ch.displayName,
        rootDisplayName: sq ? ch.root : undefined,
        correctPitchClasses: slot.correctNotes,
        staffClef: 'treble',
        ...(ch.progressionStaffVoicingStaves ? { voicingStaves: [...ch.progressionStaffVoicingStaves] } : {}),
      };
    const bk = buildSurvivalRandomHintStaffVoicing(ch.id);
    return bk ? {
      voicingNames: bk.voicingNames,
      keyFifths: bk.keyFifths,
      chordDisplayName: ch.displayName,
      rootDisplayName: sq ? ch.root : undefined,
      correctPitchClasses: slot.correctNotes,
      staffClef: 'treble',
    } : null;
  }, [codeSlotsState, hintMode, phase]);

  const staffOp = computeUnpressedNoteOpacity(elapsedInt, {
    hintMode,
    hintBuffActive: false,
    beginnerAssistActive: false,
    isPhraseMode: false,
    isStageMode: true,
    isPlaying: phase === 'playing',
    isGameOver: phase !== 'playing',
  });

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    let raf = 0;
    const frame = (): void => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const perfNow = performance.now();
      const dt = Math.min(0.1, (perfNow - lastFrameTsRef.current) / 1000);
      lastFrameTsRef.current = perfNow;

      const g = gameRef.current;
      if (!g.isPlaying || g.isGameOver) {
        raf = requestAnimationFrame(frame);
        return;
      }

      let pl = updatePlayerPosition(g.player, new Set(keysRef.current), dt, null);
      const phy = physicsRef.current;
      pl = {
        ...pl,
        x: pl.x + phy.knockVx * dt,
        y: pl.y + phy.knockVy * dt,
      };
      phy.knockVx *= 0.9;
      phy.knockVy *= 0.9;
      const ck = clampPlayerEdges(pl.x, pl.y);
      pl = { ...pl, ...ck };

      const elapsed = g.elapsedTime + dt;

      const kbForce = 150 + pl.skills.bKnockbackBonus * 50;
      const nextBs: BallInst[] = [];
      for (const b of phy.balloons) {
        if (b.popped) {
          nextBs.push(b);
          continue;
        }
        if (!isBalloonExpired(b, elapsed)) {
          nextBs.push(b);
          continue;
        }
        const vv = knockVelocityFromBalloonBurst({ x: b.x, y: b.y }, { x: pl.x, y: pl.y }, kbForce);
        phy.knockVx += vv.vx;
        phy.knockVy += vv.vy;
        phy.respawnDue = mergeQueues(phy.respawnDue, [elapsed + stageRef.current.respawnDelaySec]);
        shockwavesRef.current = [...shockwavesRef.current, { id: `ex_${b.id}`, x: b.x, y: b.y, maxRadius: 90, startPerfMs: perfNow }];
        nextBs.push({ ...b, popped: true });
      }
      phy.balloons = nextBs;

      const maxConc = stageRef.current.maxConcurrent;
      const newDue = [...phy.respawnDue].sort((a, b) => a - b);
      const liveBs = (): BallInst[] => phy.balloons.filter(bb => !bb.popped);
      while (newDue.length > 0 && newDue[0] <= elapsed) {
        if (liveBs().length >= maxConc) break;
        newDue.shift();
        const spot = pickRespawnPosition({ x: pl.x, y: pl.y }, liveBs(), MAP_MARGIN_PX, Math.random);
        if (!spot) {
          newDue.push(elapsed + 0.12);
          newDue.sort((a, b) => a - b);
          break;
        }
        phy.balloons = [
          ...phy.balloons,
          {
            id: `nr_${performance.now().toFixed(3)}_${Math.random().toString(36).slice(2)}`,
            x: spot.x,
            y: spot.y,
            spawnedAtSec: elapsed,
            lifetimeSec: stageRef.current.balloonLifetimeSec,
            popped: false,
          },
        ];
      }
      phy.respawnDue = newDue;

      if (jajiiRef.current) updateJajiiMovementInPlace(jajiiRef.current, pl.x, pl.y, elapsed, dt);

      gameRef.current = { ...g, player: pl, elapsedTime: elapsed };

      const eInt = Math.floor(elapsed);
      if (eInt !== lastHudElapsedIntRef.current) {
        lastHudElapsedIntRef.current = eInt;
        setTimeLeftHud(Math.max(0, Math.ceil(stageRef.current.timeLimitSec - elapsed)));
        setRemainPopHud(Math.max(0, stageRef.current.popQuota - phy.popped));
      }

      if (
        elapsed >= stageRef.current.timeLimitSec &&
        phy.popped < stageRef.current.popQuota
      ) {
        setPhase('lost');
        gameRef.current = { ...gameRef.current, isGameOver: true, isPlaying: false };
      }

      const jp = jajiiRef.current ? getJajiiWorldPosition(jajiiRef.current) : null;
      shockwavesRef.current = shockwavesRef.current.filter(
        s => perfNow - s.startPerfMs < SHOCKWAVE_DURATION,
      );

      const snap: BalloonRushDrawSnapshot = {
        playerX: pl.x,
        playerY: pl.y,
        playerDirection: pl.direction,
        balloons: phy.balloons
          .filter(b => !b.popped)
          .map(b => ({ id: b.id, x: b.x, y: b.y, visible: balloonBlinkVisibleAt(b, elapsed) })),
        jajiiX: jp?.x ?? null,
        jajiiY: jp?.y ?? null,
        shockwaves: [...shockwavesRef.current],
        nowPerfMs: perfNow,
      };
      drawBalloonRushWorld(ctx, cv.clientWidth, cv.clientHeight, snap);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-black">
      <div className="pointer-events-none absolute left-0 right-0 top-[max(4px,env(safe-area-inset-top)+4px)] z-30 flex justify-center gap-6 px-4 text-white">
        <span className="rounded bg-black/55 px-2 py-1 text-sm">{isEnglishCopy ? 'Left' : '残り'} {remainPopHud}</span>
        <span className="rounded bg-black/55 px-2 py-1 text-sm">{isEnglishCopy ? 'Time' : '時間'} {timeLeftHud}s</span>
      </div>
      {(playFaiLine || playJajiiLine) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(112px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
          <div className={cn('max-w-xl rounded-xl border px-3 py-2 text-sm text-white bg-black/70', playJajiiLine ? 'border-amber-500/35' : 'border-emerald-500/35')}>
            {playJajiiLine || playFaiLine}
          </div>
        </div>
      )}
      <div ref={wrapRef} className="relative z-[1] min-h-0 flex-1 w-full">
        <canvas ref={canvasRef} className="block h-full w-full bg-slate-900" />
      </div>
      {punchStaff && (
        <div className="pointer-events-none absolute inset-x-0 top-[max(48px,env(safe-area-inset-top)+44px)] z-[5] flex justify-center px-3">
          <SurvivalProgressionStaff
            chordDisplayName={punchStaff.chordDisplayName}
            rootDisplayName={punchStaff.rootDisplayName}
            voicingNames={punchStaff.voicingNames}
            keyFifths={punchStaff.keyFifths}
            correctPitchClasses={punchStaff.correctPitchClasses}
            staffClef={punchStaff.staffClef ?? 'bass'}
            {...(punchStaff.voicingStaves ? { voicingStaves: punchStaff.voicingStaves } : {})}
            unpressedNoteOpacity={staffOp}
            className="max-w-[min(360px,78vw)]"
          />
        </div>
      )}
      <div className="pointer-events-auto z-20 w-full shrink-0 pb-[env(safe-area-inset-bottom)]">
        <EarTrainingPianoOverlay
          ref={pianoRef}
          onPianoKeyDown={(n) => {
            noteHandlerRef.current(n);
            void playNote(n, 96);
            pianoRef.current?.highlightKey(n, true);
          }}
          onPianoKeyUp={(n) => {
            stopNote(n);
            pianoRef.current?.highlightKey(n, false);
          }}
        />
      </div>
      {phase !== 'playing' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/85 text-white px-6">
          <div className="text-xl font-semibold">
            {phase === 'won' ? (isEnglishCopy ? 'Cleared!' : 'クリア！') : isEnglishCopy ? 'Time up' : 'タイムアップ'}
          </div>
          <button
            type="button"
            className="rounded-lg bg-slate-600 px-8 py-2"
            onClick={() => (isIOSWebView() ? sendGameCallback('gameEnd') : onBack())}
          >
            {isEnglishCopy ? 'Back' : '戻る'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BalloonRushGameScreen;
