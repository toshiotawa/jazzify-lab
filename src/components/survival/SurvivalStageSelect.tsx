/**
 * サバイバルモード ステージ選択画面
 * Easy/Normal/Hard/Extreme の4つの難易度から選択
 * シンプルな縦並びカードデザイン
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalDifficulty, DifficultyConfig } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import {
  fetchSurvivalDifficultySettings,
  fetchUserSurvivalHighScores,
  SurvivalDifficultySettings,
  SurvivalHighScore,
} from '@/platform/supabaseSurvival';
import { FaSkull, FaStar, FaFire, FaBolt, FaCog } from 'react-icons/fa';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';

// デバッグモード用スキル一覧
const DEBUG_SKILLS = [
  { id: 'a_penetration', label: 'A列貫通', emoji: '🔫' },
  { id: 'a_back_bullet', label: 'A列後方弾', emoji: '↩️' },
  { id: 'a_right_bullet', label: 'A列右弾', emoji: '➡️' },
  { id: 'a_left_bullet', label: 'A列左弾', emoji: '⬅️' },
  { id: 'multi_hit', label: 'マルチヒット', emoji: '💥' },
  { id: 'magic_all', label: '全魔法解放', emoji: '🪄' },
] as const;

// デフォルト難易度設定（DB取得前のフォールバック）
const DEFAULT_DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    difficulty: 'easy',
    displayName: 'Easy',
    description: '初心者向け。基本的なメジャー・マイナーコードのみ。',
    allowedChords: ['C', 'G', 'Am', 'F', 'Dm', 'Em'],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.7,
    expMultiplier: 1.0,
    itemDropRate: 0.15,
  },
  {
    difficulty: 'normal',
    displayName: 'Normal',
    description: '標準的な難易度。セブンスコードが追加。',
    allowedChords: ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'G7', 'C7', 'Am7', 'Dm7'],
    enemySpawnRate: 2.5,
    enemySpawnCount: 3,
    enemyStatMultiplier: 1.0,
    expMultiplier: 1.5,
    itemDropRate: 0.12,
  },
  {
    difficulty: 'hard',
    displayName: 'Hard',
    description: '上級者向け。複雑なコードと高速な敵。',
    allowedChords: ['CM7', 'G7', 'Am7', 'Dm7', 'Em7', 'FM7', 'Bm7b5', 'E7', 'A7', 'D7'],
    enemySpawnRate: 2,
    enemySpawnCount: 4,
    enemyStatMultiplier: 1.3,
    expMultiplier: 2.0,
    itemDropRate: 0.10,
  },
  {
    difficulty: 'extreme',
    displayName: 'Extreme',
    description: 'エキスパート向け。全コードタイプ、超高速。',
    allowedChords: ['CM7', 'Dm7', 'Em7', 'FM7', 'G7', 'Am7', 'Bm7b5', 'Cmaj9', 'Dm9', 'G13'],
    enemySpawnRate: 1.5,
    enemySpawnCount: 5,
    enemyStatMultiplier: 1.6,
    expMultiplier: 3.0,
    itemDropRate: 0.08,
  },
];

// 難易度別アイコン設定
const DIFFICULTY_ICONS: Record<SurvivalDifficulty, React.ReactNode> = {
  easy: <FaStar className="text-3xl text-green-400" />,
  normal: <FaStar className="text-3xl text-blue-400" />,
  hard: <FaFire className="text-3xl text-orange-400" />,
  extreme: <FaSkull className="text-3xl text-red-400" />,
};

// 色設定
const DIFFICULTY_COLORS: Record<SurvivalDifficulty, { bg: string; border: string; gradient: string }> = {
  easy: {
    bg: 'bg-green-900/30',
    border: 'border-green-500',
    gradient: 'from-green-600 to-green-800',
  },
  normal: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500',
    gradient: 'from-blue-600 to-blue-800',
  },
  hard: {
    bg: 'bg-orange-900/30',
    border: 'border-orange-500',
    gradient: 'from-orange-600 to-orange-800',
  },
  extreme: {
    bg: 'bg-red-900/30',
    border: 'border-red-500',
    gradient: 'from-red-600 to-red-800',
  },
};

// 英語版説明文
const DIFFICULTY_DESCRIPTIONS_EN: Record<SurvivalDifficulty, string> = {
  easy: 'Beginner friendly. Basic major/minor chords only.',
  normal: 'Standard difficulty. Seventh chords added.',
  hard: 'Advanced. Complex chords and fast enemies.',
  extreme: 'Expert level. All chord types, ultra fast.',
};

export interface DebugSettings {
  aAtk?: number;
  bAtk?: number;
  skills?: string[];
  tapSkillActivation?: boolean;
}

interface SurvivalStageSelectProps {
  onStageSelect: (difficulty: SurvivalDifficulty, config: DifficultyConfig, debugSettings?: DebugSettings) => void;
  onBackToMenu: () => void;
}

const SurvivalStageSelect: React.FC<SurvivalStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
}) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  // 状態管理
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DEFAULT_DIFFICULTY_CONFIGS);
  const [highScores, setHighScores] = useState<Record<SurvivalDifficulty, SurvivalHighScore | null>>({
    easy: null,
    normal: null,
    hard: null,
    extreme: null,
  });
  const [loading, setLoading] = useState(true);
  
  // デバッグ設定用状態
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugDifficulty, setDebugDifficulty] = useState<SurvivalDifficulty | null>(null);
  const [debugAAtk, setDebugAAtk] = useState<number>(10);
  const [debugBAtk, setDebugBAtk] = useState<number>(20);
  const [debugSkills, setDebugSkills] = useState<string[]>([]);
  const [debugTapSkillActivation, setDebugTapSkillActivation] = useState(false);
  
  // データを読み込み
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 難易度設定を取得
      try {
        const settingsData = await fetchSurvivalDifficultySettings();
        if (settingsData.length > 0) {
          const configs = settingsData.map((s): DifficultyConfig => ({
            difficulty: s.difficulty,
            displayName: s.displayName,
            description: s.description || '',
            allowedChords: s.allowedChords,
            enemySpawnRate: s.enemySpawnRate,
            enemySpawnCount: s.enemySpawnCount,
            enemyStatMultiplier: s.enemyStatMultiplier,
            expMultiplier: s.expMultiplier,
            itemDropRate: s.itemDropRate,
          }));
          setDifficultyConfigs(configs);
        }
      } catch {
        // DB取得失敗時はデフォルト設定を使用
      }
      
      // ハイスコアを取得（ログインユーザーのみ）
      if (profile && !isGuest) {
        try {
          const scores = await fetchUserSurvivalHighScores(profile.id);
          const scoreMap: Record<SurvivalDifficulty, SurvivalHighScore | null> = {
            easy: null,
            normal: null,
            hard: null,
            extreme: null,
          };
          scores.forEach(score => {
            scoreMap[score.difficulty] = score;
          });
          setHighScores(scoreMap);
        } catch {
          // スコア取得失敗時は初期値を使用
        }
      } else {
        // ローカルストレージからハイスコアを読み込み（ゲスト用）
        try {
          const saved = localStorage.getItem('survival_high_scores');
          if (saved) {
            const parsed = JSON.parse(saved);
            const scoreMap: Record<SurvivalDifficulty, SurvivalHighScore | null> = {
              easy: null,
              normal: null,
              hard: null,
              extreme: null,
            };
            Object.entries(parsed).forEach(([key, value]) => {
              const diff = key as SurvivalDifficulty;
              if (value && typeof value === 'object') {
                const v = value as Record<string, unknown>;
                scoreMap[diff] = {
                  id: '',
                  userId: '',
                  difficulty: diff,
                  survivalTimeSeconds: Number(v.survivalTime) || 0,
                  finalLevel: Number(v.finalLevel) || 1,
                  enemiesDefeated: Number(v.enemiesDefeated) || 0,
                  createdAt: '',
                  updatedAt: '',
                };
              }
            });
            setHighScores(scoreMap);
          }
        } catch {
          // エラー時は初期値のまま
        }
      }
    } finally {
      setLoading(false);
    }
  }, [profile, isGuest]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 難易度設定を取得
  const getConfig = (difficulty: SurvivalDifficulty): DifficultyConfig => {
    return difficultyConfigs.find(c => c.difficulty === difficulty) || DEFAULT_DIFFICULTY_CONFIGS.find(c => c.difficulty === difficulty)!;
  };
  
  // デバッグモーダルを開く
  const openDebugModal = (difficulty: SurvivalDifficulty, e: React.MouseEvent) => {
    e.stopPropagation();
    setDebugDifficulty(difficulty);
    setDebugModalOpen(true);
  };
  
  // デバッグスキルのトグル
  const toggleDebugSkill = (skillId: string) => {
    setDebugSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
  };
  
  // デバッグ設定でゲーム開始
  const startWithDebugSettings = async () => {
    if (!debugDifficulty) return;
    
    try {
      await FantasySoundManager.unlock();
      await initializeAudioSystem();
    } catch {
      // エラーは無視
    }
    
    const config = getConfig(debugDifficulty);
    const debugSettings: DebugSettings = {
      aAtk: debugAAtk,
      bAtk: debugBAtk,
      skills: debugSkills,
      tapSkillActivation: debugTapSkillActivation,
    };
    
    setDebugModalOpen(false);
    onStageSelect(debugDifficulty, config, debugSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-y-auto fantasy-game-screen">
      {/* ヘッダー */}
      <div className="relative z-10 p-4 sm:p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-sans tracking-wider flex items-center gap-3">
              <FaBolt className="text-yellow-400" />
              <span>SURVIVAL MODE</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-sans">
              {isEnglishCopy 
                ? 'Survive as long as you can against endless enemies!'
                : '迫りくる敵から生き残れ！'}
            </p>
          </div>
          <button
            onClick={onBackToMenu}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base font-sans"
          >
            {isEnglishCopy ? 'Back' : '戻る'}
          </button>
        </div>
      </div>

      {/* 難易度カード - シンプルな縦並び */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {(['easy', 'normal', 'hard', 'extreme'] as const).map((difficulty) => {
            const config = getConfig(difficulty);
            const colors = DIFFICULTY_COLORS[difficulty];
            const score = highScores[difficulty];
            const icon = DIFFICULTY_ICONS[difficulty];

            return (
              <div
                key={difficulty}
                className={cn(
                  'w-full text-left rounded-xl border-2 overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-xl relative',
                  colors.border,
                  colors.bg,
                  'p-4 sm:p-5 flex items-center gap-4'
                )}
              >
                {/* デバッグ設定ボタン */}
                <button
                  onClick={(e) => openDebugModal(difficulty, e)}
                  className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-gray-400 hover:text-white transition-colors z-10"
                  title={isEnglishCopy ? 'Debug Settings' : 'デバッグ設定'}
                >
                  <FaCog className="text-sm" />
                </button>
                
                {/* メインボタン */}
                <button
                  onClick={async () => {
                    // iOS対応: ユーザージェスチャー内でAudioContextを初期化
                    try {
                      await FantasySoundManager.unlock();
                      await initializeAudioSystem();
                    } catch {
                      // エラーは無視してゲームを開始（音が出ない可能性あり）
                    }
                    onStageSelect(difficulty, config);
                  }}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  {/* アイコン */}
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/30 flex items-center justify-center">
                    {icon}
                  </div>
                  
                  {/* コンテンツ */}
                  <div className="flex-1 min-w-0 text-left">
                    {/* 難易度名 */}
                    <h2 className="text-xl sm:text-2xl font-bold font-sans text-white mb-1">
                      {config.displayName}
                    </h2>
                    
                    {/* 説明 */}
                    <p className="text-gray-300 text-sm font-sans line-clamp-1">
                      {isEnglishCopy ? DIFFICULTY_DESCRIPTIONS_EN[difficulty] : config.description}
                    </p>
                    
                    {/* ハイスコア */}
                    {score && score.survivalTimeSeconds > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="text-yellow-400 font-semibold">
                          🏆 {formatTime(score.survivalTimeSeconds)}
                        </span>
                        <span className="text-gray-400">
                          Lv.{score.finalLevel}
                        </span>
                        <span className="text-gray-400">
                          {score.enemiesDefeated} {isEnglishCopy ? 'kills' : '撃破'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 矢印 */}
                  <div className="flex-shrink-0 text-2xl text-gray-400">
                    ▶
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作説明 */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-2xl mx-auto bg-black/40 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3 font-sans">
            {isEnglishCopy ? '🎮 CONTROLS' : '🎮 操作方法'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300 font-sans">
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">W A S D</span>
              <span>{isEnglishCopy ? 'Move' : '移動'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">🎹</span>
              <span>{isEnglishCopy ? 'Play chords to attack' : 'コードを演奏して攻撃'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="text-center text-white text-xs sm:text-sm opacity-50 pb-6 font-sans">
        {isEnglishCopy 
          ? '🎹 Complete chords to unleash powerful attacks!'
          : '🎹 コードを完成させて強力な攻撃を放て！'}
      </div>
      
      {/* デバッグ設定モーダル */}
      {debugModalOpen && debugDifficulty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 rounded-xl border-2 border-gray-700 p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 font-sans">
              🛠️ {isEnglishCopy ? 'Debug Settings' : 'デバッグ設定'} ({debugDifficulty.toUpperCase()})
            </h3>
            
            {/* 攻撃力設定 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-sans">
                  🔫 A列攻撃力 (aAtk): {debugAAtk}
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={debugAAtk}
                  onChange={(e) => setDebugAAtk(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-sans">
                  👊 B列攻撃力 (bAtk): {debugBAtk}
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={debugBAtk}
                  onChange={(e) => setDebugBAtk(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* スキル選択 */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2 font-sans">
                ⚡ {isEnglishCopy ? 'Initial Skills' : '初期スキル'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEBUG_SKILLS.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => toggleDebugSkill(skill.id)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                      debugSkills.includes(skill.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {skill.emoji} {skill.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* タップでスキル発動 */}
            <div className="mb-6">
              <label className="flex items-center gap-3 text-gray-300 text-sm font-sans cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugTapSkillActivation}
                  onChange={(e) => setDebugTapSkillActivation(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                👆 {isEnglishCopy ? 'Tap to activate skills (no piano input)' : 'タップでスキル発動（ピアノ入力不要）'}
              </label>
            </div>
            
            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => setDebugModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-sans transition-colors"
              >
                {isEnglishCopy ? 'Cancel' : 'キャンセル'}
              </button>
              <button
                onClick={startWithDebugSettings}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-sans transition-colors"
              >
                {isEnglishCopy ? 'Start' : '開始'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurvivalStageSelect;
export { DEFAULT_DIFFICULTY_CONFIGS as DIFFICULTY_CONFIGS, DIFFICULTY_COLORS };
