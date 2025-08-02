import { useTimeStore } from '@/stores/timeStore';
import { ChordDefinition } from './FantasyGameEngine';
import { devLog } from '@/utils/logger';

export interface RhythmEvent {
  spawnAt: number;    // ノーツが出現する時刻
  judgeAt: number;    // 判定時刻（小節の1拍目）
  chordId: string;    // 出題するコードID
  chord?: ChordDefinition; // コードの詳細情報
  spawned?: boolean;  // 既に生成済みか
}

export interface RhythmNote {
  id: string;
  chord: ChordDefinition;
  spawnTime: number;
  judgeTime: number;
  x: number;
  y: number;
}

export class RhythmScheduler {
  private queue: RhythmEvent[] = [];
  private activeNotes: RhythmNote[] = [];
  private noteIdCounter = 0;
  
  constructor() {
    this.queue = [];
    this.activeNotes = [];
  }
  
  /**
   * 次の判定タイミング（次の小節の1拍目）を計算
   */
  private calcNextDownbeat(): { measure: number; beat: number } {
    const ts = useTimeStore.getState();
    const now = ts.getNow();
    
    if (ts.startAt === null) {
      return { measure: 1, beat: 1 };
    }
    
    const elapsed = now - ts.startAt - ts.readyDuration;
    const msPerBeat = ts.getMsPerBeat();
    const beatsFromStart = Math.max(0, elapsed / msPerBeat);
    
    // 現在の小節を計算（カウントイン込み）
    const currentTotalMeasure = Math.floor(beatsFromStart / ts.timeSignature);
    
    // 次の小節の1拍目
    const nextMeasure = currentTotalMeasure + 1;
    
    return { measure: nextMeasure, beat: 1 };
  }
  
  /**
   * 次の問題をスケジュール
   */
  planNext(chordId: string, chord?: ChordDefinition) {
    const ts = useTimeStore.getState();
    const nextDownbeat = this.calcNextDownbeat();
    
    // 判定時刻（次の小節の1拍目）
    const judgeAt = ts.getAbsoluteTimeOfBeat(nextDownbeat.measure, 1);
    
    // 出現時刻（3拍前）
    const spawnAt = judgeAt - 3 * ts.getMsPerBeat();
    
    this.queue.push({
      spawnAt,
      judgeAt,
      chordId,
      chord,
      spawned: false
    });
    
    devLog.debug('🎵 次の問題をスケジュール:', {
      chordId,
      nextMeasure: nextDownbeat.measure,
      spawnAt: new Date(spawnAt).toISOString(),
      judgeAt: new Date(judgeAt).toISOString(),
      deltaMs: judgeAt - spawnAt
    });
  }
  
  /**
   * 現在時刻でスポーンすべきイベントをチェック
   */
  update(now: number): RhythmNote[] {
    const newNotes: RhythmNote[] = [];
    
    // スポーン時刻に達したイベントを処理
    for (const event of this.queue) {
      if (!event.spawned && now >= event.spawnAt) {
        event.spawned = true;
        
        if (event.chord) {
          const note: RhythmNote = {
            id: `note_${this.noteIdCounter++}`,
            chord: event.chord,
            spawnTime: event.spawnAt,
            judgeTime: event.judgeAt,
            x: 0, // 初期位置（右端）
            y: 0  // 中央
          };
          
          this.activeNotes.push(note);
          newNotes.push(note);
          
          devLog.debug('🎯 ノーツ生成:', {
            id: note.id,
            chord: event.chord.displayName,
            spawnTime: new Date(event.spawnAt).toISOString()
          });
        }
      }
    }
    
    // 古いイベントを削除（判定時刻を過ぎて1秒以上経過したもの）
    this.queue = this.queue.filter(event => now < event.judgeAt + 1000);
    
    // 古いノーツを削除
    this.activeNotes = this.activeNotes.filter(note => now < note.judgeTime + 1000);
    
    return newNotes;
  }
  
  /**
   * 現在の判定ウィンドウ内にあるノーツを取得
   */
  getNotesInJudgementWindow(now: number, windowMs: number = 200): RhythmNote[] {
    return this.activeNotes.filter(note => {
      const delta = Math.abs(now - note.judgeTime);
      return delta <= windowMs;
    });
  }
  
  /**
   * 判定ウィンドウを過ぎたノーツを取得
   */
  getMissedNotes(now: number, windowMs: number = 200): RhythmNote[] {
    return this.activeNotes.filter(note => {
      return now > note.judgeTime + windowMs;
    });
  }
  
  /**
   * アクティブなノーツを取得
   */
  getActiveNotes(): RhythmNote[] {
    return this.activeNotes;
  }
  
  /**
   * 特定のノーツを削除
   */
  removeNote(noteId: string) {
    this.activeNotes = this.activeNotes.filter(note => note.id !== noteId);
  }
  
  /**
   * 全てクリア
   */
  clear() {
    this.queue = [];
    this.activeNotes = [];
    this.noteIdCounter = 0;
  }
  
  /**
   * 現在判定可能なコードを取得
   */
  getCurrentJudgeableChord(now: number, windowMs: number = 200): ChordDefinition | null {
    const notes = this.getNotesInJudgementWindow(now, windowMs);
    return notes.length > 0 ? notes[0].chord : null;
  }
}