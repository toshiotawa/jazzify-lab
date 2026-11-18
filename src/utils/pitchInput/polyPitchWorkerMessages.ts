const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
);

const isDiagLevels = (value: unknown): value is number[][] => {
  if (!Array.isArray(value)) return false;
  return value.every((row) => Array.isArray(row)
    && row.every((cell) => typeof cell === 'number'));
};

export interface PolyPitchWorkerOutbound {
  readonly type: string;
  readonly note?: number;
  readonly message?: string;
  readonly audioContextTime?: number;
  readonly level?: number;
  readonly kernel?: string | null;
  readonly sampleRate?: number;
  readonly levels?: number[][];
  readonly inputDb?: number | null;
}

export const parsePolyPitchWorkerMessage = (data: unknown): PolyPitchWorkerOutbound | null => {
  if (!isRecord(data) || typeof data.type !== 'string') return null;
  return {
    type: data.type,
    note: typeof data.note === 'number' ? data.note : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
    audioContextTime: typeof data.audioContextTime === 'number' ? data.audioContextTime : undefined,
    level: typeof data.level === 'number' ? data.level : undefined,
    kernel: typeof data.kernel === 'string' ? data.kernel : data.kernel === null ? null : undefined,
    sampleRate: typeof data.sampleRate === 'number' ? data.sampleRate : undefined,
    levels: isDiagLevels(data.levels) ? data.levels : undefined,
    inputDb: typeof data.inputDb === 'number' ? data.inputDb : data.inputDb === null ? null : undefined,
  };
};