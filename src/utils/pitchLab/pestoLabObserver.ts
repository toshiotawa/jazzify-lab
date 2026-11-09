import type { PolyPitchFrame } from './polyPitchTypes';
import type { PolyPitchSessionRecorder } from './polyPitchSession';

const performanceNowSec = (): number =>
  typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;

export class PestoLabObserver {
  private readonly activeNotes = new Set<number>();
  private sessionStartSec: number | null = null;
  private lastContentTimeSec = 0;

  constructor(
    private readonly recorder: PolyPitchSessionRecorder,
    private readonly onFrame?: (frame: PolyPitchFrame) => void,
  ) {}

  resetSessionClock(): void {
    this.sessionStartSec = performanceNowSec();
    this.activeNotes.clear();
    this.lastContentTimeSec = 0;
  }

  noteOn(note: number, domTimeStampMs?: number): void {
    this.ensureSession();
    const content =
      domTimeStampMs !== undefined && this.sessionStartSec !== null
        ? domTimeStampMs / 1000
        : this.lastContentTimeSec;
    this.activeNotes.add(note);
    this.emitFrame(content);
  }

  noteOff(note: number): void {
    this.activeNotes.delete(note);
    this.emitFrame(this.lastContentTimeSec);
  }

  tickContentTime(contentTimeSec: number): void {
    this.lastContentTimeSec = contentTimeSec;
    if (this.activeNotes.size > 0) {
      this.emitFrame(contentTimeSec);
    }
  }

  private ensureSession(): void {
    if (this.sessionStartSec === null) this.sessionStartSec = performanceNowSec();
  }

  private emitFrame(contentTimeSec: number): void {
    const emitTimeSec = performanceNowSec();
    const frame: PolyPitchFrame = {
      engineId: 'pesto',
      contentTimeSec,
      emitTimeSec,
      activeMidis: [...this.activeNotes].sort((a, b) => a - b),
    };
    this.recorder.append(frame);
    this.onFrame?.(frame);
  }
}
