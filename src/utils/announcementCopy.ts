import type { Announcement } from '@/platform/supabaseAnnouncements';

export const announcementDisplayTitle = (announcement: Announcement, isEnglish: boolean): string => {
  if (isEnglish) {
    return announcement.title_en?.trim() ?? '';
  }
  return announcement.title;
};

export const announcementDisplayContent = (announcement: Announcement, isEnglish: boolean): string => {
  if (isEnglish) {
    return announcement.content_en?.trim() ?? '';
  }
  return announcement.content;
};

export const announcementDisplayLinkText = (
  announcement: Announcement,
  isEnglish: boolean,
  fallbackEn: string,
  fallbackJa: string,
): string => {
  if (isEnglish) {
    return announcement.link_text_en?.trim() || fallbackEn;
  }
  return announcement.link_text?.trim() || fallbackJa;
};

export const filterAnnouncementsForLocale = (
  announcements: Announcement[],
  isEnglish: boolean,
): Announcement[] => {
  if (!isEnglish) {
    return announcements;
  }
  return announcements.filter((announcement) => {
    const title = announcementDisplayTitle(announcement, true);
    const content = announcementDisplayContent(announcement, true);
    return title.length > 0 && content.length > 0;
  });
};
