/**
 * NoteStore - ノーツデータの管理
 */
export class NoteStore {
  private notes: any[] = [];
  
  constructor() {
    this.notes = [];
  }
  
  /**
   * ノーツデータを初期化
   */
  init(scoreData: any): void {
    this.dispose();
    
    // scoreDataからノーツを生成
    if (scoreData && scoreData.notes) {
      this.notes = [...scoreData.notes];
    }
  }
  
  /**
   * ノーツデータを取得
   */
  getNotes(): any[] {
    return this.notes;
  }
  
  /**
   * ノーツデータをクリア
   */
  dispose(): void {
    this.notes.length = 0;
  }
  
  /**
   * ノーツの追加
   */
  addNote(note: any): void {
    this.notes.push(note);
  }
  
  /**
   * 特定のノーツを削除
   */
  removeNote(noteId: string): void {
    const index = this.notes.findIndex(note => note.id === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
    }
  }
}