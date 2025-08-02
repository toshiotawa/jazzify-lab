/**
 * ファンタジーゲームエンジン
 * ゲームロジックとステート管理を担当
 * 修正: 攻撃ゲージと判定ウィンドウをビート同期型にやり直し
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
  enemyGaugeSeconds: number; // 廃止予定（ビートベースに移行）
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
  // progressionモード専用状態
  gaugePhase: 'idle' | 'judging';
  gaugeStartAt: number; // ゲージ開始時刻
  hasShownProblem: boolean; // 現在小節で問題を表示済みか
  // ビート同期用の状態
  lastBeatTime: number; // 最後のビート時刻
  nextProblemTime: number; // 次の問題出題時刻
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

// ===== ヘルパー関数 =====

const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  try {
    const chord = resolveChord(chordId);
    if (!chord) return null;

    const displayName = toDisplayChordName(chordId, displayOpts);
    const notes = chord.map(note => note.midi);
    const noteNames = chord.map(note => note.name);
    
    // コードの性質を判定
    let quality = 'unknown';
    if (chordId.includes('m')) quality = 'minor';
    else if (chordId.includes('7')) quality = 'dominant7';
    else if (chordId.includes('M7') || chordId.includes('maj7')) quality = 'major7';
    else if (chordId.includes('m7')) quality = 'minor7';
    else quality = 'major';
    
    // ルート音を抽出
    const root = chordId.replace(/[^A-G#b]/g, '');

    return {
      id: chordId,
      displayName,
      notes,
      noteNames,
      quality,
      root
    };
  } catch (error) {
    devLog.error('コード定義の取得に失敗:', { chordId, error });
    return null;
  }
};

// ===== モンスター作成関数 =====

const createMonsterFromQueue = (
  monsterIndex: number,
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H',
  enemyHp: number,
  allowedChords: string[],
  previousChordId?: string,
  displayOpts?: DisplayOpts,
  stageMonsterIds?: string[]
): MonsterState => {
  const monsterId = stageMonsterIds?.[monsterIndex] || `monster_${monsterIndex}`;
  const monster = MONSTERS.find(m => m.id === monsterId) || MONSTERS[0];
  
  // コード選択（重複回避）
  const chord = selectUniqueRandomChord(allowedChords, previousChordId, displayOpts);
  
  return {
    id: monsterId,
    index: monsterIndex,
    position,
    currentHp: enemyHp,
    maxHp: enemyHp,
    gauge: 0,
    chordTarget: chord!,
    correctNotes: [],
    icon: monster.icon,
    name: monster.name
  };
};

// ===== 位置割り当て関数 =====

const assignPositions = (count: number): ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] => {
  const positions: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  return positions.slice(0, count);
};

// ===== コード選択関数 =====

const selectUniqueRandomChord = (
  allowedChords: string[],
  previousChordId?: string,
  displayOpts?: DisplayOpts
): ChordDefinition | null => {
  if (allowedChords.length === 0) return null;
  
  // 直前のコードを避ける
  const availableChords = previousChordId 
    ? allowedChords.filter(id => id !== previousChordId)
    : allowedChords;
  
  if (availableChords.length === 0) {
    // 全て同じコードの場合は仕方なく同じものを使用
    return getChordDefinition(allowedChords[0], displayOpts);
  }
  
  const randomChordId = availableChords[Math.floor(Math.random() * availableChords.length)];
  return getChordDefinition(randomChordId, displayOpts);
};

// ===== コード判定関数 =====

const isPartialMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  const targetNoteMod12 = [...new Set(targetChord.notes.map(n => n % 12))];
  const inputNoteMod12 = [...new Set(inputNotes.map(n => n % 12))];
  
  return inputNoteMod12.some(note => targetNoteMod12.includes(note));
};

const checkChordMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  const targetNoteMod12 = [...new Set(targetChord.notes.map(n => n % 12))];
  const inputNoteMod12 = [...new Set(inputNotes.map(n => n % 12))];
  
  if (targetNoteMod12.length !== inputNoteMod12.length) return false;
  
  return targetNoteMod12.every(note => inputNoteMod12.includes(note)) &&
         inputNoteMod12.every(note => targetNoteMod12.includes(note));
};

const getCorrectNotes = (inputNotes: number[], targetChord: ChordDefinition): number[] => {
  const targetNoteMod12 = [...new Set(targetChord.notes.map(n => n % 12))];
  const inputNoteMod12 = [...new Set(inputNotes.map(n => n % 12))];
  
  return inputNoteMod12.filter(note => targetNoteMod12.includes(note));
};

// ===== レガシー関数（互換性のため） =====

const selectRandomChord = (allowedChords: string[], previousChordId?: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  return selectUniqueRandomChord(allowedChords, previousChordId, displayOpts);
};

const getProgressionChord = (progression: string[], questionIndex: number, displayOpts?: DisplayOpts): ChordDefinition | null => {
  if (progression.length === 0) return null;
  const chordId = progression[questionIndex % progression.length];
  return getChordDefinition(chordId, displayOpts);
};

const getCurrentEnemy = (enemyIndex: number) => {
  return MONSTERS[enemyIndex % MONSTERS.length];
};

// ===== メインエンジン =====

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
    // progressionモード専用状態
    gaugePhase: 'idle',
    gaugeStartAt: 0,
    hasShownProblem: false,
    // ビート同期用の状態
    lastBeatTime: 0,
    nextProblemTime: 0
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
      // progressionモード専用状態
      gaugePhase: 'idle',
      gaugeStartAt: 0,
      hasShownProblem: false,
      // ビート同期用の状態
      lastBeatTime: 0,
      nextProblemTime: 0
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
  
  // ゲージタイマーの管理（100ms tickでビート同期更新に変更）
  useEffect(() => {
    if (enemyGaugeTimer) clearInterval(enemyGaugeTimer);
    
    if (gameState.isGameActive && gameState.currentStage) {
      const timer = setInterval(() => {
        const { currentBeat, bpm } = useTimeStore.getState();
        if (currentBeat === 2) { // 2拍目にゲージを更新
          setGameState(prevState => {
            // 動的ゲージ計算: 1小節で100%到達（BPMベース）
            const beatsPerMeasure = gameState.currentStage.timeSignature || 4;
            const secPerBeat = 60 / bpm;
            const secPerMeasure = secPerBeat * beatsPerMeasure;
            const incrementRate = 100 / (secPerMeasure * 10); // 100msごとの増加率

            const updatedMonsters = prevState.activeMonsters.map(monster => ({
              ...monster,
              gauge: Math.min(monster.gauge + incrementRate, 100)
            }));

            // ゲージ100%で攻撃（95%が1拍目に一致するよう調整）
            const attackingMonster = updatedMonsters.find(m => m.gauge >= 100);
            if (attackingMonster) {
              handleEnemyAttack(attackingMonster.id);
              return { ...prevState, activeMonsters: updatedMonsters.map(m => m.id === attackingMonster.id ? { ...m, gauge: 0 } : m) };
            }

            // 視覚的色変更のための通知（90-100%時）
            updatedMonsters.forEach(m => {
              if (m.gauge >= 90 && m.gauge < 100) {
                // UI側で色変更（例: 赤くする） - ここでは状態更新のみ
                devLog.debug('ゲージ90-100%: 色変更通知', { gauge: m.gauge });
              }
            });

            return { ...prevState, activeMonsters: updatedMonsters };
          });
        }
      }, 100);
      setEnemyGaugeTimer(timer);
    }

    return () => { if (enemyGaugeTimer) clearInterval(enemyGaugeTimer); };
  }, [gameState.isGameActive, gameState.currentStage, handleEnemyAttack]);

  // 出題タイミング（毎小節2拍目に同期、判定後3拍+200ms前から新出題）
  useEffect(() => {
    const unsubscribe = useTimeStore.subscribe(state => {
      if (state.currentBeat === 2 && gameState.isGameActive) {
        setGameState(prev => {
          // 新しいコード出題（chord_progressionから順番に）
          const progression = prev.currentStage?.chordProgression || [];
          const chordId = progression[prev.currentQuestionIndex % progression.length];
          const newChord = getChordDefinition(chordId, displayOpts);
          return { ...prev, currentChordTarget: newChord };
        });
      }
    });
    return unsubscribe;
  }, [gameState.isGameActive]);

  // 判定後処理（成功/オーバーでNULL化、3拍+200ms前から新出題）
  const proceedToNextQuestion = useCallback(() => {
    setGameState(prev => ({ ...prev, currentChordTarget: null })); // NULL化
    setTimeout(() => {
      proceedToNextQuestion(); // 3拍+200ms後（secPerBeat計算で調整）
    }, (3 * (60 / useTimeStore.getState().bpm) * 1000) + 200);
  }, []);

  // progressionモード専用の拍監視ロジック
  useEffect(() => {
    if (!gameState.isGameActive || !gameState.currentStage || gameState.currentStage.mode !== 'progression') {
      return;
    }

    const { currentBeat, tick } = useTimeStore.getState();
    
    // 出題：Beat 2
    if (currentBeat === 2 && !gameState.hasShownProblem) {
      devLog.debug('🎵 Progression mode: Beat 2 - showing next chord');
      
      setGameState(prevState => {
        const progression = prevState.currentStage?.chordProgression || [];
        const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
        const nextChord = getProgressionChord(progression, nextIndex, displayOpts);
        
        if (nextChord) {
          // 各モンスターに新しいコードを割り当て
          const updatedMonsters = prevState.activeMonsters.map(monster => ({
            ...monster,
            chordTarget: nextChord,
            correctNotes: [],
            gauge: 0
          }));
          
          return {
            ...prevState,
            currentQuestionIndex: nextIndex,
            activeMonsters: updatedMonsters,
            // 互換性のため
            currentChordTarget: nextChord,
            gaugeStartAt: performance.now(),
            hasShownProblem: true,
            gaugePhase: 'idle'
          };
        }
        return prevState;
      });
    }
    
    // 小節変わったらフラグを戻す
    if (currentBeat === 1) {
      setGameState(prevState => ({
        ...prevState,
        hasShownProblem: false
      }));
    }
  }, [useTimeStore.getState().tick]); // timeStoreのtickを依存

  // progressionモード専用のゲージ計算関数
  const calcProgressionGauge = useCallback(() => {
    if (!gameState.isGameActive || !gameState.currentStage || gameState.currentStage.mode !== 'progression') {
      return 0;
    }

    const now = performance.now();
    const { getMeasureStart } = useTimeStore.getState();
    const nextMeasureStart = getMeasureStart() + (60000 / gameState.currentStage.bpm) * gameState.currentStage.timeSignature!;
    
    // 判定窓の計算
    const t0 = gameState.gaugeStartAt; // 出題開始時刻
    const t1 = nextMeasureStart - 200; // 判定開始 = 次小節開始 - 200ms
    const t2 = t1 + 400; // 判定終了 = 判定開始 + 400ms
    
    // 係数計算
    const s1 = 90 / (t1 - t0); // 90% / (t1 - t0) [%/ms]
    const s2 = 0.025; // 10% / 400ms = 0.025 [%/ms]
    
    // ゲージ計算
    if (now < t1) {
      return Math.min(90, s1 * (now - t0));
    } else if (now <= t2) {
      return 90 + s2 * (now - t1);
    } else {
      return 0; // リセット
    }
  }, [gameState.isGameActive, gameState.currentStage, gameState.gaugeStartAt]);

  // progressionモード専用のゲージ更新
  useEffect(() => {
    if (!gameState.isGameActive || !gameState.currentStage || gameState.currentStage.mode !== 'progression') {
      return;
    }

    const updateProgressionGauge = () => {
      const gauge = calcProgressionGauge();
      
      setGameState(prevState => {
        // 各モンスターのゲージを更新
        const updatedMonsters = prevState.activeMonsters.map(monster => ({
          ...monster,
          gauge: gauge
        }));
        
        // ゲージが90-100%の範囲に入ったら判定フェーズに移行
        const newPhase = (gauge >= 90 && gauge <= 100) ? 'judging' : 'idle';
        
        return {
          ...prevState,
          activeMonsters: updatedMonsters,
          // 互換性のため
          enemyGauge: gauge,
          gaugePhase: newPhase
        };
      });
    };

    const timer = setInterval(updateProgressionGauge, 16); // 60fpsで更新
    
    return () => clearInterval(timer);
  }, [gameState.isGameActive, gameState.currentStage, calcProgressionGauge]);
  
  // ビート同期ゲージ更新（singleモード用）
  const updateBeatSynchronizedGauge = useCallback(() => {
    /* Ready 中はゲージ停止 */
    const timeState = useTimeStore.getState();
    if (timeState.startAt &&
        performance.now() - timeState.startAt < timeState.readyDuration) {
      return;
    }
    
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage || prevState.currentStage.mode !== 'single') {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブまたはprogressionモード');
        return prevState;
      }
      
      // ビートベースのゲージ計算
      const { bpm, timeSignature } = timeState;
      const beatsPerMeasure = timeSignature || 4;
      const secPerBeat = 60 / bpm;
      const secPerMeasure = secPerBeat * beatsPerMeasure;
      const incrementRate = 100 / (secPerMeasure * 10); // 100msごとの増加率
      
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
  
  // ノート入力処理（判定ウィンドウ制限: ゲージ90-100% && 1拍目±200msのみ受付）
  const handleNoteInput = useCallback((note: number) => {
    const { currentBeat, bpm } = useTimeStore.getState();
    const secPerBeat = 60 / bpm;
    const now = performance.now();
    const beatStart = now - (currentBeat - 1) * secPerBeat * 1000; // 1拍目の開始時間
    const isInWindow = Math.abs(now - beatStart) <= 200; // ±200ms

    setGameState(prevState => {
      if (!prevState.isGameActive || prevState.activeMonsters.some(m => m.gauge < 90 || m.gauge > 100) || !isInWindow) {
        devLog.debug('入力無視: 判定ウィンドウ外');
        return prevState; // 判定受付制限
      }

      devLog.debug('🎹 ノート入力受信 (in updater):', { note, noteMod12: note % 12 });

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
        nextEnemy: MONSTERS[nextEnemyIndex]?.name,
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
    MONSTERS
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps, MonsterState };
export { MONSTERS, getCurrentEnemy };