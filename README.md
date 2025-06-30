# Jazz Learning Game

> 新世代のジャズ音楽学習ゲーム 🎵

[![Tech Stack](https://img.shields.io/badge/Tech-React%20%2B%20TypeScript%20%2B%20Zustand-blue)](#)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-green)](#)
[![Status](https://img.shields.io/badge/Status-Phase%201%20Complete-success)](#)

## 📋 プロジェクト概要

Jazz Learning Gameは、ピアノとギターの両方に対応したインタラクティブな音楽学習ゲームです。MIDI入力やオーディオ入力による演奏判定、リアルタイムな譜面表示、段階的な練習モードを提供します。

### ✨ 主要機能

- 🎹 **ピアノモード**: ノーツ降下システムでリアルタイム演奏
- 🎸 **ギターモード**: フレットボード表示による演奏練習
- 🎵 **練習モード**: ABリピート、シーク機能、速度調整
- 🏆 **本番モード**: スコアリング、ランク判定
- 📱 **レスポンシブ対応**: PC、タブレット、スマートフォン
- ⚙️ **高度な設定**: 音量調整、ノーツスピード、移調機能

## 🎯 現在の開発状況

### ✅ Phase 1: 基盤整備 (完了)

- [x] プロジェクト構成とビルド環境
- [x] TypeScript + React + Zustand + Tailwind CSS
- [x] プラットフォーム抽象化レイヤー
- [x] ゲーム状態管理ストア (Zustand)
- [x] 基本UI構造とデザインシステム
- [x] Netlifyデプロイ設定

### ✅ Phase 2: ゲームエンジン (完了)

- [x] ノーツ管理システム
- [x] 採点・判定システム
- [x] 音楽同期システム
- [x] ABリピート機能

**Phase 2の主要実装：**
- 🎯 **GameEngine クラス**: 統合ゲームエンジン
- 🎵 **ノーツ管理**: リアルタイムノーツ状態管理（表示→判定→クリーンアップ）
- 🎯 **採点システム**: Perfect/Good/Miss判定、コンボ・スコア計算
- 🎧 **音楽同期**: Web Audio APIによる正確なタイミング制御
- 🔄 **ABリピート**: 練習モード用区間リピート機能
- ⌨️ **キーボード入力**: テスト用キーボード演奏（Z,S,X,D,C,V,G,B,H,N,J,M）
- 🎹 **ピアノUI**: 簡易ピアノキーボード表示
- 📊 **リアルタイム表示**: スコア、コンボ、正確性、ランク表示

### ✅ Phase 3: PIXI.js統合 (完了)

- [x] PIXI.js レンダリングシステム
- [x] 高性能ノーツ降下アニメーション
- [x] パーティクルエフェクト
- [x] 60fps最適化

**Phase 3の主要実装：**
- 🎮 **PIXINotesRenderer**: 高性能ノーツレンダリングクラス
- 🎯 **ノーツ降下**: 60fps滑らかなアニメーション、ピアノ通過演出
- ✨ **エフェクト**: Hit/Miss時のパーティクル効果、グロー効果
- 🎨 **デザイン**: 角丸ノーツ、カラーコード判定、美しい描画
- 🎹 **統合ピアノ**: PIXI.js内88鍵ピアノキーボード描画
- 🎯 **判定ライン**: ピアノ上端での正確なタイミング判定
- 📱 **レスポンシブ**: 動的リサイズ対応
- 🖱️ **透明オーバーレイ**: HTMLインタラクション + PIXI.js描画統合
- 🧠 **メモリ最適化**: ノーツライフサイクル管理、リソース解放
- 📊 **デバッグ表示**: リアルタイム統計情報
- 🔧 **コード分離**: PIXI.js専用チャンク（468KB）

### 📋 Phase 3-5: 予定

- PIXI.js統合（ノーツ降下、エフェクト）
- 既存システム統合（AudioController、MidiController等）
- VexFlow譜面表示システム

## 🚀 セットアップ

### 必要環境

- Node.js 18.0.0 以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### Netlifyデプロイ

1. このリポジトリをGitHubにプッシュ
2. Netlifyで新しいサイトを作成
3. GitHubリポジトリと連携
4. ビルドコマンド: `npm run build`
5. 公開ディレクトリ: `dist`

## 🎮 使用方法

### 基本操作

1. **曲選択**: 「曲選択」タブから楽曲を選択
2. **モード切り替え**: 「練習モード」「本番モード」タブで切り替え
3. **楽器変更**: 設定パネルでピアノ/ギターを切り替え
4. **演奏**: MIDIキーボードまたはオーディオ入力で演奏

### 練習モード機能

- **ABリピート**: 特定区間の繰り返し練習
- **速度調整**: 0.25x-2.0xでの再生速度変更
- **5秒戻る/進む**: 細かい位置調整
- **シークバー**: 任意の位置へのジャンプ

### 設定オプション

- **音量調整**: マスター、音楽、MIDI音量
- **ノーツスピード**: 0.5x-3.0x
- **判定設定**: オクターブ違い許容、ノーツシフト
- **入力デバイス**: MIDI/オーディオデバイス選択

## 🏗️ 技術構成

### フロントエンド

```
├── React 18 + TypeScript
├── Zustand (状態管理)
├── Tailwind CSS (スタイリング)
├── PIXI.js (高性能描画)
├── Tone.js (音楽制御)
└── Vite (ビルドツール)
```

### アーキテクチャ

```
src/
├── components/          # UIコンポーネント
│   ├── game/           # ゲーム関連
│   └── ui/             # 共通UI
├── stores/             # Zustand状態管理
├── types/              # TypeScript型定義
├── platform/           # プラットフォーム抽象化
├── utils/              # ユーティリティ
└── data/               # 楽曲データ
```

### 状態管理

```typescript
// Zustandストア設計
interface GameState {
  mode: 'practice' | 'performance'
  instrumentMode: 'piano' | 'guitar'
  currentSong: SongMetadata | null
  score: GameScore
  settings: GameSettings
  // ... その他の状態
}
```

## 🔧 開発者向け情報

### デバッグ機能

- **FPS表示**: 設定でFPS監視を有効化
- **開発者パネル**: 開発環境でDEBUGボタンを表示
- **ブラウザDevTools**: Redux DevTools統合（Zustand）

### カスタマイズ

#### 新しい楽曲の追加

```typescript
// src/data/ に楽曲JSONファイルを配置
const newSong = {
  id: 'song-id',
  title: '楽曲名',
  artist: 'アーティスト名',
  difficulty: 1-5,
  duration: 120, // 秒
  audioFile: '/path/to/audio.mp3',
  notesFile: '/path/to/notes.json',
  genreCategory: 'jazz'
};
```

#### テーマのカスタマイズ

```css
/* tailwind.config.js でカラーパレット変更 */
colors: {
  primary: { /* カスタムカラー */ },
  jazz: { /* ジャズテーマカラー */ },
  game: { /* ゲーム背景カラー */ }
}
```

## 📊 パフォーマンス

### 最適化機能

- **コード分割**: Vendor, PIXI, Audio チャンクに分離
- **メモ化**: React.memo, useMemo の適切な使用
- **ハードウェアアクセラレーション**: CSS transform3d利用
- **状態最適化**: Zustandセレクターによる無駄な再レンダリング防止

### 対応ブラウザ

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 コントリビューション

### 開発フロー

1. Issueの作成・確認
2. フィーチャーブランチの作成
3. 実装・テスト
4. プルリクエスト作成
5. コードレビュー
6. マージ

### コーディング規約

- ESLint + Prettier による自動フォーマット
- TypeScript strict mode
- コンポーネントはFunction Component + hooks
- CSS-in-JSではなくTailwind CSS使用

## 📝 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 🙏 謝辞

- **Bill Evans** - サンプル楽曲提供
- **PIXI.js コミュニティ** - 高性能描画ライブラリ
- **Zustand チーム** - 軽量状態管理ライブラリ

---

**🎵 Happy Jazz Learning! 🎵**

Phase 1完了 - 基盤整備が完了しました。次はPhase 2でゲームエンジンの実装に進みます。 

## 特徴

- **リアルタイム演奏判定**: MIDI入力とピッチ検出による高精度な演奏判定
- **60FPS描画**: PIXI.jsによる滑らかなノーツ表示
- **音楽同期**: 正確な音声タイミング同期システム
- **練習モード**: ガイド付きの学習機能
- **マルチデバイス対応**: PC・タブレット・スマートフォン対応

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand + Immer
- **グラフィックス**: PIXI.js
- **音源**: Tone.js + Web Audio API
- **ピッチ検出**: WebAssembly (PYIN)

## 開発

### セットアップ

```bash
npm install
npm run dev
```

### ビルド

```bash
# 開発ビルド
npm run build

# 本番ビルド（パフォーマンス最適化版）
npm run build:perf

# 本番ビルド（詳細ログなし）
npm run build:prod

# ビルド結果のプレビュー
npm run preview:prod
```

### パフォーマンス最適化

**本番環境では以下の最適化が適用されます：**

- **ログ完全無効化**: `console.*` 関数が完全に削除され、ログによるパフォーマンス低下を防止
- **デバッグコンポーネント無効化**: FPSモニター等のデバッグUIが本番では非表示
- **バンドル最適化**: Tree-shaking、コード分割、圧縮による最小サイズ化
- **60FPS維持**: 統合フレーム制御による安定したフレームレート

### 開発者向け情報

- **ログレベル制御**: URLパラメータ `?debug=true` で開発時のログ有効化
- **パフォーマンス監視**: FPSモニター、レンダリング時間測定
- **統合フレーム制御**: 重複アニメーションループの防止

## ライセンス

Private

## 開発状況

Phase 3: PIXI.jsによる統合レンダリングシステム完成
- ゲームエンジン + PIXI.js統合
- 高パフォーマンス音楽同期
- 本番環境最適化完了 