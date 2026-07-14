import { describe, expect, it } from 'vitest';
import {
  announcementDisplayContent,
  announcementDisplayTitle,
  filterAnnouncementsForLocale,
} from '@/utils/announcementCopy';
import type { Announcement } from '@/platform/supabaseAnnouncements';

const baseAnnouncement: Announcement = {
  id: '1',
  title: '日本語タイトル',
  content: '日本語本文',
  title_en: 'English title',
  content_en: 'English body',
  publish_ja: true,
  publish_en: true,
  is_active: true,
  priority: 1,
  created_by: 'user',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('announcementCopy', () => {
  it('英語 UI では title_en / content_en のみを返す', () => {
    expect(announcementDisplayTitle(baseAnnouncement, true)).toBe('English title');
    expect(announcementDisplayContent(baseAnnouncement, true)).toBe('English body');
  });

  it('英語 UI で英語本文が空なら日本語にフォールバックしない', () => {
    const partial = { ...baseAnnouncement, content_en: null };
    expect(announcementDisplayContent(partial, true)).toBe('');
  });

  it('英語 UI では英語欠落のお知らせを除外する', () => {
    const items = [
      baseAnnouncement,
      { ...baseAnnouncement, id: '2', title_en: null, content_en: null },
    ];
    expect(filterAnnouncementsForLocale(items, true)).toHaveLength(1);
    expect(filterAnnouncementsForLocale(items, false)).toHaveLength(2);
  });
});
