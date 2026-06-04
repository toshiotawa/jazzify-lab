import { computeBackgroundParallaxY } from './CodeRunCanvas';

describe('computeBackgroundParallaxY', () => {
  it('縦長ワールドでは縦パララックスを無効にする', () => {
    expect(computeBackgroundParallaxY(1440, 528, 912)).toBe(0);
  });

  it('ビューと同じ高さのワールドでは従来どおり縦パララックスを適用する', () => {
    expect(computeBackgroundParallaxY(528, 528, 100)).toBe(-8);
  });
});
