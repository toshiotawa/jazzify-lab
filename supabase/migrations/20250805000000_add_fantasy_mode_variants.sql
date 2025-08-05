-- 20250805000000_add_fantasy_mode_variants.sql
begin;

-- 1. 型（enum）を使っていた場合  --------------------------
do $$
begin
  if exists (select 1 from pg_type where typname = 'fantasy_stage_mode') then
    alter type fantasy_stage_mode
      rename value 'progression' to 'progression_order';
    alter type fantasy_stage_mode
      add value if not exists 'progression_random';
    alter type fantasy_stage_mode
      add value if not exists 'progression_timing';
  end if;
end$$;

-- 2. text＋CHECK 制約だった場合 ---------------------------
alter table fantasy_stages
  drop constraint if exists fantasy_stages_mode_check;

alter table fantasy_stages
  add constraint fantasy_stages_mode_check
    check ( mode in (
      'single',
      'progression_order',
      'progression_random',
      'progression_timing'
    ));

-- 3. 既存レコードをリネーム -------------------------------
update fantasy_stages
  set mode = 'progression_order'
where mode = 'progression';

-- 4. コメントを更新 ---------------------------------------
comment on column fantasy_stages.mode is 'single: 単一コードモード, progression_order: コード進行順番固定モード, progression_random: コード進行ランダムモード, progression_timing: タイミング付きコード進行モード';

commit;