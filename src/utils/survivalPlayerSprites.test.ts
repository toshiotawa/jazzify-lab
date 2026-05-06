import { describe, it, expect } from 'vitest';
import type { Direction } from '@/components/survival/SurvivalTypes';
import {
  getSurvivalDefaultSpriteForDirection,
  getSurvivalDescentSpriteForFacing,
  SURVIVAL_DEFAULT_SPRITE_PATHS,
} from './survivalPlayerSprites';

describe('getSurvivalDefaultSpriteForDirection', () => {
  const cases: Array<[Direction, { variant: keyof typeof SURVIVAL_DEFAULT_SPRITE_PATHS; flipX: boolean }]> = [
    ['right', { variant: 'migi', flipX: false }],
    ['down-right', { variant: 'naname_migi_shita', flipX: false }],
    ['up-right', { variant: 'naname_migi_ue', flipX: false }],
    ['down', { variant: 'shita', flipX: false }],
    ['up', { variant: 'ue', flipX: false }],
    ['left', { variant: 'migi', flipX: true }],
    ['down-left', { variant: 'naname_migi_shita', flipX: true }],
    ['up-left', { variant: 'naname_migi_ue', flipX: true }],
  ];

  it.each(cases)('direction %s', (direction, expected) => {
    expect(getSurvivalDefaultSpriteForDirection(direction)).toEqual(expected);
  });

  it('paths exist for every variant used', () => {
    cases.forEach(([direction]) => {
      const { variant } = getSurvivalDefaultSpriteForDirection(direction);
      expect(SURVIVAL_DEFAULT_SPRITE_PATHS[variant]).toMatch(/^\/default_avater\/muki\//);
    });
  });
});

describe('getSurvivalDescentSpriteForFacing', () => {
  it('maps right / left / center', () => {
    expect(getSurvivalDescentSpriteForFacing('right')).toEqual({ variant: 'migi', flipX: false });
    expect(getSurvivalDescentSpriteForFacing('left')).toEqual({ variant: 'migi', flipX: true });
    expect(getSurvivalDescentSpriteForFacing('center')).toEqual({ variant: 'shita', flipX: false });
  });
});
