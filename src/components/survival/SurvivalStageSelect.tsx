/**
 * サバイバルモード ステージ選択画面
 * 11キャラクター × 5難易度 = 55ステージ
 * 難易度別グループでキャラクターカードを表示
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import {
  fetchSurvivalDifficultySettings,
  fetchUserSurvivalHighScores,
  fetchSurvivalCharacters,
  SurvivalHighScore,
  SurvivalCharacterRow,
} from '@/platform/supabaseSurvival';
import { FaSkull, FaStar, FaFire, FaBolt } from 'react-icons/fa';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';

// デフォルト難易度設定（DB取得前のフォールバック）
const DEFAULT_DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    difficulty: 'veryeasy',
    displayName: 'Very Easy',
    description: '入門向け。単音ノーツのみで練習。',
    allowedChords: ['C_note', 'D_note', 'E_note', 'F_note', 'G_note', 'A_note', 'B_note'],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.8,
    expMultiplier: 0.5,
    itemDropRate: 0.20,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'easy',
    displayName: 'Easy',
    description: '初心者向け。基本的なメジャー・マイナーコードのみ。',
    allowedChords: ['C', 'G', 'Am', 'F', 'Dm', 'Em'],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 1.0,
    expMultiplier: 1.0,
    itemDropRate: 0.15,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
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
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'hard',
    displayName: 'Hard',
    description: '上級者向け。複雑なコードと高速な敵。',
    allowedChords: ['CM7', 'G7', 'Am7', 'Dm7', 'Em7', 'FM7', 'Bm7b5', 'E7', 'A7', 'D7'],
    enemySpawnRate: 2,
    enemySpawnCount: 4,
    enemyStatMultiplier: 1.0,
    expMultiplier: 2.0,
    itemDropRate: 0.10,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'extreme',
    displayName: 'Extreme',
    description: 'エキスパート向け。全コードタイプ、超高速。',
    allowedChords: ['CM7', 'Dm7', 'Em7', 'FM7', 'G7', 'Am7', 'Bm7b5', 'Cmaj9', 'Dm9', 'G13'],
    enemySpawnRate: 1.5,
    enemySpawnCount: 5,
    enemyStatMultiplier: 1.0,
    expMultiplier: 3.0,
    itemDropRate: 0.08,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
];

// 難易度別アイコン
const DIFFICULTY_ICONS: Record<SurvivalDifficulty, React.ReactNode> = {
  veryeasy: <FaStar className="text-emerald-300" />,
  easy: <FaStar className="text-green-400" />,
  normal: <FaStar className="text-blue-400" />,
  hard: <FaFire className="text-orange-400" />,
  extreme: <FaSkull className="text-red-400" />,
};

// 難易度別色設定
const DIFFICULTY_COLORS: Record<SurvivalDifficulty, { bg: string; border: string; badge: string; text: string }> = {
  veryeasy: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-600',
    text: 'text-emerald-300',
  },
  easy: {
    bg: 'bg-green-900/20',
    border: 'border-green-500/40',
    badge: 'bg-green-600',
    text: 'text-green-300',
  },
  normal: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/40',
    badge: 'bg-blue-600',
    text: 'text-blue-300',
  },
  hard: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-500/40',
    badge: 'bg-orange-600',
    text: 'text-orange-300',
  },
  extreme: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/40',
    badge: 'bg-red-600',
    text: 'text-red-300',
  },
};

// 難易度表示名
const DIFFICULTY_DISPLAY: Record<SurvivalDifficulty, string> = {
  veryeasy: 'Very Easy',
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  extreme: 'Extreme',
};

// 英語版難易度説明
const DIFFICULTY_DESCRIPTIONS_EN: Record<SurvivalDifficulty, string> = {
  veryeasy: 'Introduction. Single notes only.',
  easy: 'Beginner friendly. Basic major/minor chords only.',
  normal: 'Standard difficulty. Seventh chords added.',
  hard: 'Advanced. Complex chords and fast enemies.',
  extreme: 'Expert level. All chord types, ultra fast.',
};

// DBから取得したキャラクターをアプリ内型に変換
const convertToSurvivalCharacter = (row: SurvivalCharacterRow): SurvivalCharacter => ({
  id: row.id,
  name: row.name,
  nameEn: row.nameEn,
  avatarUrl: row.avatarUrl,
  sortOrder: row.sortOrder,
  initialStats: row.initialStats as SurvivalCharacter['initialStats'],
  initialSkills: row.initialSkills as SurvivalCharacter['initialSkills'],
  initialMagics: row.initialMagics as SurvivalCharacter['initialMagics'],
  level10Bonuses: row.level10Bonuses,
  excludedBonuses: row.excludedBonuses,
  permanentEffects: row.permanentEffects,
  noMagic: row.noMagic,
  hpRegenPerSecond: row.hpRegenPerSecond,
  description: row.description,
  descriptionEn: row.descriptionEn,
});

export interface DebugSkillSettings {
  aPenetration?: boolean;
  aBulletCount?: number;
  aBackBullet?: number;
  aRightBullet?: number;
  aLeftBullet?: number;
  bKnockbackBonus?: number;
  bRangeBonus?: number;
  multiHitLevel?: number;
  expBonusLevel?: number;
}

export interface DebugSettings {
  aAtk?: number;
  bAtk?: number;
  cAtk?: number;
  time?: number;
  luck?: number;
  skills?: DebugSkillSettings;
  tapSkillActivation?: boolean;
  initialLevel?: number;
  magics?: {
    thunder?: number;
    ice?: number;
    fire?: number;
    heal?: number;
    buffer?: number;
    debuffer?: number;
    hint?: number;
  };
}

interface SurvivalStageSelectProps {
  onStageSelect: (
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    debugSettings?: DebugSettings,
    character?: SurvivalCharacter,
  ) => void;
  onBackToMenu: () => void;
}

const DIFFICULTIES: SurvivalDifficulty[] = ['veryeasy', 'easy', 'normal', 'hard', 'extreme'];
const DEFAULT_CHARACTER_SCORE_KEY = 'default';
const HIGH_SCORE_STORAGE_KEY = 'survival_high_scores';
const TWENTY_MINUTES_SECONDS = 20 * 60;
type CharacterScopedHighScores = Record<string, SurvivalHighScore>;

const isSurvivalDifficulty = (value: string): value is SurvivalDifficulty =>
  DIFFICULTIES.includes(value as SurvivalDifficulty);

const toCharacterScoreKey = (characterId: string | null | undefined): string =>
  characterId && characterId.length > 0 ? characterId : DEFAULT_CHARACTER_SCORE_KEY;

const buildCharacterHighScoreKey = (difficulty: SurvivalDifficulty, characterKey: string): string =>
  `${difficulty}:${characterKey}`;

const SurvivalStageSelect: React.FC<SurvivalStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
}) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });

  // 状態管理
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DEFAULT_DIFFICULTY_CONFIGS);
  const [characters, setCharacters] = useState<SurvivalCharacter[]>([]);
  const [highScores, setHighScores] = useState<CharacterScopedHighScores>({});
  const [loading, setLoading] = useState(true);
  const [expandedDifficulty, setExpandedDifficulty] = useState<SurvivalDifficulty | null>('veryeasy');

  // データ読み込み
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
            bgmOddWaveUrl: s.bgmOddWaveUrl,
            bgmEvenWaveUrl: s.bgmEvenWaveUrl,
          }));
          setDifficultyConfigs(configs);
        }
      } catch {
        // DB取得失敗時はデフォルト設定を使用
      }

      // キャラクターを取得
      try {
        const charRows = await fetchSurvivalCharacters();
        setCharacters(charRows.map(convertToSurvivalCharacter));
      } catch {
        // キャラクター取得失敗
      }

      // ハイスコアを取得（難易度×キャラクター単位）
      const loadFromLocalStorage = (): CharacterScopedHighScores => {
        const scoreMap: CharacterScopedHighScores = {};
        try {
          const saved = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
          if (!saved) {
            return scoreMap;
          }
          const parsed = JSON.parse(saved) as Record<string, unknown>;
          Object.entries(parsed).forEach(([rawKey, value]) => {
            if (!value || typeof value !== 'object') {
              return;
            }
            const [rawDifficulty, rawCharacterKey] = rawKey.split(':');
            if (!isSurvivalDifficulty(rawDifficulty)) {
              return;
            }
            const normalizedCharacterKey = toCharacterScoreKey(rawCharacterKey);
            const v = value as Record<string, unknown>;
            const nextScore: SurvivalHighScore = {
              id: '',
              userId: '',
              difficulty: rawDifficulty,
              characterId: normalizedCharacterKey === DEFAULT_CHARACTER_SCORE_KEY ? null : normalizedCharacterKey,
              survivalTimeSeconds: Number(v.survivalTime) || 0,
              finalLevel: Number(v.finalLevel) || 1,
              enemiesDefeated: Number(v.enemiesDefeated) || 0,
              createdAt: '',
              updatedAt: '',
            };
            const key = buildCharacterHighScoreKey(rawDifficulty, normalizedCharacterKey);
            const existing = scoreMap[key];
            if (!existing || nextScore.survivalTimeSeconds > existing.survivalTimeSeconds) {
              scoreMap[key] = nextScore;
            }
          });
        } catch {
          // ignore
        }
        return scoreMap;
      };

      const localScores = loadFromLocalStorage();

      if (profile && !isGuest) {
        try {
          const scores = await fetchUserSurvivalHighScores(profile.id);
          const scoreMap: CharacterScopedHighScores = {};
          scores.forEach((score) => {
            const characterKey = toCharacterScoreKey(score.characterId);
            const key = buildCharacterHighScoreKey(score.difficulty, characterKey);
            const existing = scoreMap[key];
            if (!existing || score.survivalTimeSeconds > existing.survivalTimeSeconds) {
              scoreMap[key] = score;
            }
          });
          Object.entries(localScores).forEach(([key, localScore]) => {
            const dbScore = scoreMap[key];
            if (!dbScore || localScore.survivalTimeSeconds > dbScore.survivalTimeSeconds) {
              scoreMap[key] = localScore;
            }
          });
          setHighScores(scoreMap);
        } catch {
          setHighScores(localScores);
        }
      } else {
        setHighScores(localScores);
      }
    } finally {
      setLoading(false);
    }
  }, [profile, isGuest]);

  useEffect(() => { loadData(); }, [loadData]);

  // 難易度設定取得
  const getConfig = (difficulty: SurvivalDifficulty): DifficultyConfig => {
    return difficultyConfigs.find(c => c.difficulty === difficulty)
      || DEFAULT_DIFFICULTY_CONFIGS.find(c => c.difficulty === difficulty)!;
  };

  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // キャラクター選択時の処理
  const handleCharacterSelect = async (difficulty: SurvivalDifficulty, character: SurvivalCharacter) => {
    try {
      await FantasySoundManager.unlock();
      await initializeAudioSystem();
    } catch {
      // ignore
    }
    const config = getConfig(difficulty);
    onStageSelect(difficulty, config, undefined, character);
  };

  // 難易度セクション開閉
  const toggleDifficulty = (difficulty: SurvivalDifficulty) => {
    setExpandedDifficulty(prev => prev === difficulty ? null : difficulty);
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
                ? 'Choose your character and difficulty! Survive for 20 minutes!'
                : 'キャラクターと難易度を選んで挑戦！20分間生き残れ！'}
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

      {/* 難易度別セクション */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {DIFFICULTIES.map((difficulty) => {
            const config = getConfig(difficulty);
            const colors = DIFFICULTY_COLORS[difficulty];
            const icon = DIFFICULTY_ICONS[difficulty];
            const isExpanded = expandedDifficulty === difficulty;

            return (
              <div key={difficulty}>
                {/* 難易度ヘッダー */}
                <button
                  onClick={() => toggleDifficulty(difficulty)}
                  className={cn(
                    'w-full rounded-xl border-2 p-4 flex items-center gap-4 transition-all duration-200',
                    isExpanded ? 'rounded-b-none' : '',
                    colors.border,
                    colors.bg,
                    'hover:brightness-110'
                  )}
                >
                  <div className="flex-shrink-0 text-2xl">{icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">
                        {DIFFICULTY_DISPLAY[difficulty]}
                      </h2>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-sans', colors.badge, 'text-white')}>
                        {characters.length} {isEnglishCopy ? 'characters' : 'キャラ'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm font-sans mt-1">
                      {isEnglishCopy ? DIFFICULTY_DESCRIPTIONS_EN[difficulty] : config.description}
                    </p>
                  </div>
                  <div className={cn(
                    'flex-shrink-0 text-xl text-gray-400 transition-transform duration-200',
                    isExpanded ? 'rotate-90' : ''
                  )}>
                    ▶
                  </div>
                </button>

                {/* キャラクターカード一覧 */}
                {isExpanded && (
                  <div className={cn(
                    'border-2 border-t-0 rounded-b-xl p-4',
                    colors.border,
                    'bg-black/30'
                  )}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {characters.map((character) => {
                        const score = highScores[buildCharacterHighScoreKey(difficulty, character.id)];
                        const hasTwentyMinuteClear = (score?.survivalTimeSeconds ?? 0) >= TWENTY_MINUTES_SECONDS;
                        return (
                          <button
                            key={`${difficulty}-${character.id}`}
                            onClick={() => handleCharacterSelect(difficulty, character)}
                            className={cn(
                              'relative rounded-xl border overflow-hidden transition-all duration-200',
                              'hover:scale-105 hover:shadow-lg',
                              'bg-gradient-to-b from-gray-800/80 to-gray-900/80',
                              hasTwentyMinuteClear
                                ? 'border-yellow-400/90 hover:border-yellow-300 shadow-yellow-500/20'
                                : 'border-gray-600/50 hover:border-purple-400/60 hover:shadow-purple-500/20',
                              'p-3 flex flex-col items-center gap-2 text-center'
                            )}
                          >
                            {/* アバター画像 */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-700/50 flex-shrink-0 border-2 border-gray-600/50">
                              <img
                                src={character.avatarUrl}
                                alt={character.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            {/* キャラ名 */}
                            <h3 className="text-sm sm:text-base font-bold text-white font-sans leading-tight">
                              {isEnglishCopy ? (character.nameEn || character.name) : character.name}
                            </h3>

                            {/* 能力説明 */}
                            <p className="text-[10px] sm:text-xs text-gray-400 font-sans leading-tight whitespace-pre-wrap break-words">
                              {isEnglishCopy ? (character.descriptionEn || character.description) : character.description}
                            </p>

                            {/* キャラ別ハイスコア */}
                            {score && score.survivalTimeSeconds > 0 && (
                              <div className="w-full rounded-md border border-yellow-400/20 bg-black/30 px-2 py-1 text-[10px] sm:text-xs">
                                <div className="font-semibold text-yellow-400">
                                  {isEnglishCopy ? 'Best' : 'ベスト'}: {formatTime(score.survivalTimeSeconds)}
                                </div>
                                <div className="text-gray-400">
                                  Lv.{score.finalLevel} / {score.enemiesDefeated} {isEnglishCopy ? 'kills' : '撃破'}
                                </div>
                              </div>
                            )}

                            {/* 特殊タグ */}
                            <div className="flex flex-wrap gap-1 justify-center">
                              {character.noMagic && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-300 font-sans">
                                  {isEnglishCopy ? 'No Magic' : '魔法不可'}
                                </span>
                              )}
                              {character.permanentEffects.length > 0 && character.permanentEffects.map((eff, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-sans">
                                  {eff.type === 'hint' ? 'HINT' : eff.type === 'buffer' ? `Buffer Lv${eff.level}` : eff.type}
                                </span>
                              ))}
                              {character.initialSkills.autoSelect && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 font-sans">
                                  Auto
                                </span>
                              )}
                              {character.hpRegenPerSecond > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/60 text-green-300 font-sans">
                                  HP Regen
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作説明 */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-4xl mx-auto bg-black/40 rounded-xl p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3 font-sans">
            {isEnglishCopy ? 'CONTROLS' : '操作方法'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300 font-sans">
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded">W A S D</span>
              <span>{isEnglishCopy ? 'Move' : '移動'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-700 px-2 py-1 rounded text-lg">🎹</span>
              <span>{isEnglishCopy ? 'Play chords to attack' : 'コードを演奏して攻撃'}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-700/70 pt-3 space-y-2 text-xs sm:text-sm text-gray-300 font-sans">
            <p>
              {isEnglishCopy
                ? 'Status Effects: ICE freezes enemies, FIRE burns nearby targets, BUFFER/DEBUFFER strengthen or weaken combat.'
                : 'ステータス異常: ICEは敵を凍結、FIREは周囲に継続ダメージ、BUFFER/DEBUFFERは強化・弱体化を行います。'}
            </p>
            <p>
              {isEnglishCopy
                ? 'Stats: A/B/C ATK increase ranged/melee/magic power, SPEED boosts movement, DEF reduces damage, TIME extends effect duration, RELOAD shortens magic cooldown, LUCK raises lucky effect chance.'
                : '能力値: A/B/C ATKは遠距離/近接/魔法火力、SPEEDは移動速度、DEFは被ダメ軽減、TIMEは効果時間延長、RELOADは魔法再使用短縮、LUCKは幸運効果の発動率に影響します。'}
            </p>
            <p>
              {isEnglishCopy
                ? 'Skills: Penetration, Multi-Hit, Knockback, and conditional boosts like Haisui/Excellent tune your build.'
                : 'スキル: 貫通・多段攻撃・ノックバックや、背水の陣/絶好調などの条件付き強化でビルドを伸ばせます。'}
            </p>
            <p>
              {isEnglishCopy
                ? 'Magic: THUNDER (lightning), ICE (freeze), FIRE (flame vortex), HEAL (recover), BUFFER/DEBUFFER, and HINT (guide support).'
                : '魔法: THUNDER（雷）、ICE（凍結）、FIRE（炎渦）、HEAL（回復）、BUFFER/DEBUFFER、HINT（入力補助）を使えます。'}
            </p>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="text-center text-white text-xs sm:text-sm opacity-50 pb-6 font-sans">
        {isEnglishCopy
          ? 'Complete chords to unleash powerful attacks!'
          : 'コードを完成させて強力な攻撃を放て！'}
      </div>
    </div>
  );
};

export default SurvivalStageSelect;
export { DEFAULT_DIFFICULTY_CONFIGS as DIFFICULTY_CONFIGS, DIFFICULTY_COLORS };
