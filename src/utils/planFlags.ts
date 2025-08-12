export function isStandardGlobalMode(): boolean {
  try {
    return (import.meta as any).env?.VITE_STANDARD_GLOBAL_MODE === 'true';
  } catch {
    return false;
  }
}

export type AnnouncementAudience = 'global' | 'jp' | 'all';

export function parseAnnouncementAudience(title: string): AnnouncementAudience {
  const normalized = (title || '').toUpperCase();
  if (normalized.startsWith('[GLOBAL]') || normalized.startsWith('[WORLD]')) return 'global';
  if (normalized.startsWith('[JP]') || normalized.startsWith('[JAPAN]')) return 'jp';
  return 'all';
}

export function withAudiencePrefix(title: string, audience: AnnouncementAudience): string {
  const stripped = title.replace(/^\s*\[(GLOBAL|WORLD|JP|JAPAN)\]\s*/i, '').trim();
  switch (audience) {
    case 'global':
      return `[GLOBAL] ${stripped}`;
    case 'jp':
      return `[JP] ${stripped}`;
    case 'all':
    default:
      return stripped;
  }
}