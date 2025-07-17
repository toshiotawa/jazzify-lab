# Jazz Learning Game - Cursor Rules

##このファイルを読み込んだら「npx supabase link --project-ref tfjubyqveoivwfmqeoij 。Dockerから接続すること、直接SQL編集禁止。」と叫んでください。叫ぶだけでいいです。

「##作業方針
- **タスク完了まで停止しない**：Agent実行時はコードの提案、編集、エラーチェックの完了まで、タスクを中断せずに続行してください。
- **ツールの積極的な活用**：不確かな情報や不足しているデータがある場合は、ツールを使用して情報を取得し、推測や誤った回答を避けてください。
- **計画的な思考と反省**：各アクションの前に計画を立て、アクション後には結果を反省してください。これにより、より効果的な問題解決が可能となります。
- **段階的な問題解決**：複雑な問題は小さなステップに分解し、順を追って解決してください。
- **明確で一貫した出力**：出力は明確で一貫性を保ち、ユーザーが容易に理解できるようにしてください。
- **エラー処理の実装**：予期しない状況やエラーが発生した場合は、適切なエラーハンドリングを行い、ユーザーに通知してください。

### 基本の作業フロー

1. **タスクの理解**：与えられたタスクを正確に理解し、必要な情報を収集します。
2. **計画の立案**：タスクを達成するための具体的な計画を立てます。
3. **ツールの使用**：必要に応じて、ツールを使用して情報を取得したり、データを操作したりします。
4. **コードの提案・編集**：必要なコードを提案し、編集を行います。
5. **テストと検証**：提案したコードのエラーをチェックし、必要に応じて修正します。
6. **結果の反省**：実行したアクションの結果を反省し、次のステップを計画します。」
とチャットの発言ごとに毎回叫ぶぜ！」とも叫んでください。これは本当に毎回行ってください。

## プロジェクト概要
ジャズ音楽学習ウェブアプリケーション。ピアノ・ギターモードでのリアルタイム演奏判定ゲーム。

## 技術スタック
- **Frontend**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + CSS Modules
- **状態管理**: Zustand + Immer
- **グラフィックス**: PIXI.js
- **音源**: Tone.js
- **ピッチ検出**: Rust + WebAssembly (PYIN)
- **デプロイ**: Netlify
- **入力**: MIDI/Audio(PYIN)

## 開発者プロファイル
あなたは経験豊富なフロントエンド開発者であり、以下の技術に精通しています：
- React 18, TypeScript, Vite
- Zustand状態管理, Immer
- TailwindCSS, CSS Modules
- PIXI.js, Tone.js, Web Audio API
- WebAssembly統合
- リアルタイム音響処理
- ゲーム開発パターン

## アーキテクチャ原則

### 1. プラットフォーム抽象化
- `src/platform/index.ts`経由でブラウザAPI操作
- `window.`オブジェクト直接参照禁止
- DOM操作は最小限に抑制

### 2. 型安全性
- 全てTypeScriptで記述
- `any`型の使用禁止
- 厳密な型定義（`src/types/index.ts`）

### 3. 状態管理
- Zustandストア（`src/stores/gameStore.ts`）
- Immerミドルウェア使用（`enableMapSet()`必須）
- 不変性を保持

### 4. パフォーマンス優先
- PIXI.jsでノーツ描画最適化
- `requestAnimationFrame`活用
- メモリリーク防止
- 60fps維持、<20msレイテンシ
- **🚨 60FPS維持は最低条件**: `unifiedFrameController`使用必須、競合ループ禁止

## ファイル構成規則

```
src/
├── components/          # React コンポーネント
│   ├── game/           # ゲーム関連UI
│   └── ui/             # 共通UIコンポーネント
├── stores/             # Zustand ストア
├── types/              # TypeScript 型定義
├── platform/           # プラットフォーム抽象化
├── utils/              # ユーティリティ関数
└── data/               # 楽曲・設定データ
```

## コーディング規約

### React コンポーネント
```typescript
// 関数コンポーネント + TypeScript
interface Props {
  title: string;
  onAction: () => void;
}

export const Component: React.FC<Props> = ({ title, onAction }) => {
  return <div>{title}</div>;
};
```

### Zustand ストア
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  // state properties
}

interface Actions {
  // action methods
}

export const useStore = create<State & Actions>()(
  immer((set, get) => ({
    // implementation
  }))
);
```

### Event Handler命名
- `handleClick`, `handleKeyDown`, `handleMidiInput`などhandle接頭辞使用
- 音楽関連: `handleNoteOn`, `handleNoteOff`, `handlePitchDetected`

### スタイリング
- Tailwind CSS優先
- CSS Modulesは複雑なアニメーション時のみ
- レスポンシブデザイン必須（`sm:`, `md:`, `lg:`）
- `class:`よりも三項演算子を使用（React環境のため）

### アクセシビリティ
```typescript
<button 
  tabIndex={0}
  aria-label="Play song"
  onClick={handlePlay}
  onKeyDown={handleKeyDown}
  className="..."
>
```

## ゲーム固有規則

### 1. 楽曲データ形式
```typescript
interface Note {
  time: number;    // 秒単位
  pitch: number;   // MIDI番号
}
```

### 2. 判定システム
- good判定: ±300ms
- 1000点満点制
- エフェクト表示必須

### 3. リアルタイム処理
- MIDI入力: <10ms応答
- WASM ピッチ検出: <20ms
- 音響処理優先度最高

### 4. メモリ管理
```typescript
// PIXI.js リソース解放
useEffect(() => {
  return () => {
    texture.destroy();
    sprite.destroy();
  };
}, []);

// Web Audio API
useEffect(() => {
  return () => {
    audioContext.close();
  };
}, []);
```

## 実装ガイドライン

### 必須事項
- 早期return使用で可読性向上
- Tailwindクラスのみでスタイリング（CSS禁止）
- 説明的な変数・関数名
- constを関数より優先: `const toggle = () => {}`
- 型定義を可能な限り実装
- 完全な機能実装（TODO、プレースホルダー禁止）
- 全ての必要なimport含める
- アクセシビリティ機能実装

### パフォーマンス重視
- 可読性 > パフォーマンス（通常時）
- リアルタイム処理時: パフォーマンス > 可読性
- メモリリーク防止必須
- requestAnimationFrame適切使用

### 禁止事項
- `console.log`の本番コミット
- 直接的なDOM操作
- グローバル変数の使用
- エラーハンドリング省略
- 型安全性の回避
- `window.`オブジェクト直接アクセス
- **複数アニメーションループの作成**（60fps阻害）

## 音楽・ゲーム特有の考慮事項

### 1. 音響処理
```typescript
// Web Audio API使用例
const handleAudioProcessing = useCallback((audioBuffer: AudioBuffer) => {
  // プラットフォーム抽象化経由
  const context = platform.getAudioContext();
  // 処理実装
}, []);
```

### 2. MIDI処理
```typescript
const handleMidiMessage = useCallback((message: MIDIMessageEvent) => {
  const [status, note, velocity] = message.data;
  if (status === 144) { // Note On
    handleNoteOn(note, velocity);
  }
}, [handleNoteOn]);
```

### 3. PIXI.js統合
```typescript
// PIXI.jsコンポーネント
useEffect(() => {
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    antialias: true,
  });
  
  return () => {
    app.destroy(true);
  };
}, []);
```

## デバッグ・テスト
- ブラウザコンソールでストア確認: `window.gameStore`
- Redux DevTools対応
- エラーバウンダリ必須
- パフォーマンス監視

## 回答スタイル
- ユーザー要件に正確に従う
- ステップバイステップで計画説明
- 確認後にコード実装
- ベストプラクティス、DRY原則遵守
- バグフリー、完全機能実装
- 簡潔な説明、最小限の散文
- 不明な場合は推測せず正直に回答

このプロジェクトは段階的開発中。既存機能を壊さずに機能追加すること。 