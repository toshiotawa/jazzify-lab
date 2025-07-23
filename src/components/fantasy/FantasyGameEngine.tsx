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

// 状態異常の型定義
type StatusAilment = 'burn' | 'freeze' | 'paralysis' | null;

interface StatusAilmentInfo {
  type: StatusAilment;
  duration: number; // 残り秒数
  startTime: number; // 開始時刻
}

// モンスター個体の情報
interface MonsterInstance {
  id: string;
  index: number;
  hp: number;
  maxHp: number;
  attackGauge: number;
  statusAilment: StatusAilmentInfo | null;
  defenseShields: number; // 防御シールドの数（最大5）
  isHealer: boolean;
  isBoss: boolean;
  position: 'A' | 'B' | 'C'; // 列の位置
  icon: string;
  name: string;
}

// 攻撃魔法の型定義
type AttackMagicType = 'fire' | 'ice' | 'lightning';
type PlayerMagicType = 'protect' | 'hyper_heal' | 'aegis_protection';

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
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  // 新規追加フィールド
  simultaneousMonsters: number;
  hasBoss: boolean;
  hasHealer: boolean;
  playerMaxHp: number;
  enemyMinDamage: number;
  enemyMaxDamage: number;
}

interface FantasyGameState {
  currentStage: FantasyStage | null;
  currentQuestionIndex: number;
  currentChordTarget: ChordDefinition | null;
  playerHp: number;
  playerMaxHp: number;
  enemyGauge: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  // 複数敵システム用（改修）
  monsters: MonsterInstance[];
  enemiesDefeated: number;
  totalEnemies: number;
  // 正解した音と待機状態を追跡
  correctNotes: number[];
  isWaitingForNextMonster: boolean;
  playerSp: number; // SPゲージ (0-5に拡張)
  // 現在の魔法タイプ
  currentAttackMagic: AttackMagicType;
  lastMissTime: number; // 最後のミスタッチ時刻
}

interface FantasyGameEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: FantasyGameState) => void;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeatedMonsterIds: string[], magicType: AttackMagicType | PlayerMagicType) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: FantasyGameState) => void;
  onEnemyAttack: (monsterId: string, damage: number, attackType: 'normal' | 'heal' | 'defense') => void;
  onMissTouch: () => void;
  onStatusAilmentApplied: (monsterId: string, ailment: StatusAilment) => void;
  onPlayerShieldAdded: (shieldCount: number) => void;
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
  'D7': { id: 'D7', displayName: 'D7', notes: [62, 66, 69, 72], quality: 'dominant7', root: 'D' },
  
  // Allの場合はすべてのコードを使用可能
  'All': { id: 'All', displayName: 'All', notes: [], quality: 'all', root: 'All' }
};

// ===== 敵リスト定義（拡張） =====

const ENEMY_LIST = [
  { id: 'vampire', icon: 'vampire', name: 'ドラキュラ' },
  { id: 'monster', icon: 'monster', name: '怪獣' },
  { id: 'reaper', icon: 'reaper', name: '死神' },
  { id: 'kraken', icon: 'kraken', name: 'クラーケン' },
  { id: 'werewolf', icon: 'werewolf', name: '狼男' },
  { id: 'demon', icon: 'demon', name: '魔王' },
  { id: 'healer', icon: 'sparkles', name: 'ヒーラー' },
  { id: 'dragon', icon: 'fire', name: 'ドラゴン' },
  { id: 'ice_queen', icon: 'snowflake', name: '氷の女王' },
  { id: 'thunder_bird', icon: 'zap', name: '雷鳥' }
];

// ===== ヘルパー関数 =====

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
 * ミスタッチ判定（表示されているコードのどれでもない音を弾いた場合）
 */
const checkMissTouch = (inputNote: number, targetChord: ChordDefinition): boolean => {
  const inputNoteMod12 = inputNote % 12;
  const targetNotesMod12 = [...new Set(targetChord.notes.map(note => note % 12))];
  
  // ターゲットコードに含まれない音ならミスタッチ
  return !targetNotesMod12.includes(inputNoteMod12);
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
  // "All"の場合、すべてのコードから選択（"All"自体は除外）
  if (allowedChords.includes('All')) {
    const allChordIds = Object.keys(CHORD_DEFINITIONS).filter(id => id !== 'All');
    allowedChords = allChordIds;
  }
  
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
 * 現在の敵情報を取得（削除予定）
 */
const getCurrentEnemy = (enemyIndex: number) => {
  if (enemyIndex >= 0 && enemyIndex < ENEMY_LIST.length) {
    return ENEMY_LIST[enemyIndex];
  }
  return ENEMY_LIST[0]; // フォールバック
};

/**
 * モンスターをランダムに選択
 */
const getRandomMonster = (excludeIds: string[] = []): typeof ENEMY_LIST[0] => {
  const availableMonsters = ENEMY_LIST.filter(m => !excludeIds.includes(m.id));
  if (availableMonsters.length === 0) return ENEMY_LIST[0];
  
  const randomIndex = Math.floor(Math.random() * availableMonsters.length);
  return availableMonsters[randomIndex];
};

/**
 * ボスモンスターを取得
 */
const getBossMonster = (): typeof ENEMY_LIST[0] => {
  const bosses = ['demon', 'dragon'];
  const bossId = bosses[Math.floor(Math.random() * bosses.length)];
  return ENEMY_LIST.find(m => m.id === bossId) || ENEMY_LIST[5];
};

/**
 * ヒーラーモンスターを取得
 */
const getHealerMonster = (): typeof ENEMY_LIST[0] => {
  return ENEMY_LIST.find(m => m.id === 'healer') || ENEMY_LIST[6];
};

/**
 * 状態異常の効果を適用
 */
const applyStatusAilmentEffects = (
  baseDamage: number,
  baseGaugeSpeed: number,
  ailment: StatusAilmentInfo | null,
  isReceivingDamage: boolean = false
): { damage: number; gaugeSpeed: number } => {
  if (!ailment) return { damage: baseDamage, gaugeSpeed: baseGaugeSpeed };
  
  switch (ailment.type) {
    case 'burn':
      // やけど: 与ダメージを3割アップ
      return { damage: Math.floor(baseDamage * 1.3), gaugeSpeed: baseGaugeSpeed };
    case 'freeze':
      // こおり: 敵の攻撃ゲージが溜まる速度を1/2に
      return { damage: baseDamage, gaugeSpeed: baseGaugeSpeed * 0.5 };
    case 'paralysis':
      // まひ: 敵から受けるダメージを半分に
      if (isReceivingDamage) {
        return { damage: Math.floor(baseDamage * 0.5), gaugeSpeed: baseGaugeSpeed };
      }
      return { damage: baseDamage, gaugeSpeed: baseGaugeSpeed };
    default:
      return { damage: baseDamage, gaugeSpeed: baseGaugeSpeed };
  }
};

/**
 * 魔法タイプをランダムに選択
 */
const selectRandomMagicType = (): AttackMagicType => {
  const types: AttackMagicType[] = ['fire', 'ice', 'lightning'];
  return types[Math.floor(Math.random() * types.length)];
};

/**
 * プレイヤー魔法をランダムに選択
 */
const selectRandomPlayerMagic = (isSpecial: boolean): PlayerMagicType | null => {
  if (isSpecial) {
    const specialMagics: PlayerMagicType[] = ['hyper_heal', 'aegis_protection'];
    return specialMagics[Math.floor(Math.random() * specialMagics.length)];
  } else {
    // 通常攻撃の場合、たまにプロテクトを使用
    return Math.random() < 0.3 ? 'protect' : null;
  }
};

// ===== メインコンポーネント =====

export const useFantasyGameEngine = ({
  stage,
  onGameStateChange,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  onMissTouch,
  onStatusAilmentApplied,
  onPlayerShieldAdded
}: FantasyGameEngineProps) => {
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    currentQuestionIndex: 0,
    currentChordTarget: CHORD_DEFINITIONS['CM7'], // デフォルト値を設定
    playerHp: 100,
    playerMaxHp: 100,
    enemyGauge: 0,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    // 複数敵システム用
    monsters: [],
    enemiesDefeated: 0,
    totalEnemies: 5,
    correctNotes: [],
    playerSp: 0, // SPゲージ初期化
    isWaitingForNextMonster: false,
    currentAttackMagic: selectRandomMagicType(),
    lastMissTime: 0
  });
  
  const [enemyGaugeTimers, setEnemyGaugeTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [statusAilmentTimers, setStatusAilmentTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  const [playerShields, setPlayerShields] = useState<number>(0);
  
  // ゲーム初期化
  const initializeGame = useCallback((stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 最初のコードを取得
    const firstChord = stage.mode === 'single' 
                  ? selectRandomChord(stage.allowedChords)
      : getProgressionChord(stage.chordProgression || [], 0);
    if (!firstChord) {
      devLog.debug('❌ 最初のコードが見つかりません');
      return;
    }

    // 新しいステージ定義から値を取得
    const totalEnemies = stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = totalEnemies * enemyHp;
    const simultaneousMonsters = stage.simultaneousMonsters || 1;
    
    // 初期モンスターを生成
    const initialMonsters: MonsterInstance[] = [];
    const positions: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    
    for (let i = 0; i < Math.min(simultaneousMonsters, totalEnemies); i++) {
      let monsterData;
      
      // ボスステージの場合、最初のモンスターをボスにする
      if (stage.hasBoss && i === 0) {
        monsterData = getBossMonster();
      } else if (stage.hasHealer && i === 1) {
        // ヒーラーステージの場合、2体目をヒーラーにする
        monsterData = getHealerMonster();
      } else {
        monsterData = getRandomMonster(initialMonsters.map(m => m.id));
      }
      
      const monster: MonsterInstance = {
        id: `monster_${i}_${Date.now()}`,
        index: i,
        hp: stage.hasBoss && i === 0 ? enemyHp * 2 : enemyHp, // ボスはHP2倍
        maxHp: stage.hasBoss && i === 0 ? enemyHp * 2 : enemyHp,
        attackGauge: 0,
        statusAilment: null,
        defenseShields: 0,
        isHealer: monsterData.id === 'healer',
        isBoss: stage.hasBoss && i === 0,
        position: positions[i],
        icon: monsterData.icon,
        name: monsterData.name
      };
      
      initialMonsters.push(monster);
    }

    const newState: FantasyGameState = {
      currentStage: stage,
      currentQuestionIndex: 0,
      currentChordTarget: firstChord,
      playerHp: stage.playerMaxHp || stage.maxHp,
      playerMaxHp: stage.playerMaxHp || stage.maxHp,
      enemyGauge: 0,
      score: 0,
      totalQuestions: totalQuestions,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      monsters: initialMonsters,
      enemiesDefeated: 0,
      totalEnemies: totalEnemies,
      correctNotes: [],
      playerSp: 0,
      isWaitingForNextMonster: false,
      currentAttackMagic: selectRandomMagicType(),
      lastMissTime: 0
    };

    setGameState(newState);
    onGameStateChange(newState);
    setPlayerShields(0);

    devLog.debug('✅ ゲーム初期化完了:', {
      stage: stage.name,
      totalEnemies,
      enemyHp,
      totalQuestions,
      simultaneousMonsters,
      initialMonsters: initialMonsters.length
    });
  }, [onGameStateChange]);
  
  // 次の問題への移行（回答数ベース、ループ対応）
  const proceedToNextQuestion = useCallback(() => {
    setGameState(prevState => {
      const nextCorrectAnswers = prevState.correctAnswers;
      const isComplete = nextCorrectAnswers >= prevState.totalQuestions; // 回答数でクリア判定
      
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
          currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
          currentChordTarget: nextChord,
          enemyGauge: 0, // ゲージリセット
          correctNotes: [], // 新しいコードでリセット
          currentAttackMagic: selectRandomMagicType() // 新しい魔法タイプを選択
        };
        
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [onGameStateChange, onGameComplete]);
  
  // 敵の攻撃処理（複数敵対応）
  const handleEnemyAttack = useCallback((monsterId: string) => {
    // 攻撃時に入力バッファをリセット
    setInputBuffer([]);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setGameState(prevState => {
      const attackingMonster = prevState.monsters.find(m => m.id === monsterId);
      if (!attackingMonster || !prevState.currentStage) return prevState;
      
      let damage = 0;
      let attackType: 'normal' | 'heal' | 'defense' = 'normal';
      
      // ヒーラーの行動判定
      if (attackingMonster.isHealer) {
        // 一番HPの少ない味方を探す
        const mostDamagedAlly = prevState.monsters
          .filter(m => m.hp > 0 && m.id !== monsterId)
          .sort((a, b) => a.hp - b.hp)[0];
        
        if (mostDamagedAlly && mostDamagedAlly.hp < mostDamagedAlly.maxHp * 0.5) {
          // 味方のHP回復
          attackType = 'heal';
          const healAmount = Math.floor(mostDamagedAlly.maxHp * 0.25);
          
          const updatedMonsters = prevState.monsters.map(m => {
            if (m.id === mostDamagedAlly.id) {
              return { ...m, hp: Math.min(m.hp + healAmount, m.maxHp) };
            }
            return m;
          });
          
          // 攻撃ゲージをリセット
          const finalMonsters = updatedMonsters.map(m => {
            if (m.id === monsterId) {
              return { ...m, attackGauge: 0 };
            }
            return m;
          });
          
          const nextState = {
            ...prevState,
            monsters: finalMonsters
          };
          
          onEnemyAttack(monsterId, healAmount, attackType);
          onGameStateChange(nextState);
          return nextState;
        }
      }
      
      // 通常攻撃または防御
      if (Math.random() < 0.2) { // 20%の確率で防御
        attackType = 'defense';
        
        // 自分に防御シールドを追加
        const updatedMonsters = prevState.monsters.map(m => {
          if (m.id === monsterId) {
            return { 
              ...m, 
              attackGauge: 0,
              defenseShields: Math.min(m.defenseShields + 1, 5)
            };
          }
          return m;
        });
        
        const nextState = {
          ...prevState,
          monsters: updatedMonsters
        };
        
        onEnemyAttack(monsterId, 0, attackType);
        onGameStateChange(nextState);
        return nextState;
      }
      
      // 通常攻撃
      const baseDamage = Math.floor(
        Math.random() * (prevState.currentStage.enemyMaxDamage - prevState.currentStage.enemyMinDamage + 1) + 
        prevState.currentStage.enemyMinDamage
      );
      
      // ボスの場合は2倍ダメージ
      let finalDamage = attackingMonster.isBoss ? baseDamage * 2 : baseDamage;
      
      // まひ状態の場合はダメージ半減
      const ailmentEffects = applyStatusAilmentEffects(finalDamage, 1, attackingMonster.statusAilment, true);
      finalDamage = ailmentEffects.damage;
      
      // プレイヤーのシールドでダメージを防ぐ
      if (playerShields > 0) {
        finalDamage = 0;
        setPlayerShields(prev => Math.max(0, prev - 1));
      }
      
      const newHp = Math.max(0, prevState.playerHp - finalDamage);
      
      devLog.debug('💥 敵の攻撃！HP更新:', {
        monsterId,
        attackingMonster: attackingMonster.name,
        oldHp: prevState.playerHp,
        newHp: newHp,
        damage: finalDamage,
        hasShield: playerShields > 0
      });
      
      const isGameOver = newHp <= 0;
      
      // 攻撃したモンスターのゲージをリセット
      const updatedMonsters = prevState.monsters.map(m => {
        if (m.id === monsterId) {
          return { ...m, attackGauge: 0 };
        }
        return m;
      });
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          monsters: updatedMonsters,
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
        const nextState = {
          ...prevState,
          playerHp: newHp,
          monsters: updatedMonsters
        };
        
        onEnemyAttack(monsterId, finalDamage, attackType);
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [onGameStateChange, onGameComplete, onEnemyAttack, inputTimeout, playerShields]);
  
  // ゲージタイマーの管理（複数敵対応）
  useEffect(() => {
    devLog.debug('🎮 ゲージタイマー状態チェック:', { 
      isGameActive: gameState.isGameActive, 
      hasTimers: enemyGaugeTimers.size,
      currentStage: gameState.currentStage?.stageNumber,
      monstersCount: gameState.monsters.length
    });
    
    // 既存のタイマーをクリア
    enemyGaugeTimers.forEach(timer => clearInterval(timer));
    setEnemyGaugeTimers(new Map());
    
    // ゲームがアクティブな場合のみ新しいタイマーを開始
    if (gameState.isGameActive && gameState.currentStage) {
      const newTimers = new Map<string, NodeJS.Timeout>();
      
      gameState.monsters.forEach(monster => {
        if (monster.hp > 0) {
          devLog.debug('⏰ モンスターゲージタイマー開始:', monster.name);
          const timer = setInterval(() => {
            updateEnemyGauge(monster.id);
          }, 100); // 100ms間隔で更新
          newTimers.set(monster.id, timer);
        }
      });
      
      setEnemyGaugeTimers(newTimers);
    }
    
    // クリーンアップ
    return () => {
      enemyGaugeTimers.forEach(timer => clearInterval(timer));
    };
  }, [gameState.isGameActive, gameState.currentStage, gameState.monsters.length]); // モンスター数の変更も監視
  
  // 敵ゲージの更新（個別モンスター対応）
  const updateEnemyGauge = useCallback((monsterId: string) => {
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage) {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブ');
        return prevState;
      }
      
      const monster = prevState.monsters.find(m => m.id === monsterId);
      if (!monster || monster.hp <= 0) {
        devLog.debug('⏰ ゲージ更新スキップ: モンスター不在またはHP0');
        return prevState;
      }
      
      const baseSpeed = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      
      // 状態異常の効果を適用
      const ailmentEffects = applyStatusAilmentEffects(1, baseSpeed, monster.statusAilment);
      const incrementRate = ailmentEffects.gaugeSpeed;
      
      const newGauge = monster.attackGauge + incrementRate;
      
      devLog.debug('⚡ モンスターゲージ更新:', { 
        monsterId,
        monsterName: monster.name,
        currentGauge: monster.attackGauge.toFixed(1), 
        newGauge: newGauge.toFixed(1), 
        incrementRate: incrementRate.toFixed(2),
        hasAilment: !!monster.statusAilment
      });
      
      if (newGauge >= 100) {
        // ゲージ満タン -> 敵の攻撃
        devLog.debug('💥 モンスターゲージ満タン！攻撃開始:', monster.name);
        // 攻撃処理を非同期で実行
        setTimeout(() => handleEnemyAttack(monsterId), 0);
        
        // ゲージをリセット（攻撃処理内でもリセットされるが念のため）
        const updatedMonsters = prevState.monsters.map(m => {
          if (m.id === monsterId) {
            return { ...m, attackGauge: 0 };
          }
          return m;
        });
        
        const nextState = { ...prevState, monsters: updatedMonsters };
        onGameStateChange(nextState);
        return nextState;
      } else {
        const updatedMonsters = prevState.monsters.map(m => {
          if (m.id === monsterId) {
            return { ...m, attackGauge: newGauge };
          }
          return m;
        });
        
        const nextState = { ...prevState, monsters: updatedMonsters };
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [handleEnemyAttack, onGameStateChange]);
  
  // 状態異常タイマーの管理
  useEffect(() => {
    // 既存のタイマーをクリア
    statusAilmentTimers.forEach(timer => clearInterval(timer));
    setStatusAilmentTimers(new Map());
    
    if (!gameState.isGameActive) return;
    
    const newTimers = new Map<string, NodeJS.Timeout>();
    
    gameState.monsters.forEach(monster => {
      if (monster.statusAilment && monster.hp > 0) {
        const timer = setInterval(() => {
          updateStatusAilment(monster.id);
        }, 1000); // 1秒ごとに更新
        newTimers.set(monster.id, timer);
      }
    });
    
    setStatusAilmentTimers(newTimers);
    
    return () => {
      statusAilmentTimers.forEach(timer => clearInterval(timer));
    };
  }, [gameState.isGameActive, gameState.monsters]);
  
  // 状態異常の時間更新
  const updateStatusAilment = useCallback((monsterId: string) => {
    setGameState(prevState => {
      const updatedMonsters = prevState.monsters.map(monster => {
        if (monster.id === monsterId && monster.statusAilment) {
          const newDuration = monster.statusAilment.duration - 1;
          
          if (newDuration <= 0) {
            // 状態異常解除
            return { ...monster, statusAilment: null };
          } else {
            // 時間を減少
            return {
              ...monster,
              statusAilment: {
                ...monster.statusAilment,
                duration: newDuration
              }
            };
          }
        }
        return monster;
      });
      
      const nextState = { ...prevState, monsters: updatedMonsters };
      onGameStateChange(nextState);
      return nextState;
    });
  }, [onGameStateChange]);
  
  // ノート入力処理（ミスタッチ判定追加）
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || !gameState.currentChordTarget) return;
    
    devLog.debug('🎵 ノート入力受信:', { note, currentChord: gameState.currentChordTarget.displayName });
    
    // ミスタッチ判定
    if (checkMissTouch(note, gameState.currentChordTarget)) {
      devLog.debug('❌ ミスタッチ検出!');
      
      // ミスタッチ処理
      handleMissTouch();
      return;
    }
    
    // 入力バッファに追加
    setInputBuffer(prevBuffer => {
      const newBuffer = [...prevBuffer, note];
      devLog.debug('🎵 入力バッファ更新:', { newBuffer, bufferSize: newBuffer.length });
      
      // 正解した音を更新
      const correctNotes = getCorrectNotes(newBuffer, gameState.currentChordTarget!);
      setGameState(prevState => ({
        ...prevState,
        correctNotes: correctNotes
      }));
      onGameStateChange({
        ...gameState,
        correctNotes: correctNotes
      });
      
      // 入力タイムアウトをリセット
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
      
      // 自動判定タイマー（500msに延長 - 和音が完成するまで待機）
      const timeout = setTimeout(() => {
        devLog.debug('⏰ 自動判定タイマー発動');
        checkCurrentInput(newBuffer);
        // 正解の場合のみバッファをクリア（checkCurrentInput内で処理）
      }, 500);
      
      setInputTimeout(timeout);
      
      // 即座に判定も試行（構成音数が満たされた場合）
      if (gameState.currentChordTarget && newBuffer.length >= gameState.currentChordTarget.notes.length) {
        devLog.debug('🎯 構成音数達成 - 即座に判定');
        setTimeout(() => {
          clearTimeout(timeout);
          const isCorrectImmediate = checkChordMatch(newBuffer, gameState.currentChordTarget!);
          if (isCorrectImmediate) {
            checkCurrentInput(newBuffer);
            setInputBuffer([]);
          }
          // 不正解の場合は何もせず、音の積み重ねを継続
        }, 100);
      }
      
      return newBuffer;
    });
  }, [gameState.isGameActive, gameState.currentChordTarget, inputTimeout, onGameStateChange]);
  
  // ミスタッチ処理
  const handleMissTouch = useCallback(() => {
    const currentTime = Date.now();
    
    setGameState(prevState => {
      // 全ての敵の攻撃ゲージを2秒分進める
      const updatedMonsters = prevState.monsters.map(monster => {
        if (monster.hp > 0 && prevState.currentStage) {
          const baseSpeed = 100 / prevState.currentStage.enemyGaugeSeconds;
          const twoSecondsWorth = baseSpeed * 2;
          return {
            ...monster,
            attackGauge: Math.min(100, monster.attackGauge + twoSecondsWorth)
          };
        }
        return monster;
      });
      
      // SPゲージを0にリセット
      const nextState = {
        ...prevState,
        monsters: updatedMonsters,
        playerSp: 0,
        lastMissTime: currentTime
      };
      
      onGameStateChange(nextState);
      return nextState;
    });
    
    // 入力バッファをクリア
    setInputBuffer([]);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    onMissTouch();
  }, [onGameStateChange, onMissTouch, inputTimeout]);
  
  // 現在の入力を判定（複数敵対応）
  const checkCurrentInput = useCallback((notes: number[]) => {
    if (!gameState.currentChordTarget || notes.length === 0) {
      devLog.debug('❌ 判定スキップ: コードなしまたは入力なし', { hasChord: !!gameState.currentChordTarget, inputCount: notes.length });
      return;
    }
    
    devLog.debug('🎯 コード判定実行中...', { 
      targetChord: gameState.currentChordTarget.displayName,
      inputNotes: notes,
      inputCount: notes.length 
    });
    
    const isCorrect = checkChordMatch(notes, gameState.currentChordTarget);
    
    if (isCorrect) {
      devLog.debug('✅ 正解判定!', { chord: gameState.currentChordTarget.displayName });
      
      const currentStage = gameState.currentStage;
      if (!currentStage) return;

      // SPが5溜まっている状態で攻撃するとスペシャルアタック
      const isSpecialAttack = gameState.playerSp >= 5;
      
      // プレイヤー魔法をランダムに選択
      const playerMagic = selectRandomPlayerMagic(isSpecialAttack);

      // プレイヤー魔法の処理
      if (playerMagic === 'protect') {
        // プロテクト: シールド1つ追加
        setPlayerShields(prev => Math.min(prev + 1, 5));
        onPlayerShieldAdded(1);
      } else if (playerMagic === 'hyper_heal') {
        // ハイパーヒール: 最大HPの50%回復
        const healAmount = Math.floor(gameState.playerMaxHp * 0.5);
        setGameState(prevState => ({
          ...prevState,
          playerHp: Math.min(prevState.playerHp + healAmount, prevState.playerMaxHp)
        }));
      } else if (playerMagic === 'aegis_protection') {
        // イージスプロテクション: シールド3つ追加
        setPlayerShields(prev => Math.min(prev + 3, 5));
        onPlayerShieldAdded(3);
      }

      // 攻撃処理（プレイヤー魔法でない場合）
      if (!playerMagic || isSpecialAttack) {
        // ダメージ計算
        const baseDamage = Math.floor(Math.random() * (currentStage.maxDamage - currentStage.minDamage + 1)) + currentStage.minDamage;
        const damageMultiplier = isSpecialAttack ? 2 : 1;
        
        const defeatedMonsterIds: string[] = [];
        
        if (isSpecialAttack) {
          // SPアタック: 全ての敵に攻撃
          const updatedMonsters = gameState.monsters.map(monster => {
            if (monster.hp > 0) {
              // 状態異常の効果を適用
              const ailmentEffects = applyStatusAilmentEffects(baseDamage * damageMultiplier, 1, monster.statusAilment);
              let finalDamage = ailmentEffects.damage;
              
              // 防御シールドでダメージを軽減
              if (monster.defenseShields > 0) {
                finalDamage = 0;
                return {
                  ...monster,
                  defenseShields: monster.defenseShields - 1,
                  attackGauge: 0 // 攻撃ゲージリセット
                };
              }
              
              const newHp = Math.max(0, monster.hp - finalDamage);
              if (newHp === 0) {
                defeatedMonsterIds.push(monster.id);
              }
              
              return {
                ...monster,
                hp: newHp,
                attackGauge: 0 // 攻撃ゲージリセット
              };
            }
            return monster;
          });
          
          setGameState(prevState => ({
            ...prevState,
            monsters: updatedMonsters,
            enemiesDefeated: prevState.enemiesDefeated + defeatedMonsterIds.length,
            correctAnswers: prevState.correctAnswers + 1,
            score: prevState.score + 2000, // SPアタックはボーナス点
            playerSp: 0, // SPを0にリセット
          }));
          
        } else {
          // 通常攻撃: 最初の生きている敵に攻撃
          const targetMonster = gameState.monsters.find(m => m.hp > 0);
          
          if (targetMonster) {
            // 状態異常の効果を適用
            const ailmentEffects = applyStatusAilmentEffects(baseDamage, 1, targetMonster.statusAilment);
            let finalDamage = ailmentEffects.damage;
            
            // 防御シールドでダメージを軽減
            if (targetMonster.defenseShields > 0) {
              finalDamage = 0;
            }
            
            // 状態異常付与判定（30%の確率）
            let newAilment = targetMonster.statusAilment;
            if (!newAilment && Math.random() < 0.3) {
              const ailmentType = gameState.currentAttackMagic === 'fire' ? 'burn' :
                                gameState.currentAttackMagic === 'ice' ? 'freeze' :
                                'paralysis';
              
              newAilment = {
                type: ailmentType as StatusAilment,
                duration: 10,
                startTime: Date.now()
              };
              
              onStatusAilmentApplied(targetMonster.id, ailmentType as StatusAilment);
            }
            
            const updatedMonsters = gameState.monsters.map(monster => {
              if (monster.id === targetMonster.id) {
                const newHp = Math.max(0, monster.hp - finalDamage);
                if (newHp === 0) {
                  defeatedMonsterIds.push(monster.id);
                }
                
                return {
                  ...monster,
                  hp: newHp,
                  statusAilment: newAilment,
                  defenseShields: targetMonster.defenseShields > 0 ? targetMonster.defenseShields - 1 : 0
                };
              }
              return monster;
            });
            
            setGameState(prevState => ({
              ...prevState,
              monsters: updatedMonsters,
              enemiesDefeated: defeatedMonsterIds.length > 0 ? prevState.enemiesDefeated + 1 : prevState.enemiesDefeated,
              correctAnswers: prevState.correctAnswers + 1,
              score: prevState.score + 1000,
              playerSp: Math.min(prevState.playerSp + 1, 5), // SPを+1（上限5）
            }));
          }
        }
        
        // 魔法タイプを決定（プレイヤー魔法がある場合はそれ、なければ攻撃魔法）
        const magicType = playerMagic || gameState.currentAttackMagic;
        
        onChordCorrect(gameState.currentChordTarget, isSpecialAttack, baseDamage * damageMultiplier, defeatedMonsterIds, magicType);
      } else {
        // プレイヤー魔法のみの場合
        onChordCorrect(gameState.currentChordTarget, false, 0, [], playerMagic);
        
        setGameState(prevState => ({
          ...prevState,
          correctAnswers: prevState.correctAnswers + 1,
          score: prevState.score + 500,
          playerSp: Math.min(prevState.playerSp + 1, 5),
        }));
      }
      
      setInputBuffer([]);
      
      // 全ての敵を倒したかチェック
      const remainingMonsters = gameState.monsters.filter(m => {
        if (defeatedMonsterIds.includes(m.id)) return false;
        return m.hp > 0;
      });
      
      if (remainingMonsters.length === 0) {
        // 新しいモンスターをスポーン
        setTimeout(() => spawnNewMonsters(), 1000);
      } else {
        // 次の問題へ
        setTimeout(proceedToNextQuestion, 100);
      }
      
    } else {
      devLog.debug('🎵 まだ構成音が足りません', { 
        targetChord: gameState.currentChordTarget.displayName,
        inputNotes: notes,
        message: '音を追加してください'
      });
    }
  }, [gameState, onChordCorrect, onGameStateChange, proceedToNextQuestion, onStatusAilmentApplied, onPlayerShieldAdded, playerShields]);
  
  // 新しいモンスターをスポーンする
  const spawnNewMonsters = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.currentStage) return prevState;
      
      const remainingEnemies = prevState.totalEnemies - prevState.enemiesDefeated;
      if (remainingEnemies <= 0) {
        // ゲームクリア
        const finalState = {
          ...prevState,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'clear' as const
        };
        
        onGameComplete('clear', finalState);
        return finalState;
      }
      
      // 新しいモンスターを生成
      const newMonsterCount = Math.min(prevState.currentStage.simultaneousMonsters || 1, remainingEnemies);
      const newMonsters: MonsterInstance[] = [];
      const positions: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
      
      for (let i = 0; i < newMonsterCount; i++) {
        const monsterData = getRandomMonster(newMonsters.map(m => m.id));
        
        const monster: MonsterInstance = {
          id: `monster_${prevState.enemiesDefeated + i}_${Date.now()}`,
          index: i,
          hp: prevState.currentStage.enemyHp,
          maxHp: prevState.currentStage.enemyHp,
          attackGauge: 0,
          statusAilment: null,
          defenseShields: 0,
          isHealer: monsterData.id === 'healer',
          isBoss: false,
          position: positions[i],
          icon: monsterData.icon,
          name: monsterData.name
        };
        
        newMonsters.push(monster);
      }
      
      const nextState = {
        ...prevState,
        monsters: newMonsters,
        isWaitingForNextMonster: false
      };
      
      onGameStateChange(nextState);
      return nextState;
    });
  }, [onGameStateChange, onGameComplete]);
  
  // 次の敵へ進むための新しい関数（削除予定）
  const proceedToNextEnemy = useCallback(() => {
    devLog.debug('ENGINE: 進行要求を受信。次の敵と問題を用意します。');
    // 新しいマルチモンスターシステムでは不要
  }, []);
  
  // ゲーム停止
  const stopGame = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameActive: false
    }));
    
    // すべてのタイマーをクリア
    enemyGaugeTimers.forEach(timer => clearInterval(timer));
    setEnemyGaugeTimers(new Map());
    
    statusAilmentTimers.forEach(timer => clearInterval(timer));
    setStatusAilmentTimers(new Map());
    
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setInputBuffer([]);
  }, [enemyGaugeTimers, statusAilmentTimers, inputTimeout]);
  
  // ステージ変更時の初期化
  useEffect(() => {
    if (stage) {
      initializeGame(stage);
    }
  }, [stage, initializeGame]);
  
  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      enemyGaugeTimers.forEach(timer => {
        devLog.debug('⏰ 敵ゲージタイマー クリーンアップで停止');
        clearInterval(timer);
      });
      statusAilmentTimers.forEach(timer => {
        devLog.debug('⏰ 状態異常タイマー クリーンアップで停止');
        clearInterval(timer);
      });
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
    playerShields,
    
    // ヘルパー関数もエクスポート
    checkChordMatch,
    selectRandomChord,
    getProgressionChord,
    getCurrentEnemy,
    CHORD_DEFINITIONS,
    ENEMY_LIST
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps, MonsterInstance, StatusAilment, AttackMagicType, PlayerMagicType };
export { CHORD_DEFINITIONS, ENEMY_LIST, getCurrentEnemy };