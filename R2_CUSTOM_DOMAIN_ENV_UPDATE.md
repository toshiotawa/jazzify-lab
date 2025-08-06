# R2カスタムドメイン設定完了後の環境変数更新

## 🎉 おめでとうございます！

カスタムドメイン `jazzify-cdn.com` の設定が完了しました。

## 環境変数の更新

### 1. ローカル開発環境（.env）

```env
# 以前の設定
# VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# 新しい設定
VITE_R2_PUBLIC_URL=https://jazzify-cdn.com
```

### 2. Netlifyの環境変数

1. **Netlifyダッシュボード**にログイン
2. **Site settings** → **Environment variables**
3. `VITE_R2_PUBLIC_URL` を更新：

```
変更前: https://pub-xxxxx.r2.dev
変更後: https://jazzify-cdn.com
```

4. **Save** をクリック
5. **デプロイをトリガー**（変更を反映するため）

## コードの確認

既存のコードはそのまま動作します：

```typescript
// src/lib/cloudflare-r2.ts
// 変更不要 - 環境変数を参照しているため
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

// 使用例
const imageUrl = `${R2_PUBLIC_URL}/images/photo.jpg`;
// → https://jazzify-cdn.com/images/photo.jpg
```

## CORS設定の確認

R2バケットのCORS設定を更新してください：

1. **R2ダッシュボード** → **Settings** → **CORS**
2. 以下を設定：

```json
[
  {
    "AllowedOrigins": [
      "https://jazzify.jp",
      "https://www.jazzify.jp",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 動作確認

### 1. ローカルでテスト
```bash
npm run dev
```

ブラウザの開発者ツールで確認：
- Network タブを開く
- 画像のURLが `jazzify-cdn.com` になっているか確認

### 2. テストアップロード

```typescript
// 簡単なテスト
const testUpload = async () => {
  const response = await fetch('https://jazzify-cdn.com/test.txt');
  console.log('Status:', response.status);
  console.log('URL works:', response.ok);
};
```

## メリットの確認

### ✅ 達成したこと
- **レート制限なし** - 本番環境で安心
- **高速配信** - Cloudflareのグローバルネットワーク
- **プロフェッショナルなURL** - `jazzify-cdn.com`
- **独立した管理** - NetlifyとCloudflareで役割分担

### 📊 パフォーマンス向上
- 並列ダウンロード数の増加
- Cookieなしでキャッシュ効率向上
- 専用ドメインでの最適化

## チェックリスト

- [ ] ローカルの .env ファイルを更新
- [ ] Netlifyの環境変数を更新
- [ ] CORS設定を確認
- [ ] ローカルで動作確認
- [ ] 本番環境にデプロイ
- [ ] 本番環境で動作確認

## トラブルシューティング

### CORSエラーが出る場合
→ R2のCORS設定にあなたのドメインが含まれているか確認

### 404エラーが出る場合
→ ファイルがR2バケットに存在するか確認

### HTTPSエラーが出る場合
→ SSL証明書の発行待ち（通常5-10分）

## 次のステップ

1. **既存ファイルの移行**（もしあれば）
2. **画像最適化の実装**
3. **キャッシュ戦略の最適化**

素晴らしい進歩です！これで本番環境対応のCDNが完成しました。