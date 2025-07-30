import { RhythmPattern } from '@/types';

/**
 * ラテンリズムパターン
 */
export const latinPatterns: RhythmPattern[] = [
  {
    id: 'latin-bossa',
    name: 'ボサノバ',
    category: 'latin',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 3,
    duration: 8, // 2小節パターン
    description: 'ブラジルのボサノバリズム',
    notes: [
      // 1小節目
      { id: 'n1', time: 0.0, padIndex: 0, velocity: 90, accent: true, ghost: false }, // Kick
      { id: 'n2', time: 0.0, padIndex: 3, velocity: 80, accent: true, ghost: false }, // Ride
      { id: 'n3', time: 0.75, padIndex: 0, velocity: 70, accent: false, ghost: false }, // Kick
      { id: 'n4', time: 1.0, padIndex: 3, velocity: 60, accent: false, ghost: false }, // Ride
      { id: 'n5', time: 1.5, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
      { id: 'n6', time: 2.0, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride
      { id: 'n7', time: 2.5, padIndex: 0, velocity: 70, accent: false, ghost: false }, // Kick
      { id: 'n8', time: 3.0, padIndex: 3, velocity: 60, accent: false, ghost: false }, // Ride
      { id: 'n9', time: 3.5, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
      // 2小節目（バリエーション）
      { id: 'n10', time: 4.0, padIndex: 0, velocity: 90, accent: true, ghost: false }, // Kick
      { id: 'n11', time: 4.0, padIndex: 3, velocity: 80, accent: true, ghost: false }, // Ride
      { id: 'n12', time: 4.5, padIndex: 0, velocity: 70, accent: false, ghost: false }, // Kick
      { id: 'n13', time: 5.0, padIndex: 3, velocity: 60, accent: false, ghost: false }, // Ride
      { id: 'n14', time: 5.75, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
      { id: 'n15', time: 6.0, padIndex: 3, velocity: 70, accent: false, ghost: false }, // Ride
      { id: 'n16', time: 6.75, padIndex: 0, velocity: 70, accent: false, ghost: false }, // Kick
      { id: 'n17', time: 7.0, padIndex: 3, velocity: 60, accent: false, ghost: false }, // Ride
      { id: 'n18', time: 7.5, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
    ],
  },
  {
    id: 'latin-samba',
    name: 'サンバ',
    category: 'latin',
    bpm: 140,
    timeSignature: { numerator: 2, denominator: 4 },
    difficulty: 4,
    duration: 4,
    description: 'エネルギッシュなサンバリズム',
    notes: [
      // サンバの基本パターン（簡略化）
      { id: 'n1', time: 0.0, padIndex: 0, velocity: 100, accent: true, ghost: false },
      { id: 'n2', time: 0.25, padIndex: 1, velocity: 80, accent: false, ghost: false },
      { id: 'n3', time: 0.5, padIndex: 0, velocity: 80, accent: false, ghost: false },
      { id: 'n4', time: 0.75, padIndex: 1, velocity: 60, accent: false, ghost: true },
      // ... 省略
    ],
  },
  {
    id: 'latin-clave',
    name: 'クラーベ（3-2）',
    category: 'latin',
    bpm: 100,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 2,
    duration: 8, // 2小節で完結
    description: 'ラテン音楽の基本となるクラーベパターン',
    notes: [
      // 3-2 クラーベ
      { id: 'n1', time: 0.0, padIndex: 1, velocity: 100, accent: true, ghost: false },
      { id: 'n2', time: 1.0, padIndex: 1, velocity: 90, accent: false, ghost: false },
      { id: 'n3', time: 2.5, padIndex: 1, velocity: 90, accent: false, ghost: false },
      { id: 'n4', time: 4.5, padIndex: 1, velocity: 90, accent: false, ghost: false },
      { id: 'n5', time: 6.0, padIndex: 1, velocity: 90, accent: false, ghost: false },
    ],
  },
];