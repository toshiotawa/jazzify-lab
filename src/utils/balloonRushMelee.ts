/** B列近接に相当するヒット判定（風船用） — Web SurvivalGameScreen と同式 */
import type { PlayerState } from '@/components/survival/SurvivalTypes';
import { getDirectionVector } from '@/components/survival/SurvivalGameEngine';

/** ヒット半径内の balloon id（プレイヤー正面180°のみ totalRange、その他は baseRange）。 */
export const findBalloonsHitByMelee = (
  player: PlayerState,
  balloons: readonly { readonly id: string; readonly x: number; readonly y: number; readonly popped?: boolean }[],
): readonly string[] => {
  const baseRange = 80;
  const totalRange = baseRange + player.skills.bRangeBonus * 20;
  const dirVec = getDirectionVector(player.direction);
  const attackX = player.x + dirVec.x * 40;
  const attackY = player.y + dirVec.y * 40;

  const hit: string[] = [];
  for (const b of balloons) {
    if (b.popped) continue;
    const dx = b.x - attackX;
    const dy = b.y - attackY;
    const dist = Math.hypot(dx, dy);

    const toEnemyX = b.x - player.x;
    const toEnemyY = b.y - player.y;
    const dotProduct = toEnemyX * dirVec.x + toEnemyY * dirVec.y;
    const isInFront = dotProduct > 0;
    const effectiveRange = isInFront ? totalRange : baseRange;

    if (dist < effectiveRange) {
      hit.push(b.id);
    }
  }

  return hit;
};
