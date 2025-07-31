/**
 * リズムモード動作テスト用のサンプルステージデータ
 */

import type { FantasyStage } from '@/components/fantasy/FantasyGameEngine';

export const sampleRhythmStageRandom: FantasyStage = {
  id: 'rhythm-test-random',
  stageNumber: 'R-1',
  name: 'リズムテスト（ランダム）',
  description: 'リズムランダムパターンのテストステージ',
  maxHp: 5,
  enemyGaugeSeconds: 4,
  enemyCount: 20,
  enemyHp: 1,
  minDamage: 1,
  maxDamage: 1,
  mode: 'single',
  allowedChords: ['C', 'G', 'Am', 'F'],
  showSheetMusic: true,
  showGuide: true,
  monsterIcon: 'fa-drum',
  simultaneousMonsterCount: 4,
  
  // リズムゲーム設定
  gameType: 'rhythm',
  rhythmPattern: 'random',
  bpm: 120,
  timeSignature: 4,
  loopMeasures: 8,
  measureCount: 8,
  mp3Url: '/demo-1.mp3',
};

export const sampleRhythmStageProgression: FantasyStage = {
  id: 'rhythm-test-progression',
  stageNumber: 'R-2',
  name: 'リズムテスト（プログレッション）',
  description: 'リズムプログレッションパターンのテストステージ',
  maxHp: 5,
  enemyGaugeSeconds: 4,
  enemyCount: 16,
  enemyHp: 1,
  minDamage: 1,
  maxDamage: 1,
  mode: 'progression',
  allowedChords: ['C', 'G', 'Am', 'F'],
  showSheetMusic: true,
  showGuide: true,
  monsterIcon: 'fa-music',
  simultaneousMonsterCount: 4,
  
  // リズムゲーム設定
  gameType: 'rhythm',
  rhythmPattern: 'progression',
  bpm: 100,
  timeSignature: 4,
  loopMeasures: 4,
  measureCount: 4,
  mp3Url: '/demo-1.mp3',
  
  // プログレッション用コードデータ
  chordProgressionData: [
    { chord: 'C', measure: 1, beat: 1 },
    { chord: 'G', measure: 1, beat: 3 },
    { chord: 'Am', measure: 2, beat: 1 },
    { chord: 'F', measure: 2, beat: 3 },
    { chord: 'C', measure: 3, beat: 1 },
    { chord: 'G', measure: 3, beat: 3 },
    { chord: 'Am', measure: 4, beat: 1 },
    { chord: 'F', measure: 4, beat: 3 },
  ],
};

export const sampleQuizStage: FantasyStage = {
  id: 'quiz-test',
  stageNumber: 'Q-1',
  name: 'クイズテスト',
  description: '既存のクイズモードのテストステージ',
  maxHp: 5,
  enemyGaugeSeconds: 4,
  enemyCount: 10,
  enemyHp: 1,
  minDamage: 1,
  maxDamage: 1,
  mode: 'single',
  allowedChords: ['C', 'G', 'Am', 'F'],
  showSheetMusic: true,
  showGuide: true,
  monsterIcon: 'fa-dragon',
  simultaneousMonsterCount: 1,
  
  // クイズゲーム設定（デフォルト）
  gameType: 'quiz',
};