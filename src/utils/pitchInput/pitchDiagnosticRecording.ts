interface DiagnosticEntry {
  elapsedMs: number;
  event: string;
  details: object;
}

const RECORDING_CAPACITY = 6000;

// Bounded history shared by input sessions; recording survives settings/game unmounts.
class PitchDiagnosticRecording {
  private entries: DiagnosticEntry[] = [];
  private writeIndex = 0;
  private totalEntries = 0;
  private startedAt = 0;
  private startedAtIso: string | null = null;
  enabled = false;

  get hasRecording(): boolean {
    return this.startedAtIso !== null;
  }

  start(): void {
    this.entries = [];
    this.writeIndex = 0;
    this.totalEntries = 0;
    this.startedAt = performance.now();
    this.startedAtIso = new Date().toISOString();
    this.enabled = true;
    this.record('recordingStarted', {
      userAgent: navigator.userAgent,
      route: window.location.pathname + window.location.hash.split('?')[0],
    });
  }

  stop(): void {
    this.record('recordingStopped');
    this.enabled = false;
  }

  record(event: string, details: object = {}): void {
    if (!this.enabled) return;
    const entry = { elapsedMs: performance.now() - this.startedAt, event, details };
    if (this.entries.length < RECORDING_CAPACITY) {
      this.entries.push(entry);
    } else {
      this.entries[this.writeIndex] = entry;
    }
    this.writeIndex = (this.writeIndex + 1) % RECORDING_CAPACITY;
    this.totalEntries += 1;
  }

  snapshot() {
    const entries: DiagnosticEntry[] = [];
    const start = this.entries.length < RECORDING_CAPACITY ? 0 : this.writeIndex;
    for (let index = 0; index < this.entries.length; index += 1) {
      const entry = this.entries[(start + index) % this.entries.length];
      if (entry) entries.push(entry);
    }
    return {
      version: 1,
      startedAt: this.startedAtIso,
      exportedAt: new Date().toISOString(),
      elapsedMs: this.startedAtIso ? performance.now() - this.startedAt : 0,
      recording: this.enabled,
      overwrittenEntries: Math.max(0, this.totalEntries - RECORDING_CAPACITY),
      entries,
    };
  }

  download(): void {
    const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pitch-diagnostics-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export const pitchDiagnosticRecording = new PitchDiagnosticRecording();
