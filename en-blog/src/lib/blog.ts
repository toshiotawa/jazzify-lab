export const CATEGORY_LABELS = {
  'album-guides': 'Album Guides',
  'artists-listening': 'Artists & Listening',
  'practice-guides': 'Practice Guides',
  'theory-voicings': 'Theory & Voicings',
} as const;

export type BlogCategory = keyof typeof CATEGORY_LABELS;

export const CATEGORIES = [
  { slug: 'album-guides', label: CATEGORY_LABELS['album-guides'] },
  { slug: 'artists-listening', label: CATEGORY_LABELS['artists-listening'] },
  { slug: 'practice-guides', label: CATEGORY_LABELS['practice-guides'] },
  { slug: 'theory-voicings', label: CATEGORY_LABELS['theory-voicings'] },
] as const;

export const BLOG_PATH = '/blog/';
export const BLOG_ORIGIN = 'https://en.jazzify.jp';
export const DEFAULT_OG_IMAGE = `${BLOG_ORIGIN}/newLP/hero-poster.webp`;

export const articlePath = (slug: string): string => `${BLOG_PATH}${slug}/`;
export const categoryPath = (category: BlogCategory): string =>
  `${BLOG_PATH}category/${category}/`;
