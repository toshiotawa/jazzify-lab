# Bebopify YouTube → Jazzify EN 送客

## 方針

- **AdSense / 顔出しなし5ch は凍結**。Bebopify のみ英語圏 Jazzify 送客に転用
- パイプライン: `~/Documents/AI副業/youtube-design-trivia`（Remotion + Piper `en_US-ryan-high`）
- OAuth / 非公開アップロードスクリプト: 既存

## 動画テンプレ

1. 1テーマ1本（例: "What is a tritone substitution?"）
2. 3〜5分、スコア可視化 + Ryan voice
3. 説明欄 CTA:

```
https://en.jazzify.jp/?utm_source=youtube&utm_medium=description&utm_campaign=bebopify&utm_content={video_slug}
```

4. 固定コメント: 7-day free trial on Premium

## 初回3本の候補

1. `bebop-scales-explained`
2. `ii-v-i-voicings-practice`
3. `blues-changes-for-beginners`

## 制作コマンド（AI副業側）

```bash
cd ~/Documents/AI副業/youtube-design-trivia
# エピソード生成 → render → youtube:package
```

## 計測

- GA4: YouTube referral + `utm_campaign=bebopify`
- Supabase: `first_touch_utm_campaign=bebopify`
- 目標: 月4本公開 → 月10 EN signups

## 受け皿

- `en-blog` 102記事（CTA UTM 済み）
- `jazzpianodays.com`（WordPress + GA4 dataLayer）
