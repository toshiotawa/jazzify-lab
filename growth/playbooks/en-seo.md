# en-blog / jazzpianodays.com 強化

## 現状

- `en-blog`: 102記事、各記事に `utm_source=en_blog` CTA 埋め込み済み
- `BlogHeader` の Try Jazzify に UTM 追加済み（header 経由計測）
- `jazzpianodays.com`: GA4 dataLayer + Jazzify CTA

## 週次レビュー SQL

`growth/funnel.sql` の UTM クエリで `en_blog` / `jazzpianodays` を確認。

## 強化（月10 EN trials 目標）

1. **GA4 週次**: `cd jazzify-ga-report && npm run ga:acquisition` で landingPage + source
2. **勝ち記事**: CTA click 上位5 slug を `blog_cta_click` から抽出（GA4）
3. **内部リンク**: 勝ち記事同士を3本ずつ相互リンク（Astro md 手動 or スクリプト）
4. **新規記事**: 月2本、検索意図は「practice / how to / beginner」系

## 単価

- EN Premium: $24.99/月（JP ¥3,980 の約1.7倍）
- 1 trial → 有料 60% なら EN 1件 ≈ $15 MRR 期待値

## 停止条件

- 90日で `en_blog` 経由 trial 0 → 記事テーマ見直し
