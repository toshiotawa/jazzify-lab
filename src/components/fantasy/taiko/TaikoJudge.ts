/**
 * TaikoJudge
 * 太鼓の達人風の判定処理
 */

import type { TaikoNote, TaikoJudgeResult } from '@/types/taiko';
import type { ChordDefinition } from '../FantasyGameEngine';
import { checkChordMatch } from './checkChordMatch';
import { devLog } from '@/utils/logger';

interface InputBuffer {
  notes: number[];
  timestamp: number;
}

export class TaikoJudge {
  private judgeWindowMs = 300; // ±300ms
  private inputBuffer: InputBuffer = { notes: [], timestamp: 0 };
  private processedNotes: Set<string> = new Set(); // 処理済みノーツID
  private onJudgeCallback?: (result: TaikoJudgeResult) => void;
  private onEnemyAttackCallback?: () => void;

  /**
   * 判定コールバックを設定
   */
  setOnJudge(callback: (result: TaikoJudgeResult) => void) {
    this.onJudgeCallback = callback;
  }

  /**
   * 敵攻撃コールバックを設定
   */
  setOnEnemyAttack(callback: () => void) {
    this.onEnemyAttackCallback = callback;
  }

  /**
   * 入力を受け取る
   */
  onInput(midiNote: number, timestamp: number) {
    // 既存の入力に追加
    this.inputBuffer.notes.push(midiNote);
    this.inputBuffer.timestamp = timestamp;
    
    devLog.debug('TaikoJudge input:', {
      note: midiNote,
      totalNotes: this.inputBuffer.notes.length,
      timestamp
    });
  }

  /**
   * 入力をクリア
   */
  clearInput() {
    this.inputBuffer = { notes: [], timestamp: 0 };
  }

  /**
   * 判定処理
   */
  judge(currentNotes: TaikoNote[], currentTimeMs: number, getChordDefinition: (id: string) => ChordDefinition | null) {
    // 判定ウィンドウ内のノーツを処理
    for (const note of currentNotes) {
      // すでに処理済みの場合はスキップ
      if (this.processedNotes.has(note.id)) {
        continue;
      }

      const timeDiff = currentTimeMs - note.absTimeMs;
      
      // 判定ウィンドウ内かチェック（-300ms ~ +300ms）
      if (Math.abs(timeDiff) <= this.judgeWindowMs) {
        // コード定義を取得
        const chordDef = getChordDefinition(note.chordId);
        if (!chordDef) {
          continue;
        }

        // 入力されたコードをチェック
        if (this.inputBuffer.notes.length > 0 && checkChordMatch(this.inputBuffer.notes, chordDef)) {
          // GOOD判定
          this.processedNotes.add(note.id);
          this.clearInput();
          
          const result: TaikoJudgeResult = {
            type: 'good',
            timestamp: currentTimeMs,
            noteId: note.id
          };
          
          this.onJudgeCallback?.(result);
          
          devLog.debug('TaikoJudge GOOD:', {
            noteId: note.id,
            chord: note.chordId,
            timeDiff
          });
        }
      }
      // 判定ウィンドウを過ぎた場合（+300ms以上）
      else if (timeDiff > this.judgeWindowMs) {
        // まだ処理されていない場合はBAD判定
        if (!this.processedNotes.has(note.id)) {
          this.processedNotes.add(note.id);
          
          const result: TaikoJudgeResult = {
            type: 'bad',
            timestamp: currentTimeMs,
            noteId: note.id
          };
          
          this.onJudgeCallback?.(result);
          
          // 敵の攻撃を発生させる
          this.onEnemyAttackCallback?.();
          
          devLog.debug('TaikoJudge BAD (timeout):', {
            noteId: note.id,
            chord: note.chordId,
            timeDiff
          });
        }
      }
    }

    // 古い入力を削除（300ms以上前の入力は無効）
    if (this.inputBuffer.timestamp > 0 && currentTimeMs - this.inputBuffer.timestamp > this.judgeWindowMs) {
      this.clearInput();
    }
  }

  /**
   * 処理済みノーツをクリア（ループ時など）
   */
  clearProcessedNotes() {
    this.processedNotes.clear();
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.clearInput();
    this.processedNotes.clear();
    this.onJudgeCallback = undefined;
    this.onEnemyAttackCallback = undefined;
  }
}