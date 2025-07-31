# Development Checks and Quality Assurance

このプロジェクトでは、コード品質を保つために以下のチェックツールが設定されています。

## 🔍 利用可能なチェックコマンド

### 基本的なチェック
```bash
# TypeScriptの型チェック
npm run type-check

# ESLintによるコードチェック
npm run lint

# ESLintで自動修正
npm run lint:fix

# 型チェックとLintを同時実行
npm run check
```

### 厳密なチェック（CI/CD用）
```bash
# より厳しいTypeScript設定でチェック
npm run type-check:strict

# 厳密な型チェックとLintを同時実行
npm run check:strict
```

### リアルタイムチェック
```bash
# TypeScriptの型チェックをウォッチモードで実行
npm run type-check:watch

# 開発サーバー起動時に自動的にチェック（vite-plugin-checker）
npm run dev
```

## 🎯 React Hooksのルール

以下のReact Hooksのルールが厳密にチェックされます：

1. **Rules of Hooks** (`react-hooks/rules-of-hooks`)
   - フックは関数コンポーネントのトップレベルでのみ呼び出す
   - 条件文やループ内でフックを呼び出さない

2. **Exhaustive Dependencies** (`react-hooks/exhaustive-deps`)
   - useEffect、useCallback、useMemoの依存配列に必要な値をすべて含める
   - 依存配列の漏れを防ぐ

## 🚀 CI/CD設定

### GitHub Actions

プルリクエスト時に以下のチェックが自動実行されます：

1. **Type Check and Lint** (`.github/workflows/type-check.yml`)
   - Node.js 18.x と 20.x でのテスト
   - TypeScript型チェック
   - ESLintチェック
   - ビルドテスト

2. **React Hooks Check** 
   - React Hooksの使用ルール違反を特別にチェック

3. **Pre-merge Check** (`.github/workflows/pre-merge-check.yml`)
   - 変更されたファイルのみを対象にした型チェック
   - すべてのチェックの統合実行

## 💻 VS Code設定

`.vscode/settings.json`により以下が自動設定されます：

- ファイル保存時のESLint自動修正
- TypeScriptの厳密なチェック
- React Hooksルール違反のリアルタイム表示
- インポートの自動整理

## 🛠️ vite-plugin-checker

開発サーバー起動時に以下がリアルタイムでチェックされます：

- TypeScriptの型エラー
- ESLintのエラー・警告
- React Hooksのルール違反

エラーはブラウザにオーバーレイ表示され、即座に確認できます。

## 📝 推奨ワークフロー

1. **開発前**
   ```bash
   npm run type-check
   npm run lint
   ```

2. **開発中**
   ```bash
   npm run dev  # vite-plugin-checkerが自動チェック
   ```

3. **コミット前**
   ```bash
   npm run check
   npm run lint:fix  # 自動修正可能な問題を修正
   ```

4. **プルリクエスト前**
   ```bash
   npm run check:strict
   npm run build
   ```

## ⚠️ よくあるエラーと対処法

### React Hooksエラー

```typescript
// ❌ 間違い: 条件文内でフックを使用
if (condition) {
  const [state, setState] = useState();
}

// ✅ 正解: トップレベルで使用
const [state, setState] = useState();
if (condition) {
  // stateを使用
}
```

### 依存配列エラー

```typescript
// ❌ 間違い: 依存配列に必要な値が不足
useEffect(() => {
  console.log(value);
}, []); // 'value'が不足

// ✅ 正解: すべての依存関係を含める
useEffect(() => {
  console.log(value);
}, [value]);
```