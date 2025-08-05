-- Add new progression modes for fantasy stages

-- ①-1 既存データの mode を一旦置き換え
update fantasy_stages
set    mode = 'progression_order'
where  mode = 'progression';

-- ①-2 CHECK 制約を追加（ text 列を使っている場合）
alter table fantasy_stages
  drop constraint if exists chk_fantasy_stage_mode;

alter table fantasy_stages
  add constraint chk_fantasy_stage_mode
  check (mode in (
    'single',
    'progression_order',
    'progression_random',
    'progression_timing'
  ));