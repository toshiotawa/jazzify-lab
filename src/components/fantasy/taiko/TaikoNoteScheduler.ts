/**
 * TaikoNoteScheduler
 * コード進行情報を太鼓の達人風のノーツ列に変換
 */

import { v4 as uuidv4 } from 'uuid';
import type { TaikoNote, TaikoSchedule, ChordProgressionData } from '@/types/taiko';
import type { FantasyStage } from '../FantasyGameEngine';
import { devLog } from '@/utils/logger';

export class TaikoNoteScheduler {
  private schedule: TaikoSchedule | null = null;

  /**
   * ステージ情報からノーツスケジュールを生成
   */
  generateSchedule(stage: FantasyStage): TaikoSchedule | null {
    if (stage.mode !== 'progression') {
      return null;
    }

    const bpm = stage.bpm || 120;
    const timeSig = stage.timeSignature || 4;
    const measureCount = stage.measureCount || 8;
    const countIn = stage.countInMeasures || 0;
    
    const msPerBeat = (60 / bpm) * 1000;
    const msPerMeasure = msPerBeat * timeSig;
    const loopStartMs = countIn * msPerMeasure;
    const loopEndMs = (countIn + measureCount) * msPerMeasure;

    let notes: TaikoNote[] = [];

    // 拡張版（chord_progression_dataがある場合）
    if (stage.chordProgressionData) {
      try {
        const progressionData = this.parseProgressionData(stage.chordProgressionData);
        notes = this.generateNotesFromData(progressionData, countIn, msPerBeat, timeSig);
      } catch (error) {
        devLog.error('Failed to parse chord_progression_data:', error);
        // パースエラーの場合は基本版にフォールバック
        if (stage.chordProgression) {
          notes = this.generateNotesFromBasic(stage.chordProgression, measureCount, countIn, msPerBeat, timeSig);
        }
      }
    }
    // 基本版（chord_progressionのみの場合）
    else if (stage.chordProgression) {
      notes = this.generateNotesFromBasic(stage.chordProgression, measureCount, countIn, msPerBeat, timeSig);
    }

    if (notes.length === 0) {
      return null;
    }

    this.schedule = {
      notes,
      measureCount,
      bpm,
      timeSig,
      loopStartMs,
      loopEndMs
    };

    return this.schedule;
  }

  /**
   * 基本版：各小節の頭にコードを配置
   */
  private generateNotesFromBasic(
    chordProgression: string[],
    measureCount: number,
    countIn: number,
    msPerBeat: number,
    timeSig: number
  ): TaikoNote[] {
    const notes: TaikoNote[] = [];
    const msPerMeasure = msPerBeat * timeSig;

    for (let measure = 0; measure < measureCount; measure++) {
      const chordIndex = measure % chordProgression.length;
      const chord = chordProgression[chordIndex];
      const bar = countIn + measure + 1; // 1開始
      const absTimeMs = (countIn + measure) * msPerMeasure;

      notes.push({
        id: uuidv4(),
        bar,
        beat: 1, // 小節の頭
        absTimeMs,
        chordId: chord,
        displayName: chord
      });
    }

    return notes;
  }

  /**
   * 拡張版：chord_progression_dataから詳細なタイミングでノーツを生成
   */
  private generateNotesFromData(
    progressionData: ChordProgressionData[],
    countIn: number,
    msPerBeat: number,
    timeSig: number
  ): TaikoNote[] {
    const notes: TaikoNote[] = [];
    const msPerMeasure = msPerBeat * timeSig;

    for (const data of progressionData) {
      // カウントイン後の小節として計算
      const actualBar = countIn + data.bar;
      const measureStartMs = (actualBar - 1) * msPerMeasure;
      const beatOffsetMs = (data.beat - 1) * msPerBeat;
      const absTimeMs = measureStartMs + beatOffsetMs;

      notes.push({
        id: uuidv4(),
        bar: actualBar,
        beat: data.beat,
        absTimeMs,
        chordId: data.chord,
        displayName: data.chord
      });
    }

    // 小節番号でソート
    notes.sort((a, b) => a.absTimeMs - b.absTimeMs);

    return notes;
  }

  /**
   * chord_progression_dataのパース
   * 簡易テキスト形式をサポート
   * 例: "bar 1 beats 3 chord C\nbar 2 beats 1 chord F"
   */
  private parseProgressionData(data: any): ChordProgressionData[] {
    // すでに配列形式の場合はそのまま返す
    if (Array.isArray(data)) {
      return data;
    }

    // 文字列形式の簡易パース
    if (typeof data === 'string') {
      const lines = data.trim().split('\n');
      const result: ChordProgressionData[] = [];

      for (const line of lines) {
        const match = line.match(/bar\s+(\d+)\s+beats?\s+(\d+)\s+chord\s+(\S+)/i);
        if (match) {
          result.push({
            bar: parseInt(match[1], 10),
            beat: parseInt(match[2], 10),
            chord: match[3]
          });
        }
      }

      return result;
    }

    // JSONオブジェクト形式
    if (typeof data === 'object' && data.notes) {
      return data.notes;
    }

    throw new Error('Invalid chord_progression_data format');
  }

  /**
   * 現在のスケジュールを取得
   */
  getSchedule(): TaikoSchedule | null {
    return this.schedule;
  }

  /**
   * 特定時刻のノーツを取得
   */
  getNotesAt(currentTimeMs: number, windowMs: number = 300): TaikoNote[] {
    if (!this.schedule) return [];

    return this.schedule.notes.filter(note => {
      const diff = Math.abs(note.absTimeMs - currentTimeMs);
      return diff <= windowMs;
    });
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.schedule = null;
  }
}