/**
 * Phase 2: ゲームエンジン
 * ノーツ管理、採点、音楽同期、ABリピート機能の実装
 */

import type {
  NoteData,
  ActiveNote,
  JudgmentTiming,
  NoteHit,
  MusicalTiming,
  GameSettings,
  GameScore,
  JudgmentResult
} from '@/types';
import { unifiedFrameController } from './performanceOptimizer';
import { log, devLog } from './logger';

type InternalNote = NoteData & { _wasProcessed?: boolean };

// ===== 定数定義 =====

export const JUDGMENT_TIMING: JudgmentTiming = {
  perfectMs: 0,   // Perfect判定は使用しない
  goodMs: 150,    // ±150ms = Good
  missMs: 150     // 判定ライン通過後150ms = Miss
};

export const LOOKAHEAD_TIME = 5.0; // 5秒先まで表示（より長く表示）
export const CLEANUP_TIME = 3.0;        // 3秒後にクリーンアップ（より長く残す）
export const MISSED_CLEANUP_TIME = 2.0; // Miss 判定後 2秒間は残す
const HIT_DISPLAY_DURATION = 0.016; // 1フレーム相当
const MISS_DELAY_AFTER_LINE = 0.12; // 判定ライン通過後の猶予

// ===== 描画関連定数 =====
/** Canvasノート矩形の高さ(px) */
const NOTE_SPRITE_HEIGHT = 5;

// ===== 型定義 =====

export interface GameEngineUpdate {
  currentTime: number;
  activeNotes: ActiveNote[];
  timing: MusicalTiming;
  score: GameScore;
  abRepeatState: { start: number | null; end: number | null; enabled: boolean };
}

export interface GameEngineState {
  currentTime: number;
  activeNotes: ActiveNote[];
  score: GameScore;
  timing: MusicalTiming;
  abRepeat: { start: number | null; end: number | null; enabled: boolean };
}

// ===== メインゲームエンジン =====

export class GameEngine {
  private notes: NoteData[] = [];
  private activeNotes: Map<string, ActiveNote> = new Map();
  private nextNoteIndex: number = 0;
  private readonly noteInstancePool: ActiveNote[] = [];
  private readonly visibleNotesBuffer: ActiveNote[] = [];
  private settings: GameSettings;
  private score: GameScore = {
    totalNotes: 0,
    goodCount: 0,
    missCount: 0,
    combo: 0,
    maxCombo: 0,
    accuracy: 0,
    score: 0,
    rank: 'D'
  };
  
  // 音楽同期
  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private latencyOffset: number = 0;
  private onUpdate?: (data: GameEngineUpdate) => void;
  private readonly updateListeners = new Set<(data: GameEngineUpdate) => void>();
  private onJudgment?: (judgment: JudgmentResult) => void;
  private onKeyHighlight?: (pitch: number, timestamp: number) => void; // 練習モードガイド用
  
  private isGameLoopRunning: boolean = false; // ゲームループの状態を追跡
  private rafHandle: number | ReturnType<typeof setTimeout> | null = null;
  
  constructor(settings: GameSettings) {
    this.settings = { ...settings };
  }
  
  setUpdateCallback(callback: (data: GameEngineUpdate) => void): void {
    this.onUpdate = callback;
  }

  addUpdateListener(listener: (data: GameEngineUpdate) => void): () => void {
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }
  
  /** 判定イベント受信側を登録 */
  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.onJudgment = callback;
  }
  
  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.onKeyHighlight = callback;
  }
  
  private getHardwareLatency(): number {
    if (!this.audioContext) return 0;
    return (this.audioContext.baseLatency || 0) + (this.audioContext.outputLatency || 0);
  }

  private getTimingAdjSec(): number {
    const manualAdj = (this.settings.timingAdjustment ?? 0) / 1000;
    const speed = this.settings.playbackSpeed ?? 1;
    return manualAdj + this.getHardwareLatency() * speed;
  }

  private getAdjustedNoteTime(note: NoteData, timingAdjSec?: number): number {
    const adjustment = timingAdjSec ?? this.getTimingAdjSec();
    return note.time + adjustment;
  }
  
  loadSong(notes: NoteData[]): void {
    log.info(`🎵 GameEngine: ${notes.length}ノーツを読み込み開始`);
    this.prepareNotes(notes);
    
    log.info(`🎵 GameEngine: ${this.notes.length}ノーツ読み込み完了`, {
      firstNoteTime: this.notes[0]?.time,
      lastNoteTime: this.notes[this.notes.length - 1]?.time
    });
    
    // アクティブノーツをクリア
    this.recycleAllActiveNotes();
    
    // スコアリセット
    this.resetScore();
    
    // 合計ノーツ数を設定
    this.score.totalNotes = this.notes.length;
  }

  private prepareNotes(notes: NoteData[]): void {
    const timingAdj = this.getTimingAdjSec();
    const lookahead = this.getLookaheadTime();
    this.notes = notes
      .map((note, index) => ({
        ...note,
        id: note.id || `note-${index}`,
        appearTime: note.time + timingAdj - lookahead
      }))
      .sort((a, b) => a.time - b.time);
    this.nextNoteIndex = 0;
  }

  private recycleAllActiveNotes(): void {
    this.activeNotes.forEach((note) => {
      this.resetNoteInstance(note);
      this.noteInstancePool.push(note);
    });
    this.activeNotes.clear();
    this.visibleNotesBuffer.length = 0;
  }

  private resetNoteInstance(note: ActiveNote): void {
    note.state = 'waiting';
    note.hitTime = undefined;
    note.timingError = undefined;
    note.previousY = undefined;
    note._lastLogicY = undefined;
    note.y = undefined;
    note.judged = false;
    note.crossingLogged = false;
  }

  private borrowActiveNote(source: NoteData, currentTime: number): ActiveNote {
    const instance = this.noteInstancePool.pop();
    const baseY = this.calculateNoteY(source, currentTime);
    if (instance) {
      instance.id = source.id;
      instance.time = source.time;
      instance.pitch = source.pitch;
      instance.noteName = source.noteName;
      instance.appearTime = source.appearTime;
      instance.hand = source.hand;
      instance.state = 'visible';
      instance.hitTime = undefined;
      instance.timingError = undefined;
      instance.previousY = undefined;
      instance._lastLogicY = undefined;
      instance.y = baseY;
      instance.judged = false;
      instance.crossingLogged = false;
      return instance;
    }
    return {
      ...source,
      state: 'visible',
      y: baseY
    };
  }

  private recycleNote(noteId: string): void {
    const note = this.activeNotes.get(noteId);
    if (!note) return;
    this.resetNoteInstance(note);
    this.activeNotes.delete(noteId);
    this.noteInstancePool.push(note);
  }

  private findNextNoteIndex(targetTime: number): number {
    if (this.notes.length === 0) return 0;
    const timingAdjSec = this.getTimingAdjSec();
    let low = 0;
    let high = this.notes.length - 1;
    let result = this.notes.length;
    while (low <= high) {
      const mid = (low + high) >> 1;
      const midNote = this.notes[mid];
      const adjustedTime = midNote ? this.getAdjustedNoteTime(midNote, timingAdjSec) : 0;
      if (adjustedTime >= targetTime) {
        result = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return Math.max(0, result);
  }
  
  start(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.calculateLatency();
    this.startTime = audioContext.currentTime;
    this.pausedTime = 0;
    this.startGameLoop();
    
    log.info(`🚀 GameEngine.start: ゲームループ開始`, {
      audioTime: audioContext.currentTime,
      totalNotes: this.notes.length,
      startTime: this.startTime
    });
  }
  
  pause(): void {
    this.pausedTime = this.getCurrentTime();
    this.stopGameLoop();
  }
  
  resume(): void {
    if (this.audioContext) {
      // 🔧 修正: 再生速度を考慮したresume計算
      // pausedTimeは論理時間なので、実時間に変換してからstartTimeを計算
      const realTimeElapsed = this.pausedTime / (this.settings.playbackSpeed ?? 1);
      this.startTime = this.audioContext.currentTime - realTimeElapsed - this.latencyOffset;
      
      // ログ削除: FPS最適化のため
      // devLog.debug(`🔄 GameEngine.resume: ${this.pausedTime.toFixed(2)}s`);
    }
    this.startGameLoop();
  }
  
  stop(): void {
    this.pausedTime = 0;
    this.stopGameLoop();
    this.recycleAllActiveNotes();
    this.resetNoteProcessing(0);
    this.resetScore();
  }
  
  seek(time: number): void {
    if (!this.audioContext) {
      return;
    }
    const safeTime = Math.max(0, time);
    
    // 🔧 修正: 再生速度を考慮したstartTime計算
    // safeTimeは論理時間、audioContext.currentTimeは実時間のため、
    // 論理時間を実時間に変換してからオフセットを計算する
    const realTimeElapsed = safeTime / (this.settings.playbackSpeed ?? 1);
    this.startTime = this.audioContext.currentTime - realTimeElapsed - this.latencyOffset;
    this.pausedTime = 0;
    
    // **完全なアクティブノーツリセット**
    this.recycleAllActiveNotes();
    
    // シーク位置より後のノートの処理済みフラグとappearTimeをクリア
    this.resetNoteProcessing(safeTime);
    const lookBehind = Math.max(0, safeTime - this.getLookaheadTime());
    this.nextNoteIndex = this.findNextNoteIndex(lookBehind);
    
    // ログ削除: FPS最適化のため
    // devLog.debug(`🎮 GameEngine.seek: ${safeTime.toFixed(2)}s`);
  }
  
  handleInput(inputNote: number): NoteHit | null {
    const currentTime = this.getCurrentTime();
    const adjustedInput = this.adjustInputNote(inputNote);
    
    // タイミング調整を秒単位に変換
    const timingAdjustmentSec = this.getTimingAdjSec();
    
    // 可視ノーツのうち、ピッチが一致し GOOD 判定範囲内のものを探す
    const candidates = Array.from(this.activeNotes.values())
      .filter(note => note.state === 'visible')
      .filter(note => this.isNoteMatch(note.pitch, adjustedInput))
        .map(note => ({
          note,
          // タイミング調整を適用した判定時間と比較
          timingError: Math.abs(currentTime - this.getAdjustedNoteTime(note, timingAdjustmentSec)) * 1000
        }))
      // GOOD 判定幅以内のみ許可
      .filter(({ timingError }) => timingError <= JUDGMENT_TIMING.goodMs)
      .sort((a, b) => a.timingError - b.timingError);
    
    if (candidates.length === 0) return null;
    
    const { note, timingError } = candidates[0];

    return {
      noteId: note.id,
      inputNote: adjustedInput,
      timingError,
      judgment: 'good',
      timestamp: currentTime
    };
  }
  
  processHit(hit: NoteHit): JudgmentResult {
    const judgment: JudgmentResult = {
      type: hit.judgment === 'miss' ? 'miss' : 'good',
      timingError: hit.timingError,
      noteId: hit.noteId,
      timestamp: hit.timestamp
    };
    
    this.updateScore(judgment);
    
    // ストア側へイベント通知
    this.onJudgment?.(judgment);
    
    // ノーツの状態更新 - 新しいオブジェクトを作成して置き換え
    const note = this.activeNotes.get(hit.noteId);
    if (note) {
      note.state = 'hit';
      note.hitTime = hit.timestamp;
      note.timingError = hit.timingError;
    }
    
    return judgment;
  }
  
  setABRepeatStart(_time?: number): void {}
  
  setABRepeatEnd(_time?: number): void {}
  
  enableABRepeat(): void {}
  
  disableABRepeat(): void {}
  
  clearABRepeat(): void {}
  
  updateSettings(settings: GameSettings): void {
    const prevSpeed = this.settings.playbackSpeed ?? 1;
    // 現在の論理時間を保持（旧スピードで計算）
    const currentLogicalTime = this.getCurrentTime();

    // 設定更新
    this.settings = settings;

    // 本番モードでは練習モードガイドを無効化
    if (this.settings.practiceGuide !== 'off') {
      // ゲームモードを確認するために、ストアから現在のモードを取得
      // この処理はストア側で行われるため、ここでは設定のみを更新
      // 実際の無効化はストアのsetMode/setCurrentTabで行われる
    }

    const newSpeed = this.settings.playbackSpeed ?? 1;

    // スピードが変化した場合、startTime を調整してタイムラインを連続に保つ
    if (this.audioContext && prevSpeed !== newSpeed) {
      // 🔧 修正: seekメソッドと同じ計算方式に統一
      // 論理時間を新しい速度での実時間に変換してからstartTimeを計算
      const realTimeElapsed = currentLogicalTime / newSpeed;
      this.startTime = this.audioContext.currentTime - realTimeElapsed - this.latencyOffset;
      
      // ログ削除: FPS最適化のため
      // devLog.debug(`🔧 GameEngine.updateSettings: 速度変更 ${prevSpeed}x → ${newSpeed}x`);
    }

    // notesSpeed が変化した場合、未処理ノートの appearTime を更新
    const dynamicLookahead = this.getLookaheadTime();
    this.notes.forEach((note) => {
      // まだ appearTime を計算済みでも更新（タイミング調整を含める）
      note.appearTime = note.time + this.getTimingAdjSec() - dynamicLookahead;
    });
    const lookBehind = Math.max(0, this.getCurrentTime() - dynamicLookahead);
    this.nextNoteIndex = this.findNextNoteIndex(lookBehind);
  }
  
  destroy(): void {
    this.stopGameLoop();
  }
  
  getState(): GameEngineState {
    // 停止中でもアクティブノートを生成して表示
    const activeNotes = this.isGameLoopRunning ? 
      Array.from(this.activeNotes.values()) : 
      this.generateStaticActiveNotes(this.getCurrentTime());
    
    return {
      currentTime: this.getCurrentTime(),
      activeNotes,
      score: { ...this.score },
      timing: {
        currentTime: this.getCurrentTime(),
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      },
      abRepeat: {
        start: null,
        end: null,
        enabled: false
      }
    };
  }

  /**
   * 停止中でも現在時刻周辺のノートを表示するためのアクティブノート生成
   */
  private generateStaticActiveNotes(currentTime: number): ActiveNote[] {
    const staticNotes: ActiveNote[] = [];
    const dynamicLookahead = this.getLookaheadTime();
    const timingAdjSec = this.getTimingAdjSec();
    
    // 現在時刻の前後の表示範囲を計算
    const lookBehind = 2.0; // 過去2秒
    const lookAhead = dynamicLookahead; // 未来は動的先読み時間
    
    for (const note of this.notes) {
      const timeFromCurrent = this.getAdjustedNoteTime(note, timingAdjSec) - currentTime;
      
      // 表示範囲内のノートのみ生成
      if (timeFromCurrent >= -lookBehind && timeFromCurrent <= lookAhead) {
        // 停止中は基本的に visible 状態で表示
        let state: ActiveNote['state'] = 'visible';
        
        // 過去のノートは missed 状態で表示（視覚的に区別）
        if (timeFromCurrent < -0.5) { // 判定時間を500ms過ぎた場合
          state = 'missed';
        }
        
        const activeNote: ActiveNote = {
          ...note,
          state,
          y: this.calculateNoteY(note, currentTime),
          // 停止中なので previousY は undefined
          previousY: undefined,
          // 停止中は crossingLogged を false にリセット
          crossingLogged: false
        };
        
        staticNotes.push(activeNote);
      }
    }
    
    return staticNotes;
  }
  
  // ===== プライベートメソッド =====
  
  private getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return (this.audioContext.currentTime - this.startTime - this.latencyOffset)
      * (this.settings.playbackSpeed ?? 1);
  }
  
  private calculateLatency(): void {
    if (!this.audioContext) return;
    
    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = this.audioContext.outputLatency || 0;

    // 任意の追加補正値（ユーザー設定で微調整可能）
    const manualCompensation = (this.settings as any).latencyAdjustment ?? 0; // 秒

    // 合計レイテンシ
    this.latencyOffset = baseLatency + outputLatency + manualCompensation;

    log.info(`🔧 レイテンシ計算: base=${(baseLatency*1000).toFixed(1)}ms, output=${(outputLatency*1000).toFixed(1)}ms, manual=${(manualCompensation*1000).toFixed(1)}ms → total=${(this.latencyOffset*1000).toFixed(1)}ms`);
  }
  
  private adjustInputNote(inputNote: number): number {
    // 入力ノートにオクターブシフトのみ適用（トランスポーズは判定側で取り扱う）
    let adjusted = inputNote;
    adjusted += this.settings.noteOctaveShift * 12;
    return adjusted;
  }
  
  private isNoteMatch(targetPitch: number, inputPitch: number): boolean {
    // 曲側のピッチにトランスポーズを適用
    const transposedTarget = targetPitch + this.settings.transpose;

    if (transposedTarget === inputPitch) return true;
    
    if (this.settings.allowOctaveError) {
      const pitchClass = (pitch: number) => pitch % 12;
      return pitchClass(transposedTarget) === pitchClass(inputPitch);
    }
    
    return false;
  }
  
  private calculateJudgment(timingErrorMs: number): 'perfect' | 'good' | 'miss' {
    // 判定をGOODとMISSのみに簡略化
    if (timingErrorMs <= JUDGMENT_TIMING.goodMs) return 'good';
    return 'miss';
  }
  
  private updateScore(judgment: JudgmentResult): void {
    this.score.totalNotes++;
    
    if (judgment.type === 'good') {
      this.score.goodCount++;
      this.score.combo++;
      this.score.maxCombo = Math.max(this.score.maxCombo, this.score.combo);
    } else {
      this.score.missCount++;
      this.score.combo = 0;
    }
    
    this.score.accuracy = this.score.goodCount / this.score.totalNotes;
    this.score.score = this.calculateFinalScore();
    this.score.rank = this.calculateRank(this.score.accuracy);
  }
  
  private calculateFinalScore(): number {
    // GOOD 1 回あたり 1000 点、MISS は 0 点
    return this.score.goodCount * 1000;
  }
  
  private calculateRank(accuracy: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    if (accuracy >= 0.95) return 'S';
    if (accuracy >= 0.85) return 'A';
    if (accuracy >= 0.70) return 'B';
    if (accuracy >= 0.50) return 'C';
    return 'D';
  }
  
  private resetScore(): void {
    this.score = {
      totalNotes: 0,
      goodCount: 0,
      missCount: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 0,
      score: 0,
      rank: 'D'
    };
  }

  private resetNoteProcessing(startTime = 0): void {
    const notes = this.notes as InternalNote[];
    const timingAdj = this.getTimingAdjSec();
    const lookahead = this.getLookaheadTime();
    for (const note of notes) {
      if (note.time >= startTime) {
        delete note._wasProcessed;
      }
      note.appearTime = note.time + timingAdj - lookahead;
    }
    const lookBehind = Math.max(0, startTime - lookahead);
    this.nextNoteIndex = this.findNextNoteIndex(lookBehind);
  }
  
  /**
   * 🚀 最適化版ノート更新
   * - performance.now() 呼び出しを削減
   * - フレーム間引き判定を効率化
   */
  private updateNotes(currentTime: number): ActiveNote[] {
    this.spawnUpcomingNotes(currentTime);
    
    // Loop 1: 位置更新専用（毎フレーム実行、軽量処理のみ）
    this.updateNotePositions(currentTime);
    
    // Loop 2: 判定・状態更新専用（フレーム間引き、重い処理）
    // 🚀 frameStartTime を再利用せず、shouldUpdateNotes 内部で判定
    if (this.shouldRunLogicUpdate()) {
      this.updateNoteLogic(currentTime);
    }
    
    // 🚀 GC最適化: バッファを再利用して配列作成を削減
    return this.buildVisibleBufferOptimized();
  }
  
  // 🚀 ロジック更新のタイミング制御（シンプル版）
  private lastLogicUpdateTime = 0;
  private readonly logicUpdateInterval = 8; // 8ms間隔
  
  private shouldRunLogicUpdate(): boolean {
    const now = performance.now();
    if (now - this.lastLogicUpdateTime >= this.logicUpdateInterval) {
      this.lastLogicUpdateTime = now;
      return true;
    }
    return false;
  }

  private spawnUpcomingNotes(currentTime: number): void {
    while (this.nextNoteIndex < this.notes.length) {
      const note = this.notes[this.nextNoteIndex] as InternalNote;
      if (!note.appearTime) {
        note.appearTime = note.time + this.getTimingAdjSec() - this.getLookaheadTime();
      }
      if (note.appearTime > currentTime) {
        break;
      }
      const wasProcessed = (note as InternalNote)._wasProcessed;
      if (!wasProcessed) {
        const active = this.borrowActiveNote(note, currentTime);
        this.activeNotes.set(note.id, active);
        note._wasProcessed = true;
      }
      this.nextNoteIndex += 1;
    }
  }

  private buildVisibleBuffer(): ActiveNote[] {
    let writeIndex = 0;
    this.activeNotes.forEach((note) => {
      if (note.state !== 'completed') {
        if (writeIndex < this.visibleNotesBuffer.length) {
          this.visibleNotesBuffer[writeIndex] = note;
        } else {
          this.visibleNotesBuffer.push(note);
        }
        writeIndex += 1;
      }
    });
    this.visibleNotesBuffer.length = writeIndex;
    return this.visibleNotesBuffer;
  }

  /**
   * 🚀 GC最適化版: バッファ再利用で配列作成を最小化
   * - forEach を for...of に変更（わずかに高速）
   * - 配列長の設定を最後に一度だけ実行
   */
  private buildVisibleBufferOptimized(): ActiveNote[] {
    let writeIndex = 0;
    const buffer = this.visibleNotesBuffer;
    const bufferLen = buffer.length;
    
    for (const note of this.activeNotes.values()) {
      if (note.state !== 'completed') {
        if (writeIndex < bufferLen) {
          buffer[writeIndex] = note;
        } else {
          buffer.push(note);
        }
        writeIndex += 1;
      }
    }
    
    // 配列サイズ調整（必要な場合のみ）
    if (buffer.length !== writeIndex) {
      buffer.length = writeIndex;
    }
    
    return buffer;
  }

  /**
   * 🚀 位置更新専用ループ（毎フレーム実行）
   * Y座標計算のみの軽量処理
   */
  private updateNotePositions(currentTime: number): void {
    for (const note of this.activeNotes.values()) {
      // 前フレームのY座標を保存
      note.previousY = note.y;
      
      // 新しいY座標を計算（軽量処理）
      const newY = this.calculateNoteY(note, currentTime);
      note.y = newY;
    }
  }

  // 🚀 GC最適化: 削除リストをクラスレベルでキャッシュ
  private readonly notesToDeleteBuffer: string[] = [];
  
  /**
   * 🎯 判定・状態更新専用ループ（フレーム間引き実行）
   * 重い処理（判定、状態変更、削除）のみ
   */
  private updateNoteLogic(currentTime: number): void {
    // 🚀 バッファをクリアして再利用
    this.notesToDeleteBuffer.length = 0;
    const notesToDelete = this.notesToDeleteBuffer;
    const timingAdjSec = this.getTimingAdjSec();
    
    for (const [noteId, note] of this.activeNotes) {
      const displayTime = this.getAdjustedNoteTime(note, timingAdjSec);
      const isRecentNote = Math.abs(currentTime - displayTime) < 2.0; // 判定時間の±2秒以内
      
      // 🎯 STEP 1: 判定ライン通過検出を先に実行（オートプレイ処理含む）
      this.checkHitLineCrossing(note, currentTime, timingAdjSec);
      
        // 🎯 STEP 2: 最新の状態を取得してから通常の状態更新
        const latestNote = this.activeNotes.get(noteId) || note;
        if (isRecentNote && latestNote.state !== note.state) {
        }
        
        const updatedNote = this.updateNoteState(latestNote, currentTime, timingAdjSec);
        if (isRecentNote && updatedNote.state !== latestNote.state) {
        }
        
        if (updatedNote.state === 'missed' && !updatedNote.judged) {
          const missJudgment: JudgmentResult = {
            type: 'miss',
            timingError: 0,
            noteId: updatedNote.id,
            timestamp: currentTime
          };
          this.updateScore(missJudgment);
          updatedNote.judged = true;
          this.onJudgment?.(missJudgment);
        }
        
        if (updatedNote.state === 'completed') {
          notesToDelete.push(noteId);
          
          if (isRecentNote) {
          }
        }

        // ロジック更新時のY座標を記録（次回ロジック更新での通過検出に使用）
        updatedNote._lastLogicY = updatedNote.y;
    }
    
      // バッチ削除（ループ後に実行）
      for (const noteId of notesToDelete) {
        this.recycleNote(noteId);
      }
    
  }
  
  private updateNoteState(note: ActiveNote, currentTime: number, timingAdjSec: number): ActiveNote {
    const displayTime = this.getAdjustedNoteTime(note, timingAdjSec);
    const timePassed = currentTime - displayTime;
    
    // 🛡️ Hit状態のノートは保護し、エフェクト描画のため最小1フレーム後に削除
    if (note.state === 'hit') {
      if (note.hitTime) {
        if (currentTime - note.hitTime > HIT_DISPLAY_DURATION) {
          note.state = 'completed';
        }
      } else {
        log.warn(`⚠️ HitノートにhitTimeがありません: ${note.id}`);
        note.state = 'completed';
      }
      return note;
    }
    
    // *自動ヒットは checkHitLineCrossing で処理*
    
    // Miss判定チェック - 判定ライン通過後短い猶予でmiss判定
    if (note.state === 'visible' && timePassed > MISS_DELAY_AFTER_LINE) {
      // シーク直後とノーツ生成直後の猶予期間を設ける
      const adjustedAppearTime = note.appearTime ?? (displayTime - this.getLookaheadTime());
      const noteAge = currentTime - adjustedAppearTime;
      const gracePeriod = 0.25;
      
      if (noteAge > gracePeriod) {
        note.state = 'missed';
      }
    }
    
    // Missed ノーツは速度に応じた時間残してから削除
    if (note.state === 'missed' && timePassed > this.getMissedCleanupTime()) {
      note.state = 'completed';
      return note;
    }
    
    // 通常のクリーンアップチェック (速度に応じて延長)
    if (timePassed > this.getCleanupTime()) {
      note.state = 'completed';
      return note;
    }
    
    return note;
  }

  private checkHitLineCrossing(note: ActiveNote, currentTime: number, timingAdjSec: number): void {
    // 動的レイアウト対応: 設定値からヒットラインを計算
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight; // 判定ライン位置

    const noteCenter = (note.y || 0);
    const prevLogicY = (note._lastLogicY ?? note.previousY ?? 0);
    
    // ▼ crossing 判定用の "表示上の" 到達時刻を利用
    const displayTime = this.getAdjustedNoteTime(note, timingAdjSec);
    
    // 判定ラインを通過した瞬間を検出
    // _lastLogicY: 前回ロジック更新時のY座標を使用し、フレームスキップによる取りこぼしを防止
    if ((note._lastLogicY !== undefined || note.previousY !== undefined) && 
        prevLogicY <= hitLineY && 
        noteCenter >= hitLineY &&
        note.state === 'visible' &&
        !note.crossingLogged) { // 重複ログ防止

      const timeError = (currentTime - displayTime) * 1000;   // ms

        // 重複ログ防止フラグを即座に設定
        note.crossingLogged = true;

      // 練習モードガイド処理
      const practiceGuide = this.settings.practiceGuide ?? 'key';
      if (practiceGuide !== 'off') {
        const effectivePitch = note.pitch + this.settings.transpose;
        
        // キーハイライト通知を送信（key、key_auto両方で実行）
        if (this.onKeyHighlight) {
          this.onKeyHighlight(effectivePitch, currentTime);
        }
        
        if (practiceGuide === 'key_auto') {
          // オートプレイ: 自動的にノーツをヒット判定
          // ログ削除: FPS最適化のため
          // devLog.debug(`🤖 オートプレイ実行開始: ノート ${note.id} (pitch=${effectivePitch})`);
          
          // 自動判定を実行
          const autoHit: NoteHit = {
            noteId: note.id,
            inputNote: effectivePitch,
            timingError: Math.abs(timeError),
            judgment: 'good',
            timestamp: currentTime
          };
          
          // 判定処理を実行（これによりノーツが'hit'状態になりスコアも更新される）
          const judgment = this.processHit(autoHit);
          // ログ削除: FPS最適化のため
          // devLog.debug(`✨ オートプレイ判定完了: ${judgment.type} - ノート ${note.id} を "${judgment.type}" 判定`);
          
          // 強制的にノーツ状態を確認
          const updatedNoteAfterHit = this.activeNotes.get(note.id);
          if (updatedNoteAfterHit) {
            // ログ削除: FPS最適化のため
            // devLog.debug(`🔍 オートプレイ後ノート状態確認: ${note.id} - state: ${updatedNoteAfterHit.state}, hitTime: ${updatedNoteAfterHit.hitTime}`);
            
            // 念のため再度状態をセット（確実にhit状態にする）
            if (updatedNoteAfterHit.state !== 'hit') {
              log.warn(`⚠️ オートプレイ後の状態が異常: ${note.id} - 期待値: hit, 実際値: ${updatedNoteAfterHit.state}`);
              updatedNoteAfterHit.state = 'hit';
              updatedNoteAfterHit.hitTime = currentTime;
              updatedNoteAfterHit.timingError = Math.abs(timeError);
              // ログ削除: FPS最適化のため
              // devLog.debug(`🔧 強制修正完了: ${note.id} - state を 'hit' に変更`);
            } else {
              // ログ削除: FPS最適化のため
              // devLog.debug(`✅ オートプレイ状態確認OK: ${note.id} - 正常にhit状態です`);
            }
          } else {
            log.warn(`⚠️ オートプレイ後にノートが見つからない: ${note.id}`);
          }
        }
        
      }
    }
  }
  
    private calculateNoteY(note: NoteData, currentTime: number): number {
      // ▼ timeToHit の計算を変更
      const displayTime = this.getAdjustedNoteTime(note);
    const timeToHit = displayTime - currentTime;
    
    // 動的レイアウト対応
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight; // 判定ライン位置

    const noteHeight = NOTE_SPRITE_HEIGHT;
    
    // **改善されたタイミング計算 (ver.2)**
    // GameEngine では "ノート中心" が y に入る → 判定ラインに中心が到達するのが演奏タイミング
    // 基本の降下時間は LOOKAHEAD_TIME だが、視覚速度が変わると実際の降下時間も変わるため
    // appearTime と整合させるため動的な lookahead を使用
    const baseFallDuration = LOOKAHEAD_TIME; // 3秒を基準にしたまま速度倍率で伸縮
    const visualSpeedMultiplier = this.settings.notesSpeed; // ビジュアル速度乗数

    // 実際の物理降下距離とタイミング
    const startYCenter = -noteHeight;            // ノート中心が画面上端より少し上から開始
    const endYCenter   = hitLineY;               // ノート中心が判定ラインに到達
    const totalDistance = endYCenter - startYCenter; // 総降下距離（中心基準）
    
    // **高精度計算**: 速度設定は見た目の速度のみ、タイミングは変更しない
    const pixelsPerSecond = (totalDistance / baseFallDuration) * visualSpeedMultiplier;
    
    // timeToHit = 0 の瞬間にノーツ中心が判定ラインに到達するように計算
    const perfectY = endYCenter - (timeToHit * pixelsPerSecond);
    
    // 表示範囲制限（画面外は描画しない）
    const minY = startYCenter - 100; // 上端より上
    const maxY = screenHeight + 100; // 下端より下
    
    const finalY = Math.max(minY, Math.min(perfectY, maxY));
    
    return Math.round(finalY * 10) / 10; // 小数点第1位まで精度を保つ
  }
  
  private checkABRepeatLoop(_currentTime: number): void {
    // Managed in store now
  }
  
  private startGameLoop(): void {
    this.isGameLoopRunning = true;
    this.scheduleNextFrame();
  }
  
  private stopGameLoop(): void {
    this.isGameLoopRunning = false;
    if (this.rafHandle !== null) {
      this.cancelFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private scheduleNextFrame(): void {
    if (!this.isGameLoopRunning || this.rafHandle !== null) {
      return;
    }
    this.rafHandle = this.requestFrame(this.runFrame);
  }

  private requestFrame(callback: FrameRequestCallback): number | ReturnType<typeof setTimeout> {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback);
    }
    return setTimeout(() => callback(this.now()), 1000 / 60);
  }

  private cancelFrame(handle: number | ReturnType<typeof setTimeout>): void {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function' && typeof handle === 'number') {
      window.cancelAnimationFrame(handle);
      return;
    }
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  }

  /**
   * 🚀 最適化版フレームループ
   * - フレームスキップ判定を簡略化
   * - beginFrame/endFrame のオーバーヘッドを削減
   * - リスナー呼び出しを最適化
   */
  private readonly runFrame = (timestamp: number) => {
    this.rafHandle = null;
    if (!this.isGameLoopRunning) {
      return;
    }
    
    const frameStartTime = timestamp || this.now();
    
    // 🚀 簡略化されたフレームスキップ判定
    if (unifiedFrameController.shouldSkipFrame(frameStartTime, 'logic')) {
      this.scheduleNextFrame();
      return;
    }
    
    const currentTime = this.getCurrentTime();
    const activeNotes = this.updateNotes(currentTime);
    
    this.checkABRepeatLoop(currentTime);
    
    // 🚀 オブジェクト生成を最小化（timing/abRepeatState は固定値）
    const frameUpdate: GameEngineUpdate = {
      currentTime,
      activeNotes,
      timing: {
        currentTime,
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      },
      score: this.score, // 🚀 スプレッドを削除（参照渡し）
      abRepeatState: this.cachedAbRepeatState
    };
    
    // メインコールバック
    this.onUpdate?.(frameUpdate);
    
    // 🚀 リスナー呼び出しの最適化（for...of は forEach より若干速い）
    if (this.updateListeners.size > 0) {
      for (const listener of this.updateListeners) {
        listener(frameUpdate);
      }
    }
    
    this.scheduleNextFrame();
  };
  
  // 🚀 キャッシュされた ABRepeat 状態（毎フレームのオブジェクト生成を削減）
  private readonly cachedAbRepeatState = { start: null, end: null, enabled: false };

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  // ===== 動的タイムスケール計算ヘルパー =====
  /**
   * ノーツ降下スピード (settings.notesSpeed) に応じたスケールを返す
   * notesSpeed < 1 (遅い) ならスケール > 1、 notesSpeed > 1 (速い) なら < 1
   */
  private getSpeedScale(): number {
    const speed = this.settings.notesSpeed || 1;
    // safety guard – clamp to avoid division by zero or extreme values
    const clamped = Math.max(0.1, Math.min(4, speed));
    return 1 / clamped;
  }

  /** 現在の設定に基づくノーツ出現(先読み)時間 */
  private getLookaheadTime(): number {
    return LOOKAHEAD_TIME * this.getSpeedScale();
  }

  /** 現在の設定に基づくクリーンアップ時間 */
  private getCleanupTime(): number {
    return CLEANUP_TIME * this.getSpeedScale();
  }

  /** Miss 判定後の残存時間 */
  private getMissedCleanupTime(): number {
    return MISSED_CLEANUP_TIME * this.getSpeedScale();
  }
}