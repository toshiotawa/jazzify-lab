# リズムモード実装差分

## 実装済み機能

### Phase 1: 基盤整備 ✅
- [x] TypeScript型定義の追加
  - [x] `src/types/rhythm.ts` の作成
  - [x] 既存の `src/types/index.ts` への統合
- [x] Zustandストアの拡張
  - [x] `gameStore.ts` へのリズムモード状態追加
  - [x] リズムモード用アクションの実装
- [x] 基本的なUI構造の作成
  - [x] `RhythmModeScreen` コンポーネント
  - [x] レイアウト設計
- [x] ルーティング設定
  - [x] インストゥルメントモードへの `rhythm` 追加
  - [x] GameScreenでの条件分岐

### Phase 2: 基本UI実装 ✅
- [x] ドラムパッドコンポーネント
  - [x] 4パッドレイアウト
  - [x] キーボード入力対応
  - [x] ヒットアニメーション
- [x] スコア表示
  - [x] リアルタイム更新対応
  - [x] 判定表示
- [x] コントロールバー
  - [x] 再生/停止ボタン
  - [x] 速度調整
  - [x] メトロノーム切り替え
- [x] パターンセレクター
  - [x] カテゴリ別表示
  - [x] 難易度表示
  - [x] プレビュー表示

### Phase 2: データ実装 ✅
- [x] リズムパターンデータ
  - [x] `basic.ts` - 基本パターン
  - [x] `jazz.ts` - ジャズパターン
  - [x] `latin.ts` - ラテンパターン

## 実装中の機能

### Phase 3: コア機能実装
- [ ] RhythmEngineクラスの実装
  - [ ] 基本クラス構造
  - [ ] パターン管理
  - [ ] ノーツ処理
- [ ] 判定システムの実装
  - [ ] タイミング判定ロジック
  - [ ] スコア計算
- [ ] ドラム音源の準備
  - [ ] 音源ファイルの配置
  - [ ] ローダー実装
- [ ] ノーツ降下表示
  - [ ] PIXI.js統合
  - [ ] レンダリング最適化

## 未実装機能

### Phase 1: 基盤整備
- [ ] TypeScript型定義の追加
  - [ ] `src/types/rhythm.ts` の作成
  - [ ] 既存の `src/types/index.ts` への統合
- [ ] Zustandストアの拡張
  - [ ] `gameStore.ts` へのリズムモード状態追加
  - [ ] リズムモード用アクションの実装
- [ ] 基本的なUI構造の作成
  - [ ] `RhythmModeScreen` コンポーネント
  - [ ] レイアウト設計
- [ ] ルーティング設定
  - [ ] インストゥルメントモードへの `rhythm` 追加

### Phase 2: コア機能実装
- [ ] RhythmEngineクラスの実装
  - [ ] 基本クラス構造
  - [ ] パターン管理
  - [ ] ノーツ処理
- [ ] 判定システムの実装
  - [ ] タイミング判定ロジック
  - [ ] スコア計算
- [ ] ドラム音源の準備
  - [ ] 音源ファイルの配置
  - [ ] ローダー実装
- [ ] 基本的な入力処理
  - [ ] キーボード入力
  - [ ] MIDI入力（オプション）

### Phase 3: UI実装
- [ ] ドラムパッドコンポーネント
  - [ ] 4パッドレイアウト
  - [ ] ヒットアニメーション
- [ ] ノーツ降下表示
  - [ ] PIXI.js統合
  - [ ] レンダリング最適化
- [ ] スコア表示
  - [ ] リアルタイム更新
  - [ ] 判定表示
- [ ] 設定画面
  - [ ] リズムモード専用設定

### Phase 4: 統合とテスト
- [ ] 既存システムとの統合
  - [ ] 共通コンポーネントの利用
  - [ ] 設定の共有
- [ ] パフォーマンス最適化
  - [ ] メモリ管理
  - [ ] 描画最適化
- [ ] テスト
  - [ ] 単体テスト
  - [ ] 統合テスト

## 変更が必要な既存ファイル

### `src/types/index.ts`
```diff
- export type InstrumentMode = 'piano' | 'guitar';
+ export type InstrumentMode = 'piano' | 'guitar' | 'rhythm';
```

### `src/stores/gameStore.ts`
```diff
  interface GameStoreState extends GameState {
    // ... 既存のプロパティ
   
   // リズムモード状態
   rhythmState: {
     pattern: RhythmPattern | null;
     activeNotes: Map<string, ActiveRhythmNote>;
     score: RhythmScore;
     settings: RhythmSettings;
   };
   
   // リズムモードアクション
   loadRhythmPattern: (pattern: RhythmPattern) => void;
   handleRhythmInput: (padIndex: number) => void;
   updateRhythmSettings: (settings: Partial<RhythmSettings>) => void;
   resetRhythmScore: () => void;
  }
```

### `src/components/game/GameScreen.tsx`
```diff
  const GameScreen: React.FC = () => {
    const { instrumentMode } = useGameSelector((s) => s.settings);
    
    return (
      <div className="game-screen">
        {instrumentMode === 'piano' && <PianoGameArea />}
        {instrumentMode === 'guitar' && <GuitarGameArea />}
+       {instrumentMode === 'rhythm' && <RhythmGameArea />}
      </div>
    );
  };
```

## 新規作成ファイル

### コンポーネント
- `src/components/rhythm/RhythmModeScreen.tsx`
- `src/components/rhythm/DrumPads.tsx`
- `src/components/rhythm/RhythmNotation.tsx`
- `src/components/rhythm/RhythmGameArea.tsx`
- `src/components/rhythm/RhythmControlBar.tsx`
- `src/components/rhythm/RhythmNotesRenderer.tsx`

### ユーティリティ
- `src/utils/rhythmEngine.ts`
- `src/utils/rhythmJudgment.ts`
- `src/utils/rhythmPatternLoader.ts`
- `src/utils/drumSampleLoader.ts`

### 型定義
- `src/types/rhythm.ts`

### データ
- `src/data/rhythmPatterns/basic.ts`
- `src/data/rhythmPatterns/jazz.ts`
- `src/data/rhythmPatterns/latin.ts`

### 音源
- `public/sounds/drums/kick.wav`
- `public/sounds/drums/snare.wav`
- `public/sounds/drums/hihat-closed.wav`
- `public/sounds/drums/hihat-open.wav`
- `public/sounds/drums/crash.wav`
- `public/sounds/drums/ride.wav`
- `public/sounds/drums/tom-high.wav`
- `public/sounds/drums/tom-low.wav`

## 実装メモ

### 注意事項
- 既存のGameEngineとの干渉を避ける
- パフォーマンスを常に監視
- モバイルデバイスでの動作確認

### 技術的決定事項
- PIXI.js を使用してノーツ描画
- Web Audio API で低レイテンシ音源再生
- Zustand で状態管理を統一

### 今後の課題
- より多くのリズムパターンの追加
- カスタムパターン作成機能
- オンラインでのパターン共有