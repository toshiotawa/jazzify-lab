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
