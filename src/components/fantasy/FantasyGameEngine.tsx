/**
 * ファンタジーゲームエンジン
 * コード判定・ゲームロジックを管理
 */

import { useState, useCallback, useEffect } from 'react';
import { devLog } from '@/utils/logger';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;           // "CM7"
  displayName: string;  // "CM7"
  notes: number[];      // [60, 64, 67, 71]
  quality: string;      // "M7"
  root: string;        // "C"
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
  simultaneousMonsterCount: number; // 同時出現モンスター数 (1-3)
}

interface MonsterState {
  id: string;
  index: number; // モンスターリストのインデックス
  position: 'A' | 'B' | 'C'; // 列位置
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
  playerSp: number; // SPゲージ (0-3)
  // マルチモンスター対応
  activeMonsters: MonsterState[]; // 現在アクティブなモンスター配列
  monsterQueue: number[]; // 残りのモンスターインデックスのキュー
  simultaneousMonsterCount: number; // 同時表示数
}

interface FantasyGameEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: FantasyGameState) => void;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId?: string) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: FantasyGameState) => void;
  onEnemyAttack: () => void;
}

// ===== コード定義データ =====

const CHORD_DEFINITIONS: Record<string, ChordDefinition> = {
  // メジャートライアド
  'C': { id: 'C', displayName: 'C', notes: [60, 64, 67], quality: 'major', root: 'C' },
  'F': { id: 'F', displayName: 'F', notes: [65, 69, 72], quality: 'major', root: 'F' },
  'G': { id: 'G', displayName: 'G', notes: [67, 71, 74], quality: 'major', root: 'G' },
  
  // マイナートライアド
  'Am': { id: 'Am', displayName: 'Am', notes: [57, 60, 64], quality: 'minor', root: 'A' },
  'Dm': { id: 'Dm', displayName: 'Dm', notes: [62, 65, 69], quality: 'minor', root: 'D' },
  'Em': { id: 'Em', displayName: 'Em', notes: [64, 67, 71], quality: 'minor', root: 'E' },
  
  // ドミナント7th
  'G7': { id: 'G7', displayName: 'G7', notes: [67, 71, 74, 77], quality: 'dominant7', root: 'G' },
  'C7': { id: 'C7', displayName: 'C7', notes: [60, 64, 67, 70], quality: 'dominant7', root: 'C' },
  'F7': { id: 'F7', displayName: 'F7', notes: [65, 69, 72, 75], quality: 'dominant7', root: 'F' },
  
  // マイナー7th
  'Am7': { id: 'Am7', displayName: 'Am7', notes: [57, 60, 64, 67], quality: 'minor7', root: 'A' },
  'Dm7': { id: 'Dm7', displayName: 'Dm7', notes: [62, 65, 69, 72], quality: 'minor7', root: 'D' },
  'Em7': { id: 'Em7', displayName: 'Em7', notes: [64, 67, 71, 74], quality: 'minor7', root: 'E' },
  
  // メジャー7th
  'CM7': { id: 'CM7', displayName: 'CM7', notes: [60, 64, 67, 71], quality: 'major7', root: 'C' },
  'FM7': { id: 'FM7', displayName: 'FM7', notes: [65, 69, 72, 76], quality: 'major7', root: 'F' },
  'GM7': { id: 'GM7', displayName: 'GM7', notes: [67, 71, 74, 78], quality: 'major7', root: 'G' },
  
  // テンション系
  'C6': { id: 'C6', displayName: 'C6', notes: [60, 64, 67, 69], quality: 'major6', root: 'C' },
  'Cm6': { id: 'Cm6', displayName: 'Cm6', notes: [60, 63, 67, 69], quality: 'minor6', root: 'C' },
  'C9': { id: 'C9', displayName: 'C9', notes: [60, 64, 67, 70, 74], quality: 'dominant9', root: 'C' },
  'Cm9': { id: 'Cm9', displayName: 'Cm9', notes: [60, 63, 67, 70, 74], quality: 'minor9', root: 'C' },
  'C11': { id: 'C11', displayName: 'C11', notes: [60, 64, 67, 70, 74, 77], quality: 'dominant11', root: 'C' },
  'C13': { id: 'C13', displayName: 'C13', notes: [60, 64, 67, 70, 74, 81], quality: 'dominant13', root: 'C' },
  
  // 追加のドミナント7th
  'B7': { id: 'B7', displayName: 'B7', notes: [71, 75, 78, 81], quality: 'dominant7', root: 'B' },
  'E7': { id: 'E7', displayName: 'E7', notes: [64, 68, 71, 74], quality: 'dominant7', root: 'E' },
  'A7': { id: 'A7', displayName: 'A7', notes: [69, 73, 76, 79], quality: 'dominant7', root: 'A' },
  'D7': { id: 'D7', displayName: 'D7', notes: [62, 66, 69, 72], quality: 'dominant7', root: 'D' }
};

// ===== 敵リスト定義 =====

const ENEMY_LIST = [
  { id: 'vampire', icon: 'vampire', name: 'ドラキュラ' },
  { id: 'monster', icon: 'monster', name: '怪獣' },
  { id: 'reaper', icon: 'reaper', name: '死神' },
  { id: 'kraken', icon: 'kraken', name: 'クラーケン' },
  { id: 'werewolf', icon: 'werewolf', name: '狼男' },
  { id: 'demon', icon: 'demon', name: '魔王' }
];

// ===== ヘルパー関数 =====

/**
 * モンスターキューから次のモンスターを生成
 */
const createMonsterFromQueue = (
  monsterIndex: number,
  position: 'A' | 'B' | 'C',
  enemyHp: number,
  allowedChords: string[],
  previousChordId?: string
): MonsterState => {
  const enemy = ENEMY_LIST[monsterIndex % ENEMY_LIST.length];
  const chord = selectRandomChord(allowedChords, previousChordId);
  
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
 * 位置を割り当て（A, B, C列に均等配置）
 */
const assignPositions = (count: number): ('A' | 'B' | 'C')[] => {
  if (count === 1) return ['B']; // 1体の場合は中央
  if (count === 2) return ['A', 'C']; // 2体の場合は左右
  return ['A', 'B', 'C']; // 3体の場合は全列
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
const selectRandomChord = (allowedChords: string[], previousChordId?: string): ChordDefinition | null => {
  let availableChords = allowedChords
    .map(chordId => CHORD_DEFINITIONS[chordId])
    .filter(Boolean);
    
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
const getProgressionChord = (progression: string[], questionIndex: number): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const chordId = progression[questionIndex % progression.length];
  return CHORD_DEFINITIONS[chordId] || null;
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
  onEnemyAttack
}: FantasyGameEngineProps) => {
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    currentQuestionIndex: 0,
    currentChordTarget: CHORD_DEFINITIONS['CM7'], // デフォルト値を設定
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
    simultaneousMonsterCount: 1
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // ゲーム初期化
  const initializeGame = useCallback((stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 新しいステージ定義から値を取得
    const totalEnemies = stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = totalEnemies * enemyHp;
    const simultaneousCount = stage.simultaneousMonsterCount || 1;

    // モンスターキューを作成（0からtotalEnemies-1までのインデックス）
    const monsterQueue = Array.from({ length: totalEnemies }, (_, i) => i);
    
    // 初期モンスターを配置
    const initialMonsterCount = Math.min(simultaneousCount, totalEnemies);
    const positions = assignPositions(initialMonsterCount);
    const activeMonsters: MonsterState[] = [];
    
    for (let i = 0; i < initialMonsterCount; i++) {
      const monsterIndex = monsterQueue.shift()!;
      const monster = createMonsterFromQueue(
        monsterIndex,
        positions[i],
        enemyHp,
        stage.allowedChords
      );
      activeMonsters.push(monster);
    }

    // 互換性のため最初のモンスターの情報を設定
    const firstMonster = activeMonsters[0];
    const firstChord = firstMonster ? firstMonster.chordTarget : CHORD_DEFINITIONS['C'];

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
      simultaneousMonsterCount: simultaneousCount
    };

    setGameState(newState);
    onGameStateChange(newState);

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
          gameResult: 'clear' as const
        };
        
        onGameComplete('clear', finalState);
        return finalState;
      } else {
        // 各モンスターに新しいコードを割り当て
        const updatedMonsters = prevState.activeMonsters.map(monster => {
          let nextChord;
          if (prevState.currentStage?.mode === 'single') {
            // ランダムモード：前回と異なるコードを選択
            nextChord = selectRandomChord(prevState.currentStage.allowedChords, monster.chordTarget.id);
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex);
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
  const handleEnemyAttack = useCallback(() => {
    // 攻撃時に入力バッファをリセット
    setInputBuffer([]);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setGameState(prevState => {
      const newHp = Math.max(0, prevState.playerHp - 1); // 確実に1減らす
      
      devLog.debug('💥 敵の攻撃！HP更新:', {
        oldHp: prevState.playerHp,
        newHp: newHp,
        damage: 1
      });
      
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const
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
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const
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
            nextChord = selectRandomChord(prevState.currentStage.allowedChords, previousChordId);
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex);
          }
          
          const nextState = {
            ...prevState,
            playerHp: newHp,
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
    
    onEnemyAttack();
  }, [onGameStateChange, onGameComplete, onEnemyAttack, inputTimeout]);
  
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
      
      const incrementRate = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      
      // 各モンスターのゲージを更新
      const updatedMonsters = prevState.activeMonsters.map(monster => ({
        ...monster,
        gauge: Math.min(monster.gauge + incrementRate, 100)
      }));
      
      // ゲージが満タンになったモンスターをチェック
      const attackingMonster = updatedMonsters.find(m => m.gauge >= 100);
      
      if (attackingMonster) {
        devLog.debug('💥 モンスターゲージ満タン！攻撃開始', { monster: attackingMonster.name });
        
        // 攻撃したモンスターのゲージをリセット
        const resetMonsters = updatedMonsters.map(m => 
          m.id === attackingMonster.id ? { ...m, gauge: 0 } : m
        );
        
        // 攻撃処理を非同期で実行
        setTimeout(() => handleEnemyAttack(), 0);
        
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
  
  // ノート入力処理（マルチモンスター対応）
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || gameState.activeMonsters.length === 0) return;
    
    devLog.debug('🎵 ノート入力受信:', { note, activeMonsters: gameState.activeMonsters.length });
    
    // 入力バッファに追加
    setInputBuffer(prevBuffer => {
      const newBuffer = [...prevBuffer, note];
      devLog.debug('🎵 入力バッファ更新:', { newBuffer, bufferSize: newBuffer.length });
      
      // 各モンスターに対して正解音をチェック
      const updatedMonsters = gameState.activeMonsters.map(monster => {
        const correctNotes = getCorrectNotes(newBuffer, monster.chordTarget);
        return {
          ...monster,
          correctNotes
        };
      });
      
      // 状態を更新
      setGameState(prevState => ({
        ...prevState,
        activeMonsters: updatedMonsters,
        // 互換性のため最初のモンスターの情報も更新
        correctNotes: updatedMonsters[0]?.correctNotes || []
      }));
      
      onGameStateChange({
        ...gameState,
        activeMonsters: updatedMonsters,
        correctNotes: updatedMonsters[0]?.correctNotes || []
      });
      
      // 入力タイムアウトをリセット
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
      
      // 自動判定タイマー（500msに延長 - 和音が完成するまで待機）
      const timeout = setTimeout(() => {
        devLog.debug('⏰ 自動判定タイマー発動');
        checkCurrentInput(newBuffer);
      }, 500);
      
      setInputTimeout(timeout);
      
      // 即座に判定も試行（いずれかのモンスターのコードが完成した場合）
      const completedMonster = updatedMonsters.find(monster => 
        newBuffer.length >= monster.chordTarget.notes.length &&
        checkChordMatch(newBuffer, monster.chordTarget)
      );
      
      if (completedMonster) {
        devLog.debug('🎯 コード完成 - 即座に判定', { monster: completedMonster.name });
        setTimeout(() => {
          clearTimeout(timeout);
          checkCurrentInput(newBuffer);
          setInputBuffer([]);
        }, 100);
      }
      
      return newBuffer;
    });
  }, [gameState.isGameActive, gameState.activeMonsters, inputTimeout, onGameStateChange]);
  
  // 現在の入力を判定（マルチモンスター対応）
  const checkCurrentInput = useCallback((notes: number[]) => {
    if (notes.length === 0 || gameState.activeMonsters.length === 0) {
      devLog.debug('❌ 判定スキップ: 入力なしまたはモンスターなし');
      return;
    }
    
    devLog.debug('🎯 コード判定実行中...', { 
      inputNotes: notes,
      activeMonsters: gameState.activeMonsters.map(m => ({
        name: m.name,
        chord: m.chordTarget.displayName
      }))
    });
    
    // 各モンスターに対して判定
    let isAnyCorrect = false;
    let isMistake = true; // 全てのモンスターに対して不正解かどうか
    
    // まず、入力がいずれかのモンスターのコードに部分一致しているかチェック
    for (const monster of gameState.activeMonsters) {
      const partialMatch = isPartialMatch(notes, monster.chordTarget);
      if (partialMatch) {
        isMistake = false; // 部分一致があればミスではない
        break;
      }
    }
    
    // 完全一致をチェック
    const correctMonsters: MonsterState[] = [];
    for (const monster of gameState.activeMonsters) {
      const isCorrect = checkChordMatch(notes, monster.chordTarget);
      if (isCorrect) {
        correctMonsters.push(monster);
        isAnyCorrect = true;
        isMistake = false;
      }
    }
    
    if (correctMonsters.length > 0) {
      devLog.debug('✅ 正解判定!', { 
        correctMonsters: correctMonsters.map(m => m.name) 
      });
      
      const currentStage = gameState.currentStage;
      if (!currentStage) return;

      // 各正解モンスターに対して処理
      const isSpecialAttack = gameState.playerSp >= 3;
      
      correctMonsters.forEach(monster => {
        // ダメージ計算
        const baseDamage = Math.floor(Math.random() * (currentStage.maxDamage - currentStage.minDamage + 1)) + currentStage.minDamage;
        const damageDealt = baseDamage * (isSpecialAttack ? 2 : 1);

        // 撃破判定
        const willBeDefeated = (monster.currentHp - damageDealt) <= 0;
        // モンスターごとのコールバック（ID付き）
        onChordCorrect(monster.chordTarget, isSpecialAttack, damageDealt, willBeDefeated, monster.id);
      });

      setGameState(prevState => {
        // SPが3溜まっている状態で攻撃したかどうか
        const isSpecialAttack = prevState.playerSp >= 3;
        // SPアタックならSPを0に、そうでなければ+1（上限は3）
        const newPlayerSp = isSpecialAttack ? 0 : Math.min(prevState.playerSp + 1, 3);
        
        // モンスターの状態を更新
        const updatedMonsters = prevState.activeMonsters.map(monster => {
          const wasCorrect = correctMonsters.find(m => m.id === monster.id);
          if (wasCorrect) {
            const baseDamage = Math.floor(Math.random() * (currentStage.maxDamage - currentStage.minDamage + 1)) + currentStage.minDamage;
            const damageDealt = baseDamage * (isSpecialAttack ? 2 : 1);
            const newHp = Math.max(0, monster.currentHp - damageDealt);
            
            // 倒されていない場合は新しいコードを割り当て
            if (newHp > 0) {
              let nextChord;
              if (currentStage.mode === 'single') {
                // ランダムモード：前回と異なるコードを選択
                nextChord = selectRandomChord(currentStage.allowedChords, monster.chordTarget.id);
              } else {
                // コード進行モード：ループさせる
                const progression = currentStage.chordProgression || [];
                const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
                nextChord = getProgressionChord(progression, nextIndex);
              }
              
              return {
                ...monster,
                currentHp: newHp,
                gauge: 0, // 攻撃されたモンスターのゲージはリセット
                correctNotes: [], // 正解したのでリセット
                chordTarget: nextChord || monster.chordTarget // 新しいコードを割り当て
              };
            }
            
            return {
              ...monster,
              currentHp: newHp,
              gauge: 0, // 攻撃されたモンスターのゲージはリセット
              correctNotes: [] // 正解したのでリセット
            };
          }
          return {
            ...monster,
            correctNotes: [] // 他のモンスターの正解音もリセット
          };
        });
        
        // 倒されたモンスターを除外
        const remainingMonsters = updatedMonsters.filter(m => m.currentHp > 0);
        const defeatedCount = updatedMonsters.length - remainingMonsters.length;
        
        // 新しいモンスターを補充
        let newMonsters = [...remainingMonsters];
        const availablePositions = ['A', 'B', 'C'].filter(pos => 
          !remainingMonsters.some(m => m.position === pos)
        );
        
        for (let i = 0; i < defeatedCount && prevState.monsterQueue.length > 0; i++) {
          const monsterIndex = prevState.monsterQueue[0];
          const position = availablePositions[i] || 'B';
          const newMonster = createMonsterFromQueue(
            monsterIndex,
            position as 'A' | 'B' | 'C',
            prevState.maxEnemyHp,
            prevState.currentStage!.allowedChords
          );
          newMonsters.push(newMonster);
          prevState.monsterQueue.shift();
        }
        
        // 位置を再調整（モンスター数に応じて）
        if (newMonsters.length < prevState.simultaneousMonsterCount && prevState.monsterQueue.length === 0) {
          const positions = assignPositions(newMonsters.length);
          newMonsters = newMonsters.map((m, i) => ({
            ...m,
            position: positions[i]
          }));
        }
        
        // 互換性のため最初のモンスターの情報を更新
        const firstMonster = newMonsters[0];
        
        return {
          ...prevState,
          correctAnswers: prevState.correctAnswers + correctMonsters.length,
          score: prevState.score + (1000 * correctMonsters.length),
          playerSp: newPlayerSp,
          activeMonsters: newMonsters,
          enemiesDefeated: prevState.enemiesDefeated + defeatedCount,
          // 互換性維持
          currentEnemyHp: firstMonster ? firstMonster.currentHp : 0,
          enemyGauge: 0,
          correctNotes: [],
          isWaitingForNextMonster: false
        };
      });
      
      setInputBuffer([]);
      
      // 全モンスター撃破チェック
      setTimeout(() => {
        if (gameState.enemiesDefeated + correctMonsters.filter(m => m.currentHp <= 0).length >= gameState.totalEnemies) {
          // ゲームクリア処理
          onGameComplete('clear', gameState);
        }
        // 次の問題への移行は削除（個別に処理するため）
      }, 100);
      
    } else if (isMistake) {
      // ミスタッチ（どのモンスターのコードにも該当しない音）
      devLog.debug('❌ ミスタッチ!', { inputNotes: notes });
      
      // エラー音やエフェクトをここで処理
      onChordIncorrect(gameState.activeMonsters[0]?.chordTarget || CHORD_DEFINITIONS['C'], notes);
      
      // 入力バッファをクリア
      setInputBuffer([]);
    } else {
      devLog.debug('🎵 まだ構成音が足りません', { 
        inputNotes: notes,
        message: '音を追加してください'
      });
    }
  }, [gameState, onChordCorrect, onChordIncorrect, onGameStateChange, proceedToNextQuestion, onGameComplete]);
  
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
        nextChord = selectRandomChord(prevState.currentStage.allowedChords, prevState.currentChordTarget?.id);
      } else {
        const progression = prevState.currentStage?.chordProgression || [];
        const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
        nextChord = getProgressionChord(progression, nextIndex);
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
    
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setInputBuffer([]);
  }, [enemyGaugeTimer, inputTimeout]);
  
  // ステージ変更時の初期化
  useEffect(() => {
    if (stage) {
      initializeGame(stage);
    }
  }, [stage, initializeGame]);
  
  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      if (enemyGaugeTimer) {
        devLog.debug('⏰ 敵ゲージタイマー クリーンアップで停止');
        clearInterval(enemyGaugeTimer);
      }
      if (inputTimeout) {
        devLog.debug('⏰ 入力タイムアウト クリーンアップで停止');
        clearTimeout(inputTimeout);
      }
    };
  }, []);
  

  
  return {
    gameState,
    inputBuffer,
    handleNoteInput,
    initializeGame,
    stopGame,
    proceedToNextEnemy,
    
    // ヘルパー関数もエクスポート
    checkChordMatch,
    selectRandomChord,
    getProgressionChord,
    getCurrentEnemy,
    CHORD_DEFINITIONS,
    ENEMY_LIST
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps, MonsterState };
export { CHORD_DEFINITIONS, ENEMY_LIST, getCurrentEnemy };