# ファンタジーステージ新規セットアップ手順書

ファンタジーモードに新しいステージ（phrases等）を追加する際の手順をまとめたドキュメント。

---

## 目次

1. [ファイルの準備](#1-ファイルの準備)
2. [管理画面でBGMアップロード（R2 + カウントイン付与）](#2-管理画面でbgmアップロードr2--カウントイン付与)
3. [ステージのDB設定（マイグレーション）](#3-ステージのdb設定マイグレーション)
4. [MusicXMLのSupabase一括格納](#4-musicxmlのsupabase一括格納)
5. [ステージとBGMの紐付け](#5-ステージとbgmの紐付け)
6. [結合モード（timing_combining）の設定](#6-結合モードtiming_combiningの設定)

---

## 1. ファイルの準備

### 必要なファイル

| ファイル種別 | 形式 | 用途 |
|---|---|---|
| 音源（MP3） | `.mp3` | BGM再生用。R2にアップロードする |
| 楽譜（MusicXML） | `.musicxml` | OSMD楽譜表示 + コード進行データ抽出用。SupabaseのDBに格納 |

### ファイル命名規則

```
phrase {番号} countin{カウントイン小節数} {小節数}bars {BPM}BPM [pickup].{拡張子}
```

**例:**
- `phrase 1 countin1 4bars 140BPM.mp3` — カウントイン1小節、4小節、140BPM
- `phrase 15 countin0 4bars 140BPM pickup.mp3` — カウントインなし、ピックアップ（弱起）あり
- `phrase 16 countin1 8bars 140BPM.mp3` — カウントイン1小節、8小節

### ファイル名から読み取る設定値

| ファイル名の要素 | DB カラム | 備考 |
|---|---|---|
| `countin{N}` | `count_in_measures` | カウントイン小節数。`0`の場合は含まれない |
| `{N}bars` | `measure_count` | 楽曲の小節数（カウントイン除く） |
| `{N}BPM` | `bpm` | テンポ |
| `pickup` | `is_auftakt = true` | 弱起。ループ時にピックアップ小節を除外 |

---

## 2. 管理画面でBGMアップロード（R2 + カウントイン付与）

### 前提条件

- `.env.local` に Cloudflare R2 の認証情報が設定されていること

```
VITE_CLOUDFLARE_ACCOUNT_ID=xxx
VITE_CLOUDFLARE_ACCESS_KEY_ID=xxx
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=xxx
VITE_R2_BUCKET_NAME=jazzify-storage
VITE_R2_PUBLIC_URL=https://your-cdn.com
```

### 手順

1. **管理画面にアクセス**: ブラウザで `/admin` にアクセス
2. **「ファンタジーBGM管理」セクション** を開く（`FantasyBgmManager`）
3. **各フィールドを入力**:
   - **名称**: `phrase 1 BGM` のようにわかりやすい名前
   - **BPM**: ファイル名から読み取った値（例: `140`）
   - **拍子**: `4`（4/4拍子）
   - **小節数**: ファイル名から読み取った値（例: `4` or `8`）
   - **カウントイン小節数**: ファイル名から読み取った値（例: `1`）
4. **MP3ファイルを選択**
5. **オプション設定**:
   - **「MP3に変換」**: WAV/OGGの場合はON
   - **「カウント追加」**: カウントイン音声が未付与の場合はON（BPM入力必須）
     - 拍数を指定可能（デフォルト: 4拍）
6. **「アップロード」ボタン** をクリック

### カウントイン自動付与の仕組み

管理画面の「カウント追加」チェックにより、以下の処理が自動実行される:

1. ブラウザ上で音声をデコード（`decodeAudioFile`）
2. BPMから4拍分のクリック音を生成（`generateCountInAudio` — 600Hz、減衰エンベロープ付き）
3. 元の音声の先頭にクリック音を結合（`prependCountInToAudio`）
4. MP3にエンコード（`encodeToMp3` — 192kbps）
5. R2にアップロード（`uploadFantasyBgm` — パス: `fantasy-bgm/{bgmId}.mp3`）
6. `fantasy_bgm_assets` テーブルに `mp3_url` と `r2_key` を記録

### ピックアップ（弱起）の場合

- **カウント追加は不要**（`countin0` = カウントインなし）
- ステージ設定で `is_auftakt = true` にすることで、2回目以降のループでピックアップ小節のノーツが除外される

---

## 3. ステージのDB設定（マイグレーション）

### マイグレーションの作成

Supabase MCP の `apply_migration` または `supabase/migrations/` フォルダに SQL ファイルを作成。

### 例: progression_timing ステージの INSERT

```sql
INSERT INTO fantasy_stages (
  stage_number, name, description,
  mode, stage_tier, bpm, time_signature,
  measure_count, count_in_measures, is_auftakt,
  max_hp, enemy_gauge_seconds, enemy_count,
  enemy_hp, min_damage, max_damage,
  allowed_chords, chord_progression, show_guide
) VALUES (
  '1-1', '炎のプレリュード', 'ランク1 ステージ1',
  'progression_timing', 'phrases', 140, 4,
  4, 1, false,
  100, 30, 3,
  50, 10, 20,
  '{}', '{}', true
);
```

### ステージモード一覧

| モード | 説明 |
|---|---|
| `progression_timing` | 個別のフレーズステージ。楽譜表示 + コード進行タイミング判定 |
| `timing_combining` | 複数の子ステージを結合して順次演奏する |

### 重要な設定値

| カラム | 型 | 説明 |
|---|---|---|
| `stage_number` | text | `'1-1'` 〜 `'3-10'` 形式 |
| `stage_tier` | text | `'basic'`, `'advanced'`, `'phrases'` 等 |
| `mode` | text | ステージモード |
| `bpm` | integer | テンポ |
| `time_signature` | integer | 拍子（4 = 4/4拍子） |
| `measure_count` | integer | 小節数（カウントインを除く演奏部分） |
| `count_in_measures` | integer | カウントイン小節数 |
| `is_auftakt` | boolean | ピックアップ（弱起）の有無 |
| `music_xml` | text | MusicXMLの全文テキスト |
| `chord_progression_data` | jsonb | コード進行データ（MusicXMLから自動抽出も可） |
| `bgm_url` | text | R2上のMP3 URL |
| `combined_stage_ids` | jsonb | timing_combining用：子ステージIDの配列 |
| `combined_section_repeats` | jsonb | timing_combining用：各セクションのリピート回数 |

---

## 4. MusicXMLのSupabase一括格納

MusicXMLファイルは大きい（10KB〜40KB/件）ため、MCPの `execute_sql` ではパラメータサイズ制限に引っかかる場合がある。以下の手順で一括格納する。

### 手順

#### Step 1: 一時的な SECURITY DEFINER 関数を作成

Supabase MCP の `execute_sql` で以下を実行:

```sql
CREATE OR REPLACE FUNCTION public.admin_update_music_xml(
  p_stage_tier text,
  p_stage_number text,
  p_xml text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fantasy_stages
  SET music_xml = p_xml
  WHERE stage_tier = p_stage_tier AND stage_number = p_stage_number;
END;
$$;
```

> **SECURITY DEFINER** により、anon key で呼び出しても RLS をバイパスして更新できる。

#### Step 2: Node.js スクリプトで一括更新

`scripts/upload-musicxml-via-api.mjs` を作成して実行:

```javascript
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
const PUBLIC_DIR = './public';
const STAGE_TIER = 'phrases';

// ステージ番号 → フレーズ番号のマッピング
const STAGE_MAP = {
  '1-1': 1, '1-2': 2, '1-3': 3, /* ... */
};

function findMusicXmlFile(phraseNum) {
  const files = fs.readdirSync(PUBLIC_DIR);
  const regex = new RegExp(`^phrase ${phraseNum}[\\s\\S]*\\.musicxml$`, 'i');
  const match = files.find(f => regex.test(f));
  if (!match) throw new Error(`MusicXML not found for phrase ${phraseNum}`);
  return path.join(PUBLIC_DIR, match);
}

async function updateStage(stageNumber, xmlContent) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_music_xml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_stage_tier: STAGE_TIER,
      p_stage_number: stageNumber,
      p_xml: xmlContent,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

async function main() {
  for (const [stageNum, phraseNum] of Object.entries(STAGE_MAP)) {
    const filePath = findMusicXmlFile(phraseNum);
    const xml = fs.readFileSync(filePath, 'utf-8');
    await updateStage(stageNum, xml);
    console.log(`✓ ${stageNum} (phrase ${phraseNum})`);
  }
  console.log('完了');
}

main().catch(console.error);
```

実行:
```bash
node scripts/upload-musicxml-via-api.mjs
```

#### Step 3: 一時関数を削除

Supabase MCP の `execute_sql` で以下を実行:

```sql
DROP FUNCTION IF EXISTS public.admin_update_music_xml(text, text, text);
```

#### Step 4: 確認

```sql
SELECT stage_number,
  CASE WHEN music_xml IS NOT NULL THEN length(music_xml) ELSE 0 END as xml_length
FROM fantasy_stages
WHERE stage_tier = 'phrases'
ORDER BY stage_number;
```

### なぜこのアプローチが必要か

| 方法 | 問題点 |
|---|---|
| MCP `execute_sql` で直接UPDATE | パラメータサイズ制限（100KB）でMusicXMLが入りきらない場合がある |
| Supabase CLI `db execute` | CLI バージョンによっては未対応。`--linked` フラグが使えない |
| REST API で直接UPDATE | RLS ポリシーにより anon key では更新不可 |
| **SECURITY DEFINER + REST API RPC** | **RLSバイパス可能、サイズ制限なし、anon keyで実行可能** |

---

## 5. ステージとBGMの紐付け

BGMアップロード後、管理画面の「ステージ管理」で各ステージに `bgm_url` を設定する。

### 管理画面での設定

1. `/admin` → 「ファンタジーステージ管理」（`FantasyStageManager`）
2. 対象ステージを選択して編集
3. **「BGMアセットから選択」** プルダウンでアップロードしたBGMを選択
   - BPM、拍子、小節数、カウントイン小節数が自動入力される
4. または **「BGM URL（直接入力）」** フィールドにR2のURLを直接貼り付け
5. 保存

### R2上のファイルパス構造

```
fantasy-bgm/{bgmId}.mp3
```

公開URL: `https://{CDN_DOMAIN}/fantasy-bgm/{bgmId}.mp3`

---

## 6. 結合モード（timing_combining）の設定

ランクごとの最終ステージ（例: 1-10, 2-10, 3-10）は `timing_combining` モードで、ランク内の全ステージを結合して順次演奏する。

### DB設定例

```sql
UPDATE fantasy_stages
SET
  combined_stage_ids = '["id-of-1-1", "id-of-1-2", ..., "id-of-1-9"]'::jsonb,
  combined_section_repeats = '[2, 2, 2, 2, 2, 2, 2, 1, 1]'::jsonb
WHERE stage_number = '1-10' AND stage_tier = 'phrases';
```

### リピート回数の決定ルール

| 子ステージの小節数 | リピート回数 |
|---|---|
| 4小節 | **2回**（計8小節相当） |
| 8小節 | **1回** |

### 結合モードの動作

1. 子ステージのノーツを順番にロード
2. 各セクションを `combined_section_repeats` で指定された回数繰り返す
3. 2回目以降のリピートではカウントイン小節のノーツを除外
4. 全セクションを連結して1つの楽曲として再生

---

## 全体フロー図

```
[MP3/MusicXMLファイルを準備]
        │
        ├── MP3 ──→ [管理画面: FantasyBgmManager]
        │              ├── カウントイン自動付与（オプション）
        │              ├── MP3変換（オプション）
        │              └── R2にアップロード → bgm_url を取得
        │
        ├── MusicXML ──→ [SECURITY DEFINER関数 + Node.jsスクリプト]
        │                   └── Supabase REST API 経由で music_xml カラムに一括格納
        │
        └── ステージ設定 ──→ [マイグレーションSQL or 管理画面]
                              ├── ステージメタデータ（BPM, 小節数, モード等）
                              ├── bgm_url を紐付け
                              └── timing_combining の結合設定
```

---

## 環境変数一覧

| 変数名 | 用途 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase API エンドポイント |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（公開用） |
| `VITE_CLOUDFLARE_ACCOUNT_ID` | Cloudflare R2 アカウントID |
| `VITE_CLOUDFLARE_ACCESS_KEY_ID` | R2 アクセスキー |
| `VITE_CLOUDFLARE_SECRET_ACCESS_KEY` | R2 シークレットキー |
| `VITE_R2_BUCKET_NAME` | R2 バケット名 |
| `VITE_R2_PUBLIC_URL` | R2 公開URL（CDN） |

---

## 注意事項

- **SECURITY DEFINER 関数は作業後に必ず削除する**（セキュリティリスク）
- MusicXMLファイルは DB 格納後 `public/` から削除してよい（バックアップを別途保持）
- Supabase 無料枠: ストレージ 500MB、月間通信 5GB。MusicXMLはテキストデータなので十分余裕あり
- R2 への直接アップロードは MCP/CLI 非対応。管理画面（ブラウザ）経由で行う
- カウントイン付与はブラウザ上の Web Audio API で処理されるため、ローカル環境での実行が必要
