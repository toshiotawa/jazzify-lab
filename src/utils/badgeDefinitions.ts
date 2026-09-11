type BadgeCategoryId =
  | 'survival_basic'
  | 'survival_songs'
  | 'survival_phrases'
  | 'code_run'
  | 'defense'
  | 'player_level'
  | 'quest_clear'
  | `training_${string}`;

type BadgeConditionType =
  | 'survival_stage_clear'
  | 'player_level_reached'
  | 'quest_clear_count'
  | 'play_map_node_clear'
  | 'training_category_rank';

interface BadgeCategoryDefinition {
  id: BadgeCategoryId;
  labelJa: string;
  labelEn: string;
}

export interface BadgeDefinition {
  id: string;
  categoryId: BadgeCategoryId;
  rank: 1 | 2 | 3;
  nameJa: string;
  nameEn: string;
  conditionType: BadgeConditionType;
  conditionValue: number;
  conditionJa: string;
  conditionEn: string;
  imagePath: string;
  /** false = 非表示（旧サバイバル称号など） */
  isActive?: boolean;
}

const TRAINING_CATEGORY_META: ReadonlyArray<{
  slug: string;
  labelJa: string;
  labelEn: string;
}> = [
  { slug: 'intro', labelJa: '入門', labelEn: 'Introduction' },
  { slug: 'interval', labelJa: '音程', labelEn: 'Intervals' },
  { slug: 'triad', labelJa: '3和音', labelEn: 'Triads' },
  { slug: 'seventh', labelJa: '4和音', labelEn: 'Seventh Chords' },
  { slug: 'scale_basic', labelJa: '初級スケール', labelEn: 'Basic Scales' },
  { slug: 'scale_intermediate', labelJa: '中級スケール', labelEn: 'Intermediate Scales' },
  { slug: 'scale_advanced', labelJa: '上級スケール', labelEn: 'Advanced Scales' },
  { slug: 'tension_voicing', labelJa: 'テンションヴォイシング', labelEn: 'Tension Voicings' },
  { slug: 'two_hand_voicing', labelJa: '両手ヴォイシング', labelEn: 'Two-Hand Voicings' },
];

const TRAINING_RANK_META: ReadonlyArray<{
  rank: 1 | 2 | 3;
  threshold: number;
  labelJa: string;
  labelEn: string;
}> = [
  { rank: 1, threshold: 2, labelJa: 'B以上', labelEn: 'B+' },
  { rank: 2, threshold: 3, labelJa: 'A以上', labelEn: 'A+' },
  { rank: 3, threshold: 4, labelJa: 'S以上', labelEn: 'S+' },
];

function buildTrainingBadgeDefinitions(): BadgeDefinition[] {
  const defs: BadgeDefinition[] = [];
  for (const category of TRAINING_CATEGORY_META) {
    for (const rankMeta of TRAINING_RANK_META) {
      defs.push({
        id: `training_${category.slug}_b_${rankMeta.rank}`,
        categoryId: `training_${category.slug}`,
        rank: rankMeta.rank,
        nameJa: `${category.labelJa} ${rankMeta.labelJa}`,
        nameEn: `${category.labelEn} ${rankMeta.labelEn}`,
        conditionType: 'training_category_rank',
        conditionValue: rankMeta.threshold,
        conditionJa: `${category.labelJa}の全課題を${rankMeta.labelJa}でクリア`,
        conditionEn: `Clear all ${category.labelEn} trainings at ${rankMeta.labelEn} or better`,
        imagePath: '/achivement/achievement_monster_33.png',
        isActive: true,
      });
    }
  }
  return defs;
}

const TRAINING_BADGE_DEFINITIONS = buildTrainingBadgeDefinitions();

const TRAINING_BADGE_CATEGORIES: BadgeCategoryDefinition[] = TRAINING_CATEGORY_META.map((category) => ({
  id: `training_${category.slug}` as BadgeCategoryId,
  labelJa: category.labelJa,
  labelEn: category.labelEn,
}));

export const BADGE_CATEGORIES: BadgeCategoryDefinition[] = [
  { id: 'code_run', labelJa: 'コードラン', labelEn: 'Code Run' },
  { id: 'defense', labelJa: 'フレーズディフェンス', labelEn: 'Phrase Defense' },
  ...TRAINING_BADGE_CATEGORIES,
  { id: 'player_level', labelJa: '到達レベル', labelEn: 'Player level reached' },
  { id: 'quest_clear', labelJa: 'クエストクリア数', labelEn: 'Quest clears' },
];

const LEGACY_SURVIVAL_BADGES: BadgeDefinition[] = [
  {
    id: 'survival_basic_1',
    categoryId: 'survival_basic',
    rank: 1,
    nameJa: '基礎の第一歩',
    nameEn: 'Basic Starter',
    conditionType: 'survival_stage_clear',
    conditionValue: 1,
    conditionJa: 'サバイバル Basic のステージ1を初回クリア',
    conditionEn: 'Clear Survival Basic stage 1 for the first time',
    imagePath: '/achivement/achievement_monster_02.png',
    isActive: false,
  },
  {
    id: 'survival_basic_50',
    categoryId: 'survival_basic',
    rank: 2,
    nameJa: '基礎固め',
    nameEn: 'Basic Builder',
    conditionType: 'survival_stage_clear',
    conditionValue: 50,
    conditionJa: 'サバイバル Basic のステージ50を初回クリア',
    conditionEn: 'Clear Survival Basic stage 50 for the first time',
    imagePath: '/achivement/achievement_monster_09.png',
    isActive: false,
  },
  {
    id: 'survival_basic_100',
    categoryId: 'survival_basic',
    rank: 3,
    nameJa: '基礎の達人',
    nameEn: 'Basic Master',
    conditionType: 'survival_stage_clear',
    conditionValue: 100,
    conditionJa: 'サバイバル Basic のステージ100を初回クリア',
    conditionEn: 'Clear Survival Basic stage 100 for the first time',
    imagePath: '/achivement/achievement_monster_11.png',
    isActive: false,
  },
  {
    id: 'survival_songs_1',
    categoryId: 'survival_songs',
    rank: 1,
    nameJa: '曲に挑む者',
    nameEn: 'Song Challenger',
    conditionType: 'survival_stage_clear',
    conditionValue: 1,
    conditionJa: 'サバイバル Songs のステージ1を初回クリア',
    conditionEn: 'Clear Survival Songs stage 1 for the first time',
    imagePath: '/achivement/achievement_monster_13.png',
    isActive: false,
  },
  {
    id: 'survival_songs_50',
    categoryId: 'survival_songs',
    rank: 2,
    nameJa: '曲を渡る者',
    nameEn: 'Song Voyager',
    conditionType: 'survival_stage_clear',
    conditionValue: 50,
    conditionJa: 'サバイバル Songs のステージ50を初回クリア',
    conditionEn: 'Clear Survival Songs stage 50 for the first time',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: false,
  },
  {
    id: 'survival_songs_100',
    categoryId: 'survival_songs',
    rank: 3,
    nameJa: '曲を制する者',
    nameEn: 'Song Conqueror',
    conditionType: 'survival_stage_clear',
    conditionValue: 100,
    conditionJa: 'サバイバル Songs のステージ100を初回クリア',
    conditionEn: 'Clear Survival Songs stage 100 for the first time',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: false,
  },
  {
    id: 'survival_phrases_1',
    categoryId: 'survival_phrases',
    rank: 1,
    nameJa: 'フレーズ見習い',
    nameEn: 'Phrase Apprentice',
    conditionType: 'survival_stage_clear',
    conditionValue: 1,
    conditionJa: 'サバイバル Phrases のステージ1を初回クリア',
    conditionEn: 'Clear Survival Phrases stage 1 for the first time',
    imagePath: '/achivement/achievement_monster_33.png',
    isActive: false,
  },
  {
    id: 'survival_phrases_50',
    categoryId: 'survival_phrases',
    rank: 2,
    nameJa: 'フレーズ使い',
    nameEn: 'Phrase Handler',
    conditionType: 'survival_stage_clear',
    conditionValue: 50,
    conditionJa: 'サバイバル Phrases のステージ50を初回クリア',
    conditionEn: 'Clear Survival Phrases stage 50 for the first time',
    imagePath: '/achivement/achievement_monster_35.png',
    isActive: false,
  },
  {
    id: 'survival_phrases_100',
    categoryId: 'survival_phrases',
    rank: 3,
    nameJa: 'フレーズマスター',
    nameEn: 'Phrase Master',
    conditionType: 'survival_stage_clear',
    conditionValue: 100,
    conditionJa: 'サバイバル Phrases のステージ100を初回クリア',
    conditionEn: 'Clear Survival Phrases stage 100 for the first time',
    imagePath: '/achivement/achievement_monster_45.png',
    isActive: false,
  },
];

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'code_run_first_1',
    categoryId: 'code_run',
    rank: 1,
    nameJa: 'コードランナー',
    nameEn: 'Code Runner',
    conditionType: 'play_map_node_clear',
    conditionValue: 1,
    conditionJa: 'コードランを初めてクリア',
    conditionEn: 'Clear your first Code Run node',
    imagePath: '/achivement/achievement_monster_02.png',
    isActive: true,
  },
  {
    id: 'code_run_basic_all_2',
    categoryId: 'code_run',
    rank: 2,
    nameJa: 'コードラン Basic 制覇',
    nameEn: 'Code Run Basic Master',
    conditionType: 'play_map_node_clear',
    conditionValue: 2,
    conditionJa: 'コードラン Basic を全クリア',
    conditionEn: 'Clear all Code Run Basic nodes',
    imagePath: '/achivement/achievement_monster_09.png',
    isActive: true,
  },
  {
    id: 'code_run_advanced_all_3',
    categoryId: 'code_run',
    rank: 3,
    nameJa: 'コードラン Advanced 制覇',
    nameEn: 'Code Run Advanced Master',
    conditionType: 'play_map_node_clear',
    conditionValue: 3,
    conditionJa: 'コードラン Advanced を全クリア',
    conditionEn: 'Clear all Code Run Advanced nodes',
    imagePath: '/achivement/achievement_monster_11.png',
    isActive: true,
  },
  {
    id: 'defense_first_1',
    categoryId: 'defense',
    rank: 1,
    nameJa: 'ディフェンダー',
    nameEn: 'Defender',
    conditionType: 'play_map_node_clear',
    conditionValue: 1,
    conditionJa: 'フレーズディフェンスを初めてクリア',
    conditionEn: 'Clear your first Phrase Defense node',
    imagePath: '/achivement/achievement_monster_13.png',
    isActive: true,
  },
  {
    id: 'defense_basic_all_2',
    categoryId: 'defense',
    rank: 2,
    nameJa: 'ディフェンス Basic 制覇',
    nameEn: 'Defense Basic Master',
    conditionType: 'play_map_node_clear',
    conditionValue: 2,
    conditionJa: 'フレーズディフェンス Basic を全クリア',
    conditionEn: 'Clear all Phrase Defense Basic nodes',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: true,
  },
  {
    id: 'defense_advanced_all_3',
    categoryId: 'defense',
    rank: 3,
    nameJa: 'ディフェンス Advanced 制覇',
    nameEn: 'Defense Advanced Master',
    conditionType: 'play_map_node_clear',
    conditionValue: 3,
    conditionJa: 'フレーズディフェンス Advanced を全クリア',
    conditionEn: 'Clear all Phrase Defense Advanced nodes',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: true,
  },
  ...TRAINING_BADGE_DEFINITIONS,
  {
    id: 'player_level_2',
    categoryId: 'player_level',
    rank: 1,
    nameJa: '駆け出しプレイヤー',
    nameEn: 'Rising Player',
    conditionType: 'player_level_reached',
    conditionValue: 2,
    conditionJa: 'プレイヤーレベル2に到達',
    conditionEn: 'Reach player level 2',
    imagePath: '/achivement/achievement_monster_47.png',
    isActive: true,
  },
  {
    id: 'player_level_50',
    categoryId: 'player_level',
    rank: 2,
    nameJa: '実力派プレイヤー',
    nameEn: 'Skilled Player',
    conditionType: 'player_level_reached',
    conditionValue: 50,
    conditionJa: 'プレイヤーレベル50に到達',
    conditionEn: 'Reach player level 50',
    imagePath: '/achivement/achievement_monster_49.png',
    isActive: true,
  },
  {
    id: 'player_level_100',
    categoryId: 'player_level',
    rank: 3,
    nameJa: '熟練プレイヤー',
    nameEn: 'Veteran Player',
    conditionType: 'player_level_reached',
    conditionValue: 100,
    conditionJa: 'プレイヤーレベル100に到達',
    conditionEn: 'Reach player level 100',
    imagePath: '/achivement/achievement_monster_51.png',
    isActive: true,
  },
  {
    id: 'quest_clear_1',
    categoryId: 'quest_clear',
    rank: 1,
    nameJa: 'クエスト見習い',
    nameEn: 'Quest Rookie',
    conditionType: 'quest_clear_count',
    conditionValue: 1,
    conditionJa: 'クエストを1個完了',
    conditionEn: 'Complete 1 quest',
    imagePath: '/achivement/achievement_monster_53.png',
    isActive: true,
  },
  {
    id: 'quest_clear_50',
    categoryId: 'quest_clear',
    rank: 2,
    nameJa: 'クエスト冒険者',
    nameEn: 'Quest Adventurer',
    conditionType: 'quest_clear_count',
    conditionValue: 50,
    conditionJa: 'クエストを50個完了',
    conditionEn: 'Complete 50 quests',
    imagePath: '/achivement/achievement_monster_55.png',
    isActive: true,
  },
  {
    id: 'quest_clear_100',
    categoryId: 'quest_clear',
    rank: 3,
    nameJa: 'クエスト制覇者',
    nameEn: 'Quest Champion',
    conditionType: 'quest_clear_count',
    conditionValue: 100,
    conditionJa: 'クエストを100個完了',
    conditionEn: 'Complete 100 quests',
    imagePath: '/achivement/achievement_monster_59.png',
    isActive: true,
  },
  ...LEGACY_SURVIVAL_BADGES,
];

export const ACTIVE_BADGE_DEFINITIONS = BADGE_DEFINITIONS.filter((badge) => badge.isActive !== false);

export const BADGE_TOTAL_COUNT = ACTIVE_BADGE_DEFINITIONS.length;

const badgeDefinitionById = new Map(BADGE_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getBadgeDefinitionById(id: string): BadgeDefinition | undefined {
  return badgeDefinitionById.get(id);
}

export function isActiveBadgeCategory(categoryId: BadgeCategoryId): boolean {
  return ACTIVE_BADGE_DEFINITIONS.some((badge) => badge.categoryId === categoryId);
}
