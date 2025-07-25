/**
 * ファンタジーモード効果音管理システム
 * 効果音の再生と音量管理を担当
 */

import { useRef, useEffect, useCallback } from 'react';
import { devLog } from '@/utils/logger';

// 効果音ファイルのマッピング
const SOUND_FILES = {
  enemyAttack: '/sounds/enemy_attack.mp3',
  fire: '/sounds/fire.mp3',
  ice: '/sounds/ice.mp3',
  thunder: '/sounds/thunder.mp3'
} as const;

// 魔法名と効果音のマッピング
const MAGIC_SOUND_MAP: Record<string, keyof typeof SOUND_FILES> = {
  // 火属性
  'フレア': 'fire',
  'インフェルノ': 'fire',
  // 氷属性
  'フロスト': 'ice',
  'ブリザード': 'ice',
  // 雷属性
  'スパーク': 'thunder',
  'サンダー・ストライク': 'thunder'
};

export interface FantasySoundManagerProps {
  volume: number; // 0.0 - 1.0
}

export interface FantasySoundManagerInstance {
  playMagicSound: (magicName: string) => void;
  playEnemyAttackSound: () => void;
  setVolume: (volume: number) => void;
}

export const useFantasySoundManager = ({ volume }: FantasySoundManagerProps): FantasySoundManagerInstance => {
  // 音声要素の参照を保持
  const audioElementsRef = useRef<Map<keyof typeof SOUND_FILES, HTMLAudioElement>>(new Map());
  const volumeRef = useRef(volume);
  
  // 音量の更新
  useEffect(() => {
    volumeRef.current = volume;
    // 全ての音声要素の音量を更新
    audioElementsRef.current.forEach(audio => {
      audio.volume = volume;
    });
  }, [volume]);
  
  // 音声要素の初期化
  useEffect(() => {
    const audioElements = new Map<keyof typeof SOUND_FILES, HTMLAudioElement>();
    
    // 各効果音ファイルのAudio要素を作成
    Object.entries(SOUND_FILES).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = volumeRef.current;
      audio.preload = 'auto';
      audioElements.set(key as keyof typeof SOUND_FILES, audio);
    });
    
    audioElementsRef.current = audioElements;
    
    // クリーンアップ
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);
  
  // 効果音を再生する共通関数
  const playSound = useCallback((soundKey: keyof typeof SOUND_FILES) => {
    const audio = audioElementsRef.current.get(soundKey);
    if (!audio) {
      devLog.warn(`効果音が見つかりません: ${soundKey}`);
      return;
    }
    
    try {
      // 同時再生のためにクローンを作成
      const clonedAudio = audio.cloneNode() as HTMLAudioElement;
      clonedAudio.volume = volumeRef.current;
      
      // 再生終了後にメモリから削除
      clonedAudio.addEventListener('ended', () => {
        clonedAudio.remove();
      });
      
      // エラーハンドリング
      clonedAudio.addEventListener('error', (e) => {
        devLog.error(`効果音再生エラー: ${soundKey}`, e);
        clonedAudio.remove();
      });
      
      // 再生
      clonedAudio.play().catch(error => {
        devLog.error(`効果音再生失敗: ${soundKey}`, error);
      });
      
      devLog.debug(`🔊 効果音再生: ${soundKey}`);
    } catch (error) {
      devLog.error(`効果音再生エラー: ${soundKey}`, error);
    }
  }, []);
  
  // 魔法効果音の再生
  const playMagicSound = useCallback((magicName: string) => {
    const soundKey = MAGIC_SOUND_MAP[magicName];
    if (!soundKey) {
      devLog.warn(`魔法名に対応する効果音が見つかりません: ${magicName}`);
      return;
    }
    
    playSound(soundKey);
  }, [playSound]);
  
  // 敵攻撃効果音の再生
  const playEnemyAttackSound = useCallback(() => {
    playSound('enemyAttack');
  }, [playSound]);
  
  // 音量設定の更新
  const setVolume = useCallback((newVolume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, newVolume));
    audioElementsRef.current.forEach(audio => {
      audio.volume = volumeRef.current;
    });
  }, []);
  
  return {
    playMagicSound,
    playEnemyAttackSound,
    setVolume
  };
};