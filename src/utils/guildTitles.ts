export function getGuildTitleByLevel(level: number): string {
  if (level >= 50) return 'Mythic Guild';
  if (level >= 40) return 'Legendary Guild';
  if (level >= 30) return 'Master Guild';
  if (level >= 20) return 'Veteran Guild';
  if (level >= 10) return 'Rising Guild';
  return 'Novice Guild';
}

