-- guildsテーブルにdisbandedカラムを追加
alter table public.guilds add column if not exists disbanded boolean default false;

-- インデックスを追加（アクティブなギルドの検索を高速化）
create index if not exists idx_guilds_disbanded on public.guilds(disbanded);