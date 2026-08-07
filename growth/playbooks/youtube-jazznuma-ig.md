# ジャズ沼ラジオ + Instagram → Jazzify

## YouTube（ジャズ沼ラジオ）

### 既存（触らない）

概要欄 UTM は `write-jazznuma-public-info` テンプレで設定済み:

```
https://jazzify.jp/?utm_source=youtube&utm_medium=description&utm_campaign=jazznuma_radio&utm_content={slug}
```

### 強化アクション

1. **固定コメント** に同じ UTM + `utm_medium=comment` を追加
2. **説明欄上部** に1行 CTA（「ジャズをゲームで練習 → Jazzify 7日無料」）
3. 公開ペース: 既存パイプライン（Vrew/Remotion）を維持し、月4本→月8本を目標

### 計測

- `first_touch_utm_source=youtube` AND `utm_campaign=jazznuma_radio`

## Instagram

### リンク

| 用途 | URL |
|---|---|
| プロフィール | `https://jazzify.jp/?utm_source=instagram&utm_medium=profile&utm_campaign=jazzify_ig` |
| ストーリー | `https://jazzify.jp/?utm_source=instagram&utm_medium=social&utm_campaign=jazzify_ig&utm_content=story` |

### 投稿

- 週3: ジャズ沼切り抜き15秒 + 「続きはプロフィール」
- ハッシュタグは3つまで（#ジャズ #ジャズピアノ #Jazzify）

## 目標

- 流入: 月50 → 150（YouTube + IG + X の合算）
- 4週間で `youtube` + `instagram` UTM 登録が各10件/月以上
