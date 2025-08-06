# R2を本番環境で使用する方法（カスタムドメインなし）

## 結論：使用できますが、制限があります

### R2.dev URLの制限事項
```
pub-xxxxx.r2.dev の制限：
- レート制限: 1秒あたり100リクエスト程度
- バースト制限: 瞬間的な大量アクセスで制限される
- Cloudflare機能: WAF、キャッシング最適化などが使えない
```

## 本番環境での使用判断基準

### ✅ R2.dev URLで問題ない場合

**小～中規模のアプリケーション**
- 月間アクセス数: 10万PV以下
- 同時アクセス数: 100人以下
- ファイルサイズ: 小さめ（画像中心）
- 用途: プロフィール画像、ドキュメント等

**使用例:**
```typescript
// そのまま使用可能
const imageUrl = "https://pub-xxxxx.r2.dev/user-avatars/user123.jpg";
```

### ⚠️ カスタムドメインを検討すべき場合

**大規模なアプリケーション**
- 月間アクセス数: 10万PV以上
- 同時アクセス数: 100人以上
- ファイルサイズ: 大きい（動画、音声）
- 用途: メディアストリーミング、ECサイト

## 実践的な対策方法

### 1. プライベートバケット + 署名付きURL（推奨）

**メリット:**
- レート制限の影響を軽減
- セキュリティ向上
- アクセス制御が可能

**実装例:**
```typescript
import { getSignedUrlFromR2 } from '@/lib/cloudflare-r2';

// 署名付きURLを生成（1時間有効）
export async function getSecureFileUrl(fileKey: string) {
  return await getSignedUrlFromR2(fileKey, 3600);
}

// 使用例
const secureUrl = await getSecureFileUrl('private/document.pdf');
// https://pub-xxxxx.r2.dev/private/document.pdf?X-Amz-Signature=...
```

### 2. キャッシュ戦略の実装

**ブラウザキャッシュを活用:**
```typescript
// R2アップロード時にキャッシュヘッダーを設定
await uploadToR2(key, file, {
  CacheControl: 'public, max-age=31536000', // 1年間
  ContentType: file.type,
});
```

**アプリケーション側でキャッシュ:**
```typescript
// メモリキャッシュの実装
const urlCache = new Map<string, string>();

export async function getCachedUrl(fileKey: string) {
  if (urlCache.has(fileKey)) {
    return urlCache.get(fileKey);
  }
  
  const url = await getSignedUrlFromR2(fileKey);
  urlCache.set(fileKey, url);
  
  // 50分後にキャッシュクリア（URLの有効期限前）
  setTimeout(() => urlCache.delete(fileKey), 50 * 60 * 1000);
  
  return url;
}
```

### 3. 段階的な移行戦略

```typescript
// 環境変数で切り替え可能にする
const useCustomDomain = import.meta.env.VITE_USE_CUSTOM_DOMAIN === 'true';

export const R2_BASE_URL = useCustomDomain 
  ? 'https://cdn.jazzify.jp'
  : import.meta.env.VITE_R2_PUBLIC_URL;
```

## レート制限への対処法

### 1. リクエストの分散
```typescript
// 複数ファイルの並列ダウンロードを制限
async function downloadFilesWithLimit(urls: string[], limit = 5) {
  const results = [];
  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(url => fetch(url))
    );
    results.push(...batchResults);
    // バッチ間に小さな遅延を入れる
    if (i + limit < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return results;
}
```

### 2. エラーハンドリング
```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) { // Rate limit
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

## 実用的な判断フローチャート

```
アプリケーションの規模は？
├─ 小規模（月間10万PV以下）
│  └─ R2.dev URLで問題なし ✅
│
├─ 中規模（月間10万～100万PV）
│  ├─ 画像中心 → R2.dev URLでOK（キャッシュ活用）
│  └─ 動画/大容量 → カスタムドメイン推奨
│
└─ 大規模（月間100万PV以上）
   └─ カスタムドメイン必須 ⚠️
```

## まとめ

**カスタムドメインなしでも本番環境で使用可能です！**

ただし：
1. **アクセス数を監視** - レート制限に注意
2. **キャッシュを活用** - ブラウザ/CDNキャッシュ
3. **段階的に移行** - 必要になったらカスタムドメインへ

多くの場合、R2.dev URLで十分に本番環境で運用できます。問題が発生してからカスタムドメインを検討しても遅くありません。