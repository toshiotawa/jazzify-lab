import { shouldBlockCancellationMirror } from '../../netlify/functions/lib/lemonPendingCancelMirrorGuard';

describe('shouldBlockCancellationMirror', () => {
  it('blocks cancelled mirror while pending cancel is scheduled', () => {
    expect(shouldBlockCancellationMirror('scheduled', 'cancelled', true)).toBe(true);
    expect(shouldBlockCancellationMirror('scheduled', 'active', true)).toBe(true);
  });

  it('allows mirror while cron is applying', () => {
    expect(shouldBlockCancellationMirror('applying', 'cancelled', true)).toBe(false);
  });

  it('allows mirror when no pending cancel', () => {
    expect(shouldBlockCancellationMirror(null, 'cancelled', true)).toBe(false);
    expect(shouldBlockCancellationMirror('failed', 'cancelled', true)).toBe(false);
  });

  it('allows active mirror during scheduled pending cancel', () => {
    expect(shouldBlockCancellationMirror('scheduled', 'active', false)).toBe(false);
  });
});
