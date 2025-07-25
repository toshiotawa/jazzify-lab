# ファンタジーモード効果音システム実装ガイド

## 概要

ファンタジーモードに効果音システムを実装しました。このシステムは以下の機能を提供します：

- 魔法攻撃時の属性別効果音
- 敵攻撃時の効果音
- リアルタイム音量調整
- 同時再生対応

## 実装されたコンポーネント

### 1. FantasySoundManager (`/src/components/fantasy/FantasySoundManager.tsx`)

効果音の管理と再生を担当するReact Hookです。

**主な機能：**
- 効果音ファイルのプリロード
- 音量管理
- 同時再生（音声クローン機能）
- エラーハンドリング

**使用方法：**
```typescript
const soundManager = useFantasySoundManager({
  volume: 0.8 // 0.0 - 1.0
});

// 魔法効果音を再生
soundManager.playMagicSound('フレア');

// 敵攻撃効果音を再生
soundManager.playEnemyAttackSound();

// 音量変更
soundManager.setVolume(0.5);
```

### 2. 効果音ファイルマッピング

| 魔法名 | 効果音ファイル | 属性 |
|--------|----------------|------|
| フレア | fire.mp3 | 火 |
| インフェルノ | fire.mp3 | 火 |
| フロスト | ice.mp3 | 氷 |
| ブリザード | ice.mp3 | 氷 |
| スパーク | thunder.mp3 | 雷 |
| サンダー・ストライク | thunder.mp3 | 雷 |

### 3. GameSettings 拡張

`/src/types/index.ts` の `GameSettings` インターフェースに `soundEffectVolume` プロパティを追加：

```typescript
export interface GameSettings {
  // 音量設定
  masterVolume: number;        // 0-1
  musicVolume: number;         // 0-1
  midiVolume: number;          // 0-1
  soundEffectVolume: number;   // 0-1 - 効果音音量（新規追加）
  // ...
}
```

### 4. FantasySettingsModal 更新

設定モーダルに効果音音量スライダーを追加しました：

- 0-100%の範囲で調整可能
- デフォルト値は80%
- リアルタイムで音量変更を反映

### 5. FantasyGameScreen 統合

ゲーム画面に効果音システムを統合：

- 魔法名表示時に対応する効果音を自動再生
- 敵攻撃時（ゲージ満タン）に攻撃効果音を再生
- 設定変更時に音量を即座に反映

## 必要な効果音ファイル

以下のMP3ファイルを `/public/sounds/` ディレクトリに配置してください：

1. **enemy_attack.mp3**
   - 敵の攻撃音
   - 推奨：インパクト/ヒット音
   - 長さ：0.5-1秒

2. **fire.mp3**
   - 火属性魔法音
   - 推奨：炎/燃焼音
   - 長さ：1-2秒

3. **ice.mp3**
   - 氷属性魔法音
   - 推奨：凍結/結晶化音
   - 長さ：1-2秒

4. **thunder.mp3**
   - 雷属性魔法音
   - 推奨：電気/雷鳴音
   - 長さ：1-2秒

## テスト方法

### 1. 効果音ファイルの配置
```bash
# 効果音ファイルを配置
cp your-sound-files/*.mp3 /workspace/public/sounds/
```

### 2. テストコンポーネントの使用

`FantasySoundTest` コンポーネントを使用して効果音システムをテスト：

```typescript
import FantasySoundTest from '@/components/fantasy/FantasySoundTest';

// ルーティングに追加
<Route path="/fantasy-sound-test" element={<FantasySoundTest />} />
```

### 3. ゲーム内での確認

1. ファンタジーモードを開始
2. 設定アイコン（歯車）をクリック
3. 「効果音音量」スライダーで音量を調整
4. ゲーム中、正しいコードを演奏すると魔法効果音が再生される
5. 敵のゲージが満タンになると攻撃効果音が再生される

## 技術的な詳細

### 音声クローン機能
同じ効果音を短時間で複数回再生する場合に対応するため、`cloneNode()` を使用して音声要素をクローンしています。これにより、前の再生が終了する前に同じ効果音を再生できます。

### メモリ管理
- 再生終了後のクローン要素は自動的に削除
- コンポーネントのアンマウント時に全ての音声要素をクリーンアップ

### エラーハンドリング
- 効果音ファイルが見つからない場合は警告ログを出力
- 再生エラーが発生した場合もゲームは継続

## 今後の拡張案

1. **効果音の追加**
   - プレイヤーダメージ音
   - モンスター撃破音
   - レベルクリア音

2. **効果音のバリエーション**
   - 同じ魔法でも複数の効果音からランダムに選択
   - 特殊魔法（SP使用時）用の強化版効果音

3. **3D音響効果**
   - モンスターの位置に応じた左右のパン調整
   - 距離に応じた音量減衰