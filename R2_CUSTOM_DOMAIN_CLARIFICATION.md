# R2カスタムドメイン vs デプロイの違い

## 重要：カスタムドメイン ≠ デプロイ先

### 現在の構成（変わらない部分）
```
アプリケーション本体：
- デプロイ先: Netlify ✅（変更なし）
- URL: https://jazzify.jp
- 内容: React/TypeScriptアプリ

ファイルストレージ：
- 保存先: Cloudflare R2
- URL: https://pub-xxxxx.r2.dev または https://cdn.jazzify.jp
- 内容: 画像、音声、動画ファイルなど
```

## カスタムドメインとは何か？

### R2カスタムドメインの役割
**ファイルアクセス用のURLを変更するだけ**

```
Before（カスタムドメインなし）:
https://pub-xxxxx.r2.dev/images/photo.jpg

After（カスタムドメインあり）:
https://cdn.jazzify.jp/images/photo.jpg
```

### 何が変わらないか
- ❌ アプリのデプロイ先は変わらない（Netlifyのまま）
- ❌ アプリのコードはCloudflareに移動しない
- ❌ NetlifyからCloudflareへの移行は不要

## 実際の動作フロー

### 1. ユーザーがサイトにアクセス
```
ユーザー → https://jazzify.jp → Netlify（アプリ本体）
```

### 2. アプリが画像を表示
```
アプリ → https://cdn.jazzify.jp/image.jpg → Cloudflare R2（画像ファイル）
```

## よくある誤解と正解

### ❌ 誤解
「R2のカスタムドメインを設定したら、アプリ全体をCloudflareでホストする必要がある」

### ✅ 正解
「R2のカスタムドメインは、R2に保存したファイルのURLを良くするだけ」

## 具体例で理解する

### 現在のコード（Netlifyでデプロイ）
```typescript
// App.tsx - このファイルはNetlifyでホストされる
import React from 'react';

function UserProfile() {
  // R2から画像を取得（カスタムドメインなし）
  const avatarUrl = "https://pub-xxxxx.r2.dev/avatars/user123.jpg";
  
  return (
    <div>
      <h1>ユーザープロフィール</h1>
      <img src={avatarUrl} alt="アバター" />
    </div>
  );
}
```

### カスタムドメイン設定後のコード（引き続きNetlifyでデプロイ）
```typescript
// App.tsx - このファイルは引き続きNetlifyでホストされる
import React from 'react';

function UserProfile() {
  // R2から画像を取得（カスタムドメインあり）
  const avatarUrl = "https://cdn.jazzify.jp/avatars/user123.jpg";
  
  return (
    <div>
      <h1>ユーザープロフィール</h1>
      <img src={avatarUrl} alt="アバター" />
    </div>
  );
}
```

**変わったのはURLだけ！デプロイ先は同じ！**

## サービスの役割分担

### Netlify（変更なし）
- ✅ Reactアプリのホスティング
- ✅ ビルド＆デプロイ
- ✅ サーバーレス関数
- ✅ フォーム処理
- ✅ メインサイトのSSL

### Cloudflare R2（ファイルストレージのみ）
- ✅ 画像ファイルの保存
- ✅ 音声ファイルの保存
- ✅ 動画ファイルの保存
- ✅ ドキュメントの保存
- ❌ アプリケーションのホスティング（しない）

## まとめ

**R2のカスタムドメインを設定しても：**

1. **アプリは引き続きNetlifyでホスト** 
2. **デプロイ方法は変わらない**
3. **変わるのはファイルのURLだけ**

### イメージ図
```
[ユーザー]
    ↓
[jazzify.jp] → Netlify（アプリ本体）
    ↓
[アプリ内の画像タグ]
    ↓
[cdn.jazzify.jp] → Cloudflare R2（ファイルのみ）
```

**結論：カスタムドメインはファイルアクセス用のURLを改善するだけで、アプリのデプロイ先には一切影響しません。**