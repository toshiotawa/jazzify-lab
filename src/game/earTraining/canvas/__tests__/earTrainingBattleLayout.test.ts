import {
  CHARACTER_DISPLAY_SIZE,
  computeQuoteBubbleRootOffsetY,
  computeQuoteBubbleTopY,
  createEarTrainingChordVoicingStaffBand,
  EAR_TRAINING_OSMD_STAFF_BAND,
  getDemoBubblePosition,
  getDemoBubbleVisualTopY,
  getFloorY,
  PLAYER_QUOTE_GAP_BELOW_SPRITE_PX,
  PLAYER_QUOTE_TAIL_HEIGHT,
  resolveStaffReservedBottomY,
  STAFF_RESERVED_MARGIN_PX,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';

describe('earTrainingBattleLayout staff band', () => {
  it('returns zero reserved bottom when staff band is absent', () => {
    expect(resolveStaffReservedBottomY(800, 1024)).toBe(0);
  });

  it('computes OSMD reserved bottom from center ratio and height cap', () => {
    const height = 800;
    const bandHeight = Math.min(280, height * 0.42);
    const expected = height * 0.42 + bandHeight / 2 + STAFF_RESERVED_MARGIN_PX;
    expect(resolveStaffReservedBottomY(height, 1024, EAR_TRAINING_OSMD_STAFF_BAND)).toBe(expected);
  });

  it('computes chord voicing reserved bottom from rendered staff height', () => {
    const height = 720;
    const width = 900;
    const reserved = resolveStaffReservedBottomY(height, width, createEarTrainingChordVoicingStaffBand());
    expect(reserved).toBeGreaterThan(height * 0.44);
  });
});

describe('earTrainingBattleLayout quote bubble placement', () => {
  const anchorFootY = getFloorY(800);
  const bubbleHeight = 48;

  it('keeps legacy top when staff band is absent', () => {
    const legacyTop = anchorFootY
      - CHARACTER_DISPLAY_SIZE
      - PLAYER_QUOTE_GAP_BELOW_SPRITE_PX
      - bubbleHeight
      - PLAYER_QUOTE_TAIL_HEIGHT;
    expect(computeQuoteBubbleTopY(anchorFootY, bubbleHeight, 0)).toBe(legacyTop);
  });

  it('pushes bubble below staff reserved band when legacy would overlap', () => {
    const staffBottom = 420;
    const topY = computeQuoteBubbleTopY(anchorFootY, bubbleHeight, staffBottom);
    expect(topY).toBeGreaterThanOrEqual(staffBottom);
    expect(topY).toBe(staffBottom);
  });

  it('derives phaser root offset from clamped bubble top', () => {
    const staffBottom = 420;
    const topY = computeQuoteBubbleTopY(anchorFootY, bubbleHeight, staffBottom);
    const rootOffset = computeQuoteBubbleRootOffsetY(anchorFootY, bubbleHeight, staffBottom);
    expect(rootOffset).toBe(topY - anchorFootY + PLAYER_QUOTE_TAIL_HEIGHT + bubbleHeight);
  });
});

describe('earTrainingBattleLayout demo bubble placement', () => {
  it('keeps legacy anchor when staff band is absent', () => {
    const width = 900;
    const height = 800;
    const floorY = getFloorY(height);
    const legacyY = Math.max(150 + 46, floorY - CHARACTER_DISPLAY_SIZE - 38);
    expect(getDemoBubblePosition(width, height, 0).y).toBe(legacyY);
  });

  it('lowers demo bubble when staff band would overlap visual top', () => {
    const width = 900;
    const height = 800;
    const staffBottom = 500;
    const pos = getDemoBubblePosition(width, height, staffBottom);
    expect(getDemoBubbleVisualTopY(pos.y)).toBeGreaterThanOrEqual(staffBottom);
  });
});
