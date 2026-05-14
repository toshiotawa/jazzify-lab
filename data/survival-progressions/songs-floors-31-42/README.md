# Songs フロア追加用（stage 31–42）

`chords_one_per_line` 形式（`Key of …` 必須）。`EM7` は `EM7(9)` 表記に統一。

## 再生成

```bash
# JSON（中間生成物）
for f in data/survival-progressions/songs-floors-31-42/stage_*.txt; do
  b=$(basename "$f" .txt)
  node scripts/survival-progression-voicings.mjs --from-chords-txt "$f" \
    > "scripts/_tmp_survival_floors_31_42/generated/${b}.json"
done

# マイグレーション SQL
node scripts/_tmp_survival_floors_31_42/buildMigrationSql.mjs

# MCP 用 2 ステージずつ + ブロック
node scripts/_tmp_survival_floors_31_42/emitMcpChunks.mjs
```

## 注意

- `EbM7(9)` など最低音が C3–B3 外になると CLI が `hintOctave` 警告を出します（既存スタンダードと同様のレジスター）。
