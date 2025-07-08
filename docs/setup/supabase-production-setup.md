# 本番環境Supabase設定ガイド

## 概要
ローカル開発環境では`supabase local`を使用していますが、本番環境では実際のSupabaseプロジェクトが必要です。

## 本番環境Supabaseプロジェクト作成手順

### 1. Supabaseプロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. 「New Project」をクリック
3. プロジェクト名を入力（例: `jazzgame-production`）
4. データベースパスワードを設定
5. リージョンを選択（日本の場合: `ap-northeast-1`）
6. 「Create new project」をクリック

### 2. 認証設定

1. プロジェクトダッシュボードで「Authentication」→「Settings」
2. **Site URL**を本番環境URLに設定
   ```
   https://your-netlify-app.netlify.app
   ```
3. **Redirect URLs**に以下を追加
   ```
   https://your-netlify-app.netlify.app
   https://your-netlify-app.netlify.app/**
   ```

### 3. 環境変数取得

プロジェクト設定の「API」タブから以下を取得：

- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Netlify環境変数設定

Netlify管理画面で以下の環境変数を設定：

```bash
VITE_SUPABASE_URL_PROD=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY_PROD=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. データベーススキーマ同期

ローカルのスキーマを本番環境に同期：

```bash
# ローカルマイグレーションを本番環境に適用
supabase db push --project-ref your-project-ref
```

## 設定完了確認

1. 本番環境でアプリをデプロイ
2. 認証フローが正常動作することを確認
3. データベース接続が正常に動作することを確認

## トラブルシューティング

### エラー: "Supabase URL and anonymous key are required"

1. Netlify環境変数が正しく設定されているか確認
2. 環境変数名が正確か確認（`VITE_`プレフィックス必須）
3. Netlifyでのデプロイ後に環境変数変更した場合は再デプロイ

### 認証リダイレクトエラー

1. Supabase Authentication設定でRedirect URLsを確認
2. Site URLが本番環境URLと一致するか確認

## セキュリティ注意事項

1. **service_role key**は絶対にフロントエンドで使用しない
2. 環境変数ファイル（`.env*`）をGitにコミットしない
3. 本番環境では必ずRow Level Security (RLS)を有効化