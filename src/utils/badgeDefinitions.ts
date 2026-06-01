type BadgeCategoryId =
  | 'survival_basic'
  | 'survival_songs'
  | 'survival_phrases'
  | 'player_level'
  | 'quest_clear';

type BadgeConditionType =
  | 'survival_stage_clear'
  | 'player_level_reached'
  | 'quest_clear_count';

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
}

export const BADGE_CATEGORIES: BadgeCategoryDefinition[] = [
  { id: 'survival_basic', labelJa: 'Basicクリアステージ数', labelEn: 'Basic stage clears' },
  { id: 'survival_songs', labelJa: 'Songsクリアステージ数', labelEn: 'Songs stage clears' },
  { id: 'survival_phrases', labelJa: 'Phrasesクリアステージ数', labelEn: 'Phrases stage clears' },
  { id: 'player_level', labelJa: '到達レベル', labelEn: 'Player level reached' },
  { id: 'quest_clear', labelJa: 'クエストクリア数', labelEn: 'Quest clears' },
];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
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
  },
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
  },
];

export const BADGE_TOTAL_COUNT = BADGE_DEFINITIONS.length;

const badgeDefinitionById = new Map(BADGE_DEFINITIONS.map(definition => [definition.id, definition]));

export function getBadgeDefinitionById(id: string): BadgeDefinition | undefined {
  return badgeDefinitionById.get(id);
}
