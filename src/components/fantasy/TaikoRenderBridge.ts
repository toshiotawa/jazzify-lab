import { bgmManager } from '@/utils/BGMManager';
import { toDisplayName, type DisplayOpts } from '@/utils/display-note';
import { combiningSync, type CombinedSection, type FantasyGameState, type FantasyStage } from './FantasyGameEngine';
import type { TaikoNote } from './TaikoNoteSystem';
import type { FantasyPIXIInstance, TaikoDisplayNote } from './FantasyPIXIRenderer';

export interface TaikoSheetSyncTarget {
  resetPlaybackTime: () => void;
  updatePlaybackTime: (currentTime: number) => void;
}

interface TaikoRenderBridgeConfig {
  displayOpts: DisplayOpts;
  onCallResponseOverlayChange?: (text: string | null) => void;
  stage: FantasyStage | null;
  useRhythmNotation: boolean;
}

type OverlayMarker = {
  text: string;
  time: number;
};

export class TaikoRenderBridge {
  private renderer: FantasyPIXIInstance | null = null;
  private sheetTarget: TaikoSheetSyncTarget | null = null;
  private stage: FantasyStage | null = null;
  private displayOpts: DisplayOpts = { lang: 'en', simple: false };
  private useRhythmNotation = false;
  private onCallResponseOverlayChange?: (text: string | null) => void;

  private taikoNotes: TaikoNote[] = [];
  private currentNoteIndex = 0;
  private awaitingLoopStart = false;
  private taikoLoopCycle = 0;
  private preHitNoteIndices: number[] = [];
  private isCombiningMode = false;
  private combinedSections: CombinedSection[] = [];
  private currentSectionIndex = 0;

  private overlayMarkers: OverlayMarker[] = [];
  private displayNameCache = new Map<string, string[]>();
  private workBuffer: TaikoDisplayNote[] = [];
  private emptyBuffer: TaikoDisplayNote[] = [];
  private preHitFlags = new Uint8Array(256);
  private lastPreHitRef: number[] | null = null;
  private lastDisplayNorm = -1;
  private displayWrapPending = false;
  private wrapAtLoopCycle = -1;
  private lastKnownLoopCycle = -1;
  private lastSentEmpty = false;
  private lastCrPhase: string | null = null;
  private lastOverlayLabel: string | null = null;
  private crOverlayTimer: ReturnType<typeof setTimeout> | null = null;

  attachRenderer(renderer: FantasyPIXIInstance | null): void {
    if (this.renderer && this.renderer !== renderer) {
      this.renderer.setTaikoFrameCallback(null);
      this.renderer.updateTaikoNotes(this.emptyBuffer);
      this.renderer.updateOverlayText(null);
    }

    this.renderer = renderer;
    this.updateRendererBinding();
  }

  attachSheetTarget(target: TaikoSheetSyncTarget | null): void {
    this.sheetTarget = target;
    if (!target) {
      return;
    }

    target.resetPlaybackTime();
  }

  configure(config: TaikoRenderBridgeConfig): void {
    const stageChanged = this.stage !== config.stage;
    const displayChanged =
      this.displayOpts.lang !== config.displayOpts.lang ||
      this.displayOpts.simple !== config.displayOpts.simple;
    const rhythmChanged = this.useRhythmNotation !== config.useRhythmNotation;

    this.stage = config.stage;
    this.displayOpts = config.displayOpts;
    this.useRhythmNotation = config.useRhythmNotation;
    this.onCallResponseOverlayChange = config.onCallResponseOverlayChange;

    if (stageChanged || displayChanged || rhythmChanged) {
      this.displayNameCache.clear();
    }

    if (stageChanged) {
      this.overlayMarkers = this.buildOverlayMarkers(config.stage);
      this.resetLoopState();
    }

    this.updateRendererBinding();
  }

  syncGameState(state: FantasyGameState): void {
    this.taikoNotes = state.taikoNotes;
    this.currentNoteIndex = state.currentNoteIndex;
    this.awaitingLoopStart = state.awaitingLoopStart;
    this.taikoLoopCycle = state.taikoLoopCycle;
    this.preHitNoteIndices = state.preHitNoteIndices;
    this.isCombiningMode = state.isCombiningMode;
    this.combinedSections = state.combinedSections;
    this.currentSectionIndex = state.currentSectionIndex;
    this.updateRendererBinding(state.isTaikoMode);

    if (!state.isTaikoMode) {
      this.clearVisuals();
    }
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.setTaikoFrameCallback(null);
      this.renderer.updateTaikoNotes(this.emptyBuffer);
      this.renderer.updateOverlayText(null);
    }
    this.clearCallResponseOverlay();
    this.renderer = null;
    this.sheetTarget = null;
  }

  private updateRendererBinding(isTaikoMode?: boolean): void {
    if (!this.renderer) {
      return;
    }

    const shouldRun = (typeof isTaikoMode === 'boolean' ? isTaikoMode : this.taikoNotes.length > 0) && this.stage !== null;
    this.renderer.setTaikoFrameCallback(shouldRun ? this.runFrame : null);
    if (!shouldRun) {
      this.renderer.updateTaikoNotes(this.emptyBuffer);
      this.renderer.updateOverlayText(null);
      this.sheetTarget?.resetPlaybackTime();
    }
  }

  private clearVisuals(): void {
    this.lastSentEmpty = false;
    this.lastOverlayLabel = null;
    this.lastCrPhase = null;
    this.renderer?.updateTaikoNotes(this.emptyBuffer);
    this.renderer?.updateOverlayText(null);
    this.sheetTarget?.resetPlaybackTime();
    this.clearCallResponseOverlay();
  }

  private clearCallResponseOverlay(): void {
    if (this.crOverlayTimer) {
      clearTimeout(this.crOverlayTimer);
      this.crOverlayTimer = null;
    }
    this.onCallResponseOverlayChange?.(null);
  }

  private resetLoopState(): void {
    this.lastDisplayNorm = -1;
    this.displayWrapPending = false;
    this.wrapAtLoopCycle = -1;
    this.lastKnownLoopCycle = -1;
    this.lastSentEmpty = false;
    this.lastCrPhase = null;
    this.lastOverlayLabel = null;
    this.lastPreHitRef = null;
    this.clearCallResponseOverlay();
  }

  private buildOverlayMarkers(stage: FantasyStage | null): OverlayMarker[] {
    if (!stage || !Array.isArray(stage.chordProgressionData)) {
      return [];
    }

    const secPerBeat = 60 / (stage.bpm || 120);
    const secPerMeasure = secPerBeat * (stage.timeSignature || 4);
    const data = stage.chordProgressionData.filter((item): item is {
      bar: number;
      beats?: number;
      lyricDisplay?: string | null;
      text?: string;
    } => typeof item === 'object' && item !== null && 'bar' in item);
    const markers: OverlayMarker[] = [];
    let lastLyricDisplay: string | null = null;

    const sortedData = [...data].sort((a, b) => {
      const timeA = (a.bar - 1) * secPerMeasure + ((a.beats ?? 1) - 1) * secPerBeat;
      const timeB = (b.bar - 1) * secPerMeasure + ((b.beats ?? 1) - 1) * secPerBeat;
      return timeA - timeB;
    });

    for (const item of sortedData) {
      const time = (item.bar - 1) * secPerMeasure + ((item.beats ?? 1) - 1) * secPerBeat;
      if (item.lyricDisplay && item.lyricDisplay !== lastLyricDisplay) {
        markers.push({ time, text: item.lyricDisplay });
        lastLyricDisplay = item.lyricDisplay;
        continue;
      }
      if (!item.lyricDisplay && typeof item.text === 'string' && item.text.trim() !== '') {
        markers.push({ time, text: item.text });
      }
    }

    return markers;
  }

  private getDisplayNoteNames(note: TaikoNote): string[] {
    const cached = this.displayNameCache.get(note.id);
    if (cached) {
      return cached;
    }

    const stageMode = this.stage?.mode;
    const useChordNameOnNotes =
      stageMode === 'progression_order' ||
      stageMode === 'progression_random' ||
      stageMode === 'progression';

    const result = useChordNameOnNotes
      ? [note.chord.displayName]
      : note.chord.noteNames.map((noteName) => toDisplayName(noteName, this.displayOpts));

    this.displayNameCache.set(note.id, result);
    return result;
  }

  private rebuildPreHitFlags(indices: number[]): void {
    if (indices.length === 0) {
      if (this.lastPreHitRef && this.lastPreHitRef.length > 0) {
        this.preHitFlags.fill(0);
      }
      this.lastPreHitRef = indices;
      return;
    }

    const maxIndex = indices[indices.length - 1];
    if (maxIndex >= this.preHitFlags.length) {
      this.preHitFlags = new Uint8Array(Math.max(maxIndex + 64, this.preHitFlags.length * 2));
    } else {
      this.preHitFlags.fill(0);
    }

    for (let index = 0; index < indices.length; index += 1) {
      this.preHitFlags[indices[index]] = 1;
    }
    this.lastPreHitRef = indices;
  }

  private emitCallResponseOverlay(text: string): void {
    this.onCallResponseOverlayChange?.(text);
    if (this.crOverlayTimer) {
      clearTimeout(this.crOverlayTimer);
    }
    this.crOverlayTimer = setTimeout(() => {
      this.onCallResponseOverlayChange?.(null);
      this.crOverlayTimer = null;
    }, 1500);
  }

  private updateOverlayLabel(currentTime: number, loopDuration: number): void {
    if (!this.renderer) {
      return;
    }

    if (this.overlayMarkers.length === 0) {
      if (this.lastOverlayLabel !== null) {
        this.lastOverlayLabel = null;
        this.renderer.updateOverlayText(null);
      }
      return;
    }

    const normalizedTime = currentTime < 0 ? 0 : ((currentTime % loopDuration) + loopDuration) % loopDuration;
    let label = this.overlayMarkers[this.overlayMarkers.length - 1].text;

    for (let index = 0; index < this.overlayMarkers.length; index += 1) {
      const current = this.overlayMarkers[index];
      const next = this.overlayMarkers[index + 1];
      if (normalizedTime >= current.time && (!next || normalizedTime < next.time)) {
        label = current.text;
        break;
      }
      if (normalizedTime < this.overlayMarkers[0].time) {
        label = this.overlayMarkers[this.overlayMarkers.length - 1].text;
      }
    }

    if (label !== this.lastOverlayLabel) {
      this.lastOverlayLabel = label;
      this.renderer.updateOverlayText(label || null);
    }
  }

  private pushDisplayNote(note: TaikoNote, id: string, x: number, hideNames: boolean): void {
    const targetIndex = this.workBuffer.length;
    const noteNames = hideNames ? [] : this.getDisplayNoteNames(note);
    const existing = this.workBuffer[targetIndex];
    if (existing) {
      existing.id = id;
      existing.chord = note.chord.displayName;
      existing.x = x;
      existing.noteNames = noteNames;
    } else {
      this.workBuffer.push({
        id,
        chord: note.chord.displayName,
        x,
        noteNames,
      });
    }
  }

  private runFrame = (): void => {
    if (!this.renderer || !this.stage) {
      return;
    }

    const currentTime = bgmManager.getCurrentMusicTime();
    this.sheetTarget?.updatePlaybackTime(currentTime);

    const taikoNotes = this.taikoNotes;
    const stageData = this.stage;
    const preHitIndices = this.preHitNoteIndices || [];
    if (preHitIndices !== this.lastPreHitRef) {
      this.rebuildPreHitFlags(preHitIndices);
    }

    if (taikoNotes.length === 0) {
      if (!this.lastSentEmpty) {
        this.renderer.updateTaikoNotes(this.emptyBuffer);
        this.lastSentEmpty = true;
      }
      if (this.lastOverlayLabel !== null) {
        this.lastOverlayLabel = null;
        this.renderer.updateOverlayText(null);
      }
      return;
    }

    const secPerBeat = 60 / (stageData.bpm || 120);
    const secPerMeasure = secPerBeat * (stageData.timeSignature || 4);
    const countInSec = (stageData.countInMeasures || 0) * secPerMeasure;
    const actualEnd = bgmManager.getActualLoopEnd();
    const hasCountInLoop = bgmManager.getLoopIncludesCountIn();
    const loopDuration = hasCountInLoop && actualEnd > 0
      ? actualEnd - countInSec
      : (stageData.measureCount || 8) * secPerMeasure;
    const judgeLinePos = this.renderer.getJudgeLinePosition();
    const lookAheadTime = 4;
    const noteSpeed = 200;
    const crListenBars =
      stageData.callResponseEnabled && stageData.callResponseMode !== 'alternating'
        ? stageData.callResponseListenBars
        : undefined;
    const crPlayBars =
      stageData.callResponseEnabled && stageData.callResponseMode !== 'alternating'
        ? stageData.callResponsePlayBars
        : undefined;
    const isAlternatingCR = stageData.callResponseEnabled && stageData.callResponseMode === 'alternating';

    this.workBuffer.length = 0;

    if (currentTime < -0.01) {
      this.lastDisplayNorm = -1;
      this.displayWrapPending = false;
      const startIndex = this.isCombiningMode ? combiningSync.noteStartIndex : 0;
      const endIndex = this.isCombiningMode ? combiningSync.noteEndIndex : taikoNotes.length;

      for (let index = startIndex; index < endIndex; index += 1) {
        const note = taikoNotes[index];
        if (!note) {
          continue;
        }
        if (note.isHit || (index < this.preHitFlags.length && this.preHitFlags[index])) {
          continue;
        }
        const timeUntilHit = note.hitTime - currentTime;
        if (timeUntilHit > lookAheadTime) {
          break;
        }
        if (timeUntilHit >= -0.5) {
          this.pushDisplayNote(
            note,
            note.id,
            judgeLinePos.x + timeUntilHit * noteSpeed,
            Boolean(this.useRhythmNotation && stageData.callResponseEnabled)
          );
        }
      }

      this.lastSentEmpty = false;
      this.renderer.updateTaikoNotes(this.workBuffer);
      return;
    }

    if (combiningSync.active) {
      const section = this.combinedSections[combiningSync.sectionIndex];
      if (section) {
        const isAwaitingLoop = this.awaitingLoopStart;

        if (!isAwaitingLoop) {
          for (let index = combiningSync.noteStartIndex; index < combiningSync.noteEndIndex; index += 1) {
            const note = taikoNotes[index];
            if (!note || note.isHit) {
              continue;
            }
            if (!note.isMissed && index < this.currentNoteIndex) {
              continue;
            }
            const timeUntilHit = note.hitTime - currentTime;
            if (timeUntilHit < -0.35) {
              continue;
            }
            if (timeUntilHit > lookAheadTime) {
              break;
            }
            this.pushDisplayNote(
              note,
              note.id,
              judgeLinePos.x + timeUntilHit * noteSpeed,
              Boolean(this.useRhythmNotation && section.callResponseMode)
            );
          }
        }

        const sectionSecPerMeasure = (60 / section.bpm) * section.timeSignature;
        const sectionPlayDuration = section.measureCount * sectionSecPerMeasure;
        const timeToSectionEnd = sectionPlayDuration - currentTime;
        const nextSectionIndex = this.currentSectionIndex + 1;

        if (timeToSectionEnd < lookAheadTime && nextSectionIndex < this.combinedSections.length) {
          const nextSection = this.combinedSections[nextSectionIndex];
          if (nextSection) {
            const nextCountInSec = nextSection.countInMeasures * (60 / nextSection.bpm) * nextSection.timeSignature;
            const nextStartIndex = nextSection.globalNoteStartIndex;
            for (let index = nextStartIndex; index < taikoNotes.length; index += 1) {
              const note = taikoNotes[index];
              if (!note || note.isHit) {
                continue;
              }
              const virtualTime = timeToSectionEnd + nextCountInSec + note.hitTime;
              if (virtualTime > lookAheadTime) {
                break;
              }
              if (virtualTime < -0.35) {
                continue;
              }
              this.pushDisplayNote(
                note,
                `next_${note.id}`,
                judgeLinePos.x + virtualTime * noteSpeed,
                Boolean(this.useRhythmNotation && nextSection.callResponseMode)
              );
            }
          }
        }

        this.lastSentEmpty = false;
        this.renderer.updateTaikoNotes(this.workBuffer);
        if (section.callResponseMode === 'alternating') {
          const totalPlay = this.taikoLoopCycle * (section.sectionRepeatCount ?? 1) + (section.repeatIndex ?? 0);
          const altPhase = totalPlay % 2 === 0 ? 'listen' : 'play';
          if (altPhase !== this.lastCrPhase) {
            this.emitCallResponseOverlay(altPhase === 'listen' ? 'Listen...' : 'Your Turn!');
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
            this.emitCallResponseOverlay(crPhase === 'listen' ? 'Listen...' : 'Your Turn!');
          }
          this.lastCrPhase = crPhase;
        }
        if (this.lastOverlayLabel !== null) {
          this.lastOverlayLabel = null;
          this.renderer.updateOverlayText(null);
        }
        return;
      }
    }

    const normalizedTime = currentTime < 0 ? 0 : ((currentTime % loopDuration) + loopDuration) % loopDuration;
    const preCheckCycle = this.lastKnownLoopCycle;
    this.lastKnownLoopCycle = this.taikoLoopCycle;

    if (this.lastDisplayNorm >= 0 && this.lastDisplayNorm - normalizedTime > loopDuration * 0.5) {
      this.displayWrapPending = true;
      this.wrapAtLoopCycle = preCheckCycle;
    }
    this.lastDisplayNorm = normalizedTime;

    if (this.displayWrapPending && this.taikoLoopCycle > this.wrapAtLoopCycle) {
      this.displayWrapPending = false;
    }

    const currentNoteIndex = this.displayWrapPending ? 0 : this.currentNoteIndex;
    const isAwaitingLoop = this.displayWrapPending ? false : this.awaitingLoopStart;

    if (!isAwaitingLoop) {
      const lowerBound = -0.35;
      for (let index = 0; index < taikoNotes.length; index += 1) {
        const note = taikoNotes[index];
        if (note.isHit) {
          continue;
        }

        if (note.isMissed) {
          const timeUntilHit = note.hitTime - normalizedTime;
          if (timeUntilHit >= lowerBound && timeUntilHit <= lookAheadTime) {
            this.pushDisplayNote(
              note,
              note.id,
              judgeLinePos.x + timeUntilHit * noteSpeed,
              Boolean(this.useRhythmNotation && stageData.callResponseEnabled)
            );
          }
          continue;
        }

        if (index < currentNoteIndex) {
          continue;
        }

        const timeUntilHit = note.hitTime - normalizedTime;
        if (timeUntilHit >= lowerBound && timeUntilHit <= lookAheadTime) {
          this.pushDisplayNote(
            note,
            note.id,
            judgeLinePos.x + timeUntilHit * noteSpeed,
            Boolean(this.useRhythmNotation && stageData.callResponseEnabled)
          );
        }
      }
    }

    const timeToLoop = loopDuration - normalizedTime;
    const shouldShowNextLoopPreview = stageData.mode !== 'progression_order' && (isAwaitingLoop || timeToLoop < lookAheadTime);
    if (shouldShowNextLoopPreview && taikoNotes.length > 0) {
      const baseLength = this.workBuffer.length;
      for (let index = 0; index < taikoNotes.length; index += 1) {
        const note = taikoNotes[index];
        let isDuplicate = false;
        for (let bufferIndex = 0; bufferIndex < baseLength; bufferIndex += 1) {
          if (this.workBuffer[bufferIndex].id === note.id) {
            isDuplicate = true;
            break;
          }
        }
        if (isDuplicate || (index < this.preHitFlags.length && this.preHitFlags[index])) {
          continue;
        }

        const virtualHitTime = note.hitTime + loopDuration;
        const timeUntilHit = virtualHitTime - normalizedTime;
        if (timeUntilHit <= 0) {
          continue;
        }
        if (timeUntilHit > timeToLoop + lookAheadTime) {
          break;
        }

        this.pushDisplayNote(
          note,
          `${note.id}_loop`,
          judgeLinePos.x + timeUntilHit * noteSpeed,
          Boolean(this.useRhythmNotation && stageData.callResponseEnabled)
        );
      }
    }

    if (isAlternatingCR) {
      const isListenCycle = this.taikoLoopCycle % 2 === 0;
      if (isListenCycle) {
        if (!this.lastSentEmpty) {
          this.renderer.updateTaikoNotes(this.emptyBuffer);
          this.lastSentEmpty = true;
        }
      } else {
        this.lastSentEmpty = false;
        this.renderer.updateTaikoNotes(this.workBuffer);
      }

      const phase = isListenCycle ? 'listen' : 'play';
      if (phase !== this.lastCrPhase) {
        this.emitCallResponseOverlay(isListenCycle ? 'Listen...' : 'Your Turn!');
        this.lastCrPhase = phase;
      }
    } else {
      this.lastSentEmpty = false;
      this.renderer.updateTaikoNotes(this.workBuffer);
      if (crListenBars && crPlayBars) {
        const currentBar = Math.floor(normalizedTime / secPerMeasure) + 1;
        let phase: string | null = null;
        if (currentBar >= crListenBars[0] && currentBar <= crListenBars[1]) {
          phase = 'listen';
        } else if (currentBar >= crPlayBars[0] && currentBar <= crPlayBars[1]) {
          phase = 'play';
        }
        if (phase && phase !== this.lastCrPhase) {
          this.emitCallResponseOverlay(phase === 'listen' ? 'Listen...' : 'Your Turn!');
        }
        this.lastCrPhase = phase;
      }
    }

    this.updateOverlayLabel(currentTime, loopDuration);
  };
}
