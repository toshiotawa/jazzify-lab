# Netlify と Cloudflare R2 のドメイン併用ガイド

## 結論：はい、併用できます！

NetlifyとCloudflare R2は、同じドメインの異なるサブドメインを使って共存できます。

## 併用パターン

### パターン1: Netlify DNSのまま使用（推奨）
**DNS管理はNetlifyのまま、R2用のサブドメインを追加**

```
構成例：
- www.jazzify.jp → Netlify（メインサイト）
- jazzify.jp → Netlify（メインサイト）
- cdn.jazzify.jp → Cloudflare R2（ファイルストレージ）
```

#### 設定手順
1. **Netlifyダッシュボードで設定**
   - Domain settings > DNS panel
   - 「Add new record」をクリック
   - 以下を追加：
   ```
   Type: CNAME
   Name: cdn
   Value: [あなたのR2バケット名].r2.dev
   TTL: 3600
   ```

2. **Cloudflare R2で設定**
   - R2バケット > Settings > Custom Domains
   - 「Connect Domain」で `cdn.jazzify.jp` を追加
   - CNAMEレコードの確認が完了するまで待つ

### パターン2: DNS管理をCloudflareに移管
**すべてのDNS管理をCloudflareで行う**

```
構成例：
- Cloudflareですべてのレコードを管理
- Netlifyへのレコードも設定
- R2へのレコードも設定
```

⚠️ **注意**: この方法は複雑で、ダウンタイムのリスクがあります

### パターン3: 別ドメインを使用
**メインサイトとR2で異なるドメインを使用**

```
構成例：
- jazzify.jp → Netlify（メインサイト）
- jazzify-cdn.com → Cloudflare R2（別ドメイン）
```

## 推奨構成の詳細（パターン1）

### なぜこれが最善か
- ✅ Netlifyの設定を変更不要
- ✅ ダウンタイムなし
- ✅ 設定がシンプル
- ✅ 管理が容易

### 具体的な設定例

#### 1. Netlify DNS設定
```
# 既存の設定（変更なし）
A     @     75.2.60.5
CNAME www   [your-site].netlify.app

# 新規追加
CNAME cdn   jazzify-assets.r2.dev
```

#### 2. アプリケーションでの使用
```typescript
// 環境変数
VITE_R2_PUBLIC_URL=https://cdn.jazzify.jp

// 使用例
const imageUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/images/photo.jpg`;
```

## 技術的な仕組み

### DNSの解決フロー
```
1. ユーザーが cdn.jazzify.jp にアクセス
2. DNS解決：
   - jazzify.jp のネームサーバー（Netlify）に問い合わせ
   - CNAMEレコードで jazzify-assets.r2.dev を返す
   - 最終的にCloudflare R2に到達
```

### メリット
- **独立性**: NetlifyとR2は独立して動作
- **柔軟性**: どちらかのサービスを変更しても影響なし
- **パフォーマンス**: 両方のCDNの恩恵を受けられる

## よくある質問

### Q: SSLはどうなりますか？
**A**: 両方で自動的にSSL証明書が発行されます
- `www.jazzify.jp` → NetlifyのSSL
- `cdn.jazzify.jp` → CloudflareのSSL

### Q: CORSの設定は必要ですか？
**A**: はい、R2バケットでCORS設定が必要です
```json
{
  "AllowedOrigins": ["https://jazzify.jp", "https://www.jazzify.jp"],
  "AllowedMethods": ["GET", "PUT", "POST"],
  "AllowedHeaders": ["*"]
}
```

### Q: 料金は増えますか？
**A**: 基本的に増えません
- Netlify DNS: 無料
- R2カスタムドメイン: 無料
- R2ストレージ: 使用量に応じた従量課金

## 実装チェックリスト

- [ ] Netlify DNSでCNAMEレコードを追加
- [ ] R2でカスタムドメインを設定
- [ ] 環境変数を更新
- [ ] CORS設定を確認
- [ ] アプリケーションのコードを更新
- [ ] テスト環境で動作確認

## まとめ

**NetlifyとCloudflare R2の併用は問題なく可能です！**

推奨される方法：
1. DNS管理はNetlifyのまま
2. R2用のサブドメイン（cdn.jazzify.jp）を追加
3. 両サービスが独立して動作

この方法なら、現在のNetlify設定を維持しながら、R2の高性能なストレージを活用できます。