# Stripe サブスクリプション設定ガイド

このガイドでは、Jazz Learning GameにStripeサブスクリプション機能を導入するための設定手順を説明します。

## 1. Stripe Dashboard設定

### 1.1 プロダクトとプライスの作成

Stripe Dashboardにログインし、以下のプロダクトとプライスを作成してください：

#### スタンダードプラン
- **プロダクト名**: `Standard Plan`
- **月額プライス**: ¥1,980/月
- **年額プライス**: ¥19,800/年 (2ヶ月分無料)

#### プレミアムプラン  
- **プロダクト名**: `Premium Plan`
- **月額プライス**: ¥8,980/月
- **年額プライス**: ¥89,800/年 (2ヶ月分無料)

#### プラチナプラン
- **プロダクト名**: `Platinum Plan`
- **月額プライス**: ¥14,800/月
- **年額プライス**: ¥148,000/年 (2ヶ月分無料)

#### ブラックプラン
- **プロダクト名**: `Black Plan`
- **月額プライス**: ¥19,800/月
- **年額プライス**: ¥198,000/年 (2ヶ月分無料)

### 1.2 Customer Portal設定

1. Stripe Dashboard → **Customer Portal** → **Settings**
2. 以下の機能を有効化：
   - ✅ Customer information updates
   - ✅ Invoice history
   - ✅ Update payment methods
   - ✅ Cancel subscriptions
   - ✅ Update subscriptions
   - ✅ Manage downgrade timing

### 1.3 Webhook Endpoint設定

1. Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint**をクリック
3. **Endpoint URL**: `https://your-site.netlify.app/.netlify/functions/stripeWebhook`
4. 以下のイベントを選択：
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 2. 環境変数設定

### 2.1 Netlify環境変数

Netlify Dashboard → **Site settings** → **Environment variables** で以下を設定：

```env
# Stripe設定
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# サイトURL
SITE_URL=https://your-site.netlify.app
```

### 2.2 フロントエンド環境変数

プロジェクトルートに `.env` ファイルを作成：

```env
# Stripe公開鍵
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price ID（Dashboardから取得）
VITE_STRIPE_STANDARD_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_STANDARD_YEARLY_PRICE_ID=price_...
VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
VITE_STRIPE_PLATINUM_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PLATINUM_YEARLY_PRICE_ID=price_...
VITE_STRIPE_BLACK_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_BLACK_YEARLY_PRICE_ID=price_...
```

## 3. Supabaseマイグレーション

データベースマイグレーションを適用してください：

```bash
npx supabase db push
```

または、Supabase Dashboard → **SQL Editor** で以下のマイグレーションを実行：

```sql
-- supabase/migrations/20250721120000_add_stripe_subscription_fields.sql
-- の内容を実行
```

## 4. 依存関係のインストール

```bash
npm install
```

## 5. デプロイと動作確認

### 5.1 デプロイ

```bash
npm run build
# Netlifyに自動デプロイ
```

### 5.2 動作確認

1. **プラン選択**: `https://your-site.netlify.app/#pricing`
2. **アカウント画面**: `https://your-site.netlify.app/#account`
3. **Stripe Checkout**: テストカード（`4242 4242 4242 4242`）で決済テスト
4. **Customer Portal**: 既存契約者でのプラン変更・解約テスト

## 6. トラブルシューティング

### Webhookが動作しない場合

1. Netlify Functions logs確認
2. Stripe Webhook署名の確認
3. 環境変数の確認

### 決済画面に遷移しない場合

1. CORS設定の確認
2. Price IDの確認
3. ブラウザコンソールエラーの確認

### Customer Portalが表示されない場合

1. Customer Portal設定の確認
2. stripe_customer_idの存在確認
3. 認証トークンの確認

## 7. 本番環境への移行

テスト環境で動作確認後、本番環境に移行：

1. Stripe Dashboardで本番モードに切り替え
2. 本番環境のAPIキーに更新
3. Webhook URLを本番環境に更新
4. 環境変数を本番用に更新

## 8. セキュリティチェックリスト

- [ ] APIキーがサーバーサイドのみで使用されている
- [ ] Webhook署名検証が実装されている
- [ ] HTTPS通信が使用されている
- [ ] 環境変数が適切に設定されている
- [ ] Supabase RLSが適切に設定されている

## 参考リンク

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Supabase Documentation](https://supabase.com/docs)