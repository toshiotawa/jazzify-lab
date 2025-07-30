/**
 * リズムモード専用の型定義
 */

import { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';

// リズムゲームの状態
export interface RhythmGameState {
  // 基本情報
  currentStage: FantasyStage | null;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  
  // スコア情報
  score: number;
  totalHits: number;
  perfectHits: number;
  goodHits: number;
  missHits: number;
  combo: number;
  maxCombo: number;
  
  // プレイヤー情報
  playerHp: number;
  playerSp: number;
  
  // 敵情報
  activeMonsters: RhythmMonsterState[];
  enemiesDefeated: number;
  totalEnemies: number;
  
  // タイミング情報
  currentMeasure: number;
  currentBeat: number;
  nextChordTiming: ChordTiming | null;
  chordTimings: ChordTiming[]; // 全てのコードタイミング
  
  // 音楽再生情報
  isPlaying: boolean;
  currentTime: number;
  loopCount: number;
  
  // ゲーム完了処理中フラグ
  isCompleting: boolean;
}

// リズムモードのモンスター状態
export interface RhythmMonsterState {
  id: string;
  index: number;
  position: 'A' | 'B' | 'C' | 'D';
  currentHp: number;
  maxHp: number;
  chordTarget: ChordDefinition;
  gaugeProgress: number;  // 0-100%
  nextAttackTiming: number;  // 次の攻撃タイミング(秒)
  icon: string;
  name: string;
  isDefeated: boolean;
}

// コードのタイミング情報
export interface ChordTiming {
  id: string;
  chord: string;
  absoluteTime: number;  // 絶対時間(秒)
  measure: number;
  beat: number;
  isHit: boolean;
  judgment?: JudgmentType;
}

// 判定タイプ
export type JudgmentType = 'perfect' | 'good' | 'miss';

// 判定ウィンドウ設定
export interface JudgmentWindow {
  perfect: number;  // ±50ms
  good: number;     // ±200ms
}

// リズムゲームエンジンのプロパティ
export interface RhythmGameEngineProps {
  stage: FantasyStage;
  onGameStateChange: (state: RhythmGameState) => void;
  onChordJudge: (judgment: JudgmentType, chord: string, monsterId: string) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: RhythmGameState) => void;
  onMonsterDefeat: (monsterId: string) => void;
}

// 音楽時間管理
export interface MusicTimeInfo {
  currentTime: number;      // 現在の再生時間（秒）
  currentMeasure: number;   // 現在の小節
  currentBeat: number;      // 現在の拍
  beatProgress: number;     // 拍の進行度（0-1）
  measureProgress: number;  // 小節の進行度（0-1）
}

// FantasyStageのインポート（循環参照を避けるため、型のみインポート）
import type { FantasyStage } from './index';