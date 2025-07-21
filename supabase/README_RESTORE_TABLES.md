# 削除されたテーブル復活マイグレーション

## 概要
このマイグレーションは、マイグレーションで削除されてしまった重要なテーブルを復活させるためのものです。

## 復活されるテーブル

### 1. course_prerequisites
- **目的**: コースの前提条件を管理
- **用途**: コースの順序制御、前提条件チェック
- **主キー**: (course_id, prerequisite_course_id)

### 2. user_course_progress  
- **目的**: ユーザーのコース進捗を管理
- **用途**: コースのアンロック状態、進捗追跡
- **主キー**: (user_id, course_id)

### 3. user_song_play_progress
- **目的**: ユーザーの楽曲プレイ進捗を管理（context_type別）
- **用途**: ミッション、レッスン、一般プレイでの進捗分離
- **主キー**: id (UUID)
- **ユニーク制約**: (user_id, song_id, context_type, context_id)

### 4. challenge_progress
- **目的**: チャレンジ進捗を管理（user_challenge_progressと併存）
- **用途**: 古い形式のチャレンジ進捗データ
- **主キー**: id (UUID)
- **ユニーク制約**: (user_id, challenge_id)

## マイグレーションファイル

### 1. 20250724000000_restore_missing_tables.sql
- テーブルの作成
- インデックスの作成
- RLSポリシーの設定
- 既存データの移行

### 2. 20250724000001_update_schema_file.sql
- スキーマファイル更新のためのコメント
- 手動更新が必要な場合のテーブル定義例

### 3. 20250724000002_fix_profiles_columns.sql
- profilesテーブルのカラム追加を安全に行う修正
- 既存カラムの存在チェック
- 重複エラーの回避

## 実行手順

### 1. マイグレーションの実行
```bash
# Supabase CLIを使用
supabase db push

# または、個別に実行
supabase migration up
```

### 2. 確認手順
```sql
-- テーブルが正常に作成されているか確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'course_prerequisites',
  'user_course_progress', 
  'user_song_play_progress',
  'challenge_progress'
);

-- インデックスが作成されているか確認
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'course_prerequisites',
  'user_course_progress',
  'user_song_play_progress', 
  'challenge_progress'
);

-- RLSポリシーが設定されているか確認
SELECT schemaname, tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'course_prerequisites',
  'user_course_progress',
  'user_song_play_progress',
  'challenge_progress'
);
```

### 3. データ移行の確認
```sql
-- user_challenge_progressからchallenge_progressへの移行確認
SELECT 
  COUNT(*) as user_challenge_count,
  (SELECT COUNT(*) FROM challenge_progress) as challenge_count
FROM user_challenge_progress;
```

## 注意事項

### 1. 既存データの保護
- マイグレーションは `IF NOT EXISTS` を使用
- 既存データは保持される
- データ移行は `ON CONFLICT DO NOTHING` で安全に実行

### 2. RLSポリシー
- 全てのテーブルでRLSが有効化
- 適切なアクセス制御が設定済み
- 管理者権限でのアクセスも可能

### 3. インデックス
- パフォーマンス向上のためのインデックスが作成済み
- 複合インデックスも含む

### 4. 制約
- 外部キー制約が設定済み
- チェック制約（context_type等）が設定済み
- 自己参照防止制約（course_prerequisites）

## トラブルシューティング

### 1. マイグレーションエラー
```bash
# マイグレーション状態の確認
supabase migration list

# 特定のマイグレーションを再実行
supabase migration reset
supabase db push
```

### 2. カラム重複エラー
```sql
-- エラー: column "avatar_url" of relation "profiles" already exists
-- 解決方法: 20250724000002_fix_profiles_columns.sql を実行
-- このマイグレーションは既存カラムをチェックしてから追加します
```

### 3. 既存カラムの確認
```sql
-- profilesテーブルの既存カラムを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
ORDER BY column_name;
```

### 4. 構文エラー
```sql
-- エラー: syntax error at or near "EQXISTS"
-- 解決方法: IF NOT EXISTS のタイポを修正済み
-- 修正されたファイル: 20250723133835_restore_critical_tables_columns.sql
```

### 2. テーブルが存在しない場合
```sql
-- 手動でテーブルを作成
-- 各テーブルのCREATE TABLE文を実行
```

### 3. RLSポリシーエラー
```sql
-- RLSポリシーの再作成
-- 各テーブルのCREATE POLICY文を実行
```

## 関連ファイル

- `supabase/migrations/20250724000000_restore_missing_tables.sql`
- `supabase/migrations/20250724000001_update_schema_file.sql`
- `supabase/migrations/20250724000002_fix_profiles_columns.sql`
- `supabase/migrations/20250723131738_restore_profiles_columns.sql` (修正済み)
- `supabase/schemas/schema.sql` (手動更新が必要)

## 更新履歴

- 2025-07-24: 初回作成
- 削除されたテーブルの復活
- RLSポリシーの設定
- データ移行の実装
- 2025-07-24: タイポ修正
- `EQXISTS` → `EXISTS` の修正
- カラム重複エラーの解決 