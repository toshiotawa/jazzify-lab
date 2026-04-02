import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription status - block if active
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, current_period_ends_at, provider")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscription) {
      const activeStatuses = ["trial", "active", "grace", "billing_retry"];
      if (activeStatuses.includes(subscription.status)) {
        const providerLabel = subscription.provider === "apple" ? "Apple" : "Lemon Squeezy";
        return new Response(JSON.stringify({
          error: `Active subscription exists via ${providerLabel}. Please cancel first.`,
          provider: subscription.provider,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (subscription.status === "canceled" && subscription.current_period_ends_at) {
        const endsAt = new Date(subscription.current_period_ends_at);
        if (endsAt > new Date()) {
          return new Response(JSON.stringify({
            error: "Subscription period has not ended yet.",
            provider: subscription.provider,
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Also check legacy profile fields
    const { data: profile } = await supabase
      .from("profiles")
      .select("rank, email, lemon_subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.rank && profile.rank !== "free") {
      const isLemonActive = ["active", "on_trial"].includes(profile.lemon_subscription_status ?? "");
      if (isLemonActive) {
        return new Response(JSON.stringify({
          error: "Active Lemon subscription. Cancel via web portal first.",
          provider: "lemon",
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Proceed with deletion — admin.signOut expects the user's JWT, not user id (see Supabase JS reference)
    const { error: signOutErr } = await supabase.auth.admin.signOut(token, "global");
    if (signOutErr) {
      console.error("delete-account: signOut failed:", signOutErr.message);
    }

    await supabase.from("practice_diaries").delete().eq("user_id", user.id);
    await supabase.from("diary_comments").delete().eq("user_id", user.id);
    await supabase.from("diary_likes").delete().eq("user_id", user.id);
    await supabase.from("subscriptions").delete().eq("user_id", user.id);
    await supabase.from("subscription_events").delete().eq("user_id", user.id);

    const { error: deleteProfileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (deleteProfileErr) {
      const anonymizedEmail = `deleted_${user.id}@deleted.local`;
      await supabase.from("profiles").update({
        email: anonymizedEmail,
        nickname: "Deleted User",
        bio: null,
        twitter_handle: null,
        avatar_url: null,
        stripe_customer_id: null,
        lemon_customer_id: null,
        lemon_subscription_id: null,
        lemon_subscription_status: null,
      }).eq("id", user.id);
    }

    const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteAuthErr) {
      const anonymizedEmail = `deleted_${user.id}@deleted.local`;
      await supabase.auth.admin.updateUserById(user.id, {
        email: anonymizedEmail,
        email_confirm: true,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Account deleted successfully.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("delete-account: unhandled error:", message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
