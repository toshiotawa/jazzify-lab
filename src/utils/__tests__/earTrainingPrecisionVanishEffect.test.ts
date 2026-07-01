import { computePrecisionVanishEffectCenter } from '@/utils/earTrainingPrecisionVanishEffect';

describe('computePrecisionVanishEffectCenter', () => {
  it('短音は矩形中心を使う', () => {
    const rect = { x: 10, y: 20, width: 40, height: 12 };
    const center = computePrecisionVanishEffectCenter(rect, true);
    expect(center).toEqual({ cx: 30, cy: 26 });
  });

  it('長音は上端付近を使う', () => {
    const rect = { x: 10, y: 20, width: 40, height: 100 };
    const center = computePrecisionVanishEffectCenter(rect, false);
    expect(center.cx).toBe(30);
    expect(center.cy).toBe(28);
  });

  it('長音の高さが小さいときも上端寄りにクランプする', () => {
    const rect = { x: 0, y: 50, width: 20, height: 30 };
    const center = computePrecisionVanishEffectCenter(rect, false);
    expect(center.cy).toBe(53.6);
  });
});
