/**
 * RandomProblemGenerator
 * リズムモードのランダムパターン用問題生成クラス
 * - 1小節に1回コードを出題
 * - 直前のコードとの重複を回避
 */

import { ChordDefinition } from '@/types';
import { Timeline } from './Timeline';

export interface RandomProblemGeneratorOptions {
  allowedChords: string[];  // 出題可能なコード名のリスト
  timeline: Timeline;       // タイムライン管理
}

export type ChordChangeCallback = (chord: ChordDefinition, barIdx: number) => void;

export class RandomProblemGenerator {
  private allowedChords: string[];
  private timeline: Timeline;
  private lastChordName: string | null = null;
  private currentBar = -1;
  private chordChangeCallbacks: ChordChangeCallback[] = [];
  private isRunning = false;
  
  constructor(options: RandomProblemGeneratorOptions) {
    this.allowedChords = options.allowedChords;
    this.timeline = options.timeline;
  }
  
  /**
   * 生成開始
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentBar = -1;
    this.lastChordName = null;
    
    // 拍ごとにチェック
    this.timeline.onBeat(this.handleBeat);
    
    // 初回コードを即座に生成
    this.generateNewChord(0);
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
  onChordChange(callback: ChordChangeCallback): void {
    this.chordChangeCallbacks.push(callback);
  }
  
  /**
   * コード変更コールバックを削除
   */
  offChordChange(callback: ChordChangeCallback): void {
    const index = this.chordChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.chordChangeCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 次のコードを取得（重複回避）
   */
  private getNextChord(): string {
    if (this.allowedChords.length === 0) {
      throw new Error('No allowed chords');
    }
    
    if (this.allowedChords.length === 1) {
      // 1つしかない場合は常にそれを返す
      return this.allowedChords[0];
    }
    
    // 直前のコードを除外したリストから選択
    const candidates = this.allowedChords.filter(chord => chord !== this.lastChordName);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }
  
  /**
   * 拍ハンドラ
   */
  private handleBeat = (barIdx: number, beatIdx: number): void => {
    if (!this.isRunning) return;
    
    // 小節の頭（beat 0）でコード変更
    if (beatIdx === 0 && barIdx !== this.currentBar) {
      this.currentBar = barIdx;
      this.generateNewChord(barIdx);
    }
  };
  
  /**
   * 新しいコードを生成
   */
  private generateNewChord(barIdx: number): void {
    const chordName = this.getNextChord();
    this.lastChordName = chordName;
    
    // ChordDefinitionに変換
    const chord = this.parseChordName(chordName);
    
    // コールバック実行
    this.chordChangeCallbacks.forEach(callback => {
      callback(chord, barIdx);
    });
  }
  
  /**
   * コード名をChordDefinitionに変換
   */
  private parseChordName(chordName: string): ChordDefinition {
    // 基本的なコード解析
    // TODO: より複雑なコード記法に対応する場合は、専用のパーサーを使用
    
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
      id: `chord-${Date.now()}`,
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
   * 現在のコードを取得
   */
  getCurrentChord(): string | null {
    return this.lastChordName;
  }
}

export default RandomProblemGenerator;