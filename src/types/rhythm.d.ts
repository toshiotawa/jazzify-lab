export type RhythmMode = 'random' | 'progression';

export interface RhythmNote {
  id: string;
  measure: number;
  beat: number;          // 1,1.5,3.75 …
  chord: string;
  spawnAt: number;       // sec – BGM timeline
}

export interface JudgmentWindow {
  start: number;         // sec
  end: number;           // sec
}

export interface RhythmGameState {
  /** 現在のループ index (0 origin) */
  loop: number;
  /** notes 配列は常に「今ループ分」のみ保持 */
  notes: RhythmNote[];
  /** 今判定対象になっているノート */
  activeNote: RhythmNote | null;
  /** プレイヤー HP (0 = game-over) */
  playerHp: number;
  /** 敵 HP */
  enemyHp: number;
  /** 敵行動ゲージ 0-100 */
  enemyGauge: number;
  /** 判定ウィンドウ現在値 */
  window: JudgmentWindow | null;
  /** ゲーム進行中フラグ */
  playing: boolean;
  /** 現在のBGM時間 */
  currentTime: number;
}