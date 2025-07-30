import { RhythmPattern } from '@/types';

/**
 * ジャズリズムパターン
 */
export const jazzPatterns: RhythmPattern[] = [
  {
    id: 'jazz-swing',
    name: 'スウィング',
    category: 'jazz',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 2,
    duration: 4,
    description: '基本的なジャズスウィングパターン',
    notes: [
      // ライドシンバルでスウィングパターン
      { id: 'n1', time: 0.0, padIndex: 3, velocity: 90, accent: true, ghost: false }, // Ride
      { id: 'n2', time: 0.67, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride (swing)
      { id: 'n3', time: 1.0, padIndex: 3, velocity: 80, accent: false, ghost: false }, // Ride
      { id: 'n4', time: 1.67, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride (swing)
      { id: 'n5', time: 2.0, padIndex: 3, velocity: 90, accent: false, ghost: false }, // Ride
      { id: 'n6', time: 2.0, padIndex: 1, velocity: 100, accent: false, ghost: false }, // Snare
      { id: 'n7', time: 2.67, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride (swing)
      { id: 'n8', time: 3.0, padIndex: 3, velocity: 80, accent: false, ghost: false }, // Ride
      { id: 'n9', time: 3.67, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride (swing)
      // ハイハット（2,4拍）
      { id: 'n10', time: 1.0, padIndex: 2, velocity: 60, accent: false, ghost: false }, // Hi-hat
      { id: 'n11', time: 3.0, padIndex: 2, velocity: 60, accent: false, ghost: false }, // Hi-hat
    ],
  },
  {
    id: 'jazz-bebop',
    name: 'ビバップ',
    category: 'jazz',
    bpm: 180,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 4,
    duration: 4,
    description: '速いテンポのビバップスタイル',
    notes: [
      // 高速スウィングパターン
      { id: 'n1', time: 0.0, padIndex: 3, velocity: 90, accent: true, ghost: false },
      { id: 'n2', time: 0.33, padIndex: 3, velocity: 60, accent: false, ghost: true },
      { id: 'n3', time: 0.5, padIndex: 3, velocity: 80, accent: false, ghost: false },
      { id: 'n4', time: 0.83, padIndex: 3, velocity: 60, accent: false, ghost: true },
      // ... 省略
    ],
  },
  {
    id: 'jazz-brush',
    name: 'ブラシパターン',
    category: 'jazz',
    bpm: 100,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 3,
    duration: 4,
    description: 'ブラシを使った柔らかいジャズパターン',
    notes: [
      // ソフトなブラシパターン
      { id: 'n1', time: 0.0, padIndex: 1, velocity: 50, accent: false, ghost: true },
      { id: 'n2', time: 0.5, padIndex: 1, velocity: 40, accent: false, ghost: true },
      { id: 'n3', time: 1.0, padIndex: 1, velocity: 60, accent: false, ghost: false },
      { id: 'n4', time: 1.5, padIndex: 1, velocity: 40, accent: false, ghost: true },
      // ... 省略
    ],
  },
];