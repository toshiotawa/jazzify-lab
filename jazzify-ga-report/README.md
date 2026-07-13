# jazzify-ga-report

Jazzify の GA4 を Google Analytics Data API で取得するローカル CLI。

## 前提

1. Google Cloud で **Google Analytics Data API** が有効
2. Application Default Credentials（ADC）があること

```bash
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly"
```

3. `.env` に数字のプロパティ ID（`G-` 測定 ID ではない）

```env
GA_PROPERTY_ID=123456789
```

## セットアップ

```bash
cd jazzify-ga-report
npm install
cp .env.example .env
# .env を編集
```

## コマンド

```bash
npm run ga:daily        # 直近7日: ユーザー / セッション / PV / キーイベント
npm run ga:week         # 直近7日: 日次 + 端末 + 国 + イベント + 流入 + sign_up帰属
npm run ga:acquisition  # 直近30日: source / medium / campaign / content
npm run ga:events       # 直近30日: 主要イベント別
```

疎通確認:

```bash
npx tsx src/ga-report.ts
```

週次会員レビュー全体（Supabase SQL + この CLI）は:

- `docs/analytics-minimal.md`（手順）
- `scripts/analytics/`（SQL）
- `.cursor/skills/weekly-members-report/SKILL.md`（エージェント手順）

## 注意

- GA4 は流入・入口の確認用。登録後ファネルと課金の正本は Supabase。
- 認証アカウントに対象プロパティの閲覧権限が必要。
- `ga:week` の期間は `7daysAgo`〜`yesterday`（当日は含まない）。
