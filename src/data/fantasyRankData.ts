// ファンタジーモードのランクデータ定義

export interface FantasyRankData {
  rank: string;
  name: string;
  description: string;
  color: string;
  theme?: string;
}

// ランク1-50のデータ
export const fantasyRankData1to50: Record<string, FantasyRankData> = {
  '1': {
    rank: '1',
    name: '見習い魔法使いの村',
    description: '魔法の基礎を学ぶ、始まりの地。優しい風が吹く平和な村で、最初の一歩を踏み出そう。',
    color: 'from-green-600 to-green-800',
    theme: 'beginner'
  },
  '2': {
    rank: '2',
    name: '風の谷',
    description: '心地よい風が吹き抜ける谷。基礎魔法を練習するには最適な場所だ。',
    color: 'from-teal-600 to-teal-800',
    theme: 'wind'
  },
  '3': {
    rank: '3',
    name: '光の森',
    description: '木漏れ日が美しい静かな森。妖精たちが住むと言われている。',
    color: 'from-green-700 to-emerald-800',
    theme: 'forest'
  },
  '4': {
    rank: '4',
    name: '水晶の洞窟',
    description: 'キラキラと輝く水晶に満ちた洞窟。魔力が集まる場所として知られている。',
    color: 'from-cyan-600 to-blue-800',
    theme: 'crystal'
  },
  '5': {
    rank: '5',
    name: '月光の湖',
    description: '月の光を映す神秘的な湖。夜になると不思議な力が宿ると言われている。',
    color: 'from-blue-600 to-indigo-800',
    theme: 'moon'
  },
  '6': {
    rank: '6',
    name: '古代の遺跡',
    description: '太古の魔法使いが残した遺跡。古い魔法の知識が眠っている。',
    color: 'from-amber-700 to-orange-800',
    theme: 'ancient'
  },
  '7': {
    rank: '7',
    name: '星降る丘',
    description: '流れ星がよく見える丘。願いを込めて魔法を唱えると力が増すという。',
    color: 'from-purple-600 to-purple-800',
    theme: 'star'
  },
  '8': {
    rank: '8',
    name: '炎の山麓',
    description: '活火山の麓にある修行場。熱い情熱が魔力を高める。',
    color: 'from-orange-600 to-red-800',
    theme: 'fire'
  },
  '9': {
    rank: '9',
    name: '氷の回廊',
    description: '永遠に溶けない氷でできた回廊。冷静な心で魔法を極める場所。',
    color: 'from-sky-500 to-blue-700',
    theme: 'ice'
  },
  '10': {
    rank: '10',
    name: '賢者の塔・一階',
    description: '知識の殿堂への入り口。ここから本格的な魔法の修行が始まる。',
    color: 'from-indigo-600 to-purple-800',
    theme: 'tower'
  },
  '11': {
    rank: '11',
    name: '雲の上の庭園',
    description: '雲より高い場所にある不思議な庭園。重力を超えた魔法を学ぶ。',
    color: 'from-sky-400 to-blue-600',
    theme: 'sky'
  },
  '12': {
    rank: '12',
    name: '砂時計の砂漠',
    description: '時間の流れが異なる砂漠。忍耐力と集中力が試される。',
    color: 'from-yellow-600 to-amber-800',
    theme: 'desert'
  },
  '13': {
    rank: '13',
    name: '虹の架け橋',
    description: '七色に輝く虹の橋。色彩魔法の基礎を学ぶ場所。',
    color: 'from-pink-500 to-purple-700',
    theme: 'rainbow'
  },
  '14': {
    rank: '14',
    name: '霧の迷宮',
    description: '深い霧に包まれた迷宮。方向感覚と魔法の感覚が試される。',
    color: 'from-gray-600 to-slate-800',
    theme: 'mist'
  },
  '15': {
    rank: '15',
    name: '大樹の根元',
    description: '世界樹の根が張り巡らされた地下世界。生命の魔法を学ぶ。',
    color: 'from-green-800 to-emerald-900',
    theme: 'tree'
  },
  '16': {
    rank: '16',
    name: '雷鳴の峡谷',
    description: '雷が絶え間なく轟く峡谷。電撃魔法の修行に最適。',
    color: 'from-yellow-700 to-gray-800',
    theme: 'thunder'
  },
  '17': {
    rank: '17',
    name: '潮騒の岬',
    description: '海と陸が出会う岬。波の音に合わせて魔法を唱える。',
    color: 'from-teal-600 to-cyan-800',
    theme: 'ocean'
  },
  '18': {
    rank: '18',
    name: '黄昏の境界',
    description: '昼と夜が交わる不思議な場所。時間魔法の基礎を学ぶ。',
    color: 'from-orange-500 to-purple-700',
    theme: 'twilight'
  },
  '19': {
    rank: '19',
    name: '風車の丘',
    description: '巨大な風車が回る丘。風の力を借りて魔法を増幅させる。',
    color: 'from-sky-600 to-green-700',
    theme: 'windmill'
  },
  '20': {
    rank: '20',
    name: '賢者の塔・二階',
    description: '基礎を終えた者のみが進める階層。より高度な魔法理論を学ぶ。',
    color: 'from-purple-700 to-indigo-900',
    theme: 'tower'
  },
  '21': {
    rank: '21',
    name: '鏡の回廊',
    description: '無数の鏡が並ぶ不思議な回廊。自分自身と向き合う試練の場。',
    color: 'from-slate-600 to-purple-800',
    theme: 'mirror'
  },
  '22': {
    rank: '22',
    name: '花園の迷路',
    description: '四季の花が同時に咲く魔法の花園。自然魔法の真髄を学ぶ。',
    color: 'from-pink-600 to-rose-800',
    theme: 'flower'
  },
  '23': {
    rank: '23',
    name: '竜の巣',
    description: '古の竜が住むと言われる山頂。勇気と知恵が試される。',
    color: 'from-red-700 to-orange-900',
    theme: 'dragon'
  },
  '24': {
    rank: '24',
    name: '星座の天文台',
    description: '星々の動きを読み解く天文台。占星術と魔法の関係を学ぶ。',
    color: 'from-indigo-700 to-purple-900',
    theme: 'constellation'
  },
  '25': {
    rank: '25',
    name: '精霊の泉',
    description: '精霊たちが集う聖なる泉。精霊魔法の契約を結ぶ場所。',
    color: 'from-cyan-600 to-teal-800',
    theme: 'spirit'
  },
  '26': {
    rank: '26',
    name: '炎と氷の境界',
    description: '相反する二つの力が共存する境界線。バランスの重要性を学ぶ。',
    color: 'from-red-600 to-blue-700',
    theme: 'balance'
  },
  '27': {
    rank: '27',
    name: '幻影の砂丘',
    description: '蜃気楼が見える不思議な砂丘。幻術の基礎を身につける。',
    color: 'from-yellow-700 to-pink-800',
    theme: 'illusion'
  },
  '28': {
    rank: '28',
    name: '深淵の入り口',
    description: '底知れぬ深さを持つ裂け目。闇魔法への理解を深める。',
    color: 'from-gray-800 to-black',
    theme: 'abyss'
  },
  '29': {
    rank: '29',
    name: '天空の橋',
    description: '雲の上に架かる巨大な橋。空間魔法の応用を学ぶ。',
    color: 'from-sky-500 to-indigo-700',
    theme: 'bridge'
  },
  '30': {
    rank: '30',
    name: '賢者の塔・三階',
    description: '中級魔法使いの証。ここからが真の修行の始まり。',
    color: 'from-purple-800 to-pink-900',
    theme: 'tower'
  },
  '31': {
    rank: '31',
    name: '時計塔の内部',
    description: '巨大な歯車が回る時計塔。時間操作の危険性を学ぶ。',
    color: 'from-amber-700 to-brown-800',
    theme: 'clockwork'
  },
  '32': {
    rank: '32',
    name: '嵐の海',
    description: '常に荒れ狂う海。自然の猛威と魔法の調和を学ぶ。',
    color: 'from-gray-700 to-blue-900',
    theme: 'storm'
  },
  '33': {
    rank: '33',
    name: '魔法陣の間',
    description: '古代の魔法陣が刻まれた部屋。儀式魔法の基礎を習得する。',
    color: 'from-purple-700 to-red-800',
    theme: 'ritual'
  },
  '34': {
    rank: '34',
    name: '宝石の鉱山',
    description: '魔力を宿した宝石が眠る鉱山。魔法道具の作成を学ぶ。',
    color: 'from-emerald-700 to-purple-800',
    theme: 'gem'
  },
  '35': {
    rank: '35',
    name: '風の迷宮',
    description: '見えない風の壁でできた迷宮。風属性魔法を極める。',
    color: 'from-teal-600 to-sky-800',
    theme: 'wind'
  },
  '36': {
    rank: '36',
    name: '灼熱の砂漠',
    description: '昼は灼熱、夜は極寒の砂漠。極限状態での魔法制御を学ぶ。',
    color: 'from-orange-700 to-red-900',
    theme: 'extreme'
  },
  '37': {
    rank: '37',
    name: '月食の祭壇',
    description: '月食の時にのみ力を発揮する祭壇。闇と光の調和を学ぶ。',
    color: 'from-indigo-800 to-gray-900',
    theme: 'eclipse'
  },
  '38': {
    rank: '38',
    name: '忘却の図書館',
    description: '失われた知識が眠る図書館。古代魔法の解読に挑む。',
    color: 'from-brown-700 to-purple-900',
    theme: 'library'
  },
  '39': {
    rank: '39',
    name: '雷雲の城',
    description: '雷雲の中に浮かぶ城。電撃魔法の応用を極める。',
    color: 'from-yellow-600 to-slate-800',
    theme: 'thunder'
  },
  '40': {
    rank: '40',
    name: '賢者の塔・四階',
    description: '上級への入り口。ここを越えれば一人前の魔法使いだ。',
    color: 'from-indigo-800 to-purple-900',
    theme: 'tower'
  },
  '41': {
    rank: '41',
    name: '虚空の間',
    description: '何もない空間。無から有を生み出す創造魔法を学ぶ。',
    color: 'from-gray-900 to-black',
    theme: 'void'
  },
  '42': {
    rank: '42',
    name: '溶岩の洞窟',
    description: '煮えたぎる溶岩が流れる洞窟。極限の炎魔法を習得する。',
    color: 'from-red-800 to-orange-900',
    theme: 'lava'
  },
  '43': {
    rank: '43',
    name: '極光の平原',
    description: 'オーロラが舞う極北の平原。光の魔法を極める。',
    color: 'from-green-600 to-purple-700',
    theme: 'aurora'
  },
  '44': {
    rank: '44',
    name: '深海の神殿',
    description: '海底深くに沈む古代神殿。水圧に耐えながら魔法を使う。',
    color: 'from-blue-800 to-indigo-900',
    theme: 'deep_sea'
  },
  '45': {
    rank: '45',
    name: '竜王の玉座',
    description: '竜の王が座すと言われる玉座。竜の力を借りる魔法を学ぶ。',
    color: 'from-red-700 to-purple-800',
    theme: 'dragon_king'
  },
  '46': {
    rank: '46',
    name: '次元の狭間',
    description: '異なる次元が交差する場所。空間転移の魔法を習得する。',
    color: 'from-purple-700 to-pink-800',
    theme: 'dimension'
  },
  '47': {
    rank: '47',
    name: '精霊王の森',
    description: '精霊の王が治める神聖な森。上級精霊魔法を学ぶ。',
    color: 'from-emerald-700 to-teal-900',
    theme: 'spirit_king'
  },
  '48': {
    rank: '48',
    name: '魔導師の工房',
    description: '伝説の魔導師が使った工房。魔法道具の極意を学ぶ。',
    color: 'from-amber-700 to-purple-800',
    theme: 'workshop'
  },
  '49': {
    rank: '49',
    name: '天界への階段',
    description: '天に続くと言われる階段。神聖魔法の基礎を学ぶ。',
    color: 'from-yellow-600 to-sky-700',
    theme: 'heaven'
  },
  '50': {
    rank: '50',
    name: '賢者の塔・五階',
    description: '中級の頂点。ここから先は選ばれし者のみが進める。',
    color: 'from-purple-900 to-indigo-950',
    theme: 'tower'
  }
};