# CDN専用ドメインとメインサイトの接続方法

## 仕組みの説明

### 構成イメージ
```
ユーザー
  ↓
https://jazzify.jp (Netlifyでホスト)
  ↓
アプリ内の画像タグ
  ↓
https://jazzify-cdn.com/image.jpg (Cloudflare R2)
```

**別ドメインでも、アプリから普通にアクセスできます！**

## 具体的な実装例

### 1. 環境変数で管理
```env
# .env
VITE_APP_URL=https://jazzify.jp
VITE_R2_PUBLIC_URL=https://jazzify-cdn.com
```

### 2. アプリケーションでの使用
```typescript
// App.tsx (Netlifyでホスト)
import React from 'react';

function UserProfile() {
  // CDNドメインから画像を読み込む
  const avatarUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/avatars/user123.jpg`;
  
  return (
    <div>
      <h1>ユーザープロフィール</h1>
      <img src={avatarUrl} alt="アバター" />
      {/* ↑ これは https://jazzify-cdn.com/avatars/user123.jpg を読み込む */}
    </div>
  );
}
```

### 3. 実際のHTML出力
```html
<!-- jazzify.jp で表示されるページ -->
<html>
  <body>
    <h1>ユーザープロフィール</h1>
    <img src="https://jazzify-cdn.com/avatars/user123.jpg" alt="アバター">
  </body>
</html>
```

## なぜこれが動作するのか

### ウェブの基本的な仕組み
- **画像やファイルは別ドメインから読み込める**
- 例：多くのサイトがCDNを使用
  - サイト: example.com
  - 画像: cdn.example.com や cloudinary.com など

### 実例
```html
<!-- これらはすべて正常に動作 -->
<img src="https://jazzify.jp/logo.png">          <!-- 同じドメイン -->
<img src="https://jazzify-cdn.com/logo.png">     <!-- 別ドメイン -->
<img src="https://pub-xxx.r2.dev/logo.png">      <!-- R2デフォルト -->
```

## セットアップ手順

### 1. CDN用ドメインを購入
- 例: `jazzify-cdn.com`, `jazzifyassets.com`
- 価格: 年間1,000円程度（.com）

### 2. CloudflareにCDNドメインを追加
1. Cloudflareで「サイトを追加」
2. `jazzify-cdn.com` を入力
3. ネームサーバーをCloudflareに変更

### 3. R2でカスタムドメイン設定
1. R2バケット → Settings → Custom Domains
2. `jazzify-cdn.com` を追加

### 4. CORS設定（重要）
R2バケットのCORS設定：
```json
[
  {
    "AllowedOrigins": [
      "https://jazzify.jp",
      "https://www.jazzify.jp",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## メリット

### 1. 完全に独立した管理
- メインサイト: Netlify (jazzify.jp)
- CDN: Cloudflare (jazzify-cdn.com)
- お互いに影響しない

### 2. パフォーマンス向上
- 並列ダウンロード数の増加
- ブラウザの接続制限を回避
- Cookie不要でキャッシュ効率向上

### 3. 将来の柔軟性
- CDNプロバイダーを変更しても影響最小
- メインサイトのホスティングを変更してもCDNは影響なし

## よくある質問

### Q: SEOに影響は？
**A**: 画像のドメインが違ってもSEOに悪影響はありません

### Q: セキュリティは？
**A**: CORS設定で特定のオリジンのみ許可するので安全

### Q: 料金は増える？
**A**: ドメイン代（年1,000円程度）のみ追加

## 実装サンプル

```typescript
// utils/cdn.ts
export const getCDNUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  return `${baseUrl}/${path}`;
};

// components/CDNImage.tsx
interface CDNImageProps {
  path: string;
  alt: string;
  className?: string;
}

export function CDNImage({ path, alt, className }: CDNImageProps) {
  return (
    <img 
      src={getCDNUrl(path)} 
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

// 使用例
<CDNImage path="products/guitar.jpg" alt="ギター" />
```

## まとめ

**別ドメインでも問題なく接続できます！**

- jazzify.jp（メインサイト）
- jazzify-cdn.com（画像・ファイル配信）

この構成は、大手サイトでも採用されている一般的なパターンです。