-- membership_rank に 'black' を追加し、profiles.member_rank のチェック制約を更新

ALTER TYPE public.membership_rank ADD VALUE IF NOT EXISTS 'black';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS member_rank_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT member_rank_check
  CHECK (
    member_rank = ANY (ARRAY['FREE','STANDARD','PREMIUM','PLATINUM','BLACK'])
  );
