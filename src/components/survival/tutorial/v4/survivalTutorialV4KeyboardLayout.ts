/**
 * 表示専用鍵盤のレイアウト計算(純粋)。
 * 白鍵は等幅、黒鍵は直前の白鍵と次の白鍵の境界に重ねる。
 */
const WHITE_PITCH_CLASSES: ReadonlySet<number> = new Set([0, 2, 4, 5, 7, 9, 11]);

export const isWhiteKey = (midi: number): boolean =>
  WHITE_PITCH_CLASSES.has(((midi % 12) + 12) % 12);

export interface KeyboardWhiteKey {
  readonly midi: number;
  /** 左から数えた白鍵インデックス(0始まり)。 */
  readonly whiteIndex: number;
}

export interface KeyboardBlackKey {
  readonly midi: number;
  /** この黒鍵の左隣の白鍵インデックス。 */
  readonly leftWhiteIndex: number;
}

export interface KeyboardLayout {
  readonly whites: readonly KeyboardWhiteKey[];
  readonly blacks: readonly KeyboardBlackKey[];
  readonly whiteCount: number;
}

const DEFAULT_RANGE = { startMidi: 36, endMidi: 84 } as const; // C2..C6
const MIN_SEMITONE_SPAN = 24;

export interface KeyboardRange {
  readonly startMidi: number;
  readonly endMidi: number;
}

/**
 * 与えられた MIDI 群を収める鍵盤レンジ(両端を C に丸め、最低2オクターブ確保)。
 * 空配列はデフォルト(C2..C6)。
 */
export const resolveSurvivalTutorialV4KeyboardRange = (
  midis: readonly number[],
): KeyboardRange => {
  if (midis.length === 0) return DEFAULT_RANGE;
  let min = midis[0];
  let max = midis[0];
  for (const midi of midis) {
    if (midi < min) min = midi;
    if (midi > max) max = midi;
  }
  const startMidi = Math.floor(min / 12) * 12;
  let endMidi = Math.ceil((max + 1) / 12) * 12;
  if (endMidi - startMidi < MIN_SEMITONE_SPAN) {
    endMidi = startMidi + MIN_SEMITONE_SPAN;
  }
  return { startMidi, endMidi };
};

export const buildSurvivalTutorialV4KeyboardLayout = (
  startMidi: number,
  endMidi: number,
): KeyboardLayout => {
  const whites: KeyboardWhiteKey[] = [];
  const blacks: KeyboardBlackKey[] = [];
  let whiteIndex = 0;
  for (let midi = startMidi; midi <= endMidi; midi += 1) {
    if (isWhiteKey(midi)) {
      whites.push({ midi, whiteIndex });
      whiteIndex += 1;
    } else if (whiteIndex > 0) {
      blacks.push({ midi, leftWhiteIndex: whiteIndex - 1 });
    }
  }
  return { whites, blacks, whiteCount: whiteIndex };
};
