/**
 * サバイバル ステージモード 選択画面
 * ドロップダウンでステージ選択 + キャラクター選択
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalDifficulty, DifficultyConfig, SurvivalCharacter } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import {
  fetchSurvivalDifficultySettings,
  fetchSurvivalCharacters,
  fetchSurvivalStageProgress,
  fetchSurvivalStageClears,
  SurvivalCharacterRow,
  SurvivalStageClear,
} from '@/platform/supabaseSurvival';
import { DIFFICULTY_CONFIGS } from './SurvivalStageSelect';
import {
  ALL_STAGES,
  TOTAL_STAGES,
  StageDefinition,
  STAGE_TIME_LIMIT_SECONDS,
} from './SurvivalStageDefinitions';
import { FaTrophy, FaLock, FaCheck, FaPlay } from 'react-icons/fa';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { initializeAudioSystem } from '@/utils/MidiController';

const DIFFICULTY_COLORS: Record<SurvivalDifficulty, string> = {
  veryeasy: 'text-emerald-300',
  easy: 'text-green-400',
  normal: 'text-blue-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
};

const DIFFICULTY_BG: Record<SurvivalDifficulty, string> = {
  veryeasy: 'bg-emerald-900/30 border-emerald-500/40',
  easy: 'bg-green-900/30 border-green-500/40',
  normal: 'bg-blue-900/30 border-blue-500/40',
  hard: 'bg-orange-900/30 border-orange-500/40',
  extreme: 'bg-red-900/30 border-red-500/40',
};

const DIFFICULTY_DISPLAY: Record<SurvivalDifficulty, string> = {
  veryeasy: 'Very Easy',
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  extreme: 'Extreme',
};

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

const isFaiCharacter = (character: SurvivalCharacter): boolean => {
  const normalizedName = character.name.trim();
  const normalizedNameEn = (character.nameEn ?? '').trim().toLowerCase();
  const normalizedId = character.id.trim().toLowerCase();
  return normalizedName === 'ファイ' || normalizedNameEn === 'fai' || normalizedId === 'fai';
};

interface SurvivalStageModeProps {
  onStageSelect: (
    difficulty: SurvivalDifficulty,
    config: DifficultyConfig,
    stageDefinition: StageDefinition,
    character?: SurvivalCharacter,
  ) => void;
  onBackToMenu: () => void;
  onBackToModeSelect?: () => void;
  embedded?: boolean;
}

const SurvivalStageMode: React.FC<SurvivalStageModeProps> = ({
  onStageSelect,
  onBackToMenu,
  onBackToModeSelect,
  embedded,
}) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const isDomesticStandard = profile?.rank === 'standard';

  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<SurvivalCharacter[]>([]);
  const [difficultyConfigs, setDifficultyConfigs] = useState<DifficultyConfig[]>(DIFFICULTY_CONFIGS);
  const [currentStageNumber, setCurrentStageNumber] = useState(1);
  const [clearedStages, setClearedStages] = useState<Set<number>>(new Set());
  const [selectedStageNumber, setSelectedStageNumber] = useState(1);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isPlanRestrictionModalOpen, setIsPlanRestrictionModalOpen] = useState(false);

  const isCharacterSelectable = useCallback((character: SurvivalCharacter): boolean => {
    if (!isDomesticStandard) return true;
    return isFaiCharacter(character);
  }, [isDomesticStandard]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

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
      } catch { /* fallback */ }

      try {
        const charRows = await fetchSurvivalCharacters();
        const chars = charRows.map(convertToSurvivalCharacter);
        setCharacters(chars);
        if (chars.length > 0) {
          setSelectedCharacterId(prev => {
            if (prev) return prev;
            const fai = chars.find(c => isFaiCharacter(c));
            return fai?.id ?? chars[0].id;
          });
        }
      } catch { /* ignore */ }

      if (profile && !isGuest) {
        try {
          const progress = await fetchSurvivalStageProgress(profile.id);
          setCurrentStageNumber(progress.currentStageNumber);
          setSelectedStageNumber(progress.currentStageNumber);
        } catch { /* ignore */ }

        try {
          const clears = await fetchSurvivalStageClears(profile.id);
          setClearedStages(new Set(clears.map((c: SurvivalStageClear) => c.stageNumber)));
        } catch { /* ignore */ }
      }
    } finally {
      setLoading(false);
    }
  }, [profile, isGuest]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedStage = useMemo(
    () => ALL_STAGES.find(s => s.stageNumber === selectedStageNumber),
    [selectedStageNumber]
  );

  const selectedCharacter = useMemo(
    () => characters.find(c => c.id === selectedCharacterId),
    [characters, selectedCharacterId]
  );

  const isStageUnlocked = useCallback((stageNumber: number): boolean => {
    if (stageNumber === 1) return true;
    return clearedStages.has(stageNumber - 1);
  }, [clearedStages]);

  const getConfig = useCallback((difficulty: SurvivalDifficulty): DifficultyConfig => {
    return difficultyConfigs.find(c => c.difficulty === difficulty)
      || DIFFICULTY_CONFIGS.find(c => c.difficulty === difficulty)!;
  }, [difficultyConfigs]);

  const handleStart = async () => {
    if (!selectedStage) return;
    if (!isStageUnlocked(selectedStage.stageNumber)) return;

    if (selectedCharacter && !isCharacterSelectable(selectedCharacter)) {
      setIsPlanRestrictionModalOpen(true);
      return;
    }

    try {
      await FantasySoundManager.unlock();
      await initializeAudioSystem();
    } catch { /* ignore */ }

    const baseConfig = getConfig(selectedStage.difficulty);
    const stageConfig: DifficultyConfig = {
      ...baseConfig,
      allowedChords: selectedStage.allowedChords,
    };

    onStageSelect(selectedStage.difficulty, stageConfig, selectedStage, selectedCharacter);
  };

  const progressPercent = Math.round((clearedStages.size / TOTAL_STAGES) * 100);

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
                <FaTrophy className="text-yellow-400" />
                <span>STAGE MODE</span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base font-sans">
                {isEnglishCopy
                  ? 'Survive 5 minutes to clear! Complete all 105 stages!'
                  : '5分間生存でクリア！全105ステージを制覇せよ！'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onBackToModeSelect}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base font-sans"
              >
                {isEnglishCopy ? 'Back' : '戻る'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 pb-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* 進捗バー */}
          <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300 font-sans">
                {isEnglishCopy ? 'Progress' : '進捗'}
              </span>
              <span className="text-sm text-yellow-400 font-bold font-sans">
                {clearedStages.size} / {TOTAL_STAGES} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* ステージ選択ドロップダウン */}
          <div className="bg-black/40 rounded-xl p-4 border border-purple-500/30">
            <label className="block text-sm text-gray-300 font-sans mb-2">
              {isEnglishCopy ? 'Select Stage' : 'ステージ選択'}
            </label>
            <select
              value={selectedStageNumber}
              onChange={(e) => setSelectedStageNumber(Number(e.target.value))}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 text-base font-sans focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            >
              {ALL_STAGES.map((stage) => {
                const unlocked = isStageUnlocked(stage.stageNumber);
                const cleared = clearedStages.has(stage.stageNumber);
                const prefix = cleared ? '✅ ' : !unlocked ? '🔒 ' : '';
                return (
                  <option
                    key={stage.stageNumber}
                    value={stage.stageNumber}
                    disabled={!unlocked}
                  >
                    {prefix}{isEnglishCopy ? stage.nameEn : stage.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 選択ステージ詳細 */}
          {selectedStage && (
            <div className={cn(
              'rounded-xl p-4 border-2',
              DIFFICULTY_BG[selectedStage.difficulty]
            )}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white font-sans">
                  {isEnglishCopy ? selectedStage.nameEn : selectedStage.name}
                </h3>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold font-sans',
                  DIFFICULTY_COLORS[selectedStage.difficulty]
                )}>
                  {DIFFICULTY_DISPLAY[selectedStage.difficulty]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                <div className="bg-black/30 rounded-lg p-2">
                  <span className="text-gray-400">{isEnglishCopy ? 'Chord Type' : 'コードタイプ'}</span>
                  <div className="text-white font-bold mt-1">
                    {isEnglishCopy ? selectedStage.chordDisplayNameEn : selectedStage.chordDisplayName}
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-2">
                  <span className="text-gray-400">{isEnglishCopy ? 'Root Notes' : 'ルート'}</span>
                  <div className="text-white font-bold mt-1">
                    {isEnglishCopy ? selectedStage.rootPatternNameEn : selectedStage.rootPatternName}
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-2">
                  <span className="text-gray-400">{isEnglishCopy ? 'Time Limit' : '制限時間'}</span>
                  <div className="text-yellow-400 font-bold mt-1">5:00</div>
                </div>
                <div className="bg-black/30 rounded-lg p-2">
                  <span className="text-gray-400">{isEnglishCopy ? 'Clear Condition' : 'クリア条件'}</span>
                  <div className="text-green-400 font-bold mt-1">
                    {isEnglishCopy ? '5min Survive' : '5分間生存'}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400 font-sans">
                {isEnglishCopy ? 'Allowed chords: ' : '出題コード: '}
                <span className="text-gray-300">
                  {selectedStage.allowedChords.slice(0, 8).join(', ')}
                  {selectedStage.allowedChords.length > 8 && ` ... (${selectedStage.allowedChords.length})`}
                </span>
              </div>

              {!isStageUnlocked(selectedStage.stageNumber) && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm font-sans">
                  <FaLock />
                  <span>
                    {isEnglishCopy
                      ? `Clear Stage ${selectedStage.stageNumber - 1} to unlock`
                      : `ステージ${selectedStage.stageNumber - 1}をクリアで解放`}
                  </span>
                </div>
              )}

              {clearedStages.has(selectedStage.stageNumber) && (
                <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-sans">
                  <FaCheck />
                  <span>{isEnglishCopy ? 'Cleared!' : 'クリア済み！'}</span>
                </div>
              )}
            </div>
          )}

          {/* キャラクター選択 */}
          <div className="bg-black/40 rounded-xl p-4 border border-purple-500/30">
            <label className="block text-sm text-gray-300 font-sans mb-2">
              {isEnglishCopy ? 'Select Character' : 'キャラクター選択'}
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedCharacterId}
                onChange={(e) => {
                  const char = characters.find(c => c.id === e.target.value);
                  if (char && !isCharacterSelectable(char)) {
                    setIsPlanRestrictionModalOpen(true);
                    return;
                  }
                  setSelectedCharacterId(e.target.value);
                }}
                className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 text-base font-sans focus:outline-none focus:border-purple-400 appearance-none cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
              >
                {characters.map((char) => {
                  const locked = !isCharacterSelectable(char);
                  const displayName = isEnglishCopy ? (char.nameEn || char.name) : char.name;
                  return (
                    <option key={char.id} value={char.id}>
                      {locked ? '🔒 ' : ''}{displayName}
                    </option>
                  );
                })}
              </select>
              {selectedCharacter && (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500/50 flex-shrink-0">
                  <img
                    src={selectedCharacter.avatarUrl}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            {selectedCharacter && (
              <p className="mt-2 text-xs text-gray-400 font-sans">
                {isEnglishCopy
                  ? (selectedCharacter.descriptionEn || selectedCharacter.description)
                  : selectedCharacter.description}
              </p>
            )}
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStart}
            disabled={!selectedStage || !isStageUnlocked(selectedStage?.stageNumber ?? 0)}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-lg font-sans transition-all duration-200 flex items-center justify-center gap-3',
              selectedStage && isStageUnlocked(selectedStage.stageNumber)
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/30'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            <FaPlay />
            {isEnglishCopy ? 'START STAGE' : 'ステージ開始'}
          </button>

        </div>
      </div>

      {/* プラン制限モーダル */}
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
            className="relative w-full max-w-sm rounded-xl border border-yellow-500/40 bg-gray-900 p-5 text-white shadow-xl"
          >
            <h3 className="text-lg font-bold text-yellow-300 font-sans">
              {isEnglishCopy ? 'Character Locked' : 'キャラクター制限'}
            </h3>
            <p className="mt-3 text-sm text-gray-200 font-sans">
              {isEnglishCopy
                ? 'Only Premium plan or higher can select this character.'
                : 'ファイ以外のキャラクターはプレミアムプラン以上のみ選択できます。'}
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
    </div>
  );
};

export default SurvivalStageMode;
