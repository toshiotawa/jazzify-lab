/**
 * iOS `SurvivalInputBuffer.swift` と同型。1 フレーム分の note-on/off をまとめて drain する。
 */
export interface SurvivalFrameInput {
  readonly noteOns: readonly { readonly midi: number; readonly velocity: number }[];
  readonly noteOffs: readonly number[];
}

export class SurvivalInputBuffer {
  private noteOnQueue: { midi: number; velocity: number }[] = [];
  private noteOffQueue: number[] = [];

  enqueueNoteOn(midi: number, velocity = 100): void {
    this.noteOnQueue.push({ midi, velocity });
  }

  enqueueNoteOff(midi: number): void {
    this.noteOffQueue.push(midi);
  }

  clear(): void {
    this.noteOnQueue.length = 0;
    this.noteOffQueue.length = 0;
  }

  drain(): SurvivalFrameInput {
    const frame: SurvivalFrameInput = {
      noteOns: this.noteOnQueue,
      noteOffs: this.noteOffQueue,
    };
    this.noteOnQueue = [];
    this.noteOffQueue = [];
    return frame;
  }
}

/** 同一 drain 内の同一 pitch class 重複 note-on を除去（先頭のみ採用）。 */
export function dedupeFrameNoteOnsByPitchClass(
  noteOns: readonly { readonly midi: number; readonly velocity: number }[],
): readonly { readonly midi: number; readonly velocity: number }[] {
  const seen = new Set<number>();
  const out: { midi: number; velocity: number }[] = [];
  for (const on of noteOns) {
    const pc = ((on.midi % 12) + 12) % 12;
    if (seen.has(pc)) continue;
    seen.add(pc);
    out.push(on);
  }
  return out;
}
