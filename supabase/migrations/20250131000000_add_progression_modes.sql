-- Add new progression modes for fantasy stages

-- ①-1 まず現在のmode値を確認（デバッグ用）
do $$
begin
  raise notice 'Current mode values in fantasy_stages:';
  for r in (select distinct mode, count(*) as cnt from fantasy_stages group by mode)
  loop
    raise notice 'mode: %, count: %', r.mode, r.cnt;
  end loop;
end $$;

-- ①-2 既存のCHECK制約を削除（名前が異なる可能性があるので、まず制約名を確認）
-- テーブル作成時のCHECK制約は名前が自動生成されることがある
do $$
declare
  constraint_name text;
begin
  -- fantasy_stages テーブルの mode カラムに関するCHECK制約を探す
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'fantasy_stages'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%mode%';
    
  if constraint_name is not null then
    execute format('alter table fantasy_stages drop constraint %I', constraint_name);
    raise notice 'Dropped constraint: %', constraint_name;
  end if;
end $$;

-- ①-3 既存データの mode を更新
-- progressionをprogression_orderに変換
update fantasy_stages
set mode = 'progression_order'
where mode = 'progression';

-- その他の不明な値をsingleに変換（安全のため）
update fantasy_stages
set mode = 'single'
where mode not in ('single', 'progression_order', 'progression_random', 'progression_timing', 'progression');

-- ①-4 更新後の値を確認
do $$
begin
  raise notice 'Updated mode values in fantasy_stages:';
  for r in (select distinct mode, count(*) as cnt from fantasy_stages group by mode)
  loop
    raise notice 'mode: %, count: %', r.mode, r.cnt;
  end loop;
end $$;

-- ①-5 新しいCHECK制約を追加
alter table fantasy_stages
  add constraint chk_fantasy_stage_mode
  check (mode in (
    'single',
    'progression_order',
    'progression_random',
    'progression_timing'
  ));