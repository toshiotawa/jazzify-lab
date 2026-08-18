# ソフトランディング × メルマガ方針

更新: 2026-08-11

## 現行メルマガ（12種）

正本: `netlify/functions/lib/marketingEmailUrls.ts` の `MarketingEmailKey`

| 分類 | Key |
|------|-----|
| 定期ドリップ | `day0`, `day1`, `day2`, `day3`, `day7`, `day10`, `day14`, `day21`, `day30` |
| 行動 | `trial_start`（オプトイン不要）, `paywall_nudge`, `never_played_5d`, `dormant_14d` |

送信: `marketingDripCron.ts`（毎時）+ `sendMarketingWelcome.ts`（day0 即時）

**日本語のみ送信**: `day10`（6音スケール動画）、`day14`（コードラン無料続き）。英語ユーザーは cron でスキップし、次の due ステップ（例: day21）へ進む。

## ソフトランディングとメールの役割分担

- **アプリ内**: MQ 無料枠終了後、コードラン初級 block1 を無料案内（`softLandingGuidance.ts` 等）
- **メール**: 専用 `soft_landing_chord_run` は **2026-08-11 停止済み**。代わりに `day14` と `paywall_nudge` の無料続き CTA をコードランに揃える

## 2026-08-11 計測スナップショット

| 指標 | 値 | 出典 |
|------|-----|------|
| 専用再訪メール対象（eligible_now） | 7 | `marketing_soft_landing_chord_run_recipients.sql` |
| 無料ユーザー MQ B1 完了 | 81 | `soft_landing_funnel.sql` |
| その後コードラン B1 開始 | 38（47%） | 同上 |
| その後コードラン B1 完了 | 2（2.5%） | 同上 |

GA4 イベント（アプリ内オファー）: `soft_landing_offer_viewed` / `_accepted` / `_dismissed`（`src/utils/analytics/softLandingOffer.ts`）

## 専用再訪メール `soft_landing_chord_run` の再実装ゲート

**現時点: 再実装しない。** 以下をすべて満たしたときのみ検討する。

1. **母数**: `eligible_now` が週次で **20人以上** かつ安定（小母数では A/B 不可）
2. **アプリ内の弱点**: GA4 で `soft_landing_offer_accepted` 後の再訪率が低い、または dashboard 未到達層が多い
3. **メッセージ排他**: `day14` / `paywall_nudge` と同週に届かないよう優先度・タイミングを設計済み
4. **day14 改修後の効果**: コードラン CTA 寄せ後も、MQ 完了から 24h 以上未再訪が残る

再実装時の条件案（旧実装ベース）:

- opt-in・未課金
- MQ block1 全完了、コードラン block1 未完了
- MQ B1 完了から 24–48h 経過
- `marketing_email_sends` に `soft_landing_chord_run` 未送信
- 優先度: `paywall_nudge` の次、定期便の前

母数 SQL: `scripts/analytics/marketing_soft_landing_chord_run_recipients.sql`
