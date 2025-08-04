/**
 * ノーツ生成クラス
 * 基本版（progression）と拡張版（progressionData）の両方をサポート
 */

import { Note } from '../stores/NoteStore';

export interface ProgressionPattern {
  bar: number;
  notes: Note[];
}

export interface NoteGeneratorData {
  // 基本版: 繰り返しパターン
  progression?: string[][];
  
  // 拡張版: 小節ごとの詳細データ
  progressionData?: ProgressionPattern[];
}

export class NoteGenerator {
  private data: NoteGeneratorData;
  
  constructor(data: NoteGeneratorData) {
    this.data = data;
  }
  
  /**
   * 指定された小節のノーツを生成
   * @param bar 小節番号（1始まり）
   * @returns 生成されたノーツの配列
   */
  generate(bar: number): Note[] {
    // 拡張版が優先
    if (this.data.progressionData) {
      return this.generateFromProgressionData(bar);
    }
    
    // 基本版にフォールバック
    if (this.data.progression) {
      return this.generateFromProgression(bar);
    }
    
    return [];
  }
  
  /**
   * 基本版: progression配列から生成
   */
  private generateFromProgression(bar: number): Note[] {
    if (!this.data.progression || this.data.progression.length === 0) {
      return [];
    }
    
    // 繰り返しパターンのインデックスを計算
    const idx = (bar - 1) % this.data.progression.length;
    const pattern = this.data.progression[idx];
    
    if (!pattern) return [];
    
    // パターンからノーツを生成
    const notes: Note[] = [];
    pattern.forEach((noteStr, beatIndex) => {
      if (noteStr && noteStr !== '') {
        const note: Note = {
          bar: bar,
          beat: beatIndex + 1,
          type: this.parseNoteType(noteStr)
        };
        
        // ロングノーツの場合は duration を設定
        if (note.type === 'long') {
          note.duration = this.parseDuration(noteStr);
        }
        
        notes.push(note);
      }
    });
    
    return notes;
  }
  
  /**
   * 拡張版: progressionDataから生成
   */
  private generateFromProgressionData(bar: number): Note[] {
    if (!this.data.progressionData) {
      return [];
    }
    
    // 指定された小節のデータを検索
    const barData = this.data.progressionData.filter(d => d.bar === bar);
    
    if (barData.length === 0) return [];
    
    // 全てのノーツを結合
    const notes: Note[] = [];
    barData.forEach(data => {
      if (data.notes) {
        notes.push(...data.notes);
      }
    });
    
    return notes;
  }
  
  /**
   * ノーツタイプを解析
   */
  private parseNoteType(noteStr: string): 'don' | 'kat' | 'long' {
    const lowerStr = noteStr.toLowerCase();
    if (lowerStr.includes('don') || lowerStr === 'd') {
      return 'don';
    } else if (lowerStr.includes('kat') || lowerStr === 'k') {
      return 'kat';
    } else if (lowerStr.includes('long') || lowerStr === 'l') {
      return 'long';
    }
    
    // デフォルトは don
    return 'don';
  }
  
  /**
   * ロングノーツの長さを解析
   */
  private parseDuration(noteStr: string): number {
    // 例: "long:2" -> 2拍分
    const match = noteStr.match(/long:(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // デフォルトは1拍
    return 1;
  }
  
  /**
   * 全小節分のノーツを一度に生成
   */
  generateAll(measureCount: number): Note[] {
    const allNotes: Note[] = [];
    
    for (let bar = 1; bar <= measureCount; bar++) {
      const barNotes = this.generate(bar);
      allNotes.push(...barNotes);
    }
    
    return allNotes;
  }
  
  /**
   * データを更新
   */
  updateData(data: NoteGeneratorData): void {
    this.data = data;
  }
}