import { describe, expect, it } from 'vitest';
import {
  createPromoVideoSession,
  watchProgressPercent,
  watchSeconds,
} from '@/utils/analytics/promoVideoEvents';

describe('createPromoVideoSession', () => {
  it('fires play only once', () => {
    const session = createPromoVideoSession();
    expect(session.onPlay()).toBe(true);
    expect(session.onPlay()).toBe(false);
    expect(session.hasPlayed()).toBe(true);
  });

  it('fires complete once after play, and blocks abandon after complete', () => {
    const session = createPromoVideoSession();
    expect(session.onComplete()).toBe(false);
    expect(session.onPlay()).toBe(true);
    expect(session.onComplete()).toBe(true);
    expect(session.onComplete()).toBe(false);
    expect(session.onAbandon()).toBe(false);
    expect(session.hasCompleted()).toBe(true);
  });

  it('fires abandon once after play without complete', () => {
    const session = createPromoVideoSession();
    expect(session.onAbandon()).toBe(false);
    expect(session.onPlay()).toBe(true);
    expect(session.onAbandon()).toBe(true);
    expect(session.onAbandon()).toBe(false);
  });
});

describe('watchProgressPercent / watchSeconds', () => {
  it('clamps progress percent', () => {
    expect(watchProgressPercent(43.25, 86.5)).toBe(50);
    expect(watchProgressPercent(0, 86.5)).toBe(0);
    expect(watchProgressPercent(100, 86.5)).toBe(100);
    expect(watchProgressPercent(10, 0)).toBe(0);
    expect(watchProgressPercent(Number.NaN, 86.5)).toBe(0);
  });

  it('rounds watch seconds', () => {
    expect(watchSeconds(12.4)).toBe(12);
    expect(watchSeconds(12.6)).toBe(13);
    expect(watchSeconds(-1)).toBe(0);
  });
});
