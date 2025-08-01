/**
 * RhythmGameEngine
 * リズムモードのゲームロジックを管理するクラス
 */

import { resolveChord } from './chord-utils';
import { devLog } from './logger';

// 判定ウィンドウの定数
const JUDGMENT_WINDOW_MS = 200; // 前後200ms

interface RhythmChordData {
  measure: number;
  beat: number;
  chord: string;
}

interface RhythmQuestion {
  id: string;
  chord: string;
  notesNeeded: number[]; // 0-11のクラスに正規化された音
  timingMs: number;
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  isActive: boolean;
  isCompleted: boolean;
  judgmentDeadline: number;
}

interface RhythmStage {
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures: number;
  rhythmType: 'random' | 'progression';
  allowedChords: string[];
  chordProgressionData?: { chords: RhythmChordData[] } | null;
  simultaneousMonsterCount?: number;
}

interface RhythmEngineCallbacks {
  onAttackSuccess: (questionId: string, chord: string, position: string) => void;
  onAttackFail: (questionId: string, chord: string, position: string) => void;
  onStateUpdate: (questions: RhythmQuestion[]) => void;
}

export class RhythmGameEngine {
  private stage: RhythmStage;
  private callbacks: RhythmEngineCallbacks;
  private allQuestions: RhythmQuestion[] = [];
  private activeQuestions: RhythmQuestion[] = [];
  private currentChordIndex: number = 0;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private lastUpdateTime: number = 0;
  private inputBuffer: Set<number> = new Set();
  private positions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[];

  constructor(stage: RhythmStage, callbacks: RhythmEngineCallbacks) {
    this.stage = stage;
    this.callbacks = callbacks;
    
    // 拍子数か同時出現数に基づいて列を決定
    const columnCount = this.stage.rhythmType === 'progression' 
      ? Math.min(this.stage.timeSignature, this.stage.simultaneousMonsterCount || 4, 8)
      : 1;
    
    const allPositions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = 
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    this.positions = allPositions.slice(0, columnCount);
    
    this.generateQuestions();
  }

  private measureBeatToMs(measure: number, beat: number, bpm: number, timeSignature: number, countInMeasures: number): number {
    const msPerBeat = 60000 / bpm;
    const msPerMeasure = msPerBeat * timeSignature;
    
    // カウントイン後の時間を計算
    const measureTime = (measure - 1 + countInMeasures) * msPerMeasure;
    const beatTime = (beat - 1) * msPerBeat;
    
    return measureTime + beatTime;
  }

  private generateQuestions(): void {
    if (this.stage.rhythmType === 'progression' && this.stage.chordProgressionData?.chords) {
      this.generateProgressionQuestions();
    } else {
      this.generateRandomQuestions();
    }
    
    devLog.debug('Generated questions:', this.allQuestions.length);
  }

  private generateProgressionQuestions(): void {
    const chords = this.stage.chordProgressionData!.chords;
    const { bpm, timeSignature, measureCount, countInMeasures } = this.stage;
    
    // 全曲分のループを複数回生成（無限ループ対応）
    const loopsToGenerate = 10; // 10ループ分を事前生成
    
    for (let loop = 0; loop < loopsToGenerate; loop++) {
      for (let i = 0; i < chords.length; i++) {
        const { measure, beat, chord } = chords[i];
        const actualMeasure = loop * measureCount + measure;
        
        const resolved = resolveChord(chord, 4);
        if (!resolved) continue;
        
        // 構成音を 0-11 のクラスに正規化
        const notesNeeded = Array.from(
          new Set(resolved.notes.map((noteName: string) => {
            // ノート名からMIDI番号を計算
            const noteToMidi = (note: string): number => {
              const noteMap: Record<string, number> = {
                'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
                'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
                'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
              };
              const match = note.match(/^([A-G][#b]?)(\d+)?$/);
              if (!match) return 0;
              const [, pitchClass] = match;
              return noteMap[pitchClass] || 0;
            };
            return noteToMidi(noteName);
          }))
        );
        
        const timingMs = this.measureBeatToMs(
          actualMeasure,
          beat,
          bpm,
          timeSignature,
          countInMeasures
        );
        
        this.allQuestions.push({
          id: `q_${loop}_${i}`,
          chord,
          notesNeeded,
          timingMs,
          position: this.positions[i % this.positions.length],
          isActive: false,
          isCompleted: false,
          judgmentDeadline: timingMs + JUDGMENT_WINDOW_MS
        });
      }
    }
  }

  private generateRandomQuestions(): void {
    const { bpm, timeSignature, measureCount, countInMeasures, allowedChords } = this.stage;
    
    // 10小節分先まで生成
    const measuresToGenerate = measureCount + 10;
    
    for (let m = 1; m <= measuresToGenerate; m++) {
      // ランダムにコードを選択
      const chord = allowedChords[Math.floor(Math.random() * allowedChords.length)];
      
      const resolved = resolveChord(chord, 4);
      if (!resolved) continue;
      
      // 構成音を 0-11 のクラスに正規化
      const notesNeeded = Array.from(
        new Set(resolved.notes.map((noteName: string) => {
          // ノート名からMIDI番号を計算
          const noteToMidi = (note: string): number => {
            const noteMap: Record<string, number> = {
              'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
              'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
              'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
            };
            const match = note.match(/^([A-G][#b]?)(\d+)?$/);
            if (!match) return 0;
            const [, pitchClass] = match;
            return noteMap[pitchClass] || 0;
          };
          return noteToMidi(noteName);
        }))
      );
      
      const timingMs = this.measureBeatToMs(
        m,
        1,
        bpm,
        timeSignature,
        countInMeasures
      );
      
      this.allQuestions.push({
        id: `q_${m}`,
        chord,
        notesNeeded,
        timingMs,
        position: 'A', // ランダムモードは常にA列
        isActive: false,
        isCompleted: false,
        judgmentDeadline: timingMs + JUDGMENT_WINDOW_MS
      });
    }
  }

  public start(startTime: number): void {
    this.startTime = startTime;
    this.isRunning = true;
    this.lastUpdateTime = startTime;
    devLog.debug('Rhythm engine started');
  }

  public stop(): void {
    this.isRunning = false;
    this.activeQuestions = [];
    this.inputBuffer.clear();
    devLog.debug('Rhythm engine stopped');
  }

  public update(currentTime: number): void {
    if (!this.isRunning) return;
    
    const elapsedMs = currentTime - this.startTime;
    
    // アクティブな問題を更新
    this.updateActiveQuestions(elapsedMs);
    
    // 判定ウィンドウを過ぎた問題の処理
    this.checkExpiredQuestions(elapsedMs);
    
    // 状態更新をコールバック
    this.callbacks.onStateUpdate(this.activeQuestions);
    
    this.lastUpdateTime = currentTime;
  }

  private updateActiveQuestions(elapsedMs: number): void {
    // 新しい問題をアクティブ化
    const lookAheadMs = 2000; // 2秒先まで表示
    
    for (const question of this.allQuestions) {
      if (!question.isActive && !question.isCompleted && 
          question.timingMs - elapsedMs <= lookAheadMs) {
        
        // プログレッションモードで同じ列に既存の問題がある場合はスキップ
        if (this.stage.rhythmType === 'progression') {
          const existingInColumn = this.activeQuestions.find(
            q => q.position === question.position && !q.isCompleted
          );
          if (existingInColumn) continue;
        }
        
        question.isActive = true;
        this.activeQuestions.push(question);
      }
    }
    
    // 完了した問題を削除
    this.activeQuestions = this.activeQuestions.filter(q => q.isActive && !q.isCompleted);
  }

  private checkExpiredQuestions(elapsedMs: number): void {
    for (const question of this.activeQuestions) {
      if (!question.isCompleted && elapsedMs > question.judgmentDeadline) {
        // 判定ウィンドウを過ぎた = 攻撃失敗
        question.isCompleted = true;
        question.isActive = false;
        
        this.callbacks.onAttackFail(question.id, question.chord, question.position);
        
        // バッファをクリア
        this.inputBuffer.clear();
        
        // プログレッションモードの場合、次の問題を補充
        if (this.stage.rhythmType === 'progression') {
          this.fillProgressionColumn(question.position);
        }
      }
    }
  }

  private fillProgressionColumn(position: string): void {
    // 指定された列に次の問題を補充
    const chords = this.stage.chordProgressionData!.chords;
          const columnIndex = this.positions.indexOf(position as ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'));
    
    if (columnIndex === -1) return;
    
    // 次に表示すべき問題を探す
    let nextIndex = this.currentChordIndex;
    for (let i = 0; i < chords.length; i++) {
      nextIndex = (this.currentChordIndex + i) % chords.length;
      if (nextIndex % this.positions.length === columnIndex) {
        break;
      }
    }
    
    this.currentChordIndex = (nextIndex + 1) % chords.length;
    
    // 該当する問題を探してアクティブ化
    const nextQuestion = this.allQuestions.find(
      q => !q.isActive && !q.isCompleted && 
      q.chord === chords[nextIndex].chord &&
      q.position === position
    );
    
    if (nextQuestion) {
      nextQuestion.isActive = true;
      this.activeQuestions.push(nextQuestion);
    }
  }

  public handleNoteInput(noteNumber: number): void {
    if (!this.isRunning) return;
    
    // 入力をバッファに追加
    this.inputBuffer.add(noteNumber % 12); // 0-11のクラスに正規化
    
    // 判定チェック
    this.checkJudgments();
  }

  private checkJudgments(): void {
    const currentTime = performance.now();
    const elapsedMs = currentTime - this.startTime;
    
    for (const question of this.activeQuestions) {
      if (question.isCompleted) continue;
      
      // 判定ウィンドウ内かチェック
      const timeDiff = Math.abs(elapsedMs - question.timingMs);
      if (timeDiff <= JUDGMENT_WINDOW_MS) {
        // 必要な音がすべて押されているかチェック
        const allNotesPressed = question.notesNeeded.every(
          note => this.inputBuffer.has(note)
        );
        
        if (allNotesPressed) {
          // 攻撃成功！
          question.isCompleted = true;
          question.isActive = false;
          
          this.callbacks.onAttackSuccess(question.id, question.chord, question.position);
          
          // バッファをクリア
          this.inputBuffer.clear();
          
          // プログレッションモードの場合、次の問題を補充
          if (this.stage.rhythmType === 'progression') {
            this.fillProgressionColumn(question.position);
          }
        }
      }
    }
  }

  public releaseNote(noteNumber: number): void {
    this.inputBuffer.delete(noteNumber % 12);
  }

  public getActiveQuestions(): RhythmQuestion[] {
    return [...this.activeQuestions];
  }

  public getProgress(): number {
    if (this.allQuestions.length === 0) return 0;
    const completed = this.allQuestions.filter(q => q.isCompleted).length;
    return completed / this.allQuestions.length;
  }
}