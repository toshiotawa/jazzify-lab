---
name: growth-weekly-loop
description: >-
  Jazzify MRR growth weekly loop: run growth/snapshot.mjs, funnel.sql,
  experiments.csv review, and channel playbooks. Use when running 週次 growth
  review, MRR improvement loop, or growth experiments for Jazzify.
---

# Jazzify Growth Weekly Loop

## Goal

有料アクティブ 50件（≈月20万円 MRR）へ。週1回、数値→診断→施策1つ→2週間後検証。

## Workflow

```
- [ ] 1. node growth/snapshot.mjs（要 SUPABASE_URL + SERVICE_ROLE_KEY）
- [ ] 2. growth/funnel.sql を MCP execute_sql で1クエリずつ
- [ ] 3. cd jazzify-ga-report && npm run ga:week
- [ ] 4. growth/REVIEW.md を埋める
- [ ] 5. 最大損失段に施策1つ → growth/experiments.csv 更新
- [ ] 6. 必要なら growth/playbooks/ と acquisition-links.yaml を参照
```

## 正本

| 指標 | ソース |
|---|---|
| 登録・UTM・opt-in | `profiles` |
| paywall→trial→paid | `user_milestones` |
| 有料件数 | `billing_subscriptions` |
| 入口 | GA4 `ga:week` |

## ボトルネック優先順（2026-08-07 実測 = 直近30日48人）

1. トライアル開始率 8.3%（4/48）→ 目標15%
2. paywall到達→checkoutクリック 16%（4/25）→ 出所別に分解して改善点を絞る
3. 帰属捕捉率 47.9%（23/48）→ 直帰は原理的に捕捉不可なので上限は100%未満
4. メール opt-in 37.5%（18/48）→ 目標50%
5. 流入量（月50 → 150）

最新値は `growth/data/YYYY-Www.json` を正本とする。

## チャネル Playbook

- X: `growth/playbooks/x-jazz-ad-lib.md`
- YouTube/IG: `growth/playbooks/youtube-jazznuma-ig.md`
- Bebopify EN: `growth/playbooks/bebopify-youtube.md`
- en-blog SEO: `growth/playbooks/en-seo.md`

## 人間承認が必要

- 価格・法務・一斉メール文面
- 新規チャネルでのブランド表現
