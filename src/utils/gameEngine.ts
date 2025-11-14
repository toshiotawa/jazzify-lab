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
import { subscribeFrameLoop } from './frameLoop';
import { log, devLog } from './logger';

// ===== 定数定義 =====

export const JUDGMENT_TIMING: JudgmentTiming = {
  perfectMs: 0,   // Perfect判定は使用しない
  goodMs: 150,    // ±150ms = Good
  missMs: 150     // 判定ライン通過後150ms = Miss
};

export const LOOKAHEAD_TIME = 5.0; // 5秒先まで表示（より長く表示）
export const CLEANUP_TIME = 3.0;        // 3秒後にクリーンアップ（より長く残す）
export const MISSED_CLEANUP_TIME = 2.0; // Miss 判定後 2秒間は残す

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
  private nextNoteIndex = 0;
  private cleanupQueue: ActiveNote[] = [];
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
  
  private tickerListener: ((delta: number) => void) | null = null;
  private onUpdate?: (data: GameEngineUpdate) => void;
  private onJudgment?: (judgment: JudgmentResult) => void;
  private onKeyHighlight?: (pitch: number, timestamp: number) => void; // 練習モードガイド用
  
  private isGameLoopRunning: boolean = false; // ゲームループの状態を追跡
  private frameLoopUnsubscribe: (() => void) | null = null;
  
  constructor(settings: GameSettings) {
    this.settings = { ...settings };
  }
  
  setUpdateCallback(callback: (data: GameEngineUpdate) => void): void {
    this.onUpdate = callback;
  }
  
  /** 判定イベント受信側を登録 */
  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.onJudgment = callback;
  }
  
  setKeyHighlightCallback(callback: (pitch: number, timestamp: number) => void): void {
    this.onKeyHighlight = callback;
  }
  
  // ★ 追加: 設定値を秒へ変換して返すヘルパー
  private getTimingAdjSec(): number {
    return (this.settings.timingAdjustment ?? 0) / 1000;
  }
  
  loadSong(notes: NoteData[]): void {
    log.info(`🎵 GameEngine: ${notes.length}ノーツを読み込み開始`);
    
    // ▼ appearTime 計算を timingAdjustment 込みに
    this.notes = notes.map((note, index) => ({
      ...note,
      id: note.id || `note-${index}`,
      // 表示タイミングは元のまま保持
      time: note.time,
      // 表示開始時間の計算（タイミング調整を含める）
      appearTime: note.time + this.getTimingAdjSec() - LOOKAHEAD_TIME
    }));
    
    log.info(`🎵 GameEngine: ${this.notes.length}ノーツ読み込み完了`, {
      firstNoteTime: this.notes[0]?.time,
      lastNoteTime: this.notes[this.notes.length - 1]?.time
    });
    
    // アクティブノーツをクリア
      this.activeNotes.clear();
      this.cleanupQueue = [];
      this.nextNoteIndex = 0;
    
    // スコアリセット
    this.resetScore();
    
    // 合計ノーツ数を設定
    this.score.totalNotes = this.notes.length;
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
    this.resetScore();
  }
  
  seek(time: number): void {
    if (!this.audioContext) {
      return;
    }

    const safeTime = Math.max(0, time);
    const realTimeElapsed = safeTime / (this.settings.playbackSpeed ?? 1);
    this.startTime = this.audioContext.currentTime - realTimeElapsed - this.latencyOffset;
    this.pausedTime = 0;

    this.resetProcessedFlags();
    this.regenerateActiveNotes(safeTime);
  }
  
  private findNoteIndexByTime(targetTime: number): number {
    if (this.notes.length === 0) return 0;
    
    let left = 0;
    let right = this.notes.length - 1;
    const dynamicLookahead = this.getLookaheadTime();
    const appearanceTime = targetTime + dynamicLookahead;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const noteTime = this.notes[mid].time;
      
      if (noteTime <= appearanceTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return left;
  }

  private regenerateActiveNotes(currentTime: number): void {
    this.activeNotes.clear();
    this.cleanupQueue = [];
    const lookAhead = this.getLookaheadTime();
    const lookBehind = this.getCleanupTime();
    const startTime = Math.max(0, currentTime - lookBehind);
    const endTime = currentTime + lookAhead;
    const startIndex = Math.max(0, this.findNoteIndexByTime(startTime) - 10);
    const endIndex = Math.min(this.notes.length, this.findNoteIndexByTime(endTime) + 10);
    
    for (let i = startIndex; i < endIndex; i++) {
      const note = this.notes[i];
      const appearTime = (note.appearTime ??= note.time + this.getTimingAdjSec() - lookAhead);
      if (note.time < startTime || appearTime > endTime) {
        continue;
      }
      const activeNote: ActiveNote = {
        ...note,
        state: 'visible',
        creationIndex: i
      };
      this.activeNotes.set(activeNote.id, activeNote);
    }
    
    this.nextNoteIndex = this.findNoteIndexByTime(currentTime);
  }
  
  private resetProcessedFlags(): void {
    for (const note of this.notes) {
      delete (note as any)._wasProcessed;
    }
  }

  handleInput(inputNote: number): NoteHit | null {
    const currentTime = this.getCurrentTime();
    const adjustedInput = this.adjustInputNote(inputNote);
    
    // タイミング調整を秒単位に変換
    const timingAdjustmentSec = (this.settings.timingAdjustment || 0) / 1000;
    
    // 可視ノーツのうち、ピッチが一致し GOOD 判定範囲内のものを探す
    const candidates = Array.from(this.activeNotes.values())
      .filter(note => note.state === 'visible')
      .filter(note => this.isNoteMatch(note.pitch, adjustedInput))
      .map(note => ({
        note,
        // タイミング調整を適用した判定時間と比較
        timingError: Math.abs(currentTime - (note.time + timingAdjustmentSec)) * 1000
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
      const updatedNote: ActiveNote = {
        ...note,
        state: 'hit',
        hitTime: hit.timestamp,
        timingError: hit.timingError
      };
      this.activeNotes.set(hit.noteId, updatedNote);
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
    const currentLogicalTime = this.getCurrentTime();

    this.settings = settings;

    if (this.settings.practiceGuide !== 'off') {
      // 実際の制御はストア側で行う
    }

    const newSpeed = this.settings.playbackSpeed ?? 1;

    if (this.audioContext && prevSpeed !== newSpeed) {
      const realTimeElapsed = currentLogicalTime / newSpeed;
      this.startTime = this.audioContext.currentTime - realTimeElapsed - this.latencyOffset;
    }

    const dynamicLookahead = this.getLookaheadTime();
    this.notes.forEach((note) => {
      note.appearTime = note.time + this.getTimingAdjSec() - dynamicLookahead;
    });
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
    
    const lookBehind = 2.0;
    const lookAhead = dynamicLookahead;
    
    for (const note of this.notes) {
      const timeFromCurrent = note.time - currentTime;
      
      if (timeFromCurrent >= -lookBehind && timeFromCurrent <= lookAhead) {
        let state: ActiveNote['state'] = 'visible';
        
        if (timeFromCurrent < -0.5) {
          state = 'missed';
        }
        
        const activeNote: ActiveNote = {
          ...note,
          state,
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
  
  private updateNotes(currentTime: number): ActiveNote[] {
    const dynamicLookahead = this.getLookaheadTime();
    const appearanceTime = currentTime + dynamicLookahead;
    
    // 新規出現ノートを順番に処理
    while (this.nextNoteIndex < this.notes.length) {
      const note = this.notes[this.nextNoteIndex];
      const noteAppear = (note.appearTime ??= note.time + this.getTimingAdjSec() - dynamicLookahead);
      
      if (noteAppear > appearanceTime) {
        break;
      }
      
      const alreadyActive = this.activeNotes.has(note.id);
      const wasProcessed = (note as any)._wasProcessed;
      if (!alreadyActive && !wasProcessed) {
        const activeNote: ActiveNote = {
          ...note,
          state: 'visible',
          creationIndex: this.nextNoteIndex
        };
        this.activeNotes.set(note.id, activeNote);
      }
      
      this.nextNoteIndex++;
    }
    
    this.updateNoteLogic(currentTime);
    
    if (this.cleanupQueue.length > 0) {
      for (const note of this.cleanupQueue) {
        this.activeNotes.delete(note.id);
      }
      this.cleanupQueue = [];
    }
    
    const visibleNotes: ActiveNote[] = [];
    for (const note of this.activeNotes.values()) {
      if (note.state !== 'completed') {
        visibleNotes.push(note);
      }
    }
    
    return visibleNotes;
  }

  /**
   * 🎯 判定・状態更新専用ループ（フレーム間引き実行）
   * 重い処理（判定、状態変更、削除）のみ
   */
  private updateNoteLogic(currentTime: number): void {
    for (const [noteId, note] of this.activeNotes) {
      this.checkHitLineCrossing(note, currentTime);
      const latestNote = this.activeNotes.get(noteId) || note;
      const updatedNote = this.updateNoteState(latestNote, currentTime);
      
      if (updatedNote.state === 'completed') {
        const creationIndex = updatedNote.creationIndex ?? this.notes.findIndex((n) => n.id === noteId);
        if (creationIndex >= 0) {
          (this.notes[creationIndex] as any)._wasProcessed = true;
        }
        this.cleanupQueue.push(updatedNote);
      } else {
        this.activeNotes.set(noteId, updatedNote);
      }
    }
  }
  
  private updateNoteState(note: ActiveNote, currentTime: number): ActiveNote {
    const timePassed = currentTime - note.time;
    
    // 🛡️ Hit状態のノートは保護し、エフェクト描画のため一定時間後に削除
    if (note.state === 'hit') {
      // hitTime が記録されているか確認
      if (note.hitTime) {
        // 約3フレーム (50ms) 表示を維持してエフェクト描画を確保してから削除
        if (currentTime - note.hitTime > 0.05) {
          // ログ削除: FPS最適化のため
        // devLog.debug(`✅ Hitノートをクリーンアップ: ${note.id}`);
          return { ...note, state: 'completed' };
        }
      } else {
        // hitTime がない場合は、即座に完了させる (フォールバック)
        log.warn(`⚠️ HitノートにhitTimeがありません: ${note.id}`);
        return { ...note, state: 'completed' };
      }
      // 50ms経過していない場合は状態を維持してエフェクト描画を許可
      return note;
    }
    
    // *自動ヒットは checkHitLineCrossing で処理*
    
    // Miss判定チェック - 判定ライン通過後500ms後にmiss判定
    const missDelayAfterHitLine = 0.5; // 500ms
    if (note.state === 'visible' && timePassed > missDelayAfterHitLine) {
      // シーク直後とノーツ生成直後の猶予期間を設ける
      const noteAge = currentTime - (note.appearTime || note.time - this.getLookaheadTime());
      const gracePeriod = 2.0; // 2秒の猶予期間（生成直後の保護）
      
      if (noteAge > gracePeriod) {
        return { ...note, state: 'missed' };
      }
    }
    
    // Missed ノーツは速度に応じた時間残してから削除
    if (note.state === 'missed' && timePassed > this.getMissedCleanupTime()) {
      return { ...note, state: 'completed' };
    }
    
    // 通常のクリーンアップチェック (速度に応じて延長)
    if (timePassed > this.getCleanupTime()) {
      return { ...note, state: 'completed' };
    }
    
    return { ...note };
  }

  private checkHitLineCrossing(note: ActiveNote, currentTime: number): void {
    const displayTime = note.time + this.getTimingAdjSec();
    if (note.state !== 'visible' || note.crossingLogged) {
      return;
    }
    
    if (currentTime < displayTime) {
      return;
    }
    
    const timeError = (currentTime - displayTime) * 1000;
    note.crossingLogged = true;
    this.activeNotes.set(note.id, note);
    
    const practiceGuide = this.settings.practiceGuide ?? 'key';
    if (practiceGuide === 'off') {
      return;
    }
    
    const effectivePitch = note.pitch + this.settings.transpose;
    if (this.onKeyHighlight) {
      this.onKeyHighlight(effectivePitch, currentTime);
    }
    
    if (practiceGuide === 'key_auto') {
      const autoHit: NoteHit = {
        noteId: note.id,
        inputNote: effectivePitch,
        timingError: Math.abs(timeError),
        judgment: 'good',
        timestamp: currentTime
      };
      this.processHit(autoHit);
      const updatedNoteAfterHit = this.activeNotes.get(note.id);
      if (updatedNoteAfterHit && updatedNoteAfterHit.state !== 'hit') {
        const forcedHitNote: ActiveNote = {
          ...updatedNoteAfterHit,
          state: 'hit',
          hitTime: currentTime,
          timingError: Math.abs(timeError)
        };
        this.activeNotes.set(note.id, forcedHitNote);
      }
    }
  }
  
  private checkABRepeatLoop(_currentTime: number): void {
    // Managed in store now
  }
  
    private startGameLoop(): void {
      if (this.frameLoopUnsubscribe) {
        return;
      }
      this.isGameLoopRunning = true;
      this.frameLoopUnsubscribe = subscribeFrameLoop((_deltaMs, frameStartTime) => {
        this.runGameFrame(frameStartTime);
      });
    }
    
    private stopGameLoop(): void {
      this.isGameLoopRunning = false;
      if (this.frameLoopUnsubscribe) {
        this.frameLoopUnsubscribe();
        this.frameLoopUnsubscribe = null;
      }
    }

    private runGameFrame(frameStartTime: number): void {
      if (!this.isGameLoopRunning) {
        return;
      }

      const currentTime = this.getCurrentTime();
      
      const activeNotes = this.updateNotes(currentTime);
      
      // Miss判定処理（重複処理を防ぐ）
      for (const note of activeNotes) {
        if (note.state === 'missed' && !note.judged) {
          const missJudgment: JudgmentResult = {
            type: 'miss',
            timingError: 0,
            noteId: note.id,
            timestamp: currentTime
          };
          this.updateScore(missJudgment);
          
          const updatedNote: ActiveNote = {
            ...note,
            judged: true
          };
          this.activeNotes.set(note.id, updatedNote);

          this.onJudgment?.(missJudgment);
        }
      }
      
      // ABリピートチェック（軽量化）
      this.checkABRepeatLoop(currentTime);
      
      const timing: MusicalTiming = {
        currentTime,
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      };
      
      // UI更新（毎フレーム必要）
      this.onUpdate?.({
        currentTime,
        activeNotes,
        timing,
        score: { ...this.score },
        abRepeatState: {
          start: null,
          end: null,
          enabled: false
        }
      });
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