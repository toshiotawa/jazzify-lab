/**
 * サバイバルモード ゲームオーバー画面
 * 結果表示とステータスカード
 */

import React from 'react';
import { cn } from '@/utils/cn';
import { SurvivalGameResult, SurvivalDifficulty } from './SurvivalTypes';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';

interface SurvivalGameOverProps {
  result: SurvivalGameResult;
  difficulty: SurvivalDifficulty;
  onRetry: () => void;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
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
}) => {
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  
  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 取得した魔法一覧
  const acquiredMagics = Object.entries(result.magics)
    .filter(([_, level]) => level > 0)
    .map(([type, level]) => ({ type, level }));
  
  // 取得したスキル一覧
  const acquiredSkills: Array<{ name: string; value: string | number }> = [];
  if (result.skills.aPenetration) acquiredSkills.push({ name: '貫通', value: '✓' });
  if (result.skills.aBackBullet > 0) acquiredSkills.push({ name: '後方弾', value: `+${result.skills.aBackBullet}` });
  if (result.skills.aRightBullet > 0) acquiredSkills.push({ name: '右側弾', value: `+${result.skills.aRightBullet}` });
  if (result.skills.aLeftBullet > 0) acquiredSkills.push({ name: '左側弾', value: `+${result.skills.aLeftBullet}` });
  if (result.skills.bKnockbackBonus > 0) acquiredSkills.push({ name: 'ノックバック', value: `+${result.skills.bKnockbackBonus}` });
  if (result.skills.bRangeBonus > 0) acquiredSkills.push({ name: '攻撃範囲', value: `+${result.skills.bRangeBonus}` });
  if (result.skills.multiHitLevel > 0) acquiredSkills.push({ name: '多段攻撃', value: `Lv.${result.skills.multiHitLevel}` });
  
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
          <div className={cn('text-lg font-sans', DIFFICULTY_COLORS[difficulty])}>
            {difficulty.toUpperCase()}
          </div>
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
