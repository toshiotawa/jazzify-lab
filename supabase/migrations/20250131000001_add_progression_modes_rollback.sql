-- Rollback migration for progression modes

-- ①-1 新しいCHECK制約を削除
alter table fantasy_stages
  drop constraint if exists chk_fantasy_stage_mode;

-- ①-2 mode を元に戻す
update fantasy_stages
set mode = 'progression'
where mode in ('progression_order', 'progression_random', 'progression_timing');

-- ①-3 元のCHECK制約を再作成
alter table fantasy_stages
  add constraint fantasy_stages_mode_check
  check (mode in ('single', 'progression'));