# R2カスタムドメイン問題の解決策

## 問題の原因

**Cloudflare R2のカスタムドメインは、Cloudflareで管理されているドメインのみ使用可能**

現在の状況：
- jazzify.jp は Netlify で管理
- Cloudflare は jazzify.jp を認識していない
- そのため `cdn.jazzify.jp` を設定できない

## 解決策（3つの選択肢）

### 選択肢1: R2.dev URLを使い続ける（最も簡単）✅

**メリット**:
- 追加設定不要
- すぐに使える
- 小〜中規模なら十分

**デメリット**:
- レート制限あり（1秒100リクエスト程度）
- URLが長い

**使用方法**:
```typescript
const imageUrl = "https://pub-xxxxx.r2.dev/images/photo.jpg";
```

### 選択肢2: 別ドメインを使用（推奨）🌟

**新しいドメインをR2専用に取得**

1. **安価なドメインを購入**
   - 例: `jazzify-cdn.com`、`jazzifyassets.com`
   - .com なら年間1,000円程度

2. **そのドメインをCloudflareに追加**
   - ネームサーバーをCloudflareに設定
   - R2のカスタムドメインとして使用

**メリット**:
- メインサイト（Netlify）に影響なし
- 完全に独立した管理
- 設定が簡単

### 選択肢3: DNS管理をCloudflareに移管（複雑）⚠️

**jazzify.jp 全体をCloudflareで管理**

**デメリット**:
- 設定が複雑
- ダウンタイムのリスク
- Netlifyとの連携設定が必要

## 推奨アプローチ

### 短期的解決策
```env
# 今すぐ使える
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### 中長期的解決策
1. **別ドメインを購入**（年間1,000円程度）
2. **そのドメインをCloudflareで管理**
3. **R2のカスタムドメインとして設定**

例：
```
メインサイト: jazzify.jp (Netlify管理)
CDN: cdn.jazzifyassets.com (Cloudflare管理)
```

## 実装例（R2.dev URLを使う場合）

### キャッシュ戦略でレート制限対策
```typescript
// cloudflare-r2.ts を更新
export async function uploadToR2(
  key: string,
  file: File | Blob,
  contentType?: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType || file.type,
    // キャッシュヘッダーを追加
    CacheControl: 'public, max-age=31536000', // 1年
  });

  await R2.send(command);
  return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
}
```

### 画像の遅延読み込み
```typescript
// 画像コンポーネント
function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy" // 遅延読み込み
      decoding="async"
    />
  );
}
```

## 決定フローチャート

```
予算はある？
├─ No → R2.dev URLを使用（選択肢1）
└─ Yes（年1,000円）
    └─ 設定の複雑さを避けたい？
        ├─ Yes → 別ドメイン購入（選択肢2）✨
        └─ No → DNS移管（選択肢3）
```

## まとめ

1. **今すぐ始めるなら**: R2.dev URLで十分
2. **本格運用なら**: 別ドメインが最適解
3. **DNS移管は**: 最後の手段

ほとんどのケースで、R2.dev URLまたは別ドメインで解決できます。