# @jazz_ad_lib → Jazzify 導線

## なぜ

- フォロワー約3.8万・認証済み
- 固定動画形式（プロダクト実演）で27万インプレッション実績
- 現状 t.co 経由流入は月5件程度 → 最大の未接続資産

## リンク（UTM 正本）

| 用途 | URL |
|---|---|
| プロフィール | `https://jazzify.jp/?utm_source=x&utm_medium=profile&utm_campaign=jazz_ad_lib` |
| 固定投稿 | `https://jazzify.jp/?utm_source=x&utm_medium=social&utm_campaign=jazz_ad_lib&utm_content=pinned` |
| 通常投稿 | `https://jazzify.jp/?utm_source=x&utm_medium=social&utm_campaign=jazz_ad_lib&utm_content={post_slug}` |

生成: `node growth/print-acquisition-links.mjs`

## 投稿フォーマット（週2本）

1. **フック**（1行）: ジャズの具体的困りごと（例: 「Cブルースで手が止まる」）
2. **実演**（15〜30秒）: Jazzify のゲーム画面・鍵盤・正解/不正解
3. **CTA**: 「7日無料で第2章まで」+ プロフィールリンク

## 制作

- 画面収録: Jazzify iPad / Web
- 字幕: 既存 Vrew パイプラインはジャズ沼用。X Short は CapCut または Vrew でテロップのみ
- サムネ: 鍵盤 + 大文字フック（顔出しなし）

## 計測

- Supabase: `first_touch_utm_source=x` AND `utm_campaign=jazz_ad_lib`
- 週次: `growth/funnel.sql` の UTM クエリ

## 停止条件

- 4週連続で signups 0 かつ インプレッション 1万未満 → フォーマット変更
