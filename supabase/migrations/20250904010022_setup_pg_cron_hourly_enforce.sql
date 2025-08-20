-- Enable pg_cron (idempotent) and schedule hourly enforcement at minute 1 (UTC)

-- pg_cron extension (Supabase recommends installing into extensions schema)
create extension if not exists pg_cron with schema extensions;

-- Unschedule by job name if possible, ignore errors if not supported
do $do$
begin
  begin
    perform cron.unschedule('guild_hourly_enforce');
  exception when others then
    -- ignore if function signature not supported
    null;
  end;
end$do$;

-- Schedule job at minute 1 every hour (UTC)
do $do$
begin
  begin
    -- Newer pg_cron supports name argument
    perform cron.schedule(
      'guild_hourly_enforce',
      '1 * * * *',
      'select public.rpc_guild_enforce_monthly_quest(date_trunc(''hour'', now()))'
    );
  exception when undefined_function then
    -- Older pg_cron (no name argument)
    perform cron.schedule(
      '1 * * * *',
      'select public.rpc_guild_enforce_monthly_quest(date_trunc(''hour'', now()))'
    );
  end;
end$do$;

