-- Fix Security Advisor: function_search_path_mutable
-- All functions in schema public should have a fixed search_path to avoid role-dependent resolution
-- Strategy: iterate over all functions in public and set search_path to pg_catalog, public

do $$
declare
  r record;
  cmd text;
begin
  for r in (
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ) loop
    cmd := format('alter function %I.%I(%s) set search_path = pg_catalog, public',
                  r.schema_name, r.function_name, r.identity_args);
    execute cmd;
  end loop;
end $$;

-- Note:
-- Using pg_get_function_identity_arguments ensures correct signature including default types and modes.
-- Setting search_path to pg_catalog, public protects against search_path injection while keeping public objects resolvable.

