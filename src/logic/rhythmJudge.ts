import { Note } from '../constants/rhythm';
import { JUDGE_WINDOW_MS } from '../constants/rhythm';

export type JudgeResult = 'success' | 'miss' | 'too_early' | 'too_late';

export interface JudgeDetails {
  result: JudgeResult;
  timingDiff: number; // ミリ秒単位の誤差（早い場合は負、遅い場合は正）
  noteId: string;
}

/**
 * ノーツの判定を行う
 * @param note 判定対象のノーツ
 * @param inputChord 入力されたコード
 * @param inputTimeMs 入力時刻（ミリ秒）
 * @returns 判定結果
 */
export function evaluateNote(
  note: Note,
  inputChord: string,
  inputTimeMs: number
): JudgeDetails {
  const timingDiff = inputTimeMs - note.hitTimeMs;
  const absDiff = Math.abs(timingDiff);

  // タイミングウィンドウ外
  if (absDiff > JUDGE_WINDOW_MS) {
    return {
      result: timingDiff < 0 ? 'too_early' : 'too_late',
      timingDiff,
      noteId: note.id,
    };
  }

  // タイミングは合っているがコードが違う
  if (inputChord !== note.chord) {
    return {
      result: 'miss',
      timingDiff,
      noteId: note.id,
    };
  }

  // 成功
  return {
    result: 'success',
    timingDiff,
    noteId: note.id,
  };
}

/**
 * 現在アクティブなノーツから最も近いノーツを探す
 * @param notes アクティブなノーツのリスト
 * @param currentTimeMs 現在時刻（ミリ秒）
 * @param activeNoteIds アクティブなノーツIDのセット
 * @returns 最も近いノーツ、または null
 */
export function findClosestNote(
  notes: Note[],
  currentTimeMs: number,
  activeNoteIds: Set<string>
): Note | null {
  const activeNotes = notes.filter(note => activeNoteIds.has(note.id));
  
  if (activeNotes.length === 0) {
    return null;
  }

  // 判定時刻が最も近いノーツを探す
  return activeNotes.reduce((closest, note) => {
    const closestDiff = Math.abs(closest.hitTimeMs - currentTimeMs);
    const noteDiff = Math.abs(note.hitTimeMs - currentTimeMs);
    return noteDiff < closestDiff ? note : closest;
  });
}

/**
 * 自動失敗判定のタイミングかどうかを判定
 * @param note ノーツ
 * @param currentTimeMs 現在時刻
 * @returns 自動失敗判定すべきかどうか
 */
export function shouldAutoFail(note: Note, currentTimeMs: number): boolean {
  // 判定時刻を200ms以上過ぎたら自動的に失敗とする
  return currentTimeMs > note.hitTimeMs + JUDGE_WINDOW_MS;
}

/**
 * ノーツリストから自動失敗すべきノーツを検出
 * @param notes ノーツリスト
 * @param currentTimeMs 現在時刻
 * @param activeNoteIds アクティブなノーツID
 * @returns 自動失敗すべきノーツのIDリスト
 */
export function detectAutoFailNotes(
  notes: Note[],
  currentTimeMs: number,
  activeNoteIds: Set<string>
): string[] {
  return notes
    .filter(note => activeNoteIds.has(note.id) && shouldAutoFail(note, currentTimeMs))
    .map(note => note.id);
}