/**
 * NoteGenerator - 譜面データの生成
 */
export interface ScoreData {
  progression?: string[];
  progressionData?: ProgressionDataItem[];
}

export interface ProgressionDataItem {
  bar: number;
  beats: number;
  chord: string;
}

export class NoteGenerator {
  private data: ScoreData;
  
  constructor(data: ScoreData) {
    this.data = data;
  }
  
  /**
   * 指定小節のノーツを生成
   * @param bar 小節番号（1始まり）
   */
  generate(bar: number): any[] {
    // 基本版 - progressionから生成
    if (this.data.progression) {
      const idx = (bar - 1) % this.data.progression.length;
      const chord = this.data.progression[idx];
      
      // 小節の頭にコードを配置
      return [{
        bar,
        beats: 1,
        chord
      }];
    }
    
    // 拡張版 - progressionDataから生成
    if (this.data.progressionData) {
      return this.data.progressionData.filter(d => d.bar === bar);
    }
    
    return [];
  }
  
  /**
   * 全小節のノーツを生成
   * @param measureCount 小節数
   */
  generateAll(measureCount: number): any[] {
    const notes: any[] = [];
    
    for (let bar = 1; bar <= measureCount; bar++) {
      const barNotes = this.generate(bar);
      notes.push(...barNotes);
    }
    
    return notes;
  }
  
  /**
   * データを更新
   */
  setData(data: ScoreData): void {
    this.data = data;
  }
}