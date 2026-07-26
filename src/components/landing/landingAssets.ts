interface LandingResponsiveImage {
  src: string;
  mobileSrc: string;
  width: number;
  height: number;
}

const LP_DEMO_SHOT_JA: LandingResponsiveImage = {
  src: '/newLP/survival-balloon.webp',
  mobileSrc: '/newLP/survival-balloon-640.webp',
  width: 1024,
  height: 587,
};

const LP_DEMO_SHOT_EN: LandingResponsiveImage = {
  src: '/newLP/survival-balloon-en.webp',
  mobileSrc: '/newLP/survival-balloon-en-640.webp',
  width: 1024,
  height: 530,
};

const LP_MAIN_QUEST_SHOT_JA: LandingResponsiveImage = {
  src: '/newLP/main-quest.webp',
  mobileSrc: '/newLP/main-quest-520.webp',
  width: 1280,
  height: 564,
};

const LP_MAIN_QUEST_SHOT_EN: LandingResponsiveImage = {
  src: '/newLP/main-quest-en.webp',
  mobileSrc: '/newLP/main-quest-en-520.webp',
  width: 1024,
  height: 500,
};

const LP_COURSES_SHOT_JA: LandingResponsiveImage = {
  src: '/newLP/courses.webp',
  mobileSrc: '/newLP/courses-900.webp',
  width: 1280,
  height: 674,
};

const LP_COURSES_SHOT_EN: LandingResponsiveImage = {
  src: '/newLP/courses-en.webp',
  mobileSrc: '/newLP/courses-en-900.webp',
  width: 1024,
  height: 501,
};

export const getLpDemoShot = (english: boolean): LandingResponsiveImage => (
  english ? LP_DEMO_SHOT_EN : LP_DEMO_SHOT_JA
);

export const getLpMainQuestShot = (english: boolean): LandingResponsiveImage => (
  english ? LP_MAIN_QUEST_SHOT_EN : LP_MAIN_QUEST_SHOT_JA
);

export const getLpCoursesShot = (english: boolean): LandingResponsiveImage => (
  english ? LP_COURSES_SHOT_EN : LP_COURSES_SHOT_JA
);

const PROMO_CDN_BASE = 'https://jazzify-cdn.com/promo';

export interface LandingPromoVideoAssets {
  src1080: string;
  src720: string;
  poster: string;
  posterMobile: string;
}

const LP_PROMO_JA: LandingPromoVideoAssets = {
  src1080: `${PROMO_CDN_BASE}/jazzify-promo-ja-1080.mp4`,
  src720: `${PROMO_CDN_BASE}/jazzify-promo-ja-720.mp4`,
  poster: '/newLP/promo-poster-ja.webp',
  posterMobile: '/newLP/promo-poster-ja-960.webp',
};

const LP_PROMO_EN: LandingPromoVideoAssets = {
  src1080: `${PROMO_CDN_BASE}/jazzify-promo-en-1080.mp4`,
  src720: `${PROMO_CDN_BASE}/jazzify-promo-en-720.mp4`,
  poster: '/newLP/promo-poster-en.webp',
  posterMobile: '/newLP/promo-poster-en-960.webp',
};

export const getPromoVideo = (english: boolean): LandingPromoVideoAssets => (
  english ? LP_PROMO_EN : LP_PROMO_JA
);
