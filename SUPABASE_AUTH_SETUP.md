# Supabase認証設定トラブルシューティングガイド

## エラー: "Signups not allowed for otp"

このエラーは、Supabaseの認証設定でOTP（One-Time Password）によるサインアップが無効になっているために発生します。

## 解決方法

### 1. Supabaseダッシュボードでの設定確認

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. **Authentication** → **Settings** に移動
4. **Email Auth** セクションを確認

### 2. 必要な設定

以下の設定を確認・修正してください：

#### Email Auth設定
- ✅ **Enable email confirmations**: 有効
- ✅ **Enable email signups**: 有効
- ✅ **Enable magic links**: 有効
- ✅ **Enable OTP**: 有効
- ❌ **Enable OTP signups**: 無効（これが問題の原因）

#### 推奨設定
```
Email Auth:
├── Enable email confirmations: ✅ ON
├── Enable email signups: ✅ ON
├── Enable magic links: ✅ ON
├── Enable OTP: ✅ ON
└── Enable OTP signups: ❌ OFF (推奨)
```

### 3. 代替認証方法

OTPサインアップが無効な場合、以下の方法を使用してください：

#### マジックリンク認証（推奨）
- ユーザーはメールリンクをクリックしてログイン
- セキュリティが高く、パスワード不要

#### 既存アカウントでのログイン
- 既に登録済みのユーザーはOTPでログイン可能
- 新規ユーザーはマジックリンクで登録

### 4. 設定変更手順

1. Supabaseダッシュボードで **Authentication** → **Settings** に移動
2. **Email Auth** セクションで以下を確認：
   - `Enable OTP signups` を **OFF** に設定
   - `Enable magic links` を **ON** に設定
3. 設定を保存
4. アプリケーションを再起動

### 5. 環境変数の確認

`.env` ファイルで以下が正しく設定されているか確認：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_REDIRECT_URL=your_redirect_url
```

### 6. トラブルシューティング

#### エラーが続く場合
1. ブラウザのキャッシュをクリア
2. アプリケーションを再起動
3. Supabaseダッシュボードで設定を再確認
4. 環境変数を再確認

#### 開発環境での確認
開発環境では、以下のURLが正しく設定されているか確認：
- `VITE_SUPABASE_REDIRECT_URL` が `http://localhost:5173` または適切な開発URL

### 7. セキュリティ考慮事項

- OTPサインアップを無効にすることで、より制御されたユーザー登録が可能
- マジックリンク認証は、パスワードレス認証として安全
- 本番環境では適切なリダイレクトURLを設定

### 8. 関連ファイル

- `src/stores/authStore.ts`: 認証ロジック
- `src/components/auth/AuthLanding.tsx`: 認証UI
- `src/utils/magicLinkConfig.ts`: マジックリンク設定

## 更新履歴

- 2024-01-XX: 初版作成
- 2024-01-XX: OTPサインアップ無効エラーの対応追加 