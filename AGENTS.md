# Jazz Learning Game - Agent Guidelines

## 基本運用ルール
- 日本語で回答すること
- 作業開始前に作業計画を提示し、ユーザーの承認（y/n）を得てから実行する
- 計画が失敗した場合は代替案を提示し、再度承認を得る
- 指示されたタスクを完遂するまで作業を継続する
- ユーザーの指示を最優先し、独断で方針変更を行わない

## プロジェクト概要
ジャズ音楽学習ウェブアプリケーション。ピアノ・ギターモードでのリアルタイム演奏判定ゲーム。

## 技術スタック
- React 18 + TypeScript + Vite
- Tailwind CSS + CSS Modules
- Zustand + Immer
- PIXI.js
- Tone.js
- Rust + WebAssembly (PYIN)
- Netlify
- MIDI / Audio (PYIN)

## 開発者プロファイル
経験豊富なフロントエンド開発者として以下に精通している：
- React 18, TypeScript, Vite
- Zustand状態管理, Immer
- Tailwind CSS, CSS Modules
- PIXI.js, Tone.js, Web Audio API
- WebAssembly統合
- リアルタイム音響処理
- ゲーム開発パターン

## アーキテクチャ原則
### プラットフォーム抽象化
- `src/platform/index.ts`経由でブラウザAPIを操作する
- `window.`オブジェクトを直接参照しない
- DOM操作は最小限に抑える

### 型安全性
- 全てTypeScriptで記述する
- `any`型を使用しない
- 型定義は`src/types/index.ts`に集約する

### 状態管理
- Zustandストア（`src/stores/gameStore.ts`）で状態を管理する
- Immerミドルウェアを使用し`enableMapSet()`を有効化する
- 不変性を維持する

### パフォーマンス最優先
- PIXI.jsでノーツ描画を最適化する
- `requestAnimationFrame`を活用する
- メモリリークを防止する
- 60fps維持、<20msレイテンシを守る
- `unifiedFrameController`を使用し、競合するループを避ける

## ファイル構成規則
```
src/
├── components/          # React コンポーネント
│   ├── game/            # ゲーム関連UI
│   └── ui/              # 共通UIコンポーネント
├── stores/              # Zustand ストア
├── types/               # TypeScript 型定義
├── platform/            # プラットフォーム抽象化
├── utils/               # ユーティリティ関数
└── data/                # 楽曲・設定データ
```

## コーディング規約
### React コンポーネント
```typescript
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

### イベントハンドラー命名
- `handleClick`, `handleKeyDown`, `handleMidiInput`など`handle`接頭辞を使用する
- 音楽関連処理は`handleNoteOn`, `handleNoteOff`, `handlePitchDetected`を使用する

### スタイリング
- Tailwind CSSを優先する
- CSS Modulesは複雑なアニメーション時のみ使用する
- レスポンシブデザインを意識し、`sm:`, `md:`, `lg:`を活用する
- Reactでは`class:`ではなく三項演算子を使用する

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
### 楽曲データ形式
```typescript
interface Note {
  time: number;    // 秒単位
  pitch: number;   // MIDI番号
}
```

### 判定システム
- good判定: ±300ms
- 1000点満点制
- エフェクト表示必須

### リアルタイム処理
- MIDI入力: <10ms応答
- WASMピッチ検出: <20ms
- 音響処理優先度を最上位に保つ

### メモリ管理
```typescript
useEffect(() => {
  return () => {
    texture.destroy();
    sprite.destroy();
  };
}, []);

useEffect(() => {
  return () => {
    audioContext.close();
  };
}, []);
```

## 実装ガイドライン
### 必須事項
- 早期`return`で可読性向上
- Tailwindクラスのみでスタイリング（独自CSS禁止）
- 説明的な変数・関数名を用いる
- `const`宣言を優先する（例: `const toggle = () => {}`）
- 必要な型定義をすべて実装する
- TODOやプレースホルダーを残さない
- 必要な`import`をすべて含める
- アクセシビリティ対応を実装する

### パフォーマンス
- 通常時は可読性を優先する
- リアルタイム処理ではパフォーマンスを最優先する
- メモリリークを防ぐ
- `requestAnimationFrame`を適切に使用する

### 禁止事項
- `console.log`などのデバッグ出力を本番コードに残さない
- 直接的なDOM操作を行わない
- グローバル変数を使用しない
- エラーハンドリングを省略しない
- 型安全性を犠牲にしない
- `window.`オブジェクトを直接参照しない
- 複数のアニメーションループを作成しない（60fpsを阻害するため）

## 音楽・ゲーム特有の考慮事項
### 音響処理
```typescript
const handleAudioProcessing = useCallback((audioBuffer: AudioBuffer) => {
  const context = platform.getAudioContext();
  // 処理実装
}, []);
```

### MIDI処理
```typescript
const handleMidiMessage = useCallback((message: MIDIMessageEvent) => {
  const [status, note, velocity] = message.data;
  if (status === 144) {
    handleNoteOn(note, velocity);
  }
}, [handleNoteOn]);
```

### PIXI.js統合
```typescript
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
- ブラウザコンソールでストアを確認する場合は`window.gameStore`
- Redux DevToolsに対応する
- エラーバウンダリを実装する
- パフォーマンスを常時監視する

## 回答スタイル
- ユーザー要件に正確に従う
- ステップバイステップで計画を説明し、承認後に実装する
- ベストプラクティスとDRY原則を順守する
- バグのない完全な実装を目指す
- 説明は簡潔かつ必要最小限に留める
- 不明な場合は憶測せず正直に報告する