// ファンタジーゲーム用の共通型定義

export interface ChordDefinition {
  id: string;          // コードのID（例: 'CM7', 'G7', 'Am'）
  displayName: string; // 表示名（言語・簡易化設定に応じて変更）
  notes: number[];     // MIDIノート番号の配列
  noteNames: string[]; // ★ 理論的に正しい音名配列を追加
  quality: string;     // コードの性質（'major', 'minor', 'dominant7'など）
  root: string;        // ルート音（例: 'C', 'G', 'A'）
}