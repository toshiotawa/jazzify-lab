/**
 * ファンタジーゲームエンジン
 * ゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord, resolveInterval, formatIntervalDisplayName, parseScaleName, buildScaleNotes, buildScaleMidiNotes } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { convertMusicXmlToProgressionData, truncateMusicXmlByMeasure } from '@/utils/musicXmlToProgression';
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
  ChordSpec,
  BagRandomSelector,
  TransposeSettings,
  RepeatKeyChange,
  transposeTaikoNotes,
  transposeChordDefinition,
  calculateTransposeOffset,
  getKeyFromOffset,
  TRANSPOSE_KEYS
} from './TaikoNoteSystem';
import { bgmManager } from '@/utils/BGMManager';
import { note as parseNote } from 'tonal';

// ===== 型定義 =====

// モジュールレベル画像キャッシュ: ステージ間で永続化しiOS再ロードを回避（FantasyMainのステージ選択時プリロード用にexport）
export const globalImageCache = new Map<string, HTMLImageElement>();

// 🚀 パフォーマンス最適化: 直接PNGをロード（WebPフォールバック不要）
const loadImageAsset = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const loadMonsterImage = async (icon: string): Promise<HTMLImageElement> => {
  // 直接PNGをロード（WebPファイルは存在しないため高速化）
  const pngPath = `${import.meta.env.BASE_URL}monster_icons/${icon}.png`;
  return loadImageAsset(pngPath);
};

export const preloadMonsterImages = async (monsterIds: string[], cache: Map<string, HTMLImageElement>): Promise<void> => {
  await Promise.all(
    monsterIds.map(async (id) => {
      if (cache.has(id)) {
        return;
      }
      const image = await loadMonsterImage(id);
      cache.set(id, image);
    })
  );
};

/**
 * 楽譜モード用の画像をプリロード
 */
const loadSheetMusicImage = (noteName: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    // noteName: "treble_A#3" → clef: "treble", note: "A#3"
    const clef = noteName.startsWith('bass_') ? 'bass' : 'treble';
    const note = noteName.replace(/^(treble|bass)_/, '');
    // ファイル名では # を sharp に変換
    const safeNote = note.replace(/#/g, 'sharp');
    img.src = `${import.meta.env.BASE_URL}notes_images/${clef}/${clef}_${safeNote}.png`;
  });

export const preloadSheetMusicImages = async (noteNames: string[], cache: Map<string, HTMLImageElement>): Promise<void> => {
  await Promise.all(
    noteNames.map(async (noteName) => {
      // アイコンキーは sheet_music_{noteName} の形式
      const iconKey = `sheet_music_${noteName}`;
      if (cache.has(iconKey)) {
        return;
      }
      try {
        const image = await loadSheetMusicImage(noteName);
        cache.set(iconKey, image);
      } catch (error) {
        devLog.debug(`楽譜画像のプリロード失敗: ${noteName}`, error);
      }
    })
  );
};

type StageMode = 
  | 'single'
  | 'single_order'
  | 'progression' // 互換用途（基本進行）
  | 'progression_order'
  | 'progression_random'
  | 'progression_timing'
  | 'timing_combining';

export type FantasyPlayMode = 'challenge' | 'practice';

/**
 * React状態更新の遅延を回避するための同期オブジェクト。
 * setGameState更新関数内でBGM切り替えと同時に更新され、
 * アニメーションループが即座に正しいセクション情報を参照できる。
 */
export const combiningSync = {
  sectionIndex: 0,
  noteStartIndex: 0,
  noteEndIndex: 0,
  active: false,
};

export interface ChordDefinition {
  id: string;          // コードのID（例: 'CM7', 'G7', 'Am'）
  displayName: string; // 表示名（言語・簡易化設定に応じて変更）
  notes: number[];     // MIDIノート番号の配列（ガイド用ボイシングに使用）
  noteNames: string[]; // 表示用（オクターブなし、ボイシング順）
  quality: string;     // コードの性質（'major', 'minor', 'dominant7'など）
  root: string;        // ルート音（例: 'C', 'G', 'A'）
}

// 本番モード用の転調設定の型
type ProductionRepeatTranspositionMode = 'off' | '+1' | '+5' | '-1' | '-5' | 'random';

export interface FantasyStage {
  id: string;
  stageNumber: string | null;  // レッスン専用ステージではnull可
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
  showGuide: boolean; // 廃止予定: ガイド表示はplayModeに基づいて決定（練習=ON、挑戦=OFF）
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
  // 次ステージ開放に必要なクリア換算回数（Sランク=10回換算、それ以外=1回）
  required_clears_for_next?: number;
  // 楽譜モード: true の場合、敵のアイコンを楽譜画像に置き換え
  isSheetMusicMode?: boolean;
  // 楽譜タイプ: treble=ト音記号, bass=ヘ音記号
  sheetMusicClef?: 'treble' | 'bass';
  // Progression_Timing用: 元のMusicXMLデータ（OSMD表示用）
  musicXml?: string;
  // 低速練習モード用: 再生速度倍率（1.0=100%, 0.75=75%, 0.5=50%）
  speedMultiplier?: number;
  // Timingモード移調練習用: 移調設定（練習モード用）
  transposeSettings?: TransposeSettings;
  // 本番モード用の転調設定（timingモード専用）
  productionRepeatTranspositionMode?: ProductionRepeatTranspositionMode;
  productionStartKey?: number;
  // timing_combining 用: 結合する子ステージIDの順序付き配列
  combinedStageIds?: string[];
  // timing_combining 用: ロード済みの子ステージデータ
  combinedStages?: FantasyStage[];
  // timing_combining 用: 各セクションのリピート回数（例: [1, 2, 1]）
  combinedSectionRepeats?: number[];
  // timing_combining 用: 各セクションの小節数制限（null=制限なし, 例: [4, null, 8]）
  combinedSectionMeasureLimits?: (number | null)[];
  // アウフタクト（弱起）: trueの場合、1回目のループでカウントイン小節にもノーツを生成
  isAuftakt?: boolean;
  // コールアンドレスポンス（progression_timing用）
  callResponseEnabled?: boolean;
  callResponseMode?: 'manual' | 'alternating';
  callResponseListenBars?: [number, number];
  callResponsePlayBars?: [number, number];
  // コールアンドレスポンス（timing_combining用: セクション別）
  combinedSectionListenBars?: ([number, number] | null)[];
  combinedSectionPlayBars?: ([number, number] | null)[];
  combinedSectionCrModes?: ('off' | 'manual' | 'alternating')[];
  // リズム譜表示モード
  useRhythmNotation?: boolean;
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
  defeatedAt?: number; // 撃破されたタイムスタンプ（HP0演出後に削除するため）
}

// timing_combining 用: 各子ステージのセクション情報
export interface CombinedSection {
  stageId: string;
  stageName: string;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures: number;
  audioCountInMeasures: number; // 音声ファイル内の実際のカウントイン小節数（skipCountIn判定用）
  bgmUrl?: string;
  musicXml?: string;
  notes: TaikoNote[]; // このセクション固有のノーツ（ローカルhitTime）
  globalTimeOffset: number; // グローバル時間軸での開始オフセット（秒）
  globalNoteStartIndex: number; // 統合taikoNotes配列での開始インデックス
  globalNoteEndIndex: number; // 統合taikoNotes配列での終了インデックス（排他的）
  sectionDuration: number; // カウントイン + 本編小節の合計時間（秒）
  isAuftakt: boolean; // アウフタクト（弱起）: MusicXMLにカウントイン小節が含まれるかの判定に使用
  listenBars?: [number, number]; // C&R: リスニング小節範囲（ノーツなし）
  playBars?: [number, number];   // C&R: 演奏小節範囲
  callResponseMode?: 'manual' | 'alternating';
  repeatIndex?: number; // 親セクションの何回目のリピートか（0-indexed）
  sectionRepeatCount?: number; // 親セクションの総リピート回数
}

export interface FantasyGameState {
  currentStage: FantasyStage | null;
  playMode: FantasyPlayMode;
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
  // 移調練習用
  transposeSettings: TransposeSettings | null;
  currentTransposeOffset: number; // 現在の移調オフセット（半音数）
  originalTaikoNotes: TaikoNote[]; // 移調前の元のノート配列（リピート時に使用）
  // 先読みヒット管理（ループ直前に次ループのノーツをヒットした場合に記録）
  preHitNoteIndices: number[]; // 次ループで既にヒット済みとするノーツのインデックス
  // timing_combining 用
  isCombiningMode: boolean;
  combinedSections: CombinedSection[]; // 各子ステージのセクション情報
  currentSectionIndex: number; // 現在のセクションインデックス
  combinedFullLoopCount: number; // 全セクション通しのループ回数（移調用）
  combo: number;
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
 * 
 * 転回形は明示的にinversionが指定されている場合のみ適用。
 * それ以外は全て基本形（オクターブ4）で表示。
 */
const getChordDefinition = (spec: ChordSpec, displayOpts?: DisplayOpts): ChordDefinition | null => {
  // 度数（インターバル）指定のハンドリング
  if (typeof spec === 'object' && spec.type === 'interval') {
    const { chord: root, interval, direction, octave: specOctave } = spec;
    const octave = specOctave ?? 4;
    const resolved = resolveInterval(root, interval, direction, octave);
    if (!resolved) return null;
    const displayName = formatIntervalDisplayName(root, interval, direction);
    return {
      id: `${root}_${interval}_${direction}`,
      displayName,
      notes: [resolved.midi],
      noteNames: [resolved.noteName],
      quality: 'single', // 度数問題は単音正解
      root // 問題のルート音を保持（移調時にdisplayNameが正しく更新されるように）
    };
  }

  // 単音指定のハンドリング
  if (typeof spec === 'object' && spec.type === 'note') {
    const rawStep = spec.chord; // 'G', 'F#' など
    const rawOctave = spec.octave ?? 4;
    // 白鍵の異名同音を正規化（B#→C, E#→F, Cb→B, Fb→E）
    const enharmonicMap: Record<string, { name: string; octAdj: number }> = {
      'B#': { name: 'C', octAdj: 1 }, 'E#': { name: 'F', octAdj: 0 },
      'Cb': { name: 'B', octAdj: -1 }, 'Fb': { name: 'E', octAdj: 0 },
    };
    const eh = enharmonicMap[rawStep];
    const step = eh ? eh.name : rawStep;
    const octave = eh ? rawOctave + eh.octAdj : rawOctave;
    const parsed = parseNote(step.replace(/x/g, '##') + String(octave));
    const midi = parsed && typeof parsed.midi === 'number' ? parsed.midi : null;
    if (!midi) return null;
    return {
      id: step,
      displayName: step,
      notes: [midi],
      noteNames: [step],
      quality: 'maj',
      root: step
    };
  }

  const chordId = typeof spec === 'string' ? spec : spec.chord;
  
  // スケール名のハンドリング（例: "C major", "C major_scale", "D natural_minor"）
  const parsedScale = parseScaleName(chordId);
  if (parsedScale) {
    const { root, scaleType } = parsedScale;
    const octave = (typeof spec === 'object' && spec.octave) ? spec.octave : 4;
    const scaleNotes = buildScaleNotes(root, scaleType, octave);
    const scaleMidiNotes = buildScaleMidiNotes(root, scaleType, octave);
    
    // スケールの各音を単音として扱う（最初の音を返す）
    // 実際のゲームでは、スケールの各音を個別に扱う必要がある場合は、
    // allowed_chordsにスケール名を展開する必要がある
    if (scaleNotes.length > 0 && scaleMidiNotes.length > 0) {
      return {
        id: chordId,
        displayName: `${root} ${scaleType}`,
        notes: [scaleMidiNotes[0]], // 最初の音のみ（スケール全体を扱う場合は展開が必要）
        noteNames: [scaleNotes[0]],
        quality: 'single',
        root
      };
    }
  }
  
  // 楽譜モードの音名形式をハンドリング（treble_C4, bass_A3 など）
  if (chordId.startsWith('treble_') || chordId.startsWith('bass_')) {
    // プレフィックスを除去して音名を取得（例: "treble_A#3" → "A#3"）
    const noteName = chordId.replace(/^(treble|bass)_/, '');
    // "sharp" → "#", "flat" → "b" に正規化（ファイル名形式からの変換）
    const normalizedNoteName = noteName.replace(/sharp/gi, '#').replace(/flat/gi, 'b');
    // 音名とオクターブを分離（例: "A#3" → step="A#", octave=3）
    const match = normalizedNoteName.match(/^([A-G][#b]?)(\d+)$/);
    if (match) {
      const step = match[1];
      const octave = parseInt(match[2], 10);
      const parsed = parseNote(step.replace(/x/g, '##') + String(octave));
      const midi = parsed && typeof parsed.midi === 'number' ? parsed.midi : null;
      if (midi) {
        return {
          id: chordId, // 元のID（treble_A#3 または treble_Asharp3）を保持
          displayName: normalizedNoteName, // 表示用は正規化された音名（A#3）
          notes: [midi],
          noteNames: [step],
          quality: 'maj', // ダミー
          root: step
        };
      }
    }
    // パースに失敗した場合は警告を出さずにnullを返す
    return null;
  }
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

  // 明示的にinversionが指定されている場合のみ転回形を適用
  if (maybeInversion !== null && maybeInversion > 0) {
    const baseNames = resolved.notes; // 例: ['A','C','E']
    const N = baseNames.length;
    const inv = Math.max(0, Math.min(N - 1, maybeInversion));
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
    // 基本形: ルートポジションをオクターブ基準で表示用に構築
    const bassOct = (maybeOctave ?? 4);
    let prevMidi = -Infinity;
    midiNotes = resolved.notes.map((n) => {
      let oct = bassOct;
      let parsed = parseNote(toTonalName(n) + String(oct));
      if (!parsed || typeof parsed.midi !== 'number') {
        parsed = parseNote(toTonalName(n) + '4');
      }
      let midi = (parsed && typeof parsed.midi === 'number') ? parsed.midi : 60;
      // 音が前の音より低い場合はオクターブを上げる（基本形でも昇順に配置）
      while (midi <= prevMidi) {
        oct += 1;
        const n2 = parseNote(toTonalName(n) + String(oct));
        if (n2 && typeof n2.midi === 'number') midi = n2.midi; else break;
      }
      prevMidi = midi;
      return midi;
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
  sheetMusicMode?: { enabled: boolean; clef: 'treble' | 'bass' },
  bagSelector?: BagRandomSelector<ChordSpec> | null
): MonsterState => {
  // コードを選択（袋形式セレクターがあれば使用、なければ従来方式）
  // 空の場合はダミーコードを使用 - 太鼓モードでは後で taikoNotes から上書きされる
  const chord = selectUniqueRandomChordWithBag(bagSelector ?? null, allowedChords, previousChordId, displayOpts);
  
  // コードが見つからない場合（progression_timing で allowedChords が空の場合など）
  // ダミーのコードを作成（後で taikoNotes から上書きされる）
  const effectiveChord: ChordDefinition = chord ?? {
    id: 'placeholder',
    notes: [60], // C4
    noteNames: ['C'],
    displayName: '---',
    quality: 'placeholder',
    root: 'C'
  };
  
  // 楽譜モードの場合、コード名（実際には音名）から楽譜画像のキーを生成
  let iconKey: string;
  if (sheetMusicMode?.enabled && effectiveChord.id !== 'placeholder') {
    // 楽譜モード: 音名形式は "treble_C4" または "bass_C3" など
    // effectiveChord.id が既に "treble_C4" 形式の場合はそのまま使用
    // 旧形式（"C4"のみ）の場合は clef を付加
    const chordId = effectiveChord.id;
    if (chordId.startsWith('treble_') || chordId.startsWith('bass_')) {
      // 新形式: そのまま使用
      iconKey = `sheet_music_${chordId}`;
    } else {
      // 旧形式: clef を付加（後方互換性）
      iconKey = `sheet_music_${sheetMusicMode.clef}_${chordId}`;
    }
  } else if (stageMonsterIds && stageMonsterIds[monsterIndex]) {
    // stageMonsterIdsが提供されている場合は、それを使用
    iconKey = stageMonsterIds[monsterIndex];
  } else {
    // フォールバック: 従来のランダム選択
    const rand = Math.floor(Math.random() * 63) + 1;
    iconKey = `monster_${String(rand).padStart(2, '0')}`;
  }
  
  const enemy = { id: iconKey, icon: iconKey, name: '' }; // ← name は空文字
  
  return {
    id: `${enemy.id}_${Date.now()}_${position}`,
    index: monsterIndex,
    position,
    currentHp: enemyHp,
    maxHp: enemyHp,
    gauge: 0,
    chordTarget: effectiveChord,
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

const PRACTICE_QUEUE_BATCH_SIZE = 24;

const createPracticeQueueBatch = (count: number): number[] => {
  const safeCount = Math.max(1, Math.floor(count));
  const indices = Array.from({ length: safeCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

/**
 * 既に使用されているコードを除外してランダムにコードを選択
 * 袋形式ランダムセレクターを使用するバージョン
 * @param bagSelector 袋形式ランダムセレクター（外部から提供）
 * @param allowedChords コードプール（bagSelectorがない場合のフォールバック用）
 * @param previousChordId 直前のコードID（bagSelector使用時は自動で回避される）
 * @param displayOpts 表示オプション
 */
const selectUniqueRandomChordWithBag = (
  bagSelector: BagRandomSelector<ChordSpec> | null,
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  if (bagSelector) {
    // 袋形式ランダムセレクターを使用
    const spec = bagSelector.next(previousChordId);
    return getChordDefinition(spec, displayOpts);
  }
  
  // フォールバック: 従来の方式
  let availableChords = allowedChords
    .map(spec => getChordDefinition(spec, displayOpts))
    .filter(Boolean) as ChordDefinition[];

  if (previousChordId && availableChords.length > 1) {
    const tmp = availableChords.filter(c => c.id !== previousChordId);
    if (tmp.length) availableChords = tmp;
  }

  const i = Math.floor(Math.random() * availableChords.length);
  return availableChords[i] ?? null;
};

/**
 * 既に使用されているコードを除外してランダムにコードを選択 - 互換性維持用
 * 注: 袋形式を使用する場合は selectUniqueRandomChordWithBag を使用してください
 */
const selectUniqueRandomChord = (
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  return selectUniqueRandomChordWithBag(null, allowedChords, previousChordId, displayOpts);
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
    return false;
  }
  
  // 重複を除去し、mod 12で正規化（オクターブ無視）
  const inputNotesMod12 = [...new Set(inputNotes.map(note => note % 12))]; // 重複除去も追加
  const targetNotesMod12 = [...new Set(targetChord.notes.map(note => note % 12))]; // 重複除去も追加
  
  // 転回形も考慮：すべての構成音が含まれているかチェック
  const hasAllTargetNotes = targetNotesMod12.every(targetNote => 
    inputNotesMod12.includes(targetNote)
  );
  
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
 * 袋形式ランダムセレクターを使用するバージョン
 * @param bagSelector 袋形式ランダムセレクター（外部から提供）
 * @param allowedChords コードプール（bagSelectorがない場合のフォールバック用）
 * @param previousChordId 直前のコードID（bagSelector使用時は自動で回避される）
 * @param displayOpts 表示オプション
 */
const selectRandomChordWithBag = (
  bagSelector: BagRandomSelector<ChordSpec> | null,
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  if (bagSelector) {
    // 袋形式ランダムセレクターを使用
    const spec = bagSelector.next(previousChordId);
    return getChordDefinition(spec, displayOpts);
  }
  
  // フォールバック: 従来の方式
  let availableChords = allowedChords
    .map(spec => getChordDefinition(spec, displayOpts))
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
 * ランダムコード選択（allowedChordsから）- 互換性維持用
 * 注: 袋形式を使用する場合は selectRandomChordWithBag を使用してください
 */
const selectRandomChord = (
  allowedChords: ChordSpec[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  return selectRandomChordWithBag(null, allowedChords, previousChordId, displayOpts);
};

/**
 * 順序付きコード選択（single_orderモード用）
 * allowed_chordsを先頭から順番に巡回する
 */
const selectOrderedChord = (
  allowedChords: ChordSpec[],
  indexRef: React.MutableRefObject<number>,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  if (allowedChords.length === 0) return null;
  const idx = indexRef.current % allowedChords.length;
  indexRef.current = idx + 1;
  const spec = allowedChords[idx];
  return getChordDefinition(spec, displayOpts) || null;
};

/**
 * コード進行から次のコードを取得
 */
const getProgressionChord = (progression: ChordSpec[], questionIndex: number, displayOpts?: DisplayOpts): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const spec = progression[questionIndex % progression.length];
  return getChordDefinition(spec, displayOpts) || null;
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
  // プリロードしたテクスチャを保持（モジュールレベルキャッシュを共有）
  const imageTexturesRef = useRef<Map<string, HTMLImageElement>>(globalImageCache);
  // 怒り状態の自動解除タイマーをモンスターIDごとに管理
  const enrageTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // 袋形式ランダムセレクター（コード選択の偏り防止）
  const bagSelectorRef = useRef<BagRandomSelector<ChordSpec> | null>(null);
  // single_orderモード用: allowed_chords内の現在インデックス
  const singleOrderIndexRef = useRef<number>(0);
  // lastNormalizedTime: ループ/セクション境界検出用（refに移動し不要なReact再レンダーを回避）
  const lastNormalizedTimeRef = useRef<number>(-1);
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    playMode: 'challenge',
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
    lastNormalizedTime: -1, // -1 = 未初期化（ループ境界の誤検出防止）
    awaitingLoopStart: false,
    // 移調練習用
    transposeSettings: null,
    currentTransposeOffset: 0,
    originalTaikoNotes: [],
    preHitNoteIndices: [],
    // timing_combining 用
    isCombiningMode: false,
    combinedSections: [],
    currentSectionIndex: 0,
    combinedFullLoopCount: 0,
    combo: 0,
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);

  
  // timing_combining 専用の入力判定（コード完成判定・ダメージ・エフェクト対応版）
  const handleCombiningModeInput = useCallback((
    prevState: FantasyGameState,
    note: number,
    currentTime: number,
  ): FantasyGameState => {
    lastNormalizedTimeRef.current = currentTime;
    const section = prevState.combinedSections[prevState.currentSectionIndex];
    if (!section) return prevState;
    const stage = prevState.currentStage;
    
    const noteMod12 = note % 12;
    const currentIndex = prevState.currentNoteIndex;
    const sectionEnd = section.globalNoteEndIndex;
    
    // 候補: 現在のノーツと次のノーツ
    const candidateIndices: number[] = [];
    if (currentIndex < sectionEnd) candidateIndices.push(currentIndex);
    if (currentIndex + 1 < sectionEnd) candidateIndices.push(currentIndex + 1);
    
    // セクション末尾付近: 次のセクションの先頭ノーツも先読み候補に
    const secPerMeasure = (60 / section.bpm) * section.timeSignature;
    const sectionPlayDuration = section.measureCount * secPerMeasure;
    const timeToSectionEnd = sectionPlayDuration - currentTime;
    const lookAheadJudgeTime = 4.0;
    
    if (timeToSectionEnd < lookAheadJudgeTime) {
      const nextSectionIdx = prevState.currentSectionIndex + 1;
      if (nextSectionIdx < prevState.combinedSections.length) {
        const nextSection = prevState.combinedSections[nextSectionIdx];
        const nextCountInSec = nextSection.countInMeasures * (60 / nextSection.bpm) * nextSection.timeSignature;
        for (let i = nextSection.globalNoteStartIndex; i < nextSection.globalNoteEndIndex; i++) {
          const n = prevState.taikoNotes[i];
          if (n && n.hitTime + nextCountInSec < (lookAheadJudgeTime - timeToSectionEnd)) {
            if (!candidateIndices.includes(i)) candidateIndices.push(i);
          } else {
            break;
          }
        }
      }
    }
    
    let chosen: {
      i: number;
      n: TaikoNote;
      timeDiffMs: number;
      isNextSectionNote: boolean;
    } | null = null;
    
    for (const i of candidateIndices) {
      const n = prevState.taikoNotes[i];
      if (!n || n.isHit || n.isMissed) continue;
      
      const chordNotes = n.chord.notes;
      let includesNote = false;
      for (const cn of chordNotes) {
        if (((cn % 12) + 12) % 12 === noteMod12) {
          includesNote = true;
          break;
        }
      }
      if (!includesNote) continue;
      
      const isNextSection = i >= sectionEnd;
      let effectiveHitTime = n.hitTime;
      if (isNextSection) {
        const nextSection = prevState.combinedSections[prevState.currentSectionIndex + 1];
        if (nextSection) {
          const nextCountInSec = nextSection.countInMeasures * (60 / nextSection.bpm) * nextSection.timeSignature;
          effectiveHitTime = sectionPlayDuration + nextCountInSec + n.hitTime;
        }
      }
      
      const timeDiffMs = Math.abs(currentTime - effectiveHitTime) * 1000;
      if (timeDiffMs > 300) continue;
      
      if (!chosen || timeDiffMs < chosen.timeDiffMs) {
        chosen = { i, n, timeDiffMs, isNextSectionNote: isNextSection };
      }
    }
    
    if (!chosen) return prevState;
    
    // コード完成判定（handleTaikoModeInput と同等）
    const currentMonster = prevState.activeMonsters[0];
    if (!currentMonster) return prevState;

    // 撃破済みモンスター: ノーツ判定は継続するがダメージは発生しない
    if (currentMonster.defeatedAt !== undefined) {
      const defChord = chosen.n.chord;
      const defTargetMod12: number[] = Array.from(new Set<number>(defChord.notes.map((n: number) => n % 12)));
      const defCorrectNotes = [...currentMonster.correctNotes, noteMod12].filter((v, i, a) => a.indexOf(v) === i);
      const defChordComplete = defTargetMod12.every((t: number) => defCorrectNotes.includes(t));
      if (defChordComplete) {
        const defNotes = prevState.taikoNotes.slice();
        defNotes[chosen.i] = { ...chosen.n, isHit: true };
        const defSkip = !chosen.isNextSectionNote && chosen.i > currentIndex;
        let defNext: number;
        let defLast: boolean;
        if (defSkip) {
          defNext = currentIndex;
          defLast = false;
        } else {
          defNext = chosen.isNextSectionNote ? currentIndex : chosen.i + 1;
          while (defNext < sectionEnd && defNotes[defNext]?.isHit) defNext++;
          defLast = defNext >= sectionEnd;
        }
        return {
          ...prevState,
          taikoNotes: defNotes,
          currentNoteIndex: defLast ? currentIndex : defNext,
          awaitingLoopStart: defLast,
          combo: prevState.combo + 1,
          activeMonsters: prevState.activeMonsters.map(m =>
            m.id === currentMonster.id ? { ...m, correctNotes: [] } : m
          ),
        };
      }
      return {
        ...prevState,
        activeMonsters: prevState.activeMonsters.map(m =>
          m.id === currentMonster.id ? { ...m, correctNotes: defCorrectNotes } : m
        ),
      };
    }
    
    const effectiveChord = chosen.n.chord;
    const targetNotesMod12: number[] = Array.from(new Set<number>(effectiveChord.notes.map((n: number) => n % 12)));
    const newCorrectNotes = [...currentMonster.correctNotes, noteMod12].filter((v, i, a) => a.indexOf(v) === i);
    const isChordComplete = targetNotesMod12.every((targetNote: number) => newCorrectNotes.includes(targetNote));
    
    if (isChordComplete) {
      // コード完成 → ダメージ計算・エフェクト・次ノーツ遷移
      const updatedNotes = [...prevState.taikoNotes];
      updatedNotes[chosen.i] = { ...chosen.n, isHit: true };
      
      // 後のノーツが選ばれた場合、先のノーツをスキップしない
      const didSkipEarlierNotes = !chosen.isNextSectionNote && chosen.i > currentIndex;
      let nextIndex: number;
      let isLastInSection: boolean;
      if (didSkipEarlierNotes) {
        nextIndex = currentIndex;
        isLastInSection = false;
      } else {
        nextIndex = chosen.isNextSectionNote ? currentIndex : chosen.i + 1;
        while (nextIndex < sectionEnd && updatedNotes[nextIndex]?.isHit) nextIndex++;
        isLastInSection = nextIndex >= sectionEnd;
      }

      let nextNote, nextNextNote;
      if (didSkipEarlierNotes) {
        nextNote = prevState.taikoNotes[currentIndex];
        let nnIdx = currentIndex + 1;
        while (nnIdx < sectionEnd && (nnIdx === chosen.i || updatedNotes[nnIdx]?.isHit)) nnIdx++;
        nextNextNote = nnIdx < sectionEnd
          ? updatedNotes[nnIdx]
          : (prevState.combinedSections[prevState.currentSectionIndex + 1]
            ? prevState.taikoNotes[prevState.combinedSections[prevState.currentSectionIndex + 1].globalNoteStartIndex]
            : prevState.taikoNotes[currentIndex]);
      } else if (isLastInSection) {
        nextNote = prevState.combinedSections[prevState.currentSectionIndex + 1]
          ? prevState.taikoNotes[prevState.combinedSections[prevState.currentSectionIndex + 1].globalNoteStartIndex]
          : chosen.n;
        nextNextNote = nextNote;
      } else {
        nextNote = updatedNotes[nextIndex];
        nextNextNote = (nextIndex + 1 < sectionEnd) ? updatedNotes[nextIndex + 1] : nextNote;
      }
      // ダメージ計算
      const stageForDamage = stage!;
      const isSpecialAttack = prevState.playerSp >= 5;
      const baseDamage = Math.floor(Math.random() * (stageForDamage.maxDamage - stageForDamage.minDamage + 1)) + stageForDamage.minDamage;
      const actualDamage = isSpecialAttack ? baseDamage * 2 : baseDamage;
      const newHp = Math.max(0, currentMonster.currentHp - actualDamage);
      const isDefeated = newHp === 0;
      
      // エフェクトコールバック
      onChordCorrect(effectiveChord, isSpecialAttack, actualDamage, isDefeated, currentMonster.id);
      
      const newSp = isSpecialAttack ? 0 : Math.min(prevState.playerSp + 1, 5);
      
      // モンスター更新
      const updatedMonsters = prevState.activeMonsters.map(m => {
        if (m.id === currentMonster.id) {
          return {
            ...m,
            currentHp: newHp,
            correctNotes: [],
            gauge: 0,
            chordTarget: nextNote?.chord ?? m.chordTarget,
            nextChord: nextNextNote?.chord ?? m.nextChord,
            ...(isDefeated ? { defeatedAt: Date.now() } : {}),
          };
        }
        return m;
      });
      
      // ゲームクリア判定
      if (isDefeated) {
        const newEnemiesDefeated = prevState.enemiesDefeated + 1;
        if (newEnemiesDefeated >= prevState.totalEnemies) {
          const finalState: FantasyGameState = {
            ...prevState,
            taikoNotes: updatedNotes,
            activeMonsters: [],
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const,
            score: prevState.score + 100 * actualDamage,
            playerSp: newSp,
            enemiesDefeated: newEnemiesDefeated,
            correctAnswers: prevState.correctAnswers + 1,
            combo: prevState.combo + 1,
            currentNoteIndex: isLastInSection ? currentIndex : nextIndex,
            awaitingLoopStart: false,
          };
          onGameComplete('clear', finalState);
          return finalState;
        }
        
        return {
          ...prevState,
          taikoNotes: updatedNotes,
          activeMonsters: updatedMonsters,
          playerSp: newSp,
          currentNoteIndex: isLastInSection ? currentIndex : nextIndex,
          correctAnswers: prevState.correctAnswers + 1,
          combo: prevState.combo + 1,
          score: prevState.score + 100 * actualDamage,
          enemiesDefeated: newEnemiesDefeated,
          awaitingLoopStart: isLastInSection,
        };
      }
      
      return {
        ...prevState,
        taikoNotes: updatedNotes,
        activeMonsters: updatedMonsters,
        playerSp: newSp,
        currentNoteIndex: isLastInSection ? currentIndex : nextIndex,
        correctAnswers: prevState.correctAnswers + 1,
        combo: prevState.combo + 1,
        score: prevState.score + 100 * actualDamage,
        awaitingLoopStart: isLastInSection,
      };
    } else {
      // コード未完成 → correctNotes のみ更新
      const updatedMonsters = prevState.activeMonsters.map(m => {
        if (m.id === currentMonster.id) {
          return { ...m, correctNotes: newCorrectNotes };
        }
        return m;
      });
      return {
        ...prevState,
        activeMonsters: updatedMonsters,
      };
    }
  }, [onChordCorrect, onGameComplete, displayOpts]);
  
  // 太鼓の達人モードの入力処理
  const handleTaikoModeInput = useCallback((
    prevState: FantasyGameState,
    note: number,
    inputMusicTime?: number
  ): FantasyGameState => {
    const currentTime = inputMusicTime ?? bgmManager.getCurrentMusicTime();
    const stage = prevState.currentStage;
    
    // timing_combining: セクション内のローカル時間で判定
    if (prevState.isCombiningMode && prevState.combinedSections.length > 0) {
      return handleCombiningModeInput(prevState, note, currentTime);
    }
    
    const secPerMeasure = (60 / (stage?.bpm || 120)) * (stage?.timeSignature || 4);
    const countInSec = (stage?.countInMeasures || 0) * secPerMeasure;
    const hasCountInLoop = bgmManager.getLoopIncludesCountIn();
    const actualEnd = bgmManager.getActualLoopEnd();
    const loopDuration = hasCountInLoop && actualEnd > 0
      ? actualEnd - countInSec
      : (stage?.measureCount || 8) * secPerMeasure;
    
    // 現在の時間をループ内0..Tへ正規化
    // currentTime が負(カウントインガード通過後の -0.01～0 区間)の場合は 0 にクランプ。
    // 負の値を modulo すると loopDuration 付近にラップし、偽ループ境界検出の原因になる。
    const normalizedTime = currentTime < 0 ? 0 : ((currentTime % loopDuration) + loopDuration) % loopDuration;
    const lastNormToStore = currentTime < -0.01 ? -1 : normalizedTime;

    // ★ ループ境界検出: タイマー（updateEnemyGauge）に先行して、
    // 同一の setGameState 更新内でリセットを原子的に適用する。
    // これにより、ヒット処理とリセットのレースコンディションを根本排除する。
    let workingState = prevState;
    const lastNorm = lastNormalizedTimeRef.current;
    lastNormalizedTimeRef.current = lastNormToStore;
    if (lastNorm >= 0 && currentTime >= -0.01) {
      const loopTimeDiff = lastNorm - normalizedTime;
      const isSignificantJump = loopTimeDiff > loopDuration * 0.5;
      if (normalizedTime + 1e-6 < lastNorm && isSignificantJump) {
        // ループ境界通過: updateEnemyGaugeと同じリセットを適用
        const newLoopCycle = (prevState.taikoLoopCycle ?? 0) + 1;
        
        let transposedNotes = prevState.originalTaikoNotes.length > 0
          ? prevState.originalTaikoNotes
          : prevState.taikoNotes;
        let newTransposeOffset = prevState.currentTransposeOffset;
        
        if (prevState.transposeSettings && prevState.originalTaikoNotes.length > 0) {
          newTransposeOffset = calculateTransposeOffset(
            prevState.transposeSettings.keyOffset,
            newLoopCycle,
            prevState.transposeSettings.repeatKeyChange
          );
          const simpleMode = displayOpts?.simple ?? true;
          transposedNotes = transposeTaikoNotes(prevState.originalTaikoNotes, newTransposeOffset, simpleMode);
          bgmManager.setPitchShift(newTransposeOffset);
        }
        
        // アウフタクト: 2回目以降のループではカウントイン中のノーツを除外
        const loopNotes = transposedNotes.filter(n => !n.isAuftaktNote);

        // 先読みヒット済みノーツをIDで照合（アウフタクトフィルタによるインデックスずれを回避）
        const preHitIndices = prevState.preHitNoteIndices || [];
        const preHitIds = new Set(preHitIndices.map(i => prevState.taikoNotes[i]?.id).filter(Boolean));
        const resetNotes = loopNotes.map((tn) => ({
          ...tn,
          isHit: preHitIds.has(tn.id),
          isMissed: false
        }));
        const hitIdxs: number[] = [];
        resetNotes.forEach((n, i) => { if (n.isHit) hitIdxs.push(i); });
        const maxHitIdx = hitIdxs.length > 0 ? Math.max(...hitIdxs) : -1;
        const effIdx = maxHitIdx >= 0 ? Math.min(maxHitIdx + 1, resetNotes.length - 1) : 0;
        
        const targetNote = resetNotes[effIdx] || resetNotes[0];
        const nextTargetNote = resetNotes[(effIdx + 1) % resetNotes.length] || resetNotes[0];
        
        workingState = {
          ...prevState,
          taikoNotes: resetNotes,
          currentNoteIndex: effIdx,
          awaitingLoopStart: false,
          taikoLoopCycle: newLoopCycle,
          currentTransposeOffset: newTransposeOffset,
          preHitNoteIndices: [],
          activeMonsters: prevState.activeMonsters.map(m => ({
            ...m,
            correctNotes: [],
            gauge: 0,
            chordTarget: targetNote.chord,
            nextChord: nextTargetNote.chord
          }))
        };
      }
    }

    const currentIndex = workingState.currentNoteIndex;
    const noteMod12 = note % 12;
    
    // 候補インデックスを決定
    const candidateIndices: number[] = [];
    // ループ境界までの時間
    const timeToLoop = loopDuration - normalizedTime;
    // 先読み判定の範囲（表示と同じ4秒前から判定を受け付ける）
    const lookAheadJudgeTime = 4.0;
    const isNearLoopBoundary = timeToLoop < lookAheadJudgeTime;

    // 次ループで先読み表示される候補は hitTime の昇順で先頭連続区間になる。
    // 全ノーツ走査を避けるため、上限時刻までを先頭から走査して打ち切る。
    let maxPreviewIndex = -1;
    if (workingState.awaitingLoopStart || isNearLoopBoundary) {
      const previewUpperHitTime = lookAheadJudgeTime - timeToLoop;
      if (previewUpperHitTime >= 0) {
        for (let i = 0; i < workingState.taikoNotes.length; i++) {
          if (workingState.taikoNotes[i].hitTime > previewUpperHitTime + 1e-6) break;
          maxPreviewIndex = i;
        }
      }
    }

    if (workingState.awaitingLoopStart) {
      // 次ループ開始待ち中は、表示ロジック準拠で先読み候補のみ
      for (let i = 0; i <= maxPreviewIndex; i++) {
        candidateIndices.push(i);
      }
    } else {
      // 通常時は current と next を候補にする
      if (currentIndex < workingState.taikoNotes.length) candidateIndices.push(currentIndex);
      if (currentIndex + 1 < workingState.taikoNotes.length) candidateIndices.push(currentIndex + 1);

      // ループ境界付近では次ループ先読み候補を追加（表示ロジックと揃える）
      if (isNearLoopBoundary && maxPreviewIndex >= 0) {
        for (let i = 0; i <= maxPreviewIndex; i++) {
          // 次ループ先読みは「現在インデックスより前」だけを対象にして候補を絞る
          if (i < currentIndex && !candidateIndices.includes(i)) {
            candidateIndices.push(i);
          }
        }
      }
    }
    
    // 移調設定がある場合、次のループの移調後のノーツを事前計算
    let nextLoopTransposedNotes: TaikoNote[] | null = null;
    if (workingState.transposeSettings && workingState.originalTaikoNotes.length > 0) {
      const nextLoopCycle = (workingState.taikoLoopCycle ?? 0) + 1;
      const nextTransposeOffset = calculateTransposeOffset(
        workingState.transposeSettings.keyOffset,
        nextLoopCycle,
        workingState.transposeSettings.repeatKeyChange
      );
      nextLoopTransposedNotes = transposeTaikoNotes(workingState.originalTaikoNotes, nextTransposeOffset, true);
    }

    let chosen: {
      i: number;
      n: TaikoNote;
      j: ReturnType<typeof judgeTimingWindowWithLoop>;
      effectiveHitTime: number;
      isNextLoopNote: boolean;
      nextLoopChord: ChordDefinition | null;
    } | null = null;

    const nearTieMs = 10;
    for (const i of candidateIndices) {
      const n = workingState.taikoNotes[i];
      if (!n || n.isMissed) continue;

      // awaitingLoopStart状態または次ループ先読みノーツの場合は、仮想的なhitTimeを使用
      let effectiveHitTime = n.hitTime;
      const isPreviewNote = !workingState.awaitingLoopStart &&
        isNearLoopBoundary &&
        i < currentIndex &&
        i <= maxPreviewIndex;
      const isNextLoopNote = workingState.awaitingLoopStart || isPreviewNote;

      // isHitチェック: 次ループのノーツはスキップ
      // （ループリセット前は全ノーツが isHit=true だが、先読みヒットとして許可する）
      if (n.isHit && !isNextLoopNote) continue;

      if (isNextLoopNote) {
        effectiveHitTime = n.hitTime + loopDuration;
      }

      // 移調ループの場合、次のループのノーツは移調後のコードを使用
      let chordNotes = n.chord.notes;
      if (isNextLoopNote && nextLoopTransposedNotes && nextLoopTransposedNotes[i]) {
        chordNotes = nextLoopTransposedNotes[i].chord.notes;
      }

      // 毎入力で Set を作らず、直接 mod12 比較
      let includesNote = false;
      for (const chordNote of chordNotes) {
        if (((chordNote % 12) + 12) % 12 === noteMod12) {
          includesNote = true;
          break;
        }
      }
      if (!includesNote) continue;

      const j = judgeTimingWindowWithLoop(normalizedTime, effectiveHitTime, 150, loopDuration);
      if (!j.isHit) continue;

      const candidate = {
        i,
        n,
        j,
        effectiveHitTime,
        isNextLoopNote,
        nextLoopChord: isNextLoopNote && nextLoopTransposedNotes ? (nextLoopTransposedNotes[i]?.chord || null) : null
      };

      if (!chosen) {
        chosen = candidate;
        continue;
      }

      // 優先順位:
      // 1) |timingDiff| が明確に小さいものを優先
      // 2) 近接同点（入力ジッタ帯）では early 側（負方向）を優先
      // 3) それでも同点なら手前の時刻を優先
      const da = Math.abs(candidate.j.timingDiff);
      const db = Math.abs(chosen.j.timingDiff);
      let shouldReplace = false;

      if (Math.abs(da - db) > nearTieMs) {
        shouldReplace = da < db;
      } else {
        const aSign = Math.sign(candidate.j.timingDiff);
        const bSign = Math.sign(chosen.j.timingDiff);
        if (aSign !== bSign) {
          shouldReplace = aSign < bSign;
        } else if (candidate.effectiveHitTime !== chosen.effectiveHitTime) {
          shouldReplace = candidate.effectiveHitTime < chosen.effectiveHitTime;
        } else {
          shouldReplace = candidate.i < chosen.i;
        }
      }

      if (shouldReplace) {
        chosen = candidate;
      }
    }

    if (!chosen) {
      // ウィンドウ外 or 構成音外 — lastNormalizedTime のみ更新して返す
      return workingState;
    }

    const chosenNote = chosen.n;
    const chosenIndex = chosen.i;

    // 現在のモンスターの正解済み音を更新
    const currentMonster = workingState.activeMonsters[0];
    if (!currentMonster) return workingState;

    // 撃破済みモンスター: ノーツ判定は継続するがダメージは発生しない
    if (currentMonster.defeatedAt !== undefined) {
      const defChord = chosen.nextLoopChord || chosenNote.chord;
      const defTargetMod12: number[] = Array.from(new Set<number>(defChord.notes.map((n: number) => n % 12)));
      const defCorrectNotes = [...currentMonster.correctNotes, noteMod12].filter((v, i, a) => a.indexOf(v) === i);
      const defChordComplete = defTargetMod12.every((t: number) => defCorrectNotes.includes(t));
      if (defChordComplete) {
        const wasAwaitingLoop = workingState.awaitingLoopStart;
        const defNextIdx = chosenIndex + 1;
        const defIsLast = defNextIdx >= workingState.taikoNotes.length;
        const defSkip = !chosen.isNextLoopNote && !wasAwaitingLoop && chosenIndex > currentIndex;
        const defEffNext = defSkip ? currentIndex : defNextIdx;
        const defEffLast = defSkip ? false : defIsLast;
        const defIsPreHit = chosen.isNextLoopNote && !wasAwaitingLoop;
        const defPreHitIdxs = [...(workingState.preHitNoteIndices || [])];
        let defTaikoNotes;
        if (wasAwaitingLoop) {
          defTaikoNotes = workingState.taikoNotes.map((n, i) => ({
            ...n, isHit: i === chosenIndex, isMissed: false
          }));
          if (!defPreHitIdxs.includes(chosenIndex)) defPreHitIdxs.push(chosenIndex);
        } else if (defIsPreHit) {
          defTaikoNotes = workingState.taikoNotes.map((n, i) => (i === chosenIndex ? { ...n, isHit: true } : n));
          if (!defPreHitIdxs.includes(chosenIndex)) defPreHitIdxs.push(chosenIndex);
        } else {
          defTaikoNotes = workingState.taikoNotes.map((n, i) => (i === chosenIndex ? { ...n, isHit: true } : n));
        }
        return {
          ...workingState,
          taikoNotes: defTaikoNotes,
          currentNoteIndex: defEffLast ? workingState.currentNoteIndex : defEffNext,
          combo: workingState.combo + 1,
          awaitingLoopStart: defEffLast,
          preHitNoteIndices: (defIsPreHit || wasAwaitingLoop) ? defPreHitIdxs : workingState.preHitNoteIndices,
          activeMonsters: workingState.activeMonsters.map(m =>
            m.id === currentMonster.id ? { ...m, correctNotes: [] } : m
          ),
        };
      }
      return {
        ...workingState,
        activeMonsters: workingState.activeMonsters.map(m =>
          m.id === currentMonster.id ? { ...m, correctNotes: defCorrectNotes } : m
        ),
      };
    }

    // 移調ループの場合、次のループのノーツは移調後のコードを使用
    const effectiveChord = chosen.nextLoopChord || chosenNote.chord;
    const targetNotesMod12: number[] = Array.from(new Set<number>(effectiveChord.notes.map((n: number) => n % 12)));
    const newCorrectNotes = [...currentMonster.correctNotes, noteMod12].filter((v, i, a) => a.indexOf(v) === i);

    // コードが完成したかチェック（選ばれたノーツのコードに対して）
    const isChordComplete = targetNotesMod12.every((targetNote: number) => newCorrectNotes.includes(targetNote));

    if (isChordComplete) {
      // コード完成！
      // awaitingLoopStart状態からの復帰かどうか
      const wasAwaitingLoop = workingState.awaitingLoopStart;
      
      // 次のノーツインデックス（選ばれたノーツ基準）
      const nextIndexByChosen = chosenIndex + 1;
      const isLastNoteByChosen = nextIndexByChosen >= workingState.taikoNotes.length;

      // 後のノーツが選ばれた場合、先のノーツをスキップせず currentNoteIndex を維持
      // ミスタイマーが先のノーツを自然にミス判定する
      const didSkipEarlierNotes = !chosen.isNextLoopNote && !wasAwaitingLoop && chosenIndex > currentIndex;
      const effectiveNextIndex = didSkipEarlierNotes ? currentIndex : nextIndexByChosen;
      const isEffectivelyLast = didSkipEarlierNotes ? false : isLastNoteByChosen;

      // 次のノーツ情報を取得（ループ対応）
      let nextNote, nextNextNote;
      if (didSkipEarlierNotes) {
        nextNote = workingState.taikoNotes[currentIndex];
        let nnIdx = currentIndex + 1;
        while (nnIdx < workingState.taikoNotes.length && (nnIdx === chosenIndex || workingState.taikoNotes[nnIdx].isHit)) nnIdx++;
        nextNextNote = nnIdx < workingState.taikoNotes.length
          ? workingState.taikoNotes[nnIdx]
          : workingState.taikoNotes[0];
      } else if (!isLastNoteByChosen) {
        nextNote = workingState.taikoNotes[nextIndexByChosen];
        nextNextNote = (nextIndexByChosen + 1 < workingState.taikoNotes.length)
          ? workingState.taikoNotes[nextIndexByChosen + 1]
          : workingState.taikoNotes[0];
      } else {
        nextNote = workingState.taikoNotes[0];
        nextNextNote = workingState.taikoNotes.length > 1 ? workingState.taikoNotes[1] : workingState.taikoNotes[0];
      }

      // ダメージ計算
      const stageForDamage = workingState.currentStage!;
      const isSpecialAttack = workingState.playerSp >= 5;
      const baseDamage = Math.floor(Math.random() * (stageForDamage.maxDamage - stageForDamage.minDamage + 1)) + stageForDamage.minDamage;
      const actualDamage = isSpecialAttack ? baseDamage * 2 : baseDamage;

      // モンスターのHP更新
      const newHp = Math.max(0, currentMonster.currentHp - actualDamage);
      const isDefeated = newHp === 0;

      // コールバック呼び出し（handleChordCorrect内で遅延処理）
      // 移調ループの場合は移調後のコードを使用
      onChordCorrect(effectiveChord, isSpecialAttack, actualDamage, isDefeated, currentMonster.id);

      // SP更新
      const newSp = isSpecialAttack ? 0 : Math.min(workingState.playerSp + 1, 5);

      // 先読みヒット（ループ境界付近で次ループのノーツにヒット）の判定
      // 候補選択時に判定された isNextLoopNote を使用（awaitingLoopStart状態からの復帰は除く）
      const isPreHit = chosen.isNextLoopNote && !wasAwaitingLoop;
      // awaitingLoopStart状態からの復帰の場合、ノーツをリセットして次ループを開始
      let updatedTaikoNotes;
      const updatedPreHitIndices = [...(workingState.preHitNoteIndices || [])];
      
      if (wasAwaitingLoop) {
        // awaitingLoopStart状態からの先読みヒット
        // 全ノーツをリセットしてから、ヒットしたノーツにフラグを立てる
        updatedTaikoNotes = workingState.taikoNotes.map((n, i) => ({
          ...n,
          isHit: i === chosenIndex,
          isMissed: false
        }));
        // preHitNoteIndicesに記録（ループ境界で維持するため）
        if (!updatedPreHitIndices.includes(chosenIndex)) {
          updatedPreHitIndices.push(chosenIndex);
        }
      } else if (isPreHit) {
        // ループ境界付近での先読みヒット（awaitingLoopStartではない）
        // 現在のノーツにフラグを立てつつ、preHitNoteIndicesにも記録
        updatedTaikoNotes = workingState.taikoNotes.map((n, i) => (i === chosenIndex ? { ...n, isHit: true } : n));
        if (!updatedPreHitIndices.includes(chosenIndex)) {
          updatedPreHitIndices.push(chosenIndex);
        }
      } else {
        // 通常時は選ばれたノーツのみにフラグを立てる
        updatedTaikoNotes = workingState.taikoNotes.map((n, i) => (i === chosenIndex ? { ...n, isHit: true } : n));
      }

      // モンスター更新（次のターゲット/次次ターゲットは選ばれたノーツ基準）
      const updatedMonsters = workingState.activeMonsters.map(m => {
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

      // 敵を倒した場合、defeatedAtを設定してHPバーが0になる演出を見せる
      // モンスターの補充は200ms後にuseEffectで行う
      if (isDefeated) {
        const now = Date.now();
        // 撃破されたモンスターにdefeatedAtを設定（即座に削除せずHP0の状態を見せる）
        const monstersWithDefeat = updatedMonsters.map(m => {
          if (m.id === currentMonster.id) {
            return { ...m, currentHp: 0, defeatedAt: now };
          }
          return m;
        });

        // ゲームクリア判定
        const newEnemiesDefeated = workingState.enemiesDefeated + 1;
        if (newEnemiesDefeated >= workingState.totalEnemies) {
          const finalState = {
            ...workingState,
            activeMonsters: [], // クリア時は即座にクリア
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const,
            score: workingState.score + 100 * actualDamage,
            playerSp: newSp,
            enemiesDefeated: newEnemiesDefeated,
            correctAnswers: workingState.correctAnswers + 1,
            combo: workingState.combo + 1,
            currentNoteIndex: nextIndexByChosen,
            taikoNotes: updatedTaikoNotes,
            awaitingLoopStart: false,
            preHitNoteIndices: [],
          };
          onGameComplete('clear', finalState);
          return finalState;
        }

        // 撃破済みモンスターはそのままactiveMontersに残す（200ms後にuseEffectで補充）
        return {
          ...workingState,
          activeMonsters: monstersWithDefeat,
          playerSp: newSp,
          currentNoteIndex: isEffectivelyLast ? workingState.currentNoteIndex : effectiveNextIndex,
          taikoNotes: updatedTaikoNotes,
          correctAnswers: workingState.correctAnswers + 1,
          combo: workingState.combo + 1,
          score: workingState.score + 100 * actualDamage,
          enemiesDefeated: newEnemiesDefeated,
          awaitingLoopStart: isEffectivelyLast,
          preHitNoteIndices: updatedPreHitIndices,
        };
      }

      // 末尾ノーツをヒットした場合は次ループ開始待ち
      if (isEffectivelyLast) {
        return {
          ...workingState,
          activeMonsters: updatedMonsters,
          playerSp: newSp,
          taikoNotes: updatedTaikoNotes,
          correctAnswers: workingState.correctAnswers + 1,
          combo: workingState.combo + 1,
          score: workingState.score + 100 * actualDamage,
          awaitingLoopStart: true,
          preHitNoteIndices: updatedPreHitIndices,
        };
      }

      return {
        ...workingState,
        activeMonsters: updatedMonsters,
        playerSp: newSp,
        currentNoteIndex: effectiveNextIndex,
        taikoNotes: updatedTaikoNotes,
        correctAnswers: workingState.correctAnswers + 1,
        combo: workingState.combo + 1,
        score: workingState.score + 100 * actualDamage,
        awaitingLoopStart: false,
        preHitNoteIndices: (isPreHit || wasAwaitingLoop) ? updatedPreHitIndices : workingState.preHitNoteIndices,
      };
    } else {
      // コード未完成（選ばれたノーツのコードに対する部分正解）
      const updatedMonsters = workingState.activeMonsters.map(m => {
        if (m.id === currentMonster.id) {
          return {
            ...m,
            correctNotes: newCorrectNotes
          };
        }
        return m;
      });

      return {
        ...workingState,
        activeMonsters: updatedMonsters,
      };
    }
  }, [onChordCorrect, onGameComplete, displayOpts, stageMonsterIds]);
  
  // ゲーム初期化
  const initializeGame = useCallback(async (stage: FantasyStage, playMode: FantasyPlayMode = 'challenge') => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 旧 BGM を確実に殺す
    bgmManager.stop();

    // 新しいステージ定義から値を取得
    const totalEnemies = playMode === 'practice' ? Number.POSITIVE_INFINITY : stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = playMode === 'practice' ? Number.POSITIVE_INFINITY : totalEnemies * enemyHp;
    const simultaneousCount = (stage.mode.startsWith('progression') || stage.mode === 'timing_combining') ? 1 : (stage.simultaneousMonsterCount || 1);

    // single_orderモード用: インデックスを初期化
    if (stage.mode === 'single_order') {
      singleOrderIndexRef.current = 0;
    }

    // ステージで使用するモンスターIDを決定（シャッフルして必要数だけ取得）
    const monsterIds = (() => {
      if (playMode === 'practice') {
        // 無限湧きのため、固定長のバッチだけ確保（以降はフォールバックのランダムでもOK）
        return getStageMonsterIds(PRACTICE_QUEUE_BATCH_SIZE);
      }
      return getStageMonsterIds(stage.enemyCount);
    })();
    setStageMonsterIds(monsterIds);

    // 🚀 画像プリロード（優先分をawait、残りはバックグラウンド）
    const textureMap = imageTexturesRef.current;
    const IMAGE_PRELOAD_TIMEOUT = 4000;
    
    try {
      if (stage.isSheetMusicMode && stage.allowedChords && stage.allowedChords.length > 0) {
        const noteNames = stage.allowedChords.map(chord => 
          typeof chord === 'string' ? chord : (chord as any).chord || chord
        ).filter(Boolean);
        await Promise.race([
          preloadSheetMusicImages(noteNames, textureMap),
          new Promise<void>(resolve => setTimeout(resolve, IMAGE_PRELOAD_TIMEOUT))
        ]);
        devLog.debug('✅ 楽譜画像プリロード完了:', { count: noteNames.length, playMode });
      } else {
        const priorityCount = Math.min(6, monsterIds.length);
        const priorityIds = monsterIds.slice(0, priorityCount);
        await Promise.race([
          preloadMonsterImages(priorityIds, textureMap),
          new Promise<void>(resolve => setTimeout(resolve, IMAGE_PRELOAD_TIMEOUT))
        ]);
        devLog.debug('✅ 優先モンスター画像プリロード完了:', { count: priorityIds.length });
        
        if (monsterIds.length > priorityCount) {
          preloadMonsterImages(monsterIds.slice(priorityCount), textureMap).catch(() => {});
        }
      }
    } catch (error) {
      devLog.debug('⚠️ 画像プリロード失敗（続行）:', error);
    }

    // ▼▼▼ 袋形式ランダムセレクターの初期化 ▼▼▼
    // single/progression_random モードで使用する袋形式セレクターを作成
    // single_order モードでは順序選択を使うためスキップ
    if (stage.mode === 'single_order') {
      bagSelectorRef.current = null;
    } else {
      const allowedChordsForBag = (stage.allowedChords && stage.allowedChords.length > 0) 
        ? stage.allowedChords 
        : (stage.chordProgression || []);
      
      if (allowedChordsForBag.length > 0) {
        const specToId = (s: ChordSpec) => (typeof s === 'string' ? s : s.chord);
        bagSelectorRef.current = new BagRandomSelector(allowedChordsForBag, specToId);
        devLog.debug('🎲 袋形式ランダムセレクター初期化:', { 
          chordCount: allowedChordsForBag.length,
          mode: stage.mode 
        });
      } else {
        bagSelectorRef.current = null;
      }
    }

    // ▼▼▼ モンスターキューをシャッフルする ▼▼▼
    // モンスターキューを作成（0からtotalEnemies-1までのインデックス）
    const monsterQueue = playMode === 'practice'
      ? createPracticeQueueBatch(PRACTICE_QUEUE_BATCH_SIZE)
      : (() => {
          const monsterIndices = Array.from({ length: stage.enemyCount }, (_, i) => i);
          for (let i = monsterIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [monsterIndices[i], monsterIndices[j]] = [monsterIndices[j], monsterIndices[i]];
          }
          return monsterIndices;
        })();
    
    // 初期モンスターを配置
    const initialMonsterCount = Math.min(simultaneousCount, totalEnemies);
    const positions = assignPositions(initialMonsterCount);
    const activeMonsters: MonsterState[] = [];
    const usedChordIds: string[] = [];
    
    // ▼▼▼ 修正点2: コードの重複を避けるロジックを追加 ▼▼▼
    let lastChordId: string | undefined = undefined; // 直前のコードIDを記録する変数を追加

    // 楽譜モード設定を準備
    const sheetMusicOpt = stage.isSheetMusicMode 
      ? { enabled: true, clef: stage.sheetMusicClef || 'treble' as const }
      : undefined;

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
          monsterIds,
          sheetMusicOpt,
          bagSelectorRef.current
        );
        // single_orderモード: 順序通りのコードで上書き
        if (stage.mode === 'single_order') {
          const allowedForOrder = (stage.allowedChords && stage.allowedChords.length > 0) ? stage.allowedChords : [];
          const orderedChord = selectOrderedChord(allowedForOrder, singleOrderIndexRef, displayOpts);
          if (orderedChord) {
            monster.chordTarget = orderedChord;
          }
        }
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
      stage.mode === 'progression_timing' ||
      stage.mode === 'timing_combining';
    let taikoNotes: TaikoNote[] = [];
    let combinedSections: CombinedSection[] = [];
    
    if (isTaikoMode) {
      // 太鼓の達人モードのノーツ生成
      switch (stage.mode) {
        case 'timing_combining': {
          // timing_combining: 子ステージのノーツを順次ロード済み（combinedStages経由）
          // リピート回数に応じてセクションを展開（2回目以降はカウントイン除外）
          if (stage.combinedStages && stage.combinedStages.length > 0) {
            let globalNoteIndex = 0;
            const repeats = stage.combinedSectionRepeats;
            const measureLimits = stage.combinedSectionMeasureLimits;
            const sectionListenBarsAll = stage.combinedSectionListenBars;
            const sectionPlayBarsAll = stage.combinedSectionPlayBars;
            const sectionCrModes = stage.combinedSectionCrModes;
            
            for (let stageIdx = 0; stageIdx < stage.combinedStages.length; stageIdx++) {
              const childStage = stage.combinedStages[stageIdx];
              const repeatCount = (repeats && repeats[stageIdx] >= 1) ? repeats[stageIdx] : 1;
              const childBpm = childStage.bpm || 120;
              const childTimeSig = childStage.timeSignature || 4;
              const originalMeasureCount = childStage.measureCount || 8;
              const childCountIn = childStage.countInMeasures || 0;
              const secPerBeat = 60 / childBpm;
              const secPerMeasure = secPerBeat * childTimeSig;
              
              const measureLimit = (measureLimits && measureLimits[stageIdx] != null && measureLimits[stageIdx]! > 0)
                ? Math.min(measureLimits[stageIdx]!, originalMeasureCount)
                : null;
              const effectiveMeasureCount = measureLimit ?? originalMeasureCount;

              // C&R設定（セクション別）
              const sectionListenBars = sectionListenBarsAll?.[stageIdx] ?? null;
              const sectionPlayBars = sectionPlayBarsAll?.[stageIdx] ?? null;
              const sectionCrMode = sectionCrModes?.[stageIdx] ?? 'off';
              
              let progressionData: ChordProgressionDataItem[] | null = null;
              if (childStage.musicXml) {
                progressionData = convertMusicXmlToProgressionData(
                  childStage.musicXml,
                  { groupSimultaneousNotes: true }
                );
              } else if (childStage.chordProgressionData) {
                if (typeof childStage.chordProgressionData === 'string') {
                  progressionData = parseSimpleProgressionText(childStage.chordProgressionData);
                } else {
                  progressionData = childStage.chordProgressionData as ChordProgressionDataItem[];
                }
              }
              
              for (let rep = 0; rep < repeatCount; rep++) {
                const isFirstPlay = rep === 0;
                const isAuftakt = isFirstPlay && !!childStage.isAuftakt;
                // 交互モード: リスニングイテレーション（奇数回=rep偶数）ではカウントインスキップ
                const isAlternatingListen = sectionCrMode === 'alternating' && rep % 2 === 0;
                const countIn = (isFirstPlay && !isAlternatingListen) ? childCountIn : 0;
                const sectionDuration = (countIn + effectiveMeasureCount) * secPerMeasure;
                
                let filteredProgression = progressionData;
                if (measureLimit != null && filteredProgression) {
                  const maxBar = (isAuftakt ? childCountIn : 0) + measureLimit;
                  filteredProgression = filteredProgression.filter(item => item.bar <= maxBar);
                }

                // C&R手動モード: リスニング小節のノーツを除外
                if (sectionCrMode === 'manual' && sectionListenBars && filteredProgression) {
                  const [lStart, lEnd] = sectionListenBars;
                  filteredProgression = filteredProgression.filter(item => item.bar < lStart || item.bar > lEnd);
                }
                // C&R交互モード: リスニングイテレーションでは全ノーツを除外
                if (isAlternatingListen && filteredProgression) {
                  filteredProgression = [];
                }
                
                let sectionMusicXml = childStage.musicXml;
                if (measureLimit != null && sectionMusicXml) {
                  const maxBar = (isAuftakt ? childCountIn : 0) + measureLimit;
                  sectionMusicXml = truncateMusicXmlByMeasure(sectionMusicXml, maxBar);
                }
                
                let sectionNotes: TaikoNote[] = [];
                if (filteredProgression) {
                  sectionNotes = parseChordProgressionData(
                    filteredProgression,
                    childBpm,
                    childTimeSig,
                    (spec) => getChordDefinition(spec, displayOpts),
                    countIn,
                    isAuftakt
                  );
                }
                
                const section: CombinedSection = {
                  stageId: childStage.id,
                  stageName: childStage.name,
                  bpm: childBpm,
                  timeSignature: childTimeSig,
                  measureCount: effectiveMeasureCount,
                  countInMeasures: countIn,
                  audioCountInMeasures: childCountIn,
                  bgmUrl: childStage.bgmUrl,
                  musicXml: sectionMusicXml,
                  notes: sectionNotes,
                  globalTimeOffset: 0,
                  globalNoteStartIndex: globalNoteIndex,
                  globalNoteEndIndex: globalNoteIndex + sectionNotes.length,
                  sectionDuration,
                  isAuftakt,
                  listenBars: sectionCrMode === 'manual' ? (sectionListenBars ?? undefined) : undefined,
                  playBars: sectionCrMode === 'manual' ? (sectionPlayBars ?? undefined) : undefined,
                  callResponseMode: sectionCrMode !== 'off' ? (sectionCrMode as 'manual' | 'alternating') : undefined,
                  repeatIndex: rep,
                  sectionRepeatCount: repeatCount,
                };
                combinedSections.push(section);
                
                for (const note of sectionNotes) {
                  taikoNotes.push({
                    ...note,
                    id: `s${combinedSections.length - 1}_${note.id}`,
                  });
                }
                globalNoteIndex += sectionNotes.length;
              }
            }
            
            devLog.debug('🔗 timing_combining セクション構築完了:', {
              sectionCount: combinedSections.length,
              totalNotes: taikoNotes.length,
              sections: combinedSections.map(s => ({
                name: s.stageName,
                bpm: s.bpm,
                noteCount: s.notes.length,
                duration: s.sectionDuration.toFixed(2),
                countIn: s.countInMeasures,
              })),
            });
          }
          break;
        }

        case 'progression_timing': {
          let progressionData: ChordProgressionDataItem[] | null = null;

          // musicXml がある場合は常にランタイムで再パースする
          // （タイ処理など変換ロジックの修正を既存DBデータにも即座に反映するため）
          if (stage.musicXml) {
            progressionData = convertMusicXmlToProgressionData(
              stage.musicXml,
              { groupSimultaneousNotes: true }
            );
          } else if (stage.chordProgressionData) {
            if (typeof stage.chordProgressionData === 'string') {
              progressionData = parseSimpleProgressionText(stage.chordProgressionData);
            } else {
              progressionData = stage.chordProgressionData as ChordProgressionDataItem[];
            }
          }

          if (progressionData) {
            // C&R手動モード: リスニング小節のノーツを除外（交互モードでは全ノーツ保持）
            if (stage.callResponseEnabled && stage.callResponseMode !== 'alternating' && stage.callResponseListenBars) {
              const [lStart, lEnd] = stage.callResponseListenBars;
              progressionData = progressionData.filter(item => item.bar < lStart || item.bar > lEnd);
            }
            taikoNotes = parseChordProgressionData(
              progressionData,
              stage.bpm || 120,
              stage.timeSignature || 4,
              (spec) => getChordDefinition(spec, displayOpts),
              stage.countInMeasures || 0,
              !!stage.isAuftakt
            );
          }
          break;
        }

        case 'progression_random':
          // ランダムプログレッション：各小節ごとにランダムでコードを決定
          taikoNotes = generateRandomProgressionNotes(
            (stage.allowedChords && stage.allowedChords.length > 0) ? stage.allowedChords : (stage.chordProgression || []),
            stage.measureCount || 8,
            stage.bpm || 120,
            stage.timeSignature || 4,
            (spec) => getChordDefinition(spec, displayOpts),
            stage.countInMeasures || 0,
            ((stage as any).noteIntervalBeats || (stage as any).note_interval_beats || stage.timeSignature || 4),
            !!stage.isAuftakt
          );
          break;

        case 'progression_order':
        default:
          // 基本版：小節の頭でコード出題（Measure 1 から）
          // chordProgression が設定されていればそれを使用、なければ allowedChords を使用
          {
            const chordsForOrder = stage.chordProgression && stage.chordProgression.length > 0
              ? stage.chordProgression
              : (stage.allowedChords && stage.allowedChords.length > 0 ? stage.allowedChords : []);
            
            if (chordsForOrder.length > 0) {
              taikoNotes = generateBasicProgressionNotes(
                chordsForOrder as ChordSpec[],
                stage.measureCount || 8,
                stage.bpm || 120,
                stage.timeSignature || 4,
                (spec) => getChordDefinition(spec, displayOpts),
                stage.countInMeasures || 0,
                (stage as any).noteIntervalBeats || (stage as any).note_interval_beats || (stage.timeSignature || 4),
                !!stage.isAuftakt
              );
            }
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
      
      // デバッグログ: ノーツの時間情報を詳細に出力
      const secPerBeat = 60 / (stage.bpm || 120);
      const secPerMeasure = secPerBeat * (stage.timeSignature || 4);
      devLog.debug('🥁 太鼓の達人モード初期化:', {
        noteCount: taikoNotes.length,
        stageConfig: {
          bpm: stage.bpm,
          timeSignature: stage.timeSignature,
          measureCount: stage.measureCount,
          countInMeasures: stage.countInMeasures,
          secPerBeat,
          secPerMeasure
        },
        firstNote: taikoNotes[0] ? {
          id: taikoNotes[0].id,
          measure: taikoNotes[0].measure,
          beat: taikoNotes[0].beat,
          hitTime: taikoNotes[0].hitTime,
          chord: taikoNotes[0].chord.displayName
        } : null,
        lastNote: taikoNotes.length > 0 ? {
          id: taikoNotes[taikoNotes.length - 1].id,
          measure: taikoNotes[taikoNotes.length - 1].measure,
          hitTime: taikoNotes[taikoNotes.length - 1].hitTime
        } : null,
        // 時間同期の説明
        timingNote: `M1 Beat1 = hitTime 0秒, カウントイン${stage.countInMeasures || 0}小節 = BGM開始からM1までの時間${(stage.countInMeasures || 0) * secPerMeasure}秒`
      });
    }

    // 移調設定の初期化
    // - 練習モード: stage.transposeSettings を使用（プレイヤー設定）
    // - 本番モード: stage.productionRepeatTranspositionMode と stage.productionStartKey を使用（ステージ設定）
    let transposeSettings: TransposeSettings | null = null;
    if (stage.mode === 'progression_timing' || stage.mode === 'timing_combining') {
      if (playMode === 'practice' && stage.transposeSettings) {
        // 練習モード: プレイヤーの設定を使用
        transposeSettings = stage.transposeSettings;
      } else if (playMode === 'challenge') {
        // 本番モード: ステージの本番用設定を使用
        const productionMode = stage.productionRepeatTranspositionMode || 'off';
        const productionStartKey = stage.productionStartKey ?? 0;
        // 本番モードでも転調設定がある場合のみ適用
        if (productionMode !== 'off' || productionStartKey !== 0) {
          transposeSettings = {
            keyOffset: productionStartKey,
            repeatKeyChange: productionMode as RepeatKeyChange
          };
        }
      }
    }
    
    // 元のノーツを保存（リピート時の移調に使用）
    const originalTaikoNotes = [...taikoNotes];
    
    // 初期移調を適用
    // 簡易設定フラグ：displayOpts.simpleがtrueならダブルシャープや白鍵の異名同音を変換
    const simpleMode = displayOpts?.simple ?? true;
    let currentTransposeOffset = 0;
    if (transposeSettings && isTaikoMode && taikoNotes.length > 0) {
      currentTransposeOffset = transposeSettings.keyOffset;
      if (currentTransposeOffset !== 0) {
        taikoNotes = transposeTaikoNotes(taikoNotes, currentTransposeOffset, simpleMode);
        // モンスターのコードも更新
        if (activeMonsters.length > 0) {
          activeMonsters[0].chordTarget = taikoNotes[0].chord;
          activeMonsters[0].nextChord = taikoNotes.length > 1 ? taikoNotes[1].chord : taikoNotes[0].chord;
        }
        devLog.debug('🎹 初期移調適用:', {
          offset: currentTransposeOffset,
          key: getKeyFromOffset('C', currentTransposeOffset),
          simpleMode
        });
      }
    }

    const newState: FantasyGameState = {
      currentStage: stage,
      playMode,
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
      lastNormalizedTime: -1,
      awaitingLoopStart: false,
      // 移調練習用
      transposeSettings,
      currentTransposeOffset,
      originalTaikoNotes,
      preHitNoteIndices: [],
      // timing_combining 用
      isCombiningMode: stage.mode === 'timing_combining',
      combinedSections,
      currentSectionIndex: 0,
      combinedFullLoopCount: 0,
      combo: 0,
    };

    combiningSync.sectionIndex = 0;
    combiningSync.noteStartIndex = combinedSections[0]?.globalNoteStartIndex ?? 0;
    combiningSync.noteEndIndex = combinedSections[0]?.globalNoteEndIndex ?? 0;
    combiningSync.active = stage.mode === 'timing_combining';
    lastNormalizedTimeRef.current = -1;

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
            // ランダムモード：袋形式で前回と異なるコードを選択
            nextChord = selectRandomChordWithBag(
              bagSelectorRef.current,
              (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : (prevState.currentStage.chordProgression || []),
              monster.chordTarget?.id,
              displayOpts
            );
          } else if (prevState.currentStage?.mode === 'single_order') {
            // 順序モード：allowed_chordsを順番に巡回
            const allowedForOrder = (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : [];
            nextChord = selectOrderedChord(allowedForOrder, singleOrderIndexRef, displayOpts);
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
    if (gameState.playMode === 'practice') {
      return;
    }
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
      if (prevState.playMode === 'practice') {
        return prevState;
      }
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
      
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const,
          isCompleting: true,
          combo: 0,
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
            // Single/Single_orderモードでは問題を切り替えない（コード・正解済み音を保持）
            if (prevState.currentStage?.mode === 'single' || prevState.currentStage?.mode === 'single_order') {
              // アクティブなモンスターのゲージのみリセット（コードと正解済み音は保持）
              const updatedMonsters = prevState.activeMonsters.map(monster => ({
                ...monster,
                gauge: 0
              }));
              
              const nextState = {
                ...prevState,
                playerHp: newHp,
                playerSp: 0,
                enemyGauge: 0,
                activeMonsters: updatedMonsters,
                combo: 0,
              };
              
              onGameStateChange(nextState);
              return nextState;
            }
            
            // 次の問題（ループ対応）- progressionモードのみ
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            const nextChord = getProgressionChord(progression, nextIndex, displayOpts);
            
            // アクティブなモンスターの情報も更新（ガイド表示に使用されるため重要）
            const updatedMonsters = prevState.activeMonsters.map(monster => ({
              ...monster,
              chordTarget: nextChord!,
              correctNotes: [],
              gauge: 0
            }));
            
            const nextState = {
              ...prevState,
              playerHp: newHp,
              playerSp: 0,
              currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
              currentChordTarget: nextChord,
              enemyGauge: 0,
              correctNotes: [],
              activeMonsters: updatedMonsters,
              combo: 0,
            };
            
            onGameStateChange(nextState);
            return nextState;
          }
        }
    });
    
    onEnemyAttack(attackingMonsterId);
  }, [gameState.playMode, onGameStateChange, onGameComplete, onEnemyAttack]);
  
  // ゲージタイマーの管理
  useEffect(() => {
    // 既存のタイマーをクリア
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    // ゲームがアクティブな場合のみ新しいタイマーを開始
    // Ready中は開始しない
    // 本番モード or 練習+太鼓モード でタイマー開始
    const needsTimer = gameState.isGameActive && gameState.currentStage && !isReady &&
      (gameState.playMode !== 'practice' || gameState.isTaikoMode);
    if (needsTimer) {
      const timer = setInterval(() => {
        updateEnemyGauge();
      }, 50); // 50ms間隔で更新（セクション切り替え検出の高速化）
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
    /* Ready 中は停止 */
    if (isReady) return;
    // 練習モードでも太鼓モードなら動かす必要がある
    if (gameState.playMode === 'practice' && !gameState.isTaikoMode) {
      return;
    }
    
    setGameState(prevState => {
      // 練習モードでも太鼓モードなら動かす必要がある
      if (prevState.playMode === 'practice' && !prevState.isTaikoMode) {
        return prevState;
      }
      if (!prevState.isGameActive || !prevState.currentStage) {
        return prevState;
      }
      
      // 太鼓の達人モードの場合は専用のミス判定を行う（single以外）
      if (prevState.isTaikoMode && prevState.taikoNotes.length > 0) {
        const currentTime = bgmManager.getCurrentMusicTime();
        const stage = prevState.currentStage;
        
        // ===== timing_combining: セクション境界検出 =====
        if (prevState.isCombiningMode && prevState.combinedSections.length > 0) {
          const sectionIdx = prevState.currentSectionIndex;
          const section = prevState.combinedSections[sectionIdx];
          if (!section) return prevState;
          
          // カウントイン中は何もしない
          if (currentTime < -0.01) {
            lastNormalizedTimeRef.current = currentTime;
            return prevState;
          }
          
          // 遷移直後ガード: BGMが切り替わった直後は旧BGMの時間で二重遷移しないようスキップ
          if (lastNormalizedTimeRef.current === -1) {
            lastNormalizedTimeRef.current = currentTime;
            return prevState;
          }
          
          const secPerMeasure = (60 / section.bpm) * section.timeSignature;
          const sectionPlayDuration = section.measureCount * secPerMeasure;
          
          // セクション末尾検出: musicTime がセクションの演奏時間を超えた
          if (currentTime >= sectionPlayDuration - 0.05) {
            const nextSectionIdx = sectionIdx + 1;
            
            if (nextSectionIdx < prevState.combinedSections.length) {
              // 次のセクションへ遷移 — BGM即時切り替え
              const nextSection = prevState.combinedSections[nextSectionIdx];
              
              // 次セクション分のノーツを切り出し
              const nextNotes = prevState.taikoNotes.slice(
                nextSection.globalNoteStartIndex,
                nextSection.globalNoteEndIndex
              );
              const firstNextNote = nextNotes[0];
              const secondNextNote = nextNotes.length > 1 ? nextNotes[1] : firstNextNote;
              
              // BGM即時切り替え
              const nextBgmUrl = nextSection.bgmUrl;
              if (nextBgmUrl) {
                const sectionPitchShift = prevState.transposeSettings
                  ? calculateTransposeOffset(
                      prevState.transposeSettings.keyOffset,
                      prevState.combinedFullLoopCount,
                      prevState.transposeSettings.repeatKeyChange
                    )
                  : prevState.currentTransposeOffset;
                const skipCI = nextSection.countInMeasures !== nextSection.audioCountInMeasures;
                
                // 事前準備チェーンを優先使用（ゼロラグ切り替え）
                if (!bgmManager.switchToPreparedSection()) {
                  const sameUrl = nextBgmUrl === bgmManager.getCurrentUrl();
                  if (!(sameUrl && bgmManager.restartSameSection(
                    nextSection.bpm, nextSection.timeSignature,
                    nextSection.measureCount, nextSection.audioCountInMeasures, skipCI
                  ))) {
                    bgmManager.play(
                      nextBgmUrl, nextSection.bpm, nextSection.timeSignature,
                      nextSection.measureCount, nextSection.audioCountInMeasures,
                      0.7, stage.speedMultiplier || 1.0, sectionPitchShift, true, skipCI
                    );
                  }
                }
              }
              
              // 次の次のセクション用チェーンを事前構築（ゼロラグ切り替え準備）
              const preloadIdx = nextSectionIdx + 1;
              if (preloadIdx < prevState.combinedSections.length) {
                const preloadSection = prevState.combinedSections[preloadIdx];
                if (preloadSection.bgmUrl) {
                  const preloadPitchShift = prevState.transposeSettings
                    ? calculateTransposeOffset(
                        prevState.transposeSettings.keyOffset,
                        prevState.combinedFullLoopCount,
                        prevState.transposeSettings.repeatKeyChange
                      )
                    : prevState.currentTransposeOffset;
                  const preloadSkipCI = preloadSection.countInMeasures !== preloadSection.audioCountInMeasures;
                  bgmManager.prepareNextSection(
                    preloadSection.bgmUrl, preloadSection.bpm, preloadSection.timeSignature,
                    preloadSection.measureCount, preloadSection.audioCountInMeasures,
                    0.7, stage.speedMultiplier || 1.0, preloadPitchShift, true, preloadSkipCI
                  );
                }
              } else {
                // 最後のセクションに遷移 → ループ用に最初のセクションのBGMを事前準備
                const loopSection = prevState.combinedSections[0];
                if (loopSection?.bgmUrl) {
                  const loopPitchShift = prevState.transposeSettings
                    ? calculateTransposeOffset(
                        prevState.transposeSettings.keyOffset,
                        prevState.combinedFullLoopCount + 1,
                        prevState.transposeSettings.repeatKeyChange
                      )
                    : prevState.currentTransposeOffset;
                  const loopSkipCI = loopSection.countInMeasures !== loopSection.audioCountInMeasures;
                  bgmManager.prepareNextSection(
                    loopSection.bgmUrl, loopSection.bpm, loopSection.timeSignature,
                    loopSection.measureCount, loopSection.audioCountInMeasures,
                    0.7, stage.speedMultiplier || 1.0, loopPitchShift, true, loopSkipCI
                  );
                }
              }
              
              combiningSync.sectionIndex = nextSectionIdx;
              combiningSync.noteStartIndex = nextSection.globalNoteStartIndex;
              combiningSync.noteEndIndex = nextSection.globalNoteEndIndex;
              
              devLog.debug('🔗 セクション遷移:', {
                from: sectionIdx,
                to: nextSectionIdx,
                name: nextSection.stageName,
              });
              
              lastNormalizedTimeRef.current = -1;
              return {
                ...prevState,
                currentSectionIndex: nextSectionIdx,
                currentNoteIndex: nextSection.globalNoteStartIndex,
                awaitingLoopStart: false,
                activeMonsters: prevState.activeMonsters.map(m => ({
                  ...m,
                  correctNotes: [],
                  chordTarget: firstNextNote?.chord ?? m.chordTarget,
                  nextChord: secondNextNote?.chord ?? m.nextChord,
                })),
              };
            } else {
              // 全セクション完了 = 1ループ完了
              const newFullLoopCount = prevState.combinedFullLoopCount + 1;
              
              // 移調設定がある場合、全ループ完了後に移調を適用してリスタート
              if (prevState.transposeSettings) {
                const newTransposeOffset = calculateTransposeOffset(
                  prevState.transposeSettings.keyOffset,
                  newFullLoopCount,
                  prevState.transposeSettings.repeatKeyChange
                );
                const simpleMode = displayOpts?.simple ?? true;
                
                // 全ノーツを移調
                let transposedNotes = prevState.originalTaikoNotes.length > 0
                  ? prevState.originalTaikoNotes
                  : prevState.taikoNotes;
                if (newTransposeOffset !== 0) {
                  transposedNotes = transposeTaikoNotes(transposedNotes, newTransposeOffset, simpleMode);
                } else {
                  transposedNotes = transposeTaikoNotes(transposedNotes, 0, simpleMode);
                }
                
                // BGM即時切り替え（移調リスタート）— 事前準備チェーンを優先使用
                const firstSection = prevState.combinedSections[0];
                if (firstSection.bgmUrl) {
                  const firstSkipCI = firstSection.countInMeasures !== firstSection.audioCountInMeasures;
                  const sameUrl = firstSection.bgmUrl === bgmManager.getCurrentUrl();
                  if (!bgmManager.switchToPreparedSection()) {
                    if (!(sameUrl && bgmManager.restartSameSection(
                      firstSection.bpm, firstSection.timeSignature,
                      firstSection.measureCount, firstSection.audioCountInMeasures, firstSkipCI
                    ))) {
                      bgmManager.play(
                        firstSection.bgmUrl, firstSection.bpm, firstSection.timeSignature,
                        firstSection.measureCount, firstSection.audioCountInMeasures,
                        0.7, stage.speedMultiplier || 1.0, newTransposeOffset, true, firstSkipCI
                      );
                    }
                  }
                }
                // リスタート後、次セクション用チェーンを事前構築
                if (prevState.combinedSections.length > 1) {
                  const ns = prevState.combinedSections[1];
                  if (ns.bgmUrl) {
                    const nsSkipCI = ns.countInMeasures !== ns.audioCountInMeasures;
                    bgmManager.prepareNextSection(
                      ns.bgmUrl, ns.bpm, ns.timeSignature,
                      ns.measureCount, ns.audioCountInMeasures,
                      0.7, stage.speedMultiplier || 1.0, newTransposeOffset, true, nsSkipCI
                    );
                  }
                }
                
                const resetNotes = transposedNotes.map(note => ({
                  ...note,
                  isHit: false,
                  isMissed: false,
                }));
                const firstNote = resetNotes[0];
                const secondNote = resetNotes.length > 1 ? resetNotes[1] : firstNote;
                
                combiningSync.sectionIndex = 0;
                combiningSync.noteStartIndex = prevState.combinedSections[0]?.globalNoteStartIndex ?? 0;
                combiningSync.noteEndIndex = prevState.combinedSections[0]?.globalNoteEndIndex ?? 0;
                
                devLog.debug('🔗🎹 全セクション完了 - 移調リスタート:', {
                  loopCount: newFullLoopCount,
                  transposeOffset: newTransposeOffset,
                });
                
                lastNormalizedTimeRef.current = -1;
                return {
                  ...prevState,
                  taikoNotes: resetNotes,
                  currentSectionIndex: 0,
                  currentNoteIndex: 0,
                  combinedFullLoopCount: newFullLoopCount,
                  taikoLoopCycle: newFullLoopCount,
                  awaitingLoopStart: false,
                  currentTransposeOffset: newTransposeOffset,
                  activeMonsters: prevState.activeMonsters.map(m => ({
                    ...m,
                    correctNotes: [],
                    chordTarget: firstNote?.chord ?? m.chordTarget,
                    nextChord: secondNote?.chord ?? m.nextChord,
                  })),
                };
              }
              
              // 移調設定なし: BGM即時切り替え — 事前準備チェーンを優先使用
              const firstSection = prevState.combinedSections[0];
              if (firstSection.bgmUrl) {
                const firstSkipCI = firstSection.countInMeasures !== firstSection.audioCountInMeasures;
                const sameUrl = firstSection.bgmUrl === bgmManager.getCurrentUrl();
                if (!bgmManager.switchToPreparedSection()) {
                  if (!(sameUrl && bgmManager.restartSameSection(
                    firstSection.bpm, firstSection.timeSignature,
                    firstSection.measureCount, firstSection.audioCountInMeasures, firstSkipCI
                  ))) {
                    bgmManager.play(
                      firstSection.bgmUrl, firstSection.bpm, firstSection.timeSignature,
                      firstSection.measureCount, firstSection.audioCountInMeasures,
                      0.7, stage.speedMultiplier || 1.0, prevState.currentTransposeOffset, true, firstSkipCI
                    );
                  }
                }
              }
              // リスタート後、次セクション用チェーンを事前構築
              if (prevState.combinedSections.length > 1) {
                const ns = prevState.combinedSections[1];
                if (ns.bgmUrl) {
                  const nsSkipCI = ns.countInMeasures !== ns.audioCountInMeasures;
                  bgmManager.prepareNextSection(
                    ns.bgmUrl, ns.bpm, ns.timeSignature,
                    ns.measureCount, ns.audioCountInMeasures,
                    0.7, stage.speedMultiplier || 1.0, prevState.currentTransposeOffset, true, nsSkipCI
                  );
                }
              }
              
              combiningSync.sectionIndex = 0;
              combiningSync.noteStartIndex = prevState.combinedSections[0]?.globalNoteStartIndex ?? 0;
              combiningSync.noteEndIndex = prevState.combinedSections[0]?.globalNoteEndIndex ?? 0;
              
              const resetNotes = prevState.taikoNotes.map(note => ({
                ...note,
                isHit: false,
                isMissed: false,
              }));
              const firstNote = resetNotes[0];
              const secondNote = resetNotes.length > 1 ? resetNotes[1] : firstNote;
              
              lastNormalizedTimeRef.current = -1;
              return {
                ...prevState,
                taikoNotes: resetNotes,
                currentSectionIndex: 0,
                currentNoteIndex: 0,
                combinedFullLoopCount: newFullLoopCount,
                taikoLoopCycle: newFullLoopCount,
                awaitingLoopStart: false,
                activeMonsters: prevState.activeMonsters.map(m => ({
                  ...m,
                  correctNotes: [],
                  chordTarget: firstNote?.chord ?? m.chordTarget,
                  nextChord: secondNote?.chord ?? m.nextChord,
                })),
              };
            }
          }
          
          // C&R手動モード: リスニング小節中はミス判定・ゲージ更新をスキップ
          if (section.listenBars && section.playBars) {
            const currentBarInSection = Math.floor(currentTime / secPerMeasure) + 1;
            if (currentBarInSection >= section.listenBars[0] && currentBarInSection <= section.listenBars[1]) {
              lastNormalizedTimeRef.current = currentTime;
              return prevState;
            }
          }
          // C&R交互モード: リスニングセクション（ノーツ空）では全処理スキップ
          if (section.callResponseMode === 'alternating') {
            const totalPlay = prevState.combinedFullLoopCount * (section.sectionRepeatCount ?? 1) + (section.repeatIndex ?? 0);
            if (totalPlay % 2 === 0) {
              lastNormalizedTimeRef.current = currentTime;
              return prevState;
            }
          }
          
          // --- セクション内の通常ミス判定 ---
          const noteIdx = prevState.currentNoteIndex;
          const currentNote = prevState.taikoNotes[noteIdx];
          if (!currentNote) {
            lastNormalizedTimeRef.current = currentTime;
            return prevState;
          }
          
          if (currentNote.isHit) {
            const sectionEnd = section.globalNoteEndIndex;
            let skipIdx = noteIdx + 1;
            while (skipIdx < sectionEnd && prevState.taikoNotes[skipIdx]?.isHit) {
              skipIdx++;
            }
            if (skipIdx >= sectionEnd) {
              lastNormalizedTimeRef.current = currentTime;
              if (prevState.awaitingLoopStart) return prevState;
              return { ...prevState, awaitingLoopStart: true };
            }
            const skipNote = prevState.taikoNotes[skipIdx];
            const skipNextNote = (skipIdx + 1 < sectionEnd)
              ? prevState.taikoNotes[skipIdx + 1]
              : prevState.combinedSections[sectionIdx + 1]
                ? prevState.taikoNotes[prevState.combinedSections[sectionIdx + 1].globalNoteStartIndex]
                : prevState.taikoNotes[skipIdx];
            lastNormalizedTimeRef.current = currentTime;
            return {
              ...prevState,
              currentNoteIndex: skipIdx,
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                chordTarget: skipNote?.chord ?? m.chordTarget,
                nextChord: skipNextNote?.chord ?? m.nextChord,
              })),
            };
          }
          
          // ミス判定: +150ms以上経過 → 直接HP減少（非combiningと同一方式）
          const timeDiff = currentTime - currentNote.hitTime;
          if (timeDiff > 0.15) {
            const isPracticeMode = prevState.playMode === 'practice';
            const sectionEnd = section.globalNoteEndIndex;
            const updatedNotes = prevState.taikoNotes.slice();
            updatedNotes[noteIdx] = { ...currentNote, isMissed: true };
            
            let nextIdx = noteIdx + 1;
            while (nextIdx < sectionEnd && updatedNotes[nextIdx]?.isHit) nextIdx++;
            
            const isLastInSection = nextIdx >= sectionEnd;
            const nextNote = isLastInSection
              ? (prevState.combinedSections[sectionIdx + 1]
                ? prevState.taikoNotes[prevState.combinedSections[sectionIdx + 1].globalNoteStartIndex]
                : prevState.taikoNotes[noteIdx])
              : updatedNotes[nextIdx];
            const nextNextNote = isLastInSection
              ? nextNote
              : ((nextIdx + 1 < sectionEnd) ? updatedNotes[nextIdx + 1] : nextNote);
            
            const attackerId = prevState.activeMonsters?.[0]?.id;
            if (attackerId && !isPracticeMode) {
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

            const newHp = isPracticeMode ? prevState.playerHp : Math.max(0, prevState.playerHp - 1);
            const newSp = isPracticeMode ? prevState.playerSp : 0;
            const isGameOver = !isPracticeMode && newHp <= 0;

            lastNormalizedTimeRef.current = currentTime;

            if (isGameOver) {
              const finalState = {
                ...prevState,
                taikoNotes: updatedNotes,
                playerHp: 0,
                isGameActive: false,
                isGameOver: true,
                gameResult: 'gameover' as const,
                isCompleting: true,
                combo: 0,
              };
              setTimeout(() => {
                try { onGameComplete('gameover', finalState); } catch {}
              }, 100);
              return finalState;
            }

            return {
              ...prevState,
              taikoNotes: updatedNotes,
              playerHp: newHp,
              playerSp: newSp,
              currentNoteIndex: isLastInSection ? noteIdx : nextIdx,
              awaitingLoopStart: isLastInSection,
              combo: 0,
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                correctNotes: [],
                chordTarget: nextNote?.chord ?? m.chordTarget,
                nextChord: nextNextNote?.chord ?? m.nextChord,
              })),
            };
          }
          
          lastNormalizedTimeRef.current = currentTime;
          return prevState;
        }
        // ===== ここまで timing_combining =====
        
        const secPerMeasure = (60 / (stage.bpm || 120)) * (stage.timeSignature || 4);
        const countInSec = (stage.countInMeasures || 0) * secPerMeasure;
        const hasCountInLoop = bgmManager.getLoopIncludesCountIn();
        // loopIncludesCountIn時は音源実サイクル(actualLoopEnd)からカウントイン分を引く
        const actualEnd = bgmManager.getActualLoopEnd();
        const loopDuration = hasCountInLoop && actualEnd > 0
          ? actualEnd - countInSec
          : (stage.measureCount || 8) * secPerMeasure;
        
        // ループ検出（2パターン）
        // A) loopIncludesCountIn(progression_order): 本編→カウントインへの遷移で検出
        // B) 通常: normalizedTime のラップアラウンドで検出
        let justLooped = false;
        let normalizedTime = 0;
        const lastNorm = lastNormalizedTimeRef.current;
        const isInCountIn = currentTime < -0.01;
        
        if (isInCountIn) {
          if (lastNorm >= 0) {
            justLooped = true;
          }
        } else {
          normalizedTime = currentTime < 0 ? 0 : ((currentTime % loopDuration) + loopDuration) % loopDuration;
          const loopTimeDiff = lastNorm - normalizedTime;
          const isSignificantJump = loopTimeDiff > loopDuration * 0.5;
          justLooped = lastNorm >= 0 && normalizedTime + 1e-6 < lastNorm && isSignificantJump;
        }
        
        if (justLooped) {
          // 次ループ突入時のみリセット・巻き戻し
          const newLoopCycle = (prevState.taikoLoopCycle ?? 0) + 1;
          
          // リピートごとの移調を適用（移調設定がある場合）
          let transposedNotes = prevState.originalTaikoNotes.length > 0 
            ? prevState.originalTaikoNotes 
            : prevState.taikoNotes;
          let newTransposeOffset = prevState.currentTransposeOffset;
          
          if (prevState.transposeSettings && prevState.originalTaikoNotes.length > 0) {
            // 新しい移調オフセットを計算
            newTransposeOffset = calculateTransposeOffset(
              prevState.transposeSettings.keyOffset,
              newLoopCycle,
              prevState.transposeSettings.repeatKeyChange
            );
            
            // 移調を適用（簡易設定フラグを使用）
            const simpleMode = displayOpts?.simple ?? true;
            if (newTransposeOffset !== 0) {
              transposedNotes = transposeTaikoNotes(prevState.originalTaikoNotes, newTransposeOffset, simpleMode);
            } else {
              // 移調オフセットが0でも簡易モードの正規化は適用
              transposedNotes = transposeTaikoNotes(prevState.originalTaikoNotes, 0, simpleMode);
            }
            
            // BGMのピッチシフトを直接変更（Reactのバッチ処理を待たずに即座に反映）
            // これにより、ノーツの移調とBGMのピッチが同時に変更される
            bgmManager.setPitchShift(newTransposeOffset);
          }
          
          // アウフタクト: 2回目以降のループではカウントイン中のノーツを除外
          const loopNotes = transposedNotes.filter(n => !n.isAuftaktNote);

          // ノーツをリセット（先読みヒット済みノーツはIDで照合して維持）
          const preHitIndices = prevState.preHitNoteIndices || [];
          const preHitIds = new Set(preHitIndices.map(i => prevState.taikoNotes[i]?.id).filter(Boolean));
          const resetNotes = loopNotes.map((note) => ({
            ...note,
            isHit: preHitIds.has(note.id),
            isMissed: false
          }));
          
          // 先読みヒット済みノーツがある場合、そのノーツの次から開始
          const hitIndices: number[] = [];
          resetNotes.forEach((n, i) => { if (n.isHit) hitIndices.push(i); });
          const maxHitIndex = hitIndices.length > 0 ? Math.max(...hitIndices) : -1;
          const newNoteIndex = maxHitIndex >= 0 ? maxHitIndex + 1 : 0;
          
          // newNoteIndexが範囲外の場合は0にリセット
          const effectiveNoteIndex = newNoteIndex >= resetNotes.length ? 0 : newNoteIndex;
          
          // ターゲットコードを決定（先読みヒットがある場合は次のノーツから）
          const targetNote = resetNotes[effectiveNoteIndex] || resetNotes[0];
          const nextTargetNote = resetNotes[(effectiveNoteIndex + 1) % resetNotes.length] || resetNotes[0];
          
          const refreshedMonsters = prevState.activeMonsters.map(m => ({
            ...m,
            correctNotes: [],
            gauge: 0,
            chordTarget: targetNote.chord,
            nextChord: nextTargetNote.chord
          }));
          
          lastNormalizedTimeRef.current = isInCountIn ? -1 : normalizedTime;
          return {
            ...prevState,
            taikoNotes: resetNotes,
            currentNoteIndex: effectiveNoteIndex,
            awaitingLoopStart: false,
            taikoLoopCycle: newLoopCycle,
            activeMonsters: refreshedMonsters,
            currentTransposeOffset: newTransposeOffset,
            preHitNoteIndices: []
          };
        }
        
        // カウントイン中はノーツ処理を停止（ループリセット以外）
        if (isInCountIn) {
          lastNormalizedTimeRef.current = -1;
          return prevState;
        }
        
        // 末尾処理後の待機中はミス判定を停止（ループ境界待ち）
        // ただし、鍵盤ガイド表示用に次のループのコード情報を事前計算する
        if (prevState.awaitingLoopStart) {
          // 次のループの移調オフセットを先に計算
          const nextLoopCycle = (prevState.taikoLoopCycle ?? 0) + 1;
          let nextTransposeOffset = prevState.currentTransposeOffset;
          
          if (prevState.transposeSettings && prevState.originalTaikoNotes.length > 0) {
            nextTransposeOffset = calculateTransposeOffset(
              prevState.transposeSettings.keyOffset,
              nextLoopCycle,
              prevState.transposeSettings.repeatKeyChange
            );
          }
          
          // 次のループの先頭ノーツのコードを計算（ガイド表示用）
          const baseNotes = prevState.originalTaikoNotes.length > 0 
            ? prevState.originalTaikoNotes 
            : prevState.taikoNotes;
          
          if (baseNotes.length > 0) {
            // 次のループの移調後のコードを計算（簡易設定フラグを使用）
            const simpleMode = displayOpts?.simple ?? true;
            const nextFirstChord = nextTransposeOffset !== 0
              ? transposeChordDefinition(baseNotes[0].chord, nextTransposeOffset, simpleMode)
              : transposeChordDefinition(baseNotes[0].chord, 0, simpleMode);
            const nextSecondChord = baseNotes.length > 1
              ? (nextTransposeOffset !== 0
                  ? transposeChordDefinition(baseNotes[1].chord, nextTransposeOffset, simpleMode)
                  : transposeChordDefinition(baseNotes[1].chord, 0, simpleMode))
              : nextFirstChord;
            
            // 現在のモンスターのnextChordを次のループの先頭コードに更新
            // これにより、ループ直前でも正しいガイドが表示される
            const currentMonsters = prevState.activeMonsters;
            const needsUpdate = currentMonsters.length > 0 && 
              currentMonsters[0].nextChord?.id !== nextFirstChord.id;
            
            if (needsUpdate) {
              const updatedMonsters = currentMonsters.map(m => ({
                ...m,
                nextChord: nextFirstChord
              }));
              lastNormalizedTimeRef.current = normalizedTime;
              return { 
                ...prevState, 
                activeMonsters: updatedMonsters
              };
            }
          }
          
          lastNormalizedTimeRef.current = normalizedTime;
          return prevState;
        }
        
        // 以降は既存のミス判定ロジック
        const currentNoteIndex = prevState.currentNoteIndex;
        const currentNote = prevState.taikoNotes[currentNoteIndex];
        if (!currentNote) { lastNormalizedTimeRef.current = normalizedTime; return prevState; }
        
        // 既にヒット済みのノーツはスキップして次へ進む（先読みヒット対応）
        // これにより、ループ境界付近で先読みヒットしたノーツがミス扱いにならない
        if (currentNote.isHit) {
          const nextIndex = currentNoteIndex + 1;
          if (nextIndex >= prevState.taikoNotes.length) {
            // 末尾：次ループまで待つ
            const nextLoopFirstNote = prevState.taikoNotes[0];
            const nextLoopSecondNote = prevState.taikoNotes.length > 1 ? prevState.taikoNotes[1] : prevState.taikoNotes[0];
            lastNormalizedTimeRef.current = normalizedTime;
            return {
              ...prevState,
              awaitingLoopStart: true,
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                chordTarget: nextLoopFirstNote.chord,
                nextChord: nextLoopSecondNote.chord
              })),
            };
          }
          // 次のヒット済みでないノーツを探す
          let skipIndex = nextIndex;
          while (skipIndex < prevState.taikoNotes.length && prevState.taikoNotes[skipIndex].isHit) {
            skipIndex++;
          }
          if (skipIndex >= prevState.taikoNotes.length) {
            // 全ノーツがヒット済み：次ループまで待つ
            const nextLoopFirstNote = prevState.taikoNotes[0];
            const nextLoopSecondNote = prevState.taikoNotes.length > 1 ? prevState.taikoNotes[1] : prevState.taikoNotes[0];
            lastNormalizedTimeRef.current = normalizedTime;
            return {
              ...prevState,
              awaitingLoopStart: true,
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                chordTarget: nextLoopFirstNote.chord,
                nextChord: nextLoopSecondNote.chord
              })),
            };
          }
          const skipToNote = prevState.taikoNotes[skipIndex];
          const skipToNextNote = (skipIndex + 1 < prevState.taikoNotes.length) ? prevState.taikoNotes[skipIndex + 1] : prevState.taikoNotes[0];
          lastNormalizedTimeRef.current = normalizedTime;
          return {
            ...prevState,
            currentNoteIndex: skipIndex,
            activeMonsters: prevState.activeMonsters.map(m => ({
              ...m,
              chordTarget: skipToNote.chord,
              nextChord: skipToNextNote.chord
            })),
          };
        }
        
        // 現在のループ内時間とノーツのヒット時間の差を計算
        let timeDiff = normalizedTime - currentNote.hitTime;
        
        // ループを考慮した時間差の調整
        while (timeDiff > loopDuration / 2) {
          timeDiff -= loopDuration;
        }
        while (timeDiff < -loopDuration / 2) {
          timeDiff += loopDuration;
        }
        
        // カウントイン中はミス判定しない
        if (currentTime < -0.01) {
          lastNormalizedTimeRef.current = -1;
          return prevState;
        }
        
        // C&R手動モード: リスニング小節中はミス判定・攻撃をスキップ（ノーツがないため）
        if (stage.callResponseEnabled && stage.callResponseMode !== 'alternating' && stage.callResponseListenBars) {
          const currentBar = Math.floor(normalizedTime / secPerMeasure) + 1;
          if (currentBar >= stage.callResponseListenBars[0] && currentBar <= stage.callResponseListenBars[1]) {
            lastNormalizedTimeRef.current = normalizedTime;
            return prevState;
          }
        }
        // C&R交互モード: リスニングサイクル（奇数回=偶数loopCycle）では全処理スキップ
        if (stage.callResponseEnabled && stage.callResponseMode === 'alternating') {
          if ((prevState.taikoLoopCycle % 2) === 0) {
            lastNormalizedTimeRef.current = normalizedTime;
            return prevState;
          }
        }
        
        // ミス判定：+150ms以上経過した場合
        if (timeDiff > 0.15) {
          // 練習モードの場合はHP減少をスキップ（無限HP）
          const isPracticeMode = prevState.playMode === 'practice';
          
          // 敵の攻撃を発動（先頭モンスターを指定）
          // 練習モードでは攻撃演出（怒りなど）をスキップ
          const attackerId = prevState.activeMonsters?.[0]?.id;
          if (attackerId && !isPracticeMode) {
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
          
          // ミスしたノーツに isMissed フラグを立てる（表示で判定ライン奥まで流し続けるため）
          const updatedTaikoNotes = [...prevState.taikoNotes];
          updatedTaikoNotes[currentNoteIndex] = { ...currentNote, isMissed: true };
          
          // HP減少とゲームオーバー判定（練習モードではスキップ）
          const newHp = isPracticeMode ? prevState.playerHp : Math.max(0, prevState.playerHp - 1);
          const newSp = isPracticeMode ? prevState.playerSp : 0; // 練習モードではSPもリセットしない
          const isGameOver = !isPracticeMode && newHp <= 0;
          
          if (isGameOver) {
            lastNormalizedTimeRef.current = normalizedTime;
            const finalState = {
              ...prevState,
              taikoNotes: updatedTaikoNotes,
              playerHp: 0,
              isGameActive: false,
              isGameOver: true,
              gameResult: 'gameover' as const,
              isCompleting: true,
              combo: 0,
            };
            setTimeout(() => {
              try {
                onGameComplete('gameover', finalState);
              } catch (error) {
                devLog.debug('❌ 太鼓モード ゲームオーバーコールバックエラー:', error);
              }
            }, 100);
            return finalState;
          }
          
          const nextIndex = currentNoteIndex + 1;
          if (nextIndex >= prevState.taikoNotes.length) {
            const nextNote = prevState.taikoNotes[0];
            const nextNextNote = prevState.taikoNotes.length > 1 ? prevState.taikoNotes[1] : prevState.taikoNotes[0];
            lastNormalizedTimeRef.current = normalizedTime;
            return {
              ...prevState,
              taikoNotes: updatedTaikoNotes,
              playerHp: newHp,
              playerSp: newSp,
              awaitingLoopStart: true,
              combo: 0,
              activeMonsters: prevState.activeMonsters.map(m => ({
                ...m,
                correctNotes: [],
                gauge: 0,
                chordTarget: nextNote.chord,
                nextChord: nextNextNote.chord
              })),
            };
          }
          
          const nextNote = updatedTaikoNotes[nextIndex];
          const nextNextNote = (nextIndex + 1 < updatedTaikoNotes.length) ? updatedTaikoNotes[nextIndex + 1] : updatedTaikoNotes[0];
          lastNormalizedTimeRef.current = normalizedTime;
          return {
            ...prevState,
            taikoNotes: updatedTaikoNotes,
            playerHp: newHp,
            playerSp: newSp,
            currentNoteIndex: nextIndex,
            combo: 0,
            activeMonsters: prevState.activeMonsters.map(m => ({
              ...m,
              correctNotes: [],
              gauge: 0,
              chordTarget: nextNote.chord,
              nextChord: nextNextNote.chord
            })),
          };
        }
        
        lastNormalizedTimeRef.current = normalizedTime;
        return prevState;
      }
      
      const incrementRate = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      
      // 🚀 パフォーマンス最適化: ゲージが既に100%のモンスターがいるかチェック
      const hasMaxGauge = prevState.activeMonsters.some(m => m.gauge >= 100);
      if (hasMaxGauge) {
        // 既に攻撃待ちのモンスターがいる場合は更新をスキップ
        return prevState;
      }
      
      // 各モンスターのゲージを更新（変更がある場合のみ新しいオブジェクトを生成）
      let hasGaugeChange = false;
      const updatedMonsters = prevState.activeMonsters.map(monster => {
        const newGauge = Math.min(monster.gauge + incrementRate, 100);
        if (Math.abs(newGauge - monster.gauge) < 0.01) {
          return monster; // 変更なし、同じ参照を返す
        }
        hasGaugeChange = true;
        return { ...monster, gauge: newGauge };
      });
      
      // 変更がない場合は状態更新をスキップ
      if (!hasGaugeChange) {
        return prevState;
      }
      
      // ゲージが満タンになったモンスターをチェック
      const attackingMonster = updatedMonsters.find(m => m.gauge >= 100);
      
      if (attackingMonster) {
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
        // 🚀 パフォーマンス最適化: onGameStateChange を呼び出さない（UIは自動更新される）
        return { 
          ...prevState, 
          activeMonsters: updatedMonsters,
          // 互換性のため（最初のモンスターのゲージを代表値として使用）
          enemyGauge: updatedMonsters[0]?.gauge || 0 
        };
      }
    });
  }, [handleEnemyAttack, onGameStateChange, isReady, gameState.currentStage?.mode, gameState.playMode]);
  
  // ノート入力処理（ミスタッチ概念を排除し、バッファを永続化）
  const handleNoteInput = useCallback((note: number, inputTimestampMs?: number) => {
    const nowMs = performance.now();
    const sampledMusicTime = bgmManager.getCurrentMusicTime();
    const inputDelaySec =
      typeof inputTimestampMs === 'number' ? Math.max(0, (nowMs - inputTimestampMs) / 1000) : 0;
    // 入力イベント発生時刻の音楽時間に近づけ、setState遅延による判定ブレを抑える
    const capturedInputMusicTime = sampledMusicTime - inputDelaySec;

    // updater関数の中でロジックを実行するように変更
    setGameState(prevState => {
      // ゲームがアクティブでない場合は何もしない
      if (!prevState.isGameActive || prevState.isWaitingForNextMonster) {
        return prevState;
      }

      // 太鼓の達人モードの場合は専用の処理を行う
      if (prevState.isTaikoMode && prevState.taikoNotes.length > 0) {
        return handleTaikoModeInput(prevState, note, capturedInputMusicTime);
      }

      const noteMod12 = note % 12;
      const completedMonsters: MonsterState[] = [];
      let hasAnyNoteChanged = false;

      // 1. 今回の入力でどのモンスターが影響を受けるか判定し、新しい状態を作る
      const monstersAfterInput = prevState.activeMonsters.map(monster => {
        const targetNotes = [...new Set(monster.chordTarget.notes.map(n => n % 12))];
        
        // 撃破済みモンスターや、既に完成しているモンスター、入力音と関係ないモンスターはスキップ
        if (monster.defeatedAt !== undefined || !targetNotes.includes(noteMod12) || monster.correctNotes.includes(noteMod12)) {
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
        // ★ 攻撃処理後の状態を計算する
        const stateAfterAttack = { ...prevState, activeMonsters: monstersAfterInput };
        
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
        stateAfterAttack.combo += completedMonsters.length;
        
        // 倒されたモンスターを特定し、defeatedAtタイムスタンプを設定（HPバーが0になる演出のため）
        const defeatedMonstersThisTurn = stateAfterAttack.activeMonsters.filter(m => m.currentHp <= 0 && !m.defeatedAt);
        stateAfterAttack.enemiesDefeated += defeatedMonstersThisTurn.length;

        // 撃破されたモンスターにdefeatedAtを設定（HP0の状態を200ms見せるため）
        // 生き残ったモンスターは通常通り処理
        const now = Date.now();
        const updatedMonsters = stateAfterAttack.activeMonsters.map(monster => {
          // 今回撃破されたモンスター → defeatedAtを設定してHP0の状態を見せる
          if (monster.currentHp <= 0 && !monster.defeatedAt) {
            return { ...monster, currentHp: 0, defeatedAt: now };
          }
          // 生き残ったモンスターのうち、今回攻撃したモンスターは問題をリセット
          if (completedMonsters.some(cm => cm.id === monster.id)) {
            let nextChord;
            if (stateAfterAttack.currentStage?.mode === 'single_order') {
              const allowedForOrder = stateAfterAttack.currentStage.allowedChords?.length
                ? stateAfterAttack.currentStage.allowedChords : [];
              nextChord = selectOrderedChord(allowedForOrder, singleOrderIndexRef, displayOpts);
            } else {
              nextChord = selectRandomChordWithBag(
                bagSelectorRef.current,
                stateAfterAttack.currentStage!.allowedChords,
                monster.chordTarget.id,
                displayOpts
              );
            }
            return { ...monster, chordTarget: nextChord!, correctNotes: [], gauge: 0 };
          }
          // SPアタックの場合は全ての敵のゲージをリセット
          if (isSpecialAttack) {
            return { ...monster, gauge: 0 };
          }
          return monster;
        });

        // 注: モンスターの補充は200ms後にuseEffectで行う（HPバーが0になる演出を見せるため）
        // ここでは撃破済みモンスターも含めてactiveMonsters に残す
        
        // 最終的なモンスターリストを更新（キューは変更しない）
        stateAfterAttack.activeMonsters = updatedMonsters;
        
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
  // 注: handleTaikoModeInput を依存配列に含めない。
  // displayOpts のオブジェクトリテラル再生成でコールバックが毎レンダー再作成され、
  // 下流の handleNoteInputBridge まで連鎖的に再作成されてフレーム落ちの原因になる。
  // handleTaikoModeInput は setGameState updater 内で呼ばれるため stale closure で問題ない。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChordCorrect, onGameComplete, onGameStateChange, stageMonsterIds]);
  
  // 次の敵へ進むための新しい関数
  const proceedToNextEnemy = useCallback(() => {
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
        nextChord = selectRandomChordWithBag(
          bagSelectorRef.current,
          (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : (prevState.currentStage.chordProgression || []),
          prevState.currentChordTarget?.id,
          displayOpts
        );
      } else if (prevState.currentStage?.mode === 'single_order') {
        const allowedForOrder = (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0) ? prevState.currentStage.allowedChords : [];
        nextChord = selectOrderedChord(allowedForOrder, singleOrderIndexRef, displayOpts);
      } else {
        const progression = prevState.currentStage?.chordProgression || [];
        const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
        nextChord = getProgressionChord(progression, nextIndex, displayOpts);
      }

      // アクティブなモンスターの情報も更新
      const updatedMonsters = prevState.activeMonsters.map(monster => ({
        ...monster,
        chordTarget: nextChord!,
        correctNotes: [],
        gauge: 0
      }));

      nextState = {
        ...nextState,
        currentQuestionIndex: prevState.currentQuestionIndex + 1,
        currentChordTarget: nextChord,
        enemyGauge: 0,
        activeMonsters: updatedMonsters
      };

      onGameStateChange(nextState);
      return nextState;
    });
  }, [onGameStateChange, onGameComplete]);
  
  // ゲーム停止
  const stopGame = useCallback(() => {
    combiningSync.active = false;
    combiningSync.sectionIndex = 0;
    combiningSync.noteStartIndex = 0;
    combiningSync.noteEndIndex = 0;
    setGameState(prevState => ({
      ...prevState,
      isGameActive: false
    }));
    
    // ステージを抜けるたびにアイコン配列を初期化
    setStageMonsterIds([]);
    
    // 袋セレクターをクリア
    bagSelectorRef.current = null;
    singleOrderIndexRef.current = 0;
    
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
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
    };
  }, []); // 空の依存配列で、コンポーネントのアンマウント時のみ実行

  // エフェクトの分離：enemyGaugeTimer専用
  useEffect(() => {
    if (
      !gameState.isGameActive ||
      !gameState.currentStage ||
      (gameState.playMode === 'practice' && !gameState.isTaikoMode) || // 太鼓モードなら練習でも動かす
      isReady
    ) {
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
  }, [gameState.isGameActive, gameState.currentStage?.id, updateEnemyGauge, isReady, gameState.isTaikoMode, gameState.playMode]); // 依存配列追加

  // 撃破済みモンスター（defeatedAt設定済み）を200ms後に削除して新しいモンスターを補充
  const DEFEAT_ANIMATION_DELAY = 200; // HPバー0演出の表示時間（ms）
  useEffect(() => {
    // 撃破済みモンスターを取得
    const defeatedMonsters = gameState.activeMonsters.filter(m => m.defeatedAt !== undefined);
    if (defeatedMonsters.length === 0 || !gameState.isGameActive) return;

    // 最も古い撃破時刻を取得
    const oldestDefeatedAt = Math.min(...defeatedMonsters.map(m => m.defeatedAt!));
    const timeElapsed = Date.now() - oldestDefeatedAt;
    const remainingTime = Math.max(0, DEFEAT_ANIMATION_DELAY - timeElapsed);

    const timer = setTimeout(() => {
      setGameState(prevState => {
        // 200ms経過した撃破済みモンスターを削除
        const monstersToRemove = prevState.activeMonsters.filter(
          m => m.defeatedAt !== undefined && (Date.now() - m.defeatedAt) >= DEFEAT_ANIMATION_DELAY
        );
        if (monstersToRemove.length === 0) return prevState;

        // 生き残ったモンスター（撃破されていない or まだ200ms経っていない）
        const remainingMonsters = prevState.activeMonsters.filter(
          m => m.defeatedAt === undefined || (Date.now() - m.defeatedAt) < DEFEAT_ANIMATION_DELAY
        );

        // 新しいモンスターを補充
        const newMonsterQueue = [...prevState.monsterQueue];
        if (prevState.playMode === 'practice' && newMonsterQueue.length === 0) {
          newMonsterQueue.push(...createPracticeQueueBatch(PRACTICE_QUEUE_BATCH_SIZE));
        }

        const slotsToFill = prevState.simultaneousMonsterCount - remainingMonsters.length;
        const monstersToAddCount = Math.min(slotsToFill, newMonsterQueue.length);

        if (monstersToAddCount > 0 && prevState.currentStage) {
          const availablePositions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(
            pos => !remainingMonsters.some(m => m.position === pos)
          );
          const sheetMusicOpt = prevState.currentStage.isSheetMusicMode
            ? { enabled: true, clef: prevState.currentStage.sheetMusicClef || 'treble' as const }
            : undefined;
          const allowedChords = (prevState.currentStage.allowedChords && prevState.currentStage.allowedChords.length > 0)
            ? prevState.currentStage.allowedChords
            : (prevState.currentStage.chordProgression || []);

          for (let i = 0; i < monstersToAddCount; i++) {
            const monsterIndex = newMonsterQueue.shift()!;
            const position = availablePositions[i] || 'B';
            const newMonster = createMonsterFromQueue(
              monsterIndex,
              position as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
              prevState.maxEnemyHp,
              allowedChords,
              undefined,
              displayOpts,
              stageMonsterIds,
              sheetMusicOpt,
              bagSelectorRef.current
            );
            // single_orderモード: 順序通りのコードで上書き
            if (prevState.currentStage?.mode === 'single_order') {
              const orderedChord = selectOrderedChord(allowedChords, singleOrderIndexRef, displayOpts);
              if (orderedChord) {
                newMonster.chordTarget = orderedChord;
              }
            }
            remainingMonsters.push(newMonster);
          }
        }

        const newState = {
          ...prevState,
          activeMonsters: remainingMonsters,
          monsterQueue: newMonsterQueue
        };
        onGameStateChange(newState);
        return newState;
      });
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [gameState.activeMonsters, gameState.isGameActive, displayOpts, stageMonsterIds, onGameStateChange]);

  // パフォーマンス監視は削除（ログ出力がパフォーマンスに影響するため）
  
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