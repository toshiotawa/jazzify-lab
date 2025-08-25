-- Generic fix: wrap auth.* calls in RLS policies with (select ...)
-- This avoids per-row re-evaluation initplans flagged by Supabase advisor.

do $$
declare
  r record;
  roles_clause text;
  using_clause text;
  check_clause text;
  perm_clause text;
  new_qual text;
  new_check text;
  create_sql text;
begin
  for r in (
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        (qual is not null and (qual ilike '%auth.uid()%' or qual ilike '%auth.role()%'))
        or (with_check is not null and (with_check ilike '%auth.uid()%' or with_check ilike '%auth.role()%'))
      )
  ) loop
    -- Compose roles clause
    if r.roles is null or array_length(r.roles, 1) is null then
      roles_clause := '';
    else
      roles_clause := ' to ' || array_to_string(r.roles, ', ');
    end if;

    -- Replace auth calls with SELECT-wrapped variants (case-insensitive)
    if r.qual is not null then
      new_qual := regexp_replace(r.qual, '\\bauth\\.uid\\(\\)', '(select auth.uid())', 'gi');
      new_qual := regexp_replace(new_qual, '\\bauth\\.role\\(\\)', '(select auth.role())', 'gi');
    else
      new_qual := null;
    end if;

    if r.with_check is not null then
      new_check := regexp_replace(r.with_check, '\\bauth\\.uid\\(\\)', '(select auth.uid())', 'gi');
      new_check := regexp_replace(new_check, '\\bauth\\.role\\(\\)', '(select auth.role())', 'gi');
    else
      new_check := null;
    end if;

    using_clause := case when new_qual is not null then ' using (' || new_qual || ')' else '' end;
    check_clause := case when new_check is not null then ' with check (' || new_check || ')' else '' end;
    -- r.permissive in pg_policies is text: 'permissive' or 'restrictive'
    perm_clause := case when lower(r.permissive) = 'restrictive' then ' as restrictive' else '' end;

    -- Drop and recreate
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);

    create_sql := format(
      'create policy %I on %I.%I%s for %s%s%s%s',
      r.policyname,
      r.schemaname, r.tablename,
      perm_clause,
      r.cmd,
      roles_clause,
      using_clause,
      check_clause
    );

    execute create_sql;
  end loop;
end $$;


