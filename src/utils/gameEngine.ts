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

// ===== 定数定義 =====

export const JUDGMENT_TIMING: JudgmentTiming = {
  perfectMs: 50,  // ±50ms = Perfect
  goodMs: 300,    // ±300ms = Good  
  missMs: 500     // それ以外 = Miss
};

export const LOOKAHEAD_TIME = 3.0; // 3秒先まで表示
export const CLEANUP_TIME = 1.0;   // 1秒後にクリーンアップ

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
  
  // ABリピート状態
  private abRepeatStart: number | null = null;
  private abRepeatEnd: number | null = null;
  private abRepeatEnabled: boolean = false;
  
  // 音楽同期
  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private latencyOffset: number = 0;
  
  private animationFrame: number | null = null;
  private onUpdate?: (data: GameEngineUpdate) => void;
  
  constructor(settings: GameSettings) {
    this.settings = settings;
  }
  
  setUpdateCallback(callback: (data: GameEngineUpdate) => void): void {
    this.onUpdate = callback;
  }
  
  loadSong(notes: NoteData[]): void {
    // **重複防止のための完全リセット**
    this.activeNotes.clear();
    this.notes = [];
    
    // **ユニークIDの確実な生成**
    this.notes = notes.map((note, index) => ({
      ...note,
      id: note.id || `demo1-${index}`, // インデックスベースでユニークなID
      appearTime: note.time - LOOKAHEAD_TIME // 常に3秒前に出現
    }));
    
    // 処理済みフラグをクリア
    this.notes.forEach(note => {
      delete (note as any)._wasProcessed;
    });
    
    this.resetScore();
    
    // 重複チェック（デバッグ用）
    const idSet = new Set();
    const duplicates: string[] = [];
    for (const note of this.notes) {
      if (idSet.has(note.id)) {
        duplicates.push(note.id);
      }
      idSet.add(note.id);
    }
    
    if (duplicates.length > 0) {
      console.error(`🚨 重複ノートID検出: ${duplicates.join(', ')}`);
    }
    
    // デバッグ情報
    console.log(`🎮 GameEngine.loadSong: ${this.notes.length}個のノートをロード`, {
      totalNotes: this.notes.length,
      uniqueIds: idSet.size,
      duplicates: duplicates.length,
      firstNote: this.notes[0],
      lookaheadTime: LOOKAHEAD_TIME,
      speed: this.settings.notesSpeed,
      firstAppearTime: this.notes[0]?.appearTime
    });
  }
  
  start(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.calculateLatency();
    this.startTime = audioContext.currentTime;
    this.pausedTime = 0;
    this.startGameLoop();
    
    console.log(`🚀 GameEngine.start: ゲームループ開始`, {
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
      this.startTime = this.audioContext.currentTime - this.pausedTime;
    }
    this.startGameLoop();
  }
  
  stop(): void {
    this.pausedTime = 0;
    this.stopGameLoop();
    this.resetScore();
  }
  
  seek(time: number): void {
    if (this.audioContext) {
      const safeTime = Math.max(0, time);
      const oldActiveCount = this.activeNotes.size;
      
      this.startTime = this.audioContext.currentTime - safeTime;
      this.pausedTime = 0;
      
      // **完全なアクティブノーツリセット**
      this.activeNotes.clear();
      
      // シーク位置より後のノートの処理済みフラグをクリア
      this.notes.forEach(note => {
        if (note.time >= safeTime) {
          delete (note as any)._wasProcessed;
        }
      });
      
      console.log(`🎮 GameEngine.seek: ${safeTime.toFixed(2)}s`, {
        audioTime: this.audioContext.currentTime.toFixed(2),
        clearedNotes: oldActiveCount,
        newStartTime: this.startTime.toFixed(2),
        resetProcessedFlags: this.notes.filter(n => n.time >= safeTime && !(n as any)._wasProcessed).length
      });
    }
  }
  
  handleInput(inputNote: number): NoteHit | null {
    const currentTime = this.getCurrentTime();
    const adjustedInput = this.adjustInputNote(inputNote);
    
    // 最適なマッチングノートを検索
    const candidates = Array.from(this.activeNotes.values())
      .filter(note => note.state === 'visible')
      .filter(note => this.isNoteMatch(note.pitch, adjustedInput))
      .map(note => ({
        note,
        timingError: Math.abs(currentTime - note.time) * 1000
      }))
      .filter(({ timingError }) => timingError <= JUDGMENT_TIMING.missMs)
      .sort((a, b) => a.timingError - b.timingError);
    
    if (candidates.length === 0) return null;
    
    const { note, timingError } = candidates[0];
    const judgment = this.calculateJudgment(timingError);
    
    return {
      noteId: note.id,
      inputNote: adjustedInput,
      timingError,
      judgment,
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
    
    // ノーツの状態更新
    const note = this.activeNotes.get(hit.noteId);
    if (note) {
      note.state = 'hit';
      note.hitTime = hit.timestamp;
      note.timingError = hit.timingError;
    }
    
    return judgment;
  }
  
  setABRepeatStart(time?: number): void {
    this.abRepeatStart = time ?? this.getCurrentTime();
  }
  
  setABRepeatEnd(time?: number): void {
    this.abRepeatEnd = time ?? this.getCurrentTime();
  }
  
  enableABRepeat(): void {
    if (this.abRepeatStart !== null && this.abRepeatEnd !== null) {
      this.abRepeatEnabled = true;
    }
  }
  
  disableABRepeat(): void {
    this.abRepeatEnabled = false;
  }
  
  clearABRepeat(): void {
    this.abRepeatStart = null;
    this.abRepeatEnd = null;
    this.abRepeatEnabled = false;
  }
  
  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }
  
  destroy(): void {
    this.stopGameLoop();
  }
  
  getState(): GameEngineState {
    return {
      currentTime: this.getCurrentTime(),
      activeNotes: Array.from(this.activeNotes.values()),
      score: { ...this.score },
      timing: {
        currentTime: this.getCurrentTime(),
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      },
      abRepeat: {
        start: this.abRepeatStart,
        end: this.abRepeatEnd,
        enabled: this.abRepeatEnabled
      }
    };
  }
  
  // ===== プライベートメソッド =====
  
  private getCurrentTime(): number {
    if (!this.audioContext) return 0;
    return this.audioContext.currentTime - this.startTime - this.latencyOffset;
  }
  
  private calculateLatency(): void {
    if (!this.audioContext) return;
    
    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = this.audioContext.outputLatency || 0;

    // 任意の追加補正値（ユーザー設定で微調整可能）
    const manualCompensation = (this.settings as any).latencyAdjustment ?? 0; // 秒

    // 合計レイテンシ
    this.latencyOffset = baseLatency + outputLatency + manualCompensation;

    console.log(`🔧 レイテンシ計算: base=${(baseLatency*1000).toFixed(1)}ms, output=${(outputLatency*1000).toFixed(1)}ms, manual=${(manualCompensation*1000).toFixed(1)}ms → total=${(this.latencyOffset*1000).toFixed(1)}ms`);
  }
  
  private adjustInputNote(inputNote: number): number {
    let adjusted = inputNote + this.settings.transpose;
    adjusted += this.settings.noteOctaveShift * 12;
    return adjusted;
  }
  
  private isNoteMatch(targetPitch: number, inputPitch: number): boolean {
    if (targetPitch === inputPitch) return true;
    
    if (this.settings.allowOctaveError) {
      const pitchClass = (pitch: number) => pitch % 12;
      return pitchClass(targetPitch) === pitchClass(inputPitch);
    }
    
    return false;
  }
  
  private calculateJudgment(timingErrorMs: number): 'perfect' | 'good' | 'miss' {
    if (timingErrorMs <= JUDGMENT_TIMING.perfectMs) return 'perfect';
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
    const baseScore = (this.score.goodCount / Math.max(1, this.score.totalNotes)) * 800;
    const comboBonus = Math.min(this.score.maxCombo * 2, 200);
    return Math.min(Math.round(baseScore + comboBonus), 1000);
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
    const visibleNotes: ActiveNote[] = [];
    
    // **新しいノーツを表示開始 - 重複防止の改善**
    for (const note of this.notes) {
      // appearTimeが計算されていない場合は計算
      if (!note.appearTime) {
        note.appearTime = note.time - LOOKAHEAD_TIME; // 常に3秒前に出現
      }
      
      // ノート生成条件を厳密に制限
      const shouldAppear = currentTime >= note.appearTime && 
                          currentTime < note.time + CLEANUP_TIME; // <= から < に変更
      const alreadyActive = this.activeNotes.has(note.id);
      
      // 一度削除されたノートは二度と生成しない
      const wasProcessed = (note as any)._wasProcessed;
      
      if (shouldAppear && !alreadyActive && !wasProcessed) {
        const activeNote: ActiveNote = {
          ...note,
          state: 'visible',
          y: this.calculateNoteY(note, currentTime)
        };
        
        this.activeNotes.set(note.id, activeNote);
        // デバッグログを条件付きで表示
        if (Math.abs(currentTime - note.time) < 4.0) { // 判定時間の±4秒以内のみログ
          console.log(`🎵 新しいノート出現: ${note.id} (pitch=${note.pitch}, time=${note.time}, y=${activeNote.y?.toFixed(1) || 'undefined'})`);
        }
      }
    }
    
    // アクティブノーツの状態更新
    for (const [noteId, note] of this.activeNotes) {
      const updatedNote = this.updateNoteState(note, currentTime);
      
      // 判定ライン通過検出
      this.checkHitLineCrossing(updatedNote, currentTime);
      
      if (updatedNote.state === 'completed') {
        // 削除時に元ノートにフラグを設定
        const originalNote = this.notes.find(n => n.id === noteId);
        if (originalNote) {
          (originalNote as any)._wasProcessed = true;
        }
        
        this.activeNotes.delete(noteId);
        // デバッグログを条件付きで表示
        if (Math.abs(currentTime - note.time) < 4.0) {
          console.log(`🗑️ ノート削除: ${noteId} (state: completed)`);
        }
      } else {
        this.activeNotes.set(noteId, updatedNote);
        visibleNotes.push(updatedNote);
      }
    }
    
    return visibleNotes;
  }
  
  private updateNoteState(note: ActiveNote, currentTime: number): ActiveNote {
    const timePassed = currentTime - note.time;
    
    // Miss判定チェック
    if (note.state === 'visible' && timePassed > JUDGMENT_TIMING.missMs / 1000) {
      return { ...note, state: 'missed' };
    }
    
    // Missedノーツの早期クリーンアップ（画面下端に到達したら即座に削除）
    if (note.state === 'missed' && timePassed > 0.5) {
      return { ...note, state: 'completed' };
    }
    
    // 通常のクリーンアップチェック
    if (timePassed > CLEANUP_TIME) {
      return { ...note, state: 'completed' };
    }
    
    // 前フレームのY座標を保存してから新しいY座標を計算
    const previousY = note.y;
    const newY = this.calculateNoteY(note, currentTime);
    
    return {
      ...note,
      previousY,
      y: newY
    };
  }

  private checkHitLineCrossing(note: ActiveNote, currentTime: number): void {
    // 動的レイアウト対応: 設定値からヒットラインを計算
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight; // 判定ライン位置

    const noteHeight = 28;
    const noteCenter = (note.y || 0) + noteHeight / 2;
    const prevNoteCenter = (note.previousY || 0) + noteHeight / 2;
    
    // 判定ラインを通過した瞬間を検出（中心がラインに到達したフレームも含む）
    if (note.previousY !== undefined && 
        prevNoteCenter <= hitLineY && 
        noteCenter >= hitLineY &&
        note.state === 'visible' &&
        !note.crossingLogged) { // 重複ログ防止
      
      const timeError = (currentTime - note.time) * 1000; // ms
      console.log(`⚡ 判定ライン通過: ${note.id} (時間誤差: ${timeError.toFixed(1)}ms, 実際時刻: ${currentTime.toFixed(3)}s, 理論時刻: ${note.time.toFixed(3)}s)`);
      
      // 重複ログ防止フラグを設定
      note.crossingLogged = true;
    }
  }
  
  private calculateNoteY(note: NoteData, currentTime: number): number {
    const timeToHit = note.time - currentTime;
    
    // 動的レイアウト対応
    const screenHeight = this.settings.viewportHeight ?? 600;
    const pianoHeight = this.settings.pianoHeight ?? 80;
    const hitLineY = screenHeight - pianoHeight; // 判定ライン位置

    const noteHeight = 28;
    
    // **改善されたタイミング計算**
    // 基本の降下時間は一定（速度設定はビジュアル速度のみ）
    const baseFallDuration = LOOKAHEAD_TIME; // 常に3秒で降下
    const visualSpeedMultiplier = this.settings.notesSpeed; // ビジュアル速度乗数
    
    // 実際の物理降下距離とタイミング
    const startY = -noteHeight; // 画面上端より少し上から開始
    const endY = hitLineY - (noteHeight / 2); // 判定ライン（ノーツの上端が判定ラインに到達）
    const totalDistance = endY - startY; // 総降下距離
    
    // **高精度計算**: 速度設定は見た目の速度のみ、タイミングは変更しない
    const pixelsPerSecond = (totalDistance / baseFallDuration) * visualSpeedMultiplier;
    
    // timeToHit = 0の瞬間にノーツ中心が判定ラインに正確に到達するように計算
    const perfectY = endY - (timeToHit * pixelsPerSecond);
    
    // 表示範囲制限（画面外は描画しない）
    const minY = startY - 100; // 上端より上
    const maxY = screenHeight + 100; // 下端より下
    
    const finalY = Math.max(minY, Math.min(perfectY, maxY));
    
    return Math.round(finalY * 10) / 10; // 小数点第1位まで精度を保つ
  }
  
  private checkABRepeatLoop(currentTime: number): void {
    if (!this.abRepeatEnabled || this.abRepeatStart === null || this.abRepeatEnd === null) {
      return;
    }
    
    if (currentTime >= this.abRepeatEnd) {
      // ABリピート時の完全リセット
      console.log(`🔄 ABリピート: ${currentTime.toFixed(2)}s → ${this.abRepeatStart.toFixed(2)}s`);
      this.seek(this.abRepeatStart);
    }
  }
  
  private startGameLoop(): void {
    const gameLoop = () => {
      const currentTime = this.getCurrentTime();
      const activeNotes = this.updateNotes(currentTime);
      
      // ABリピートチェック
      this.checkABRepeatLoop(currentTime);
      
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
          note.judged = true; // 重複判定を防ぐフラグ
        }
      }
      
      const timing: MusicalTiming = {
        currentTime,
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      };
      
      this.onUpdate?.({
        currentTime,
        activeNotes,
        timing,
        score: { ...this.score },
        abRepeatState: {
          start: this.abRepeatStart,
          end: this.abRepeatEnd,
          enabled: this.abRepeatEnabled
        }
      });
      
      this.animationFrame = requestAnimationFrame(gameLoop);
    };
    
    this.animationFrame = requestAnimationFrame(gameLoop);
  }
  
  private stopGameLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}