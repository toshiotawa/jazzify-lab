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
  showGuide: boolean;
  monsterIcon: string;
  bgmUrl?: string;
  // 新しいプロパティ
  simultaneousMonsters: number; // 同時出現モンスター数 (1-3)
  hasBoss: boolean;            // ボスステージかどうか
  hasHealer: boolean;          // ヒーラーが含まれるか
  playerMaxHp: number;         // プレイヤーの最大HP
  enemyMinDamage: number;      // 敵の最小ダメージ
  enemyMaxDamage: number;      // 敵の最大ダメージ
}

// モンスターの個別状態
interface MonsterState {
  id: string;                  // 一意のID
  position: number;            // 表示位置 (0, 1, 2)
  hp: number;                  // 現在のHP
  maxHp: number;              // 最大HP
  attackGauge: number;        // 攻撃ゲージ (0-100)
  chordDefinition: ChordDefinition; // このモンスターのコード
  correctNotes: number[];     // 正解した音のリスト
  isHealer: boolean;          // ヒーラーかどうか
  isBoss: boolean;            // ボスかどうか
  shields: number;            // 防御シールドの数 (0-5)
  statusEffect?: {            // 状態異常
    type: 'burn' | 'freeze' | 'paralysis';
    remainingTime: number;    // 残り時間（秒）
  };
}

// プレイヤーの攻撃タイプ
type AttackType = 'fire' | 'ice' | 'thunder' | 'normal' | 'protect' | 'hyper_heal' | 'aegis_protection';

interface FantasyGameState {
  currentStage: FantasyStage | null;
  currentQuestionIndex: number;
  playerHp: number;
  playerMaxHp: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  enemiesDefeated: number;
  totalEnemies: number;
  playerSp: number; // SPゲージ (0-5)
  playerShields: number; // プレイヤーのシールド数 (0-5)
  // 複数モンスター管理
  activeMonsters: MonsterState[];
  monsterQueue: ChordDefinition[]; // 待機中のモンスター
  isWaitingForNextMonster: boolean;
  inputBuffer: number[]; // 入力中の音符バッファ
}

interface FantasyGameEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: FantasyGameState) => void;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, attackType: AttackType) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: FantasyGameState) => void;
  onEnemyAttack: (damage: number, enemyId: string) => void;
  onPlayerHeal?: (amount: number) => void;
  onStatusEffect?: (monsterId: string, effect: 'burn' | 'freeze' | 'paralysis') => void;
  onMonsterHeal?: (monsterId: string, amount: number) => void;
  onMissTouch?: () => void; // ミスタッチ時のコールバック
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
  'B7': { id: 'B7', displayName: 'B7', notes: [71, 75, 78, 81], quality: 'dominant7', root: 'B' },
  'E7': { id: 'E7', displayName: 'E7', notes: [64, 68, 71, 74], quality: 'dominant7', root: 'E' },
  'A7': { id: 'A7', displayName: 'A7', notes: [69, 73, 76, 79], quality: 'dominant7', root: 'A' },
  'D7': { id: 'D7', displayName: 'D7', notes: [62, 66, 69, 72], quality: 'dominant7', root: 'D' },
  
  // マイナー7th
  'Am7': { id: 'Am7', displayName: 'Am7', notes: [57, 60, 64, 67], quality: 'minor7', root: 'A' },
  'Dm7': { id: 'Dm7', displayName: 'Dm7', notes: [62, 65, 69, 72], quality: 'minor7', root: 'D' },
  'Em7': { id: 'Em7', displayName: 'Em7', notes: [64, 67, 71, 74], quality: 'minor7', root: 'E' },
  
  // メジャー7th
  'CM7': { id: 'CM7', displayName: 'CM7', notes: [60, 64, 67, 71], quality: 'major7', root: 'C' },
  'FM7': { id: 'FM7', displayName: 'FM7', notes: [65, 69, 72, 76], quality: 'major7', root: 'F' },
  'GM7': { id: 'GM7', displayName: 'GM7', notes: [67, 71, 74, 78], quality: 'major7', root: 'G' },
  
  // 6thコード
  'C6': { id: 'C6', displayName: 'C6', notes: [60, 64, 67, 69], quality: '6', root: 'C' },
  'Cm6': { id: 'Cm6', displayName: 'Cm6', notes: [60, 63, 67, 69], quality: 'm6', root: 'C' },
  
  // 9thコード
  'C9': { id: 'C9', displayName: 'C9', notes: [60, 64, 67, 70, 74], quality: '9', root: 'C' },
  'Cm9': { id: 'Cm9', displayName: 'Cm9', notes: [60, 63, 67, 70, 74], quality: 'm9', root: 'C' },
  
  // 11th, 13thコード
  'C11': { id: 'C11', displayName: 'C11', notes: [60, 64, 67, 70, 74, 77], quality: '11', root: 'C' },
  'C13': { id: 'C13', displayName: 'C13', notes: [60, 64, 67, 70, 74, 77, 81], quality: '13', root: 'C' }
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

// ===== ユーティリティ関数 =====

/**
 * ランダムコード選択（前回と異なるコードを優先）
 */
const selectRandomChord = (allowedChords: string[], previousChordId?: string): ChordDefinition | null => {
  if (allowedChords.length === 0) return null;
  
  // "All"の場合は全てのコード定義から選択
  let availableChordIds = allowedChords;
  if (allowedChords.length === 1 && allowedChords[0] === 'All') {
    availableChordIds = Object.keys(CHORD_DEFINITIONS);
  }
  
  // 許可されたコード定義を取得
  let availableChords = availableChordIds
    .map(id => CHORD_DEFINITIONS[id])
    .filter(chord => chord != null);
  
  if (availableChords.length === 0) return null;
  
  // 前回と異なるコードを優先的に選択
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
const getProgressionChord = (progression: string[], questionIndex: number): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const chordId = progression[questionIndex % progression.length];
  return CHORD_DEFINITIONS[chordId] || null;
};

/**
 * モンスターIDを生成
 */
const generateMonsterId = (): string => {
  return `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 攻撃タイプをランダムに選択
 */
const selectRandomAttackType = (): AttackType => {
  const normalAttacks: AttackType[] = ['fire', 'ice', 'thunder', 'normal', 'protect'];
  const spAttacks: AttackType[] = ['hyper_heal', 'aegis_protection'];
  
  // 通常攻撃とSP攻撃の選択は別の場所で行うため、ここでは通常攻撃のみ
  return normalAttacks[Math.floor(Math.random() * normalAttacks.length)];
};

/**
 * ダメージ計算（状態異常を考慮）
 */
const calculateDamage = (baseDamage: number, attackType: AttackType, statusEffect?: MonsterState['statusEffect']): number => {
  let damage = baseDamage;
  
  // 炎属性で「やけど」状態の場合、ダメージ30%アップ
  if (attackType === 'fire' && statusEffect?.type === 'burn') {
    damage = Math.floor(damage * 1.3);
  }
  
  return damage;
};

// ===== メインコンポーネント =====

export const useFantasyGameEngine = ({
  stage,
  onGameStateChange,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  onPlayerHeal,
  onStatusEffect,
  onMonsterHeal,
  onMissTouch
}: FantasyGameEngineProps) => {
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    currentQuestionIndex: 0,
    playerHp: 5,
    playerMaxHp: 5,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    enemiesDefeated: 0,
    totalEnemies: 0,
    playerSp: 0,
    playerShields: 0,
    activeMonsters: [],
    monsterQueue: [],
    isWaitingForNextMonster: false,
    inputBuffer: []
  });
  
  const [enemyGaugeTimers, setEnemyGaugeTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [statusEffectTimers, setStatusEffectTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // モンスターをスポーンする
  const spawnMonsters = useCallback((stage: FantasyStage, count: number, existingMonsters: MonsterState[] = []): MonsterState[] => {
    const monsters: MonsterState[] = [];
    const usedPositions = existingMonsters.map(m => m.position);
    
    for (let i = 0; i < count; i++) {
      // 使用可能な位置を探す
      const availablePositions = [0, 1, 2].filter(p => !usedPositions.includes(p));
      if (availablePositions.length === 0) break;
      
      const position = availablePositions[0];
      usedPositions.push(position);
      
      // コードを選択
      const chord = stage.mode === 'single'
        ? selectRandomChord(stage.allowedChords)
        : getProgressionChord(stage.chordProgression || [], gameState.currentQuestionIndex + i);
      
      if (!chord) continue;
      
      // ボスかヒーラーかを決定
      const isBoss = stage.hasBoss && i === 0; // 最初のモンスターをボスに
      const isHealer = stage.hasHealer && !isBoss && i === 1; // 2番目をヒーラーに
      
      const monster: MonsterState = {
        id: generateMonsterId(),
        position,
        hp: isBoss ? stage.enemyHp * 2 : stage.enemyHp, // ボスはHP2倍
        maxHp: isBoss ? stage.enemyHp * 2 : stage.enemyHp,
        attackGauge: 0,
        chordDefinition: chord,
        correctNotes: [],
        isHealer,
        isBoss,
        shields: 0
      };
      
      monsters.push(monster);
    }
    
    return monsters;
  }, [gameState.currentQuestionIndex]);
  
  // ゲーム初期化
  const initializeGame = useCallback((stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーゲーム初期化:', { stage: stage.name });

    // 初期モンスターをスポーン
    const initialMonsters = spawnMonsters(stage, Math.min(stage.simultaneousMonsters, stage.enemyCount));
    
    const totalEnemies = stage.enemyCount;
    const enemyHp = stage.enemyHp;
    const totalQuestions = totalEnemies; // モンスター数がクエスチョン数

    const newState: FantasyGameState = {
      currentStage: stage,
      currentQuestionIndex: 0,
      playerHp: stage.playerMaxHp,
      playerMaxHp: stage.playerMaxHp,
      score: 0,
      totalQuestions: totalQuestions,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      enemiesDefeated: 0,
      totalEnemies: totalEnemies,
      playerSp: 0,
      playerShields: 0,
      activeMonsters: initialMonsters,
      monsterQueue: [],
      isWaitingForNextMonster: false,
      inputBuffer: []
    };

    setGameState(newState);
    onGameStateChange(newState);

    devLog.debug('✅ ゲーム初期化完了:', {
      stage: stage.name,
      totalEnemies,
      enemyHp,
      initialMonsters: initialMonsters.length
    });
  }, [spawnMonsters, onGameStateChange]);
  
  // 敵の攻撃処理
  const handleEnemyAttack = useCallback((monsterId: string) => {
    setInputBuffer([]);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setGameState(prevState => {
      const monster = prevState.activeMonsters.find(m => m.id === monsterId);
      if (!monster) return prevState;
      
      // ダメージ計算
      const minDamage = prevState.currentStage?.enemyMinDamage || 5;
      const maxDamage = prevState.currentStage?.enemyMaxDamage || 15;
      let damage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
      
      // ボスは2倍ダメージ
      if (monster.isBoss) {
        damage *= 2;
      }
      
      // 麻痺状態なら半分ダメージ
      if (monster.statusEffect?.type === 'paralysis') {
        damage = Math.floor(damage / 2);
      }
      
      // プレイヤーのシールドチェック
      let actualDamage = damage;
      let newShields = prevState.playerShields;
      if (prevState.playerShields > 0) {
        actualDamage = 0;
        newShields = prevState.playerShields - 1;
      }
      
      const newHp = Math.max(0, prevState.playerHp - actualDamage);
      
      devLog.debug('💥 敵の攻撃！', {
        monsterId,
        damage,
        actualDamage,
        shields: prevState.playerShields,
        newHp
      });
      
      // コールバック
      onEnemyAttack(actualDamage, monsterId);
      
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        // タイマーをクリア
        enemyGaugeTimers.forEach(timer => clearTimeout(timer));
        setEnemyGaugeTimers(new Map());
        
        const finalState = {
          ...prevState,
          playerHp: 0,
          playerShields: newShields,
          inputBuffer: [], // バッファクリア
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const,
          activeMonsters: prevState.activeMonsters.map(m =>
            m.id === monsterId ? { ...m, attackGauge: 0 } : m
          )
        };
        
        setTimeout(() => {
          onGameComplete('gameover', finalState);
        }, 100);
        
        return finalState;
      } else {
        // 攻撃後はゲージリセット
        return {
          ...prevState,
          playerHp: newHp,
          playerShields: newShields,
          inputBuffer: [], // バッファクリア
          activeMonsters: prevState.activeMonsters.map(m =>
            m.id === monsterId ? { ...m, attackGauge: 0 } : m
          )
        };
      }
    });
  }, [onEnemyAttack, onGameComplete, enemyGaugeTimers, inputTimeout]);
  
  // モンスターのヒール処理
  const handleMonsterHeal = useCallback((healerId: string) => {
    setGameState(prevState => {
      const healer = prevState.activeMonsters.find(m => m.id === healerId);
      if (!healer || !healer.isHealer) return prevState;
      
      // 最もHPが少ないモンスターを探す
      let targetMonster = prevState.activeMonsters[0];
      let lowestHpRatio = 1;
      
      prevState.activeMonsters.forEach(monster => {
        const hpRatio = monster.hp / monster.maxHp;
        if (hpRatio < lowestHpRatio) {
          lowestHpRatio = hpRatio;
          targetMonster = monster;
        }
      });
      
      if (!targetMonster || targetMonster.hp >= targetMonster.maxHp) {
        // ヒール不要
        return {
          ...prevState,
          activeMonsters: prevState.activeMonsters.map(m =>
            m.id === healerId ? { ...m, attackGauge: 0 } : m
          )
        };
      }
      
      // HP1/4回復
      const healAmount = Math.floor(targetMonster.maxHp / 4);
      const newHp = Math.min(targetMonster.maxHp, targetMonster.hp + healAmount);
      
      devLog.debug('💚 モンスターヒール！', {
        healerId,
        targetId: targetMonster.id,
        healAmount,
        newHp
      });
      
      onMonsterHeal?.(targetMonster.id, healAmount);
      
      return {
        ...prevState,
        activeMonsters: prevState.activeMonsters.map(m => {
          if (m.id === targetMonster.id) {
            return { ...m, hp: newHp };
          } else if (m.id === healerId) {
            return { ...m, attackGauge: 0 };
          }
          return m;
        })
      };
    });
  }, [onMonsterHeal]);
  
  // モンスター撃破処理
  const handleMonsterDefeat = useCallback((monster: MonsterState, allMonsters: MonsterState[]) => {
    const isSpecialAttack = gameState.playerSp >= 5;
    const attackType = isSpecialAttack ? 'hyper_heal' : selectRandomAttackType();
    
    // ダメージ計算
    let damageDealt = 1; // デフォルト
    if (attackType === 'protect') {
      // プロテクトの場合はシールド追加
      setGameState(prev => ({
        ...prev,
        playerShields: Math.min(5, prev.playerShields + 1),
        inputBuffer: [] // バッファクリア
      }));
      damageDealt = 0;
    } else {
      damageDealt = calculateDamage(1, attackType, monster.statusEffect);
    }
    
    // モンスターのシールドチェック
    let actualDamage = damageDealt;
    let newShields = monster.shields;
    if (monster.shields > 0 && damageDealt > 0) {
      actualDamage = 0;
      newShields = monster.shields - 1;
    }
    
    const newHp = Math.max(0, monster.hp - actualDamage);
    const defeated = newHp <= 0;
    
    // 状態異常付与（30%の確率）
    let newStatusEffect = monster.statusEffect;
    if (Math.random() < 0.3 && !monster.statusEffect) {
      if (attackType === 'fire') {
        newStatusEffect = { type: 'burn', remainingTime: 10 };
        onStatusEffect?.(monster.id, 'burn');
      } else if (attackType === 'ice') {
        newStatusEffect = { type: 'freeze', remainingTime: 10 };
        onStatusEffect?.(monster.id, 'freeze');
      } else if (attackType === 'thunder') {
        newStatusEffect = { type: 'paralysis', remainingTime: 10 };
        onStatusEffect?.(monster.id, 'paralysis');
      }
    }
    
    // SP攻撃の処理
    if (isSpecialAttack) {
      if (attackType === 'hyper_heal') {
        // 最大HPの50%回復
        const healAmount = Math.floor(gameState.playerMaxHp / 2);
        const newPlayerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + healAmount);
        setGameState(prev => ({ ...prev, playerHp: newPlayerHp, inputBuffer: [] }));
        onPlayerHeal?.(healAmount);
      } else if (attackType === 'aegis_protection') {
        // シールド3つ追加
        setGameState(prev => ({
          ...prev,
          playerShields: Math.min(5, prev.playerShields + 3),
          inputBuffer: []
        }));
      }
      
      // 全モンスターの攻撃ゲージリセット＆ダメージ
      setGameState(prevState => ({
        ...prevState,
        playerSp: 0,
        inputBuffer: [],
        activeMonsters: prevState.activeMonsters.map(m => ({
          ...m,
          attackGauge: 0,
          hp: Math.max(0, m.hp - 1) // 全体1ダメージ
        })).filter(m => m.hp > 0),
        correctAnswers: prevState.correctAnswers + 1,
        enemiesDefeated: prevState.enemiesDefeated + prevState.activeMonsters.filter(m => m.hp - 1 <= 0).length,
        score: prevState.score + 100 * prevState.activeMonsters.filter(m => m.hp - 1 <= 0).length
      }));
    } else {
      // 通常攻撃
      setGameState(prevState => {
        const updatedMonsters = allMonsters.map(m => {
          if (m.id === monster.id) {
            return {
              ...m,
              hp: newHp,
              shields: newShields,
              correctNotes: [],
              statusEffect: newStatusEffect
            };
          }
          return m;
        }).filter(m => m.hp > 0);
        
        // 新しいモンスターをスポーンする必要があるか
        const remainingCount = prevState.totalEnemies - prevState.enemiesDefeated - (defeated ? 1 : 0);
        const needSpawn = updatedMonsters.length < Math.min(prevState.currentStage!.simultaneousMonsters, remainingCount);
        
        if (needSpawn && remainingCount > 0) {
          const spawnCount = Math.min(
            prevState.currentStage!.simultaneousMonsters - updatedMonsters.length,
            remainingCount
          );
          const newMonsters = spawnMonsters(prevState.currentStage!, spawnCount, updatedMonsters);
          updatedMonsters.push(...newMonsters);
        }
        
        // ゲームクリアチェック
        const newEnemiesDefeated = prevState.enemiesDefeated + (defeated ? 1 : 0);
        const isComplete = newEnemiesDefeated >= prevState.totalEnemies;
        
        if (isComplete) {
          // タイマーをクリア
          enemyGaugeTimers.forEach(timer => clearTimeout(timer));
          setEnemyGaugeTimers(new Map());
          
          const finalState = {
            ...prevState,
            activeMonsters: updatedMonsters,
            correctAnswers: prevState.correctAnswers + 1,
            enemiesDefeated: newEnemiesDefeated,
            score: prevState.score + (defeated ? 100 : 10),
            playerSp: Math.min(5, prevState.playerSp + 1),
            inputBuffer: [],
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const
          };
          
          setTimeout(() => {
            onGameComplete('clear', finalState);
          }, 100);
          
          return finalState;
        }
        
        return {
          ...prevState,
          activeMonsters: updatedMonsters,
          correctAnswers: prevState.correctAnswers + 1,
          enemiesDefeated: newEnemiesDefeated,
          score: prevState.score + (defeated ? 100 : 10),
          playerSp: Math.min(5, prevState.playerSp + 1),
          inputBuffer: []
        };
      });
    }
    
    // コールバック
    onChordCorrect(monster.chordDefinition, isSpecialAttack, damageDealt, defeated, attackType);
  }, [gameState, spawnMonsters, onChordCorrect, onPlayerHeal, onStatusEffect, onGameComplete, enemyGaugeTimers]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || gameState.isWaitingForNextMonster) return;
    
    devLog.debug('🎹 ノート入力:', { note });
    
    // 入力タイムアウトをリセット
    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }
    
    const newBuffer = [...gameState.inputBuffer, note];
    
    // 各モンスターのコードと照合
    let matchFound = false;
    let missTouch = false;
    const updatedMonsters = gameState.activeMonsters.map(monster => {
      const targetNotes = monster.chordDefinition.notes;
      
      // この音がこのモンスターのコードに含まれるか
      if (targetNotes.includes(note)) {
        matchFound = true;
        
        // まだ演奏していない音なら追加
        if (!monster.correctNotes.includes(note)) {
          const newCorrectNotes = [...monster.correctNotes, note];
          
          // 全ての音を演奏したか
          if (newCorrectNotes.length === targetNotes.length) {
            // 攻撃処理は後で行う
            return { ...monster, correctNotes: newCorrectNotes, toAttack: true };
          }
          
          return { ...monster, correctNotes: newCorrectNotes };
        }
      }
      
      return monster;
    });
    
    // どのモンスターのコードにも含まれない音 = ミスタッチ
    if (!matchFound) {
      missTouch = true;
      devLog.debug('❌ ミスタッチ！');
      
      // ミスタッチ処理
      onMissTouch?.();
      
      // 全モンスターの攻撃ゲージを2秒分進める
      setGameState(prevState => ({
        ...prevState,
        playerSp: 0, // SPゲージリセット
        inputBuffer: [], // バッファクリア
        activeMonsters: prevState.activeMonsters.map(monster => ({
          ...monster,
          attackGauge: Math.min(100, monster.attackGauge + 20) // 2秒分 = 20%
        }))
      }));
      
      return;
    }
    
    // 攻撃処理
    const attackingMonsters = updatedMonsters.filter(m => (m as any).toAttack);
    if (attackingMonsters.length > 0) {
      attackingMonsters.forEach(monster => {
        handleMonsterDefeat(monster, updatedMonsters);
      });
    } else {
      setGameState(prevState => ({
        ...prevState,
        activeMonsters: updatedMonsters,
        inputBuffer: newBuffer
      }));
      
      // 入力タイムアウトを設定（1秒後にバッファクリア）
      const timeout = setTimeout(() => {
        setGameState(prevState => ({
          ...prevState,
          inputBuffer: []
        }));
      }, 1000);
      setInputTimeout(timeout);
    }
  }, [gameState, inputTimeout, onMissTouch, handleMonsterDefeat]);
  
  // 敵の攻撃ゲージ更新
  useEffect(() => {
    if (!gameState.isGameActive) return;
    
    const timers = new Map<string, NodeJS.Timeout>();
    
    gameState.activeMonsters.forEach(monster => {
      const updateGauge = () => {
        setGameState(prevState => {
          const currentMonster = prevState.activeMonsters.find(m => m.id === monster.id);
          if (!currentMonster) return prevState;
          
          // ゲージ増加速度を計算
          let gaugeIncrement = 100 / (prevState.currentStage?.enemyGaugeSeconds || 5);
          
          // 氷結状態なら半分の速度
          if (currentMonster.statusEffect?.type === 'freeze') {
            gaugeIncrement /= 2;
          }
          
          const newGauge = Math.min(100, currentMonster.attackGauge + gaugeIncrement);
          
          // 100%に達したら攻撃
          if (newGauge >= 100) {
            // ヒーラーの場合は回復行動（50%の確率）
            if (currentMonster.isHealer && Math.random() < 0.5) {
              handleMonsterHeal(monster.id);
            } 
            // 通常モンスターの防御行動（20%の確率）
            else if (!currentMonster.isHealer && Math.random() < 0.2) {
              // 防御行動：シールドを追加
              setGameState(prev => ({
                ...prev,
                activeMonsters: prev.activeMonsters.map(m =>
                  m.id === monster.id 
                    ? { ...m, attackGauge: 0, shields: Math.min(5, m.shields + 1) }
                    : m
                )
              }));
              devLog.debug('🛡️ モンスター防御！', { monsterId: monster.id });
            } else {
              // 通常攻撃
              handleEnemyAttack(monster.id);
            }
            return prevState; // ゲージは各ハンドラー内でリセットされるため
          }
          
          return {
            ...prevState,
            activeMonsters: prevState.activeMonsters.map(m =>
              m.id === monster.id ? { ...m, attackGauge: newGauge } : m
            )
          };
        });
      };
      
      const timer = setInterval(updateGauge, 100);
      timers.set(monster.id, timer);
    });
    
    setEnemyGaugeTimers(timers);
    
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [gameState.activeMonsters.length, gameState.isGameActive, gameState.currentStage, handleEnemyAttack, handleMonsterHeal]);
  
  // 状態異常タイマー
  useEffect(() => {
    const timers = new Map<string, NodeJS.Timeout>();
    
    gameState.activeMonsters.forEach(monster => {
      if (monster.statusEffect) {
        const timer = setInterval(() => {
          setGameState(prevState => {
            const currentMonster = prevState.activeMonsters.find(m => m.id === monster.id);
            if (!currentMonster || !currentMonster.statusEffect) return prevState;
            
            const newRemainingTime = currentMonster.statusEffect.remainingTime - 0.1;
            
            if (newRemainingTime <= 0) {
              // 状態異常解除
              return {
                ...prevState,
                activeMonsters: prevState.activeMonsters.map(m =>
                  m.id === monster.id ? { ...m, statusEffect: undefined } : m
                )
              };
            }
            
            return {
              ...prevState,
              activeMonsters: prevState.activeMonsters.map(m =>
                m.id === monster.id
                  ? { ...m, statusEffect: { ...currentMonster.statusEffect!, remainingTime: newRemainingTime } }
                  : m
              )
            };
          });
        }, 100);
        
        timers.set(monster.id, timer);
      }
    });
    
    setStatusEffectTimers(timers);
    
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [gameState.activeMonsters.map(m => m.statusEffect).join(',')]);
  
  // ゲーム開始
  useEffect(() => {
    if (stage && !gameState.isGameActive) {
      initializeGame(stage);
    }
  }, [stage, gameState.isGameActive, initializeGame]);
  
  // 状態変更通知
  useEffect(() => {
    onGameStateChange(gameState);
  }, [gameState, onGameStateChange]);
  
  return {
    gameState,
    handleNoteInput,
    initializeGame
  };
};

// ===== エクスポート =====

export type { ChordDefinition, FantasyStage, FantasyGameState, MonsterState, AttackType };
export { CHORD_DEFINITIONS };