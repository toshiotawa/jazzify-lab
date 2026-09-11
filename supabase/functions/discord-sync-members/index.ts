import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  readDiscordEnv,
  removeGuildMember,
  shouldKickFromDiscord,
  sleepMs,
} from "../_shared/discord.ts";

/**
 * 有料会員 Discord 同期バッチ
 * - free かつ非 admin の連携ユーザーを Discord からキック
 * - 実行スケジュール: 毎日 18:00 UTC / JST 03:00 (Supabase Dashboard Cron で設定)
 * - Authorization: Bearer <DISCORD_CRON_SECRET>
 */
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cronSecret = Deno.env.get("DISCORD_CRON_SECRET") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!cronSecret || !serviceRoleKey || bearer !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    serviceRoleKey,
  );

  const config = readDiscordEnv();

  const { data: memberships, error: fetchError } = await supabase
    .from("discord_memberships")
    .select(`
      user_id,
      discord_user_id,
      guild_id,
      profiles!inner(rank, is_admin)
    `);

  if (fetchError) {
    return new Response(JSON.stringify({ error: "Failed to fetch memberships" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let kicked = 0;
  let checked = 0;
  let errors = 0;

  for (const row of memberships ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const rank = profile && typeof profile === "object" && "rank" in profile
      ? String(profile.rank)
      : "free";
    const isAdmin = profile && typeof profile === "object" && "is_admin" in profile
      ? profile.is_admin === true
      : false;

    if (shouldKickFromDiscord({ rank, isAdmin })) {
      let result = await removeGuildMember(
        config.botToken,
        row.guild_id,
        row.discord_user_id,
      );

      if (result.status === 429 && result.retryAfterSeconds) {
        await sleepMs(result.retryAfterSeconds * 1000);
        result = await removeGuildMember(
          config.botToken,
          row.guild_id,
          row.discord_user_id,
        );
      }

      if (result.ok || result.status === 404) {
        const { error: deleteError } = await supabase
          .from("discord_memberships")
          .delete()
          .eq("user_id", row.user_id);

        if (deleteError) {
          errors += 1;
        } else {
          kicked += 1;
        }
      } else {
        errors += 1;
      }
      continue;
    }

    const { error: touchError } = await supabase
      .from("discord_memberships")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("user_id", row.user_id);

    if (touchError) {
      errors += 1;
    } else {
      checked += 1;
    }
  }

  return new Response(JSON.stringify({
    kicked,
    checked,
    errors,
    total: (memberships ?? []).length,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
