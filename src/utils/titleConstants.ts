/**
 * 称号システムの定数定義
 * 新しい称号は10の倍数で解放される
 */

export const TITLES = [
  '音の深淵を覗きし者',           // レベル0 (デフォルト)
  '終わりなき旋律を紡ぐ者',       // レベル10
  '孤独な夜に響きし者',           // レベル20
  '魂のブルースを奏でし者',       // レベル30
  '禁じられた和音に触れし者',     // レベル40
  'アドリブの迷宮を彷徨う者',     // レベル50
  '忘れ去られし旋律の継承者',     // レベル60
  '月の光とセッションせし者',     // レベル70
  'リズムの奔流に身を委ねし者',   // レベル80
  '都会の喧騒を喰らう者',         // レベル90
  '漆黒のグルーヴを統べし者',     // レベル100
  '刹那の音に全てを懸けし者',     // レベル110
  '時間の概念を超えし者',         // レベル120
  '沈黙の意味を知る者',           // レベル130
  '星屑の譜面を読みし者',         // レベル140
  '憂鬱さえも支配せし者',         // レベル150
  'スウィングに魂を売った者',     // レベル160
  '伝説の夜を目撃せし者',         // レベル170
  '幻のコードを探す者',           // レベル180
  '夜明けのコーヒーを嗜む者',     // レベル190
  '音速の求道者',                 // レベル200
  '旋律の探求者',                 // レベル210
  '孤高の演奏家',                 // レベル220
  '即興の思想家',                 // レベル230
  '無限音階',                     // レベル240
  '絶対感覚',                     // レベル250
  '漆黒の旋律',                   // レベル260
  '月下の独奏者',                 // レベル270
  '摩天楼の吟遊詩人',             // レベル280
  '彷徨える調律師',               // レベル290
  '音色の錬金術師',               // レベル300
  '静寂の支配者',                 // レベル310
  '永遠の練習生',                 // レベル320
  'リズムの破壊神',               // レベル330
  '和音の創造主',                 // レベル340
  '伝説の目撃者',                 // レベル350
  '裏通りの賢者',                 // レベル360
  '譜面の解読者',                 // レベル370
  '終焉の序曲',                   // レベル380
  '混沌の調和',                   // レベル390
  'ブルーノートの亡霊',           // レベル400
  'スウィングの伝道師',           // レベル410
  'ビバップの革命家',             // レベル420
  'アドリブの魔術師',             // レベル430
  'グルーヴの探求者',             // レベル440
  'セッションの夜叉',             // レベル450
  'モードの開拓者',               // レベル460
  'リズムの預言者',               // レベル470
  'コードの錬金術師',             // レベル480
  'インプロの鬼神',               // レベル490
  'ジャムセッションの支配者',     // レベル500
  'フリージャズの破壊者',         // レベル510
  'クールな放浪者',               // レベル520
  'ホットな挑戦者',               // レベル530
  'マイナーコードの使徒',         // レベル540
  'テンションノートの誘惑',       // レベル550
  'ウォーキングベースの旅人',     // レベル560
  'ラストコーラスの伝説',         // レベル570
  'オルタードの奇術師',           // レベル580
  'スキャットの詠唱者',           // レベル590
  '月夜に咲く旋律',               // レベル600
  '孤独という名の音色',           // レベル610
  '摩天楼のララバイ',             // レベル620
  '真夜中の太陽',                 // レベル630
  '琥珀色のスウィング',           // レベル640
  '星屑のスタンダード',           // レベル650
  '紫煙の向こう側',               // レベル660
  '錆びついた心象',               // レベル670
  '地下室の囁き',                 // レベル680
  '雨音のブルース',               // レベル690
  '都会のノクターン',             // レベル700
  '魂のシャウト',                 // レベル710
  '刹那の火花',                   // レベル720
  '氷上のワルツ',                 // レベル730
  '迷宮のアドリブ',               // レベル740
  '銀河鉄道の夜想曲',             // レベル750
  '忘れられた子守唄',             // レベル760
  '煉瓦通りのエチュード',         // レベル770
  'グラスの中の嵐',               // レベル780
  '眠らない街の賛歌',             // レベル790
  '旋律の設計者',                 // レベル800
  'リズムセクションの司令塔',     // レベル810
  '和音の暗殺者',                 // レベル820
  'グルーヴの番人',               // レベル830
  '静寂の指揮官',                 // レベル840
  '音色の仕立屋',                 // レベル850
  '即興劇の脚本家',               // レベル860
  '譜面の考古学者',               // レベル870
  'サウンドの心臓外科医',         // レベル880
  'ブルースの伝承者',             // レベル890
  '憂鬱を纏う者',                 // レベル900
  '刹那主義のインプロバイザー',   // レベル910
  '無限への挑戦者',               // レベル920
  '感情の調律師',                 // レベル930
  '存在証明のソロ',               // レベル940
  '星降る夜のカルテット',         // レベル950
  '銀河を渡るベーシスト',         // レベル960
  '嵐を呼ぶドラマー',             // レベル970
  'オーロラのスキャット',         // レベル980
  '月影のピアニスト',             // レベル990
  '無窮の創造主',                 // レベル1000
  '世界線の移動者',               // レベル1010
  '裏拍の支配者',                 // レベル1020
  '代理和音の魔術師',             // レベル1030
  '憂鬱音階の継承者',             // レベル1040
  '高次倍音の解放者',             // レベル1050
  '半音階の旅人',                 // レベル1060
  '躍動的律動の体現者',           // レベル1070
  '複合拍子の解読者',             // レベル1080
  '音響空間の設計士',             // レベル1090
  '瞬間芸術の体現者',             // レベル1100
  '主題旋律の破壊者',             // レベル1110
  '緊張和音の愛好家',             // レベル1120
  '循環和音の輪廻',               // レベル1130
  '自由即興の使徒',               // レベル1140
  '電気音響の預言者',             // レベル1150
  '低音進行の先導者',             // レベル1160
  '打楽奏法の探求者',             // レベル1170
  '音列の再構築者',               // レベル1180
  '最終終止の超越者',             // レベル1190
  '静かなる情熱',                 // レベル1200
  '秩序ある混沌',                 // レベル1210
  '聖なる背徳',                   // レベル1220
  '饒舌な沈黙',                   // レベル1230
  '孤独な共演者',                 // レベル1240
  '束縛された自由',               // レベル1250
  '冷徹な熱狂',                   // レベル1260
  '現実的な幻想',                 // レベル1270
  '調和した不協和音',             // レベル1280
  '過去から来た未来人',           // レベル1290
  '癒やしのブルース',             // レベル1300
  '絶望の中の希望',               // レベル1310
  '歓喜のレクイエム',             // レベル1320
  '白い夜、黒い太陽',             // レベル1330
  '甘美なる毒',                   // レベル1340
  '立ち止まる進行',               // レベル1350
  '無音の叫び',                   // レベル1360
  '予定調和の破壊者',             // レベル1370
  '優しい悪魔',                   // レベル1380
  '賢明なる異端者',               // レベル1390
  '音霊使い',                     // レベル1400
  '和声の魔導書',                 // レベル1410
  '旋律召喚士',                   // レベル1420
  '時空を歪めるビート',           // レベル1430
  '禁断の第十三和音',             // レベル1440
  '霊魂を揺さぶる者',             // レベル1450
  '絶対音感の呪縛',               // レベル1460
  'グルーヴの錬成陣',             // レベル1470
  '異世界の扉を開く鍵盤',         // レベル1480
  '音の結界を張る者',             // レベル1490
  '闇を払うトランペット',         // レベル1500
  '精霊と踊るサックス',           // レベル1510
  '大地を鳴動させる低音',         // レベル1520
  '雷鳴を呼ぶドラムソロ',         // レベル1530
  '記憶を操作する旋律',           // レベル1540
  '譜面の暗号術師',               // レベル1550
  '残響の支配者',                 // レベル1560
  '音速の拳（高速フレーズ）',     // レベル1570
  'コードの黒魔術',               // レベル1580
  'ビブラートの波動使い',         // レベル1590
  'バードの再来',                 // レベル1600
  '52番街の亡霊',                 // レベル1610
  'ニューオリンズの語り部',       // レベル1620
  'ミントンズの亡命者',           // レベル1630
  'ヴィレッジの守護者',           // レベル1640
  '帝王の影を追う者',             // レベル1650
  '聖者の行進を止めし者',         // レベル1660
  'コットンクラブの招待客',       // レベル1670
  '失われた名盤の探索者',         // レベル1680
  '革命前夜の証人',               // レベル1690
  '群青のビート',                 // レベル1700
  '緋色のアルペジオ',             // レベル1710
  '棘のある音色',                 // レベル1720
  '琥珀色の残響',                 // レベル1730
  '漆黒のグルーヴ',               // レベル1740
  '銀色のサックス奏者',           // レベル1750
  'セピア色の追憶',               // レベル1760
  '極彩色の不協和音',             // レベル1770
  '透明なリズム',                 // レベル1780
  '灼熱のシャウト',               // レベル1790
  '神に見捨てられた旋律',         // レベル1800
  '終末を告げるシンバル',         // レベル1810
  '煉獄のピアニスト',             // レベル1820
  '虚無と踊る者',                 // レベル1830
  '因果律を超えたセッション',     // レベル1840
  '堕天使のセレナーデ',           // レベル1850
  '音の絶対君主',                 // レベル1860
  '裏切りのコード進行',           // レベル1870
  '隻眼のバンドマスター',         // レベル1880
  '刻印されしリズム',             // レベル1890
  '闇夜の烏',                     // レベル1900
  '血塗られたリード',             // レベル1910
  '忘却の彼方のスタンダード',     // レベル1920
  'エデンの追放者',               // レベル1930
  '第七感の覚醒者',               // レベル1940
  '運命の調律師',                 // レベル1950
  '音に選ばれし者',               // レベル1960
  '零度の情熱',                   // レベル1970
  '異端審問官',                   // レベル1980
  '最後の即興詩人',               // レベル1990
] as const;

export type MissionTitle = typeof MISSION_TITLES[number]['name'];
export type LessonTitle = typeof LESSON_TITLES[number]['name'];
export type AchievementTitle = MissionTitle | LessonTitle;
export type Title = typeof TITLES[number] | MissionTitle | LessonTitle;

/**
 * ミッションクリア称号の定義（1+10n個完了ごとに獲得）
 */
export const MISSION_TITLES = [
  { name: '記録者', threshold: 1 },
  { name: '呼吸', threshold: 11 },
  { name: '観測者', threshold: 21 },
  { name: '探求', threshold: 31 },
  { name: '求道', threshold: 41 },
  { name: '職人', threshold: 51 },
  { name: '吟遊詩', threshold: 61 },
  { name: '黎明', threshold: 71 },
  { name: '黄昏', threshold: 81 },
  { name: '追憶', threshold: 91 },
  { name: '共鳴', threshold: 101 },
  { name: '波動', threshold: 111 },
  { name: '囁き', threshold: 121 },
  { name: '旋風', threshold: 131 },
  { name: '閃光', threshold: 141 },
  { name: '流星', threshold: 151 },
  { name: '黒猫', threshold: 161 },
  { name: '無頼', threshold: 171 },
  { name: '亜流', threshold: 181 },
  { name: '晴耕雨読', threshold: 191 },
  { name: '読譜能力', threshold: 201 },
  { name: '聴音能力', threshold: 211 },
  { name: '拍子感覚', threshold: 221 },
  { name: '音楽理論', threshold: 231 },
  { name: '和声進行', threshold: 241 },
  { name: '楽曲構造', threshold: 251 },
  { name: '演奏技術', threshold: 261 },
  { name: '表現技法', threshold: 271 },
  { name: '即興演奏', threshold: 281 },
  { name: '感情移入', threshold: 291 },
  { name: '精神統一', threshold: 301 },
  { name: '開拓者', threshold: 311 },
  { name: '継承者', threshold: 321 },
  { name: '指揮官', threshold: 331 },
  { name: '錬金術', threshold: 341 },
  { name: '魔術師', threshold: 351 },
  { name: '本流', threshold: 361 },
  { name: '異形', threshold: 371 },
  { name: '憂愁', threshold: 381 },
  { name: '彷徨', threshold: 391 },
  { name: '寂寥', threshold: 401 },
  { name: '咆哮', threshold: 411 },
  { name: '蜃気楼', threshold: 421 },
  { name: '銀盤', threshold: 431 },
  { name: '鉄人', threshold: 441 },
  { name: '影武者', threshold: 451 },
  { name: '預言者', threshold: 461 },
  { name: '奇才', threshold: 471 },
  { name: '天才', threshold: 481 },
  { name: '達観', threshold: 491 },
  { name: '核心', threshold: 501 },
  { name: '究極', threshold: 511 },
  { name: '臨機応変', threshold: 521 },
  { name: '付和雷同', threshold: 531 },
  { name: '傍目八目', threshold: 541 },
  { name: '自問自答', threshold: 551 },
  { name: '暗中模索', threshold: 561 },
  { name: '五里霧中', threshold: 571 },
  { name: '隔靴掻痒', threshold: 581 },
  { name: '孤軍奮闘', threshold: 591 },
  { name: '臥薪嘗胆', threshold: 601 },
  { name: '捲土重来', threshold: 611 },
  { name: '質実剛健', threshold: 621 },
  { name: '大胆不敵', threshold: 631 },
  { name: '百花繚乱', threshold: 641 },
  { name: '一刀両断', threshold: 651 },
  { name: '竜頭蛇尾', threshold: 661 },
  { name: '羊頭狗肉', threshold: 671 },
  { name: '朝令暮改', threshold: 681 },
  { name: '八方美人', threshold: 691 },
  { name: '支離滅裂', threshold: 701 },
  { name: '律動神官', threshold: 711 },
  { name: '和声怪人', threshold: 721 },
  { name: '旋律魔人', threshold: 731 },
  { name: '黒猫探偵', threshold: 741 },
  { name: '月下美人', threshold: 751 },
  { name: '摩天楼上', threshold: 761 },
  { name: '地下聖堂', threshold: 771 },
  { name: '煉瓦倉庫', threshold: 781 },
  { name: '無人劇場', threshold: 791 },
  { name: '廃墟都市', threshold: 801 },
  { name: '迷宮回廊', threshold: 811 },
  { name: '紫煙遊戯', threshold: 821 },
  { name: '珈琲哲学', threshold: 831 },
  { name: '孤独讃歌', threshold: 841 },
  { name: '憂鬱詩人', threshold: 851 },
  { name: '刹那主義', threshold: 861 },
  { name: '反骨精神', threshold: 871 },
  { name: '独立独歩', threshold: 881 },
  { name: '深謀遠慮', threshold: 891 },
  { name: '独断専行', threshold: 901 },
  { name: '傍若無人', threshold: 911 },
  { name: '最終楽章', threshold: 921 },
  { name: '演奏機械', threshold: 931 },
  { name: '音響兵器', threshold: 941 },
  { name: '未確認体', threshold: 951 },
  { name: '観測不能', threshold: 961 },
  { name: '解析不能', threshold: 971 },
  { name: '模倣不能', threshold: 981 },
  { name: '異次元論', threshold: 991 },
  { name: '精神世界', threshold: 1001 },
  { name: '意識改革', threshold: 1011 },
  { name: '感情表現', threshold: 1021 },
  { name: '衝動解放', threshold: 1031 },
  { name: '破壊衝動', threshold: 1041 },
  { name: '創造意欲', threshold: 1051 },
  { name: '探求精神', threshold: 1061 },
  { name: '自己矛盾', threshold: 1071 },
  { name: '危機一髪', threshold: 1081 },
  { name: '絶体絶命', threshold: 1091 },
  { name: '起死回生', threshold: 1101 },
  { name: '乾坤一擲', threshold: 1111 },
  { name: '妖怪変化', threshold: 1121 },
  { name: '悪鬼羅刹', threshold: 1131 },
  { name: '魑魅魍魎', threshold: 1141 },
  { name: '百鬼夜行', threshold: 1151 },
  { name: '孤城落日', threshold: 1161 },
  { name: '四面楚歌', threshold: 1171 },
  { name: '内憂外患', threshold: 1181 },
  { name: '孤影独奏', threshold: 1191 },
  { name: '月下独酌', threshold: 1201 },
  { name: '雨夜暗黒', threshold: 1211 },
  { name: '雪月風花', threshold: 1221 },
  { name: '夢幻泡影', threshold: 1231 },
  { name: '理論武装', threshold: 1241 },
  { name: '百戦錬磨', threshold: 1251 },
  { name: '千変万化', threshold: 1261 },
  { name: '疾風迅雷', threshold: 1271 },
  { name: '電光石火', threshold: 1281 },
  { name: '風林火山', threshold: 1291 },
  { name: '神出鬼没', threshold: 1301 },
  { name: '画竜点睛', threshold: 1311 },
  { name: '記憶喪失', threshold: 1321 },
  { name: '記憶改竄', threshold: 1331 },
  { name: '感情欠落', threshold: 1341 },
  { name: '論理破綻', threshold: 1351 },
  { name: '思考実験', threshold: 1361 },
  { name: '行動原理', threshold: 1371 },
  { name: '価値基準', threshold: 1381 },
  { name: '存在理由', threshold: 1391 },
  { name: '最終問答', threshold: 1401 },
  { name: '現実逃避', threshold: 1411 },
  { name: '過去回帰', threshold: 1421 },
  { name: '未来予測', threshold: 1431 },
  { name: '刹那', threshold: 1441 },
  { name: '混沌', threshold: 1451 },
  { name: '秩序', threshold: 1461 },
  { name: '破壊', threshold: 1471 },
  { name: '創造', threshold: 1481 },
  { name: '無心', threshold: 1491 },
  { name: '異端', threshold: 1501 },
  { name: '孤高', threshold: 1511 },
  { name: '新星', threshold: 1521 },
  { name: '巨星', threshold: 1531 },
  { name: '伝説', threshold: 1541 },
  { name: '修羅', threshold: 1551 },
  { name: '鬼神', threshold: 1561 },
  { name: '無形', threshold: 1571 },
  { name: '残響', threshold: 1581 },
  { name: '超絶技巧', threshold: 1591 },
  { name: '時空旅人', threshold: 1601 },
  { name: '永久機関', threshold: 1611 },
  { name: '最終兵器', threshold: 1621 },
  { name: '絶対零度', threshold: 1631 },
  { name: '臨界突破', threshold: 1641 },
  { name: '存在証明', threshold: 1651 },
  { name: '虚無思想', threshold: 1661 },
  { name: '無音空間', threshold: 1671 },
  { name: '不可侵域', threshold: 1681 },
  { name: '天衣無縫', threshold: 1691 },
  { name: '一期一会', threshold: 1701 },
  { name: '唯我独尊', threshold: 1711 },
  { name: '唯一無二', threshold: 1721 },
  { name: '古今無双', threshold: 1731 },
  { name: '空前絶後', threshold: 1741 },
  { name: '天上天下', threshold: 1751 },
  { name: '因果応報', threshold: 1761 },
  { name: '自業自得', threshold: 1771 },
  { name: '煩悩具足', threshold: 1781 },
  { name: '三千世界', threshold: 1791 },
  { name: '無限地獄', threshold: 1801 },
  { name: '諸行無常', threshold: 1811 },
  { name: '色即是空', threshold: 1821 },
  { name: '空即是色', threshold: 1831 },
  { name: '森羅万象', threshold: 1841 },
  { name: '自己表現', threshold: 1851 },
  { name: '完全燃焼', threshold: 1861 },
  { name: '輪廻', threshold: 1871 },
  { name: '虚空', threshold: 1881 },
  { name: '月読', threshold: 1891 },
  { name: '神奏', threshold: 1901 },
  { name: '夜帝', threshold: 1911 },
  { name: '音聖', threshold: 1921 },
] as const;

/**
 * レッスンクリア称号の定義（1+10n個完了ごとに獲得）
 */
export const LESSON_TITLES = [
  { name: 'かぜのゆくえ', threshold: 1 },
  { name: 'あめあがりのにおい', threshold: 11 },
  { name: 'ちいさなためいき', threshold: 21 },
  { name: 'なくしたかぎ', threshold: 31 },
  { name: 'ひとりぼっちのわるつ', threshold: 41 },
  { name: 'なみだのあじ', threshold: 51 },
  { name: 'ぼくはここにいる', threshold: 61 },
  { name: 'きみはどこにいる', threshold: 71 },
  { name: 'いつかみたそら', threshold: 81 },
  { name: 'わすれられたうた', threshold: 91 },
  { name: 'すきまかぜのこもりうた', threshold: 101 },
  { name: 'あさやけのこーひー', threshold: 111 },
  { name: 'こどうのりずむ', threshold: 121 },
  { name: 'あともうちょっと', threshold: 131 },
  { name: 'まだまださきはながい', threshold: 141 },
  { name: 'まよなかのてつがくしゃ', threshold: 151 },
  { name: 'がらすだまのうちゅう', threshold: 161 },
  { name: 'とどかないおもい', threshold: 171 },
  { name: 'じかんのかくれんぼ', threshold: 181 },
  { name: 'とけないまほう', threshold: 191 },
  { name: 'ぜんとあく', threshold: 201 },
  { name: 'はっぴーえんどがいいな', threshold: 211 },
  { name: 'ばっどえんどもわるくない', threshold: 221 },
  { name: 'むちのち', threshold: 231 },
  { name: 'たいせつなきおく', threshold: 241 },
  { name: 'かけがえのないもの', threshold: 251 },
  { name: 'てんしのうたごえ', threshold: 261 },
  { name: 'かみさまのきまぐれ', threshold: 271 },
  { name: 'うんめいのいたずら', threshold: 281 },
  { name: 'じかんがとまるまほう', threshold: 291 },
  { name: 'せかいがかわるいちびょう', threshold: 301 },
  { name: 'よるをわたるねこ', threshold: 311 },
  { name: 'つきのうらがわ', threshold: 321 },
  { name: 'ほしのささやき', threshold: 331 },
  { name: 'はなはまたさく', threshold: 341 },
  { name: 'こたえはかぜのなか', threshold: 351 },
  { name: 'じごくのそこから', threshold: 361 },
  { name: 'てんごくのかいだん', threshold: 371 },
  { name: 'つくることとこわすこと', threshold: 381 },
  { name: 'しんじることとうたがうこと', threshold: 391 },
  { name: 'とまることとすすむこと', threshold: 401 },
  { name: 'ひらくことととじること', threshold: 411 },
  { name: 'つなぐことときること', threshold: 421 },
  { name: 'みたすこととからになること', threshold: 431 },
  { name: 'はじまりとおわり', threshold: 441 },
  { name: 'であいとわかれ', threshold: 451 },
  { name: 'へいわとあらそい', threshold: 461 },
  { name: 'いかりとゆるし', threshold: 471 },
  { name: 'よろこびとかなしみ', threshold: 481 },
  { name: 'きぼうとぜつぼう', threshold: 491 },
  { name: 'あいとぞうお', threshold: 501 },
  { name: 'なみだをふいて', threshold: 511 },
  { name: 'えがおになろう', threshold: 521 },
  { name: 'おどりをどろう', threshold: 531 },
  { name: 'うたをうたおう', threshold: 541 },
  { name: 'そらをみあげて', threshold: 551 },
  { name: 'てをとりあって', threshold: 561 },
  { name: 'あしあとをのこして', threshold: 571 },
  { name: 'みちをつくって', threshold: 581 },
  { name: 'ときをきざんで', threshold: 591 },
  { name: 'れきしをかえて', threshold: 601 },
  { name: 'みらいへつなぐ', threshold: 611 },
  { name: 'いのちはつづく', threshold: 621 },
  { name: 'はかないいのち', threshold: 631 },
  { name: 'とうといじかん', threshold: 641 },
  { name: 'いっしゅんのえいえん', threshold: 651 },
  { name: 'ゆめかうつつか', threshold: 661 },
  { name: 'ぜろになる', threshold: 671 },
  { name: 'すべてがはじまる', threshold: 681 },
  { name: 'なにかがおこる', threshold: 691 },
  { name: 'せかいはうつくしい', threshold: 701 },
  { name: 'それでもいきる', threshold: 711 },
  { name: 'はじまりのおと', threshold: 721 },
  { name: 'ただそれだけのこと', threshold: 731 },
  { name: 'ひとりじゃない', threshold: 741 },
  { name: 'みんながいる', threshold: 751 },
  { name: 'きみがいれば', threshold: 761 },
  { name: 'ぼくがいるから', threshold: 771 },
  { name: 'だいじょうぶ', threshold: 781 },
  { name: 'しんぱいしないで', threshold: 791 },
  { name: 'いつでもそばに', threshold: 801 },
  { name: 'これからもずっと', threshold: 811 },
  { name: 'やくそくだよ', threshold: 821 },
  { name: 'ありがとう', threshold: 831 },
] as const;

/**
 * 魔法使い称号の定義（ファンタジーモード10ステージクリアごとに獲得）
 */
export const WIZARD_TITLES = [
  'マナの芽吹き',           // 0-9
  '魔法学徒',               // 10-19
  '神秘への憧憬',           // 20-29
  '魔法使いの卵',           // 30-39
  '魔力感知',               // 40-49
  '見習い書士',             // 50-59
  '星の囁き',               // 60-69
  'スペルキャスター',       // 70-79
  '魔力溜まり',             // 80-89
  'リサーチャー',           // 90-99
  'オラクル',               // 100-109
  'メイジ',                 // 110-119
  'マナシード',             // 120-129
  'スチューデント',         // 130-139
  'ミスティック',           // 140-149
  'ソーサラー',             // 150-159
  'エーテルライト',         // 160-169
  'セカンドクラス',         // 170-179
  'アストラル・チャイルド', // 180-189
  'ウィザード・アプレンティス', // 190-199
  '魔力循環',               // 200-209
  '魔法学者',               // 210-219
  'チャネラー',             // 220-229
  'コンジュラー',           // 230-239
  'ルーンの刻印',           // 240-249
  '上級書記官',             // 250-259
  'ディヴァイナー',         // 260-269
  'ウォーロック',           // 270-279
  'マナストーン',           // 280-289
  'プロフェッサー',         // 290-299
  '聖なる語り部',           // 300-309
  'ハイ・ウィザード',       // 310-319
  '魔力の奔流',             // 320-329
  'マスター',               // 330-339
  'アストラル・ウォーカー', // 340-349
  'マスター・ソーサラー',   // 350-359
  'エーテルフロー',         // 360-369
  'ファーストクラス',       // 370-379
  'ミスティック・マスター', // 380-389
  'アークメイジ'            // 390-399
] as const;

/**
 * ファンタジーモードクリア数から利用可能な魔法使い称号を取得
 * @param clearedStages クリア済みステージ数
 * @returns 利用可能な魔法使い称号の配列
 */
export function getAvailableWizardTitles(clearedStages: number): string[] {
  // 最初の称号は0クリアから使用可能
  const maxIndex = Math.floor(clearedStages / 10);
  return WIZARD_TITLES.slice(0, Math.min(maxIndex + 1, WIZARD_TITLES.length));
}

/**
 * レベルから利用可能な称号のインデックスを取得
 * @param level ユーザーのレベル
 * @returns 利用可能な称号のインデックス配列
 */
export const getAvailableTitleIndices = (level: number): number[] => {
  const indices: number[] = [];
  
  // レベル0から始まって、10の倍数で新しい称号が解放される
  for (let i = 0; i <= Math.floor(level / 10) && i < TITLES.length; i++) {
    indices.push(i);
  }
  
  return indices;
};

/**
 * レベルから利用可能な称号リストを取得
 * @param level ユーザーのレベル
 * @returns 利用可能な称号の配列
 */
export const getAvailableTitles = (level: number): (typeof TITLES[number])[] => {
  const indices = getAvailableTitleIndices(level);
  return indices.map(index => TITLES[index]);
};

/**
 * 称号名から称号インデックスを取得
 * @param title 称号名
 * @returns 称号のインデックス、見つからない場合は-1
 */
export const getTitleIndex = (title: typeof TITLES[number]): number => {
  return TITLES.indexOf(title);
};

/**
 * 称号インデックスから称号名を取得
 * @param index 称号インデックス
 * @returns 称号名、無効なインデックスの場合はデフォルト称号
 */
export const getTitleByIndex = (index: number): typeof TITLES[number] => {
  return TITLES[index] || TITLES[0];
};

/**
 * 称号が解放されるレベルを取得
 * @param titleIndex 称号インデックス
 * @returns 解放レベル
 */
export const getTitleUnlockLevel = (titleIndex: number): number => {
  return titleIndex * 10;
};

/**
 * ミッション完了数から利用可能なミッション称号を取得
 * @param missionCount ユーザーのミッション完了数
 * @returns 利用可能なミッション称号の配列
 */
export const getAvailableMissionTitles = (missionCount: number): MissionTitle[] => {
  return MISSION_TITLES
    .filter(title => missionCount >= title.threshold)
    .map(title => title.name);
};

/**
 * レッスン完了数から利用可能なレッスン称号を取得
 * @param lessonCount ユーザーのレッスン完了数
 * @returns 利用可能なレッスン称号の配列
 */
export const getAvailableLessonTitles = (lessonCount: number): LessonTitle[] => {
  return LESSON_TITLES
    .filter(title => lessonCount >= title.threshold)
    .map(title => title.name);
};

/**
 * 称号の取得条件テキストを生成
 * @param titleName 称号名
 * @returns 取得条件テキスト
 */
export const getTitleConditionText = (titleName: string): string => {
  const missionTitle = MISSION_TITLES.find(t => t.name === titleName);
  if (missionTitle) {
    return `ミッション${missionTitle.threshold}個完了で獲得`;
  }
  
  const lessonTitle = LESSON_TITLES.find(t => t.name === titleName);
  if (lessonTitle) {
    return `レッスン${lessonTitle.threshold}個完了で獲得`;
  }
  
  // レベル称号の条件をチェック
  const titleIndex = getTitleIndex(titleName as typeof TITLES[number]);
  if (titleIndex !== -1) {
    const unlockLevel = getTitleUnlockLevel(titleIndex);
    return `レベル${unlockLevel}で獲得`;
  }
  
  return '';
};

/**
 * 称号の取得条件テキストを生成（魔法使い称号含む）
 * @param titleName 称号名
 * @returns 取得条件テキスト
 */
export function getTitleRequirement(titleName: string): string {
  // ミッション称号の条件をチェック
  const missionTitle = MISSION_TITLES.find(t => t.name === titleName);
  if (missionTitle) {
    return `ミッション${missionTitle.threshold}個完了で獲得`;
  }
  
  // レッスン称号の条件をチェック
  const lessonTitle = LESSON_TITLES.find(t => t.name === titleName);
  if (lessonTitle) {
    return `レッスン${lessonTitle.threshold}個完了で獲得`;
  }
  
  // 魔法使い称号の条件をチェック
  const wizardIndex = WIZARD_TITLES.indexOf(titleName as any);
  if (wizardIndex !== -1) {
    const minClears = wizardIndex * 10;
    if (wizardIndex === 0) {
      return 'ファンタジーモード初期称号';
    }
    return `ファンタジーモード${minClears}ステージクリアで獲得`;
  }
  
  // レベル称号の条件をチェック
  const levelIndex = TITLES.indexOf(titleName as any);
  if (levelIndex !== -1) {
    const level = levelIndex * 10;
    if (level === 0) {
      return '初期称号';
    }
    return `レベル${level}で獲得`;
  }
  
  return '条件不明';
}

/**
 * デフォルト称号
 */
export const DEFAULT_TITLE: typeof TITLES[number] = TITLES[0]; 