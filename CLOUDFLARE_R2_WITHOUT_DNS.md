# Cloudflare R2をDNS変更なしで使用する方法

## 概要
NetlifyのDNS管理を維持したまま、Cloudflare R2をファイルストレージとして使用する設定方法です。

## メリット
- ✅ 現在のNetlifyの設定を変更不要
- ✅ ダウンタイムなし
- ✅ DNS設定の複雑さを回避
- ✅ R2の機能をフルに活用可能

## 設定手順

### 1. Cloudflare R2の設定（DNS変更不要）

1. **Cloudflareダッシュボードにログイン**
   - 左側メニューから「R2」を選択
   - ドメイン追加のステップはスキップしてOK

2. **R2バケットの作成**
   ```
   バケット名: jazzify-assets
   リージョン: Asia Pacific
   ```

3. **APIトークンの作成**
   - R2 > Manage R2 API tokens
   - Create API token
   - 権限: Object Read & Write
   - バケットへのアクセスを許可

4. **パブリックアクセスの設定（必要な場合）**
   - バケット設定 > Public access
   - カスタムドメインは設定不要
   - R2.devサブドメインを使用

### 2. Netlify環境変数の設定

Netlifyダッシュボードで以下を設定：

```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
VITE_R2_BUCKET_NAME=jazzify-assets
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 3. アプリケーションでの使用

既に作成済みの `/src/lib/cloudflare-r2.ts` をそのまま使用：

```typescript
// ファイルアップロード例
const imageUrl = await uploadImageToR2(userId, imageFile);

// ファイル取得例
const blob = await getFromR2(fileKey);
```

## DNS構成の説明

### 現在の構成（維持）
```
jazzify.jp
  ↓ (Netlify DNS)
Netlifyサイト
  ↓ (API経由)
Cloudflare R2
```

### この構成でできること
- ✅ 画像・動画・音声ファイルの保存
- ✅ 大容量ファイルの効率的な配信
- ✅ グローバルCDNによる高速配信
- ✅ 署名付きURLによるセキュアなアクセス

### この構成でできないこと
- ❌ Cloudflare WAF（Web Application Firewall）
- ❌ Cloudflare DDoS保護
- ❌ Cloudflareのページルール

## まとめ

DNS管理をCloudflareに移管する必要はありません。Cloudflare R2は独立したストレージサービスとして、現在のNetlify構成と完全に共存できます。

将来的にCloudflareの完全な機能（WAF、DDoS保護など）が必要になった場合に、DNS移管を検討すれば十分です。