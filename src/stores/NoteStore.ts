/**
 * ノーツデータ管理ストア
 */

export interface Note {
  bar: number;
  beat: number;
  type: 'don' | 'kat' | 'long';
  duration?: number; // for long notes
}

export class NoteStore {
  private notes: Note[] = [];
  
  constructor() {
    this.notes = [];
  }
  
  /**
   * 譜面データから初期化
   */
  init(scoreData: any): void {
    // scoreDataから notes を生成
    this.notes = [];
    if (scoreData.notes) {
      this.notes = [...scoreData.notes];
    }
  }
  
  /**
   * 指定された小節のノーツを取得
   */
  getNotesForBar(bar: number): Note[] {
    return this.notes.filter(note => note.bar === bar);
  }
  
  /**
   * 全ノーツを取得
   */
  getAllNotes(): Note[] {
    return [...this.notes];
  }
  
  /**
   * ノーツを追加
   */
  addNote(note: Note): void {
    this.notes.push(note);
  }
  
  /**
   * ストアの破棄（メモリクリーンアップ）
   */
  dispose(): void {
    this.notes.length = 0;
  }
}