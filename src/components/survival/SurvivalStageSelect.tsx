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

// 全17ルート（#♭含む）
const R17 = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const allRoots = (suffix: string) => R17.map(r => suffix === '_note' ? `${r}_note` : `${r}${suffix}`);

// デフォルト難易度設定（DB取得前のフォールバック）
const DEFAULT_DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    difficulty: 'veryeasy',
    displayName: 'Very Easy',
    description: '入門向け。単音ノーツ（#♭含む全17音）。WAVE1~5ノルマ1体。経験値0.5倍。',
    descriptionEn: 'Beginner. All single notes incl. sharps/flats. WAVE 1-5: 1 kill quota. EXP x0.5.',
    allowedChords: allRoots('_note'),
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
    expMultiplier: 0.5,
    itemDropRate: 0.20,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'easy',
    displayName: 'Easy',
    description: '初心者向け。メジャー・マイナートライアド全ルート。WAVE1~5ノルマ1体。経験値1.0倍。',
    descriptionEn: 'Novice. Major/minor triads, all roots. WAVE 1-5: 1 kill quota. EXP x1.0.',
    allowedChords: [...allRoots(''), ...allRoots('m')],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
    expMultiplier: 1.0,
    itemDropRate: 0.15,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'normal',
    displayName: 'Normal',
    description: '中級者向け。4和音全ルート（M7, m7, 7, m7b5, mM7, dim7, aug7, 6, m6）。WAVE1~5ノルマ1体。経験値1.5倍。',
    descriptionEn: 'Intermediate. All 4-note chords, all roots. WAVE 1-5: 1 kill quota. EXP x1.5.',
    allowedChords: [
      ...allRoots('M7'), ...allRoots('m7'), ...allRoots('7'),
      ...allRoots('m7b5'), ...allRoots('mM7'), ...allRoots('dim7'),
      ...allRoots('aug7'), ...allRoots('6'), ...allRoots('m6'),
    ],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
    expMultiplier: 1.5,
    itemDropRate: 0.12,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'hard',
    displayName: 'Hard',
    description: '上級者向け。ジャズボイシング全ルート。WAVE1~5ノルマ1体。経験値2.0倍。',
    descriptionEn: 'Advanced. Jazz voicings, all roots. WAVE 1-5: 1 kill quota. EXP x2.0.',
    allowedChords: [
      ...allRoots('M7(9)'), ...allRoots('m7(9)'),
      ...allRoots('7(9.6th)'), ...allRoots('7(b9.b6th)'),
      ...allRoots('6(9)'), ...allRoots('m6(9)'),
    ],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
    expMultiplier: 2.0,
    itemDropRate: 0.10,
    bgmOddWaveUrl: null,
    bgmEvenWaveUrl: null,
  },
  {
    difficulty: 'extreme',
    displayName: 'Extreme',
    description: 'エキスパート向け。全ジャズボイシング。WAVE1~5ノルマ1体。経験値3.0倍。',
    descriptionEn: 'Expert. All jazz voicings. WAVE 1-5: 1 kill quota. EXP x3.0.',
    allowedChords: [
      ...allRoots('M7(9)'), ...allRoots('m7(9)'),
      ...allRoots('7(9.6th)'), ...allRoots('7(b9.b6th)'),
      ...allRoots('6(9)'), ...allRoots('m6(9)'),
      ...allRoots('7(b9.6th)'), ...allRoots('7(#9.b6th)'),
      ...allRoots('m7(b5)(11)'), ...allRoots('dim(M7)'),
    ],
    enemySpawnRate: 3,
    enemySpawnCount: 2,
    enemyStatMultiplier: 0.5,
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
  abColumnMagic: row.abColumnMagic,
  bonusChoiceCount: row.bonusChoiceCount,
  hpRegenPerSecond: row.hpRegenPerSecond,
  autoCollectExp: row.autoCollectExp,
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
  embedded?: boolean;
}

const DIFFICULTIES: SurvivalDifficulty[] = ['veryeasy', 'easy', 'normal', 'hard', 'extreme'];
const DEFAULT_CHARACTER_SCORE_KEY = 'default';
const TWENTY_MINUTES_SECONDS = 20 * 60;
type CharacterScopedHighScores = Record<string, SurvivalHighScore>;

const isSurvivalDifficulty = (value: string): value is SurvivalDifficulty =>
  DIFFICULTIES.includes(value as SurvivalDifficulty);

const toCharacterScoreKey = (characterId: string | null | undefined): string =>
  characterId && characterId.length > 0 ? characterId : DEFAULT_CHARACTER_SCORE_KEY;

const buildCharacterHighScoreKey = (difficulty: SurvivalDifficulty, characterKey: string): string =>
  `${difficulty}:${characterKey}`;

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

const SurvivalStageSelect: React.FC<SurvivalStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
  embedded,
}) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const isDomesticStandard = profile?.rank === 'standard';

  // 状態管理
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DEFAULT_DIFFICULTY_CONFIGS);
  const [characters, setCharacters] = useState<SurvivalCharacter[]>([]);
  const [highScores, setHighScores] = useState<CharacterScopedHighScores>({});
  const [loading, setLoading] = useState(true);
  const [expandedDifficulty, setExpandedDifficulty] = useState<SurvivalDifficulty | null>('veryeasy');
  const [isPlanRestrictionModalOpen, setIsPlanRestrictionModalOpen] = useState(false);
  const isCharacterSelectable = useCallback((character: SurvivalCharacter): boolean => {
    if (!isDomesticStandard) {
      return true;
    }
    return isFaiCharacter(character);
  }, [isDomesticStandard]);

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
            descriptionEn: s.descriptionEn || '',
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

      // ハイスコアを取得（Supabaseのみ）
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
          setHighScores(scoreMap);
        } catch {
          setHighScores({});
        }
      } else {
        setHighScores({});
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
    if (!isCharacterSelectable(character)) {
      setIsPlanRestrictionModalOpen(true);
      return;
    }

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
      <div className={cn(
        'flex items-center justify-center',
        embedded ? 'py-16' : 'min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black fantasy-game-screen'
      )}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(embedded ? '' : 'min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black overflow-y-auto fantasy-game-screen')}>
      {!embedded && (
        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-sans tracking-wider flex items-center gap-3">
                <FaBolt className="text-yellow-400" />
                <span>FREE PLAY</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base font-sans">
                {isEnglishCopy ? 'Choose your challenge!' : '自由に挑戦！'}
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
      )}

      {/* 説明セクション */}
      <div className="px-4 sm:px-6">
        <div className="max-w-4xl mx-auto mb-4">
          <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center space-x-2 mb-1">
              <FaBolt className="text-yellow-400 text-sm" />
              <h3 className="text-sm font-semibold font-sans">
                {isEnglishCopy ? 'Choose your challenge!' : '好きな設定で挑戦しよう！'}
              </h3>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm font-sans">
              {isEnglishCopy
                ? 'Pick your character and difficulty level freely. Your high scores will be recorded.'
                : 'キャラクターと難易度を自由に選んで挑戦できます。ハイスコアが記録されます。'}
            </p>
          </div>
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
                      {isEnglishCopy ? (config.descriptionEn || DIFFICULTY_DESCRIPTIONS_EN[difficulty]) : config.description}
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
                              'relative rounded-xl overflow-hidden transition-all duration-200',
                              'hover:scale-105 hover:shadow-lg',
                              hasTwentyMinuteClear
                                ? 'border-2 border-yellow-400 shadow-[0_0_12px_2px_rgba(250,204,21,0.4)] hover:shadow-[0_0_18px_4px_rgba(250,204,21,0.5)] bg-gradient-to-b from-yellow-900/30 via-gray-800/80 to-gray-900/80 hover:border-yellow-300'
                                : 'border border-gray-600/50 hover:border-purple-400/60 hover:shadow-purple-500/20 bg-gradient-to-b from-gray-800/80 to-gray-900/80',
                              'p-3 flex flex-col items-center gap-2 text-center'
                            )}
                          >
                            {/* 20分クリアバッジ */}
                            {hasTwentyMinuteClear && (
                              <div className="absolute top-1 right-1 text-base leading-none" title="20min+">👑</div>
                            )}

                            {/* アバター画像 */}
                            <div className={cn(
                              'w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 border-2',
                              hasTwentyMinuteClear
                                ? 'border-yellow-400/80 ring-2 ring-yellow-400/30'
                                : 'border-gray-600/50 bg-gray-700/50'
                            )}>
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
                              {character.abColumnMagic && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-sans">
                                  {isEnglishCopy ? 'AB Magic' : 'AB列魔法'}
                                </span>
                              )}
                              {character.bonusChoiceCount > 3 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300 font-sans">
                                  {isEnglishCopy ? `${character.bonusChoiceCount} Choices` : `${character.bonusChoiceCount}択`}
                                </span>
                              )}
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

      {/* ゲーム攻略ガイド */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* セクションタイトル */}
          <h2 className="text-xl sm:text-2xl font-bold text-white font-sans text-center flex items-center justify-center gap-2">
            <span className="text-yellow-400">📖</span>
            {isEnglishCopy ? 'SURVIVAL GUIDE' : 'サバイバル攻略ガイド'}
          </h2>

          {/* 基本操作 */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-base font-bold text-blue-400 mb-3 font-sans flex items-center gap-2">
              🎮 {isEnglishCopy ? 'Controls' : '基本操作'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300 font-sans">
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                <span className="bg-gray-700 px-2 py-1 rounded font-mono text-xs">W A S D</span>
                <span>{isEnglishCopy ? 'Move your character' : 'キャラクター移動'}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-xl">🎹</span>
                <span>{isEnglishCopy ? 'Play chords to attack' : 'コード演奏で攻撃発動'}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400 font-sans">
              {isEnglishCopy
                ? 'Complete a chord shown in a slot (A/B/C/D) to trigger its skill. Each slot has a 10-second timer - unfinished chords reset automatically.'
                : '画面下のスロット（A/B/C/D列）に表示されたコードの構成音をすべて弾くとスキルが発動します。各スロットには10秒のタイマーがあり、時間切れで自動リセットされます。'}
            </p>
          </div>

          {/* WAVEシステム */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-red-500/30">
            <h3 className="text-base font-bold text-red-400 mb-3 font-sans flex items-center gap-2">
              🌊 {isEnglishCopy ? 'WAVE System' : 'WAVEシステム'}
            </h3>
            <div className="space-y-2 text-sm text-gray-300 font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-red-400">1:00</div>
                  <div className="text-xs text-gray-500">{isEnglishCopy ? 'Time per WAVE' : '1WAVEの制限時間'}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-red-400">1~50</div>
                  <div className="text-xs text-gray-500">{isEnglishCopy ? 'Kill quota per WAVE' : '1WAVEの撃破ノルマ'}</div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {isEnglishCopy
                  ? 'Each WAVE lasts 1 minute. WAVE 1-5: 1 kill, WAVE 6-9: 5 kills, WAVE 10-19: 20 kills, WAVE 20+: 50 kills. Failure to meet the quota results in Game Over. Enemies get stronger each WAVE.'
                  : '各WAVEは1分間。WAVE1~5は1体、WAVE6~9は5体、WAVE10~19は20体、WAVE20以降は50体が撃破ノルマです。ノルマ未達成でゲームオーバー。WAVEが進むごとに敵が強くなります。'}
              </p>
            </div>
          </div>

          {/* 4スロットシステム */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-purple-500/30">
            <h3 className="text-base font-bold text-purple-400 mb-3 font-sans flex items-center gap-2">
              🎵 {isEnglishCopy ? 'Slot System (A/B/C/D)' : 'スロットシステム（A/B/C/D列）'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
              <div className="bg-blue-900/30 rounded-lg p-2 border border-blue-500/20">
                <div className="font-bold text-blue-400 mb-1">🔫 A列</div>
                <div className="text-gray-300">{isEnglishCopy ? 'Ranged shots' : '遠距離弾'}</div>
                <div className="text-gray-500 mt-1">{isEnglishCopy ? 'Clockwise bullets' : '時計方向に弾を発射'}</div>
              </div>
              <div className="bg-orange-900/30 rounded-lg p-2 border border-orange-500/20">
                <div className="font-bold text-orange-400 mb-1">👊 B列</div>
                <div className="text-gray-300">{isEnglishCopy ? 'Melee attack' : '近接攻撃'}</div>
                <div className="text-gray-500 mt-1">{isEnglishCopy ? 'AoE + knockback' : '範囲攻撃＋ノックバック'}</div>
              </div>
              <div className="bg-purple-900/30 rounded-lg p-2 border border-purple-500/20">
                <div className="font-bold text-purple-400 mb-1">🪄 C列</div>
                <div className="text-gray-300">{isEnglishCopy ? 'Magic (unlockable)' : '魔法（解放制）'}</div>
                <div className="text-gray-500 mt-1">{isEnglishCopy ? 'Random magic' : 'ランダム魔法発動'}</div>
              </div>
              <div className="bg-pink-900/30 rounded-lg p-2 border border-pink-500/20">
                <div className="font-bold text-pink-400 mb-1">✨ D列</div>
                <div className="text-gray-300">{isEnglishCopy ? 'Magic (unlockable)' : '魔法（解放制）'}</div>
                <div className="text-gray-500 mt-1">{isEnglishCopy ? 'Random magic' : 'ランダム魔法発動'}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400 font-sans">
              {isEnglishCopy
                ? 'C/D slots unlock when you acquire magic skills via level-up. Some characters convert A/B slots to magic too.'
                : 'C/D列はレベルアップで魔法を取得すると解放されます。キャラクターによってはA/B列も魔法化されます。魔法スロットにはクールダウンがあります（基本10秒、RELOAD値で短縮）。'}
            </p>
          </div>

          {/* 能力値の詳細 */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-green-500/30">
            <h3 className="text-base font-bold text-green-400 mb-3 font-sans flex items-center gap-2">
              📊 {isEnglishCopy ? 'Stats Details' : '能力値の詳細'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-blue-400 font-bold min-w-[80px]">A ATK</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = +10 ranged damage' : '+1ごとに遠距離ダメージ+10'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-orange-400 font-bold min-w-[80px]">B ATK</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = +10 melee damage' : '+1ごとに近接ダメージ+10'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-purple-400 font-bold min-w-[80px]">C ATK</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = +10 magic damage, boosts Buffer/Debuffer' : '+1ごとに魔法ダメージ+10。バフ・デバフ効果も強化'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-green-400 font-bold min-w-[80px]">SPEED</span>
                <span className="text-gray-300">{isEnglishCopy ? 'Movement speed' : '移動速度。高いほど敵を避けやすい'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-gray-300 font-bold min-w-[80px]">DEF</span>
                <span className="text-gray-300">{isEnglishCopy ? 'Reduces incoming damage' : '被ダメージ軽減（DEF×0.5を減算）'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-cyan-400 font-bold min-w-[80px]">TIME</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = +2sec effect duration' : '+1ごとに魔法効果時間+2秒'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-yellow-400 font-bold min-w-[80px]">RELOAD</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = -0.7sec cooldown (min 6sec)' : '+1ごとにクールダウン-0.7秒（最短6秒）'}</span>
              </div>
              <div className="flex items-start gap-2 bg-black/30 rounded-lg p-2">
                <span className="text-emerald-400 font-bold min-w-[80px]">LUCK</span>
                <span className="text-gray-300">{isEnglishCopy ? '+1 = +0.5% lucky chance (base 6%, max 26%)' : '+1ごとに幸運率+0.5%（基本6%、最大26%）'}</span>
              </div>
            </div>
          </div>

          {/* 運（LUCK）の詳細 */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-base font-bold text-emerald-400 mb-3 font-sans flex items-center gap-2">
              🍀 {isEnglishCopy ? 'Luck System' : '幸運（LUCK）システム'}
            </h3>
            <p className="text-xs text-gray-400 font-sans mb-2">
              {isEnglishCopy
                ? 'Each action has a chance to trigger a Lucky effect. Base 6% + LUCK × 0.5% (capped at 26% with LUCK 40).'
                : '攻撃や魔法発動時に一定確率で「幸運」が発動します。基本確率6%＋LUCK値×0.5%（LUCK 40で最大26%）。'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
              <div className="bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">x1.7</div>
                <div className="text-gray-400">{isEnglishCopy ? 'Damage boost' : 'ダメージ強化'}</div>
              </div>
              <div className="bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">0</div>
                <div className="text-gray-400">{isEnglishCopy ? 'No damage taken' : '被ダメージ0'}</div>
              </div>
              <div className="bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">x1/3</div>
                <div className="text-gray-400">{isEnglishCopy ? 'Reload time' : '魔法リロード1/3'}</div>
              </div>
              <div className="bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">x2</div>
                <div className="text-gray-400">{isEnglishCopy ? 'Effect duration' : '効果時間2倍'}</div>
              </div>
            </div>
          </div>

          {/* 魔法スキル */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-indigo-500/30">
            <h3 className="text-base font-bold text-indigo-400 mb-3 font-sans flex items-center gap-2">
              🪄 {isEnglishCopy ? 'Magic Skills' : '魔法スキル詳細'}
            </h3>
            <p className="text-xs text-gray-400 font-sans mb-2">
              {isEnglishCopy
                ? 'Magic can be leveled up to Lv3. Higher levels increase damage/effects and base duration (5/10/15 sec). TIME stat adds +2 sec per point.'
                : '魔法はLv3まで強化可能。レベルが上がると基礎効果時間が延長（5→10→15秒）し、ダメージや効果が増加します。TIME値は+1につき効果時間+2秒。'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div className="bg-yellow-900/20 rounded-lg p-2 border border-yellow-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>⚡</span><span className="font-bold text-yellow-400">THUNDER</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Hits ALL enemies. Damage: 30/50/70 + C ATK' : '全敵にダメージ。威力: 30/50/70＋C ATKボーナス'}</div>
              </div>
              <div className="bg-cyan-900/20 rounded-lg p-2 border border-cyan-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>❄️</span><span className="font-bold text-cyan-400">ICE</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Freezes all enemies. Duration scales with level' : '全敵を凍結。効果時間はレベルとTIMEで延長'}</div>
              </div>
              <div className="bg-red-900/20 rounded-lg p-2 border border-red-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>🔥</span><span className="font-bold text-red-400">FIRE</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Flame vortex around you. AoE: 130/160/190px. Damage: 25/40/55 + C ATK' : '周囲に炎の渦。範囲: 130/160/190px。威力: 25/40/55＋C ATK'}</div>
              </div>
              <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>💚</span><span className="font-bold text-green-400">HEAL</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Recover HP. Amount: 30/40/50% of max HP' : 'HP回復。回復量: 最大HPの30/40/50%'}</div>
              </div>
              <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>⬆️</span><span className="font-bold text-blue-400">BUFFER</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Damage multiplier: 1.4x/1.8x/2.2x + capped C ATK bonus' : '攻撃倍率: 1.4/1.8/2.2倍＋C ATK補正（上限あり）'}</div>
              </div>
              <div className="bg-violet-900/20 rounded-lg p-2 border border-violet-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <span>⬇️</span><span className="font-bold text-violet-400">DEBUFFER</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Reduce enemy DEF and boost damage. Scales with level + C ATK (capped).' : '敵DEF低下＋与ダメ増加。レベルとC ATKで強化（上限あり）。'}</div>
              </div>
              <div className="bg-amber-900/20 rounded-lg p-2 border border-amber-500/20 sm:col-span-2">
                <div className="flex items-center gap-1 mb-1">
                  <span>💡</span><span className="font-bold text-amber-400">HINT</span>
                </div>
                <div className="text-gray-300">{isEnglishCopy ? 'Shows chord notes on keyboard. Highlights the current slot\'s composition notes.' : 'コードの構成音を鍵盤上にハイライト表示。入力中のスロットの構成音がわかるようになります。'}</div>
              </div>
            </div>
          </div>

          {/* 条件付きスキル */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-amber-500/30">
            <h3 className="text-base font-bold text-amber-400 mb-3 font-sans flex items-center gap-2">
              ⚔️ {isEnglishCopy ? 'Conditional Skills' : '条件付きスキル'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
              <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/20">
                <div className="flex items-center gap-1 mb-2">
                  <span>🩸</span><span className="font-bold text-red-400">{isEnglishCopy ? 'Haisui no Jin' : '背水の陣'}</span>
                </div>
                <div className="text-gray-400 mb-1">{isEnglishCopy ? 'Trigger: HP ≤ 15%' : '発動条件: HP 15%以下'}</div>
                <ul className="text-gray-300 space-y-0.5 list-disc list-inside">
                  <li>{isEnglishCopy ? 'ATK x1.6' : 'ABC攻撃力 1.6倍'}</li>
                  <li>{isEnglishCopy ? 'SPEED +6' : 'SPEED +6'}</li>
                  <li>{isEnglishCopy ? 'RELOAD x0.7' : 'リロード0.7倍'}</li>
                  <li>{isEnglishCopy ? 'TIME x1.6' : '効果時間1.6倍'}</li>
                  <li className="text-red-400">{isEnglishCopy ? 'DEF = 0' : 'DEF 0（防御なし）'}</li>
                </ul>
              </div>
              <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/20">
                <div className="flex items-center gap-1 mb-2">
                  <span>😊</span><span className="font-bold text-yellow-400">{isEnglishCopy ? 'Peak Condition' : '絶好調'}</span>
                </div>
                <div className="text-gray-400 mb-1">{isEnglishCopy ? 'Trigger: HP = MAX' : '発動条件: HP満タン'}</div>
                <ul className="text-gray-300 space-y-0.5 list-disc list-inside">
                  <li>{isEnglishCopy ? 'ATK x1.18' : 'ABC攻撃力 1.18倍'}</li>
                  <li>{isEnglishCopy ? 'TIME x1.4' : '効果時間1.4倍'}</li>
                  <li>{isEnglishCopy ? 'RELOAD x0.8' : 'リロード0.8倍'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* レベルアップ */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-yellow-500/30">
            <h3 className="text-base font-bold text-yellow-400 mb-3 font-sans flex items-center gap-2">
              ⭐ {isEnglishCopy ? 'Level Up' : 'レベルアップ'}
            </h3>
            <div className="space-y-2 text-xs text-gray-300 font-sans">
              <p>
                {isEnglishCopy
                  ? 'Defeat enemies to drop EXP coins. Collect them to level up. Each level-up lets you choose a bonus from 3 options (some characters get 5 options). Play the shown chord to select. 10-second time limit - no pick = no bonus.'
                  : '敵を倒すとEXPコインが出現。拾うと経験値が溜まりレベルアップします。レベルアップ時に3つ（キャラによっては5つ）のボーナスから1つ選択できます。表示されたコードを演奏して選択。10秒で時間切れ（ボーナスなし）。'}
              </p>
              <p>
                {isEnglishCopy
                  ? 'Every 10 levels, character-specific bonuses are automatically applied. Build your stats and skills strategically!'
                  : 'レベル10ごとにキャラクター固有のボーナスが自動付与されます。ステータスとスキルを戦略的に育てましょう！'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* プラン制限モーダル（国内スタンダードのみ） */}
      {isPlanRestrictionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label={isEnglishCopy ? 'Close modal' : 'モーダルを閉じる'}
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsPlanRestrictionModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="survival-plan-restriction-title"
            className="relative w-full max-w-sm rounded-xl border border-yellow-500/40 bg-gray-900 p-5 text-white shadow-xl"
          >
            <h3 id="survival-plan-restriction-title" className="text-lg font-bold text-yellow-300 font-sans">
              {isEnglishCopy ? 'Character Locked' : 'キャラクター制限'}
            </h3>
            <p className="mt-3 text-sm text-gray-200 font-sans">
              {isEnglishCopy ? 'Only Premium plan or higher can select this character.' : 'ファイ以外のキャラクターはプレミアムプラン以上のみ選択できます。'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPlanRestrictionModalOpen(false);
                  window.location.hash = '#account?tab=subscription';
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
              >
                {isEnglishCopy ? 'Upgrade Plan' : 'プランのアップグレード'}
              </button>
              <button
                type="button"
                onClick={() => setIsPlanRestrictionModalOpen(false)}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-400"
              >
                {isEnglishCopy ? 'Close' : '閉じる'}
              </button>
            </div>
          </div>
        </div>
      )}

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
