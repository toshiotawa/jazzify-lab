# jazzify-ga-report

Jazzify / Jazz Piano Days の GA4 を Google Analytics Data API で取得するローカル CLI。

## 前提

1. Google Cloud で **Google Analytics Data API** が有効
2. Application Default Credentials（ADC）があること

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
```

3. `.env` に数字のプロパティ ID（`G-` 測定 ID ではない）

```env
# Jazzify（デフォルト / 週次会員レビュー）
GA_PROPERTY_ID=123456789

# Jazz Piano Days（jazzpianodays.com。英語サブドメインではない）
GA_PROPERTY_ID_JAZZPIANODAYS=123456789
```

プロパティ ID の確認: GA4 管理画面 → 管理 → プロパティ設定 → **プロパティ ID**。

## セットアップ

```bash
cd jazzify-ga-report
npm install
cp .env.example .env
# .env を編集
```

## コマンド

### Jazzify（デフォルト）

```bash
npm run ga:daily        # 直近7日: ユーザー / セッション / PV / キーイベント
npm run ga:week         # 直近7日: 日次 + 端末 + 国 + イベント + 流入 + sign_up帰属
npm run ga:acquisition  # 直近30日: source / medium / campaign / content
npm run ga:events       # 直近30日: 主要イベント別
```

### Jazz Piano Days（単独閲覧・週次会員レビューには含めない）

```bash
npm run ga:jpd:daily
npm run ga:jpd:week         # 日次 + 端末 + 国 + 上位ページ + 上位イベント + 流入
npm run ga:jpd:month        # 当月 + hostName別 + レッスンLP切り分け
npm run ga:jpd:acquisition
npm run ga:jpd:events
```

任意のコマンドに `--site=jazzpianodays`（または `jpd`）も可。

```bash
npm run ga:daily -- --site=jpd
```

疎通確認:

```bash
npx tsx src/ga-report.ts
```

週次会員レビュー全体（Supabase SQL + Jazzify の `ga:week`）は:

- `docs/analytics-minimal.md`（手順）
- `scripts/analytics/`（SQL）
- `.cursor/skills/weekly-members-report/SKILL.md`（エージェント手順）

## 注意

- GA4 は流入・入口の確認用。Jazzify の登録後ファネルと課金の正本は Supabase。
- 認証アカウントに対象プロパティの閲覧権限が必要。
- `ga:week` / `ga:jpd:week` の期間は `7daysAgo`〜`yesterday`（当日は含まない）。
- 週次会員レビューは **Jazzify のみ**（`GA_PROPERTY_ID`）。Jazz Piano Days は含めない。
