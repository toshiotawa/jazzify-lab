import { describe, expect, it } from 'vitest';
import {
  pickNextQuizIndex,
  isQuizClear,
} from '@/utils/earTrainingChordQuiz';

const three = [{ order_index: 0 }, { order_index: 1 }, { order_index: 2 }];

describe('pickNextQuizIndex', () => {
  it('returns 0 for sequential with prev null', () => {
    expect(pickNextQuizIndex(three, 'sequential', null, () => 0)).toBe(0);
  });

  it('cycles sequential', () => {
    expect(pickNextQuizIndex(three, 'sequential', 0, () => 0)).toBe(1);
    expect(pickNextQuizIndex(three, 'sequential', 2, () => 0)).toBe(0);
  });

  it('returns 0 for single item random', () => {
    expect(pickNextQuizIndex([{ order_index: 0 }], 'random', 0, () => 0.99)).toBe(0);
  });

  it('random never equals prev when n>1 and rand avoids equality', () => {
    const seq = [0.99, 0.99, 0.66];
    let i = 0;
    const rand = () => {
      const v = seq[i] ?? 0.1;
      i += 1;
      return v;
    };
    const first = pickNextQuizIndex(three, 'random', null, rand);
    const second = pickNextQuizIndex(three, 'random', first, rand);
    expect(second).not.toBe(first);
    const third = pickNextQuizIndex(three, 'random', second, () => second / 10);
    expect(third).not.toBe(second);
  });

  it('random falls back (+1)%n after guard when rand stalls on prevIndex', () => {
    let call = 0;
    const stalledRand = () => {
      call += 1;
      return call <= 35 ? 0.5 : 0.1;
    };
    expect(pickNextQuizIndex(three, 'random', 1, stalledRand)).toBe(2);
  });
});

describe('isQuizClear', () => {
  it('checks threshold', () => {
    expect(isQuizClear(10, 10)).toBe(true);
    expect(isQuizClear(9, 10)).toBe(false);
  });
});
