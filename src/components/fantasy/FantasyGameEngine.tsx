/**
 * ファンタジーゲームエンジン
 * ゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { MONSTERS, getStageMonsterIds } from '@/data/monsters';
import { 
  TaikoNote, 
  ChordProgressionDataItem,
  judgeTimingWindow,
  judgeTimingWindowWithLoop,
  generateBasicProgressionNotes,
  generateRandomProgressionNotes,
  parseChordProgressionData,
  parseSimpleProgressionText,
  ChordSpec
} from './TaikoNoteSystem';
import { bgmManager } from '@/utils/BGMManager';
import { note as parseNote } from 'tonal';

// ===== 型定義 =====

const buildMonsterPaths = (icon: string): string[] => [
  `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`,
  `${import.meta.env.BASE_URL}monster_icons/${icon}.png`
];

const loadMonsterImage = async (icon: string): Promise<HTMLImageElement | null> => {
  for (const path of buildMonsterPaths(icon)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${path}`));
        img.src = path;
      });
      return image;
    } catch {
      continue;
    }
  }
  return null;
};

type StageMode = 
  | 'single'
  | 'progression' // 互換用途（基本進行）
  | 'progression_order'
  | 'progression_random'
  | 'progression_timing';

export interface ChordDefinition {
  id: string;          // コードのID（例: 'CM7', 'G7', 'Am'）
  displayName: string; // 表示名（言語・簡易化設定に応じて変更）
  notes: number[];     // MIDIノート番号の配列（ガイド用ボイシングに使用）
  noteNames: string[]; // 表示用（オクターブなし、ボイシング順）
  quality: string;     // コードの性質（'major', 'minor', 'dominant7'など）
  root: string;        // ルート音（例: 'C', 'G', 'A'）
}

export interface FantasyStage {
  id: string;
  stageNumber: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  maxHp: number;
  enemyGaugeSeconds: number;
  enemyCount: number;
  enemyHp: number;
  minDamage: number;
  maxDamage: number;
  mode: StageMode;
  allowedChords: ChordSpec[]; // 変更: ChordSpec対応
  chordProgression?: ChordSpec[]; // 変更
  chordProgressionData?: ChordProgressionDataItem[] | string; // 型明確化
  showSheetMusic: boolean;
  showGuide: boolean; // ガイド表示設定を追加
  monsterIcon: string;
  bgmUrl?: string;
  simultaneousMonsterCount: number; // 同時出現モンスター数 (1-8)
  bpm: number;
  measureCount?: number;
  countInMeasures?: number;
  timeSignature?: number;
  // ステージ設定: 正解時にルート音を鳴らすか
  playRootOnCorrect?: boolean;
  // 新規: ステージ種別（Basic/Advanced）
  tier?: 'basic' | 'advanced';
  // 追加: 1小節内のノート間隔（太鼓進行のシンプル生成で使用）
  noteIntervalBeats?: number;
}

export interface MonsterState {
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
  nextChord?: ChordDefinition; // 次のコード（ループ時の表示用）
}

export interface FantasyGameState {
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
  // 太鼓の達人モード用
  isTaikoMode: boolean; // 太鼓の達人モードかどうか
  taikoNotes: any[]; // 太鼓の達人用のノーツ配列
  currentNoteIndex: number; // 現在判定中のノーツインデックス
  // ループ管理フィールド
  taikoLoopCycle: number;
  lastNormalizedTime: number;
  awaitingLoopStart: boolean;
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
  // ★ 追加: Ready フェーズ中フラグ
  isReady?: boolean;
}

// ===== コード定義データ =====

/**
 * コード定義を動的に生成する関数
 * @param spec コードIDまたはChordSpec
 * @param displayOpts 表示オプション
 * @returns ChordDefinition
 */
const getChordDefinition = (spec: ChordSpec, displayOpts?: DisplayOpts, useVoicing: boolean = false): ChordDefinition | null => {
  // 単音指定のハンドリング
  if (typeof spec === 'object' && spec.type === 'note') {
    const step = spec.chord; // 'G', 'F#' など
    const octave = spec.octave ?? 4;
    const parsed = parseNote(step.replace(/x/g, '##') + String(octave));
    const midi = parsed && typeof parsed.midi === 'number' ? parsed.midi : null;
    if (!midi) return null;
    return {
      id: step,
      displayName: step,
      notes: [midi],
      noteNames: [step],
      quality: 'maj', // ダミー（使用しない）
      root: step
    };
  }

  const chordId = typeof spec === 'string' ? spec : spec.chord;
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    console.warn(`⚠️ 未定義のファンタジーコード: ${chordId}`);
    return null;
  }

  // 'Fx' のような 'x' を tonal の '##' に戻す
  const toTonalName = (n: string) => n.replace(/x/g, '##');

  // inversion / octave を受け取り（未指定なら null）
  const maybeInversion = typeof spec === 'object' ? (spec.inversion ?? null) : null;
  const maybeOctave = typeof spec === 'object' ? (spec.octave ?? null) : null;

  let midiNotes: number[];
  let noteNamesForDisplay: string[];

  if (useVoicing) {
    // ガイド表示時: 未指定なら inversion=0, octave=4 を既定値として使用
    const baseNames = resolved.notes; // 例: ['A','C','E']
    const N = baseNames.length;
    const inv = Math.max(0, Math.min(N - 1, (maybeInversion ?? 0)));
    const rotated = [...baseNames.slice(inv), ...baseNames.slice(0, inv)];
    const bassOct = (maybeOctave ?? 4);

    let prevMidi = -Infinity;
    midiNotes = rotated.map((name) => {
      let oct = bassOct;
      let parsed = parseNote(toTonalName(name) + String(oct));
      if (!parsed || typeof parsed.midi !== 'number') {
        parsed = parseNote(toTonalName(name) + '4');
      }
      let midi = (parsed && typeof parsed.midi === 'number') ? parsed.midi : 60;
      while (midi <= prevMidi) {
        oct += 1;
        const n2 = parseNote(toTonalName(name) + String(oct));
        if (n2 && typeof n2.midi === 'number') midi = n2.midi; else break;
      }
      prevMidi = midi;
      return midi;
    });
    noteNamesForDisplay = rotated; // オクターブ無し
  } else {
    // 従来: ルートポジションを4オクターブ基準で表示用に構築
    midiNotes = resolved.notes.map(n => {
      const nn = parseNote(toTonalName(n) + '4');
      return (nn && typeof nn.midi === 'number') ? nn.midi : 60;
    });
    noteNamesForDisplay = resolved.notes;
  }

  return {
    id: chordId,
    displayName: resolved.displayName,
    notes: midiNotes,
    noteNames: noteNamesForDisplay,
    quality: resolved.quality,
    root: resolved.root
  };
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
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts,
  stageMonsterIds?: string[],
  useVoicingForGuide: boolean = false
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
  const chord = selectUniqueRandomChord(allowedChords, previousChordId, displayOpts, useVoicingForGuide);
  
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
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts,
  useVoicingForGuide: boolean = false
): ChordDefinition | null => {
  let availableChords = allowedChords
    .map(spec => getChordDefinition(spec, displayOpts, useVoicingForGuide))
    .filter(Boolean) as ChordDefinition[];

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
const selectRandomChord = (
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts,
  useVoicingForGuide: boolean = false
): ChordDefinition | null => {
  let availableChords = allowedChords
    .map(spec => getChordDefinition(spec, displayOpts, useVoicingForGuide))
    .filter(Boolean) as ChordDefinition[];
    
  if (availableChords.length === 0) return null;
  
  if (previousChordId && availableChords.length > 1) {
    const filteredChords = availableChords.filter(c => c.id !== previousChordId);
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
const getProgressionChord = (progression: ChordSpec[], questionIndex: number, displayOpts?: DisplayOpts, useVoicing: boolean = false): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const spec = progression[questionIndex % progression.length];
  return getChordDefinition(spec, displayOpts, useVoicing) || null;
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
  displayOpts = { lang: 'en', simple: false },
  isReady = false
}: FantasyGameEngineProps & { displayOpts?: DisplayOpts }) => {
  
  // ステージで使用するモンスターIDを保持
  const [stageMonsterIds, setStageMonsterIds] = useState<string[]>([]);
  // プリロードしたテクスチャを保持
    const imageTexturesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // 怒り状態の自動解除タイマーをモンスターIDごとに管理
  const enrageTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
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
    // 太鼓の達人モード用
    isTaikoMode: false,
    taikoNotes: [],
    currentNoteIndex: 0,  // 0から開始（ノーツ配列の最初がM2）
    taikoLoopCycle: 0,
    lastNormalizedTime: 0,
    awaitingLoopStart: false
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 太鼓の達人モードの入力処理
  const handleTaikoModeInput = useCallback((prevState: FantasyGameState, note: number): FantasyGameState => {
    // 次ループ開始待ち中は入力を無視
    if (prevState.awaitingLoopStart) {
      devLog.debug('🥁 太鼓：次ループ待ち中のため入力を無視');
      return prevState;
    }

    const currentIndex = prevState.currentNoteIndex;
    const currentNote = prevState.taikoNotes[currentIndex];
    if (!currentNote) return prevState;

    const currentTime = bgmManager.getCurrentMusicTime();
    const stage = prevState.currentStage;
    const secPerMeasure = (60 / (stage?.bpm || 120)) * (stage?.timeSignature || 4);
    // M1開始を0sとした1周の長さ
    const loopDuration = (stage?.measureCount || 8) * secPerMeasure;

    // 候補（current と next まで）を収集し、入力ノートの構成音かつ判定内のもののみ採用
    const noteMod12 = note % 12;
    const candidateIndices = [currentIndex, currentIndex + 1].filter(i => i < prevState.taikoNotes.length);

    const candidates = candidateIndices
      .map(i => {
        const n = prevState.taikoNotes[i];
        const includesNote = Array.from(new Set<number>(n.chord.notes.map((x: number) => x % 12))).includes(noteMod12);
        const j = judgeTimingWindowWithLoop(currentTime, n.hitTime, 150, loopDuration);
        return { i, n, j, includesNote };
      })
      .filter(c => !c.n.isHit && !c.n.isMissed && c.includesNote && c.j.isHit)
      // 優先順位: |timingDiff| 最小 → 同点は手前優先
      .sort((a, b) => {
        const da = Math.abs(a.j.timingDiff);
        const db = Math.abs(b.j.timingDiff);
        if (da !== db) return da - db;
        if (a.n.hitTime !== b.n.hitTime) return a.n.hitTime - b.n.hitTime;
        return a.i - b.i;
      });

    const chosen = candidates[0];
    if (!chosen) {
      return prevState; // ウィンドウ外 or 構成音外
    }

    const chosenNote = chosen.n;
    const chosenIndex = chosen.i;

    devLog.debug('🥁 太鼓の達人判定:', {
      noteId: chosenNote.id,
      measure: chosenNote.measure,
      timing: chosen.j.timing,
      timingDiff: chosen.j.timingDiff,
      currentTime: currentTime.toFixed(3),
      targetTime: chosenNote.hitTime.toFixed(3)
    });

    // 現在のモンスターの正解済み音を更新
    const currentMonster = prevState.activeMonsters[0];
    if (!currentMonster) return prevState;

    const targetNotesMod12: number[] = Array.from(new Set<number>(chosenNote.chord.notes.map((n: number) => n % 12)));
    const newCorrectNotes = [...currentMonster.correctNotes, noteMod12].filter((v, i, a) => a.indexOf(v) === i);

    // コードが完成したかチェック（選ばれたノーツのコードに対して）
    const isChordComplete = targetNotesMod12.every((targetNote: number) => newCorrectNotes.includes(targetNote));

    if (isChordComplete) {
      // コード完成！
      devLog.debug('✅ 太鼓の達人：コード完成！', {
        chord: chosenNote.chord.displayName,
        timing: chosen.j.timing,
        noteIndex: chosenIndex
      });

      // 次のノーツインデックス（選ばれたノーツ基準）
      const nextIndexByChosen = chosenIndex + 1;
      const isLastNoteByChosen = nextIndexByChosen >= prevState.taikoNotes.length;

      // 次のノーツ情報を取得（ループ対応）
      let nextNote, nextNextNote;
      if (!isLastNoteByChosen) {
        nextNote = prevState.taikoNotes[nextIndexByChosen];
        nextNextNote = (nextIndexByChosen + 1 < prevState.taikoNotes.length)
          ? prevState.taikoNotes[nextIndexByChosen + 1]
          : prevState.taikoNotes[0];
      } else {
        nextNote = prevState.taikoNotes[0];
        nextNextNote = prevState.taikoNotes.length > 1 ? prevState.taikoNotes[1] : prevState.taikoNotes[0];
      }

      // ダメージ計算
      const stage = prevState.currentStage!;
      const isSpecialAttack = prevState.playerSp >= 5;
      const baseDamage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
      const actualDamage = isSpecialAttack ? baseDamage * 2 : baseDamage;

      // モンスターのHP更新
      const newHp = Math.max(0, currentMonster.currentHp - actualDamage);
      const isDefeated = newHp === 0;

      // コールバックを実行
      onChordCorrect(chosenNote.chord, isSpecialAttack, actualDamage, isDefeated, currentMonster.id);

      // SP更新
      const newSp = isSpecialAttack ? 0 : Math.min(prevState.playerSp + 1, 5);

      // 現在ヒットしたノーツにフラグを立てる（選ばれたノーツのみ）
      const updatedTaikoNotes = prevState.taikoNotes.map((n, i) => (i === chosenIndex ? { ...n, isHit: true } : n));

      // モンスター更新（次のターゲット/次次ターゲットは選ばれたノーツ基準）
      const updatedMonsters = prevState.activeMonsters.map(m => {
        if (m.id === currentMonster.id) {
          return {
            ...m,
            currentHp: newHp,
            correctNotes: [],
            gauge: 0,
            chordTarget: nextNote.chord,
            nextChord: nextNextNote.chord
          };
        }
        return m;
      });

      // 敵を倒した場合、新しいモンスターを補充（既存ロジック維持）
      if (isDefeated) {
        const remainingMonsters = updatedMonsters.filter(m => m.id !== currentMonster.id);
        const newMonsterQueue = [...prevState.monsterQueue];

        if (newMonsterQueue.length > 0) {
          const monsterIndex = newMonsterQueue.shift()!;

          const newMonster = createMonsterFromQueue(
            monsterIndex,
            'D' as const,
            stage.enemyHp,
            (stage.allowedChords && stage.allowedChords.length > 0) ? stage.allowedChords : (stage.chordProgression || []),
            undefined,
            displayOpts,
            stageMonsterIds,
            stage.showGuide
          );

          newMonster.chordTarget = nextNote.chord;
          newMonster.nextChord = nextNextNote.chord;
          remainingMonsters.push(newMonster);
        }

        // ゲームクリア判定
        const newEnemiesDefeated = prevState.enemiesDefeated + 1;
        if (newEnemiesDefeated >= prevState.totalEnemies) {
          const finalState = {
            ...prevState,
            activeMonsters: [],
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const,
            score: prevState.score + 100 * actualDamage,
            playerSp: newSp,
            enemiesDefeated: newEnemiesDefeated,
            correctAnswers: prevState.correctAnswers + 1,
            // クリア時は便宜上インデックスを選択ノーツの次へ（表示整合用）
            currentNoteIndex: chosenIndex === currentIndex ? nextIndexByChosen : prevState.currentNoteIndex,
            taikoNotes: updatedTaikoNotes
          };
          onGameComplete('clear', finalState);
          return finalState;
        }

        return {
          ...prevState,
          activeMonsters: remainingMonsters,
          monsterQueue: newMonsterQueue,
          playerSp: newSp,
          // 選択が現行ノーツのときのみインデックスを進める
          currentNoteIndex: (chosenIndex === currentIndex)
            ? (isLastNoteByChosen ? prevState.currentNoteIndex : nextIndexByChosen)
            : prevState.currentNoteIndex,
          taikoNotes: updatedTaikoNotes,
          correctAnswers: prevState.correctAnswers + 1,
          score: prevState.score + 100 * actualDamage,
          enemiesDefeated: newEnemiesDefeated,
          // 末尾待機は「順番通り末尾を取った」場合のみ
          awaitingLoopStart: (chosenIndex === currentIndex && isLastNoteByChosen) ? true : prevState.awaitingLoopStart
        };
      }

      // 末尾（選択ノーツ基準）で、かつ順番通りの場合のみ待機
      if (isLastNoteByChosen && chosenIndex === currentIndex) {
        return {
          ...prevState,
          activeMonsters: updatedMonsters,
          playerSp: newSp,
          taikoNotes: updatedTaikoNotes,
          correctAnswers: prevState.correctAnswers + 1,
          score: prevState.score + 100 * actualDamage,
          awaitingLoopStart: true
        };
      }

      return {
        ...prevState,
        activeMonsters: updatedMonsters,
        playerSp: newSp,
        // 順番通りのときのみ進める。先取り命中時は据え置き
        currentNoteIndex: (chosenIndex === currentIndex) ? nextIndexByChosen : prevState.currentNoteIndex,
        taikoNotes: updatedTaikoNotes,
        correctAnswers: prevState.correctAnswers + 1,
        score: prevState.score + 100 * actualDamage
      };
    } else {
      // コード未完成（選ばれたノーツのコードに対する部分正解）
      const updatedMonsters = prevState.activeMonsters.map(m => {
        if (m.id === currentMonster.id) {
          return {
            ...m,
            correctNotes: newCorrectNotes
          };
        }
        return m;
      });

      return {
        ...prevState,
        activeMonsters: updatedMonsters
      };
    }
  }, [onChordCorrect, onGameComplete, displayOpts, stageMonsterIds]);
  
  // ゲーム初期化
  const initializeGame = useCallback(async (stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 旧 BGM を確実に殺す
    bgmManager.stop();

    // 新しいステージ定義から値を取得
    const totalEnemies = stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = totalEnemies * enemyHp;
    const simultaneousCount = stage.mode.startsWith('progression') ? 1 : (stage.simultaneousMonsterCount || 1);

    // ステージで使用するモンスターIDを決定（シャッフルして必要数だけ取得）
    const monsterIds = getStageMonsterIds(totalEnemies);
    setStageMonsterIds(monsterIds);

    // モンスター画像をプリロード
    const textureMap = imageTexturesRef.current;
    textureMap.clear();
    await Promise.all(monsterIds.map(async (id) => {
      const image = await loadMonsterImage(id);
      if (image) {
        textureMap.set(id, image);
      }
    })).catch((error) => {
      devLog.error('❌ モンスター画像プリロード失敗:', error);
    });
    devLog.debug('✅ モンスター画像プリロード完了:', { count: textureMap.size });

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
          (stage.allowedChords && stage.allowedChords.length > 0) ? stage.allowedChords : (stage.chordProgression || []),
          lastChordId,
          displayOpts,
          monsterIds,        // ✅ 今回作った配列
          // singleモードかつ同時出現1体、かつガイドONならボイシング適用
          (stage.mode === 'single' && simultaneousCount === 1 && stage.showGuide)
        );
        activeMonsters.push(monster);
        usedChordIds.push(monster.chordTarget.id);
        lastChordId = monster.chordTarget.id;
      }
    }

    // 互換性のため最初のモンスターの情報を設定
    const firstMonster = activeMonsters[0];
    const firstChord = firstMonster ? firstMonster.chordTarget : null;

    // 太鼓の達人モードの判定
    const isTaikoMode = 
      stage.mode === 'progression' ||  // Changed from specific progression types
      stage.mode === 'progression_order' ||
      stage.mode === 'progression_random' ||
      stage.mode === 'progression_timing';
    let taikoNotes: TaikoNote[] = [];
    
    if (isTaikoMode) {
      // 太鼓の達人モードのノーツ生成
      switch (stage.mode) {
        case 'progression_timing':
          // 拡張版：JSON形式のデータを解析
          if (stage.chordProgressionData) {
            let progressionData: ChordProgressionDataItem[];
            
            if (typeof stage.chordProgressionData === 'string') {
              // 簡易テキスト形式の場合
              progressionData = parseSimpleProgressionText(stage.chordProgressionData);
            } else {
              // JSON配列の場合
              progressionData = stage.chordProgressionData as ChordProgressionDataItem[];
            }
            
            taikoNotes = parseChordProgressionData(
              progressionData,
              stage.bpm || 120,
              stage.timeSignature || 4,
              (spec) => getChordDefinition(spec, displayOpts, stage.showGuide),
              0 // カウントインを渡す
            );
          }
          break;

        case 'progression_random':
          // ランダムプログレッション：各小節ごとにランダムでコードを決定
          taikoNotes = generateRandomProgressionNotes(
            (stage.allowedChords && stage.allowedChords.length > 0) ? stage.allowedChords : (stage.chordProgression || []),
            stage.measureCount || 8,
            stage.bpm || 120,
            stage.timeSignature || 4,
            (spec) => getChordDefinition(spec, displayOpts, stage.showGuide),
            0,
            ((stage as any).noteIntervalBeats || (stage as any).note_interval_beats || stage.timeSignature || 4)
          );
          break;

        case 'progression_order':
        default:
          // 基本版：小節の頭でコード出題（Measure 1 から）
          if (stage.chordProgression) {
            taikoNotes = generateBasicProgressionNotes(
              stage.chordProgression as ChordSpec[],
              stage.measureCount || 8,
              stage.bpm || 120,
              stage.timeSignature || 4,
              (spec) => getChordDefinition(spec, displayOpts, stage.showGuide),
              0,
              (stage as any).noteIntervalBeats || (stage.timeSignature || 4)
            );
          }
          break;
      }
      
      // ループ対応：最初のノーツの情報を設定
      if (taikoNotes.length > 0) {
        // 最初のモンスターのコードを設定（M2から開始）
        if (activeMonsters.length > 0 && taikoNotes.length > 0) {
          // 最初のノーツ（Measure 1）を現在コード、次をnextに設定
          activeMonsters[0].chordTarget = taikoNotes[0].chord;
          activeMonsters[0].nextChord = taikoNotes.length > 1 ? taikoNotes[1].chord : taikoNotes[0].chord;
        }
      }
      
      devLog.debug('🥁 太鼓の達人モード初期化:', {
        noteCount: taikoNotes.length,
        firstNote: taikoNotes[0],
        lastNote: taikoNotes[taikoNotes.length - 1],
        notes: taikoNotes.map(n => ({ measure: n.measure, hitTime: n.hitTime }))
      });
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
      simultaneousMonsterCount: simultaneousCount,
      // ゲーム完了処理中フラグ
      isCompleting: false,
      // 太鼓の達人モード用
      isTaikoMode,
      taikoNotes,
      currentNoteIndex: 0,  // 0から開始（ノーツ配列の最初がM2）
      taikoLoopCycle: 0,
      lastNormalizedTime: 0,
      awaitingLoopStart: false
    };

    setGameState(newState);
    onGameStateChange(newState);

    /* ===== BGMManagerがタイミング管理を担当 ===== */
    // timeStore.setStartは削除（BGMManagerに統合）

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
            nextChord = selectRandomChord(
              (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : (prevState.currentStage.chordProgression || []),
              monster.chordTarget?.id,
              displayOpts,
              (prevState.currentStage?.showGuide && prevState.currentStage?.mode === 'single' && prevState.simultaneousMonsterCount === 1)
            );
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex, displayOpts, !!prevState.currentStage?.showGuide);
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
    // 攻撃時に入力バッファをリセット（削除済み）
    
    // 怒り状態のトグル（IDがわかる場合）: タイマーを延長可能に
    if (attackingMonsterId) {
      const { setEnrage } = useEnemyStore.getState();
      const timers = enrageTimersRef.current;
      const oldTimer = timers.get(attackingMonsterId);
      if (oldTimer) clearTimeout(oldTimer);
      setEnrage(attackingMonsterId, true);
      const t = setTimeout(() => {
        setEnrage(attackingMonsterId!, false);
        timers.delete(attackingMonsterId!);
      }, 500);
      timers.set(attackingMonsterId, t);
    }
    
    setGameState(prevState => {
      // ID未指定だった場合はここで先頭モンスターを適用
      if (!attackingMonsterId && prevState.activeMonsters?.length) {
        const { setEnrage } = useEnemyStore.getState();
        const fallbackId = prevState.activeMonsters[0].id;
        const timers = enrageTimersRef.current;
        const oldTimer = timers.get(fallbackId);
        if (oldTimer) clearTimeout(oldTimer);
        setEnrage(fallbackId, true);
        const t = setTimeout(() => {
          setEnrage(fallbackId, false);
          timers.delete(fallbackId);
        }, 500);
        timers.set(fallbackId, t);
      }

      const newHp = Math.max(0, prevState.playerHp - 1); // 確実に1減らす
      
      devLog.debug('💥 敵の攻撃！HP更新:', {
        oldHp: prevState.playerHp,
        newHp: newHp,
        damage: 1,
        attackingMonsterId: attackingMonsterId || prevState.activeMonsters?.[0]?.id
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
            nextChord = selectRandomChord(
              (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : (prevState.currentStage.chordProgression || []),
              previousChordId,
              displayOpts,
              (prevState.currentStage?.showGuide && prevState.currentStage?.mode === 'single' && prevState.simultaneousMonsterCount === 1)
            );
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex, displayOpts, !!prevState.currentStage?.showGuide);
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
      currentStage: gameState.currentStage?.stageNumber,
      isReady
    });
    
    // 既存のタイマーをクリア
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    // ゲームがアクティブな場合のみ新しいタイマーを開始
    // Ready中（single）では開始しない
    if (
      gameState.isGameActive &&
      gameState.currentStage &&
      !(isReady && gameState.currentStage.mode === 'single')
    ) {
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
  }, [gameState.isGameActive, gameState.currentStage, isReady]); // ゲーム状態とステージ、Readyの変更を監視
  
  // 敵ゲージの更新（マルチモンスター対応）
  const updateEnemyGauge = useCallback(() => {
    /* Ready 中はゲージ停止 - FantasyGameScreenで管理 → エンジンでもガード */
    if (isReady) {
      // singleモード時のみ停止
      const mode = gameState.currentStage?.mode;
      if (mode === 'single') {
        return;
      }
    }
    
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage) {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブ');
        return prevState;
      }
      
      // 太鼓の達人モードの場合は専用のミス判定を行う（single以外）
      if (prevState.isTaikoMode && prevState.taikoNotes.length > 0) {
        const currentTime = bgmManager.getCurrentMusicTime();
        const stage = prevState.currentStage;
        const secPerMeasure = (60 / (stage.bpm || 120)) * (stage.timeSignature || 4);
        const loopDuration = (stage.measureCount || 8) * secPerMeasure;
        
        // ループ境界検出
        const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
        const lastNorm = (prevState.lastNormalizedTime ?? normalizedTime);
        const justLooped = normalizedTime + 1e-6 < lastNorm;
        
        if (justLooped) {
          // 次ループ突入時のみリセット・巻き戻し
          const resetNotes = prevState.taikoNotes.map(note => ({
            ...note,
            isHit: false,
            isMissed: false
          }));
          
          let newNoteIndex = prevState.currentNoteIndex;
          let refreshedMonsters = prevState.activeMonsters;
          
          if (prevState.awaitingLoopStart) {
            newNoteIndex = 0;
            const firstNote = resetNotes[0];
            const secondNote = resetNotes.length > 1 ? resetNotes[1] : resetNotes[0];
            refreshedMonsters = prevState.activeMonsters.map(m => ({
              ...m,
              correctNotes: [],
              gauge: 0,
              chordTarget: firstNote.chord,
              nextChord: secondNote.chord
            }));
          }
          
          return {
            ...prevState,
            taikoNotes: resetNotes,
            currentNoteIndex: newNoteIndex,
            awaitingLoopStart: false,
            taikoLoopCycle: (prevState.taikoLoopCycle ?? 0) + 1,
            lastNormalizedTime: normalizedTime,
            activeMonsters: refreshedMonsters
          };
        }
        
        // 末尾処理後の待機中はミス判定を停止（ループ境界待ち）
        if (prevState.awaitingLoopStart) {
          return { ...prevState, lastNormalizedTime: normalizedTime };
        }
        
        // 以降は既存のミス判定ロジック
        let currentNoteIndex = prevState.currentNoteIndex;
        const currentNote = prevState.taikoNotes[currentNoteIndex];
        if (!currentNote) return { ...prevState, lastNormalizedTime: normalizedTime };
        
        // 現在の音楽時間とノーツのヒット時間の差を計算
        let timeDiff = currentTime - currentNote.hitTime;
        
        // ループを考慮した時間差の調整
        while (timeDiff > loopDuration / 2) {
          timeDiff -= loopDuration;
        }
        while (timeDiff < -loopDuration / 2) {
          timeDiff += loopDuration;
        }
        
        // カウントイン中はミス判定しない
        if (currentTime < 0) {
          return { ...prevState, lastNormalizedTime: normalizedTime };
        }
        
        // ミス判定：+150ms以上経過した場合
        if (timeDiff > 0.15) {
          devLog.debug('💥 太鼓の達人：ミス判定', {
            noteId: currentNote.id,
            measure: currentNote.measure,
            timeDiff: timeDiff.toFixed(3),
            currentTime: currentTime.toFixed(3),
            hitTime: currentNote.hitTime.toFixed(3)
          });
          
          // 敵の攻撃を発動（先頭モンスターを指定）
          const attackerId = prevState.activeMonsters?.[0]?.id;
          if (attackerId) {
            const { setEnrage } = useEnemyStore.getState();
            const timers = enrageTimersRef.current;
            const oldTimer = timers.get(attackerId);
            if (oldTimer) clearTimeout(oldTimer);
            setEnrage(attackerId, true);
            const t = setTimeout(() => {
              setEnrage(attackerId, false);
              timers.delete(attackerId);
            }, 500);
            timers.set(attackerId, t);
          }
          setTimeout(() => handleEnemyAttack(attackerId), 0);
          
          // 次のノーツへ進む。ただし末尾なら次ループ開始まで待機
          const nextIndex = currentNoteIndex + 1;
          if (nextIndex >= prevState.taikoNotes.length) {
            // 末尾：次ループまで待つ（インデックスは進めない）
            const nextNote = prevState.taikoNotes[0];
            const nextNextNote = prevState.taikoNotes.length > 1 ? prevState.taikoNotes[1] : prevState.taikoNotes[0];
            return {
              ...prevState,
              awaitingLoopStart: true,
              // 視覚的なコード切り替えのみ行う
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                correctNotes: [],
                gauge: 0,
                chordTarget: nextNote.chord,
                nextChord: nextNextNote.chord
              })),
              lastNormalizedTime: normalizedTime
            };
          }
          
          // 末尾でなければ通常通り進行
          const nextNote = prevState.taikoNotes[nextIndex];
          const nextNextNote = (nextIndex + 1 < prevState.taikoNotes.length) ? prevState.taikoNotes[nextIndex + 1] : prevState.taikoNotes[0];
          return {
            ...prevState,
            currentNoteIndex: nextIndex,
            activeMonsters: prevState.activeMonsters.map(m => ({
              ...m,
              correctNotes: [],
              gauge: 0,
              chordTarget: nextNote.chord,
              nextChord: nextNextNote.chord
            })),
            lastNormalizedTime: normalizedTime
          };
        }
        
        return { ...prevState, lastNormalizedTime: normalizedTime };
      }
      
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
        devLog.debug('💥 モンスターゲージ満タン！攻撃開始', { 
          monsterId: attackingMonster.id,
          monsterName: attackingMonster.name 
        });
        
        // 怒り状態をストアに通知
        const { setEnrage } = useEnemyStore.getState();
        const timers = enrageTimersRef.current;
        const oldTimer = timers.get(attackingMonster.id);
        if (oldTimer) clearTimeout(oldTimer);
        setEnrage(attackingMonster.id, true);
        const t = setTimeout(() => {
          setEnrage(attackingMonster.id, false);
          timers.delete(attackingMonster.id);
        }, 500);
        timers.set(attackingMonster.id, t);
        
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
          // 互換性のため（最初のモンスターのゲージを代表値として使用）
          enemyGauge: updatedMonsters[0]?.gauge || 0 
        };
        return nextState;
      }
    });
  }, [handleEnemyAttack, onGameStateChange, isReady, gameState.currentStage?.mode]);
  
  // ノート入力処理（ミスタッチ概念を排除し、バッファを永続化）
  const handleNoteInput = useCallback((note: number) => {
    // updater関数の中でロジックを実行するように変更
    setGameState(prevState => {
      // ゲームがアクティブでない場合は何もしない
      if (!prevState.isGameActive || prevState.isWaitingForNextMonster) {
        return prevState;
      }

      devLog.debug('🎹 ノート入力受信 (in updater):', { note, noteMod12: note % 12 });
      
      // 太鼓の達人モードの場合は専用の処理を行う
      if (prevState.isTaikoMode && prevState.taikoNotes.length > 0) {
        return handleTaikoModeInput(prevState, note);
      }

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
              (stateAfterAttack.currentStage!.allowedChords && stateAfterAttack.currentStage!.allowedChords.length > 0) ? stateAfterAttack.currentStage!.allowedChords : (stateAfterAttack.currentStage!.chordProgression || []),
              lastUsedChordId, // 直前のコードを避ける
              displayOpts,
              stageMonsterIds, // stageMonsterIdsを渡す
              stateAfterAttack.currentStage?.showGuide ?? false
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
  }, [onChordCorrect, onGameComplete, onGameStateChange, stageMonsterIds]);
  
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
        nextChord = selectRandomChord(
          (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : (prevState.currentStage.chordProgression || []),
          prevState.currentChordTarget?.id,
          displayOpts
        );
      } else {
        const progression = prevState.currentStage?.chordProgression || [];
        const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
        nextChord = getProgressionChord(progression, nextIndex, displayOpts, !!prevState.currentStage?.showGuide);
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
  
  // コンポーネント破棄時のクリーンアップ強化
  useEffect(() => {
    // クリーンアップ関数を返す
    return () => {
      devLog.debug('🧹 FantasyGameEngine クリーンアップ開始');
      
      // タイマーのクリア
      setGameState(prevState => {
        if (prevState.isGameActive) {
          // ゲームが進行中の場合は停止
          bgmManager.stop();
        }
        return {
          ...prevState,
          isGameActive: false,
          activeMonsters: [],
          taikoNotes: [],
          currentNoteIndex: 0
        };
      });
      
      // モンスターアイコン配列のクリア
      setStageMonsterIds([]);
      
      // プリロードしたテクスチャのクリア（参照のみクリア、実体はPIXI側で管理）
      imageTexturesRef.current.clear();
      
      // 怒り解除タイマーのクリーンアップ
      enrageTimersRef.current.forEach(clearTimeout);
      enrageTimersRef.current.clear();
      
      devLog.debug('✅ FantasyGameEngine クリーンアップ完了');
    };
  }, []); // 空の依存配列で、コンポーネントのアンマウント時のみ実行

  // エフェクトの分離：enemyGaugeTimer専用
  useEffect(() => {
    if (!gameState.isGameActive || !gameState.currentStage || (isReady && gameState.currentStage.mode === 'single')) {
      if (enemyGaugeTimer) {
        clearInterval(enemyGaugeTimer);
        setEnemyGaugeTimer(null);
      }
      return;
    }

    const timer = setInterval(() => {
      updateEnemyGauge();
    }, 100);
    setEnemyGaugeTimer(timer);

    return () => {
      clearInterval(timer);
    };
  }, [gameState.isGameActive, gameState.currentStage?.id, updateEnemyGauge, isReady]); // Ready も依存に追加

  // パフォーマンス監視（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const gameStateRef = { current: gameState };
      gameStateRef.current = gameState;
      
      const measurePerformance = () => {
        const start = performance.now();
        
        // 現在の状態をチェック
        const state = gameStateRef.current;
        const activeCount = state.activeMonsters.length;
        const notesCount = state.taikoNotes.length;
        
        const end = performance.now();
        
        if (end - start > 16.67) { // 60fps = 16.67ms
          devLog.debug('⚠️ パフォーマンス警告:', {
            time: (end - start).toFixed(2),
            monsters: activeCount,
            notes: notesCount
          });
        }
      };
      
      const intervalId = setInterval(measurePerformance, 1000);
      return () => clearInterval(intervalId);
    }
  }, [gameState]);
  
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

export type { FantasyGameEngineProps };
export { ENEMY_LIST, getCurrentEnemy };