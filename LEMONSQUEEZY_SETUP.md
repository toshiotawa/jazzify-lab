# Lemon Squeezy テストモード セットアップガイド

## 概要

Jazz Learning Game の海外ユーザー向け **Standard (Global) プラン** の月額サブスクリプションを、Lemon Squeezy のテストモードで実装するための完全ガイドです。

### 現在の実装状況

| 項目 | 状態 |
|------|------|
| Netlify Functions (Webhook / Portal / Checkout) | 実装済み |
| Supabase マイグレーション (lemon_* カラム) | 実装済み |
| フロントエンド (PricingTable / AccountModal) | 実装済み |
| Lemon Squeezy ダッシュボード設定 | **未完了** |
| 環境変数設定 | **未完了** |
| Webhook エンドポイント登録 | **未完了** |
| テスト検証 | **未完了** |

---

## ロードマップ

```
Phase 1: Lemon Squeezy ダッシュボード設定 (30分)
  ├── Step 1: テストモード有効化 & APIキー発行
  ├── Step 2: ストアID確認
  ├── Step 3: 商品 (Product) 作成
  ├── Step 4: バリアント (Variant) 作成 ×2
  └── Step 5: Webhook エンドポイント設定

Phase 2: 環境変数設定 (15分)
  ├── Step 6: Netlify 環境変数設定
  └── Step 7: .env.example 更新確認

Phase 3: Supabase 確認 (10分)
  └── Step 8: マイグレーション適用確認

Phase 4: デプロイ & テスト (30分)
  ├── Step 9: デプロイ
  ├── Step 10: Webhook 疎通テスト
  └── Step 11: E2E サブスクリプションテスト
```

---

## Phase 1: Lemon Squeezy ダッシュボード設定

### Step 1: テストモード有効化 & APIキー発行

1. **Lemon Squeezy ダッシュボードにログイン**
   - https://app.lemonsqueezy.com にアクセス

2. **テストモードに切り替え**
   - 画面上部のトグルスイッチで **「Test mode」** をONにする
   - 左上のストア名の横にオレンジ色の `TEST` バッジが表示されることを確認

3. **APIキーを発行**
   - 左メニュー: **Settings** → **API**
   - 「+ Create API Key」をクリック
   - 名前: `jazz-learning-game-test` (任意)
   - 生成されたキーを **安全な場所にコピー**（二度と表示されません）
   - キーの形式: `eyJ...` (長いJWTトークン)

> **重要**: テストモードでAPIキーを発行すると、テスト環境専用のキーになります。本番モードでは別のキーを発行してください。

### Step 2: ストアID確認

1. **Settings** → **General** に移動
2. URLバーを確認: `https://app.lemonsqueezy.com/settings/general`
3. **Store ID** を確認する方法:
   - Settings → API → 「Store」セクションに表示される数値
   - または URL: `https://api.lemonsqueezy.com/v1/stores` を API キーで呼び出して確認

```bash
# APIで確認する場合（ターミナルで実行）
curl -s https://api.lemonsqueezy.com/v1/stores \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/vnd.api+json" | python3 -m json.tool
```

レスポンスの `data[0].id` がストアIDです（例: `12345`）。

### Step 3: 商品 (Product) を作成

1. 左メニュー: **Store** → **Products**
2. 「+ New Product」をクリック
3. 以下の情報を入力:

| 項目 | 値 |
|------|-----|
| **Product name** | `Standard Global Plan` |
| **Description** | `Jazz Learning Game - Standard (Global) subscription plan for international users` |
| **Status** | Published |
| **Pricing** | ここでは設定しない（バリアントで設定） |

4. 「Save」で保存

### Step 4: バリアント (Variant) を2つ作成

商品を作成したら、**2つのバリアント**を作成します:
- **通常版** (トライアルなし)
- **トライアル版** (7日間無料トライアル付き)

#### バリアント A: 通常版（トライアルなし）

1. 作成した商品ページ → **Variants** タブ
2. デフォルトバリアントを編集、または「+ Add variant」
3. 設定:

| 項目 | 値 |
|------|-----|
| **Variant name** | `Monthly` |
| **Price** | `$9.99` (または任意の月額料金) |
| **Pricing model** | Subscription |
| **Billing period** | Monthly |
| **Free trial** | なし (チェックを外す) |

4. 「Save」で保存
5. **Variant ID をメモ**: URLバーの数値、またはバリアント一覧の ID

#### バリアント B: トライアル版（7日間無料トライアル）

1. 「+ Add variant」で新規バリアントを追加
2. 設定:

| 項目 | 値 |
|------|-----|
| **Variant name** | `Monthly (Trial)` |
| **Price** | `$9.99` (通常版と同額) |
| **Pricing model** | Subscription |
| **Billing period** | Monthly |
| **Free trial** | **7 days** (チェックON、7日に設定) |

3. 「Save」で保存
4. **Variant ID をメモ**

#### Variant IDの確認方法

```bash
# APIでバリアントIDを確認
curl -s "https://api.lemonsqueezy.com/v1/variants?filter[product_id]=YOUR_PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/vnd.api+json" | python3 -m json.tool
```

レスポンスの各バリアントの `data[].id` をメモしてください。

### Step 5: Webhook エンドポイント設定

1. 左メニュー: **Settings** → **Webhooks**
2. 「+ Create Webhook」をクリック
3. 設定:

| 項目 | 値 |
|------|-----|
| **Callback URL** | `https://YOUR_SITE.netlify.app/.netlify/functions/lemonsqueezyWebhook` |
| **Signing Secret** | 自動生成される値を **コピーしてメモ** |
| **Events** | 以下を選択 |

**選択するイベント:**
- `subscription_created`
- `subscription_updated`
- `subscription_payment_success`
- `subscription_cancelled`
- `subscription_expired`
- `subscription_resumed`
- `subscription_paused`
- `order_created`
- `order_refunded`

> **プラン判定**: Webhook の `data.attributes.variant_id` を source of truth とする。checkout の `custom_data.plan` は使わない。Netlify `lemonsqueezyWebhook` が `subscriptions.plan_code` を更新する。

> **UX (A案)**: Jazzify 側モーダルでは月額/年額を選ばず、Lemon チェックアウト画面で選択する。checkout API は `enabled_variants` で月額・年額両方を表示する。

4. 「Save」で保存

> **注意**: テストモードで作成したWebhookはテスト環境専用です。本番移行時に再作成が必要です。

> **重要**: Webhook URL は **Netlify `lemonsqueezyWebhook` のみ** を登録すること。Supabase Edge `lemon-webhook` は deprecated（イベント記録のみ）であり、ダッシュボードに登録しないこと。二重 webhook により `plan_code` / `trial` 状態が上書きされる事故を防ぐ。

#### 年額バリアント（追加）

月額と同様に、**trial なし年額** と **trial あり年額** の 2 バリアントを作成する（計 4 variant）:

| バリアント | env 変数（優先名） |
|-----------|-------------------|
| 月額（trial なし） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM` |
| 月額（trial あり） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL` |
| 年額（trial なし） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY` |
| 年額（trial あり） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL` |

### Step 6: Customer Portal 設定

**Store → Design → Portal** タブで、カード変更以外は Jazzify 自前 UI に委譲する。

**ON（表示）**

| 項目 | 理由 |
|------|------|
| Payment methods | カード変更（Jazzify は `update_payment_method` URL も使用） |

**OFF（非表示）**

| 項目 | 理由 |
|------|------|
| Cancel subscriptions | 解約は Jazzify `#account` 自前 API |
| Billing history | 請求履歴は Jazzify `#account` 自前表示（`billing_invoices` DB） |
| Pause subscriptions | Jazzify 側で制御 |
| Update subscription plans | プラン変更は Jazzify API |
| Update subscription quantity | 未使用 |
| Discounts / License keys / Files / Expired subscriptions | 未使用 |

> Portal で非表示にしても Lemon API 経由の操作は可能なため、Jazzify 側でも状態ガード（`lemonsqueezyChangePlan` 等）を必ず通す。

---

## USD ストア（英語圏ユーザー向け）

`profiles.preferred_locale = 'en'` で登録したユーザー（Web の en.jazzify.jp、iOS で英語圏と判定されたユーザー含む）向けの **別ストア** です。通貨は USD、既存 JPY 加入者には影響しません。

### 対象ユーザーと通貨の決まり方

| 条件 | billing_currency | 使うストア |
|------|------------------|-----------|
| `preferred_locale = 'en'` かつ Lemon 未加入 | USD | USD ストア |
| `preferred_locale = 'ja'` かつ Lemon 未加入 | JPY | JPY ストア |
| 既に Lemon 課金履歴あり（JPY 加入・トライアル含む） | JPY（固定） | JPY ストア |

DB カラム `profiles.billing_currency` に保存され、Checkout（`lemonsqueezyResolveLink`）で参照されます。

### Step USD-1: USD ストアで Product / Variant を作成

JPY ストアと **同じ Premium 商品構成** で 4 variant を作成します。

| Lemon ダッシュボードでの設定 | env 変数 | 価格 | トライアル |
|------------------------------|----------|------|-----------|
| Premium Monthly | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD` | **$24.99 / month** | なし |
| Premium Monthly（Trial） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD` | **$24.99 / month** | **7日無料** |
| Premium Yearly | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD` | **$199 / year** | なし |
| Premium Yearly（Trial） | `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD` | **$199 / year** | **7日無料** |

**Variant ID の確認方法**

1. Lemon Squeezy → **Products** → Premium 商品を開く
2. 各 Variant の行をクリック → URL 末尾の数値、または API の `variants/{id}` が ID
3. 4 つすべて Netlify の Environment variables に設定（**1 つでも欠けると Checkout が 500 エラー**）

### 各 env 変数の詳細

#### `LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD`（月額・trial なし）

- **価格**: $24.99 / month（USD）
- **Checkout**: `lemon_trial_used = true` のユーザー、または USD ストアに同一メールの customer が既にある場合
- **プラン変更**: 年額 → 月額への切替予約（`lemonsqueezyChangePlan`）で使用
- **Webhook**: `variant_id` から `plan_code = core_monthly` にマップ

#### `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD`（月額・7日 trial あり）

- **価格**: 7 日間 $0 → 以降 $24.99 / month
- **Checkout**: 初回加入可能ユーザー（trial 未使用）が Checkout で **月額** を選んだ場合
- **Lemon 設定**: Variant の Subscription → Free trial = **7 days**
- **Webhook**: trial 開始時に `lemon_trial_used` を true に更新

#### `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD`（年額・trial なし）

- **価格**: $199 / year（月換算 $16.58、月額比 $100.88 お得）
- **Checkout**: trial 使用済みユーザーの Checkout、**デフォルトで選択される variant**（年額が最初に表示）
- **プラン変更**: 月額 → 年額への切替予約で使用
- **Webhook**: `plan_code = core_yearly` にマップ

#### `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD`（年額・7日 trial あり）

- **価格**: 7 日間 $0 → 以降 $199 / year
- **Checkout**: 初回加入可能ユーザーが Checkout で **年額** を選んだ場合（推奨プラン）
- **Lemon 設定**: Free trial = **7 days**
- **表示**: en.jazzify.jp LP / Web ペイウォールの「$199/year after 7 days」と一致させる

### Checkout での variant 選択ロジック（参考）

```
trial 対象ユーザー（初回）:
  enabled_variants = [PREMIUM_TRIAL_USD, PREMIUM_YEARLY_TRIAL_USD]
  デフォルト選択   = PREMIUM_YEARLY_TRIAL_USD（年額）

trial 非対象ユーザー:
  enabled_variants = [PREMIUM_USD, PREMIUM_YEARLY_USD]
  デフォルト選択   = PREMIUM_YEARLY_USD（年額）
```

実装: `netlify/functions/lib/lemonPlanCatalog.ts` の `resolveCheckoutVariants(trial, 'USD')`

### Step USD-2: USD ストア用 Webhook

- **Callback URL**: JPY と同じ `https://YOUR_SITE.netlify.app/.netlify/functions/lemonsqueezyWebhook`
- **Signing secret** → `LEMONSQUEEZY_WEBHOOK_SECRET_USD`（JPY 用 `_WEBHOOK_SECRET` とは別）
- 署名検証は JPY / USD 両シークレットを試行（どちらか一致すれば OK）

### Step USD-3: Netlify 環境変数（USD 分）

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `LEMONSQUEEZY_STORE_ID_USD` | ✅ | USD ストア ID |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD` | ✅ | 月額 $24.99（trial なし） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD` | ✅ | 月額 $24.99（7日 trial） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD` | ✅ | 年額 $199（trial なし） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD` | ✅ | 年額 $199（7日 trial） |
| `LEMONSQUEEZY_WEBHOOK_SECRET_USD` | ✅ | USD ストア Webhook 署名 |

> **API キーは共通**: `LEMONSQUEEZY_API_KEY` は JPY / USD どちらのストアも同じアカウント内なら 1 つで可。

---

## Phase 2: 環境変数設定

### Step 6: Netlify 環境変数設定

**Netlify Dashboard** → **Site configuration** → **Environment variables** で以下を追加:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `LEMONSQUEEZY_API_KEY` | `eyJ...` (Step 1で取得) | テストモードAPIキー |
| `LEMONSQUEEZY_STORE_ID` | `12345` (Step 2で確認) | ストアID |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL` | `67890` (Step 4-Aで取得) | 通常版バリアントID |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL` | `67891` (Step 4-Bで取得) | トライアル版バリアントID |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | `whsec_...` (Step 5で取得) | Webhook署名検証用シークレット |

> **既存の環境変数**（以下は設定済みの前提）:
> - `SUPABASE_URL`
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `SITE_URL`

### Step 7: .env.example 更新確認

プロジェクトの `.env.example` にLemon Squeezy関連の項目を追記する必要があります（フロントエンド側の環境変数は不要 — Lemon Squeezyの処理はすべてNetlify Functions経由で行われるため）。

```env
# ===== Lemon Squeezy Configuration (Netlify Functions) =====
# Note: These should be set in Netlify Dashboard, not in .env
# LEMONSQUEEZY_API_KEY=eyJ...
# LEMONSQUEEZY_STORE_ID=12345
# LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL=67890
# LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL=67891
# LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...
```

---

## Phase 3: Supabase 確認

### Step 8: マイグレーション適用確認

以下のマイグレーションが適用されていることを確認してください:

**ファイル**: `supabase/migrations/20250920090000_add_lemonsqueezy_fields.sql`

```sql
-- 追加されるカラム:
-- profiles.lemon_customer_id (text)
-- profiles.lemon_subscription_id (text)
-- profiles.lemon_subscription_status (text)
-- profiles.lemon_trial_used (boolean, default false)
```

**確認方法:**

```bash
# Supabase CLIで確認
npx supabase db push --dry-run

# または Supabase Dashboard → SQL Editor で確認:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'lemon_%';
```

4行のカラムが返ってくればOKです。まだ適用されていない場合:

```bash
npx supabase db push
```

---

## Phase 4: デプロイ & テスト

### Step 9: デプロイ

```bash
git add .
git commit -m "chore: configure Lemon Squeezy environment"
git push
```

Netlifyで自動デプロイされるのを待つか、手動でトリガーしてください。

### Step 10: Webhook 疎通テスト

1. **Lemon Squeezy Dashboard** → **Settings** → **Webhooks**
2. 作成したWebhookの **「Send test」** ボタンをクリック
3. Netlify Functions のログを確認:
   - Netlify Dashboard → **Logs** → **Functions**
   - `lemonsqueezyWebhook` の実行ログを確認
4. ステータスコード `200` が返ることを確認

### Step 11: E2E サブスクリプションテスト

#### 11-1. 新規サブスクリプション（トライアル付き）

1. テスト用のユーザーアカウントを作成（海外ユーザーとして）
   - Supabase で `profiles.country` を `US` に設定
2. `#pricing` ページまたは `#account` ページから「プランを選択」をクリック
3. Lemon Squeezy のチェックアウトページにリダイレクトされることを確認
4. **テストカード** で決済:

| 項目 | 値 |
|------|-----|
| **カード番号** | `4242 4242 4242 4242` |
| **有効期限** | 任意の未来日 (例: `12/30`) |
| **CVC** | 任意の3桁 (例: `123`) |
| **名前** | 任意 |
| **メール** | Supabaseに登録したメールアドレス |

5. 決済完了後、Webhookが発火して以下が更新されることを確認:
   - `profiles.lemon_customer_id` が設定される
   - `profiles.lemon_subscription_id` が設定される
   - `profiles.lemon_subscription_status` = `on_trial` または `active`
   - `profiles.rank` = `standard_global`
   - `profiles.lemon_trial_used` = `true`

#### 11-2. 請求履歴（Jazzify 自前）

1. `#account` ページで「請求履歴を見る」をクリック
2. 日付・金額・プラン名・ステータス・領収書リンクが表示されることを確認
3. 解約→再契約後も、過去の請求が一覧に残ることを確認（`billing_invoices`）

#### 11-3. 解約テスト

1. `#account` ページで「解約する」→ 確認モーダルで解約予約
2. Webhook / cron 適用後、以下が更新されることを確認:
   - `subscriptions` の解約予定状態
   - 期間終了までは Premium 利用可能

> 解約は Lemon Customer Portal ではなく Jazzify 自前 API（`lemonsqueezyCancelSubscription`）経由。

---

## コード構成（参考）

既に実装済みのファイル一覧:

```
netlify/functions/
├── lemonsqueezyWebhook.ts              # Webhook（subscription_* → entitlement + billing_*、invoice → billing_invoices のみ）
├── lemonsqueezyBillingLink.ts          # update_payment_method URL
├── lemonsqueezyInvoices.ts             # 請求履歴（billing_invoices DB 読み取り）
├── lemonsqueezyBackfillBillingHistory.ts  # 管理者向け billing_* バックフィル
├── lemonsqueezyResolveLink.ts          # チェックアウト URL
├── lemonsqueezyChangePlan.ts           # プラン変更予約
├── lemonsqueezyCancelSubscription.ts   # 解約予約
└── lib/
    ├── lemonInvoiceMirror.ts
    ├── lemonBillingSubscriptionMirror.ts
    ├── lemonBillingPersistence.ts
    └── lemonBillingWebhookHandlers.ts

src/components/ui/
└── AccountModal.tsx        # アカウント管理（請求履歴・プラン変更・解約・カード変更）

supabase/migrations/
├── 20250920090000_add_lemonsqueezy_fields.sql
└── 20260614120000_create_billing_history_tables.sql
    - billing_customers, billing_subscriptions, billing_invoices
```

---

## 環境変数一覧（まとめ）

### Netlify Dashboard で設定する変数

| 変数名 | 本番/テスト | 説明 |
|--------|------------|------|
| `LEMONSQUEEZY_API_KEY` | テストモードキー | API認証 |
| `LEMONSQUEEZY_STORE_ID` | 共通 | ストア識別 |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL` | テスト用バリアントID | 通常月額（レガシー名） |
| `LEMONSQUEEZY_VARIANT_ID_STANDARD_GLOBAL_TRIAL` | テスト用バリアントID | トライアル付き月額（レガシー名） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM` | テスト用バリアントID | 通常月額 |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL` | テスト用バリアントID | トライアル付き月額 |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY` | テスト用バリアントID | 通常年額 |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL` | テスト用バリアントID | トライアル付き年額 |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | テスト用シークレット | JPYストア Webhook署名検証 |
| `LEMONSQUEEZY_STORE_ID_USD` | USDストアID | 英語圏ユーザー向け USD ストア（`billing_currency=USD`） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_USD` | 必須 | 月額 **$24.99/月**・trial なし。trial 済 Checkout・月額プラン変更用 |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_TRIAL_USD` | 必須 | 月額 **$24.99/月**・**7日無料** trial。初回 Checkout（月額選択時） |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_USD` | 必須 | 年額 **$199/年**・trial なし。trial 済 Checkout・年額プラン変更用・Checkout デフォルト |
| `LEMONSQUEEZY_VARIANT_ID_PREMIUM_YEARLY_TRIAL_USD` | 必須 | 年額 **$199/年**・**7日無料** trial。初回 Checkout（年額選択時・推奨） |
| `LEMONSQUEEZY_WEBHOOK_SECRET_USD` | 必須 | USD ストア Webhook 署名（URL は JPY と同一 `lemonsqueezyWebhook`） |
| `SUPABASE_URL` | 既存 | Supabase接続 |
| `SUPABASE_SERVICE_ROLE_KEY` | 既存 | Supabase管理者権限 |
| `SITE_URL` | 既存 | リダイレクト先URL |

### フロントエンド (.env) で設定する変数

**Lemon Squeezy関連はなし** — すべてサーバーサイド（Netlify Functions）で処理されます。

---

## トラブルシューティング

### Webhookが動作しない

1. **署名が一致しない**
   - `LEMONSQUEEZY_WEBHOOK_SECRET` が正しいか確認
   - Webhook設定のSigning Secretと一致しているか確認

2. **ユーザーが見つからない**
   - Webhookのレスポンスに `"message": "user not found yet"` が返る場合
   - チェックアウト時のメールアドレスがSupabaseの`profiles.email`と一致しているか確認

3. **Netlify Functions のログを確認**
   - Netlify Dashboard → Logs → Functions → `lemonsqueezyWebhook`

### チェックアウトページにリダイレクトされない

1. `LEMONSQUEEZY_API_KEY` が正しいか確認
2. `LEMONSQUEEZY_STORE_ID` が正しいか確認
3. `LEMONSQUEEZY_VARIANT_ID_*` が正しいか確認
4. ブラウザのコンソールでエラーを確認

### ポータルURLが取得できない

1. テストモードでサブスクリプションが作成されているか確認
2. `lemon_customer_id` がprofilesに保存されているか確認
3. Lemon Squeezy APIの応答をNetlify Functionsログで確認

---

## 本番移行チェックリスト

テスト環境で検証が完了したら、以下の手順で本番に移行:

- [ ] Lemon Squeezy ダッシュボードでテストモードをOFFにする
- [ ] **本番用** APIキーを発行
- [ ] **本番用** 商品・バリアントを作成（テスト用とは別）
- [ ] **本番用** Webhookエンドポイントを作成
- [ ] Netlify環境変数を本番用に更新
- [ ] 本番環境でE2Eテストを実施

---

## アフィリエイトプログラム（USD ストア / enjazzifyjp）

Web 版の英語圏（USD）向け Lemon Squeezy ストアでアフィリエイトを有効化する手順です。JPY ストア（`jazzify.jp`）は別設定が必要です。

### ダッシュボード設定（手動）

Lemon Squeezy → **Settings → Affiliates** で以下を設定:

| 項目 | 推奨値 |
|------|--------|
| Affiliate referral URL | `https://en.jazzify.jp`（ストアフロント直販は避ける） |
| Affiliate tracking script store | `enjazzifyjp` |
| Affiliate products | USD Premium（月額・年額、トライアル variant 含む） |
| Subscription commission | 更新課金も対象にするかはビジネス判断 |

> **重要:** Referral URL を `enjazzifyjp.lemonsqueezy.com` のままにすると、ログイン後 API checkout（`user_id` 付き）を経由せず未連携課金になりうるため、`https://en.jazzify.jp` に変更してください。

### 計測の仕組み

`affiliate.js` は着地 URL の `?aff=` を Lemon の `/affiliates/track` に送り、返ってきたクリック ID を
cookie `ls_aff_ref` に保存する。そのうえで `<a href>` を MutationObserver で監視し、ストアドメイン向けリンクに
`aff_ref` を付与する。

Jazzify の Web 課金は `lemonsqueezyResolveLink` が API で作った URL に `window.location.href` で遷移するため
**リンク書き換えの対象外**。よって cookie から自前で `aff_ref` を付ける必要がある。

```
en.jazzify.jp/?aff=CODE
  → affiliate.js が /affiliates/track へ POST
  → cookie ls_aff_ref=<click id>
  → （登録・ログイン後）ペイウォール
  → lemonsqueezyResolveLink が checkout URL を生成
  → resolveAffiliateCheckoutUrl が aff_ref=<click id> を付与して遷移
```

| ファイル | 内容 |
|----------|------|
| `index-en.html` | `affiliate.js` を条件付きロード（`?aff=` 着地、または cookie 保持者の LP 再訪のみ） |
| `src/utils/lemonAffiliateCheckout.ts` | cookie `ls_aff_ref` を読んで checkout URL に `aff_ref` を付与 |
| `src/components/ui/WebPaywallModal.tsx` | USD 課金時のみ affiliate URL を適用 |

> **なぜ条件付きロードか:** `affiliate.js` は `document.body` 全体を MutationObserver で監視し、変化した
> サブツリーごとに `getElementsByTagName('a')` を走らせる。`en.jazzify.jp/*` はすべて `index-en.html` を返すため、
> 無条件に読み込むとゲーム画面の DOM 更新中もこの監視が走る。checkout への付与は cookie 読み取りだけで足りるので、
> アプリ内ではスクリプト自体を読み込まない。

### テストモード E2E 確認手順

1. Lemon Squeezy を **Test mode** にし、USD ストアのアフィリエイトを有効化
2. テスト用アフィリエイト URL を取得（例: `https://en.jazzify.jp/?aff=TESTCODE`）
3. シークレットウィンドウで上記 URL を開く
4. DevTools → Application → Cookies で `ls_aff_ref` が `en.jazzify.jp` に保存されたことを確認
   - 保存されない場合は attribution が付かない。`lemonSqueezyAffiliateConfig.debug = true` を一時設定してログを確認
5. 無料登録 → Premium ペイウォール → チェックアウトへ進む
6. 遷移先 URL に `aff_ref=<click id>` が付いていることを確認
7. テストカードで購入完了
8. Lemon Squeezy → Affiliates で referral が記録されていることを確認
9. Webhook で `subscriptions` / `profiles` に `user_id` が正しく紐づくことを確認

---

## 参考リンク

- [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
- [Lemon Squeezy API Docs](https://docs.lemonsqueezy.com/api)
- [Lemon Squeezy Webhooks](https://docs.lemonsqueezy.com/guides/developer-guide/webhooks)
- [Lemon Squeezy Test Mode](https://docs.lemonsqueezy.com/guides/developer-guide/testing)
- [テストカード番号一覧](https://docs.lemonsqueezy.com/guides/developer-guide/testing#test-card-numbers)
