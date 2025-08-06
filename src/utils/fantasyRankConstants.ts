/**
 * ファンタジーモードのランク定義（200ランク）
 * 各ランクには称号と説明文が含まれています
 */

export interface FantasyRankInfo {
  rank: number;
  title: string;
  stageName: string;
  description: string;
}

export const FANTASY_RANKS: FantasyRankInfo[] = [
  {
    rank: 1,
    title: 'マナの芽吹き',
    stageName: '始まりの森',
    description: '世界樹の根元に広がる、生命力に満ちた森。ここで魔法の源であるマナの息吹を初めて感じることになる。'
  },
  {
    rank: 2,
    title: '魔法学徒',
    stageName: '見習いの丘',
    description: '魔法学園を見下ろす小さな丘。偉大な魔法使いたちの背中を追い、最初の呪文を唱える場所。'
  },
  {
    rank: 3,
    title: '神秘への憧憬',
    stageName: '星見の湖畔',
    description: '夜空の星々が湖面に映る静かな場所。世界の神秘に触れ、未知への探求心が芽生える。'
  },
  {
    rank: 4,
    title: '魔法使いの卵',
    stageName: 'ひだまりの村',
    description: '優しい風が吹く平和な村。魔法の基礎を学び、最初の一歩を踏み出す、全ての始まりの地。'
  },
  {
    rank: 5,
    title: '魔力感知',
    stageName: 'ささやきの洞窟',
    description: '微弱な魔力鉱石が壁面で輝く洞窟。集中し、マナの流れを肌で感じる訓練を行う。'
  },
  {
    rank: 6,
    title: '見習い書士',
    stageName: 'アルジェの図書館',
    description: '基礎的な魔法書が並ぶ小さな図書館。古の知識の断片に触れ、理論の重要性を学ぶ。'
  },
  {
    rank: 7,
    title: '星の囁き',
    stageName: '静寂の神殿',
    description: '古代の神々を祀った小さな神殿。星々の微かな導きに耳を澄まし、運命の片鱗を垣間見る。'
  },
  {
    rank: 8,
    title: 'スペルキャスター',
    stageName: '試練の平原',
    description: '初めて実戦的な魔法を試すことになる広大な平原。魔物との戦いを通じて、呪文の威力を知る。'
  },
  {
    rank: 9,
    title: '魔力溜まり',
    stageName: '霧隠れの泉',
    description: '魔力が凝縮され、霧となって立ち込める神秘的な泉。体内のマナを増幅させる修行の場。'
  },
  {
    rank: 10,
    title: 'リサーチャー',
    stageName: '忘れられた遺跡',
    description: '魔法文明の痕跡が残る遺跡。古代の魔法陣や遺物を調査し、知識を深めていく。'
  },
  {
    rank: 11,
    title: 'オラクル',
    stageName: '神託の祭壇',
    description: '未来の断片を映し出すと言われる水晶が置かれた祭壇。初めての神託を受け、その意味を解き明かす。'
  },
  {
    rank: 12,
    title: 'メイジ',
    stageName: '賢者の石畳',
    description: '多くの魔法使いが集う学術都市の入り口。ここでの経験が、一人前のメイジとしての道を切り拓く。'
  },
  {
    rank: 13,
    title: 'マナシード',
    stageName: '生命の樹の庭',
    description: 'マナの種子が宿る聖なる樹が育つ庭園。自身の内にマナの核を形成する。'
  },
  {
    rank: 14,
    title: 'スチューデント',
    stageName: '王立魔法学園',
    description: '国中から優秀な生徒が集まる学び舎。高度な魔法理論と実践を体系的に学ぶ。'
  },
  {
    rank: 15,
    title: 'ミスティック',
    stageName: '幻惑の森',
    description: '不思議な光が舞い、現実と幻が交差する森。世界の理の外側にある神秘を探求する。'
  },
  {
    rank: 16,
    title: 'ソーサラー',
    stageName: '元素の交差点',
    description: '炎、水、風、土の力が渦巻く場所。四大元素の力を借り、強力な魔法を編み出す。'
  },
  {
    rank: 17,
    title: 'エーテルライト',
    stageName: '月光の頂',
    description: '高純度の魔力「エーテル」が降り注ぐ山の頂。マナをより洗練された力へと昇華させる。'
  },
  {
    rank: 18,
    title: 'セカンドクラス',
    stageName: '第二書庫「ソフィア」',
    description: '学園の中でも、選ばれた者のみが入室を許される書庫。より専門的な知識が眠っている。'
  },
  {
    rank: 19,
    title: 'アストラル・チャイルド',
    stageName: '夢見の揺り籠',
    description: '精神が肉体を離れ、アストラル界へと旅立つための聖域。星々の魂と交信する。'
  },
  {
    rank: 20,
    title: 'ウィザード・アプレンティス',
    stageName: '師匠の工房',
    description: '偉大なウィザードの元で、魔法道具の作成や、より高度な魔法の補助を学ぶ。'
  },
  {
    rank: 21,
    title: '魔力循環',
    stageName: '竜の血の滝',
    description: '竜の力が溶け込んでいるという赤い滝。滝に打たれ、体内の魔力循環を活性化させる。'
  },
  {
    rank: 22,
    title: '魔法学者',
    stageName: '大図書館の深層',
    description: '一般の学者ではたどり着けない、大図書館の最深部。失われた魔法の歴史を紐解く。'
  },
  {
    rank: 23,
    title: 'チャネラー',
    stageName: '精霊の通り道',
    description: '高位の精霊たちが往来する見えざる道。彼らと交信し、その力を一時的に借り受ける。'
  },
  {
    rank: 24,
    title: 'コンジュラー',
    stageName: '召喚の儀式場',
    description: '異界の存在を呼び出すための魔法陣が刻まれた古代の儀式場。'
  },
  {
    rank: 25,
    title: 'ルーンの刻印',
    stageName: '古ルーンの石碑群',
    description: '力を持つ古代文字「ルーン」が刻まれた石碑が立ち並ぶ場所。その力を自らの武具や身体に刻む。'
  },
  {
    rank: 26,
    title: '上級書記官',
    stageName: '王宮書庫',
    description: '国の歴史と魔法の記録が収められた王宮の書庫。王族に仕え、機密文書を管理する。'
  },
  {
    rank: 27,
    title: 'ディヴァイナー',
    stageName: '運命の羅針盤',
    description: '人や世界の運命を指し示すと言われるアーティファクトが眠る神殿。'
  },
  {
    rank: 28,
    title: 'ウォーロック',
    stageName: '契約の祭壇',
    description: '強大な力を持つ異界のパトロンと契約を結ぶための祭壇。力と引き換えに代償を支払う。'
  },
  {
    rank: 29,
    title: 'マナストーン',
    stageName: '魔晶石の鉱脈',
    description: '高密度のマナが結晶化した魔晶石が採掘される鉱山。純粋な力の塊を手に入れる。'
  },
  {
    rank: 30,
    title: 'プロフェッサー',
    stageName: '魔法大学の講堂',
    description: '次世代の魔法使いたちに、自らの知識と経験を教え授ける大講堂。'
  },
  {
    rank: 31,
    title: '聖なる語り部',
    stageName: '神々の黄昏',
    description: '神話の時代、神々が最後の戦いを繰り広げたとされる古戦場。その記憶を読み解く。'
  },
  {
    rank: 32,
    title: 'ハイ・ウィザード',
    stageName: '七色の塔',
    description: '７つの魔法属性を極めた者だけが挑むことを許される塔。各階層で属性の試練が待ち受ける。'
  },
  {
    rank: 33,
    title: '魔力の奔流',
    stageName: 'マエルストロームの中心',
    description: '魔力が嵐のように渦巻く危険地帯。その奔流を制御し、自らの力へと変える。'
  },
  {
    rank: 34,
    title: 'マスター',
    stageName: '賢者の隠れ里',
    description: '俗世を離れたマスターたちが集い、魔法の真理を議論する隠れ里。'
  },
  {
    rank: 35,
    title: 'アストラル・ウォーカー',
    stageName: '星屑の回廊',
    description: 'アストラル界に存在する、星々の間を繋ぐ光の道。精神体で時空を旅する。'
  },
  {
    rank: 36,
    title: 'マスター・ソーサラー',
    stageName: '元素の源流',
    description: '全ての元素魔法が生まれるとされる源泉。元素の根源的な力を操る術を学ぶ。'
  },
  {
    rank: 37,
    title: 'エーテルフロー',
    stageName: '天空川「エーテリア」',
    description: '空に流れるエーテルの大河。その流れに乗り、無限に近いエネルギーを引き出す。'
  },
  {
    rank: 38,
    title: 'ファーストクラス',
    stageName: '禁書庫「アカシャ」',
    description: '世界の真理に触れる危険な禁書が収められた書庫。アカデミーの最優等生のみが閲覧を許される。'
  },
  {
    rank: 39,
    title: 'ミスティック・マスター',
    stageName: '因果の観測所',
    description: '世界のあらゆる事象の因果律を観測できる高台。運命の流れを読み解く。'
  },
  {
    rank: 40,
    title: 'アークメイジ',
    stageName: '天衝く魔術師の塔',
    description: '雲を貫きそびえ立つ、アークメイジの拠点。塔の各階層には古代の知識と強力な魔法が眠っている。'
  },
  {
    rank: 41,
    title: 'アークコア',
    stageName: '魔力炉心の間',
    description: '古代文明が遺した巨大な魔力炉の中心部。自身の魔力核を、この炉心と共鳴させ強化する。'
  },
  {
    rank: 42,
    title: '大学者',
    stageName: '真理の扉',
    description: 'あらゆる学問を修めた者だけが目にすることができる、叡智へと続く巨大な扉。'
  },
  {
    rank: 43,
    title: 'ハイ・オラクル',
    stageName: '時の川',
    description: '過去と未来が混じり合い流れる川。その流れから、より明確な未来を読み解く力を得る。'
  },
  {
    rank: 44,
    title: '大法師',
    stageName: '魔霧の戦場',
    description: '強力な魔法の応酬によって、常に魔力の霧が立ち込める古戦場。戦略と実力が試される。'
  },
  {
    rank: 45,
    title: 'ルーンマスター',
    stageName: 'ルーンの聖地',
    description: '全てのルーン文字が生まれたとされる場所。ここでは、新たなルーンを創造することさえ可能だという。'
  },
  {
    rank: 46,
    title: '賢者の弟子',
    stageName: '大賢者の庭',
    description: '世界の理を知る大賢者が住まう庭。その問答の一つ一つが、深遠な学びとなる。'
  },
  {
    rank: 47,
    title: '星界の旅人',
    stageName: '流星のハイウェイ',
    description: '肉体を伴ったまま星々の間を旅することができる、光の道。未知の惑星や異次元を訪れる。'
  },
  {
    rank: 48,
    title: 'エレメンタリスト',
    stageName: '元素大聖堂',
    description: '四大元素の王を祀る巨大な聖堂。元素の調和と混沌、その両方を支配する術を学ぶ。'
  },
  {
    rank: 49,
    title: 'マナクリスタル',
    stageName: '世界のへそ',
    description: '大地から巨大なマナクリスタルが突き出した、惑星の魔力の中枢。'
  },
  {
    rank: 50,
    title: 'ハイ・プロフェッサー',
    stageName: 'アカデメイア中央議事堂',
    description: '全ての魔法大学の最高決定機関。その一員として、魔法界全体の未来を議論する。'
  },
  {
    rank: 51,
    title: 'コズミック・シーカー',
    stageName: '宇宙の墓場',
    description: '役目を終えた星々が流れ着く場所。宇宙の誕生と終焉の秘密を探求する。'
  },
  {
    rank: 52,
    title: 'ネクロマンサー',
    stageName: '死者の都',
    description: '彷徨える魂たちが集う巨大な都。ここでは、死は終わりではなく、新たな始まりに過ぎない。'
  },
  {
    rank: 53,
    title: '魔力炉心',
    stageName: '崩壊した神々の炉',
    description: 'かつて神々が使っていたという伝説の魔力炉。暴走したその力を鎮め、制御下に置く。'
  },
  {
    rank: 54,
    title: 'グランドマスター',
    stageName: '万学の頂',
    description: 'あらゆる魔法体系をマスターした者だけが立つことを許される、人知の最高峰。'
  },
  {
    rank: 55,
    title: 'ディヴァイン・メッセンジャー',
    stageName: '神域への階段',
    description: '人間界と神々の住まう領域を繋ぐ、雲でできた大階段。神の言葉を携え、世界に伝える。'
  },
  {
    rank: 56,
    title: 'アーク・ウォーロック',
    stageName: '奈落の王座',
    description: '異界のパトロンの中でも、特に強力な存在が座す玉座。更なる力のための、より危険な契約を結ぶ。'
  },
  {
    rank: 57,
    title: 'ハイ・エーテル',
    stageName: 'エーテルの源泉',
    description: 'この世界にエーテルを供給している大本の泉。その身を浸し、存在そのものを高次のエネルギー体へと近づける。'
  },
  {
    rank: 58,
    title: 'アカデメイアの探求者',
    stageName: '失われた空中都市',
    description: '魔法によって空に浮かんでいた古代都市の遺跡。失われた超技術と魔法理論を発掘する。'
  },
  {
    rank: 59,
    title: '神秘卿',
    stageName: '月の裏側の神殿',
    description: '誰にも知られることなく、世界の神秘を管理してきた者たちが集う秘密の神殿。'
  },
  {
    rank: 60,
    title: 'グランド・ウィザード',
    stageName: '王国の守護者',
    description: '一国の軍事力に匹敵するとされるグランド・ウィザードが、その力で王国全体を守護する最前線。'
  },
  {
    rank: 61,
    title: 'アークジェネレーター',
    stageName: '自己増殖する魔力回路',
    description: '一度起動すれば、半永久的に魔力を生み出し続ける古代の遺物。これを自らの魔力回路と接続する。'
  },
  {
    rank: 62,
    title: '古代言語の解読者',
    stageName: 'バベルの図書館',
    description: '神話の時代に失われた全ての言語の魔法書が眠るという伝説の図書館。'
  },
  {
    rank: 63,
    title: 'グランド・オラクル',
    stageName: '運命の織物',
    description: '世界のあらゆる可能性が糸として織り上げられているタペストリー。その一本を読み解き、変えることさえできる。'
  },
  {
    rank: 64,
    title: '魔導師',
    stageName: '魔導要塞',
    description: 'それ自体が一個の戦略級兵器である、移動式の巨大な魔法要塞。'
  },
  {
    rank: 65,
    title: 'グランドルーン',
    stageName: '世界を支えるルーン',
    description: 'この世界の物理法則を定義しているとされる、始まりのルーン文字が刻まれた場所。'
  },
  {
    rank: 66,
    title: '星詠みの学者',
    stageName: '天体観測所「ホロスコープ」',
    description: '星々の動きから、国や世界の未来を予測する巨大な観測所。'
  },
  {
    rank: 67,
    title: 'アカシック・ヴィジョナー',
    stageName: 'アカシックレコードの入り口',
    description: '森羅万象の記憶が記録されている「アカシックレコード」へとアクセスするための精神の扉。'
  },
  {
    rank: 68,
    title: 'サモナー・ロード',
    stageName: '百鬼夜行の谷',
    description: '無数の召喚獣や悪魔が跋扈する危険な谷。その頂点に立ち、全てを従える。'
  },
  {
    rank: 69,
    title: '魔力暴走',
    stageName: 'ヴォイド・ストーム',
    description: 'あまりに強大な魔力が制御を失い、空間そのものを削り取る嵐となっている場所。'
  },
  {
    rank: 70,
    title: 'ロイヤル・プロフェッサー',
    stageName: '王族への御前講義',
    description: '王や次期王位継承者に対し、一対一で魔法と帝王学を教える、国で最も名誉ある役職。'
  },
  {
    rank: 71,
    title: '神託の巫女/神官',
    stageName: '世界樹の頂',
    description: '世界そのものの声を聞くことができると言われる、世界樹の最上部。'
  },
  {
    rank: 72,
    title: 'ソーサラー・キング',
    stageName: '元素界の王宮',
    description: '元素の精霊たちが住まう異世界の中心地。彼らを統べ、元素の王として君臨する。'
  },
  {
    rank: 73,
    title: 'エーテルネクサス',
    stageName: '次元連結点',
    description: '様々な次元世界が交差し、膨大なエーテルが渦巻く結節点。'
  },
  {
    rank: 74,
    title: 'セージ',
    stageName: '賢者の石の工房',
    description: 'あらゆる物質を金に変え、不老不死をもたらすという伝説の「賢者の石」を錬成する場所。'
  },
  {
    rank: 75,
    title: '次元潜行者',
    stageName: '次元の狭間',
    description: '世界と世界の間に存在する、法則のない虚無の空間。ここを通り、未知の次元へと渡る。'
  },
  {
    rank: 76,
    title: 'ウォーロック・オーバーロード',
    stageName: '異界の侵略拠点',
    description: '異界の軍勢を率い、他の次元を侵略するための前線基地。'
  },
  {
    rank: 77,
    title: 'マナダイヤモンド',
    stageName: '星の核',
    description: '惑星の中心で、超高圧によって生成された究極のマナの結晶体。'
  },
  {
    rank: 78,
    title: 'アカデメイアの賢者',
    stageName: '賢人会議',
    description: '各分野の賢者たちが集い、世界の危機や魔法の未来について話し合う秘密の会議。'
  },
  {
    rank: 79,
    title: '神秘王',
    stageName: '万象を見通す宮殿',
    description: '過去、現在、未来、あらゆる平行世界を同時に観測できるという神秘の王の居城。'
  },
  {
    rank: 80,
    title: 'ロード・オブ・メイジ',
    stageName: '魔法使いの国の玉座',
    description: '全ての魔法使いを統べる王として、自らが建国した魔法国家の中心に座す。'
  },
  {
    rank: 81,
    title: '魔力の具現化',
    stageName: '想像の庭',
    description: '自身の魔力と想像力だけで、あらゆるものを無から生み出すことができる精神世界。'
  },
  {
    rank: 82,
    title: '禁書庫の番人',
    stageName: '封印されし魔導書',
    description: '一冊で世界を滅ぼす力を持つと言われる魔導書が封印されている最奥の書架。'
  },
  {
    rank: 83,
    title: '運命の観測者',
    stageName: '因果律の地平線',
    description: 'これ以上進むと、世界の運命に不可逆な影響を与えてしまう境界線。'
  },
  {
    rank: 84,
    title: '大魔導師',
    stageName: '浮遊書庫アルカディア',
    description: '空に浮かぶ禁断の書庫。大魔導師のみが立ち入ることを許され、世界の真理に触れることができるという。'
  },
  {
    rank: 85,
    title: 'アークエンジェル',
    stageName: '天界の門',
    description: '神々に仕える高位の天使たちが住まう天界へと続く大門。その門番として、世界の秩序を守る。'
  },
  {
    rank: 86,
    title: '大賢者',
    stageName: '世界の理との対話',
    description: '物理的な場所ではなく、世界の法則そのものと直接対話し、真理を学ぶ精神の境地。'
  },
  {
    rank: 87,
    title: '星々の代弁者',
    stageName: '銀河の中心',
    description: '銀河に存在する全ての知的生命体の集合意識と交信できる場所。'
  },
  {
    rank: 88,
    title: '魔王の右腕',
    stageName: '魔王城・軍議の間',
    description: '魔王軍の最高幹部として、世界征服の作戦を立案し、軍勢を指揮する。'
  },
  {
    rank: 89,
    title: 'ヴォイドコア',
    stageName: '虚無の深淵',
    description: 'あらゆる存在を無に帰す「ヴォイド」エネルギーが渦巻く深淵の中心部。'
  },
  {
    rank: 90,
    title: 'アカシック・リーダー',
    stageName: 'アカシックレコードの中枢',
    description: '全ての記憶が集まるアカシックレコードの中心部で、望む情報を自在に読み解く。'
  },
  {
    rank: 91,
    title: 'コズミック・オラクル',
    stageName: '宇宙の誕生の瞬間',
    description: 'ビッグバンの瞬間を幻視し、宇宙全体の運命を神託として受け取る。'
  },
  {
    rank: 92,
    title: 'アルティメット・ソーサラー',
    stageName: '終末の火山',
    description: '世界を焼き尽くすほどの究極の破壊魔法を行使するための、惑星エネルギーが集中する場所。'
  },
  {
    rank: 93,
    title: 'ルーンの創造主',
    stageName: '言霊の源泉',
    description: '言葉に力を与える根源的な力が湧き出る泉。ここで発した言葉は、新たな法則（ルーン）となる。'
  },
  {
    rank: 94,
    title: '真理の探究者',
    stageName: '形而上の迷宮',
    description: '物理法則が通用しない、概念だけで構成された迷宮。その最奥に「真理」が隠されているという。'
  },
  {
    rank: 95,
    title: 'アストラル・ロード',
    stageName: 'アストラル界の王宮',
    description: '夢や精神の世界であるアストラル界を統べる王の宮殿。'
  },
  {
    rank: 96,
    title: 'エレメンタル・エンペラー',
    stageName: '元素創成の地',
    description: 'この世界に存在しない、新たな元素を創造することができる場所。'
  },
  {
    rank: 97,
    title: '星屑の魔力',
    stageName: '超新星の爆心地',
    description: '星がその一生を終える瞬間に放出する莫大なエネルギーを、その身に受け止める。'
  },
  {
    rank: 98,
    title: '星図の編纂者',
    stageName: '未知の宇宙',
    description: 'まだ誰にも観測されたことのない、新たな宇宙領域の星図を作成し、世界の境界を広げる。'
  },
  {
    rank: 99,
    title: '聖別の執行者',
    stageName: '罪深き神々の法廷',
    description: '人間界の法では裁けぬ、堕落した神々を断罪するための天上の法廷。'
  },
  {
    rank: 100,
    title: 'アークリッチ',
    stageName: '不死者の王国',
    description: '生と死の理を超越したアークリッチが、自らの魂を納める「魂の器」を守るために築いた要塞国家。'
  },
  {
    rank: 101,
    title: 'エーテルストリーム',
    stageName: '銀河を繋ぐ光の河',
    description: '銀河と銀河の間を流れる超光速のエーテルの流れ。これを利用し、瞬時に銀河間を移動する。'
  },
  {
    rank: 102,
    title: '叡智の守護者',
    stageName: '世界樹の最深記憶',
    description: '世界の始まりから終わりまでの全てを記憶している世界樹の、最も古い記憶の層。'
  },
  {
    rank: 103,
    title: '次元の監視者',
    stageName: '次元断層パノプティコン',
    description: '全ての平行世界を同時に監視できる、異次元に築かれた監視塔。'
  },
  {
    rank: 104,
    title: '魔導王',
    stageName: '天上天下の玉座',
    description: '人間界、魔界、天界、その全てを魔法の力で平定した王が座す、究極の玉座。'
  },
  {
    rank: 105,
    title: '魔力の化身',
    stageName: '魔力そのものになる聖域',
    description: '肉体を捨て、純粋な魔力エネルギーの生命体へと転生するための儀式場。'
  },
  {
    rank: 106,
    title: 'ロイヤル・セージ',
    stageName: '建国王への助言',
    description: '新たな国を興そうとする英雄の傍らに立ち、その知恵で千年続く王国の礎を築く。'
  },
  {
    rank: 107,
    title: '神々の代行者',
    stageName: '神々の代理戦争',
    description: '直接争うことのできない神々の代わりに、その全権代理として他の神の代行者と世界の覇権を争う。'
  },
  {
    rank: 108,
    title: '大賢者の魔法使い',
    stageName: '賢者の石の心臓部',
    description: '大賢者がその生涯をかけて作り上げた、惑星サイズの賢者の石の中心核。'
  },
  {
    rank: 109,
    title: 'アークデーモン',
    stageName: '魔界の最下層「コキュートス」',
    description: '最も強大な悪魔たちが封印されているという、魔界の最深部。その封印を解き、彼らを支配する。'
  },
  {
    rank: 110,
    title: 'グランド・ワイズマン',
    stageName: '森羅万象の図書館',
    description: 'この世のあらゆる事象、概念、感情までもが書物として収められている図書館。'
  },
  {
    rank: 111,
    title: 'アカシック・ダイバー',
    stageName: '他人の記憶の海',
    description: 'アカシックレコードを介し、他者の過去の記憶や経験の中へと精神をダイブさせる。'
  },
  {
    rank: 112,
    title: 'キング・オブ・ウィザーズ',
    stageName: '魔法オリンピアの頂点',
    description: '数百年ごとに開催される、全次元の魔法使いの頂点を決める大会の決勝の舞台。'
  },
  {
    rank: 113,
    title: '銀河のマナ',
    stageName: '銀河の中心核（バルジ）',
    description: '数千億の星々のマナが集まる銀河の中心部。そのエネルギーを一身に集める。'
  },
  {
    rank: 114,
    title: 'アカデメイアの主',
    stageName: '魔法学の原点',
    description: '全ての魔法理論が生まれた最初の場所。ここに立ち、新たな学問の体系を創始する。'
  },
  {
    rank: 115,
    title: '運命の紡ぎ手',
    stageName: '運命の糸車',
    description: '世界の運命を糸として紡ぐ巨大な糸車。その糸を操り、未来を意のままに作り変える。'
  },
  {
    rank: 116,
    title: '絶望の魔術師',
    stageName: '世界が終わる日',
    description: '全ての希望が失われ、世界が終焉を迎えるその瞬間に立ち、絶望から究極の力を引き出す。'
  },
  {
    rank: 117,
    title: 'コズミック・エーテル',
    stageName: '宇宙背景放射',
    description: '宇宙の始まりの光であるマイクロ波背景放射に満ちた空間。そのエネルギーを直接魔力に変換する。'
  },
  {
    rank: 118,
    title: '根源の学者',
    stageName: '世界が始まる前の虚無',
    description: 'ビッグバンが起こる前の、時間も空間も存在しない「無」を観測し、存在の根源を探る。'
  },
  {
    rank: 119,
    title: '神秘神',
    stageName: '信仰の海',
    description: '人々の信仰心が集まって神を形成するエネルギーの海。その中心で、新たな神として誕生する。'
  },
  {
    rank: 120,
    title: '魔法神の使徒',
    stageName: '魔法神の神殿',
    description: '魔法を司る神そのものから直接、神の力の一部を分け与えられる神聖な場所。'
  },
  {
    rank: 121,
    title: '魔力次元',
    stageName: '自ら創造した次元',
    description: '自身の魔力だけで、全く新しい法則を持つポケット次元を創造し、その創造主となる。'
  },
  {
    rank: 122,
    title: '全知の探求者',
    stageName: '最後の問い',
    description: '全知に至るための、最後の問いが投げかけられる場所。これに答えれば、全てを知ることができるという。'
  },
  {
    rank: 123,
    title: '星の創造主',
    stageName: '星雲の揺り籠',
    description: 'ガスや塵が集まる星雲の中で、新たな恒星を誕生させる。'
  },
  {
    rank: 124,
    title: '魔法騎士団長',
    stageName: '神々との最終戦争',
    description: '人類の存亡をかけ、神々に反旗を翻した魔法騎士団の先頭に立ち、神軍と激突する。'
  },
  {
    rank: 125,
    title: 'ルーンの法則',
    stageName: '世界法則の設計室',
    description: 'この世界の物理法則や魔法法則が設計された場所。既存の法則を書き換える権能を得る。'
  },
  {
    rank: 126,
    title: 'アカシック・レコードの閲覧者',
    stageName: '全存在の記憶',
    description: '特定の情報を探すのではなく、アカシックレコードに記録された全存在の記憶を一度に全て閲覧する。'
  },
  {
    rank: 127,
    title: 'コズミック・エンペラー',
    stageName: '超銀河団の王座',
    description: '数十万の銀河が集まる超銀河団を統べる皇帝として、宇宙規模の統治を行う。'
  },
  {
    rank: 128,
    title: 'グランド・アークメイジ',
    stageName: '魔法文明の頂点',
    description: 'かつて存在した、神々をも凌駕したとされる超魔法文明の遺跡の中心部。'
  },
  {
    rank: 129,
    title: 'マナの特異点',
    stageName: 'ブラックホールの中心',
    description: '時間も空間も無限に歪むブラックホールの特異点。無限の重力エネルギーを魔力へと変換する。'
  },
  {
    rank: 130,
    title: '賢王',
    stageName: '理想国家「プラトニア」',
    description: '争いも貧困もない、叡智によって統治される伝説の理想国家を建国する。'
  },
  {
    rank: 131,
    title: 'ディヴァイン・ソース',
    stageName: '神性の源泉',
    description: 'あらゆる神々の力の源となっている場所。その力に触れ、自らも神となる。'
  },
  {
    rank: 132,
    title: '希望の魔術師',
    stageName: '絶望の底',
    description: '全てのものが滅び去った無の世界で、たった一つの希望の光を灯し、世界を再創生する。'
  },
  {
    rank: 133,
    title: 'ヴォイドルーラー',
    stageName: '虚無の王座',
    description: '全てを無に帰すヴォイドの力を完全に支配し、その王として君臨する。'
  },
  {
    rank: 134,
    title: '星界の哲学者',
    stageName: '存在の意味を問う場所',
    description: '宇宙そのものに対し、「なぜ存在するのか」という究極の問いを投げかける。'
  },
  {
    rank: 135,
    title: '時空の航海士',
    stageName: '時間線の分岐点',
    description: 'あらゆる平行世界（時間線）へと自由に渡航できる、時空の港。'
  },
  {
    rank: 136,
    title: '魔導皇',
    stageName: '魔法帝国の玉座',
    description: '複数の次元世界にまたがる巨大な魔法帝国を統べる皇帝の座。'
  },
  {
    rank: 137,
    title: '原初の奔流',
    stageName: '世界が生まれた瞬間の魔力',
    description: 'ビッグバンの瞬間にほとばしった、最も純粋で根源的な魔力の奔流。'
  },
  {
    rank: 138,
    title: '時の編纂者',
    stageName: '歴史の修正室',
    description: '望ましくない結果へと繋がった過去の歴史を、正史から抹消し、書き換えることができる。'
  },
  {
    rank: 139,
    title: '摂理の代行者',
    stageName: '世界のバグ修正',
    description: '矛盾した世界の法則や、時空の歪みなど、世界のシステムエラーを修正する。'
  },
  {
    rank: 140,
    title: '世界を渡る者',
    stageName: 'マルチバース・ジャンクション',
    description: '無数に存在する多元宇宙（マルチバース）の中心に位置し、あらゆる宇宙へとアクセスできる結節点。'
  },
  {
    rank: 141,
    title: 'エーテルオーシャン',
    stageName: '宇宙を満たすエーテルの海',
    description: '宇宙空間そのものを構成しているエーテルの大海原。その全てが、自身の魔力となる。'
  },
  {
    rank: 142,
    title: '叡智の王',
    stageName: '全知の玉座',
    description: 'この宇宙に存在する全ての知識と思考を手に入れた者が座ることを許される玉座。'
  },
  {
    rank: 143,
    title: 'アカシックの支配者',
    stageName: '記憶の改竄',
    description: 'アカシックレコードを閲覧するだけでなく、記録された過去の事実を意のままに書き換える。'
  },
  {
    rank: 144,
    title: '魔法帝',
    stageName: '星辰の玉座',
    description: '魔法帝が宇宙の法則を統べる場所。ここでは、星々を操り、時空を書き換えるほどの力が振るわれる。'
  },
  {
    rank: 145,
    title: '超越魔力',
    stageName: '概念宇宙',
    description: '物理法則ではなく、「力」「愛」「死」などの概念そのもので構成された高次元宇宙。'
  },
  {
    rank: 146,
    title: 'マギステル・マギ',
    stageName: '魔法の教師たちの頂点',
    description: '全ての魔法使いの師であり、魔法という概念そのものを次世代へと伝承する存在。'
  },
  {
    rank: 147,
    title: '運命の設計者',
    stageName: '運命の設計図',
    description: 'これから生まれる新たな宇宙の、運命の青写真を描く場所。'
  },
  {
    rank: 148,
    title: '神殺しの魔法使い',
    stageName: '神々の墓場',
    description: '宇宙を創造した創造主たる神々でさえも、その魔法の前にはひれ伏し、滅び去る。'
  },
  {
    rank: 149,
    title: 'アークゴッド',
    stageName: '万神殿の主神',
    description: 'あらゆる神話体系の神々を束ねる、主神の中の主神となる。'
  },
  {
    rank: 150,
    title: 'アカデメイアの創設者',
    stageName: '最初の学び舎',
    description: 'まだ魔法という概念すらなかった世界に、初めて「知」と「学問」をもたらした原初の場所。'
  },
  {
    rank: 151,
    title: '根源への到達者',
    stageName: '万物の根源',
    description: '全ての存在、全ての概念が生まれた、宇宙が始まるよりも前の「始まりの場所」。'
  },
  {
    rank: 152,
    title: '伝説の大魔導',
    stageName: '神話の世界',
    description: '人々の想像力と信仰が生み出した、物語の中の世界に実体を持って干渉する。'
  },
  {
    rank: 153,
    title: '創星のマナ',
    stageName: '無からの星団創造',
    description: '何もない虚空から、銀河に匹敵する規模の星団を一度に創造する。'
  },
  {
    rank: 154,
    title: '世界の記録者',
    stageName: '終わった宇宙の記録庫',
    description: '既に消滅した無数の宇宙の、始まりから終わりまでの全記録を保管する図書館。'
  },
  {
    rank: 155,
    title: '宇宙の意志',
    stageName: '宇宙との一体化',
    description: '個人の意識を捨て、宇宙全体の意識そのものとなり、森羅万象を動かす。'
  },
  {
    rank: 156,
    title: '破壊と創造の主',
    stageName: '宇宙のスクラップ＆ビルド',
    description: '古くなった宇宙を破壊し、その残骸から全く新しい宇宙を創造する。'
  },
  {
    rank: 157,
    title: 'アカシックフォース',
    stageName: 'アカシックレコードの動力炉',
    description: 'アカシックレコードという超巨大な情報体を維持している根源的な力そのものと化す。'
  },
  {
    rank: 158,
    title: '根源の知恵',
    stageName: 'なぜ「無」ではなく「有」なのか',
    description: '宇宙存在の究極の謎、「無」ではなく、なぜ何かが「有る」のか、その答えを知る。'
  },
  {
    rank: 159,
    title: '全てを見通す目',
    stageName: '高次元からの観測',
    description: '我々の住む宇宙を、さらに高次の次元から箱庭のように見下ろし、全てを観測する。'
  },
  {
    rank: 160,
    title: '魔法の化身',
    stageName: '魔法の概念そのもの',
    description: 'もはや魔法を使う者ではない。存在そのものが「魔法」という現象になる。'
  },
  {
    rank: 161,
    title: '魔力の根源',
    stageName: '魔力が生まれる場所',
    description: '魔法エネルギーという概念が、この宇宙に初めて生まれた原初の特異点。'
  },
  {
    rank: 162,
    title: '全知の賢者',
    stageName: '全ての問いと答え',
    description: '宇宙に存在しうる、ありとあらゆる「問い」と、その「答え」を同時に知る。'
  },
  {
    rank: 163,
    title: '星界の神',
    stageName: '星々の精神宇宙',
    description: '恒星や惑星といった天体たちの、集合的無意識の世界を統べる神となる。'
  },
  {
    rank: 164,
    title: '魔法神',
    stageName: '魔法の神々の頂点',
    description: '炎の神、水の神といった属性神や、様々な魔法の神々を統べる、魔法の最高神。'
  },
  {
    rank: 165,
    title: '神々の魔力炉',
    stageName: '神々を動かすエネルギー源',
    description: '全ての神々の力の源となっている、宇宙規模の超巨大な魔力炉を支配する。'
  },
  {
    rank: 166,
    title: 'アカシックの体現者',
    stageName: '歩くアカシックレコード',
    description: '自身の存在が、森羅万象の記憶そのものとなる。宇宙の歴史は、あなたの記憶となる。'
  },
  {
    rank: 167,
    title: 'コズミック・ゴッド',
    stageName: '宇宙法則の神格化',
    description: '万有引力や光速度といった、宇宙の物理法則そのものが神格化した存在となる。'
  },
  {
    rank: 168,
    title: '原初の詠唱者',
    stageName: '最初の言葉',
    description: '世界を創造した「始まりの言葉」を唱え、宇宙をゼロから再創造する。'
  },
  {
    rank: 169,
    title: 'ヴォイドロード',
    stageName: '無の支配者',
    description: '「存在」だけでなく、対極にある「無」をも完全に支配下に置く。'
  },
  {
    rank: 170,
    title: '星々の教師',
    stageName: '知性への導き',
    description: 'まだ生命のいない原始の惑星に降り立ち、生命の誕生と知的文明への進化を導く。'
  },
  {
    rank: 171,
    title: 'ディヴァイン・ワン',
    stageName: '唯一神',
    description: '多神教の世界に終止符を打ち、宇宙で唯一絶対の神として君臨する。'
  },
  {
    rank: 172,
    title: '世界の破壊者',
    stageName: '宇宙の終焉',
    description: '宇宙の寿命を待たず、自らの意思で、この宇宙の全ての存在を完全に消滅させる。'
  },
  {
    rank: 173,
    title: '全能のルーン',
    stageName: '全能の言葉',
    description: '唱えるだけで、文字通り「なんでも」可能になる、究極のルーン文字を手にする。'
  },
  {
    rank: 174,
    title: '時空の観測者',
    stageName: '5次元プリズム',
    description: '我々の4次元時空を、5次元的な視点から、過去から未来まで全て同時に観測する。'
  },
  {
    rank: 175,
    title: '時空の創造主',
    stageName: '新たな時間と空間の創造',
    description: '既存の宇宙の外側に、全く新しい物理法則を持つ、新たな時空を創造する。'
  },
  {
    rank: 176,
    title: '星を創る者',
    stageName: '宇宙のキャンバス',
    description: '虚空をキャンバスに、星々を絵の具として、自在に銀河や星団を描き出す。'
  },
  {
    rank: 177,
    title: 'ゼロポイント・マナ',
    stageName: '真空エネルギー',
    description: '何もないはずの真空に満ちている、無限のエネルギーを自在に引き出す。'
  },
  {
    rank: 178,
    title: '叡智の神',
    stageName: '知識の神々の頂点',
    description: '全ての次元の、全ての知識や学問を司る神々の王となる。'
  },
  {
    rank: 179,
    title: '摂理そのもの',
    stageName: '世界のシステム管理者',
    description: 'もはや世界の法則に従う者ではない。あなたが世界の法則、摂理そのものとなる。'
  },
  {
    rank: 180,
    title: '時空の魔術師',
    stageName: '時間ループからの脱出',
    description: '閉ざされた時間のループに囚われた宇宙を、その外側から救い出す。'
  },
  {
    rank: 181,
    title: 'エーテルの化神',
    stageName: '宇宙の血液',
    description: '宇宙の隅々まで満たしているエーテルの流れ、そのものと一体化し、宇宙の生命活動を司る。'
  },
  {
    rank: 182,
    title: '真理の到達者',
    stageName: '全ての答え',
    description: '「真理」を探求する者から、真理そのものへと至る。あなたの存在が、全ての問いの答えとなる。'
  },
  {
    rank: 183,
    title: 'アカシックの化身',
    stageName: '宇宙の記憶',
    description: '宇宙の過去・現在・未来、全ての記憶情報が、あなたという一つの存在に収束する。'
  },
  {
    rank: 184,
    title: '世界の創造者',
    stageName: '始まりの光',
    description: '新たな宇宙を創造するビッグバン、その最初の光を放つ。'
  },
  {
    rank: 185,
    title: '世界の心臓',
    stageName: '宇宙の鼓動',
    description: '宇宙全体の魔力循環やエネルギーの流れを司る、中心的な存在。'
  },
  {
    rank: 186,
    title: '世界法則の編纂者',
    stageName: '宇宙のOS設計',
    description: '新たに創造する宇宙の、物理法則や魔法のルールを、ゼロから設計・構築する。'
  },
  {
    rank: 187,
    title: '運命の超越者',
    stageName: '運命からの解放',
    description: '運命という概念そのものから解き放たれ、いかなる因果にも縛られない自由な存在となる。'
  },
  {
    rank: 188,
    title: '奇跡の魔法使い',
    stageName: '確率０の実現',
    description: '絶対に起こりえない、確率０％の事象を「奇跡」として意図的に発生させる。'
  },
  {
    rank: 189,
    title: '創造の息吹',
    stageName: '生命の種',
    description: '何も存在しない死の宇宙に、最初の生命の種を蒔き、新たな生態系を創り出す。'
  },
  {
    rank: 190,
    title: '全ての答えを知る者',
    stageName: '最後の図書館',
    description: 'この宇宙だけでなく、ありとあらゆる多元宇宙の、全ての真理が収められた図書館の主となる。'
  },
  {
    rank: 191,
    title: '根源の体現者',
    stageName: '始まりの前の存在',
    description: '宇宙が生まれる前の「根源」そのものが、あなたという人格を持つ。'
  },
  {
    rank: 192,
    title: '魔法の摂理',
    stageName: '魔法のルールメーカー',
    description: '魔法という現象の、根本的なルールや法則を定義し、変更する権能を持つ。'
  },
  {
    rank: 193,
    title: '無限の魔力源',
    stageName: '無限の源泉',
    description: 'あなたの存在自体が、無限の魔力を生み出し続ける、尽きることのない源泉となる。'
  },
  {
    rank: 194,
    title: '叡智そのもの',
    stageName: '思考する宇宙',
    description: '宇宙全体が、あなたという一つの知性体の脳となる。'
  },
  {
    rank: 195,
    title: '宇宙の心',
    stageName: '宇宙の感情',
    description: '宇宙全体の喜び、悲しみ、怒りといった感情を司り、その心を体現する。'
  },
  {
    rank: 196,
    title: '根源の魔術師',
    stageName: '現実の書き換え',
    description: '魔法という手段すら使わず、ただ思うだけで、現実のありようを自在に書き換える。'
  },
  {
    rank: 197,
    title: '全魔力の創造主',
    stageName: 'エネルギーの創造',
    description: '魔力だけでなく、この宇宙に存在する全てのエネルギーを創造した、始まりの存在。'
  },
  {
    rank: 198,
    title: '全知全能',
    stageName: '作者の視点',
    description: 'この宇宙という物語を、作者の視点から眺め、自由に設定を変更し、物語を紡ぐ。'
  },
  {
    rank: 199,
    title: '万象の真理',
    stageName: '存在の理由',
    description: 'なぜ世界は存在するのか、なぜ自分は存在するのか、その最終的な答えにして、理由そのもの。'
  },
  {
    rank: 200,
    title: '魔法そのもの',
    stageName: 'アカシックの根源',
    description: '全ての魔法が生まれ、そして還る場所。形も時間も存在しない概念の海で、世界の理と一体化する。'
  }
];

/**
 * ステージ番号からランク（1-200）を取得
 */
export function getRankFromStageNumber(stageNumber: string): number {
  // ステージ番号は "1-1", "1-2" のような形式
  const rank = parseInt(stageNumber.split('-')[0], 10);
  return isNaN(rank) ? 1 : Math.min(Math.max(rank, 1), 200);
}

/**
 * ランクから対応するランク情報を取得
 */
export function getFantasyRankInfo(rank: number): FantasyRankInfo {
  // 1-200の範囲に収める
  const validRank = Math.min(Math.max(rank, 1), 200);
  return FANTASY_RANKS[validRank - 1];
}

/**
 * クリア済みステージ数から現在のランクを計算
 * 10ステージクリアごとに1ランクアップ
 */
export function getRankFromClearedStages(clearedStages: number): number {
  return Math.floor(clearedStages / 10) + 1;
}

/**
 * 数値ランクをウィザードランク文字列に変換（互換性のため）
 * 1 -> F, 2 -> F+, 3 -> E, 4 -> E+, ...
 */
export function getWizardRankString(clearedStages: number): string {
  const WIZARD_RANKS = ['F', 'F+', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+'];
  const rankIndex = Math.floor(clearedStages / 10);
  return WIZARD_RANKS[Math.min(rankIndex, WIZARD_RANKS.length - 1)];
}

/**
 * ランクの色を取得（グラデーション用）
 */
export function getRankColor(rank: number): string {
  // 200ランクを20色のグラデーションで表現
  const colorIndex = Math.floor((rank - 1) / 10) % 20;
  const colors = [
    'from-green-700 to-green-900',
    'from-blue-700 to-blue-900',
    'from-purple-700 to-purple-900',
    'from-red-700 to-red-900',
    'from-orange-700 to-orange-900',
    'from-yellow-700 to-yellow-900',
    'from-pink-700 to-pink-900',
    'from-indigo-700 to-indigo-900',
    'from-teal-700 to-teal-900',
    'from-cyan-700 to-cyan-900',
    'from-emerald-700 to-emerald-900',
    'from-lime-700 to-lime-900',
    'from-amber-700 to-amber-900',
    'from-rose-700 to-rose-900',
    'from-violet-700 to-violet-900',
    'from-fuchsia-700 to-fuchsia-900',
    'from-sky-700 to-sky-900',
    'from-slate-700 to-slate-900',
    'from-gray-700 to-gray-900',
    'from-zinc-700 to-zinc-900',
  ];
  
  return colors[colorIndex];
}