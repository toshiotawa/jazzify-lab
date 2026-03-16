import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function computeHmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function mapLemonStatusToSubscription(
  eventName: string,
  lemonStatus?: string,
): { status: string; trialUsed?: boolean } {
  switch (eventName) {
    case "subscription_created":
      if (lemonStatus === "on_trial") return { status: "trial", trialUsed: true };
      return { status: "active" };
    case "subscription_updated":
      if (lemonStatus === "on_trial") return { status: "trial" };
      if (lemonStatus === "active") return { status: "active" };
      if (lemonStatus === "past_due") return { status: "billing_retry" };
      if (lemonStatus === "paused") return { status: "canceled" };
      return { status: "active" };
    case "subscription_cancelled":
      return { status: "canceled" };
    case "subscription_expired":
      return { status: "expired" };
    case "subscription_resumed":
      return { status: "active" };
    case "subscription_paused":
      return { status: "canceled" };
    case "order_refunded":
      return { status: "expired" };
    default:
      return { status: "active" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    const rawBody = await req.text();

    if (webhookSecret) {
      const signature = req.headers.get("x-signature");
      if (signature) {
        const computed = await computeHmacSha256Hex(webhookSecret, rawBody);
        if (computed !== signature) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const body = JSON.parse(rawBody);
    const eventName = body.meta?.event_name;
    const customData = body.meta?.custom_data;
    const userId = customData?.user_id;
    const attrs = body.data?.attributes;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    await supabase.from("subscription_events").insert({
      user_id: userId || null,
      provider: "lemon",
      event_type: eventName,
      provider_event_id: String(body.data?.id ?? ""),
      payload: body,
    });

    if (!userId || !eventName) {
      return new Response(JSON.stringify({ received: true, skipped: "no_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lemonStatus = attrs?.status;
    const mapped = mapLemonStatusToSubscription(eventName, lemonStatus);

    const customerId = String(attrs?.customer_id ?? "");
    const subscriptionId = String(body.data?.id ?? "");
    const renewsAt = attrs?.renews_at;
    const endsAt = attrs?.ends_at;
    const trialEndsAt = attrs?.trial_ends_at;
    const periodEndsAt = endsAt || renewsAt || trialEndsAt || null;

    const upsertData: Record<string, unknown> = {
      user_id: userId,
      provider: "lemon",
      provider_customer_id: customerId,
      provider_subscription_id: subscriptionId,
      plan_code: "core_monthly",
      status: mapped.status,
      updated_at: new Date().toISOString(),
    };

    if (periodEndsAt) {
      upsertData.current_period_ends_at = periodEndsAt;
    }
    if (mapped.trialUsed !== undefined) {
      upsertData.trial_used = mapped.trialUsed;
    }

    await supabase.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });

    const rank = ["active", "trial", "grace", "billing_retry"].includes(mapped.status) ? "standard_global" : "free";
    await supabase.from("profiles").update({
      rank,
      lemon_customer_id: customerId,
      lemon_subscription_id: subscriptionId,
      lemon_subscription_status: lemonStatus,
      lemon_trial_used: mapped.trialUsed ?? false,
    }).eq("id", userId);

    return new Response(JSON.stringify({ received: true, status: mapped.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
