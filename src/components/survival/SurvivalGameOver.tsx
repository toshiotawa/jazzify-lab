/**
 * サバイバルモード ゲームオーバー / ステージクリア画面
 * 結果表示とステータスカード
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalGameResult, SurvivalDifficulty } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { upsertSurvivalHighScore, upsertSurvivalStageClear } from '@/platform/supabaseSurvival';
import { addXp } from '@/platform/supabaseXp';
import { clearUserStatsCache } from '@/platform/supabaseUserStats';
import { StageDefinition, TOTAL_STAGES, STAGE_KILL_QUOTA } from './SurvivalStageDefinitions';

interface SurvivalGameOverProps {
  result: SurvivalGameResult;
  difficulty: SurvivalDifficulty;
  characterId?: string | null;
  onRetry: () => void;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
  waveFailedReason?: string;
  finalWave?: number;
  stageDefinition?: StageDefinition;
  hintMode?: boolean;
}

const DIFFICULTY_COLORS: Record<SurvivalDifficulty, string> = {
  veryeasy: 'text-emerald-300',
  easy: 'text-green-400',
  normal: 'text-blue-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
};

const SurvivalGameOver: React.FC<SurvivalGameOverProps> = ({
  result,
  difficulty,
  characterId = null,
  onRetry,
  onBackToSelect,
  onBackToMenu,
  waveFailedReason,
  finalWave,
  stageDefinition,
  hintMode = false,
}) => {
  const { profile, isGuest, fetchProfile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [xpAdded, setXpAdded] = useState(false);
  const [stageSaved, setStageSaved] = useState(false);

  const isStageMode = !!stageDefinition;
  const isStageClear = result.isStageClear === true && isStageMode && !hintMode;
  const isStageClearHint = result.isStageClear === true && isStageMode && hintMode;

  useEffect(() => {
    const saveResults = async () => {
      const survivalTime = Math.floor(result.survivalTime);

      if (!profile || isGuest) return;

      if (isStageClear && !stageSaved) {
        try {
          await upsertSurvivalStageClear(
            profile.id,
            stageDefinition!.stageNumber,
            survivalTime,
            result.finalLevel,
            result.enemiesDefeated,
            characterId ?? null,
            TOTAL_STAGES,
          );
          setStageSaved(true);
          clearUserStatsCache(profile.id);
        } catch {
          // DB保存失敗
        }
      }

      if (!stageDefinition) {
        try {
          const { isNewHighScore: isNew } = await upsertSurvivalHighScore(
            profile.id,
            difficulty,
            survivalTime,
            result.finalLevel,
            result.enemiesDefeated,
            characterId
          );
          setIsNewHighScore(isNew);
          clearUserStatsCache(profile.id);
        } catch {
          // DB保存失敗
        }
      }

      if (!xpAdded && result.earnedXp > 0) {
        try {
          const reason = stageDefinition
            ? `survival_stage_${stageDefinition.stageNumber}_${isStageClear ? 'clear' : 'fail'}`
            : `survival_${difficulty}_${Math.floor(survivalTime / 60)}min`;
          await addXp({
            songId: null,
            baseXp: result.earnedXp,
            speedMultiplier: 1,
            rankMultiplier: 1,
            transposeMultiplier: 1,
            membershipMultiplier: 1,
            reason,
          });
          setXpAdded(true);
          await fetchProfile({ forceRefresh: true });
        } catch {
          // XP付与失敗
        }
      }
    };

    saveResults();
  }, [profile, isGuest, difficulty, result, xpAdded, fetchProfile, characterId, isStageClear, stageDefinition, stageSaved]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const acquiredMagics = Object.entries(result.magics)
    .filter(([_, level]) => level > 0)
    .map(([type, level]) => ({ type, level }));

  const acquiredSkills: Array<{ name: string; value: string | number }> = [];
  if (result.skills.aPenetration) acquiredSkills.push({ name: isEnglishCopy ? 'Penetration' : '貫通', value: '✓' });
  if (result.skills.bKnockbackBonus > 0) acquiredSkills.push({ name: isEnglishCopy ? 'Knockback' : 'ノックバック', value: `+${result.skills.bKnockbackBonus}` });
  if (result.skills.bRangeBonus > 0) acquiredSkills.push({ name: isEnglishCopy ? 'Atk Range' : '攻撃範囲', value: `+${result.skills.bRangeBonus}` });
  if (result.skills.bDeflect) acquiredSkills.push({ name: isEnglishCopy ? 'Deflect' : '拳でかきけす', value: '✓' });
  if (result.skills.multiHitLevel > 0) acquiredSkills.push({ name: isEnglishCopy ? 'Multi-Hit' : '多段攻撃', value: `Lv.${result.skills.multiHitLevel}` });
  if (result.skills.expBonusLevel > 0) acquiredSkills.push({ name: isEnglishCopy ? 'EXP+' : '獲得経験値+', value: `Lv.${result.skills.expBonusLevel}` });
  if (result.skills.haisuiNoJin) acquiredSkills.push({ name: isEnglishCopy ? 'Last Stand' : '背水の陣', value: '✓' });
  if (result.skills.zekkouchou) acquiredSkills.push({ name: isEnglishCopy ? 'Peak Condition' : '絶好調', value: '✓' });

  const MAGIC_ICONS: Record<string, string> = {
    thunder: '⚡',
    ice: '❄️',
    fire: '🔥',
    heal: '💚',
    buffer: '⬆️',
    debuffer: '⬇️',
    hint: '💡',
  };

  const borderColor = (isStageClear || isStageClearHint) ? 'border-green-500' : 'border-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-sm overflow-y-auto py-4">
      <div className={cn('max-w-2xl w-full mx-4 p-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 shadow-2xl', borderColor)}>
        {/* ヘッダー */}
        <div className="text-center mb-3">
          {isStageClear ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-3xl font-bold text-green-400 font-sans mb-1">
                STAGE CLEAR!
              </div>
              <div className="mt-2 px-4 py-2 bg-green-900/50 rounded-lg border border-green-500/50">
                <div className="text-green-300 font-bold font-sans text-sm">
                  {isEnglishCopy ? stageDefinition!.nameEn : stageDefinition!.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {isEnglishCopy ? '90 seconds survived!' : '90秒間生存達成！'}
                </div>
              </div>
            </>
          ) : isStageClearHint ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-3xl font-bold text-yellow-400 font-sans mb-1">
                STAGE CLEAR!
              </div>
              <div className="mt-2 px-4 py-2 bg-yellow-900/50 rounded-lg border border-yellow-500/50">
                <div className="text-yellow-300 font-bold font-sans text-sm">
                  {isEnglishCopy ? stageDefinition!.nameEn : stageDefinition!.name}
                </div>
                <div className="text-xs text-yellow-200 mt-1">
                  {isEnglishCopy
                    ? 'HINT MODE - Not counted as official clear'
                    : 'HINTモード - クリア記録には反映されません'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">💀</div>
              <div className="text-3xl font-bold text-red-500 font-sans mb-1">
                GAME OVER
              </div>

              {isNewHighScore && (
                <div className="mt-2 px-4 py-2 bg-yellow-600/50 rounded-lg border border-yellow-400 animate-pulse">
                  <div className="text-yellow-300 font-bold font-sans">
                    🏆 {isEnglishCopy ? 'NEW HIGH SCORE!' : 'ハイスコア更新！'}
                  </div>
                </div>
              )}

              {isStageMode && waveFailedReason === 'quota_failed' ? (
                <div className="mt-2 px-4 py-2 bg-red-900/50 rounded-lg border border-red-500/50">
                  <div className="text-red-400 font-bold font-sans">
                    {isEnglishCopy ? 'KILL QUOTA FAILED!' : '撃破ノルマ未達成！'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isEnglishCopy
                      ? `Defeated ${result.enemiesDefeated}/${STAGE_KILL_QUOTA} enemies`
                      : `撃破数 ${result.enemiesDefeated}/${STAGE_KILL_QUOTA}体`}
                  </div>
                </div>
              ) : !isStageMode && waveFailedReason === 'quota_failed' ? (
                <div className="mt-2 px-4 py-2 bg-red-900/50 rounded-lg border border-red-500/50">
                  <div className="text-red-400 font-bold font-sans">
                    {isEnglishCopy ? 'WAVE QUOTA FAILED!' : 'WAVEノルマ達成ならず！'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isEnglishCopy
                      ? `Failed to meet the quota in WAVE ${finalWave || 1}`
                      : `WAVE ${finalWave || 1} のノルマを達成できませんでした`}
                  </div>
                </div>
              ) : (
                <div className={cn('text-lg font-sans', DIFFICULTY_COLORS[difficulty])}>
                  {difficulty.toUpperCase()}
                </div>
              )}

              {stageDefinition && (
                <div className="mt-2 px-4 py-2 bg-red-900/30 rounded-lg border border-red-500/30">
                  <div className="text-red-300 text-sm font-sans">
                    {isEnglishCopy ? stageDefinition.nameEn : stageDefinition.name}
                  </div>
                </div>
              )}

              {!isStageMode && finalWave && (
                <div className="mt-2 text-sm text-yellow-400">
                  🏆 WAVE {finalWave} {isEnglishCopy ? 'reached' : '到達'}
                </div>
              )}
            </>
          )}
        </div>

        {/* メイン結果 */}
        <div className={cn('grid gap-3 mb-4', isStageMode ? 'grid-cols-2' : 'grid-cols-3')}>
          <div className="bg-black/40 rounded-xl p-3 text-center border border-gray-700">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-xl font-bold text-white font-sans">
              {formatTime(result.survivalTime)}
            </div>
            <div className="text-[10px] text-gray-400">
              {isEnglishCopy ? 'Survival Time' : '生存時間'}
            </div>
          </div>

          {!isStageMode && (
            <div className="bg-black/40 rounded-xl p-3 text-center border border-gray-700">
              <div className="text-2xl mb-1">⭐</div>
              <div className="text-xl font-bold text-yellow-400 font-sans">
                Lv.{result.finalLevel}
              </div>
              <div className="text-[10px] text-gray-400">
                {isEnglishCopy ? 'Final Level' : '最終レベル'}
              </div>
            </div>
          )}

          <div className="bg-black/40 rounded-xl p-3 text-center border border-gray-700">
            <div className="text-2xl mb-1">💀</div>
            <div className="text-xl font-bold text-red-400 font-sans">
              {result.enemiesDefeated}
            </div>
            <div className="text-[10px] text-gray-400">
              {isEnglishCopy ? 'Enemies Defeated' : '撃破数'}
            </div>
          </div>
        </div>

        {/* ステータスカード（フリープレイのみ） */}
        {!isStageMode && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-black/40 rounded-xl p-3 border border-gray-700">
              <div className="text-xs font-bold text-gray-300 mb-2 font-sans">
                📊 {isEnglishCopy ? 'Final Stats' : '最終ステータス'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEnglishCopy ? 'Ranged ATK' : '遠距離ATK'}</span>
                  <span className="text-blue-400">{result.playerStats.aAtk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEnglishCopy ? 'Melee ATK' : '近接ATK'}</span>
                  <span className="text-orange-400">{result.playerStats.bAtk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{isEnglishCopy ? 'Magic ATK' : '魔法ATK'}</span>
                  <span className="text-purple-400">{result.playerStats.cAtk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SPEED</span>
                  <span className="text-green-400">{result.playerStats.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MAX HP</span>
                  <span className="text-red-400">{result.playerStats.maxHp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">DEF</span>
                  <span className="text-gray-300">{result.playerStats.def}</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-gray-700">
              <div className="text-xs font-bold text-gray-300 mb-2 font-sans">
                ⚡ {isEnglishCopy ? 'Acquired Skills' : '取得スキル'}
              </div>
              {acquiredSkills.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-sm font-sans">
                  {acquiredSkills.map((skill, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-400">{skill.name}</span>
                      <span className="text-yellow-400">{skill.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  {isEnglishCopy ? 'None' : 'なし'}
                </div>
              )}
            </div>
          </div>
        )}

        {!isStageMode && acquiredMagics.length > 0 && (
          <div className="bg-black/40 rounded-xl p-3 border border-gray-700 mb-4">
            <div className="text-xs font-bold text-gray-300 mb-2 font-sans">
              🪄 {isEnglishCopy ? 'Acquired Magic' : '取得魔法'}
            </div>
            <div className="flex flex-wrap gap-3">
              {acquiredMagics.map(({ type, level }) => (
                <div
                  key={type}
                  className="flex items-center gap-2 bg-purple-900/40 px-3 py-2 rounded-lg border border-purple-500/30"
                >
                  <span className="text-xl">{MAGIC_ICONS[type] || '?'}</span>
                  <span className="text-sm text-white font-sans uppercase">{type}</span>
                  <span className="text-xs text-purple-300">Lv.{level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 獲得経験値 */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-xl p-3 border border-yellow-500/30 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-300 font-sans">
              ✨ {isEnglishCopy ? 'Earned XP' : '獲得経験値'}
            </div>
            <div className="text-2xl font-bold text-yellow-400 font-sans">
              +{result.earnedXp} XP
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {isEnglishCopy
              ? `(${Math.floor(result.survivalTime / 60)} minutes × 100 XP)`
              : `(${Math.floor(result.survivalTime / 60)}分 × 100 XP)`}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className={cn(
              'w-full py-2.5 rounded-lg font-bold text-base font-sans transition-colors',
              (isStageClear || isStageClearHint)
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-red-600 hover:bg-red-500'
            )}
          >
            {(isStageClear || isStageClearHint)
              ? (isEnglishCopy ? 'RETRY STAGE' : 'もう一度プレイ')
              : (isEnglishCopy ? 'RETRY' : 'リトライ')}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onBackToSelect}
              className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium font-sans transition-colors"
            >
              {stageDefinition
                ? (isEnglishCopy ? 'Stage Select' : 'ステージ選択')
                : (isEnglishCopy ? 'Stage Select' : '難易度選択')}
            </button>
            <button
              onClick={onBackToMenu}
              className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium font-sans transition-colors"
            >
              {isEnglishCopy ? 'Back to Menu' : 'メニューへ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurvivalGameOver;
