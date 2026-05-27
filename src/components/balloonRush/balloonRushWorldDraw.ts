import type { Direction } from '@/components/survival/SurvivalTypes';

export interface BalloonDrawInstance {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface BalloonRushDrawSnapshot {
  readonly playerX: number;
  readonly playerY: number;
  readonly playerDirection: Direction;
  readonly balloons: readonly BalloonDrawInstance[];
  readonly jajiiX: number | null;
  readonly jajiiY: number | null;
  readonly nowPerfMs: number;
}
