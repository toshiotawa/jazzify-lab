/**
 * TaikoUIStrategy
 * 太鼓の達人モード用UI戦略
 */

import type { UIStrategy } from './UIStrategy';
import type { FantasyStage, ChordDefinition } from '../FantasyGameEngine';
import { TaikoNoteScheduler } from './TaikoNoteScheduler';
import { TaikoRenderer } from './TaikoRenderer';
import { TaikoJudge } from './TaikoJudge';
import type { TaikoNote, TaikoJudgeResult, TaikoSchedule } from '@/types/taiko';
import { bgmManager } from '@/utils/BGMManager';
import { devLog } from '@/utils/logger';
import * as PIXI from 'pixi.js';

interface TaikoUIStrategyDeps {
  container: PIXI.Container;
  stageWidth: number;
  onPlayerHit: (chordId: string) => void;
  onEnemyAttack: () => void;
  getChordDefinition: (id: string) => ChordDefinition | null;
}

export class TaikoUIStrategy implements UIStrategy {
  private scheduler: TaikoNoteScheduler;
  private renderer: TaikoRenderer;
  private judge: TaikoJudge;
  private deps: TaikoUIStrategyDeps;
  private schedule: TaikoSchedule | null = null;
  private startTimeMs: number = 0;
  private scheduledNotes: Set<string> = new Set();
  private lookAheadMs = 3000; // 3秒先までのノーツをスケジュール

  constructor(deps: TaikoUIStrategyDeps) {
    this.deps = deps;
    this.scheduler = new TaikoNoteScheduler();
    this.renderer = new TaikoRenderer(deps.container, deps.stageWidth);
    this.judge = new TaikoJudge();

    // 判定コールバックを設定
    this.judge.setOnJudge(this.handleJudgeResult.bind(this));
    this.judge.setOnEnemyAttack(deps.onEnemyAttack);
  }

  init(stage: FantasyStage): void {
    devLog.debug('TaikoUIStrategy init:', { stage });

    // スケジュールを生成
    this.schedule = this.scheduler.generateSchedule(stage);
    if (!this.schedule) {
      devLog.error('Failed to generate taiko schedule');
      return;
    }

    // 開始時刻を設定
    this.startTimeMs = performance.now();
    this.renderer.setStartTime(this.startTimeMs);

    // BGMManagerにビートコールバックを設定
    bgmManager.setBeatCallback((bar, beat, absMs) => {
      devLog.debug('Beat callback:', { bar, beat, absMs });
    });

    devLog.debug('TaikoUIStrategy initialized:', {
      notesCount: this.schedule.notes.length,
      measureCount: this.schedule.measureCount,
      bpm: this.schedule.bpm
    });
  }

  onPlayerInput(midi: number, timestamp: number): void {
    // 太鼓の達人モードでは判定ウィンドウ外の入力は無視
    const currentTimeMs = performance.now() - this.startTimeMs;
    const notesInWindow = this.scheduler.getNotesAt(currentTimeMs, 300);
    
    if (notesInWindow.length > 0) {
      this.judge.onInput(midi, timestamp);
    }
  }

  update(currentTimeMs: number): void {
    if (!this.schedule) return;

    const relativeTimeMs = currentTimeMs - this.startTimeMs;

    // ループ処理
    if (relativeTimeMs > this.schedule.loopEndMs) {
      this.startTimeMs += (this.schedule.loopEndMs - this.schedule.loopStartMs);
      this.scheduledNotes.clear();
      this.judge.clearProcessedNotes();
      devLog.debug('Loop reset');
    }

    // 先読みしてノーツをスケジュール
    const futureNotes = this.schedule.notes.filter(note => {
      const timeDiff = note.absTimeMs - relativeTimeMs;
      return timeDiff > 0 && timeDiff <= this.lookAheadMs && !this.scheduledNotes.has(note.id);
    });

    for (const note of futureNotes) {
      this.renderer.scheduleNote(note, relativeTimeMs);
      this.scheduledNotes.add(note.id);
    }

    // レンダラーを更新
    this.renderer.update(relativeTimeMs);

    // 判定処理
    const currentNotes = this.scheduler.getNotesAt(relativeTimeMs, 300);
    this.judge.judge(currentNotes, relativeTimeMs, this.deps.getChordDefinition);
  }

  private handleJudgeResult(result: TaikoJudgeResult): void {
    // 判定エフェクトを表示（noneタイプは除外）
    if (result.type === 'good' || result.type === 'bad') {
      this.renderer.showJudgeEffect(result.type);
    }

    // GOODの場合はプレイヤーのヒット処理を呼ぶ
    if (result.type === 'good' && result.noteId) {
      const note = this.schedule?.notes.find(n => n.id === result.noteId);
      if (note) {
        this.deps.onPlayerHit(note.chordId);
      }
    }

    // ノーツを削除
    if (result.noteId) {
      this.renderer.removeNote(result.noteId);
    }
  }

  destroy(): void {
    bgmManager.setBeatCallback(null);
    this.scheduler.destroy();
    this.renderer.destroy();
    this.judge.destroy();
    this.schedule = null;
    this.scheduledNotes.clear();
  }
}