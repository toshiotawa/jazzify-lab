# Hoisting Error Fix Summary

## エラー内容
```
ReferenceError: Cannot access 'y' before initialization
```

プロダクションビルドで変数の初期化前アクセスエラーが発生。

## 原因
1. コンポーネント内でのconst定義による巻き上げ問題
2. 不要なimport（utilityファイルでのhookインポート）
3. esbuildのminify設定による変数名の衝突

## 修正内容

### 1. ProgressionTimingIndicatorを別ファイルに分離
**作成ファイル**: `/src/components/fantasy/ProgressionTimingIndicator.tsx`
- React.FCとして正しくexport
- 巻き上げ問題を回避

### 2. 不要なインポートを削除
**修正ファイル**: `/src/utils/progression-timing.ts`
```diff
- import { useTimeStore } from '@/stores/timeStore';
```
- utilityファイルでhookをインポートしていた問題を修正

### 3. FantasyGameScreen.tsxの更新
```diff
+ import { ProgressionTimingIndicator } from './ProgressionTimingIndicator';
- // インライン定義を削除
```

### 4. Vite設定の更新
**修正ファイル**: `/workspace/vite.config.ts`
```diff
esbuild: {
  ...
+ keepNames: true, // 関数名を保持して初期化エラーを防ぐ
}
```

## 効果
- プロダクションビルドでの変数巻き上げエラーを防止
- コンポーネントの適切な分離による保守性向上
- ビルド時の変数名圧縮による問題を回避

## テスト方法
```bash
npm run build:prod
npm run preview
```

ビルド後、ファンタジーモードのプログレッションパターンで正常に動作することを確認。