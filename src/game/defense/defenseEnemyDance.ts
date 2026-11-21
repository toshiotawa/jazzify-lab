/** Independent of the walking frame sequence and collision coordinates. */
export const defenseEnemyDancePose = (elapsedSec: number, slotIndex: number, bpm: number) => {
  const beat = elapsedSec * Math.max(1, bpm) / 60 + slotIndex * 0.31;
  const wave = Math.sin(beat * Math.PI);
  const lift = Math.pow(Math.max(0, wave), 2) * 5;
  return { lift, lean: wave * 0.075, squash: 1 - lift * 0.012 };
};
