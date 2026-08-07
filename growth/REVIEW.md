# Jazzify 週次 Growth レビュー

週: `YYYY-Www`（JST）  
実行者:  
前回スナップショット: `growth/data/YYYY-Www.json`

## 1. 北極星

| 指標 | 今週 | 前週 | 目標 |
|---|---:|---:|---|
| 有料アクティブ（MRR換算） | | | 50件 ≒ 月20万 |
| 新規登録（7日） | | | 35+/週 → 150/月 |
| トライアル開始率（7日登録者） | | | 15% |
| トライアル→有料（60日） | | | 60%維持 |
| 帰属捕捉率（7日登録者） | | | 80% |
| メール opt-in 率（7日登録者） | | | 40% |

## 2. ファネル（Supabase 正本）

```
流入 → 登録 → 着手(first_play) → paywall → checkout → trial → paid → 継続
```

| 段 | 人数 | 転換率 | 前週比 | ボトルネック? |
|---|---:|---:|---:|---|
| 登録 | | 100% | | |
| 着手 | | | | |
| paywall到達 | | | | |
| checkoutクリック | | | | |
| trial開始 | | | | |
| 有料化 | | | | |

paywall 出所別（`funnel.sql` の paywall クエリ）:

| source | view | click | checkout | trial |
|---|---:|---:|---:|---:|
| main_quest | | | | |
| chapter_complete | | | | |
| resume_modal | | | | |
| dashboard | | | | |
| survival | | | | |
| lesson_list | | | | |
| pricing_table | | | | |
| account_modal | | | | |

## 3. 流入（UTM / プラットフォーム）

| utm_source / medium | 登録 | trial | paid |
|---|---:|---:|---:|
| | | | |

GA4 補助（`cd jazzify-ga-report && npm run ga:week`）:

- セッション / sign_up / begin_checkout の差分メモ:

## 4. 今週の最大損失段

選定: （例: trial開始率）

根拠:

## 5. 施策候補（3つ）

1.
2.
3.

**今週やる1つ**:

## 6. 実験ログ更新

`experiments.csv` に baseline / result / verdict を記入。

## 7. 次週アクション

- [ ]
- [ ]
