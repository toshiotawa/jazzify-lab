export interface PromoVideoSession {
  /** Returns true when the play event should be sent (first play only). */
  onPlay: () => boolean;
  /** Returns true when the complete event should be sent. */
  onComplete: () => boolean;
  /** Returns true when the abandon event should be sent (started, not completed). */
  onAbandon: () => boolean;
  hasPlayed: () => boolean;
  hasCompleted: () => boolean;
}

export const createPromoVideoSession = (): PromoVideoSession => {
  let played = false;
  let completed = false;
  let abandoned = false;

  return {
    onPlay: () => {
      if (played) {
        return false;
      }
      played = true;
      return true;
    },
    onComplete: () => {
      if (!played || completed) {
        return false;
      }
      completed = true;
      return true;
    },
    onAbandon: () => {
      if (!played || completed || abandoned) {
        return false;
      }
      abandoned = true;
      return true;
    },
    hasPlayed: () => played,
    hasCompleted: () => completed,
  };
};

export const watchProgressPercent = (currentTime: number, duration: number): number => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
};

export const watchSeconds = (currentTime: number): number => {
  if (!Number.isFinite(currentTime) || currentTime < 0) {
    return 0;
  }
  return Math.round(currentTime);
};
