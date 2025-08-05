// ファンタジーモードのランク定義
export interface FantasyRank {
  id: string;           // 'F', 'F+', 'E', 'E+', etc.
  name: string;         // ランクの名前
  description: string;  // ランクの説明文
  requiredStages: number; // 必要なクリアステージ数
  color: string;        // ランクの色（UI用）
  icon?: string;        // アイコン（将来の拡張用）
}

// ランクデータのハードコーディング
export const FANTASY_RANKS: FantasyRank[] = [
  {
    id: 'F',
    name: '見習い魔法使い',
    description: '魔法の世界への第一歩。まだまだ未熟だが、可能性は無限大！',
    requiredStages: 0,
    color: '#808080', // グレー
  },
  {
    id: 'F+',
    name: '新米魔法使い',
    description: '基本的な魔法を覚え始めた新米。努力次第で大きく成長できる。',
    requiredStages: 10,
    color: '#909090', // 少し明るいグレー
  },
  {
    id: 'E',
    name: '魔法学徒',
    description: '魔法学院で基礎を学ぶ学徒。音楽と魔法の関係を理解し始めている。',
    requiredStages: 20,
    color: '#4CAF50', // グリーン
  },
  {
    id: 'E+',
    name: '上級魔法学徒',
    description: '優秀な成績で魔法を学ぶ学徒。コード進行の力を使いこなし始めた。',
    requiredStages: 30,
    color: '#66BB6A', // 明るいグリーン
  },
  {
    id: 'D',
    name: '魔法使い',
    description: '正式な魔法使いとして認められた。音楽の魔法で敵を倒す力を持つ。',
    requiredStages: 40,
    color: '#2196F3', // ブルー
  },
  {
    id: 'D+',
    name: '熟練魔法使い',
    description: '経験を積んだ魔法使い。複雑なコード進行も自在に操る。',
    requiredStages: 50,
    color: '#42A5F5', // 明るいブルー
  },
  {
    id: 'C',
    name: '魔術師',
    description: '高度な魔法を扱う魔術師。音楽理論と魔法理論を融合させた。',
    requiredStages: 60,
    color: '#9C27B0', // パープル
  },
  {
    id: 'C+',
    name: '上級魔術師',
    description: '魔術師の中でも特に優れた存在。希少な音楽魔法を使いこなす。',
    requiredStages: 70,
    color: '#AB47BC', // 明るいパープル
  },
  {
    id: 'B',
    name: '魔導士',
    description: '魔法の道を極めし者。音楽の本質を理解し、強大な力を操る。',
    requiredStages: 80,
    color: '#FF9800', // オレンジ
  },
  {
    id: 'B+',
    name: '大魔導士',
    description: '伝説に名を残す大魔導士。その音楽魔法は山をも動かすという。',
    requiredStages: 90,
    color: '#FFB74D', // 明るいオレンジ
  },
  {
    id: 'A',
    name: '賢者',
    description: '知識と力を極めた賢者。世界の調和を守る使命を持つ。',
    requiredStages: 100,
    color: '#F44336', // レッド
  },
  {
    id: 'A+',
    name: '大賢者',
    description: '歴史に名を刻む大賢者。その知恵は千年の時を超えて伝わる。',
    requiredStages: 110,
    color: '#EF5350', // 明るいレッド
  },
  {
    id: 'S',
    name: '音楽の守護者',
    description: '音楽の真髄を体現する守護者。世界に調和をもたらす伝説的存在。',
    requiredStages: 120,
    color: '#FFD700', // ゴールド
  },
  {
    id: 'S+',
    name: '神話の奏者',
    description: '神々さえも魅了する究極の奏者。その音楽は新たな世界を創造する。',
    requiredStages: 130,
    color: '#FFC107', // 輝くゴールド
  },
];

// IDからランクを取得するヘルパー関数
export const getFantasyRankById = (rankId: string): FantasyRank | undefined => {
  return FANTASY_RANKS.find(rank => rank.id === rankId);
};

// クリアステージ数からランクを取得するヘルパー関数
export const getFantasyRankByStages = (clearedStages: number): FantasyRank => {
  // 逆順にソートして、条件を満たす最高ランクを返す
  const sortedRanks = [...FANTASY_RANKS].sort((a, b) => b.requiredStages - a.requiredStages);
  
  for (const rank of sortedRanks) {
    if (clearedStages >= rank.requiredStages) {
      return rank;
    }
  }
  
  // デフォルトは最初のランク
  return FANTASY_RANKS[0];
};

// ランクIDのリストを取得
export const FANTASY_RANK_IDS = FANTASY_RANKS.map(rank => rank.id);

// 次のランクを取得するヘルパー関数
export const getNextFantasyRank = (currentRankId: string): FantasyRank | null => {
  const currentIndex = FANTASY_RANKS.findIndex(rank => rank.id === currentRankId);
  if (currentIndex === -1 || currentIndex === FANTASY_RANKS.length - 1) {
    return null;
  }
  return FANTASY_RANKS[currentIndex + 1];
};

// ランクの進捗率を計算するヘルパー関数
export const getFantasyRankProgress = (clearedStages: number, currentRankId: string): number => {
  const currentRank = getFantasyRankById(currentRankId);
  const nextRank = getNextFantasyRank(currentRankId);
  
  if (!currentRank || !nextRank) {
    return 100; // 最高ランクの場合は100%
  }
  
  const stagesInCurrentRank = clearedStages - currentRank.requiredStages;
  const stagesRequiredForNext = nextRank.requiredStages - currentRank.requiredStages;
  
  return Math.min(100, Math.floor((stagesInCurrentRank / stagesRequiredForNext) * 100));
};