# Cloudflare R2 セットアップガイド

## 1. ドメイン設定

### ドメインの接続
- **ドメイン**: https://jazzify.jp/
- CloudflareのダッシュボードでドメインをCloudflareに接続します

### DNS設定
- **Quick scan for DNS records**を選択
  - CloudflareがDNSレコードを自動的にスキャンしてインポートします
  - 現在のDNS設定が自動的に検出されます

## 2. AI クローラー設定

### AI トレーニングボットのブロック設定
推奨設定：
- **Block on all pages** - AIトレーニングボットがサイトのコンテンツをスクレイピングできないようにします

この設定により：
- AIトレーニング用のボットがサイトのコンテンツをスクレイピングすることを防ぎます
- robots.txtでAIボットのトラフィックを制御できます

## 3. Cloudflare R2 設定

### R2バケットの作成
1. CloudflareダッシュボードからR2に移動
2. 新しいバケットを作成
   - バケット名: `jazzify-assets` (例)
   - リージョン: Asia Pacific

### R2 APIトークンの作成
1. R2 > Manage R2 API tokens
2. Create API token
3. 権限設定:
   - Object Read & Write
   - 必要なバケットへのアクセス

### 環境変数の設定
```env
# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=jazzify-assets
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## 4. プロジェクトでのR2統合

### 必要なパッケージのインストール
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### R2クライアントの設定
```typescript
import { S3Client } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});
```

## 5. Netlify環境変数の設定

Netlifyダッシュボードで以下の環境変数を設定：
1. Site settings > Environment variables
2. 上記の環境変数を追加

## 6. セキュリティ設定

### CORSポリシー
R2バケットのCORS設定：
```json
[
  {
    "AllowedOrigins": ["https://jazzify.jp"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### アクセス制御
- パブリックアクセスが必要なアセットのみを公開
- プライベートなファイルは署名付きURLを使用

## 次のステップ

1. Cloudflareアカウントにログイン
2. ドメイン（jazzify.jp）を追加
3. DNS設定の確認と移行
4. R2バケットの作成
5. APIトークンの生成
6. プロジェクトコードの更新