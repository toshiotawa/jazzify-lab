# Supabase CLI セットアップガイド

**作成日時**: 2025年07月08日 12:00:00  
**対象**: Jazz Learning Game 開発者  
**前提条件**: Node.js 18+、Docker（推奨）

## 📋 概要

このガイドでは、Jazz Learning Game プロジェクトにおけるSupabase CLIの設定手順を説明します。CLI を使用することで、ローカル開発環境でのデータベース管理・マイグレーション・型生成が自動化されます。

## 🛠️ セットアップ手順

### 1. 前提条件の確認

```bash
# Node.js バージョン確認（18+ が必要）
node --version

# Docker がインストールされているか確認（推奨）
docker --version
```

### 2. Supabase CLI の準備

プロジェクトには既にSupabase CLIが含まれています：

```bash
# CLI バージョン確認
npx supabase --version

# または、グローバルインストール（オプション）
npm install -g supabase
```

### 3. ローカル開発環境の起動

```bash
# Supabase ローカル環境を起動（初回は Docker イメージダウンロード）
npm run supabase:start

# または直接実行
npx supabase start
```

**初回起動時の情報**：
- API URL: `http://localhost:54321`
- GraphQL URL: `http://localhost:54321/graphql/v1`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- Inbucket URL: `http://localhost:54324`
- JWT secret: `super-secret-jwt-token-with-at-least-32-characters-long`
- anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- service_role key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. データベース初期化

```bash
# マイグレーションを実行してテーブルを作成
npx supabase db reset

# または既存のマイグレーションを適用
npx supabase db push
```

### 5. 環境変数の設定

`.env.local` ファイルを更新：

```bash
# ローカル開発用設定
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 開発環境設定
VITE_APP_ENV=development
VITE_DEBUG=true
```

### 6. 型定義の生成

```bash
# TypeScript 型定義を自動生成
npm run supabase:types

# 生成される場所: src/types/supabase.ts
```

## 🎯 開発ワークフロー

### マイグレーション作成

```bash
# 新しいマイグレーションファイルを作成
npm run supabase:migrate

# 手動でマイグレーションファイルを作成
npx supabase migration new your_migration_name
```

### データベース管理

```bash
# データベースリセット（開発時）
npm run supabase:reset

# リモートデータベースと同期
npm run supabase:pull

# ローカル変更をリモートにプッシュ
npm run supabase:push
```

### 開発サーバー管理

```bash
# Supabase 開発サーバー開始
npm run supabase:start

# Supabase 開発サーバー停止
npm run supabase:stop

# 状態確認
npx supabase status
```

## 🔗 本番環境への接続

### 1. Supabase プロジェクト作成

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名：`jazz-learning-game`
4. データベースパスワードを設定
5. リージョンを選択（推奨：東京）

### 2. プロジェクト連携

```bash
# Supabase プロジェクトにログイン
npx supabase login

# プロジェクトをリンク
npx supabase link --project-ref your-project-id
```

### 3. 本番用環境変数

`.env.local` を本番用に更新：

```bash
# 本番環境設定（Supabase Dashboard > Settings > API から取得）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

### 4. マイグレーション適用

```bash
# ローカルの変更を本番に適用
npm run supabase:push
```

## 📊 データベーススキーマ

### profiles テーブル

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  member_rank TEXT NOT NULL DEFAULT 'bronze',
  total_exp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 会員ランクシステム

- **bronze**: 0-999 経験値
- **silver**: 1000-2499 経験値  
- **gold**: 2500-4999 経験値
- **platinum**: 5000-9999 経験値
- **diamond**: 10000-19999 経験値
- **master**: 20000+ 経験値（管理者権限）

## 🔐 セキュリティ設定

### Row Level Security (RLS)

```sql
-- プロフィールは誰でも閲覧可能
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### Magic Link 認証

認証設定は Supabase Dashboard > Authentication > Settings で行います：

1. **Enable email confirmations**: ON
2. **Email templates**: カスタマイズ推奨
3. **Redirect URLs**: `http://localhost:5173/auth/callback`（開発時）

## 🚨 トラブルシューティング

### よくある問題

**問題**: `supabase start` でエラー
```bash
# Docker が起動していることを確認
docker ps

# ポートが使用中の場合
npx supabase stop
npm run supabase:start
```

**問題**: 型定義が生成されない
```bash
# 手動で型定義を生成
npx supabase gen types typescript --local > src/types/supabase.ts
```

**問題**: マイグレーションエラー
```bash
# データベースをリセット
npm run supabase:reset

# 特定のマイグレーションを確認
npx supabase db diff
```

## 📚 参考リンク

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Authentication with Magic Links](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**セットアップ完了後の確認項目**:

- [ ] ローカル Supabase が起動（`http://localhost:54323`）
- [ ] データベースマイグレーション適用済み
- [ ] 型定義ファイル生成済み（`src/types/supabase.ts`）
- [ ] 環境変数設定完了（`.env.local`）
- [ ] 認証フロー動作確認

**次のステップ**: アプリケーションを起動して認証システムをテストしてください。