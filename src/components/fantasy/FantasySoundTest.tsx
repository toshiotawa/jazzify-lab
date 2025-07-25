/**
 * ファンタジーモード効果音テストコンポーネント
 * 効果音システムの動作確認用
 */

import React, { useState } from 'react';
import { useFantasySoundManager } from './FantasySoundManager';

const FantasySoundTest: React.FC = () => {
  const [volume, setVolume] = useState(0.8);
  const soundManager = useFantasySoundManager({ volume });
  
  const magicSpells = [
    { name: 'フレア', color: 'text-red-500' },
    { name: 'インフェルノ', color: 'text-red-600' },
    { name: 'フロスト', color: 'text-blue-400' },
    { name: 'ブリザード', color: 'text-blue-500' },
    { name: 'スパーク', color: 'text-yellow-400' },
    { name: 'サンダー・ストライク', color: 'text-yellow-500' }
  ];
  
  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">ファンタジーモード効果音テスト</h1>
      
      {/* 音量調整 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          効果音音量: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            soundManager.setVolume(newVolume);
          }}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      {/* 魔法効果音テスト */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">魔法効果音</h2>
        <div className="grid grid-cols-2 gap-3">
          {magicSpells.map((spell) => (
            <button
              key={spell.name}
              onClick={() => soundManager.playMagicSound(spell.name)}
              className={`px-4 py-2 ${spell.color} bg-gray-800 hover:bg-gray-700 rounded transition-colors font-bold`}
            >
              {spell.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 敵攻撃効果音テスト */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">敵攻撃効果音</h2>
        <button
          onClick={() => soundManager.playEnemyAttackSound()}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded transition-colors font-bold"
        >
          敵の攻撃！
        </button>
      </div>
      
      {/* 説明 */}
      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h3 className="font-bold mb-2">ファイル配置について</h3>
        <p className="text-sm text-gray-300">
          以下の効果音ファイルを /public/sounds/ ディレクトリに配置してください：
        </p>
        <ul className="list-disc list-inside mt-2 text-sm text-gray-300">
          <li>enemy_attack.mp3 - 敵の攻撃音</li>
          <li>fire.mp3 - 火属性魔法</li>
          <li>ice.mp3 - 氷属性魔法</li>
          <li>thunder.mp3 - 雷属性魔法</li>
        </ul>
      </div>
    </div>
  );
};

export default FantasySoundTest;