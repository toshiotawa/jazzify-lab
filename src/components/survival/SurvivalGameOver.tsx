/**
 * サバイバルモード ゲームオーバー画面
 * 結果表示とステータスカード
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { SurvivalGameResult, SurvivalDifficulty } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { upsertSurvivalHighScore } from '@/platform/supabaseSurvival';
import { addXp } from '@/platform/supabaseXp';

interface SurvivalGameOverProps {
  result: SurvivalGameResult;
  difficulty: SurvivalDifficulty;
  onRetry: () => void;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
  waveFailedReason?: string;  // 'quota_failed' = WAVEノルマ失敗
  finalWave?: number;
}

// 難易度の色設定
const DIFFICULTY_COLORS: Record<SurvivalDifficulty, string> = {
  easy: 'text-green-400',
  normal: 'text-blue-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400',
};

const SurvivalGameOver: React.FC<SurvivalGameOverProps> = ({
  result,
  difficulty,
  onRetry,
  onBackToSelect,
  onBackToMenu,
  waveFailedReason,
  finalWave,
}) => {
  const { profile, isGuest, fetchProfile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [xpAdded, setXpAdded] = useState(false);
  
  // ハイスコア保存とXP付与（ローカルストレージとデータベースの両方に保存）
  useEffect(() => {
    const saveHighScoreAndAddXp = async () => {
      const survivalTime = Math.floor(result.survivalTime);
      
      // ローカルストレージに常に保存（バックアップとして）
      const saveToLocalStorage = () => {
        try {
          const key = 'survival_high_scores';
          const saved = localStorage.getItem(key);
          const scores: Record<string, { survivalTime: number; finalLevel: number; enemiesDefeated: number }> = 
            saved ? JSON.parse(saved) : {};
          
          const existing = scores[difficulty];
          if (!existing || existing.survivalTime < survivalTime) {
            scores[difficulty] = {
              survivalTime,
              finalLevel: result.finalLevel,
              enemiesDefeated: result.enemiesDefeated,
            };
            localStorage.setItem(key, JSON.stringify(scores));
            return true; // ハイスコア更新
          }
          return false;
        } catch (error) {
          console.error('Failed to save local high score:', error);
          return false;
        }
      };
      
      // ローカルストレージに保存
      const localHighScore = saveToLocalStorage();
      
      if (profile && !isGuest) {
        // ログインユーザー: Supabaseにも保存を試みる
        try {
          const { isNewHighScore: isNew } = await upsertSurvivalHighScore(
            profile.id,
            difficulty,
            survivalTime,
            result.finalLevel,
            result.enemiesDefeated
          );
          // APIから返されたフラグでハイスコア更新を判定
          setIsNewHighScore(isNew);
        } catch (error) {
          console.error('Failed to save high score to database:', error);
          // データベース保存に失敗しても、ローカルストレージの結果を使用
          setIsNewHighScore(localHighScore);
        }
        
        // XPをプロフィールに付与（一度だけ）
        if (!xpAdded && result.earnedXp > 0) {
          try {
            await addXp({
              songId: null,  // サバイバルモードは曲なし
              baseXp: result.earnedXp,
              speedMultiplier: 1,
              rankMultiplier: 1,
              transposeMultiplier: 1,
              membershipMultiplier: 1,
              reason: `survival_${difficulty}_${Math.floor(survivalTime / 60)}min`,
            });
            setXpAdded(true);
            // プロフィールを更新して新しいXPを反映
            await fetchProfile({ forceRefresh: true });
          } catch (error) {
            console.error('Failed to add XP:', error);
          }
        }
      } else {
        // ゲスト: ローカルストレージの結果のみ
        setIsNewHighScore(localHighScore);
      }
    };
    
    saveHighScoreAndAddXp();
  }, [profile, isGuest, difficulty, result, xpAdded, fetchProfile]);
  
  // 時間フォーマット（60分以上の場合はh:mm:ss形式）
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 取得した魔法一覧
  const acquiredMagics = Object.entries(result.magics)
    .filter(([_, level]) => level > 0)
    .map(([type, level]) => ({ type, level }));
  
  // 取得したスキル一覧
  const acquiredSkills: Array<{ name: string; value: string | number }> = [];
  if (result.skills.aPenetration) acquiredSkills.push({ name: '貫通', value: '✓' });
  if (result.skills.bKnockbackBonus > 0) acquiredSkills.push({ name: 'ノックバック', value: `+${result.skills.bKnockbackBonus}` });
  if (result.skills.bRangeBonus > 0) acquiredSkills.push({ name: '攻撃範囲', value: `+${result.skills.bRangeBonus}` });
  if (result.skills.bDeflect) acquiredSkills.push({ name: '拳でかきけす', value: '✓' });
  if (result.skills.multiHitLevel > 0) acquiredSkills.push({ name: '多段攻撃', value: `Lv.${result.skills.multiHitLevel}` });
  if (result.skills.expBonusLevel > 0) acquiredSkills.push({ name: '獲得経験値+', value: `Lv.${result.skills.expBonusLevel}` });
  if (result.skills.haisuiNoJin) acquiredSkills.push({ name: '背水の陣', value: '✓' });
  if (result.skills.zekkouchou) acquiredSkills.push({ name: '絶好調', value: '✓' });
  
  // 魔法アイコン
  const MAGIC_ICONS: Record<string, string> = {
    thunder: '⚡',
    ice: '❄️',
    fire: '🔥',
    heal: '💚',
    buffer: '⬆️',
    debuffer: '⬇️',
    hint: '💡',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-2xl w-full mx-4 my-8 p-6 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 border-red-500 shadow-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💀</div>
          <div className="text-4xl font-bold text-red-500 font-sans mb-2">
            GAME OVER
          </div>
          
          {/* ハイスコア更新表示 */}
          {isNewHighScore && (
            <div className="mt-2 px-4 py-2 bg-yellow-600/50 rounded-lg border border-yellow-400 animate-pulse">
              <div className="text-yellow-300 font-bold font-sans">
                🏆 {isEnglishCopy ? 'NEW HIGH SCORE!' : 'ハイスコア更新！'}
              </div>
            </div>
          )}
          
          {/* WAVE失敗理由 */}
          {waveFailedReason === 'quota_failed' ? (
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
          
          {/* WAVE到達情報 */}
          {finalWave && (
            <div className="mt-2 text-sm text-yellow-400">
              🏆 WAVE {finalWave} {isEnglishCopy ? 'reached' : '到達'}
            </div>
          )}
        </div>
        
        {/* メイン結果 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-black/40 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-white font-sans">
              {formatTime(result.survivalTime)}
            </div>
            <div className="text-xs text-gray-400">
              {isEnglishCopy ? 'Survival Time' : '生存時間'}
            </div>
          </div>
          
          <div className="bg-black/40 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-yellow-400 font-sans">
              Lv.{result.finalLevel}
            </div>
            <div className="text-xs text-gray-400">
              {isEnglishCopy ? 'Final Level' : '最終レベル'}
            </div>
          </div>
          
          <div className="bg-black/40 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-3xl mb-2">💀</div>
            <div className="text-2xl font-bold text-red-400 font-sans">
              {result.enemiesDefeated}
            </div>
            <div className="text-xs text-gray-400">
              {isEnglishCopy ? 'Enemies Defeated' : '撃破数'}
            </div>
          </div>
        </div>
        
        {/* ステータスカード */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 最終ステータス */}
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
            <div className="text-sm font-bold text-gray-300 mb-3 font-sans">
              📊 {isEnglishCopy ? 'Final Stats' : '最終ステータス'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-gray-400">A ATK</span>
                <span className="text-blue-400">{result.playerStats.aAtk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">B ATK</span>
                <span className="text-orange-400">{result.playerStats.bAtk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">C ATK</span>
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
          
          {/* 取得スキル */}
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
            <div className="text-sm font-bold text-gray-300 mb-3 font-sans">
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
        
        {/* 取得魔法 */}
        {acquiredMagics.length > 0 && (
          <div className="bg-black/40 rounded-xl p-4 border border-gray-700 mb-6">
            <div className="text-sm font-bold text-gray-300 mb-3 font-sans">
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
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-xl p-4 border border-yellow-500/30 mb-6">
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
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg font-sans transition-colors"
          >
            {isEnglishCopy ? 'RETRY' : 'リトライ'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onBackToSelect}
              className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium font-sans transition-colors"
            >
              {isEnglishCopy ? 'Stage Select' : '難易度選択'}
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
