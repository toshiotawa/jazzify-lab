/** Balloon instance shape shared by physics / draw layers. */
export interface BalloonRunState {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  /** Monotonic elapsed game seconds at spawn */
  readonly spawnedAtSec: number;
  readonly lifetimeSec: number;
}
