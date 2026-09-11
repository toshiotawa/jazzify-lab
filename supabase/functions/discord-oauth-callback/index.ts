import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  addGuildMember,
  buildAppRedirectUrl,
  exchangeDiscordCode,
  fetchDiscordUser,
  readDiscordEnv,
} from "../_shared/discord.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  let config;
  try {
    config = readDiscordEnv();
  } catch (_err) {
    return new Response("Discord is not configured", { status: 500 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError || !code || !state) {
    return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { data: oauthState, error: stateError } = await supabase
      .from("discord_oauth_states")
      .select("user_id, guild_id, expires_at")
      .eq("state", state)
      .maybeSingle();

    if (stateError || !oauthState) {
      return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
    }

    await supabase
      .from("discord_oauth_states")
      .delete()
      .eq("state", state);

    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
    }

    const accessToken = await exchangeDiscordCode(config, code);
    const discordUser = await fetchDiscordUser(accessToken);

    const addResult = await addGuildMember(
      config.botToken,
      oauthState.guild_id,
      discordUser.id,
      accessToken,
    );

    if (!addResult.ok && addResult.status !== 204) {
      return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("discord_memberships")
      .upsert({
        user_id: oauthState.user_id,
        discord_user_id: discordUser.id,
        guild_id: oauthState.guild_id,
        joined_at: now,
        last_checked_at: now,
      }, { onConflict: "user_id" });

    if (upsertError) {
      return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
    }

    return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "joined"), 302);
  } catch (_err) {
    return Response.redirect(buildAppRedirectUrl(config.appBaseUrl, "error"), 302);
  }
});
