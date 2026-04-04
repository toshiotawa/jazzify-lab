/**
 * レジェンドの LegendRenderBridge と同様、太鼓表示の計算をこのクラスに集約し、
 * rAF 内では tick() だけが FantasyPIXIInstance へ描画命令を送る。
 * 音楽時刻の解決・入力スナップショット併合・可視ノーツ抽出は tick 内の単一路線で行う。
 */
import type { MutableRefObject } from 'react';
import { bgmManager } from '@/utils/BGMManager';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import type { CombinedSection, FantasyStage } from './FantasyGameEngine';
import { combiningSync } from './FantasyGameEngine';
import type { TaikoNote } from './TaikoNoteSystem';
import type { FantasyPIXIInstance } from './FantasyPIXIRenderer';

/** hitTime 昇順配列向け: 初めて hitTime >= time となるインデックス */
const lowerBoundByHitTime = (
  notes: TaikoNote[],
  time: number,
  lo = 0,
  hi = notes.length
): number => {
  let l = lo;
  let r = hi;
  while (l < r) {
    const m = (l + r) >> 1;
    if (notes[m].hitTime < time) l = m + 1;
    else r = m;
  }
  return l;
};

/** hitTime 昇順配列向け: 初めて hitTime > time となるインデックス */
const upperBoundByHitTime = (
  notes: TaikoNote[],
  time: number,
  lo = 0,
  hi = notes.length
): number => {
  let l = lo;
  let r = hi;
  while (l < r) {
    const m = (l + r) >> 1;
    if (notes[m].hitTime <= time) l = m + 1;
    else r = m;
  }
  return l;
};

type WorkBufferEntry = { id: string; chord: string; x: number; noteNames?: string[] };

export interface TaikoRenderRefs {
  taikoNotesRef: MutableRefObject<TaikoNote[]>;
  currentNoteIndexRef: MutableRefObject<number>;
  awaitingLoopStartRef: MutableRefObject<boolean>;
  taikoLoopCycleRef: MutableRefObject<number>;
  preHitNoteIndicesRef: MutableRefObject<number[]>;
  combinedSectionsRef: MutableRefObject<CombinedSection[]>;
}

export interface TaikoRenderParams {
  stageData: FantasyStage;
  useChordNameOnNotes: boolean;
  displayOpts: DisplayOpts;
  useRhythmNotation: boolean;
  loopDuration: number;
  secPerMeasure: number;
  isProgressionOrder: boolean;
  overlayMarkers: ReadonlyArray<{ time: number; text: string }>;
  crListenBars: [number, number] | undefined;
  crPlayBars: [number, number] | undefined;
  isAlternatingCR: boolean;
}

export interface TaikoRenderCallbacks {
  setCrOverlay: (text: string | null) => void;
  crOverlayTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export class TaikoRenderBridge {
  private lastDisplayNorm = -1;
  private displayWrapPending = false;
  private wrapAtLoopCycle = -1;
  private lastKnownLoopCycle = -1;

  private readonly workBuffer: WorkBufferEntry[] = [];
  private preHitFlags = new Uint8Array(256);
  private lastPreHitRef: number[] | null = null;
  private lastSentEmpty = false;
  private lastCrPhase: string | null = null;
  private readonly displayNameCache = new Map<string, string[]>();

  private readonly lookAheadTime = 4;
  private readonly noteSpeed = 200;

  /**
   * 描画用の音楽時刻（WebKit でタッチやメインスレッド停滞時に rAF が飛び、
   * getCurrentMusicTime だけが一気に進んでノーツが左にワープするのを抑える）
   */
  private displayMusicTimeForRender: number | null = null;
  private lastDisplaySmoothPerfMs = 0;

  constructor(
    private readonly refs: TaikoRenderRefs,
    private readonly params: TaikoRenderParams,
    private readonly callbacks: TaikoRenderCallbacks
  ) {}

  private getDisplayNoteNames(note: TaikoNote): string[] {
    const { useChordNameOnNotes, displayOpts } = this.params;
    const cached = this.displayNameCache.get(note.id);
    if (cached) return cached;
    const result = useChordNameOnNotes
      ? [note.chord.displayName]
      : note.chord.noteNames.map((n) => toDisplayName(n, displayOpts));
    this.displayNameCache.set(note.id, result);
    return result;
  }

  private rebuildPreHitFlags(indices: number[]): void {
    const { preHitFlags } = this;
    if (indices.length === 0) {
      if (this.lastPreHitRef && this.lastPreHitRef.length > 0) preHitFlags.fill(0);
    } else {
      const maxIdx = indices[indices.length - 1];
      if (maxIdx >= preHitFlags.length) {
        this.preHitFlags = new Uint8Array(Math.max(maxIdx + 64, preHitFlags.length * 2));
      } else {
        preHitFlags.fill(0);
      }
      for (let k = 0; k < indices.length; k++) this.preHitFlags[indices[k]] = 1;
    }
    this.lastPreHitRef = indices;
  }

  /**
   * BGM の実時間に追従しつつ、1 描画フレームあたりの進み幅を上限してワープ感を防ぐ。
   * 判定・ゲーム状態は engine 側の生の getCurrentMusicTime に任せる。
   */
  private smoothTaikoDisplayMusicTime(raw: number): number {
    const now = performance.now();
    if (this.displayMusicTimeForRender === null) {
      this.displayMusicTimeForRender = raw;
      this.lastDisplaySmoothPerfMs = now;
      return raw;
    }
    const dtWall = Math.min((now - this.lastDisplaySmoothPerfMs) / 1000, 0.35);
    this.lastDisplaySmoothPerfMs = now;
    const maxAdvance = Math.min(dtWall * 1.15 + 0.004, 0.048);
    const d = raw - this.displayMusicTimeForRender;
    if (d < -maxAdvance * 2) {
      this.displayMusicTimeForRender = raw;
      return raw;
    }
    if (d > maxAdvance) {
      this.displayMusicTimeForRender += maxAdvance;
      return this.displayMusicTimeForRender;
    }
    this.displayMusicTimeForRender = raw;
    return raw;
  }

  tick(pixi: FantasyPIXIInstance): void {
    const {
      taikoNotesRef,
      currentNoteIndexRef,
      awaitingLoopStartRef,
      taikoLoopCycleRef,
      preHitNoteIndicesRef,
      combinedSectionsRef,
    } = this.refs;

    const {
      stageData,
      useRhythmNotation,
      loopDuration,
      secPerMeasure,
      isProgressionOrder,
      overlayMarkers,
      crListenBars,
      crPlayBars,
      isAlternatingCR,
    } = this.params;

    const { setCrOverlay, crOverlayTimerRef } = this.callbacks;

    const rawMusicTime = bgmManager.getCurrentMusicTime();
    const taikoNotes = taikoNotesRef.current;
    const stateNoteIndex = currentNoteIndexRef.current;
    const stateAwaitingLoop = awaitingLoopStartRef.current;

    const preHitIndices = preHitNoteIndicesRef.current || [];
    if (preHitIndices !== this.lastPreHitRef) this.rebuildPreHitFlags(preHitIndices);

    if (taikoNotes.length === 0) {
      this.displayMusicTimeForRender = null;
      if (!this.lastSentEmpty) {
        pixi.updateTaikoNotes([]);
        this.lastSentEmpty = true;
      }
      return;
    }

    const currentTime = this.smoothTaikoDisplayMusicTime(rawMusicTime);

    const jx = pixi.getJudgeLinePosition().x;

    if (currentTime < -0.01) {
      this.lastDisplayNorm = -1;
      this.displayWrapPending = false;
      this.workBuffer.length = 0;

      const isCombining = combiningSync.active;
      let startIdx = 0;
      let endIdx = taikoNotes.length;
      if (isCombining) {
        startIdx = combiningSync.noteStartIndex;
        endIdx = combiningSync.noteEndIndex;
      }

      for (let i = startIdx; i < endIdx; i++) {
        const note = taikoNotes[i];
        if (!note) continue;
        if (note.isHit || (i < this.preHitFlags.length && this.preHitFlags[i])) continue;
        const timeUntilHit = note.hitTime - currentTime;
        if (timeUntilHit > this.lookAheadTime) break;
        if (timeUntilHit >= -0.5) {
          this.workBuffer.push({
            id: note.id,
            chord: note.chord.displayName,
            x: jx + timeUntilHit * this.noteSpeed,
            noteNames:
              useRhythmNotation && stageData.callResponseEnabled ? [] : this.getDisplayNoteNames(note),
          });
        }
      }
      pixi.updateTaikoNotes(this.workBuffer);
      return;
    }

    if (combiningSync.active) {
      const combinedSections = combinedSectionsRef.current;
      const currentSectionIdx = combiningSync.sectionIndex;
      const section = combinedSections[currentSectionIdx];
      if (section) {
        const currentNoteIndex = stateNoteIndex;
        const isAwaitingLoop = stateAwaitingLoop;
        this.workBuffer.length = 0;

        if (!isAwaitingLoop) {
          for (let i = combiningSync.noteStartIndex; i < combiningSync.noteEndIndex; i++) {
            const note = taikoNotes[i];
            if (!note) continue;
            if (note.isHit) continue;
            if (!note.isMissed && i < currentNoteIndex) continue;
            const timeUntilHit = note.hitTime - currentTime;
            if (timeUntilHit < -0.35) continue;
            if (timeUntilHit > this.lookAheadTime) break;
            this.workBuffer.push({
              id: note.id,
              chord: note.chord.displayName,
              x: jx + timeUntilHit * this.noteSpeed,
              noteNames: useRhythmNotation && section.callResponseMode ? [] : this.getDisplayNoteNames(note),
            });
          }
        }

        const sectionSecPerMeasure = (60 / section.bpm) * section.timeSignature;
        const sectionPlayDuration = section.measureCount * sectionSecPerMeasure;
        const timeToSectionEnd = sectionPlayDuration - currentTime;
        const nextSectionIdx = currentSectionIdx + 1;

        if (timeToSectionEnd < this.lookAheadTime && nextSectionIdx < combinedSections.length) {
          const nextSection = combinedSections[nextSectionIdx];
          const nextCountInSec = nextSection.countInMeasures * (60 / nextSection.bpm) * nextSection.timeSignature;

          for (let i = nextSection.globalNoteStartIndex; i < nextSection.globalNoteEndIndex; i++) {
            const note = taikoNotes[i];
            if (!note) continue;
            if (note.isHit) continue;
            const virtualTime = timeToSectionEnd + nextCountInSec + note.hitTime;
            if (virtualTime > this.lookAheadTime) break;
            if (virtualTime < -0.35) continue;
            this.workBuffer.push({
              id: `next_${note.id}`,
              chord: note.chord.displayName,
              x: jx + virtualTime * this.noteSpeed,
              noteNames: useRhythmNotation && nextSection.callResponseMode ? [] : this.getDisplayNoteNames(note),
            });
          }
        }

        pixi.updateTaikoNotes(this.workBuffer);

        if (section.callResponseMode === 'alternating') {
          const fullLoopCount = taikoLoopCycleRef.current ?? 0;
          const totalPlay = fullLoopCount * (section.sectionRepeatCount ?? 1) + (section.repeatIndex ?? 0);
          const altPhase = totalPlay % 2 === 0 ? 'listen' : 'play';
          if (altPhase !== this.lastCrPhase) {
            const crText = altPhase === 'listen' ? 'Listen...' : 'Your Turn!';
            setCrOverlay(crText);
            if (crOverlayTimerRef.current) clearTimeout(crOverlayTimerRef.current);
            crOverlayTimerRef.current = setTimeout(() => setCrOverlay(null), 1500);
            this.lastCrPhase = altPhase;
          }
        } else if (section.listenBars && section.playBars) {
          const sectionSecPerMeasureForCR = (60 / section.bpm) * section.timeSignature;
          const currentBarInSection = Math.floor(currentTime / sectionSecPerMeasureForCR) + 1;
          let crPhase: string | null = null;
          if (currentBarInSection >= section.listenBars[0] && currentBarInSection <= section.listenBars[1]) {
            crPhase = 'listen';
          } else if (currentBarInSection >= section.playBars[0] && currentBarInSection <= section.playBars[1]) {
            crPhase = 'play';
          }
          if (crPhase && crPhase !== this.lastCrPhase) {
            const crText = crPhase === 'listen' ? 'Listen...' : 'Your Turn!';
            setCrOverlay(crText);
            if (crOverlayTimerRef.current) clearTimeout(crOverlayTimerRef.current);
            crOverlayTimerRef.current = setTimeout(() => setCrOverlay(null), 1500);
          }
          this.lastCrPhase = crPhase;
        }

        pixi.updateOverlayText(null);
        return;
      }
    }

    const normalizedTime =
      currentTime < 0 ? 0 : ((currentTime % loopDuration) + loopDuration) % loopDuration;

    const preCheckCycle = this.lastKnownLoopCycle;
    this.lastKnownLoopCycle = taikoLoopCycleRef.current ?? 0;

    if (this.lastDisplayNorm >= 0 && this.lastDisplayNorm - normalizedTime > loopDuration * 0.5) {
      this.displayWrapPending = true;
      this.wrapAtLoopCycle = preCheckCycle;
    }
    this.lastDisplayNorm = normalizedTime;

    const currentLoopCycle = taikoLoopCycleRef.current ?? 0;
    if (this.displayWrapPending && currentLoopCycle > this.wrapAtLoopCycle) {
      this.displayWrapPending = false;
    }

    const currentNoteIndex = this.displayWrapPending ? 0 : stateNoteIndex;
    const isAwaitingLoop = this.displayWrapPending ? false : stateAwaitingLoop;

    this.workBuffer.length = 0;

    if (!isAwaitingLoop) {
      const lowerBound = -0.35;
      const visibleStart = lowerBoundByHitTime(taikoNotes, normalizedTime + lowerBound);
      const visibleEnd = upperBoundByHitTime(
        taikoNotes,
        normalizedTime + this.lookAheadTime,
        visibleStart
      );

      for (let index = visibleStart; index < visibleEnd; index++) {
        const note = taikoNotes[index];
        if (!note || note.isHit) continue;
        if (!note.isMissed && index < currentNoteIndex) continue;

        const timeUntilHit = note.hitTime - normalizedTime;
        this.workBuffer.push({
          id: note.id,
          chord: note.chord.displayName,
          x: jx + timeUntilHit * this.noteSpeed,
          noteNames:
            useRhythmNotation && stageData.callResponseEnabled ? [] : this.getDisplayNoteNames(note),
        });
      }
    }

    const timeToLoop = loopDuration - normalizedTime;
    const shouldShowNextLoopPreview =
      !isProgressionOrder && (isAwaitingLoop || timeToLoop < this.lookAheadTime);

    if (shouldShowNextLoopPreview && taikoNotes.length > 0) {
      const cap = Math.min(currentNoteIndex, taikoNotes.length);
      const previewEnd = upperBoundByHitTime(taikoNotes, this.lookAheadTime, 0, cap);
      const bufLen = this.workBuffer.length;
      for (let i = 0; i < previewEnd; i++) {
        const note = taikoNotes[i];
        if (!note) continue;

        let isDup = false;
        for (let k = 0; k < bufLen; k++) {
          if (this.workBuffer[k].id === note.id) {
            isDup = true;
            break;
          }
        }
        if (isDup) continue;
        if (i < this.preHitFlags.length && this.preHitFlags[i]) continue;

        const virtualHitTime = note.hitTime + loopDuration;
        const timeUntilHit = virtualHitTime - normalizedTime;
        if (timeUntilHit <= 0) continue;
        if (timeUntilHit > timeToLoop + this.lookAheadTime) continue;

        this.workBuffer.push({
          id: `${note.id}_loop`,
          chord: note.chord.displayName,
          x: jx + timeUntilHit * this.noteSpeed,
          noteNames:
            useRhythmNotation && stageData.callResponseEnabled ? [] : this.getDisplayNoteNames(note),
        });
      }
    }

    if (isAlternatingCR) {
      const loopCycle = taikoLoopCycleRef.current ?? 0;
      const isListenCycle = loopCycle % 2 === 0;
      if (isListenCycle) {
        if (!this.lastSentEmpty) {
          pixi.updateTaikoNotes([]);
          this.lastSentEmpty = true;
        }
      } else {
        this.lastSentEmpty = false;
        pixi.updateTaikoNotes(this.workBuffer);
      }
      const altPhase = isListenCycle ? 'listen' : 'play';
      if (altPhase !== this.lastCrPhase) {
        const text = isListenCycle ? 'Listen...' : 'Your Turn!';
        setCrOverlay(text);
        if (crOverlayTimerRef.current) clearTimeout(crOverlayTimerRef.current);
        crOverlayTimerRef.current = setTimeout(() => setCrOverlay(null), 1500);
        this.lastCrPhase = altPhase;
      }
    } else {
      this.lastSentEmpty = false;
      pixi.updateTaikoNotes(this.workBuffer);
    }

    if (crListenBars && crPlayBars) {
      const currentBar = Math.floor(normalizedTime / secPerMeasure) + 1;
      let phase: string | null = null;
      if (currentBar >= crListenBars[0] && currentBar <= crListenBars[1]) {
        phase = 'listen';
      } else if (currentBar >= crPlayBars[0] && currentBar <= crPlayBars[1]) {
        phase = 'play';
      }
      if (phase && phase !== this.lastCrPhase) {
        const text = phase === 'listen' ? 'Listen...' : 'Your Turn!';
        setCrOverlay(text);
        if (crOverlayTimerRef.current) clearTimeout(crOverlayTimerRef.current);
        crOverlayTimerRef.current = setTimeout(() => setCrOverlay(null), 1500);
      }
      this.lastCrPhase = phase;
    }

    if (overlayMarkers.length > 0) {
      const t = normalizedTime;
      let label = overlayMarkers[overlayMarkers.length - 1].text;
      for (let i = 0; i < overlayMarkers.length; i++) {
        const cur = overlayMarkers[i];
        const next = overlayMarkers[i + 1];
        if (t >= cur.time && (!next || t < next.time)) {
          label = cur.text;
          break;
        }
        if (t < overlayMarkers[0].time) {
          label = overlayMarkers[overlayMarkers.length - 1].text;
        }
      }
      pixi.updateOverlayText(label || null);
    } else {
      pixi.updateOverlayText(null);
    }
  }
}
