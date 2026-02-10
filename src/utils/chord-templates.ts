/**
 * コードテンプレートシステム
 * 音楽理論的に正しい移調のためのインターバルベースのコード定義
 */

export type ChordQuality = 
  | 'single' // 単音（Very Easy用）
  | 'maj' | 'min' | 'aug' | 'dim'
  | '7' | 'maj7' | 'm7' | 'mM7' | 'dim7' | 'aug7' | 'm7b5'
  | '6' | 'm6' | '9' | 'm9' | 'maj9' | '11' | 'm11' | '13' | 'm13'
  | 'sus2' | 'sus4' | '7sus4' | 'add9' | 'madd9';

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
  'madd9':  ['1P', '3m', '5P', '9M']
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
 * ファンタジーモード用コードマッピング
 * 既存のコードIDとの互換性を保つ
 */
export const FANTASY_CHORD_MAP: Record<string, { root: string; quality: ChordQuality }> = {
  // 単音（Very Easy / 初心者用）- '_note' サフィックスで識別
  'C_note': { root: 'C', quality: 'single' },
  'D_note': { root: 'D', quality: 'single' },
  'E_note': { root: 'E', quality: 'single' },
  'F_note': { root: 'F', quality: 'single' },
  'G_note': { root: 'G', quality: 'single' },
  'A_note': { root: 'A', quality: 'single' },
  'B_note': { root: 'B', quality: 'single' },
  
  // メジャートライアド
  'C': { root: 'C', quality: 'maj' },
  'F': { root: 'F', quality: 'maj' },
  'G': { root: 'G', quality: 'maj' },
  
  // マイナートライアド
  'Am': { root: 'A', quality: 'min' },
  'Dm': { root: 'D', quality: 'min' },
  'Em': { root: 'E', quality: 'min' },
  
  // ドミナント7th
  'G7': { root: 'G', quality: '7' },
  'C7': { root: 'C', quality: '7' },
  'F7': { root: 'F', quality: '7' },
  'B7': { root: 'B', quality: '7' },
  'E7': { root: 'E', quality: '7' },
  'A7': { root: 'A', quality: '7' },
  'D7': { root: 'D', quality: '7' },
  
  // マイナー7th
  'Am7': { root: 'A', quality: 'm7' },
  'Dm7': { root: 'D', quality: 'm7' },
  'Em7': { root: 'E', quality: 'm7' },
  
  // メジャー7th
  'CM7': { root: 'C', quality: 'maj7' },
  'FM7': { root: 'F', quality: 'maj7' },
  'GM7': { root: 'G', quality: 'maj7' },
  
  // テンション系
  'C6': { root: 'C', quality: '6' },
  'Cm6': { root: 'C', quality: 'm6' },
  'C9': { root: 'C', quality: '9' },
  'Cm9': { root: 'C', quality: 'm9' },
  'C11': { root: 'C', quality: '11' },
  'C13': { root: 'C', quality: '13' }
};