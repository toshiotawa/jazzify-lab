/**
 * ProgressionProblemGenerator
 * リズムモードのプログレッションパターン用問題生成クラス
 * - コード進行を順番に出題
 * - 列数に応じた配置と自動オフセット
 * - 無限ループ対応
 */

import { ChordDefinition } from '@/types';
import { Timeline } from './Timeline';

export interface ProgressionProblemGeneratorOptions {
  chordProgression: string[];  // コード進行の配列
  timeline: Timeline;          // タイムライン管理
}

export interface ProgressionChord {
  chord: ChordDefinition;
  progressionIndex: number;  // プログレッション内のインデックス
  column: number;            // 列番号 (0-2 または 0-3)
}

export type ProgressionChangeCallback = (chords: ProgressionChord[]) => void;

export class ProgressionProblemGenerator {
  private chordProgression: string[];
  private timeline: Timeline;
  private isRunning = false;
  private globalIndex = 0;  // 全体でのコードインデックス
  private currentBar = -1;
  private progressionChangeCallbacks: ProgressionChangeCallback[] = [];
  private columnCount: number;
  
  constructor(options: ProgressionProblemGeneratorOptions) {
    this.chordProgression = options.chordProgression;
    this.timeline = options.timeline;
    this.columnCount = this.timeline.getTimeSig(); // 拍子が列数
  }
  
  /**
   * 生成開始
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.globalIndex = 0;
    this.currentBar = -1;
    
    // 拍ごとにチェック
    this.timeline.onBeat(this.handleBeat);
    
    // 初回コードを即座に生成
    this.generateInitialChords();
  }
  
  /**
   * 生成停止
   */
  stop(): void {
    this.isRunning = false;
    this.timeline.offBeat(this.handleBeat);
  }
  
  /**
   * コード変更コールバックを登録
   */
  onProgressionChange(callback: ProgressionChangeCallback): void {
    this.progressionChangeCallbacks.push(callback);
  }
  
  /**
   * コード変更コールバックを削除
   */
  offProgressionChange(callback: ProgressionChangeCallback): void {
    const index = this.progressionChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressionChangeCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 拍ハンドラ
   */
  private handleBeat = (barIdx: number, beatIdx: number): void => {
    if (!this.isRunning) return;
    
    // 小節の頭（beat 0）では何もしない
    // （個別のモンスター撃破時に次のコードを補充するため）
  };
  
  /**
   * 初回コードを生成
   */
  private generateInitialChords(): void {
    const chords: ProgressionChord[] = [];
    
    for (let col = 0; col < this.columnCount; col++) {
      const progressionChord = this.getChordAtGlobalIndex(this.globalIndex + col);
      chords.push(progressionChord);
    }
    
    // コールバック実行
    this.notifyProgressionChange(chords);
  }
  
  /**
   * 指定列に次のコードを補充
   */
  fillColumn(column: number): ProgressionChord {
    this.globalIndex++;
    const progressionChord = this.getChordAtGlobalIndex(
      this.globalIndex + this.columnCount - 1
    );
    
    // 列を指定された列に設定
    const chord: ProgressionChord = {
      ...progressionChord,
      column: column
    };
    
    return chord;
  }
  
  /**
   * グローバルインデックスからコードを取得（列オフセット込み）
   */
  private getChordAtGlobalIndex(globalIdx: number): ProgressionChord {
    const progression = this.chordProgression;
    const progLength = progression.length;
    const cols = this.columnCount;
    
    // プログレッション内のインデックス
    const progIndex = globalIdx % progLength;
    
    // 列オフセットを計算
    // 何周目かを計算
    const loopCount = Math.floor(globalIdx / progLength);
    
    // オフセット計算
    // 例: 4列、6コードの場合
    // 1周目: offset = 0
    // 2周目: offset = (6 % 4) = 2
    // 3周目: offset = (6 % 4) * 2 = 4 % 4 = 0
    const offset = (loopCount * (progLength % cols)) % cols;
    
    // 列番号を計算
    const baseColumn = globalIdx % cols;
    const column = (baseColumn + offset) % cols;
    
    // コード名を取得
    const chordName = progression[progIndex];
    
    // ChordDefinitionに変換
    const chord = this.parseChordName(chordName);
    
    return {
      chord,
      progressionIndex: progIndex,
      column
    };
  }
  
  /**
   * コード変更を通知
   */
  private notifyProgressionChange(chords: ProgressionChord[]): void {
    this.progressionChangeCallbacks.forEach(callback => {
      callback(chords);
    });
  }
  
  /**
   * コード名をChordDefinitionに変換
   * （RandomProblemGeneratorと同じ実装）
   */
  private parseChordName(chordName: string): ChordDefinition {
    // ルート音を抽出
    let root = '';
    let idx = 0;
    
    // シャープ/フラットを含むルート音を取得
    if (chordName.length > idx) {
      root = chordName[idx];
      idx++;
      if (chordName.length > idx && (chordName[idx] === '#' || chordName[idx] === 'b')) {
        root += chordName[idx];
        idx++;
      }
    }
    
    // 残りの部分（コードタイプ）
    const suffix = chordName.substring(idx);
    
    // コードタイプに基づいて構成音を決定
    const notes = this.getChordNotes(root, suffix);
    
    return {
      id: `chord-${Date.now()}-${Math.random()}`,
      name: chordName,
      notes: notes,
      root: root,
      displayName: chordName,
      color: this.getChordColor(suffix),
    };
  }
  
  /**
   * コードの構成音を取得
   */
  private getChordNotes(root: string, suffix: string): number[] {
    // ルート音のMIDIノート番号を取得
    const rootMidi = this.noteToMidi(root + '4'); // C4を基準
    
    // コードタイプに基づいて音程を追加
    let intervals: number[] = [];
    
    if (suffix === '' || suffix === 'M') {
      // メジャー
      intervals = [0, 4, 7];
    } else if (suffix === 'm' || suffix === 'min') {
      // マイナー
      intervals = [0, 3, 7];
    } else if (suffix === '7') {
      // セブンス
      intervals = [0, 4, 7, 10];
    } else if (suffix === 'M7' || suffix === 'maj7') {
      // メジャーセブンス
      intervals = [0, 4, 7, 11];
    } else if (suffix === 'm7' || suffix === 'min7') {
      // マイナーセブンス
      intervals = [0, 3, 7, 10];
    } else if (suffix === 'dim' || suffix === 'o') {
      // ディミニッシュ
      intervals = [0, 3, 6];
    } else if (suffix === 'aug' || suffix === '+') {
      // オーギュメント
      intervals = [0, 4, 8];
    } else {
      // デフォルト（メジャー）
      intervals = [0, 4, 7];
    }
    
    return intervals.map(interval => rootMidi + interval);
  }
  
  /**
   * 音名をMIDIノート番号に変換
   */
  private noteToMidi(note: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    // 音名とオクターブを分離
    const match = note.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) return 60; // デフォルト（C4）
    
    const noteName = match[1];
    const octave = parseInt(match[2]);
    
    const noteValue = noteMap[noteName];
    if (noteValue === undefined) return 60;
    
    return (octave + 1) * 12 + noteValue;
  }
  
  /**
   * コードタイプに基づいて色を決定
   */
  private getChordColor(suffix: string): string {
    if (suffix === 'm' || suffix === 'min' || suffix === 'm7' || suffix === 'min7') {
      return '#4169E1'; // ブルー系（マイナー）
    } else if (suffix === 'dim' || suffix === 'o') {
      return '#8B008B'; // パープル系（ディミニッシュ）
    } else if (suffix === 'aug' || suffix === '+') {
      return '#FF8C00'; // オレンジ系（オーギュメント）
    } else {
      return '#228B22'; // グリーン系（メジャー）
    }
  }
  
  /**
   * 現在のグローバルインデックスを取得
   */
  getGlobalIndex(): number {
    return this.globalIndex;
  }
  
  /**
   * プログレッションの長さを取得
   */
  getProgressionLength(): number {
    return this.chordProgression.length;
  }
  
  /**
   * 列数を取得
   */
  getColumnCount(): number {
    return this.columnCount;
  }
}

export default ProgressionProblemGenerator;