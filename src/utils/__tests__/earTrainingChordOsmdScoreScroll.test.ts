import {
  OSMD_BATTLE_PLAYHEAD_PX,
  OSMD_SCROLL_LAYOUT_PRECISION,
  OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB,
  OSMD_WINDOW_STEP_MEASURES,
  clampOsmdManualScrollOffset,
  computeOsmdActiveMeasureHighlight,
  computeOsmdCountInPlayheadProgress,
  computeOsmdEffectiveScaleForMeasure,
  computeOsmdMeasureJumpScrollOffset,
  computeOsmdMeasurePlayheadProgress,
  computeOsmdWindowFitScale,
  computeOsmdWindowJumpScrollOffset,
  computeOsmdWindowStartMeasureNumber,
} from '@/utils/earTrainingChordOsmdScoreScroll';

const bounds = {
  1: { left: 10, right: 90 },
  2: { left: 100, right: 220 },
  3: { left: 220, right: 340 },
  4: { left: 400, right: 520 },
};

const centers = {
  1: 50,
  2: 160,
  3: 280,
  4: 460,
};

describe('computeOsmdWindowStartMeasureNumber', () => {
  it('2 小節単位で窓開始小節を返す', () => {
    expect(computeOsmdWindowStartMeasureNumber(1)).toBe(1);
    expect(computeOsmdWindowStartMeasureNumber(2)).toBe(1);
    expect(computeOsmdWindowStartMeasureNumber(3)).toBe(3);
    expect(computeOsmdWindowStartMeasureNumber(4)).toBe(3);
    expect(computeOsmdWindowStartMeasureNumber(5)).toBe(5);
  });
});

describe('computeOsmdWindowFitScale', () => {
  const uniformBounds = {
    1: { left: 0, right: 100 },
    2: { left: 100, right: 200 },
    3: { left: 200, right: 300 },
    4: { left: 300, right: 400 },
    5: { left: 400, right: 500 },
    6: { left: 500, right: 600 },
  };

  it('4 小節窓の最大幅に合わせてスケールを縮小する', () => {
    // 4小節=400px, viewport=200 → fit=0.5
    expect(computeOsmdWindowFitScale({
      cssScale: 1,
      measureBoundsByNumber: uniformBounds,
      maxMeasureNumber: 6,
      viewportWidth: 200,
      minVisibleMeasures: OSMD_WINDOW_MIN_VISIBLE_MEASURES_WEB,
      stepMeasures: OSMD_WINDOW_STEP_MEASURES,
    })).toBe(0.5);
  });

  it('密集時は 2 小節フィットへフォールバックする', () => {
    const denseBounds = {
      1: { left: 0, right: 150 },
      2: { left: 150, right: 300 },
      3: { left: 300, right: 450 },
      4: { left: 450, right: 600 },
    };
    // 4小節窓 max=600, viewport=200 → fit=0.333 < 0.5 → 2小節窓 max=300 → fit=0.667
    expect(computeOsmdWindowFitScale({
      cssScale: 1,
      measureBoundsByNumber: denseBounds,
      maxMeasureNumber: 4,
      viewportWidth: 200,
      minVisibleMeasures: 4,
      stepMeasures: 2,
    })).toBeCloseTo(0.667, 3);
  });
});

describe('computeOsmdWindowJumpScrollOffset', () => {
  it('窓 1（小節 1-2）はオフセット 0', () => {
    expect(computeOsmdWindowJumpScrollOffset({
      activeMeasureNumber: 2,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    })).toEqual({ offsetPx: 0, xPos: 10 });
  });

  it('小節 3 到達で窓開始 3 の左端へジャンプする', () => {
    const result = computeOsmdWindowJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      effectiveScale: 1,
      scoreWidth: 700,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(220);
    expect(result.offsetPx).toBe(220);
  });

  it('小節 4 も同じ窓（開始 3）のオフセット', () => {
    const m3 = computeOsmdWindowJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      effectiveScale: 1,
      scoreWidth: 700,
      viewportWidth: 400,
    });
    const m4 = computeOsmdWindowJumpScrollOffset({
      activeMeasureNumber: 4,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      effectiveScale: 1,
      scoreWidth: 700,
      viewportWidth: 400,
    });
    expect(m4.offsetPx).toBe(m3.offsetPx);
  });
});

describe('clampOsmdManualScrollOffset', () => {
  it('範囲内では manual オフセットをそのまま返す', () => {
    expect(clampOsmdManualScrollOffset({
      baseOffsetPx: 50,
      manualOffsetPx: 20,
      scoreWidth: 500,
      effectiveScale: 1,
      viewportWidth: 400,
    })).toBe(20);
  });

  it('先頭で base+manual が 0 未満にならないようクランプする', () => {
    expect(clampOsmdManualScrollOffset({
      baseOffsetPx: 50,
      manualOffsetPx: -100,
      scoreWidth: 500,
      effectiveScale: 1,
      viewportWidth: 400,
    })).toBe(-50);
  });

  it('末尾で base+manual が maxOffset を超えないようクランプする', () => {
    expect(clampOsmdManualScrollOffset({
      baseOffsetPx: 80,
      manualOffsetPx: 200,
      scoreWidth: 500,
      effectiveScale: 1,
      viewportWidth: 400,
    })).toBe(20);
  });

  it('譜面幅がビューポートより狭い場合は合成オフセット 0 に収める', () => {
    expect(clampOsmdManualScrollOffset({
      baseOffsetPx: 0,
      manualOffsetPx: 40,
      scoreWidth: 300,
      effectiveScale: 1,
      viewportWidth: 400,
    })).toBe(0);
    expect(clampOsmdManualScrollOffset({
      baseOffsetPx: 10,
      manualOffsetPx: -30,
      scoreWidth: 300,
      effectiveScale: 1,
      viewportWidth: 400,
    })).toBe(-10);
  });
});

describe('computeOsmdMeasureJumpScrollOffset', () => {
  it('現在小節の左端（小節線）をプレイヘッド位置へ合わせる', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(10);
    expect(result.offsetPx).toBe(0);
  });

  it('小節が変わると小節線位置に合わせてオフセットが更新される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 2,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(100);
    expect(result.offsetPx).toBe(0);
  });

  it('anchorToMeasureLeft=true では noteLeft を無視して小節線を使う', () => {
    const firstMeasureBounds = {
      1: { left: 10, right: 90, noteLeft: 70, noteRight: 85 },
    };
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: firstMeasureBounds,
      measureCentersByNumber: { 1: 50 },
      playheadPx: 0,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
      anchorToMeasureLeft: true,
    });
    expect(result.xPos).toBe(10);
    expect(result.offsetPx).toBe(10);
  });

  it('小節境界が無い場合は中心座標へフォールバックする', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 2,
      measureBoundsByNumber: {},
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(160);
  });

  it('オフセットは scoreWidth に clamp される', () => {
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 300,
      viewportWidth: 400,
    });
    expect(result.offsetPx).toBe(0);
  });

  it('1小節目は noteLeft があれば記号域を除いた音符位置でスクロールする', () => {
    const firstMeasureBounds = {
      1: { left: 10, right: 90, noteLeft: 70, noteRight: 85 },
    };
    const result = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: firstMeasureBounds,
      measureCentersByNumber: { 1: 50 },
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    expect(result.xPos).toBe(70);
    expect(result.offsetPx).toBe(0);
  });
});

describe('computeOsmdActiveMeasureHighlight', () => {
  it('曲頭はスクロールがクランプされても小節左端に追従する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: 10,
      widthPx: 80,
      visible: true,
    });
  });

  it('中央域ではプレイヘッド位置と一致する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 3,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: OSMD_BATTLE_PLAYHEAD_PX,
      widthPx: 120,
      visible: true,
    });
  });

  it('終盤でスクロール不能でもハイライトは進む', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 4,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scoreWidth: 300,
      viewportWidth: 400,
    });
    expect(scroll.offsetPx).toBe(0);
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 4,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result).toEqual({
      leftPx: 400,
      widthPx: 120,
      visible: true,
    });
  });

  it('effectiveScale を幅と位置に反映する', () => {
    const scroll = computeOsmdMeasureJumpScrollOffset({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      measureCentersByNumber: centers,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1.5,
      scoreWidth: 500,
      viewportWidth: 400,
    });
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 1,
      measureBoundsByNumber: bounds,
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1.5,
      scrollOffsetPx: scroll.offsetPx,
    });
    expect(result.widthPx).toBe(120);
    expect(result.leftPx).toBe(15);
  });

  it('小節境界が無い場合は非表示', () => {
    const result = computeOsmdActiveMeasureHighlight({
      activeMeasureNumber: 2,
      measureBoundsByNumber: {},
      playheadPx: OSMD_BATTLE_PLAYHEAD_PX,
      effectiveScale: 1,
      scrollOffsetPx: 0,
    });
    expect(result.visible).toBe(false);
  });
});

describe('computeOsmdCountInPlayheadProgress', () => {
  it('負タイムラインを 0..1 にマップする', () => {
    expect(computeOsmdCountInPlayheadProgress(-4, 4)).toBe(0);
    expect(computeOsmdCountInPlayheadProgress(-2, 4)).toBe(0.5);
    expect(computeOsmdCountInPlayheadProgress(0, 4)).toBe(0);
  });

  it('countInDurationSec が 0 のとき常に 0', () => {
    expect(computeOsmdCountInPlayheadProgress(-1, 0)).toBe(0);
  });
});

describe('computeOsmdMeasurePlayheadProgress', () => {
  it('カウントイン中は countIn 進捗を返す', () => {
    expect(computeOsmdMeasurePlayheadProgress({
      phraseTimelineSec: -2,
      activeMeasureNumber: 1,
      measureDurationSec: 2,
      countInDurationSec: 4,
    })).toBe(0.5);
  });

  it('本編は小節内進捗を返す', () => {
    expect(computeOsmdMeasurePlayheadProgress({
      phraseTimelineSec: 3,
      activeMeasureNumber: 2,
      measureDurationSec: 2,
      countInDurationSec: 0,
    })).toBe(0.5);
  });
});

describe('computeOsmdEffectiveScaleForMeasure', () => {
  it('fit 無効のときは cssScale をそのまま返す', () => {
    expect(computeOsmdEffectiveScaleForMeasure({
      cssScale: 1.2,
      bounds: { left: 0, right: 100 },
      viewportWidth: 400,
      fitActiveMeasureWidth: false,
    })).toBe(1.2);
  });

  it('小節が広いときはビューポート幅に収まるよう縮小する', () => {
    // measureWidth=200, cssScale=1 → fit=400/200=2 → clamp(1) → 1
    expect(computeOsmdEffectiveScaleForMeasure({
      cssScale: 1,
      bounds: { left: 0, right: 200 },
      viewportWidth: 400,
      fitActiveMeasureWidth: true,
    })).toBe(1);
    // measureWidth=800, cssScale=1 → fit=400/800=0.5 → 0.5
    expect(computeOsmdEffectiveScaleForMeasure({
      cssScale: 1,
      bounds: { left: 0, right: 800 },
      viewportWidth: 400,
      fitActiveMeasureWidth: true,
    })).toBe(0.5);
  });

  it('minFitScale を下回らない', () => {
    expect(computeOsmdEffectiveScaleForMeasure({
      cssScale: 1,
      bounds: { left: 0, right: 5000 },
      viewportWidth: 400,
      fitActiveMeasureWidth: true,
      minFitScale: 0.35,
    })).toBeCloseTo(0.35, 5);
  });
});

describe('OSMD_SCROLL_LAYOUT_PRECISION', () => {
  it('左端アンカー・fit 有効', () => {
    expect(OSMD_SCROLL_LAYOUT_PRECISION.anchorToMeasureLeft).toBe(true);
    expect(OSMD_SCROLL_LAYOUT_PRECISION.fitActiveMeasureWidth).toBe(true);
    expect(OSMD_SCROLL_LAYOUT_PRECISION.playheadPx).toBe(0);
    expect(OSMD_SCROLL_LAYOUT_PRECISION.fitWindow).toBeUndefined();
  });
});
