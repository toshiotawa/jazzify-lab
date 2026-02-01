/**
 * サバイバルモード ステージ選択画面
 * Easy/Normal/Hard/Extreme の4つの難易度から選択
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalDifficulty, DifficultyConfig } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

// 難易度設定
const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
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

// 色設定
const DIFFICULTY_COLORS: Record<SurvivalDifficulty, { bg: string; border: string; text: string }> = {
  easy: {
    bg: 'from-green-600 to-green-800',
    border: 'border-green-400',
    text: 'text-green-300',
  },
  normal: {
    bg: 'from-blue-600 to-blue-800',
    border: 'border-blue-400',
    text: 'text-blue-300',
  },
  hard: {
    bg: 'from-orange-600 to-orange-800',
    border: 'border-orange-400',
    text: 'text-orange-300',
  },
  extreme: {
    bg: 'from-red-600 to-red-800',
    border: 'border-red-400',
    text: 'text-red-300',
  },
};

interface HighScore {
  survivalTime: number;
  finalLevel: number;
  enemiesDefeated: number;
}

interface SurvivalStageSelectProps {
  onStageSelect: (difficulty: SurvivalDifficulty, config: DifficultyConfig) => void;
  onBackToMenu: () => void;
}

const SurvivalStageSelect: React.FC<SurvivalStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  // ハイスコア（将来的にはSupabaseから取得）
  const [highScores, setHighScores] = useState<Record<SurvivalDifficulty, HighScore | null>>({
    easy: null,
    normal: null,
    hard: null,
    extreme: null,
  });

  // ローカルストレージからハイスコアを読み込み
  useEffect(() => {
    const loadHighScores = () => {
      try {
        const saved = localStorage.getItem('survival_high_scores');
        if (saved) {
          setHighScores(JSON.parse(saved));
        }
      } catch {
        // エラー時は初期値のまま
      }
    };
    loadHighScores();
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-y-auto">
      {/* ヘッダー */}
      <div className="relative z-10 p-4 sm:p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-mono tracking-wider">
              🎮 SURVIVAL MODE
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-mono">
              {isEnglishCopy 
                ? 'Survive as long as you can against endless enemies!'
                : '迫りくる敵から生き残れ！'}
            </p>
          </div>
          <button
            onClick={onBackToMenu}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            {isEnglishCopy ? 'Back' : '戻る'}
          </button>
        </div>
      </div>

      {/* 難易度カード */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {DIFFICULTY_CONFIGS.map((config) => {
            const colors = DIFFICULTY_COLORS[config.difficulty];
            const score = highScores[config.difficulty];

            return (
              <div
                key={config.difficulty}
                className={cn(
                  'relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
                  colors.border,
                  'bg-gradient-to-br',
                  colors.bg
                )}
              >
                {/* カード内容 */}
                <div className="p-6">
                  {/* 難易度名 */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-wider">
                      {config.displayName}
                    </h2>
                    <div className={cn('text-4xl', colors.text)}>
                      {config.difficulty === 'easy' && '⭐'}
                      {config.difficulty === 'normal' && '⭐⭐'}
                      {config.difficulty === 'hard' && '⭐⭐⭐'}
                      {config.difficulty === 'extreme' && '💀'}
                    </div>
                  </div>

                  {/* 説明 */}
                  <p className="text-gray-200 text-sm mb-4 font-mono">
                    {isEnglishCopy ? (
                      config.difficulty === 'easy' ? 'Beginner friendly. Basic major/minor chords only.' :
                      config.difficulty === 'normal' ? 'Standard difficulty. Seventh chords added.' :
                      config.difficulty === 'hard' ? 'Advanced. Complex chords and fast enemies.' :
                      'Expert level. All chord types, ultra fast.'
                    ) : config.description}
                  </p>

                  {/* ハイスコア */}
                  <div className="bg-black/30 rounded-lg p-3 mb-4">
                    <div className="text-xs text-gray-400 mb-2 font-mono">
                      {isEnglishCopy ? 'HIGH SCORE' : 'ハイスコア'}
                    </div>
                    {score ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className={cn('text-lg font-bold font-mono', colors.text)}>
                            {formatTime(score.survivalTime)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {isEnglishCopy ? 'Time' : '生存時間'}
                          </div>
                        </div>
                        <div>
                          <div className={cn('text-lg font-bold font-mono', colors.text)}>
                            Lv.{score.finalLevel}
                          </div>
                          <div className="text-xs text-gray-400">
                            {isEnglishCopy ? 'Level' : 'レベル'}
                          </div>
                        </div>
                        <div>
                          <div className={cn('text-lg font-bold font-mono', colors.text)}>
                            {score.enemiesDefeated}
                          </div>
                          <div className="text-xs text-gray-400">
                            {isEnglishCopy ? 'Kills' : '撃破数'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center font-mono">
                        {isEnglishCopy ? 'No record yet' : '記録なし'}
                      </div>
                    )}
                  </div>

                  {/* スタートボタン */}
                  <button
                    onClick={() => onStageSelect(config.difficulty, config)}
                    className={cn(
                      'w-full py-3 rounded-lg font-bold text-lg font-mono transition-all',
                      'bg-white/20 hover:bg-white/30 border-2',
                      colors.border,
                      'hover:shadow-lg'
                    )}
                  >
                    {isEnglishCopy ? 'START' : 'スタート'}
                  </button>
                </div>

                {/* 装飾的なグリッド線 */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(to right, white 1px, transparent 1px),
                      linear-gradient(to bottom, white 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作説明 */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-4xl mx-auto bg-black/40 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3 font-mono">
            {isEnglishCopy ? '🎮 CONTROLS' : '🎮 操作方法'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300 font-mono">
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
      <div className="text-center text-white text-xs sm:text-sm opacity-50 pb-6 font-mono">
        {isEnglishCopy 
          ? '🎹 Complete chords to unleash powerful attacks!'
          : '🎹 コードを完成させて強力な攻撃を放て！'}
      </div>
    </div>
  );
};

export default SurvivalStageSelect;
export { DIFFICULTY_CONFIGS, DIFFICULTY_COLORS };
