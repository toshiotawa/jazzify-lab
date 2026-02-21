/**
 * コードテンプレートシステム
 * 音楽理論的に正しい移調のためのインターバルベースのコード定義
 */

export type ChordQuality = 
  | 'single' // 単音（Very Easy用）
  | 'maj' | 'min' | 'aug' | 'dim'
  | '7' | 'maj7' | 'm7' | 'mM7' | 'dim7' | 'aug7' | 'm7b5'
  | '6' | 'm6' | '9' | 'm9' | 'maj9' | '11' | 'm11' | '13' | 'm13'
  | 'sus2' | 'sus4' | '7sus4' | 'add9' | 'madd9'
  // ジャズボイシング（ルートレス含む）
  | 'maj7_9'      // M7(9): 3 5 7 9
  | 'm7_9'        // m7(9): b3 5 b7 9
  | '7_9_13'      // 7(9.13): 3 b7 9 13
  | '7_b9_b13'    // 7(b9.b13): 3 b7 b9 b13
  | '6_9'         // 6(9): 3 5 6 9
  | 'm6_9'        // m6(9): b3 5 6 9
  | '7_b9_13'     // 7(b9.13): 3 b7 b9 13
  | '7_s9_b13'    // 7(#9.b13): 3 b7 #9 b13
  | 'm7b5_11'     // m7(b5)(11): R 4 b5 b9
  | 'dimM7';      // dim(M7): R b3 b5 7

/**
 * 使用可能なルート音のリスト
 * 17音（黒鍵白鍵）+ 理論的な異名同音
 */
export const VALID_ROOTS = [
  // 基本の白鍵
  'C', 'D', 'E', 'F', 'G', 'A', 'B',
  // シャープ系
  'C#', 'D#', 'F#', 'G#', 'A#',
  // フラット系
  'Db', 'Eb', 'Gb', 'Ab', 'Bb',
  // 理論的な異名同音
  'Cb', 'B#', 'Fb', 'E#',
  // ダブルシャープ・ダブルフラット（必要に応じて）
  'Cx', 'Dx', 'Ex', 'Fx', 'Gx', 'Ax', 'Bx',
  'Cbb', 'Dbb', 'Ebb', 'Fbb', 'Gbb', 'Abb', 'Bbb'
];

/**
 * Cルートのコードテンプレート
 * 各コードクオリティをインターバル配列で定義
 * 実音は transpose() で都度生成する
 */
export const CHORD_TEMPLATES: Record<ChordQuality, string[]> = {
  // 単音（Very Easy用）
  'single': ['1P'],
  
  // トライアド
  'maj':    ['1P', '3M', '5P'],
  'min':    ['1P', '3m', '5P'],
  'aug':    ['1P', '3M', '5A'],
  'dim':    ['1P', '3m', '5d'],
  
  // セブンス
  '7':      ['1P', '3M', '5P', '7m'],  // ドミナント7th
  'maj7':   ['1P', '3M', '5P', '7M'],
  'm7':     ['1P', '3m', '5P', '7m'],
  'mM7':    ['1P', '3m', '5P', '7M'],
  'dim7':   ['1P', '3m', '5d', '6M'],  // bb7 = 6M
  'aug7':   ['1P', '3M', '5A', '7m'],
  'm7b5':   ['1P', '3m', '5d', '7m'],  // ハーフディミニッシュ
  
  // シックスス
  '6':      ['1P', '3M', '5P', '6M'],
  'm6':     ['1P', '3m', '5P', '6M'],
  
  // ナインス
  '9':      ['1P', '3M', '5P', '7m', '9M'],
  'm9':     ['1P', '3m', '5P', '7m', '9M'],
  'maj9':   ['1P', '3M', '5P', '7M', '9M'],
  
  // エレブンス・サーティーンス
  '11':     ['1P', '3M', '5P', '7m', '9M', '11P'],
  'm11':    ['1P', '3m', '5P', '7m', '9M', '11P'],
  '13':     ['1P', '3M', '5P', '7m', '9M', '11P', '13M'],
  'm13':    ['1P', '3m', '5P', '7m', '9M', '11P', '13M'],
  
  // サスペンド・アド
  'sus2':   ['1P', '2M', '5P'],
  'sus4':   ['1P', '4P', '5P'],
  '7sus4':  ['1P', '4P', '5P', '7m'],
  'add9':   ['1P', '3M', '5P', '9M'],
  'madd9':  ['1P', '3m', '5P', '9M'],

  // ジャズボイシング（ルートレス含む）
  'maj7_9':   ['3M', '5P', '7M', '9M'],       // M7(9): 3 5 7 9
  'm7_9':     ['3m', '5P', '7m', '9M'],       // m7(9): b3 5 b7 9
  '7_9_13':   ['3M', '7m', '9M', '6M'],       // 7(9.13): 3 b7 9 6
  '7_b9_b13': ['3M', '7m', '9m', '6m'],       // 7(b9.b13): 3 b7 b9 b6
  '6_9':      ['3M', '5P', '6M', '9M'],       // 6(9): 3 5 6 9
  'm6_9':     ['3m', '5P', '6M', '9M'],       // m6(9): b3 5 6 9
  '7_b9_13':  ['3M', '7m', '9m', '6M'],       // 7(b9.13): 3 b7 b9 6
  '7_s9_b13': ['3M', '7m', '9A', '6m'],       // 7(#9.b13): 3 b7 #9 b6
  'm7b5_11':  ['1P', '4P', '5d', '7m'],       // m7(b5)(11): R 4 b5 b7
  'dimM7':    ['1P', '3m', '5d', '7M'],       // dim(M7): R b3 b5 7
};

/**
 * 度数（インターバル）定義
 * ユーザー向けの表記名 → tonal.js のインターバル記法へのマッピング
 */
export const INTERVAL_DEFINITIONS: {
  name: string;        // ユーザー向け表記 (例: "m2", "M3")
  tonalInterval: string; // tonal.js の書式 (例: "2m", "3M")
  semitones: number;     // 半音数
  label: string;         // 日本語ラベル
}[] = [
  { name: 'm2',   tonalInterval: '2m',  semitones: 1,  label: '短2度 (m2)' },
  { name: 'M2',   tonalInterval: '2M',  semitones: 2,  label: '長2度 (M2)' },
  { name: 'm3',   tonalInterval: '3m',  semitones: 3,  label: '短3度 (m3)' },
  { name: 'M3',   tonalInterval: '3M',  semitones: 4,  label: '長3度 (M3)' },
  { name: 'P4',   tonalInterval: '4P',  semitones: 5,  label: '完全4度 (P4)' },
  { name: 'aug4', tonalInterval: '4A',  semitones: 6,  label: '増4度 (aug4)' },
  { name: 'dim5', tonalInterval: '5d',  semitones: 6,  label: '減5度 (dim5)' },
  { name: 'P5',   tonalInterval: '5P',  semitones: 7,  label: '完全5度 (P5)' },
  { name: 'aug5', tonalInterval: '5A',  semitones: 8,  label: '増5度 (aug5)' },
  { name: 'm6',   tonalInterval: '6m',  semitones: 8,  label: '短6度 (m6)' },
  { name: 'M6',   tonalInterval: '6M',  semitones: 9,  label: '長6度 (M6)' },
  { name: 'm7',   tonalInterval: '7m',  semitones: 10, label: '短7度 (m7)' },
  { name: 'M7',   tonalInterval: '7M',  semitones: 11, label: '長7度 (M7)' },
];

/**
 * インターバル名 → tonal.js フォーマットのマッピング
 */
export const INTERVAL_NAME_TO_TONAL: Record<string, string> = Object.fromEntries(
  INTERVAL_DEFINITIONS.map(d => [d.name, d.tonalInterval])
);

/**
 * スケールタイプ定義
 * 各スケールのインターバルパターンを定義（Cルート基準）
 */
export type ScaleType = 
  | 'major'                    // メジャースケール
  | 'natural_minor'            // ナチュラルマイナースケール
  | 'harmonic_minor'           // ハーモニックマイナースケール
  | 'melodic_minor'            // メロディックマイナースケール
  | 'hmp5_below'               // HMP5 Below
  | 'ionian'                   // イオニアン
  | 'dorian'                   // ドリアン
  | 'phrygian'                 // フリジアン
  | 'lydian'                   // リディアン
  | 'mixolydian'               // ミクソリディアン
  | 'aeolian'                  // エオリアン
  | 'locrian'                  // ロクリアン
  | 'altered'                  // オルタード
  | 'half_whole_diminished'    // Half Whole Diminished
  | 'whole_half_diminished'    // Whole Half Diminished
  | 'lydian_dominant'          // リディアン7th (Lydian Dominant)
  | 'mixolydian_b6'            // ミクソリディアン♭6th
  | 'major_pentatonic'         // メジャーペンタトニック
  | 'minor_pentatonic';        // マイナーペンタトニック

/**
 * スケールテンプレート
 * 各スケールのインターバルパターンを定義（1オクターブ内の度数）
 */
export const SCALE_TEMPLATES: Record<ScaleType, string[]> = {
  // メジャースケール（イオニアンと同じ）
  'major': ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
  'ionian': ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
  
  // ナチュラルマイナースケール（エオリアンと同じ）
  'natural_minor': ['1P', '2M', '3m', '4P', '5P', '6m', '7m'],
  'aeolian': ['1P', '2M', '3m', '4P', '5P', '6m', '7m'],
  
  // ハーモニックマイナースケール
  'harmonic_minor': ['1P', '2M', '3m', '4P', '5P', '6m', '7M'],
  
  // メロディックマイナースケール（上行）
  'melodic_minor': ['1P', '2M', '3m', '4P', '5P', '6M', '7M'],
  
  // HMP5 Below（ハーモニックマイナーパーフェクト5th Below）
  'hmp5_below': ['1P', '2m', '3m', '4P', '5d', '6m', '7m'],
  
  // ドリアン
  'dorian': ['1P', '2M', '3m', '4P', '5P', '6M', '7m'],
  
  // フリジアン
  'phrygian': ['1P', '2m', '3m', '4P', '5P', '6m', '7m'],
  
  // リディアン
  'lydian': ['1P', '2M', '3M', '4A', '5P', '6M', '7M'],
  
  // ミクソリディアン
  'mixolydian': ['1P', '2M', '3M', '4P', '5P', '6M', '7m'],
  
  // ロクリアン
  'locrian': ['1P', '2m', '3m', '4P', '5d', '6m', '7m'],
  
  // オルタードスケール
  'altered': ['1P', '2m', '3m', '3M', '5d', '6m', '7m'],
  
  // Half Whole Diminished
  'half_whole_diminished': ['1P', '2m', '3m', '3M', '4A', '5P', '6m', '7M'],
  
  // Whole Half Diminished
  'whole_half_diminished': ['1P', '2M', '3m', '4P', '5d', '6m', '6M', '7M'],
  
  // リディアン7th（リディアンドミナント）
  'lydian_dominant': ['1P', '2M', '3M', '4A', '5P', '6M', '7m'],
  
  // ミクソリディアン♭6th
  'mixolydian_b6': ['1P', '2M', '3M', '4P', '5P', '6m', '7m'],
  
  // メジャーペンタトニック
  'major_pentatonic': ['1P', '2M', '3M', '5P', '6M'],
  
  // マイナーペンタトニック
  'minor_pentatonic': ['1P', '3m', '4P', '5P', '7m']
};

/**
 * スケール名のエイリアス（日本語名や別名に対応）
 */
export const SCALE_ALIASES: Record<string, ScaleType> = {
  // メジャースケール
  'major': 'major',
  'メジャースケール': 'major',
  'major_scale': 'major',
  'maj': 'major',
  'M': 'major',
  
  // ナチュラルマイナースケール
  'natural_minor': 'natural_minor',
  'ナチュラルマイナースケール': 'natural_minor',
  'natural_minor_scale': 'natural_minor',
  'minor': 'natural_minor',
  'min': 'natural_minor',
  
  // ハーモニックマイナースケール
  'harmonic_minor': 'harmonic_minor',
  'ハーモニックマイナースケール': 'harmonic_minor',
  'harmonic_minor_scale': 'harmonic_minor',
  
  // メロディックマイナースケール
  'melodic_minor': 'melodic_minor',
  'メロディックマイナースケール': 'melodic_minor',
  'melodic_minor_scale': 'melodic_minor',
  
  // HMP5 Below
  'hmp5_below': 'hmp5_below',
  'HMP5 Below': 'hmp5_below',
  'hmp5below': 'hmp5_below',
  
  // イオニアン
  'ionian': 'ionian',
  'イオニアン': 'ionian',
  
  // ドリアン
  'dorian': 'dorian',
  'ドリアン': 'dorian',
  
  // フリジアン
  'phrygian': 'phrygian',
  'フリジアン': 'phrygian',
  
  // リディアン
  'lydian': 'lydian',
  'リディアン': 'lydian',
  
  // ミクソリディアン
  'mixolydian': 'mixolydian',
  'ミクソリディアン': 'mixolydian',
  
  // エオリアン
  'aeolian': 'aeolian',
  'エオリアン': 'aeolian',
  
  // ロクリアン
  'locrian': 'locrian',
  'ロクリアン': 'locrian',
  
  // オルタード
  'altered': 'altered',
  'オルタード': 'altered',
  
  // Half Whole Diminished
  'half_whole_diminished': 'half_whole_diminished',
  'Half Whole Diminished': 'half_whole_diminished',
  'halfwhole': 'half_whole_diminished',
  'hw_diminished': 'half_whole_diminished',
  
  // Whole Half Diminished
  'whole_half_diminished': 'whole_half_diminished',
  'Whole Half Diminished': 'whole_half_diminished',
  'wholehalf': 'whole_half_diminished',
  'wh_diminished': 'whole_half_diminished',
  
  // リディアン7th
  'lydian_dominant': 'lydian_dominant',
  'リディアン7th': 'lydian_dominant',
  'lydian7th': 'lydian_dominant',
  'lydian_7th': 'lydian_dominant',
  
  // ミクソリディアン♭6th
  'mixolydian_b6': 'mixolydian_b6',
  'ミクソリディアン♭6th': 'mixolydian_b6',
  'mixolydian_b6th': 'mixolydian_b6',
  'mixolydian_flat6': 'mixolydian_b6',
  
  // メジャーペンタトニック
  'major_pentatonic': 'major_pentatonic',
  'メジャーペンタトニック': 'major_pentatonic',
  'major_pent': 'major_pentatonic',
  
  // マイナーペンタトニック
  'minor_pentatonic': 'minor_pentatonic',
  'マイナーペンタトニック': 'minor_pentatonic',
  'minor_pent': 'minor_pentatonic'
};

/**
 * コード表記のエイリアス（よく使われる別名）
 */
export const CHORD_ALIASES: Record<string, ChordQuality> = {
  '': 'maj',
  'M': 'maj',
  'm': 'min',
  'M7': 'maj7',
  'Δ7': 'maj7',
  'maj7': 'maj7',
  '-7': 'm7',
  'min7': 'm7',
  'ø': 'm7b5',
  'ø7': 'm7b5',
  'o': 'dim',
  'o7': 'dim7',
  '+': 'aug',
  '+7': 'aug7'
};

/**
 * 全17ルート音（白鍵7 + シャープ5 + フラット5）
 */
export const ALL_17_ROOTS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
] as const;

/**
 * 全ルート × 指定クオリティのコードマップエントリを生成
 */
function generateChordEntries(
  suffix: string,
  quality: ChordQuality,
  roots: readonly string[] = ALL_17_ROOTS,
): Record<string, { root: string; quality: ChordQuality }> {
  const entries: Record<string, { root: string; quality: ChordQuality }> = {};
  for (const root of roots) {
    const key = suffix === '_note' ? `${root}_note` : `${root}${suffix}`;
    entries[key] = { root, quality };
  }
  return entries;
}

/**
 * ファンタジーモード用コードマッピング
 * 全17ルート × 各クオリティを自動生成
 */
export const FANTASY_CHORD_MAP: Record<string, { root: string; quality: ChordQuality }> = {
  // 単音（Very Easy用）- 全17音
  ...generateChordEntries('_note', 'single'),

  // トライアド
  ...generateChordEntries('', 'maj'),
  ...generateChordEntries('m', 'min'),

  // 4和音（Normal用）
  ...generateChordEntries('M7', 'maj7'),
  ...generateChordEntries('m7', 'm7'),
  ...generateChordEntries('7', '7'),
  ...generateChordEntries('m7b5', 'm7b5'),
  ...generateChordEntries('mM7', 'mM7'),
  ...generateChordEntries('dim7', 'dim7'),
  ...generateChordEntries('aug7', 'aug7'),
  ...generateChordEntries('6', '6'),
  ...generateChordEntries('m6', 'm6'),

  // ナインス・テンション（既存互換）
  ...generateChordEntries('9', '9'),
  ...generateChordEntries('m9', 'm9'),
  ...generateChordEntries('maj9', 'maj9'),
  ...generateChordEntries('11', '11'),
  ...generateChordEntries('13', '13'),

  // ジャズボイシング（Hard / Extreme用）
  ...generateChordEntries('M7(9)', 'maj7_9'),
  ...generateChordEntries('m7(9)', 'm7_9'),
  ...generateChordEntries('7(9.13)', '7_9_13'),
  ...generateChordEntries('7(b9.b13)', '7_b9_b13'),
  ...generateChordEntries('6(9)', '6_9'),
  ...generateChordEntries('m6(9)', 'm6_9'),
  ...generateChordEntries('7(b9.13)', '7_b9_13'),
  ...generateChordEntries('7(#9.b13)', '7_s9_b13'),
  ...generateChordEntries('m7(b5)(11)', 'm7b5_11'),
  ...generateChordEntries('dim(M7)', 'dimM7'),
};