import { RhythmPattern } from '@/types';

/**
 * 基本的なリズムパターン
 */
export const basicPatterns: RhythmPattern[] = [
  {
    id: 'basic-4beat',
    name: '4ビート',
    category: 'basic',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 1,
    duration: 8, // 2小節分
    description: '基本的な4/4拍子のビート',
    notes: [
      // 1小節目
      { id: 'n1', time: 0.0, padIndex: 0, velocity: 100, accent: true, ghost: false }, // Kick
      { id: 'n2', time: 0.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n3', time: 1.0, padIndex: 1, velocity: 90, accent: false, ghost: false }, // Snare
      { id: 'n4', time: 1.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n5', time: 2.0, padIndex: 0, velocity: 100, accent: false, ghost: false }, // Kick
      { id: 'n6', time: 2.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n7', time: 3.0, padIndex: 1, velocity: 90, accent: false, ghost: false }, // Snare
      { id: 'n8', time: 3.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      // 2小節目（繰り返し）
      { id: 'n9', time: 4.0, padIndex: 0, velocity: 100, accent: true, ghost: false },
      { id: 'n10', time: 4.5, padIndex: 2, velocity: 80, accent: false, ghost: false },
      { id: 'n11', time: 5.0, padIndex: 1, velocity: 90, accent: false, ghost: false },
      { id: 'n12', time: 5.5, padIndex: 2, velocity: 80, accent: false, ghost: false },
      { id: 'n13', time: 6.0, padIndex: 0, velocity: 100, accent: false, ghost: false },
      { id: 'n14', time: 6.5, padIndex: 2, velocity: 80, accent: false, ghost: false },
      { id: 'n15', time: 7.0, padIndex: 1, velocity: 90, accent: false, ghost: false },
      { id: 'n16', time: 7.5, padIndex: 2, velocity: 80, accent: false, ghost: false },
    ],
  },
  {
    id: 'basic-8beat',
    name: '8ビート',
    category: 'basic',
    bpm: 100,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 2,
    duration: 4, // 1小節分
    description: '基本的な8ビートパターン',
    notes: [
      { id: 'n1', time: 0.0, padIndex: 0, velocity: 100, accent: true, ghost: false }, // Kick
      { id: 'n2', time: 0.0, padIndex: 2, velocity: 90, accent: true, ghost: false }, // Hi-hat
      { id: 'n3', time: 0.25, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n4', time: 0.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n5', time: 0.5, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
      { id: 'n6', time: 0.75, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n7', time: 1.0, padIndex: 1, velocity: 100, accent: false, ghost: false }, // Snare
      { id: 'n8', time: 1.0, padIndex: 2, velocity: 90, accent: false, ghost: false }, // Hi-hat
      { id: 'n9', time: 1.25, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n10', time: 1.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n11', time: 1.75, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n12', time: 2.0, padIndex: 0, velocity: 100, accent: false, ghost: false }, // Kick
      { id: 'n13', time: 2.0, padIndex: 2, velocity: 90, accent: false, ghost: false }, // Hi-hat
      { id: 'n14', time: 2.25, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n15', time: 2.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n16', time: 2.5, padIndex: 0, velocity: 80, accent: false, ghost: false }, // Kick
      { id: 'n17', time: 2.75, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n18', time: 3.0, padIndex: 1, velocity: 100, accent: false, ghost: false }, // Snare
      { id: 'n19', time: 3.0, padIndex: 2, velocity: 90, accent: false, ghost: false }, // Hi-hat
      { id: 'n20', time: 3.25, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
      { id: 'n21', time: 3.5, padIndex: 2, velocity: 80, accent: false, ghost: false }, // Hi-hat
      { id: 'n22', time: 3.75, padIndex: 2, velocity: 70, accent: false, ghost: false }, // Hi-hat
    ],
  },
  {
    id: 'basic-16beat',
    name: '16ビート',
    category: 'basic',
    bpm: 90,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 3,
    duration: 4,
    description: '16分音符を使用したビートパターン',
    notes: [
      // より複雑な16ビートパターン（実装省略）
      { id: 'n1', time: 0.0, padIndex: 0, velocity: 100, accent: true, ghost: false },
      { id: 'n2', time: 0.0, padIndex: 2, velocity: 90, accent: true, ghost: false },
      // ... 省略
    ],
  },
  {
    id: 'basic-metronome',
    name: 'メトロノーム',
    category: 'basic',
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    difficulty: 1,
    duration: 4,
    description: 'シンプルなメトロノームパターン',
    notes: [
      { id: 'n1', time: 0.0, padIndex: 2, velocity: 100, accent: true, ghost: false },
      { id: 'n2', time: 1.0, padIndex: 2, velocity: 80, accent: false, ghost: false },
      { id: 'n3', time: 2.0, padIndex: 2, velocity: 80, accent: false, ghost: false },
      { id: 'n4', time: 3.0, padIndex: 2, velocity: 80, accent: false, ghost: false },
    ],
  },
];