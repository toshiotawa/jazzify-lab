# NetlifyのDNSでR2カスタムドメインを使う方法

## 朗報：カスタムドメインは使えます！

NetlifyでDNS管理しながら、R2のカスタムドメインも設定できます。

## 設定方法（簡単3ステップ）

### ステップ1: サブドメインを決める
```
例：
- cdn.jazzify.jp
- assets.jazzify.jp
- media.jazzify.jp
- files.jazzify.jp
```

### ステップ2: NetlifyでCNAMEレコードを追加

1. **Netlifyダッシュボード**にログイン
2. **Domain settings** → **DNS panel**
3. **Add new record** をクリック
4. 以下を入力：

```
Record type: CNAME
Name: cdn （サブドメイン名）
Value: jazzify-assets.r2.dev （あなたのR2バケット名.r2.dev）
TTL: 3600
```

5. **Save** をクリック

### ステップ3: Cloudflare R2でカスタムドメインを接続

1. **Cloudflareダッシュボード** → **R2**
2. あなたのバケット（jazzify-assets）をクリック
3. **Settings** タブ → **Custom Domains**
4. **Connect Domain** をクリック
5. `cdn.jazzify.jp` を入力
6. **Continue** → **Connect domain**

## 設定完了後の構成

```
メインサイト: https://jazzify.jp → Netlify
画像・ファイル: https://cdn.jazzify.jp → Cloudflare R2
```

## 実装例

### 環境変数を更新
```env
# 開発環境
VITE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# 本番環境（カスタムドメイン設定後）
VITE_R2_PUBLIC_URL=https://cdn.jazzify.jp
```

### コードでの使用
```typescript
// 画像URLの例
const imageUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/images/photo.jpg`;
// → https://cdn.jazzify.jp/images/photo.jpg
```

## よくある質問

### Q: 設定にどれくらい時間がかかる？
**A:** 通常5-10分で反映されます。最大48時間かかる場合もあります。

### Q: SSLはどうなる？
**A:** Cloudflareが自動的にSSL証明書を発行します。追加設定不要。

### Q: 料金は？
**A:** カスタムドメイン自体は無料。R2の使用量のみ課金。

### Q: うまくいかない場合は？
**A:** 以下を確認：
1. CNAMEレコードが正しく設定されているか
2. R2バケット名が正しいか
3. DNS伝播を待つ（最大48時間）

## トラブルシューティング

### 「Custom domain is not pointing to this bucket」エラー
→ NetlifyのDNS設定が反映されるまで待つ（5-10分）

### 証明書エラーが出る
→ Cloudflareが証明書を発行中。通常10分以内に解決

## まとめ

1. **NetlifyのDNS管理は維持** ✅
2. **R2のカスタムドメインも使える** ✅
3. **設定は簡単（CNAMEレコード追加のみ）** ✅

これで、レート制限を気にせずR2を本番環境で使用できます！