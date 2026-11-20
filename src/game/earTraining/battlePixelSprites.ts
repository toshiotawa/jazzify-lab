/** Frames are resolved once. The draw path only indexes these URL arrays. */
export const BATTLE_IDLE_FRAME_MS = 280;

const frames = (stem: string, count: number): readonly string[] =>
  Array.from({ length: count }, (_, i) => `/battle-pixels/pixel-${stem}-${i + 1}.png`);

export const HERO_IDLE_FRAMES = frames('hero-idle', 4);
export const HERO_SLASH_FRAMES = frames('hero-slash', 4);
const bandFrames = Array.from({ length: 10 }, (_, i) => frames(`band-${i + 1}`, 3));
export const BAND_AVATARS = bandFrames.map((row) => row[0]);

const idleFrames = new Map<string, readonly string[]>([
  [HERO_IDLE_FRAMES[0], HERO_IDLE_FRAMES],
  ...bandFrames.map((row): [string, readonly string[]] => [row[0], [row[0], row[1], row[2], row[1]]]),
]);

export const getBattleIdleFrames = (avatar: string): readonly string[] | undefined => idleFrames.get(avatar);
