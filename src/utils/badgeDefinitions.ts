type BadgeCategoryId =
  | 'survival_basic'
  | 'survival_songs'
  | 'survival_phrases'
  | 'defense'
  | 'defense_basic'
  | 'defense_advanced'
  | 'training_goal'
  | 'player_level'
  | 'quest_clear';

type BadgeConditionType =
  | 'survival_stage_clear'
  | 'player_level_reached'
  | 'quest_clear_count'
  | 'play_map_node_clear'
  | 'training_goal_clear_count'
  | 'defense_tier_clear_count';

interface BadgeCategoryDefinition {
  id: BadgeCategoryId;
  labelJa: string;
  labelEn: string;
}

export interface BadgeDefinition {
  id: string;
  categoryId: BadgeCategoryId;
  rank: 1 | 2 | 3 | 4;
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

const TRAINING_GOAL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'training_goal_clear_1',
    categoryId: 'training_goal',
    rank: 1,
    nameJa: 'トレーニング目標クリア',
    nameEn: 'Training Goal Clear',
    conditionType: 'training_goal_clear_count',
    conditionValue: 1,
    conditionJa: 'トレーニング目標を1個クリア',
    conditionEn: 'Clear 1 training goal set',
    imagePath: '/achivement/achievement_monster_33.png',
    isActive: true,
  },
  {
    id: 'training_goal_clear_10',
    categoryId: 'training_goal',
    rank: 2,
    nameJa: 'トレーニング目標10個クリア',
    nameEn: '10 Training Goals Cleared',
    conditionType: 'training_goal_clear_count',
    conditionValue: 10,
    conditionJa: 'トレーニング目標を10個クリア',
    conditionEn: 'Clear 10 training goal sets',
    imagePath: '/achivement/achievement_monster_33.png',
    isActive: true,
  },
  {
    id: 'training_goal_clear_20',
    categoryId: 'training_goal',
    rank: 3,
    nameJa: 'トレーニング目標20個クリア',
    nameEn: '20 Training Goals Cleared',
    conditionType: 'training_goal_clear_count',
    conditionValue: 20,
    conditionJa: 'トレーニング目標を20個クリア',
    conditionEn: 'Clear 20 training goal sets',
    imagePath: '/achivement/achievement_monster_33.png',
    isActive: true,
  },
];

const DEFENSE_TIER_CLEAR_BADGES: BadgeDefinition[] = [
  {
    id: 'defense_basic_clears_50',
    categoryId: 'defense_basic',
    rank: 1,
    nameJa: 'Basic 累計50回クリア',
    nameEn: 'Basic: 50 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 50,
    conditionJa: 'フレーズディフェンス Basic を累計50回クリア',
    conditionEn: 'Clear Phrase Defense Basic 50 times (cumulative)',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: true,
  },
  {
    id: 'defense_basic_clears_500',
    categoryId: 'defense_basic',
    rank: 2,
    nameJa: 'Basic 累計500回クリア',
    nameEn: 'Basic: 500 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 500,
    conditionJa: 'フレーズディフェンス Basic を累計500回クリア',
    conditionEn: 'Clear Phrase Defense Basic 500 times (cumulative)',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: true,
  },
  {
    id: 'defense_basic_clears_1000',
    categoryId: 'defense_basic',
    rank: 3,
    nameJa: 'Basic 累計1000回クリア',
    nameEn: 'Basic: 1,000 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 1000,
    conditionJa: 'フレーズディフェンス Basic を累計1000回クリア',
    conditionEn: 'Clear Phrase Defense Basic 1,000 times (cumulative)',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: true,
  },
  {
    id: 'defense_basic_clears_10000',
    categoryId: 'defense_basic',
    rank: 4,
    nameJa: 'Basic 累計10000回クリア',
    nameEn: 'Basic: 10,000 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 10000,
    conditionJa: 'フレーズディフェンス Basic を累計10000回クリア',
    conditionEn: 'Clear Phrase Defense Basic 10,000 times (cumulative)',
    imagePath: '/achivement/achievement_monster_19.png',
    isActive: true,
  },
  {
    id: 'defense_advanced_clears_50',
    categoryId: 'defense_advanced',
    rank: 1,
    nameJa: 'Advanced 累計50回クリア',
    nameEn: 'Advanced: 50 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 50,
    conditionJa: 'フレーズディフェンス Advanced を累計50回クリア',
    conditionEn: 'Clear Phrase Defense Advanced 50 times (cumulative)',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: true,
  },
  {
    id: 'defense_advanced_clears_500',
    categoryId: 'defense_advanced',
    rank: 2,
    nameJa: 'Advanced 累計500回クリア',
    nameEn: 'Advanced: 500 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 500,
    conditionJa: 'フレーズディフェンス Advanced を累計500回クリア',
    conditionEn: 'Clear Phrase Defense Advanced 500 times (cumulative)',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: true,
  },
  {
    id: 'defense_advanced_clears_1000',
    categoryId: 'defense_advanced',
    rank: 3,
    nameJa: 'Advanced 累計1000回クリア',
    nameEn: 'Advanced: 1,000 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 1000,
    conditionJa: 'フレーズディフェンス Advanced を累計1000回クリア',
    conditionEn: 'Clear Phrase Defense Advanced 1,000 times (cumulative)',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: true,
  },
  {
    id: 'defense_advanced_clears_10000',
    categoryId: 'defense_advanced',
    rank: 4,
    nameJa: 'Advanced 累計10000回クリア',
    nameEn: 'Advanced: 10,000 Clears',
    conditionType: 'defense_tier_clear_count',
    conditionValue: 10000,
    conditionJa: 'フレーズディフェンス Advanced を累計10000回クリア',
    conditionEn: 'Clear Phrase Defense Advanced 10,000 times (cumulative)',
    imagePath: '/achivement/achievement_monster_22.png',
    isActive: true,
  },
];

export const BADGE_CATEGORIES: BadgeCategoryDefinition[] = [
  { id: 'defense', labelJa: 'フレーズディフェンス', labelEn: 'Phrase Defense' },
  { id: 'defense_basic', labelJa: 'フレーズディフェンス Basic', labelEn: 'Phrase Defense Basic' },
  { id: 'defense_advanced', labelJa: 'フレーズディフェンス Advanced', labelEn: 'Phrase Defense Advanced' },
  { id: 'training_goal', labelJa: 'トレーニング目標', labelEn: 'Training goals' },
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
    isActive: false,
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
    isActive: false,
  },
  ...DEFENSE_TIER_CLEAR_BADGES,
  ...TRAINING_GOAL_BADGE_DEFINITIONS,
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
