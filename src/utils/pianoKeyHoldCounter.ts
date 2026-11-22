/**
 * 同一 MIDI を複数ポインタが押しているとき、最初の押下でのみ noteOn、
 * 最後の離鍵でのみ noteOff を発火する。
 */
export class PianoKeyHoldCounter {
  private readonly counts = new Map<number, number>();

  press(midi: number): boolean {
    const rounded = Math.round(midi);
    const prev = this.counts.get(rounded) ?? 0;
    this.counts.set(rounded, prev + 1);
    return prev === 0;
  }

  release(midi: number): boolean {
    const rounded = Math.round(midi);
    const prev = this.counts.get(rounded) ?? 0;
    if (prev <= 1) {
      this.counts.delete(rounded);
      return prev > 0;
    }
    this.counts.set(rounded, prev - 1);
    return false;
  }

  clear(): void {
    this.counts.clear();
  }
}