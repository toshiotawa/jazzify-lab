/**
 * ファンタジーゲームエンジン
 * ゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { useTimeStore } from '@/stores/timeStore';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import * as PIXI from 'pixi.js';

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
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
  chordProgressionData?: {
    chords: Array<{
      chord: string;
      measure: number;
      beat: number;
    }>;
  } | null;
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
  judgementTiming?: { measure: number; beat: number }; // 判定タイミング
  questionTiming?: { measure: number; beat: number }; // 出題タイミング
  hasQuestionShown?: boolean; // 問題が表示されたか
  judgementWindowStart?: number; // 判定ウィンドウ開始時刻（ms）
  judgementWindowEnd?: number; // 判定ウィンドウ終了時刻（ms）
  hasJudged?: boolean; // 判定済みか
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
  // リズムモード用
  isRhythmMode: boolean;
  rhythmPattern?: 'random' | 'progression';
  rhythmProgressionIndex?: number; // プログレッション用のインデックス
  nextJudgementTiming?: { measure: number; beat: number }; // 次の判定タイミング（ランダムモード用）
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

// ===== リズムモード判定とヘルパー関数 =====

/**
 * ステージがリズムモードかどうかを判定
 */
const isRhythmMode = (stage: FantasyStage): boolean => {
  // mp3_urlがあり、bpmがあり、timeSignatureがある場合はリズムモード
  return !!(stage.bgmUrl && stage.bpm && stage.timeSignature);
};

/**
 * リズムモードのパターンを判定
 */
const getRhythmPattern = (stage: FantasyStage): 'random' | 'progression' => {
  return stage.chordProgressionData && stage.chordProgressionData.chords.length > 0 
    ? 'progression' 
    : 'random';
};

/**
 * 現在の拍位置を取得（小節と拍）
 */
const getCurrentBeatPosition = (): { measure: number; beat: number } => {
  const timeState = useTimeStore.getState();
  return {
    measure: timeState.currentMeasure,
    beat: timeState.currentBeat
  };
};

/**
 * 判定タイミングから出題タイミングを計算
 * @param judgementMeasure 判定タイミングの小節
 * @param judgementBeat 判定タイミングの拍
 * @param timeSignature 拍子
 * @param countInMeasures カウントイン小節数
 * @returns 出題タイミング
 */
const calculateQuestionTiming = (
  judgementMeasure: number,
  judgementBeat: number,
  timeSignature: number,
  countInMeasures: number
): { measure: number; beat: number } => {
  // 3拍前を計算
  let questionBeat = judgementBeat - 3;
  let questionMeasure = judgementMeasure;
  
  // 拍が負の数になった場合、前の小節に繰り上げ
  while (questionBeat <= 0) {
    questionBeat += timeSignature;
    questionMeasure -= 1;
  }
  
  // カウントイン期間を考慮
  if (questionMeasure <= countInMeasures) {
    // カウントイン中は出題しない
    return { measure: -1, beat: -1 };
  }
  
  return { measure: questionMeasure, beat: questionBeat };
};

/**
 * 現在位置から指定タイミングまでの拍数を計算
 * @param currentPos 現在の位置
 * @param targetTiming 目標タイミング
 * @param timeSignature 拍子
 * @param measureCount 全体の小節数
 * @returns 拍数（負の場合は過去）
 */
const calculateBeatsUntilTiming = (
  currentPos: { measure: number; beat: number },
  targetTiming: { measure: number; beat: number },
  timeSignature: number,
  measureCount: number
): number => {
  // カウントイン中は計算しない
  const timeState = useTimeStore.getState();
  if (timeState.isCountIn) {
    return 999; // 大きな値を返して無効化
  }
  
  // 現在の総拍数
  const currentTotalBeats = (currentPos.measure - 1) * timeSignature + currentPos.beat - 1;
  
  // ターゲットの総拍数
  let targetTotalBeats = (targetTiming.measure - 1) * timeSignature + targetTiming.beat - 1;
  
  // ループを考慮
  if (targetTotalBeats < currentTotalBeats) {
    targetTotalBeats += measureCount * timeSignature;
  }
  
  return targetTotalBeats - currentTotalBeats;
};

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
  stageMonsterIds?: string[],
  rhythmModeData?: {
    judgementTiming?: { measure: number; beat: number };
    chordId?: string;
  }
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
  
  // リズムモードの場合、指定されたコードを使用
  let chord: ChordDefinition | null;
  if (rhythmModeData?.chordId) {
    chord = getChordDefinition(rhythmModeData.chordId, displayOpts);
  } else {
    chord = selectUniqueRandomChord(allowedChords, previousChordId, displayOpts);
  }
  
  const monster: MonsterState = {
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
  
  // リズムモード用データを設定
  if (rhythmModeData?.judgementTiming) {
    const timeSignature = useTimeStore.getState().timeSignature;
    const countInMeasures = useTimeStore.getState().countInMeasures;
    const questionTiming = calculateQuestionTiming(
      rhythmModeData.judgementTiming.measure,
      rhythmModeData.judgementTiming.beat,
      timeSignature,
      countInMeasures
    );
    
    monster.judgementTiming = rhythmModeData.judgementTiming;
    monster.questionTiming = questionTiming;
    monster.hasQuestionShown = false;
    monster.hasJudged = false;
  }
  
  return monster;
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
    // リズムモード用
    isRhythmMode: false,
    rhythmPattern: undefined,
    rhythmProgressionIndex: undefined,
    nextJudgementTiming: undefined
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  
  // ゲーム初期化
  const initializeGame = useCallback(async (stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 新しいステージ定義から値を取得
    const totalEnemies = stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = totalEnemies * enemyHp;
    const simultaneousCount = stage.simultaneousMonsterCount || 1;

    // ステージで使用するモンスターIDを決定（シャッフルして必要数だけ取得）
    const monsterIds = getStageMonsterIds(totalEnemies);
    setStageMonsterIds(monsterIds);

    // モンスター画像をプリロード
    try {
      // バンドルが既に存在する場合は削除
      // PIXI v7では unloadBundle が失敗しても問題ないため、try-catchで保護
      try {
        await PIXI.Assets.unloadBundle('stageMonsters');
      } catch {
        // バンドルが存在しない場合は無視
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
        const monster = createMonsterFromQueue(
          monsterIndex,
          positions[i],
          enemyHp,
          stage.allowedChords,
          lastChordId,
          displayOpts,
          monsterIds        // ✅ 今回作った配列
        );
        activeMonsters.push(monster);
        usedChordIds.push(monster.chordTarget.id);
        lastChordId = monster.chordTarget.id;
      }
    }

    // 互換性のため最初のモンスターの情報を設定
    const firstMonster = activeMonsters[0];
    const firstChord = firstMonster ? firstMonster.chordTarget : null;

    // リズムモードかどうかを判定
    const rhythmMode = isRhythmMode(stage);
    const rhythmPattern = rhythmMode ? getRhythmPattern(stage) : undefined;
    
    // リズムモードの初期設定
    if (rhythmMode) {
      // リズムモードではモンスター数を調整
      const actualSimultaneousCount = rhythmPattern === 'random' ? 1 : 4;
      
      // リズムモード用のアクティブモンスターを再作成
      activeMonsters.length = 0;
      const newPositions = assignPositions(actualSimultaneousCount);
      
      if (rhythmPattern === 'random') {
        // ランダムパターン：1体のみ、判定タイミングは1拍目固定
        const monsterIndex = monsterQueue.shift()!;
        const monster = createMonsterFromQueue(
          monsterIndex,
          newPositions[0],
          enemyHp,
          stage.allowedChords,
          undefined,
          displayOpts,
          monsterIds,
          {
            judgementTiming: { measure: 1, beat: 1 } // 最初は1小節目の1拍目
          }
        );
        activeMonsters.push(monster);
      } else if (rhythmPattern === 'progression' && stage.chordProgressionData) {
        // プログレッションパターン：最初の4つを配置
        const progressionChords = stage.chordProgressionData.chords;
        for (let i = 0; i < Math.min(actualSimultaneousCount, progressionChords.length); i++) {
          const monsterIndex = monsterQueue.shift()!;
          const chordData = progressionChords[i];
          const monster = createMonsterFromQueue(
            monsterIndex,
            newPositions[i],
            enemyHp,
            stage.allowedChords,
            undefined,
            displayOpts,
            monsterIds,
            {
              judgementTiming: { measure: chordData.measure, beat: chordData.beat },
              chordId: chordData.chord
            }
          );
          activeMonsters.push(monster);
        }
      }
    }

    const newState: FantasyGameState = {
      currentStage: stage,
      currentQuestionIndex: 0,
      currentChordTarget: firstChord,
      playerHp: stage.maxHp,
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
      simultaneousMonsterCount: rhythmMode ? 
        (rhythmPattern === 'random' ? 1 : 4) : simultaneousCount,
      // ゲーム完了処理中フラグ
      isCompleting: false,
      // リズムモード用
      isRhythmMode: rhythmMode,
      rhythmPattern,
      rhythmProgressionIndex: rhythmPattern === 'progression' ? activeMonsters.length : undefined,
      nextJudgementTiming: rhythmPattern === 'random' ? { measure: 2, beat: 1 } : undefined
    };

    setGameState(newState);
    onGameStateChange(newState);

    /* ===== Ready + 時間ストア開始 ===== */
    useTimeStore
      .getState()
      .setStart(
        stage.bpm || 120,
        stage.timeSignature || 4, // デフォルトは4/4拍子
        stage.measureCount ?? 8,
        stage.countInMeasures ?? 0
      );

    devLog.debug('✅ ゲーム初期化完了:', {
      stage: stage.name,
      totalEnemies,
      enemyHp,
      totalQuestions,
      simultaneousCount,
      activeMonsters: activeMonsters.length
    });
  }, [onGameStateChange]);
  
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
        // リズムモードの場合
        if (prevState.isRhythmMode) {
          // 攻撃したモンスターを判定済みにする
          const updatedMonsters = prevState.activeMonsters.map(monster => {
            if (monster.id === attackingMonsterId) {
              return { ...monster, hasJudged: true, gauge: 0, correctNotes: [] };
            }
            return monster;
          });
          
          const nextState = {
            ...prevState,
            playerHp: newHp,
            playerSp: 0,
            activeMonsters: updatedMonsters,
            enemyGauge: 0
          };
          
          onGameStateChange(nextState);
          return nextState;
        }
        
        // クイズモードの既存処理
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
    /* Ready 中はゲージ停止 */
    const timeState = useTimeStore.getState();
    if (timeState.startAt &&
        performance.now() - timeState.startAt < timeState.readyDuration) {
      return;
    }
    
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage) {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブ');
        return prevState;
      }
      
      // リズムモードの場合は異なる処理
      if (prevState.isRhythmMode) {
        const currentTime = performance.now();
        const currentBeatPos = getCurrentBeatPosition();
        const bpm = prevState.currentStage.bpm || 120;
        const msPerBeat = 60000 / bpm;
        
        // 判定ウィンドウ内のチェックと出題表示
        const updatedMonsters = prevState.activeMonsters.map(monster => {
          if (!monster.judgementTiming) return monster;
          
          const updatedMonster = { ...monster };
          
          // 判定ウィンドウの計算
          if (!monster.judgementWindowStart && monster.judgementTiming) {
            // 判定タイミングまでの拍数を計算
            const beatsUntilJudgement = calculateBeatsUntilTiming(
              currentBeatPos,
              monster.judgementTiming,
              prevState.currentStage?.timeSignature || 4,
              prevState.currentStage?.measureCount || 8
            );
            
            if (beatsUntilJudgement >= 0 && beatsUntilJudgement <= 3) {
              // 判定タイミングのms時刻を計算
              const judgementTime = currentTime + (beatsUntilJudgement * msPerBeat);
              updatedMonster.judgementWindowStart = judgementTime - 200;
              updatedMonster.judgementWindowEnd = judgementTime + 200;
            }
          }
          
          // 出題タイミングのチェック
          if (!monster.hasQuestionShown && monster.questionTiming) {
            const isAtQuestionTiming = 
              currentBeatPos.measure === monster.questionTiming.measure &&
              currentBeatPos.beat === monster.questionTiming.beat;
            
            if (isAtQuestionTiming) {
              updatedMonster.hasQuestionShown = true;
            }
          }
          
          // 判定ウィンドウ内でのゲージ表示（攻撃ゲージの90-100%を判定ウィンドウとして使用）
          if (monster.judgementWindowStart && monster.judgementWindowEnd && !monster.hasJudged) {
            const windowDuration = 400; // ±200ms = 400ms
            const timeUntilStart = monster.judgementWindowStart - currentTime;
            const timeInWindow = currentTime - monster.judgementWindowStart;
            
            if (timeInWindow >= 0 && timeInWindow <= windowDuration) {
              // 判定ウィンドウ内：ゲージを90-100%で表示
              updatedMonster.gauge = 90 + (timeInWindow / windowDuration) * 10;
            } else if (timeUntilStart > 0 && timeUntilStart <= (prevState.currentStage?.enemyGaugeSeconds || 4) * 1000) {
              // 判定ウィンドウ前：徐々にゲージを増やす
              const progressToWindow = 1 - (timeUntilStart / ((prevState.currentStage?.enemyGaugeSeconds || 4) * 1000));
              updatedMonster.gauge = progressToWindow * 90;
            }
            
            // 判定ウィンドウが終了した場合、ミス判定
            if (currentTime > monster.judgementWindowEnd) {
              updatedMonster.hasJudged = true;
              updatedMonster.gauge = 100;
              // 怒り状態をストアに通知
              const { setEnrage } = useEnemyStore.getState();
              setEnrage(monster.id, true);
              setTimeout(() => setEnrage(monster.id, false), 500);
              
              // 攻撃処理を非同期で実行
              setTimeout(() => handleEnemyAttack(monster.id), 0);
              
              // 次の問題の準備（後で実装）
            }
          }
          
          return updatedMonster;
        });
        
        const nextState = { 
          ...prevState, 
          activeMonsters: updatedMonsters,
          enemyGauge: updatedMonsters[0]?.gauge || 0
        };
        onGameStateChange(nextState);
        return nextState;
      }
      
      // クイズモードの既存処理
      const incrementRate = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      
      // 各モンスターのゲージを更新
      const updatedMonsters = prevState.activeMonsters.map(monster => ({
        ...monster,
        gauge: Math.min(monster.gauge + incrementRate, 100)
      }));
      
      // ゲージが満タンになったモンスターをチェック
      const attackingMonster = updatedMonsters.find(m => m.gauge >= 100);
      
      if (attackingMonster) {
        devLog.debug('🎲 Found attacking monster:', attackingMonster);
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
        devLog.debug('🚀 Calling handleEnemyAttack with id:', attackingMonster.id);
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

      // リズムモードの場合、判定ウィンドウ外の入力は無視
      if (prevState.isRhythmMode) {
        const currentTime = performance.now();
        const validMonsters = prevState.activeMonsters.filter(monster => 
          monster.judgementWindowStart && 
          monster.judgementWindowEnd &&
          !monster.hasJudged &&
          currentTime >= monster.judgementWindowStart &&
          currentTime <= monster.judgementWindowEnd
        );
        
        if (validMonsters.length === 0) {
          // 判定ウィンドウ内にモンスターがいない場合は入力を無視
          return prevState;
        }
      }

      const noteMod12 = note % 12;
      const completedMonsters: MonsterState[] = [];
      let hasAnyNoteChanged = false;

      // 1. 今回の入力でどのモンスターが影響を受けるか判定し、新しい状態を作る
      const monstersAfterInput = prevState.activeMonsters.map(monster => {
        // リズムモードで判定ウィンドウ外のモンスターはスキップ
        if (prevState.isRhythmMode) {
          const currentTime = performance.now();
          const inWindow = monster.judgementWindowStart && 
            monster.judgementWindowEnd &&
            !monster.hasJudged &&
            currentTime >= monster.judgementWindowStart &&
            currentTime <= monster.judgementWindowEnd;
          
          if (!inWindow) {
            return monster;
          }
        }
        
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
            // リズムモードの場合は判定済みフラグを立てるだけ
            if (stateAfterAttack.isRhythmMode) {
              return { ...monster, hasJudged: true, correctNotes: [], gauge: 0 };
            } else {
              const nextChord = selectRandomChord(
                stateAfterAttack.currentStage!.allowedChords,
                monster.chordTarget.id,
                displayOpts
              );
              return { ...monster, chordTarget: nextChord!, correctNotes: [], gauge: 0 };
            }
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
            
            // リズムモード用のデータを準備
            let rhythmModeData = undefined;
            if (stateAfterAttack.isRhythmMode) {
              if (stateAfterAttack.rhythmPattern === 'random') {
                // ランダムパターン：次の小節の1拍目
                const nextMeasure = (stateAfterAttack.nextJudgementTiming?.measure || 1) + 1;
                rhythmModeData = {
                  judgementTiming: { 
                    measure: nextMeasure > (stateAfterAttack.currentStage?.measureCount || 8) ? 1 : nextMeasure, 
                    beat: 1 
                  }
                };
                // 次の判定タイミングを更新
                stateAfterAttack.nextJudgementTiming = rhythmModeData.judgementTiming;
              } else if (stateAfterAttack.rhythmPattern === 'progression' && 
                       stateAfterAttack.currentStage?.chordProgressionData) {
                // プログレッションパターン：次のコードデータ
                const progressionData = stateAfterAttack.currentStage.chordProgressionData.chords;
                const nextIndex = (stateAfterAttack.rhythmProgressionIndex || 0) % progressionData.length;
                const chordData = progressionData[nextIndex];
                rhythmModeData = {
                  judgementTiming: { measure: chordData.measure, beat: chordData.beat },
                  chordId: chordData.chord
                };
                stateAfterAttack.rhythmProgressionIndex = nextIndex + 1;
              }
            }
            
            const newMonster = createMonsterFromQueue(
              monsterIndex,
              position as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
              stateAfterAttack.maxEnemyHp,
              stateAfterAttack.currentStage!.allowedChords,
              lastUsedChordId, // 直前のコードを避ける
              displayOpts,
              stageMonsterIds, // stageMonsterIdsを渡す
              rhythmModeData
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
  }, [onChordCorrect, onGameComplete, onGameStateChange]);
  
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
  
  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      if (enemyGaugeTimer) {
        devLog.debug('⏰ 敵ゲージタイマー クリーンアップで停止');
        clearInterval(enemyGaugeTimer);
      }
      // if (inputTimeout) { // 削除
      //   devLog.debug('⏰ 入力タイムアウト クリーンアップで停止'); // 削除
      //   clearTimeout(inputTimeout); // 削除
      // } // 削除
    };
  }, []);
  

  
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