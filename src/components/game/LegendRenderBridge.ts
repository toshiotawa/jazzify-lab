import type { LegendSharedNotesReader } from '@/legend/LegendSharedNotesBuffer';
import type { PIXINotesRendererInstance } from './PIXINotesRenderer';

export class LegendRenderBridge {
  private renderer: PIXINotesRendererInstance | null = null;
  private reader: LegendSharedNotesReader | null = null;
  private rafId: number | null = null;
  private lastFrameId: number = -1;

  attachRenderer(renderer: PIXINotesRendererInstance | null): void {
    this.renderer = renderer;
    this.updateLoopState();
  }

  attachReader(reader: LegendSharedNotesReader | null): void {
    this.reader = reader;
    this.lastFrameId = -1;
    this.updateLoopState();
  }

  sync(): void {
    this.flushFrame();
  }

  dispose(): void {
    this.stopLoop();
    this.renderer = null;
    this.reader = null;
  }

  private updateLoopState(): void {
    if (this.renderer && this.reader) {
      if (this.rafId === null) {
        this.startLoop();
      }
    } else {
      this.stopLoop();
    }
  }

  private startLoop(): void {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      this.flushFrame();
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private flushFrame(): void {
    if (!this.renderer || !this.reader) {
      return;
    }
    const frame = this.reader.readFrame();
    if (!frame || frame.frameId === this.lastFrameId) {
      return;
    }
    this.lastFrameId = frame.frameId;
    this.renderer.updateNotes(frame.activeNotes, frame.currentTime);
  }
}
