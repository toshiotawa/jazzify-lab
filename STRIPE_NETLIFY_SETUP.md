# Stripe決済回り設定ガイド - Netlify環境変数・Webhook設定

このドキュメントでは、StripeのAPIキーや商品IDをNetlifyに設定する方法、およびテスト環境Webhookの設定方法を詳しく説明します。

## 📋 目次

1. [Stripe Dashboardでの準備](#1-stripe-dashboardでの準備)
2. [Netlify環境変数の設定](#2-netlify環境変数の設定)
3. [テスト環境Webhookの設定](#3-テスト環境webhookの設定)
4. [ステージング環境の設定](#4-ステージング環境の設定)
5. [動作確認](#5-動作確認)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. Stripe Dashboardでの準備

### 1.1 テストモードへの切り替え

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 右上の **「テストモード」** が有効になっていることを確認（トグルスイッチで切り替え可能）

### 1.2 APIキーの取得

1. Stripe Dashboard → **Developers** → **API keys** に移動
2. **Secret key** を表示（「Reveal test key」をクリック）
3. テスト環境のSecret keyは `sk_test_` で始まります
4. **Publishable key** も確認（`pk_test_` で始まります）

### 1.3 プロダクトとプライスの作成

1. Stripe Dashboard → **Products** → **Add product** をクリック

#### スタンダードプランの作成例

**プロダクト情報:**
- **Name**: `Standard Plan`
- **Description**: `Jazz Learning Game Standard Plan`（任意）

**プライス情報（月額）:**
- **Pricing model**: `Standard pricing`
- **Price**: `1980`
- **Billing period**: `Monthly`
- **Currency**: `JPY (¥)`
- **Create price** をクリック

**⚠️ 重要**: 
- すべてのプランには **1週間（7日間）の無料トライアル期間** が自動的に付与されます
- トライアル期間中はプランの切り替えが自由に行えます
- トライアル終了時に選択されていたプランで自動的に決済が開始されます

**作成後:**
- 作成されたプライスのID（`price_` で始まる）をコピー
- 例: `price_1ABC123DEF456GHI`

同様に以下のプランを作成してください：

| プラン名 | 月額価格 | Price ID（後で使用） |
|---------|---------|---------------------|
| Standard Plan | ¥1,980 | `price_...` |
| Premium Plan | ¥8,980 | `price_...` |
| Platinum Plan | ¥14,800 | `price_...` |
| Black Plan | ¥19,800 | `price_...` |

⚠️ **重要**: 各プライスのIDは後でNetlifyの環境変数に設定します。必ずメモしてください。

---

## 2. Netlify環境変数の設定

### 2.1 Netlify管理画面へのアクセス

1. [Netlify Dashboard](https://app.netlify.com/) にログイン
2. 対象のサイトを選択

### 2.2 環境変数の設定手順

1. **Site settings** → **Environment variables** に移動
2. **Add a variable** をクリック

### 2.3 設定する環境変数一覧

以下の環境変数を順番に設定します：

#### 🔐 サーバーサイド環境変数（Netlify Functions用）

これらの変数はすべての環境（Production, Deploy previews, Branch deploys）で設定してください。

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|---------|-----|
| `STRIPE_SECRET_KEY` | Stripe Secret Key | Stripe Dashboard → Developers → API keys | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook署名検証用シークレット | Webhook設定後（後述） | `whsec_...` |
| `SUPABASE_URL` | SupabaseプロジェクトURL | Supabase Dashboard → Project settings → API | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Supabase Dashboard → Project settings → API | `eyJhbGc...` |
| `SITE_URL` | サイトのURL | Netlifyのデフォルトドメインまたはカスタムドメイン | `https://your-site.netlify.app` |

**必須ポイント**: `SITE_URL` は必ず `https://` などのスキームを含む完全なURLを設定してください。未設定や `https://` の付与忘れがあると、Stripe Checkout や Customer Portal へのリダイレクトでエラーが発生します。Branch Deploy / Deploy Preview を利用する際は、それぞれの環境に対応するURLを設定しておくと安全です。

#### 🖥️ クライアントサイド環境変数（フロントエンド用）

これらの変数は `VITE_` プレフィックスが必要です。Netlifyのビルド時に環境変数として注入されます。

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|---------|-----|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公開鍵 | Stripe Dashboard → Developers → API keys | `pk_test_...` |
| `VITE_STRIPE_STANDARD_MONTHLY_PRICE_ID` | Standard月額Price ID | Stripe Dashboard → Products → 該当プライス | `price_...` |
| `VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID` | Premium月額Price ID | Stripe Dashboard → Products → 該当プライス | `price_...` |
| `VITE_STRIPE_PLATINUM_MONTHLY_PRICE_ID` | Platinum月額Price ID | Stripe Dashboard → Products → 該当プライス | `price_...` |
| `VITE_STRIPE_BLACK_MONTHLY_PRICE_ID` | Black月額Price ID | Stripe Dashboard → Products → 該当プライス | `price_...` |

### 2.4 環境変数の設定方法（詳細）

各環境変数を設定する際の注意点：

#### ステップ1: 変数を追加

1. **Add a variable** をクリック
2. **Key** フィールドに変数名を入力（例: `STRIPE_SECRET_KEY`）
3. **Values** セクションで以下を設定：

#### ステップ2: 環境別の値の設定

Netlifyでは以下の3つの環境で異なる値を設定できます：

- **Production**: 本番環境（`main`ブランチ）
- **Deploy previews**: PRやブランチプレビュー
- **Branch deploys**: 特定ブランチ（例: `stg`ブランチ）

**テスト環境では全て同じ値を設定してください。** 本番環境に移行する際に、Production環境のみ本番用の値に変更します。

#### ステップ3: 保存

1. **Save** をクリック
2. 次の変数を追加

### 2.5 環境変数の確認

設定後、以下の方法で確認できます：

1. **Environment variables** ページで一覧表示
2. **Functions** → **Functions logs** でログ出力して確認（デバッグ時のみ）

⚠️ **セキュリティ注意**: `STRIPE_SECRET_KEY` や `SUPABASE_SERVICE_ROLE_KEY` は絶対にフロントエンドコードやGitにコミットしないでください。

---

## 3. テスト環境Webhookの設定

### 3.1 Webhook Endpoint URLの準備

Webhook URLは以下の形式です：

```
https://[your-site-name].netlify.app/.netlify/functions/stripeWebhook
```

例：
- デフォルトドメイン: `https://jazzgame.netlify.app/.netlify/functions/stripeWebhook`
- カスタムドメイン: `https://jazzify.jp/.netlify/functions/stripeWebhook`

⚠️ **重要**: サイトがデプロイ済みである必要があります。まだデプロイしていない場合は先にデプロイしてください。

### 3.2 Stripe DashboardでのWebhook設定

1. Stripe Dashboard → **Developers** → **Webhooks** に移動
2. **Add endpoint** をクリック

#### エンドポイント情報の入力

- **Endpoint URL**: 上記で準備したURLを入力
  - 例: `https://your-site.netlify.app/.netlify/functions/stripeWebhook`
- **Description**: `Netlify Functions - Test Mode`（任意）

#### イベントの選択

以下のイベントを選択してください：

**必須イベント（サブスクリプション管理）:**
- ✅ `customer.subscription.created` - サブスクリプション作成時
- ✅ `customer.subscription.updated` - サブスクリプション更新時（トライアル期間中のプラン変更を含む）
- ✅ `customer.subscription.deleted` - サブスクリプション削除時
- ✅ `customer.subscription.trial_will_end` - トライアル終了3日前の通知

**必須イベント（決済・インボイス）:**
- ✅ `checkout.session.completed` - チェックアウト完了時（即座にサブスクリプションを反映）
- ✅ `invoice.created` - インボイス作成時（トライアル終了時の初回請求を検知）
- ✅ `invoice.payment_succeeded` - 支払い成功時（トライアル終了後の決済開始を確認）
- ✅ `invoice.payment_failed` - 支払い失敗時

#### エンドポイントの作成

1. **Add endpoint** をクリック
2. エンドポイントが作成されると、**Signing secret** が表示されます
3. **Signing secret** の「Reveal」をクリックしてシークレットをコピー
   - 例: `whsec_1ABC123DEF456GHI789JKL012MNO345`

### 3.3 Webhook Secretの設定

コピーした **Signing secret** を Netlify の環境変数 `STRIPE_WEBHOOK_SECRET` に設定してください：

1. Netlify Dashboard → **Site settings** → **Environment variables**
2. `STRIPE_WEBHOOK_SECRET` を編集（既存の場合は編集、ない場合は追加）
3. コピーしたシークレットを貼り付け
4. **Save** をクリック

### 3.4 Webhookのテスト

#### Stripe CLIを使用したテスト（推奨）

ローカル環境でテストする場合：

```bash
# Stripe CLIのインストール（未インストールの場合）
# macOS: brew install stripe/stripe-cli/stripe
# Windows: choco install stripe

# Stripe CLIでログイン
stripe login

# Webhookをローカルでリッスン（Netlify Functionsをローカル実行）
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripeWebhook

# 別のターミナルでテストイベントを送信
stripe trigger customer.subscription.created
```

#### Stripe Dashboardから手動でテスト

1. Stripe Dashboard → **Developers** → **Webhooks**
2. 作成したエンドポイントをクリック
3. **Send test webhook** をクリック
4. イベントタイプを選択（例: `customer.subscription.created`）
5. **Send test webhook** をクリック
6. Netlify Functions logs でレスポンスを確認

### 3.5 Webhookの動作確認

1. Netlify Dashboard → **Functions** → **Functions logs** に移動
2. イベント送信後にログが表示されることを確認
3. エラーがないか確認

正常な場合のログ例：
```
Updated user [user-id] subscription to standard
```

エラーの場合のログ例：
```
Webhook signature verification failed: ...
```

---

## 4. ステージング環境の設定

ステージング環境（`stg`ブランチなど）用に別のWebhookエンドポイントを設定する場合：

### 4.1 ステージング用Webhookの作成

1. Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint** をクリック
3. **Endpoint URL**: `https://stg-your-site.netlify.app/.netlify/functions/stripeWebhook`
   - または: `https://your-site--stg.netlify.app/.netlify/functions/stripeWebhook`
4. 同じイベントを選択
5. **Signing secret** をコピー

### 4.2 ステージング環境変数の設定

Netlifyで以下のように設定：

1. **Site settings** → **Environment variables**
2. `STRIPE_WEBHOOK_SECRET` を編集
3. **Branch deploys (stg)** にステージング用のWebhook Secretを設定
4. `SITE_URL` もステージング用のURLに設定

これにより、`stg`ブランチのデプロイ時のみステージング用の値が使用されます。

---

## 5. 動作確認

### 5.1 チェックアウトフローの確認

1. サイトにアクセス（例: `https://your-site.netlify.app`）
2. ログイン
3. **プラン選択ページ** (`/#pricing`) に移動
4. プランを選択
5. Stripe Checkout画面にリダイレクトされることを確認
6. テストカードを使用：
   - **カード番号**: `4242 4242 4242 4242`
   - **有効期限**: 未来の日付（例: `12/34`）
   - **CVC**: 任意の3桁（例: `123`）
   - **郵便番号**: 任意（例: `1234567`）

7. **トライアル期間中の動作確認**:
   - チェックアウト完了後、即座に選択したプランが有効化されることを確認（`checkout.session.completed` イベント）
   - トライアル期間中にCustomer Portalでプラン変更できることを確認
   - プラン変更後、`customer.subscription.updated` イベントで正しく反映されることを確認
   - トライアル終了3日前に `customer.subscription.trial_will_end` イベントが送信されることを確認（Stripe Dashboard → Events）
   - トライアル終了時に `invoice.created` → `invoice.payment_succeeded` の順でイベントが送信されることを確認

### 5.2 サブスクリプション状態の確認

1. 決済完了後、アカウントページ (`/#account`) にリダイレクト
2. サブスクリプション状態が正しく表示されることを確認
3. Supabase Dashboard → **Table Editor** → `profiles` テーブルで以下を確認：
   - `stripe_customer_id` が設定されている
   - `rank` が正しいプランに更新されている

### 5.3 Webhookの動作確認

1. Stripe Dashboard → **Developers** → **Events**
2. 最新のイベントを確認
3. Webhookイベントが成功していることを確認（緑色のチェックマーク）
4. Netlify Functions logs で処理ログを確認

---

## 6. トラブルシューティング

### 6.1 チェックアウト画面に遷移しない

**症状**: プランを選択してもStripe Checkoutにリダイレクトされない

**確認項目**:
1. ブラウザコンソールのエラーを確認
2. Netlify Functions logs でエラーを確認
3. 環境変数 `VITE_STRIPE_*_MONTHLY_PRICE_ID` が正しく設定されているか
4. 環境変数 `STRIPE_SECRET_KEY` が正しく設定されているか
5. `SITE_URL` が正しく設定されているか

**解決方法**:
- 環境変数を再確認し、再デプロイ
- 関数のログで詳細なエラーメッセージを確認

### 6.2 Webhookが動作しない

**症状**: StripeからWebhookが送信されても処理されない

**確認項目**:
1. Netlify Functions logs でエラーを確認
2. `STRIPE_WEBHOOK_SECRET` が正しく設定されているか
3. Webhook URLが正しいか（Stripe Dashboardで確認）
4. Webhookの署名検証が失敗していないか

**エラーログ例**:
```
Webhook signature verification failed: ...
```

**解決方法**:
1. Stripe DashboardでWebhook Endpointの **Signing secret** を再取得
2. Netlifyの `STRIPE_WEBHOOK_SECRET` を更新
3. サイトを再デプロイ

### 6.3 サブスクリプション状態が更新されない

**症状**: 決済は成功したが、アプリ内のプランが更新されない

**確認項目**:
1. Supabase Dashboard → `profiles` テーブルで `rank` を確認
2. Webhookイベントが正しく処理されているか（Stripe Dashboard → Events）
3. Netlify Functions logs で `updateUserSubscription` のログを確認

**解決方法**:
1. Webhookが正しく処理されているか確認
2. SupabaseのRLS（Row Level Security）設定を確認
3. `SUPABASE_SERVICE_ROLE_KEY` が正しく設定されているか確認

### 6.4 環境変数が読み込まれない

**症状**: ビルドは成功するが、実行時に環境変数が `undefined`

**確認項目**:
1. フロントエンド変数は `VITE_` プレフィックスが必要
2. サーバーサイド変数（Netlify Functions）は `process.env.` でアクセス
3. 変数名のタイポがないか

**解決方法**:
1. 環境変数名を再確認
2. サイトを再デプロイ（環境変数の変更は再デプロイが必要）
3. Netlify Functions logs で実際の値を確認（デバッグ時のみ）

### 6.5 CORSエラー

**症状**: ブラウザコンソールにCORSエラーが表示される

**確認項目**:
- Netlify Functions のCORS設定を確認（`createCheckoutSession.ts` など）
- リクエストのURLが正しいか

**解決方法**:
- 関数内のCORSヘッダー設定を確認
- `Access-Control-Allow-Origin` が正しく設定されているか確認

---

## 7. 本番環境への移行

テスト環境で動作確認後、本番環境に移行する手順：

### 7.1 Stripe本番モードへの切り替え

1. Stripe Dashboardで **「本番モード」** に切り替え
2. **本番環境のAPIキー** を取得
   - `sk_live_...` (Secret key)
   - `pk_live_...` (Publishable key)
3. **本番環境のプロダクト・プライス** を作成（テスト環境とは別）

### 7.2 Netlify環境変数の更新

1. Netlify Dashboard → **Site settings** → **Environment variables**
2. 以下の変数を **Production環境のみ** 本番用の値に更新：
   - `STRIPE_SECRET_KEY` → 本番環境の値 (`sk_live_...`)
   - `VITE_STRIPE_PUBLISHABLE_KEY` → 本番環境の値 (`pk_live_...`)
   - `VITE_STRIPE_*_MONTHLY_PRICE_ID` → 本番環境のPrice ID

### 7.3 本番環境Webhookの設定

1. Stripe Dashboard → **Developers** → **Webhooks**
2. **本番モード**で新しいエンドポイントを作成
3. **Endpoint URL**: 本番サイトのURL
4. **Signing secret** を取得してNetlifyに設定（Production環境のみ）

### 7.4 デプロイと動作確認

1. `main`ブランチにマージ・デプロイ
2. 本番環境で決済フローをテスト
3. 本番環境のWebhookをテスト

---

## 8. セキュリティチェックリスト

- [ ] `STRIPE_SECRET_KEY` がサーバーサイドのみで使用されている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` がサーバーサイドのみで使用されている
- [ ] Webhook署名検証が実装されている（`stripeWebhook.ts`）
- [ ] HTTPS通信が使用されている
- [ ] 環境変数がNetlifyで適切に設定されている（Gitにコミットされていない）
- [ ] Supabase RLSが適切に設定されている
- [ ] テスト環境と本番環境で異なるAPIキーを使用している

---

## 9. 参考リンク

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Supabase Documentation](https://supabase.com/docs)

---

## 10. よくある質問（FAQ）

### Q: 環境変数を変更した後、どうすれば反映されますか？

A: Netlifyでは環境変数の変更後に **再デプロイが必要** です。手動でデプロイするか、コードをプッシュして自動デプロイをトリガーしてください。

### Q: テストモードと本番モードで同じWebhookエンドポイントを使えますか？

A: できますが、**推奨されません**。テスト環境と本番環境で別々のエンドポイントを作成し、それぞれ異なる `STRIPE_WEBHOOK_SECRET` を設定することを推奨します。

### Q: Price IDを変更するにはどうすればいいですか？

A: Stripe Dashboardで新しいプライスを作成し、Netlifyの環境変数 `VITE_STRIPE_*_MONTHLY_PRICE_ID` を更新して再デプロイしてください。

### Q: Webhookが複数回送信されることはありますか？

A: StripeはWebhookの配信を保証するため、同じイベントが複数回送信される可能性があります。実装では冪等性を考慮する必要があります（現在の実装では問題ありません）。

---

このガイドで問題が解決しない場合は、プロジェクトのIssuesで質問してください。
