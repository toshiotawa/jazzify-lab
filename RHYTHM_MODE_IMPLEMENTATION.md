# リズムモード実装概要

## 実装内容

### 1. RhythmGameEngine クラス（src/utils/rhythmGameEngine.ts）
- リズムモードのゲームロジックを管理するクラス
- 判定ウィンドウ（前後200ms）の仕組みを実装
- ランダムパターンとコード進行パターンの両方に対応

#### 主な機能：
- **判定ウィンドウ**: 判定タイミングの前後200msで入力を受け付け
- **ランダムパターン**: 1小節に1回、allowed_chordsからランダムにコードを出題
- **コード進行パターン**: chord_progression_dataに基づいて順番にコードを出題
- **無限ループ**: 曲の最後まで行ったら状態をリセットせずに最初から繰り返す

### 2. FantasyGameEngine への統合
- RhythmGameEngineをFantasyGameEngine内部で管理
- ゲーム初期化時にリズムエンジンを作成・開始
- 60fpsでリズムエンジンを更新
- 音符入力をリズムエンジンに渡して判定

### 3. timeStore の改善
- `isCountIn`フラグが既に実装済み
- カウントイン中かどうかを判定し、適切な小節番号を表示

### 4. UI表示
- ステージカードでリズムモードを表示（「リズムモード」バッジ）
- ランダムかコード進行かを表示

## 主な変更ファイル

1. **src/utils/rhythmGameEngine.ts** - 新規作成
2. **src/components/fantasy/FantasyGameEngine.tsx** - リズムエンジン統合
3. **src/components/fantasy/FantasyGameScreen.tsx** - 不要なコンポーネント削除

## 判定の流れ

1. プレイヤーが音符を入力
2. RhythmGameEngineが判定ウィンドウ内かチェック
3. 判定ウィンドウ内かつコードが完成したら攻撃成功
4. 判定ウィンドウを過ぎたら攻撃失敗（敵の攻撃）
5. 判定後はバッファをクリア

## テストコード

`src/utils/tests/rhythmGameEngine.test.ts`に簡単なテストを作成。
正規化された音符（0-11）が正しく生成されることを確認。