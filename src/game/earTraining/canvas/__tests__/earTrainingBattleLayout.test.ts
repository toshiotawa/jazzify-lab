import {
  CHARACTER_DISPLAY_SIZE,
  computeQuoteBubbleRootOffsetFromPlacement,
  computeQuoteBubbleSidePlacement,
  createEarTrainingChordVoicingStaffBand,
  EAR_TRAINING_OSMD_STAFF_BAND,
  getDemoBubblePosition,
  getDemoBubbleVisualTopY,
  getFloorY,
  PIANO_OVERLAY_HEIGHT,
  resolveStaffReservedBottomY,
  SIDE_BUBBLE_CHAR_GAP_PX,
  SIDE_BUBBLE_EDGE_MARGIN_PX,
  SIDE_BUBBLE_TAIL_LENGTH_PX,
  STAFF_RESERVED_MARGIN_PX,
} from '@/game/earTraining/canvas/earTrainingBattleLayout';

describe('earTrainingBattleLayout staff band', () => {
  it('returns zero reserved bottom when staff band is absent', () => {
    expect(resolveStaffReservedBottomY(800, 1024)).toBe(0);
  });

  it('computes OSMD reserved bottom from center ratio and height cap', () => {
    const height = 800;
    const bandHeight = Math.min(360, height * 0.52);
    const expected = height * 0.36 + bandHeight / 2 + STAFF_RESERVED_MARGIN_PX;
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
  const viewportWidth = 900;
  const viewportHeight = 800;
  const footY = getFloorY(viewportHeight);
  const playerX = viewportWidth * 0.23;
  const partnerX = viewportWidth * 0.77;
  const bubbleWidth = 100;
  const bubbleHeight = 48;
  const gap = SIDE_BUBBLE_CHAR_GAP_PX + SIDE_BUBBLE_TAIL_LENGTH_PX;
  const charHalf = CHARACTER_DISPLAY_SIZE / 2;

  it('places player bubble on the left with tail toward character', () => {
    const placement = computeQuoteBubbleSidePlacement(
      playerX,
      footY,
      bubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'left',
    );
    expect(placement.bubbleX).toBe(playerX - charHalf - gap - bubbleWidth);
    expect(placement.tailSide).toBe('right');
    expect(placement.bubbleY).toBe(footY - bubbleHeight / 2);
  });

  it('places partner bubble on the right with tail toward character', () => {
    const placement = computeQuoteBubbleSidePlacement(
      partnerX,
      footY,
      bubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'right',
    );
    expect(placement.bubbleX).toBe(partnerX + charHalf + gap);
    expect(placement.tailSide).toBe('left');
  });

  it('clamps bubble top to staff reserved bottom', () => {
    const staffBottom = footY - 10;
    const placement = computeQuoteBubbleSidePlacement(
      playerX,
      footY,
      bubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'left',
      staffBottom,
    );
    expect(placement.bubbleY).toBeGreaterThanOrEqual(staffBottom);
  });

  it('clamps bubble bottom above piano overlay', () => {
    const placement = computeQuoteBubbleSidePlacement(
      playerX,
      footY,
      bubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'left',
    );
    const maxTop = viewportHeight - PIANO_OVERLAY_HEIGHT - 4 - bubbleHeight;
    expect(placement.bubbleY).toBeLessThanOrEqual(maxTop);
  });

  it('derives phaser root offset from side placement', () => {
    const placement = computeQuoteBubbleSidePlacement(
      playerX,
      footY,
      bubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'left',
    );
    const rootOffset = computeQuoteBubbleRootOffsetFromPlacement(placement, playerX, footY);
    expect(rootOffset.x).toBe(placement.bubbleX - playerX);
    expect(rootOffset.y).toBe(placement.bubbleY - footY);
  });

  it('flips to opposite side when preferred side overflows screen edge', () => {
    const wideBubbleWidth = 200;
    const placement = computeQuoteBubbleSidePlacement(
      playerX,
      footY,
      wideBubbleWidth,
      bubbleHeight,
      viewportWidth,
      viewportHeight,
      'left',
    );
    expect(placement.bubbleX).toBe(playerX + charHalf + gap);
    expect(placement.tailSide).toBe('left');
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
