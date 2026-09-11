export interface VoiceInputDebugSnapshot {
  readonly midi: number;
  readonly matched: boolean;
  readonly detail: string;
  readonly atMs: number;
}

export const createVoiceInputDebugSnapshot = (
  midi: number,
  matched: boolean,
  detail: string,
): VoiceInputDebugSnapshot => ({
  midi,
  matched,
  detail,
  atMs: performance.now(),
});
