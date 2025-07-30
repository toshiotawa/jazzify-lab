/**
 * ファンタジーゲームエンジン
 * ゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import * as PIXI from 'pixi.js';
import { RhythmManager } from '@/utils/RhythmManager';
import { ProgressionManager } from '@/utils/ProgressionManager';
import { SyncMonitor } from '@/utils/SyncMonitor';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;          // コードのID（例: 'CM7', 'G7', 'Am'）
  displayName: string; // 表示名（言語・簡易化設定に応じて変更）
  notes: number[];     // MIDIノート番号の配列
  noteNames: string[]; // ★ 理論的に正しい音名配列を追加
  quality: string;     // コードの性質（'major', 'minor', 'dominant7'など）
  root: string;        // ルート音（例: 'C', 'G', 'A'）
}

interface FantasyStage {
  id: string;
  stageNumber: string;
  name: string;
  description: string;
  maxHp: number;
  enemyGaugeSeconds: number;
  enemyCount: number;
  enemyHp: number;
  minDamage: number;
  maxDamage: number;
  mode: 'single' | 'progression';
  allowedChords: string[];
  chordProgression?: string[];
  showSheetMusic: boolean;
  showGuide: boolean; // ガイド表示設定を追加
  monsterIcon: string;
  bgmUrl?: string;
  simultaneousMonsterCount: number; // 同時出現モンスター数 (1-8)
  // リズムモード関連
  game_type?: 'quiz' | 'rhythm';
  rhythm_pattern?: 'random' | 'progression';
  bpm?: number;
  time_signature?: 3 | 4;
  loop_measures?: number;
  chord_progression_data?: {
    chords: Array<{
      chord: string;
      measure: number;
      beat: number;
    }>;
  };
  mp3_url?: string;
}

interface MonsterState {
  id: string;
  index: number; // モンスターリストのインデックス
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'; // 列位置（最大8体対応）
  currentHp: number;
  maxHp: number;
  gauge: number;
  chordTarget: ChordDefinition;
  correctNotes: number[]; // このモンスター用の正解済み音
  icon: string;
  name: string;
  // リズムモード用
  timing?: {
    measure: number;
    beat: number;
    spawnTime: number; // 出現時刻（ms）
    targetTime: number; // 判定時刻（ms）
  };
  questionNumber?: number; // プログレッションパターン用
}

interface FantasyGameState {
  currentStage: FantasyStage | null;
  currentQuestionIndex: number;
  currentChordTarget: ChordDefinition | null; // 廃止予定（互換性のため残す）
  playerHp: number;
  enemyGauge: number; // 廃止予定（互換性のため残す）
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  // 複数敵システム用
  currentEnemyIndex: number; // 廃止予定（互換性のため残す）
  currentEnemyHits: number; // 廃止予定（互換性のため残す）
  enemiesDefeated: number;
  totalEnemies: number;
  // 敵のHP管理を追加
  currentEnemyHp: number; // 廃止予定（互換性のため残す）
  maxEnemyHp: number; // 廃止予定（互換性のため残す）
  // 正解した音と待機状態を追跡
  correctNotes: number[]; // 廃止予定（互換性のため残す）
  isWaitingForNextMonster: boolean;
  playerSp: number; // SPゲージ (0-5)
  // マルチモンスター対応
  activeMonsters: MonsterState[]; // 現在アクティブなモンスター配列
  monsterQueue: number[]; // 残りのモンスターインデックスのキュー
  simultaneousMonsterCount: number; // 同時表示数
  // ゲーム完了処理中フラグ
  isCompleting: boolean;
  // リズムモード関連
  rhythmManager?: RhythmManager;
  progressionManager?: ProgressionManager;
  syncMonitor?: SyncMonitor;
  isReady: boolean;
  readyCountdown: number; // 3→2→1→0
  currentMeasure: number;
  currentBeat: number;
  timeOffset: number; // 同期補正用のオフセット
}

interface FantasyGameEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: FantasyGameState) => void;
  // ▼▼▼ 変更点 ▼▼▼
  // monsterId を追加
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => void;
  // ▲▲▲ ここまで ▲▲▲
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: FantasyGameState) => void;
  onEnemyAttack: (attackingMonsterId?: string) => void;
}

// ===== コード定義データ =====

/**
 * コード定義を動的に生成する関数
 * @param chordId コードID
 * @param displayOpts 表示オプション
 * @returns ChordDefinition
 */
const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return null;
  }

  // notesをMIDIノート番号に変換
  const midiNotes = resolved.notes.map(noteName => {
    const noteObj = parseNote(noteName + '4'); // オクターブ4を付加
    return noteObj && typeof noteObj.midi === 'number' ? noteObj.midi : 60; // デフォルトでC4
  });

  return {
    id: chordId,
    displayName: resolved.displayName,
    notes: midiNotes,
    noteNames: resolved.notes, // 理論的に正しい音名配列を追加
    quality: resolved.quality,
    root: resolved.root
  };
};

// parseNoteをインポート
import { note as parseNote } from 'tonal';

// ===== 敵リスト定義 =====

const ENEMY_LIST = [
  { id: 'devil', icon: 'devil', name: '悪魔' },
  { id: 'dragon', icon: 'dragon', name: 'レッドドラゴン' },
  { id: 'mao', icon: 'mao', name: '魔王' },
  { id: 'mummy', icon: 'mummy', name: 'ミイラ' },
  { id: 'shinigami', icon: 'shinigami', name: '死神' },
  { id: 'slime_green', icon: 'slime_green', name: 'グリーンスライム' },
  { id: 'slime_red', icon: 'slime_red', name: 'レッドスライム' },
  { id: 'zombie', icon: 'zombie', name: 'ゾンビ' },
  { id: 'skeleton', icon: 'skeleton', name: 'スケルトン' },
  { id: 'grey', icon: 'grey', name: 'グレイ' },
  { id: 'pumpkin', icon: 'pumpkin', name: 'パンプキン' },
  { id: 'alien', icon: 'alien', name: '火星人' },
  { id: 'bat1', icon: 'bat1', name: 'コウモリ' },
  { id: 'bat2', icon: 'bat2', name: 'バット' },
  { id: 'ghost', icon: 'ghost', name: 'ゴースト' }
];

// ===== ヘルパー関数 =====

/**
 * キューからモンスターを生成
 */
const createMonsterFromQueue = (
  monsterIndex: number,
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
  enemyHp: number,
  allowedChords: string[],
  previousChordId?: string,
  displayOpts?: DisplayOpts,
  stageMonsterIds?: string[]
): MonsterState => {
  // stageMonsterIdsが提供されている場合は、それを使用
  let iconKey: string;
  if (stageMonsterIds && stageMonsterIds[monsterIndex]) {
    iconKey = stageMonsterIds[monsterIndex];
  } else {
    // フォールバック: 従来のランダム選択
    const rand = Math.floor(Math.random() * 63) + 1;
    iconKey = `monster_${String(rand).padStart(2, '0')}`;
  }
  
  const enemy = { id: iconKey, icon: iconKey, name: '' }; // ← name は空文字
  const chord = selectUniqueRandomChord(allowedChords, previousChordId, displayOpts);
  
  return {
    id: `${enemy.id}_${Date.now()}_${position}`,
    index: monsterIndex,
    position,
    currentHp: enemyHp,
    maxHp: enemyHp,
    gauge: 0,
    chordTarget: chord!,
    correctNotes: [],
    icon: enemy.icon,
    name: enemy.name
  };
};

/**
 * 位置を割り当て（A-H列に均等配置）
 */
const assignPositions = (count: number): ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] => {
  const allPositions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  if (count === 1) return ['D']; // 1体の場合は中央寄り
  if (count === 2) return ['C', 'F']; // 2体の場合は左右に配置
  if (count === 3) return ['B', 'D', 'F']; // 3体の場合は均等配置
  if (count === 4) return ['A', 'C', 'E', 'G']; // 4体の場合は均等配置
  if (count === 5) return ['A', 'C', 'D', 'E', 'G']; // 5体の場合
  if (count === 6) return ['A', 'B', 'C', 'E', 'F', 'G']; // 6体の場合
  if (count === 7) return ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // 7体の場合
  return allPositions.slice(0, count); // 8体以上の場合は全列使用
};

/**
 * 既に使用されているコードを除外してランダムにコードを選択
 */
/**
 * 既に使用されているコードを除外してランダムにコードを選択
 * 修正版：ユーザーの要望に基づき、直前のコードを避けることを最優先とする
 */
const selectUniqueRandomChord = (
  allowedChords: string[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  // まずは単純に全候補
  let availableChords = allowedChords
    .map(id => getChordDefinition(id, displayOpts))
    .filter(Boolean) as ChordDefinition[];

  // ---- 同じ列の直前コードだけは除外 ----
  if (previousChordId && availableChords.length > 1) {
    const tmp = availableChords.filter(c => c.id !== previousChordId);
    if (tmp.length) availableChords = tmp;
  }

  const i = Math.floor(Math.random() * availableChords.length);
  return availableChords[i] ?? null;
};

/**
 * 部分一致判定関数
 * 入力された音がコードの構成音の一部であるかチェック
 */
const isPartialMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  if (inputNotes.length === 0) return false;
  
  const inputNotesMod12 = inputNotes.map(note => note % 12);
  const targetNotesMod12 = targetChord.notes.map(note => note % 12);
  
  // 全ての入力音がターゲットコードの構成音に含まれているかチェック
  return inputNotesMod12.every(inputNote => 
    targetNotesMod12.includes(inputNote)
  );
};

/**
 * コード判定関数
 * 構成音が全て押されていれば正解（順番・オクターブ不問、転回形も正解、余分な音があっても構成音が含まれていれば正解）
 */
const checkChordMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  if (inputNotes.length === 0) {
    devLog.debug('❌ 入力なし - 不正解');
    return false;
  }
  
  // 重複を除去し、mod 12で正規化（オクターブ無視）
  const inputNotesMod12 = [...new Set(inputNotes.map(note => note % 12))]; // 重複除去も追加
  const targetNotesMod12 = [...new Set(targetChord.notes.map(note => note % 12))]; // 重複除去も追加
  
  // 転回形も考慮：すべての構成音が含まれているかチェック
  const hasAllTargetNotes = targetNotesMod12.every(targetNote => 
    inputNotesMod12.includes(targetNote)
  );
  
  devLog.debug('🎯 コード判定詳細:', { 
    targetChord: targetChord.displayName,
    targetMod12Names: targetNotesMod12.map(note => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[note];
    }),
    inputNotes: inputNotes,
    inputNotesMod12: inputNotesMod12,
    inputMod12Names: inputNotesMod12.map(note => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[note];
    }),
    hasAllTargetNotes,
    matchDetails: targetNotesMod12.map(targetNote => ({
      note: targetNote,
      found: inputNotesMod12.includes(targetNote)
    }))
  });
  
  return hasAllTargetNotes;
};

/**
 * 部分的なコードマッチ判定（正解した音を返す）
 */
const getCorrectNotes = (inputNotes: number[], targetChord: ChordDefinition): number[] => {
  if (inputNotes.length === 0) {
    return [];
  }
  
  // 重複を除去し、mod 12で正規化（オクターブ無視）
  const inputNotesMod12 = [...new Set(inputNotes.map(note => note % 12))];
  const targetNotesMod12 = [...new Set(targetChord.notes.map(note => note % 12))];
  
  // 正解した音を見つける
  const correctNotes = inputNotesMod12.filter(note => targetNotesMod12.includes(note));
  
  return correctNotes;
};

/**
 * ランダムコード選択（allowedChordsから）
 */
const selectRandomChord = (allowedChords: string[], previousChordId?: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  let availableChords = allowedChords
    .map(chordId => getChordDefinition(chordId, displayOpts))
    .filter(Boolean) as ChordDefinition[];
    
  if (availableChords.length === 0) return null;
  
  // 前回のコードと異なるコードが選択肢にあれば、それを除外する
  if (previousChordId && availableChords.length > 1) {
    const filteredChords = availableChords.filter(c => c.id !== previousChordId);
    // 除外した結果、選択肢が残っている場合のみ、絞り込んだリストを使用する
    if (filteredChords.length > 0) {
      availableChords = filteredChords;
    }
  }
  
  const randomIndex = Math.floor(Math.random() * availableChords.length);
  return availableChords[randomIndex];
};

/**
 * リズムランダムパターン用のモンスター生成タイミング計算
 */
const generateRandomRhythmTiming = (
  measure: number,
  timeSignature: number,
  bpm: number
): { measure: number; beat: number } => {
  // 各小節でランダムな拍を選択
  const possibleBeats = timeSignature === 4 
    ? [1, 1.5, 2, 2.5, 3, 3.5, 4] 
    : [1, 1.5, 2, 2.5, 3];
  
  const randomBeat = possibleBeats[Math.floor(Math.random() * possibleBeats.length)];
  
  return {
    measure,
    beat: randomBeat
  };
};

/**
 * リズムモード用のモンスター生成
 */
const createRhythmMonster = (
  monsterIndex: number,
  position: MonsterState['position'],
  hp: number,
  chord: ChordDefinition,
  timing: { measure: number; beat: number },
  bpm: number,
  startTimeMs: number,
  monsterIds: string[],
  timeSignature: number = 4  // 追加
): MonsterState => {
  const monsterId = monsterIds[monsterIndex % monsterIds.length];
  const monsterData = MONSTERS[monsterId] || MONSTERS['slime_green'];
  
  // タイミング計算 - 音楽のビート位置から逆算
  const beatDurationMs = 60000 / bpm;
  const absBeat = (timing.measure - 1) * timeSignature + (timing.beat - 1);
  const nowAudio = useRhythmStore.getState().lastAudioTime; // ★ 現在のAudio時刻(ms)
  let targetTimeMs = nowAudio + absBeat * beatDurationMs;
  const appearLeadMs = 4000; // 4秒前に出現
  // targetTime が近すぎる場合は 1 小節ずつ先送り
  while (targetTimeMs - nowAudio < appearLeadMs) {
    targetTimeMs += timeSignature * beatDurationMs;
  }
  const spawnTimeMs = targetTimeMs - appearLeadMs;
  
  // spawn以前は0、target時点で100になるように初期ゲージを計算
  let initialGauge = 0;
  if (nowAudio >= spawnTimeMs) {
    const elapsed = nowAudio - spawnTimeMs;
    const totalDuration = targetTimeMs - spawnTimeMs;
    initialGauge = Math.min(100, (elapsed / totalDuration) * 100);
  }
  
  return {
    id: `monster_${Date.now()}_${Math.random()}`,
    index: monsterIndex,
    position,
    currentHp: hp,
    maxHp: hp,
    gauge: initialGauge,
    chordTarget: chord,
    correctNotes: [],
    icon: monsterData.icon,
    name: monsterData.name,
    timing: {
      measure: timing.measure,
      beat: timing.beat,
      spawnTime: spawnTimeMs,
      targetTime: targetTimeMs
    }
  };
};

/**
 * コード進行から次のコードを取得
 */
const getProgressionChord = (progression: string[], questionIndex: number, displayOpts?: DisplayOpts): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const chordId = progression[questionIndex % progression.length];
  return getChordDefinition(chordId, displayOpts) || null;
};

/**
 * 現在の敵情報を取得
 */
const getCurrentEnemy = (enemyIndex: number) => {
  if (enemyIndex >= 0 && enemyIndex < ENEMY_LIST.length) {
    return ENEMY_LIST[enemyIndex];
  }
  return ENEMY_LIST[0]; // フォールバック
};

// ===== メインコンポーネント =====

export const useFantasyGameEngine = ({
  stage,
  onGameStateChange,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  displayOpts = { lang: 'en', simple: false }
}: FantasyGameEngineProps & { displayOpts?: DisplayOpts }) => {
  
  // ステージで使用するモンスターIDを保持
  const [stageMonsterIds, setStageMonsterIds] = useState<string[]>([]);
  // プリロードしたテクスチャを保持
  const imageTexturesRef = useRef<Map<string, PIXI.Texture>>(new Map());
  // クイズモード用のオーディオ参照
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    currentQuestionIndex: 0,
    currentChordTarget: getChordDefinition('CM7', displayOpts) || null, // デフォルト値を設定
    playerHp: 5,
    enemyGauge: 0,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    // 複数敵システム用
    currentEnemyIndex: 0,
    currentEnemyHits: 0,
    enemiesDefeated: 0,
    totalEnemies: 5,
    // 敵のHP管理を追加
    currentEnemyHp: 5,
    maxEnemyHp: 5,
    correctNotes: [],
    playerSp: 0, // SPゲージ初期化
    isWaitingForNextMonster: false,
    // マルチモンスター対応
    activeMonsters: [],
    monsterQueue: [],
    simultaneousMonsterCount: 1,
    // ゲーム完了処理中フラグ
    isCompleting: false,
    // リズムモード関連
    rhythmManager: undefined,
    progressionManager: undefined,
    syncMonitor: undefined,
    isReady: false,
    readyCountdown: 3,
    currentMeasure: 0,
    currentBeat: 0,
    timeOffset: 0
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  
  // リズムランダムパターン用のモンスター生成スケジューラー
  const scheduleRandomMonster = useCallback((measure: number) => {
    setGameState(prevState => {
      if (!prevState.currentStage || 
          prevState.currentStage.game_type !== 'rhythm' || 
          prevState.currentStage.rhythm_pattern !== 'random' ||
          !prevState.isGameActive) {
        return prevState;
      }
      
      // すでにアクティブなモンスターがいる場合はスキップ
      if (prevState.activeMonsters.length > 0) {
        return prevState;
      }
      
      // モンスターキューから次のモンスターを取得
      if (prevState.monsterQueue.length === 0) {
        // 全てのモンスターを倒した
        return prevState;
      }
      
      const nextMonsterIndex = prevState.monsterQueue[0];
      const remainingQueue = prevState.monsterQueue.slice(1);
      
      // ランダムなタイミングを生成
      const timing = generateRandomRhythmTiming(
        measure,
        prevState.currentStage.time_signature || 4,
        prevState.currentStage.bpm || 120
      );
      
      // ランダムなコードを選択
      const lastChordId = prevState.activeMonsters.length > 0 
        ? prevState.activeMonsters[prevState.activeMonsters.length - 1].chordTarget.id 
        : undefined;
      const chord = selectRandomChord(
        prevState.currentStage.allowedChords,
        lastChordId,
        displayOpts || { lang: 'en', simple: false }
      );
      
      if (!chord) return prevState;
      
      // モンスターを生成（rhythmStoreのstartAtを使用）
      const rhythmStartAt = useRhythmStore.getState().startAt;
      const newMonster = createRhythmMonster(
        nextMonsterIndex,
        'A', // ランダムパターンは常に1体なのでA列固定
        prevState.currentStage.enemyHp,
        chord,
        timing,
        prevState.currentStage.bpm || 120,
        rhythmStartAt,
        stageMonsterIds,
        prevState.currentStage.time_signature || 4 // タイムシグネチャーを渡す
      );
      
      devLog.debug('🎲 ランダムモンスター生成:', {
        measure: timing.measure,
        beat: timing.beat,
        chord: chord.displayName
      });
      
      return {
        ...prevState,
        activeMonsters: [newMonster],
        monsterQueue: remainingQueue
      };
    });
  }, [stageMonsterIds, displayOpts]);
  
  // ゲーム初期化
  const initializeGame = useCallback(async (stage: FantasyStage, displayOptsParam?: DisplayOpts) => {
    devLog.debug('🎮 initializeGame called with stage:', stage);
    devLog.debug('🎮 Stage game_type:', stage.game_type);
    devLog.debug('🎮 Stage rhythm_pattern:', stage.rhythm_pattern);
    
    // ステージデータを正規化（デフォルト値を設定）
    const normalizedStage: FantasyStage = {
      ...stage,
      game_type: stage.game_type || 'quiz',
      rhythm_pattern: stage.rhythm_pattern || undefined,
      bpm: stage.bpm || 120,
      time_signature: stage.time_signature || 4,
      loop_measures: stage.loop_measures || 8,
      chord_progression_data: stage.chord_progression_data || undefined,
      mp3_url: stage.mp3_url || '/demo-1.mp3'
    };
    
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: normalizedStage.name });

    // gameTypeのデフォルト値を設定
    const gameType = normalizedStage.game_type || 'quiz';
    devLog.debug('🔍 リズムモードのデバッグ: gameType =', gameType);

    // 新しいステージ定義から値を取得
    const totalEnemies = normalizedStage.enemyCount;
    const enemyHp = normalizedStage.enemyHp;
    const totalQuestions = totalEnemies * enemyHp;
    const simultaneousCount = normalizedStage.simultaneousMonsterCount || 1;

    // ステージで使用するモンスターIDを決定（シャッフルして必要数だけ取得）
    const monsterIds = getStageMonsterIds(totalEnemies);
    setStageMonsterIds(monsterIds);

    // モンスター画像をプリロード
    try {
      // バンドルが既に存在する場合は削除
      if (PIXI.Assets.resolver.bundles.has('stageMonsters')) {
        await PIXI.Assets.unloadBundle('stageMonsters');
      }

      // バンドル用のアセットマッピングを作成
      const bundle: Record<string, string> = {};
      monsterIds.forEach(id => {
        // 一時的にPNG形式を使用（WebP変換ツールが利用できないため）
        bundle[id] = `${import.meta.env.BASE_URL}monster_icons/${id}.png`;
      });

      // バンドルを追加してロード
      PIXI.Assets.addBundle('stageMonsters', bundle);
      await PIXI.Assets.loadBundle('stageMonsters');

      // テクスチャをキャッシュに保管
      const textureMap = imageTexturesRef.current;
      textureMap.clear();
      monsterIds.forEach(id => {
        const texture = PIXI.Assets.get(id) as PIXI.Texture;
        if (texture) {
          textureMap.set(id, texture);
        }
      });

      devLog.debug('✅ モンスター画像プリロード完了:', { count: monsterIds.length });
    } catch (error) {
      devLog.error('❌ モンスター画像プリロード失敗:', error);
    }

    // リズムモード固有の初期化
    let rhythmManager: RhythmManager | undefined;
    let progressionManager: ProgressionManager | undefined;
    let syncMonitor: SyncMonitor | undefined;

    if (gameType === 'rhythm') {
      devLog.debug('🎵 リズムモード検出、RhythmManagerとSyncMonitorを初期化');
      
      try {
        // RhythmManagerの初期化
        rhythmManager = new RhythmManager({
          audioUrl: normalizedStage.mp3_url || '/demo-1.mp3',
          bpm: normalizedStage.bpm || 120,
          timeSignature: normalizedStage.time_signature || 4,
          loopMeasures: normalizedStage.loop_measures || 8,
          volume: 0.7
        });
        devLog.debug('✅ RhythmManager初期化成功');
      } catch (error) {
        devLog.error('❌ RhythmManager初期化エラー:', error);
      }
      
      // SyncMonitorの初期化（実際の開始時刻はReady終了時に設定される）
      try {
        const estimatedStartTime = performance.now() + 3000; // 3秒後の予定時刻
        syncMonitor = new SyncMonitor(
          estimatedStartTime, // ゲーム開始時刻（Readyフェーズ後）
          estimatedStartTime  // 音楽開始時刻（同じ）
        );
        devLog.debug('✅ SyncMonitor初期化成功');
      } catch (error) {
        devLog.error('❌ SyncMonitor初期化エラー:', error);
      }
      
      // コールバックの設定
      if (rhythmManager) {
        rhythmManager.onBeat((pos) => {
          devLog.debug('🎵 Beat:', pos);
        });

        rhythmManager.onLoop(() => {
          devLog.debug('🔄 Loop triggered');
        });
        
        // onMeasureは後でuseEffectで設定（scheduleRandomMonsterを使うため）
      }
      
      // プログレッションパターンの場合、ProgressionManagerを初期化
      if (normalizedStage.rhythm_pattern === 'progression' && normalizedStage.chord_progression_data) {
        try {
          progressionManager = new ProgressionManager(
            normalizedStage.chord_progression_data,
            normalizedStage.loop_measures || 8
          );
          devLog.debug('✅ ProgressionManager初期化成功');
        } catch (error) {
          devLog.error('❌ ProgressionManager初期化エラー:', error);
        }
      }
    }

    // ▼▼▼ 修正点1: モンスターキューをシャッフルする ▼▼▼
    // モンスターキューを作成（0からtotalEnemies-1までのインデックス）
    const monsterIndices = Array.from({ length: totalEnemies }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = monsterIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [monsterIndices[i], monsterIndices[j]] = [monsterIndices[j], monsterIndices[i]];
    }
    const monsterQueue = monsterIndices;
    
    // 初期モンスターを配置
    const initialMonsterCount = Math.min(simultaneousCount, totalEnemies);
    const positions = assignPositions(initialMonsterCount);
    const activeMonsters: MonsterState[] = [];
    const usedChordIds: string[] = [];
    
    // ▼▼▼ 修正点2: コードの重複を避けるロジックを追加 ▼▼▼
    let lastChordId: string | undefined = undefined; // 直前のコードIDを記録する変数を追加

    // 既に同時出現数が 1 の場合に後続モンスターが "フェードアウト待ち" の間に
    // 追加生成されないよう、queue だけ作って最初の 1 体だけ生成する。
    for (let i = 0; i < initialMonsterCount; i++) {
      const monsterIndex = monsterQueue.shift()!;
      // simultaneousMonsterCount === 1 のとき、0 番目のみ即生成。
      if (i === 0 || simultaneousCount > 1) {
        // リズムプログレッションパターンの場合
        if (gameType === 'rhythm' && normalizedStage.rhythm_pattern === 'progression' && progressionManager) {
          devLog.debug('🎯 リズムプログレッションパターンでモンスター生成開始');
          const initialChords = progressionManager.getInitialChords();
          if (i < initialChords.length) {
            const chordAssignment = initialChords[i];
            const chord = getChordDefinition(chordAssignment.chord, displayOptsParam);
            if (chord) {
              devLog.debug('🎯 プログレッションモンスター生成:', {
                index: i,
                chord: chordAssignment.chord,
                questionNumber: chordAssignment.questionNumber
              });
              const monster = createRhythmMonster(
                monsterIndex,
                positions[i],
                enemyHp,
                chord,
                chordAssignment.timing,
                normalizedStage.bpm || 120,
                performance.now() + 3000, // Readyフェーズ後に開始（後でrhythmStoreで上書きされる）
                monsterIds,
                normalizedStage.time_signature || 4 // タイムシグネチャーを渡す
              );
              monster.questionNumber = chordAssignment.questionNumber;
              activeMonsters.push(monster);
              usedChordIds.push(monster.chordTarget.id);
              lastChordId = monster.chordTarget.id;
            }
          }
        } else {
          // 既存の処理（クイズモード、リズムランダムモード）
          const monster = createMonsterFromQueue(
            monsterIndex,
            positions[i],
            enemyHp,
            normalizedStage.allowedChords,
            lastChordId,
            displayOptsParam,
            monsterIds        // ✅ 今回作った配列
          );
          activeMonsters.push(monster);
          usedChordIds.push(monster.chordTarget.id);
          lastChordId = monster.chordTarget.id;
        }
      }
    }

    // 互換性のため最初のモンスターの情報を設定
    const firstMonster = activeMonsters[0];
    const firstChord = firstMonster ? firstMonster.chordTarget : null;

    const newState: FantasyGameState = {
      currentStage: normalizedStage,
      currentQuestionIndex: 0,
      currentChordTarget: firstChord,
      playerHp: normalizedStage.maxHp,
      enemyGauge: 0,
      score: 0,
      totalQuestions: totalQuestions,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      // 複数敵システム用（互換性維持）
      currentEnemyIndex: 0,
      currentEnemyHits: 0,
      enemiesDefeated: 0,
      totalEnemies: totalEnemies,
      // 敵のHP管理（互換性維持）
      currentEnemyHp: firstMonster ? firstMonster.currentHp : enemyHp,
      maxEnemyHp: enemyHp,
      correctNotes: firstMonster ? firstMonster.correctNotes : [],
      playerSp: 0, // SPゲージ初期化
      isWaitingForNextMonster: false,
      // マルチモンスター対応
      activeMonsters,
      monsterQueue,
      simultaneousMonsterCount: simultaneousCount,
      // ゲーム完了処理中フラグ
      isCompleting: false,
      // リズムモード関連
      rhythmManager: rhythmManager,
      progressionManager: progressionManager,
      syncMonitor: syncMonitor,
      isReady: gameType === 'rhythm', // リズムモードの場合はReadyフェーズから開始
      readyCountdown: gameType === 'rhythm' ? 3 : 0,
      currentMeasure: 0,
      currentBeat: 0,
      timeOffset: 0
    };

    setGameState(newState);
    onGameStateChange(newState);

    // クイズモードでも音楽を再生
    if (gameType !== 'rhythm') {
      const audio = new Audio(normalizedStage.mp3_url || '/demo-1.mp3');
      audio.loop = true;
      audio.volume = 0.7;
      
      // Safari対策: play() promise 無視
      void audio.play().catch(err => {
        devLog.warn('⚠️ 音楽自動再生失敗（ユーザー操作が必要）:', err);
      });
      
      // クリーンアップ用に保存
      audioRef.current = audio;
    }

    devLog.debug('✅ ゲーム初期化完了:', {
      stage: normalizedStage.name,
      totalEnemies,
      enemyHp,
      totalQuestions,
      simultaneousCount,
      activeMonsters: activeMonsters.length
    });
  }, [onGameStateChange, displayOpts]);
  
  // 次の問題への移行（マルチモンスター対応）
  const proceedToNextQuestion = useCallback(() => {
    setGameState(prevState => {
      const isComplete = prevState.enemiesDefeated >= prevState.totalEnemies;
      
      if (isComplete) {
        // ゲームクリア
        const finalState = {
          ...prevState,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'clear' as const,
          isCompleting: true // 追加
        };
        
        onGameComplete('clear', finalState);
        return finalState;
      } else {
        // 各モンスターに新しいコードを割り当て
        const updatedMonsters = prevState.activeMonsters.map(monster => {
          let nextChord;
          if (prevState.currentStage?.mode === 'single') {
            // ランダムモード：前回と異なるコードを選択
            nextChord = selectRandomChord(prevState.currentStage.allowedChords, monster.chordTarget?.id, displayOpts);
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex, displayOpts);
          }
          
          return {
            ...monster,
            chordTarget: nextChord!,
            correctNotes: []
          };
        });
        
        const nextState = {
          ...prevState,
          currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
          activeMonsters: updatedMonsters,
          // 互換性維持
          currentChordTarget: updatedMonsters[0]?.chordTarget || prevState.currentChordTarget,
          enemyGauge: 0,
          correctNotes: []
        };
        
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [onGameStateChange, onGameComplete]);
  
  // 敵の攻撃処理
  const handleEnemyAttack = useCallback((attackingMonsterId?: string) => {
    // 攻撃時に入力バッファをリセット
    // setInputBuffer([]); // 削除
    // if (inputTimeout) { // 削除
    //   clearTimeout(inputTimeout); // 削除
    //   setInputTimeout(null); // 削除
    // } // 削除
    
    setGameState(prevState => {
      const newHp = Math.max(0, prevState.playerHp - 1); // 確実に1減らす
      
      devLog.debug('💥 敵の攻撃！HP更新:', {
        oldHp: prevState.playerHp,
        newHp: newHp,
        damage: 1,
        attackingMonsterId
      });
      
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const,
          isCompleting: true // 追加
        };
        
        // ゲームオーバーコールバックを安全に呼び出し
        setTimeout(() => {
          try {
            onGameComplete('gameover', finalState);
          } catch (error) {
            devLog.debug('❌ ゲームオーバーコールバックエラー:', error);
          }
        }, 100);
        
        return finalState;
      } else {
        // HP減少して次の問題へ（回答数ベース、ループ対応）
        const isComplete = prevState.correctAnswers >= prevState.totalQuestions;
        
        if (isComplete) {
          // 必要な回答数に到達済みでHP残りありならクリア
          const finalState = {
            ...prevState,
            playerHp: newHp,
            playerSp: 0, // 敵から攻撃を受けたらSPゲージをリセット
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const,
            isCompleting: true // 追加
          };
          
          // クリアコールバックを安全に呼び出し
          setTimeout(() => {
            try {
              onGameComplete('clear', finalState);
            } catch (error) {
              devLog.debug('❌ クリアコールバックエラー:', error);
            }
          }, 100);
          
          return finalState;
        } else {
          // 次の問題（ループ対応）
          let nextChord;
          if (prevState.currentStage?.mode === 'single') {
            // ランダムモード：前回と異なるコードを選択
            const previousChordId = prevState.currentChordTarget?.id;
            nextChord = selectRandomChord(prevState.currentStage.allowedChords, previousChordId, displayOpts);
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex, displayOpts);
          }
          
          const nextState = {
            ...prevState,
            playerHp: newHp,
            playerSp: 0, // 敵から攻撃を受けたらSPゲージをリセット
            currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
            currentChordTarget: nextChord,
            enemyGauge: 0,
            correctNotes: [] // 新しいコードでリセット
          };
          
          onGameStateChange(nextState);
          return nextState;
        }
      }
    });
    
    onEnemyAttack(attackingMonsterId);
  }, [onGameStateChange, onGameComplete, onEnemyAttack]);
  
  // ゲージタイマーの管理
  useEffect(() => {
    devLog.debug('🎮 ゲージタイマー状態チェック:', { 
      isGameActive: gameState.isGameActive, 
      hasTimer: !!enemyGaugeTimer,
      currentStage: gameState.currentStage?.stageNumber
    });
    
    // 既存のタイマーをクリア
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    // ゲームがアクティブな場合のみ新しいタイマーを開始
    if (gameState.isGameActive && gameState.currentStage) {
      devLog.debug('⏰ 敵ゲージタイマー開始');
      const timer = setInterval(() => {
        updateEnemyGauge();
      }, 100); // 100ms間隔で更新
      setEnemyGaugeTimer(timer);
    }
    
    // クリーンアップ
    return () => {
      if (enemyGaugeTimer) {
        clearInterval(enemyGaugeTimer);
      }
    };
  }, [gameState.isGameActive, gameState.currentStage]); // ゲーム状態とステージの変更を監視
  
  // 敵ゲージの更新（マルチモンスター対応）
  const updateEnemyGauge = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage) {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブ');
        return prevState;
      }
      
      // リズムモードの場合
      if (prevState.currentStage.game_type === 'rhythm' && prevState.rhythmManager) {
        const currentPos = prevState.rhythmManager.getCurrentPosition();
        const audioNow = useRhythmStore.getState().lastAudioTime;  // ★ Audio 時刻取得
        
        // 同期チェックでは performance.now() を維持
        const currentTimeMs = performance.now();
        if (prevState.syncMonitor?.shouldCheckSync(currentTimeMs)) {
          const syncStatus = prevState.syncMonitor.checkSync(
            prevState.rhythmManager.getCurrentPosition().absoluteBeat * (60 / (prevState.currentStage.bpm || 120)),
            currentTimeMs,
            prevState.currentStage.bpm || 120
          );
          
          if (!syncStatus.inSync && syncStatus.correction) {
            devLog.warn('🔄 同期補正:', { drift: syncStatus.drift, correction: syncStatus.correction });
            // タイムオフセットを徐々に補正
            const newOffset = prevState.syncMonitor.autoCorrect(
              prevState.timeOffset,
              syncStatus.correction
            );
            
            return {
              ...prevState,
              timeOffset: newOffset
            };
          }
        }
        
        // 各モンスターのゲージを音楽に同期して更新
        const updatedMonsters = prevState.activeMonsters.map(monster => {
          if (!monster.timing) return monster;
          
          // spawn以前は0、target時点で100になる計算式（audioNow 基準）
          const elapsed = audioNow - monster.timing.spawnTime;
          const totalDuration = monster.timing.targetTime - monster.timing.spawnTime;
          const gaugeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
          
          return {
            ...monster,
            gauge: gaugeProgress
          };
        });
        
        // 判定タイミングを過ぎたモンスターをチェック（判定ウィンドウ外）
        const missedMonster = updatedMonsters.find(m => 
          m.timing && audioNow > m.timing.targetTime + 200
        );
        
        if (missedMonster) {
          devLog.debug('⏰ 判定タイミングミス！', { monster: missedMonster.name });
          // 攻撃処理を実行
          setTimeout(() => handleEnemyAttack(missedMonster.id), 0);
          
          // ミスしたモンスターを削除して新しいモンスターを生成
          const filteredMonsters = updatedMonsters.filter(m => m.id !== missedMonster.id);
          // TODO: 新しいモンスター生成処理
          
          return {
            ...prevState,
            activeMonsters: filteredMonsters
          };
        }
        
        return {
          ...prevState,
          activeMonsters: updatedMonsters,
          currentMeasure: currentPos.measure,
          currentBeat: currentPos.beat
        };
      }
      
      // クイズモードの場合（既存の処理）
      const incrementRate = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      
      // 各モンスターのゲージを更新
      const updatedMonsters = prevState.activeMonsters.map(monster => ({
        ...monster,
        gauge: Math.min(monster.gauge + incrementRate, 100)
      }));
      
      // ゲージが満タンになったモンスターをチェック
      const attackingMonster = updatedMonsters.find(m => m.gauge >= 100);
      
      if (attackingMonster) {
        console.log('🎲 Found attacking monster:', attackingMonster);
        devLog.debug('💥 モンスターゲージ満タン！攻撃開始', { monster: attackingMonster.name });
        
        // 怒り状態をストアに通知
        const { setEnrage } = useEnemyStore.getState();
        setEnrage(attackingMonster.id, true);
        setTimeout(() => setEnrage(attackingMonster.id, false), 500); // 0.5秒後にOFF
        
        // 攻撃したモンスターのゲージをリセット
        const resetMonsters = updatedMonsters.map(m => 
          m.id === attackingMonster.id ? { ...m, gauge: 0 } : m
        );
        
        // 攻撃処理を非同期で実行
        console.log('🚀 Calling handleEnemyAttack with id:', attackingMonster.id);
        setTimeout(() => handleEnemyAttack(attackingMonster.id), 0);
        
        const nextState = { 
          ...prevState, 
          activeMonsters: resetMonsters,
          // 互換性のため
          enemyGauge: 0 
        };
        onGameStateChange(nextState);
        return nextState;
      } else {
        const nextState = { 
          ...prevState, 
          activeMonsters: updatedMonsters,
          // 互換性のため最初のモンスターのゲージを設定
          enemyGauge: updatedMonsters[0]?.gauge || 0
        };
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [handleEnemyAttack, onGameStateChange]);
  
  // ノート入力処理（ミスタッチ概念を排除し、バッファを永続化）
  const handleNoteInput = useCallback((note: number) => {
    // updater関数の中でロジックを実行するように変更
    setGameState(prevState => {
      // ゲームがアクティブでない場合は何もしない
      if (!prevState.isGameActive || prevState.isWaitingForNextMonster) {
        return prevState;
      }

      devLog.debug('🎹 ノート入力受信 (in updater):', { note, noteMod12: note % 12 });

      // リズムモードの判定処理
      if (prevState.currentStage?.game_type === 'rhythm' && prevState.rhythmManager) {
        const currentTimeMs = performance.now();
        const noteMod12 = note % 12;
        
        // 判定ウィンドウ内のモンスターを探す
        const judgeableMonsters = prevState.activeMonsters.filter(monster => {
          if (!monster.timing) return false;
          const timeToTarget = monster.timing.targetTime - currentTimeMs;
          return timeToTarget >= -200 && timeToTarget <= 200; // 判定ウィンドウは±200ms
        });
        
        if (judgeableMonsters.length === 0) {
          // 判定ウィンドウ内にモンスターがいない
          devLog.debug('❌ タイミングミス: 判定ウィンドウ外');
          return prevState;
        }
        
        // 最も判定タイミングに近いモンスターを選択
        const targetMonster = judgeableMonsters.reduce((closest, current) => {
          const closestDiff = Math.abs(closest.timing!.targetTime - currentTimeMs);
          const currentDiff = Math.abs(current.timing!.targetTime - currentTimeMs);
          return currentDiff < closestDiff ? current : closest;
        });
        
        // 音の判定を行う
        const targetNotes = [...new Set(targetMonster.chordTarget.notes.map(n => n % 12))];
        
        if (!targetNotes.includes(noteMod12)) {
          // 間違った音
          devLog.debug('❌ 間違った音:', { input: noteMod12, expected: targetNotes });
          return prevState;
        }
        
        // 正解した音を記録
        const newCorrectNotes = [...targetMonster.correctNotes, noteMod12];
        const updatedMonster = { ...targetMonster, correctNotes: newCorrectNotes };
        
        // コードが完成したかチェック
        if (newCorrectNotes.length === targetNotes.length) {
          // パーフェクト判定かチェック
          const timeDiff = Math.abs(targetMonster.timing!.targetTime - currentTimeMs);
          const isPerfect = timeDiff <= 50;
          
          devLog.debug('✅ コード完成！', { 
            chord: targetMonster.chordTarget.displayName,
            perfect: isPerfect,
            timeDiff 
          });
          
          // モンスターを倒す処理（後で実装）
          const filteredMonsters = prevState.activeMonsters.filter(m => m.id !== targetMonster.id);
          
          // 次のモンスターを生成
          let newMonsters = [...filteredMonsters];
          
          // プログレッションパターンの場合、即座に補充
          if (prevState.currentStage.rhythm_pattern === 'progression' && 
              prevState.progressionManager && 
              prevState.monsterQueue.length > 0) {
            const nextMonsterIndex = prevState.monsterQueue[0];
            const remainingQueue = prevState.monsterQueue.slice(1);
            
            const chordAssignment = prevState.progressionManager.getNextChordForColumn(targetMonster.position);
            const chord = getChordDefinition(chordAssignment.chord, displayOpts);
            
            if (chord) {
              const newMonster = createRhythmMonster(
                nextMonsterIndex,
                targetMonster.position,
                prevState.currentStage.enemyHp,
                chord,
                chordAssignment.timing,
                prevState.currentStage.bpm || 120,
                currentTimeMs,
                stageMonsterIds,
                prevState.currentStage.time_signature || 4 // タイムシグネチャーを渡す
              );
              newMonster.questionNumber = chordAssignment.questionNumber;
              newMonsters.push(newMonster);
              
              return {
                ...prevState,
                activeMonsters: newMonsters,
                monsterQueue: remainingQueue,
                correctAnswers: prevState.correctAnswers + 1,
                score: prevState.score + (isPerfect ? 200 : 100),
                enemiesDefeated: prevState.enemiesDefeated + 1
              };
            }
          }
          
          return {
            ...prevState,
            activeMonsters: newMonsters,
            correctAnswers: prevState.correctAnswers + 1,
            score: prevState.score + (isPerfect ? 200 : 100),
            enemiesDefeated: prevState.enemiesDefeated + 1
          };
        }
        
        // まだコードが完成していない
        const updatedMonsters = prevState.activeMonsters.map(m => 
          m.id === targetMonster.id ? updatedMonster : m
        );
        
        return {
          ...prevState,
          activeMonsters: updatedMonsters
        };
      }

      // 以下、既存のクイズモード処理
      const noteMod12 = note % 12;
      const completedMonsters: MonsterState[] = [];
      let hasAnyNoteChanged = false;

      // 1. 今回の入力でどのモンスターが影響を受けるか判定し、新しい状態を作る
      const monstersAfterInput = prevState.activeMonsters.map(monster => {
        const targetNotes = [...new Set(monster.chordTarget.notes.map(n => n % 12))];
        
        // 既に完成しているモンスターや、入力音と関係ないモンスターはスキップ
        if (!targetNotes.includes(noteMod12) || monster.correctNotes.includes(noteMod12)) {
            return monster;
        }
        
        hasAnyNoteChanged = true;
        const newCorrectNotes = [...monster.correctNotes, noteMod12];
        const updatedMonster = { ...monster, correctNotes: newCorrectNotes };

        // コードが完成したかチェック
        if (newCorrectNotes.length === targetNotes.length) {
            completedMonsters.push(updatedMonster);
        }
        
        return updatedMonster;
      });
      
      // どのモンスターにもヒットしなかった場合
      if (!hasAnyNoteChanged) {
        return prevState;
      }

      // 2. コードが完成した場合の処理
      if (completedMonsters.length > 0) {
        devLog.debug(`🎯 ${completedMonsters.length}体のコードが完成しました！`, { ids: completedMonsters.map(m => m.id) });

        // ★ 攻撃処理後の状態を計算する
        let stateAfterAttack = { ...prevState, activeMonsters: monstersAfterInput };
        
        const isSpecialAttack = stateAfterAttack.playerSp >= 5;
        
        // 攻撃処理ループ
        completedMonsters.forEach(completed => {
          const monsterToUpdate = stateAfterAttack.activeMonsters.find(m => m.id === completed.id);
          if (!monsterToUpdate) return;

          const currentStage = stateAfterAttack.currentStage!;
          const damageDealt = (Math.floor(Math.random() * (currentStage.maxDamage - currentStage.minDamage + 1)) + currentStage.minDamage) * (isSpecialAttack ? 2 : 1);
          const willBeDefeated = (monsterToUpdate.currentHp - damageDealt) <= 0;
          
          onChordCorrect(completed.chordTarget, isSpecialAttack, damageDealt, willBeDefeated, completed.id);
          monsterToUpdate.currentHp -= damageDealt;
        });

        // プレイヤーの状態更新
        stateAfterAttack.playerSp = isSpecialAttack ? 0 : Math.min(stateAfterAttack.playerSp + completedMonsters.length, 5);
        stateAfterAttack.score += 1000 * completedMonsters.length;
        stateAfterAttack.correctAnswers += completedMonsters.length;
        
        // 倒されたモンスターを特定
        const defeatedMonstersThisTurn = stateAfterAttack.activeMonsters.filter(m => m.currentHp <= 0);
        stateAfterAttack.enemiesDefeated += defeatedMonstersThisTurn.length;

        // 生き残ったモンスターのリストを作成
        let remainingMonsters = stateAfterAttack.activeMonsters.filter(m => m.currentHp > 0);
        
        // 生き残ったモンスターのうち、今回攻撃したモンスターは問題をリセット
        remainingMonsters = remainingMonsters.map(monster => {
          if (completedMonsters.some(cm => cm.id === monster.id)) {
            const nextChord = selectRandomChord(
              stateAfterAttack.currentStage!.allowedChords,
              monster.chordTarget.id,
              displayOpts
            );
            return { ...monster, chordTarget: nextChord!, correctNotes: [], gauge: 0 };
          }
          // SPアタックの場合は全ての敵のゲージをリセット
          if (isSpecialAttack) {
            return { ...monster, gauge: 0 };
          }
          return monster;
        });

        // モンスターの補充
        let newMonsterQueue = [...stateAfterAttack.monsterQueue];
        const slotsToFill = stateAfterAttack.simultaneousMonsterCount - remainingMonsters.length;
        const monstersToAddCount = Math.min(slotsToFill, newMonsterQueue.length);

        if (monstersToAddCount > 0) {
                      const availablePositions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(pos => !remainingMonsters.some(m => m.position === pos));
          const lastUsedChordId = completedMonsters.length > 0 ? completedMonsters[0].chordTarget.id : undefined;

          for (let i = 0; i < monstersToAddCount; i++) {
            const monsterIndex = newMonsterQueue.shift()!;
            const position = availablePositions[i] || 'B';
            const newMonster = createMonsterFromQueue(
              monsterIndex,
              position as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
              stateAfterAttack.maxEnemyHp,
              stateAfterAttack.currentStage!.allowedChords,
              lastUsedChordId, // 直前のコードを避ける
              displayOpts,
              stageMonsterIds // stageMonsterIdsを渡す
            );
            remainingMonsters.push(newMonster);
          }
        }
        
        // 最終的なモンスターリストとキューを更新
        stateAfterAttack.activeMonsters = remainingMonsters;
        stateAfterAttack.monsterQueue = newMonsterQueue;
        
        // 互換性のためのレガシーな状態も更新
        stateAfterAttack.correctNotes = [];
        stateAfterAttack.enemyGauge = 0;

        // ゲームクリア判定
        if (stateAfterAttack.enemiesDefeated >= stateAfterAttack.totalEnemies) {
            const finalState = { ...stateAfterAttack, isGameActive: false, isGameOver: true, gameResult: 'clear' as const, activeMonsters: [] };
            onGameComplete('clear', finalState);
            return finalState;
        }
        
        onGameStateChange(stateAfterAttack);
        return stateAfterAttack;

      } else {
        // 3. 部分一致のみの場合は、ノートの状態だけ更新
        const newState = { ...prevState, activeMonsters: monstersAfterInput };
        onGameStateChange(newState);
        return newState;
      }
    });
  }, [onChordCorrect, onGameComplete, onGameStateChange, displayOpts, stageMonsterIds]);
  
  // 次の敵へ進むための新しい関数
  const proceedToNextEnemy = useCallback(() => {
    devLog.debug('ENGINE: 進行要求を受信。次の敵と問題を用意します。');
    setGameState(prevState => {
      if (!prevState.isWaitingForNextMonster) return prevState;

      const newEnemiesDefeated = prevState.enemiesDefeated + 1;

      // ゲームクリア判定
      if (newEnemiesDefeated >= prevState.totalEnemies) {
        const finalState = {
          ...prevState,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'clear' as const,
          isWaitingForNextMonster: false,
        };
        onGameComplete('clear', finalState);
        return finalState;
      }

      // 次の敵に交代
      const nextEnemyIndex = prevState.currentEnemyIndex + 1;
      let nextState = {
        ...prevState,
        currentEnemyIndex: nextEnemyIndex,
        currentEnemyHits: 0,
        enemiesDefeated: newEnemiesDefeated,
        currentEnemyHp: prevState.maxEnemyHp, // HPをリセット
        isWaitingForNextMonster: false,      // 待機状態を解除
      };

      // ★追加：次の問題もここで準備する
      let nextChord;
      if (prevState.currentStage?.mode === 'single') {
        nextChord = selectRandomChord(prevState.currentStage.allowedChords, prevState.currentChordTarget?.id, displayOpts);
      } else {
        const progression = prevState.currentStage?.chordProgression || [];
        const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
        nextChord = getProgressionChord(progression, nextIndex, displayOpts);
      }

      nextState = {
        ...nextState,
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
        currentChordTarget: nextChord,
        enemyGauge: 0,
      };

      devLog.debug('🔄 次の戦闘準備完了:', {
        nextEnemyIndex,
        nextEnemy: ENEMY_LIST[nextEnemyIndex]?.name,
        nextChord: nextChord?.displayName,
        newEnemyHp: prevState.maxEnemyHp
      });

      onGameStateChange(nextState);
      return nextState;
    });
  }, [onGameStateChange, onGameComplete]);
  
  // ゲーム停止
  const stopGame = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameActive: false
    }));
    
    // ステージを抜けるたびにアイコン配列を初期化
    setStageMonsterIds([]);
    
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    // if (inputTimeout) { // 削除
    //   clearTimeout(inputTimeout); // 削除
    // } // 削除
    
    // setInputBuffer([]); // 削除
  }, [enemyGaugeTimer]);
  
  // ステージ変更時の初期化
  // useEffect(() => {
  //   if (stage) {
  //     initializeGame(stage);
  //   }
  // }, [stage, initializeGame]);

  // Readyフェーズのカウントダウン処理
  useEffect(() => {
    if (gameState.isReady && gameState.readyCountdown >= 0) {
      const countdownTimer = setTimeout(() => {
        setGameState(prevState => {
          // カウント 3 のタイミングで予定開始時刻を store へ書き込み
          if (prevState.readyCountdown === 3) {
            const est = performance.now() + 3000; // 3秒後を予定開始時刻とする
            useRhythmStore.getState().setStart(est);
          }
          
          if (prevState.readyCountdown === 0) {
            // カウントダウン終了、音楽とタイマーを同時に開始
            prevState.rhythmManager?.start();
            useRhythmStore.getState().setPlaying(true);
            devLog.debug('🎵 音楽開始！startAt:', useRhythmStore.getState().startAt);
            return {
              ...prevState,
              isReady: false,
              readyCountdown: -1
            };
          } else {
            // カウントダウンを減らす
            return {
              ...prevState,
              readyCountdown: prevState.readyCountdown - 1
            };
          }
        });
      }, 1000);

      return () => clearTimeout(countdownTimer);
    }
  }, [gameState.isReady, gameState.readyCountdown]);

  // リズムマネージャーの小節コールバック設定
  useEffect(() => {
    if (gameState.rhythmManager && 
        gameState.currentStage?.game_type === 'rhythm' && 
        gameState.currentStage?.rhythm_pattern === 'random') {
      gameState.rhythmManager.onMeasure((measure) => {
        scheduleRandomMonster(measure);
      });
    }
  }, [gameState.rhythmManager, gameState.currentStage, scheduleRandomMonster]);
  
  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      if (enemyGaugeTimer) {
        devLog.debug('⏰ 敵ゲージタイマー クリーンアップで停止');
        clearInterval(enemyGaugeTimer);
      }
      // リズムマネージャーのクリーンアップ
      if (gameState.rhythmManager) {
        gameState.rhythmManager.stop();
      }
      // クイズモード用音楽のクリーンアップ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // if (inputTimeout) { // 削除
      //   devLog.debug('⏰ 入力タイムアウト クリーンアップで停止'); // 削除
      //   clearTimeout(inputTimeout); // 削除
      // } // 削除
    };
  }, []);
  
  // ゲーム完了時の処理
  const handleGameComplete = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    onGameComplete(result, finalState.score, finalState.correctAnswers, finalState.totalQuestions);
  }, [onGameComplete]);
  

  
  return {
    gameState,
    handleNoteInput,
    initializeGame,
    stopGame,
    proceedToNextEnemy,
    imageTexturesRef, // プリロードされたテクスチャへの参照を追加
    
    // ヘルパー関数もエクスポート
    checkChordMatch,
    selectRandomChord,
    getProgressionChord,
    getCurrentEnemy,
    ENEMY_LIST
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps, MonsterState };
export { ENEMY_LIST, getCurrentEnemy };