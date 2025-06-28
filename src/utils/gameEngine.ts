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
export const CLEANUP_TIME = 2.0;        // 2秒後にクリーンアップ（従来比 +1s）
export const MISSED_CLEANUP_TIME = 1.0; // Miss 判定後 1秒間は残す

// ===== 描画関連定数 =====
/** PIXI.js ノートスプライトの高さ(px) と合わせる */
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
  
  private animationFrame: number | null = null;
  private onUpdate?: (data: GameEngineUpdate) => void;
  private onJudgment?: (judgment: JudgmentResult) => void;
  
  constructor(settings: GameSettings) {
    this.settings = settings;
  }
  
  setUpdateCallback(callback: (data: GameEngineUpdate) => void): void {
    this.onUpdate = callback;
  }
  
  /** 判定イベント受信側を登録 */
  setJudgmentCallback(callback: (judgment: JudgmentResult) => void): void {
    this.onJudgment = callback;
  }
  
  loadSong(notes: NoteData[]): void {
    console.log(`🎵 GameEngine: ${notes.length}ノーツを読み込み開始`);
    
    // タイミング調整は判定時のみ適用し、表示タイミングは変更しない
    this.notes = notes.map((note, index) => ({
      ...note,
      id: note.id || `note-${index}`,
      // 表示タイミングは元のまま保持
      time: note.time,
      // 表示開始時間の計算
      appearTime: note.time - LOOKAHEAD_TIME
    }));
    
    console.log(`🎵 GameEngine: ${this.notes.length}ノーツ読み込み完了`, {
      firstNoteTime: this.notes[0]?.time,
      lastNoteTime: this.notes[this.notes.length - 1]?.time
    });
    
    // アクティブノーツをクリア
    this.activeNotes.clear();
    
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
    // 現在の論理時間を保持（旧スピードで計算）
    const currentLogicalTime = this.getCurrentTime();

    // 設定更新
    this.settings = settings;

    const newSpeed = this.settings.playbackSpeed ?? 1;

    // スピードが変化した場合、startTime を調整してタイムラインを連続に保つ
    if (this.audioContext && prevSpeed !== newSpeed) {
      // elapsedNew * newSpeed = currentLogicalTime を満たすように startTime を再計算
      const elapsedNew = currentLogicalTime / newSpeed;
      this.startTime = this.audioContext.currentTime - elapsedNew - this.latencyOffset;
    }

    // notesSpeed が変化した場合、未処理ノートの appearTime を更新
    const dynamicLookahead = this.getLookaheadTime();
    this.notes.forEach((note) => {
      // まだ appearTime を計算済みでも更新
      note.appearTime = note.time - dynamicLookahead;
    });
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
        start: null,
        end: null,
        enabled: false
      }
    };
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

    console.log(`🔧 レイテンシ計算: base=${(baseLatency*1000).toFixed(1)}ms, output=${(outputLatency*1000).toFixed(1)}ms, manual=${(manualCompensation*1000).toFixed(1)}ms → total=${(this.latencyOffset*1000).toFixed(1)}ms`);
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
    const visibleNotes: ActiveNote[] = [];
    
    // **新しいノーツを表示開始 - 重複防止の改善**
    for (const note of this.notes) {
      // appearTimeが計算されていない場合は計算
      if (!note.appearTime) {
        note.appearTime = note.time - this.getLookaheadTime(); // 動的先読み
      }
      
      // ノート生成条件を厳密に制限
      const shouldAppear = currentTime >= note.appearTime && 
                          currentTime < note.time + this.getCleanupTime(); // <= から < に変更
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
        // if (Math.abs(currentTime - note.time) < 4.0) { // 判定時間の±4秒以内のみログ
        //   console.log(`🎵 新しいノート出現: ${note.id} (pitch=${note.pitch}, time=${note.time}, y=${activeNote.y?.toFixed(1) || 'undefined'})`);
        // }
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
        // if (Math.abs(currentTime - note.time) < 4.0) {
        //   console.log(`🗑️ ノート削除: ${noteId} (state: completed)`);
        // }
      } else {
        this.activeNotes.set(noteId, updatedNote);
        visibleNotes.push(updatedNote);
      }
    }
    
    return visibleNotes;
  }
  
  private updateNoteState(note: ActiveNote, currentTime: number): ActiveNote {
    const timePassed = currentTime - note.time;
    
    // *自動ヒットは checkHitLineCrossing で処理*
    
    // Hit状態のノーツは短時間後に削除（エフェクト表示のため）
    if (note.state === 'hit' && note.hitTime && (currentTime - note.hitTime) > 0.3) {
      return { ...note, state: 'completed' };
    }
    
    // Miss判定チェック (判定幅は固定)
    if (note.state === 'visible' && timePassed > JUDGMENT_TIMING.missMs / 1000) {
      return { ...note, state: 'missed' };
    }
    
    // Missed ノーツは速度に応じた時間残してから削除
    if (note.state === 'missed' && timePassed > this.getMissedCleanupTime()) {
      return { ...note, state: 'completed' };
    }
    
    // 通常のクリーンアップチェック (速度に応じて延長)
    if (timePassed > this.getCleanupTime()) {
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

    const noteCenter = (note.y || 0);
    const prevNoteCenter = (note.previousY || 0);
    
    // タイミング調整を考慮した判定時間
    const timingAdjustmentSec = (this.settings.timingAdjustment || 0) / 1000;
    const adjustedNoteTime = note.time + timingAdjustmentSec;
    
    // 判定ラインを通過した瞬間を検出（中心がラインに到達したフレームも含む）
    if (note.previousY !== undefined && 
        prevNoteCenter <= hitLineY && 
        noteCenter >= hitLineY &&
        note.state === 'visible' &&
        !note.crossingLogged) { // 重複ログ防止

      const timeError = (currentTime - adjustedNoteTime) * 1000; // ms
      console.log(`⚡ 判定ライン通過: ${note.id} (タイミング調整済み時間誤差: ${timeError.toFixed(1)}ms, 練習ガイド: ${this.settings.practiceGuide})`);

      // 重複ログ防止フラグを即座に設定
      const updatedNote: ActiveNote = {
        ...note,
        crossingLogged: true
      };
      this.activeNotes.set(note.id, updatedNote);

      // 練習モードガイド処理
      const practiceGuide = this.settings.practiceGuide ?? 'key';
      if (practiceGuide !== 'off') {
        const effectivePitch = note.pitch + this.settings.transpose;
        
        if (practiceGuide === 'key_auto') {
          // オートプレイ: 自動的にノーツをヒット判定
          console.log(`🎹 オートプレイ実行: ノート ${note.id} (pitch=${effectivePitch})`);
          
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
          console.log(`✨ オートプレイ判定: ${judgment.type}`);
        }
        
        // 鍵盤ハイライトはPIXIRenderer側で直接処理されるため、ここでは特別な処理は不要
        console.log(`🎹 判定ライン通過検出完了: pitch=${effectivePitch}, practiceGuide=${practiceGuide} (ハイライトはPIXIRenderer側で処理)`)
      }
    }
  }
  
  private calculateNoteY(note: NoteData, currentTime: number): number {
    const timeToHit = note.time - currentTime;
    
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
          
          // 重複判定を防ぐフラグ - 新しいオブジェクトを作成して置き換え
          const updatedNote: ActiveNote = {
            ...note,
            judged: true
          };
          this.activeNotes.set(note.id, updatedNote);

          // イベント通知
          this.onJudgment?.(missJudgment);
        }
      }
      
      const timing: MusicalTiming = {
        currentTime,
        audioTime: this.audioContext?.currentTime || 0,
        latencyOffset: this.latencyOffset
      };
      
      // Immer により凍結されてもエンジン側が変更できるようディープコピーを渡す
      const activeNotesForUi = activeNotes;
      
      this.onUpdate?.({
        currentTime,
        activeNotes: activeNotesForUi,
        timing,
        score: { ...this.score },
        abRepeatState: {
          start: null,
          end: null,
          enabled: false
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