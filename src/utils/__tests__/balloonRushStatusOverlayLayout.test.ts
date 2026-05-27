import {
  BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX,
  BALLOON_RUSH_PROGRESSION_STAFF_BAND_HEIGHT_PX,
  BALLOON_RUSH_STATUS_GAP_BELOW_STAFF_PX,
  BALLOON_RUSH_STATUS_HUD_BAND_PX,
  resolveBalloonRushStaffBandHeightPx,
  resolveBalloonRushStatusOverlayTopStyle,
} from '@/utils/balloonRushSurvivalBridge';

describe('balloonRush status overlay layout', () => {
  it('returns compact staff band height when staff is visible on random stages', () => {
    expect(resolveBalloonRushStaffBandHeightPx(true, false)).toBe(
      BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX,
    );
  });

  it('returns progression staff band height when staff is visible on progression stages', () => {
    expect(resolveBalloonRushStaffBandHeightPx(true, true)).toBe(
      BALLOON_RUSH_PROGRESSION_STAFF_BAND_HEIGHT_PX,
    );
  });

  it('returns zero when staff is hidden', () => {
    expect(resolveBalloonRushStaffBandHeightPx(false, true)).toBe(0);
  });

  it('builds top padding below the staff band', () => {
    expect(resolveBalloonRushStatusOverlayTopStyle(BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX)).toEqual({
      paddingTop: `calc(max(4px, env(safe-area-inset-top)) + ${BALLOON_RUSH_STATUS_HUD_BAND_PX}px + ${BALLOON_RUSH_COMPACT_STAFF_BAND_HEIGHT_PX + BALLOON_RUSH_STATUS_GAP_BELOW_STAFF_PX}px)`,
    });
  });
});
