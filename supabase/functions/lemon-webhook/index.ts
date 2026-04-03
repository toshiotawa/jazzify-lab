import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EntitlementState =
  | "active"
  | "payment_issue_with_access"
  | "payment_issue_no_access"
  | "cancelled_but_active_until_end"
  | "expired";

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

function rankForSubscription(provider: string, entitlementState: EntitlementState): string {
  if (
    entitlementState === "active" ||
    entitlementState === "payment_issue_with_access" ||
    entitlementState === "cancelled_but_active_until_end"
  ) {
    return provider === "lemon" ? "standard_global" : "standard";
  }
  return "free";
}

function periodEndMsFromAttrs(attrs: Record<string, unknown> | undefined): number {
  if (!attrs) return 0;
  const endsAt = attrs.ends_at as string | undefined;
  const renewsAt = attrs.renews_at as string | undefined;
  const trialEndsAt = attrs.trial_ends_at as string | undefined;
  const raw = endsAt || renewsAt || trialEndsAt;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function mapLemonStatusToSubscription(
  eventName: string,
  lemonStatus: string | undefined,
  attrs: Record<string, unknown> | undefined,
): { status: string; entitlementState: EntitlementState; trialUsed?: boolean } {
  const periodEndMs = periodEndMsFromAttrs(attrs);
  const periodStillActive = periodEndMs > Date.now();

  switch (eventName) {
    case "subscription_created":
      if (lemonStatus === "on_trial") return { status: "trial", entitlementState: "active", trialUsed: true };
      return { status: "active", entitlementState: "active" };
    case "subscription_updated":
      if (lemonStatus === "on_trial") return { status: "trial", entitlementState: "active" };
      if (lemonStatus === "active") return { status: "active", entitlementState: "active" };
      if (lemonStatus === "past_due") return { status: "past_due", entitlementState: "payment_issue_with_access" };
      if (lemonStatus === "unpaid") return { status: "expired", entitlementState: "expired" };
      if (lemonStatus === "paused") {
        return {
          status: "canceled",
          entitlementState: periodStillActive ? "cancelled_but_active_until_end" : "expired",
        };
      }
      return { status: "active", entitlementState: "active" };
    case "subscription_cancelled":
      return {
        status: "canceled",
        entitlementState: periodStillActive ? "cancelled_but_active_until_end" : "expired",
      };
    case "subscription_expired":
      return { status: "expired", entitlementState: "expired" };
    case "subscription_resumed":
      return { status: "active", entitlementState: "active" };
    case "subscription_paused":
      return {
        status: "canceled",
        entitlementState: periodStillActive ? "cancelled_but_active_until_end" : "expired",
      };
    case "order_refunded":
      return { status: "expired", entitlementState: "expired" };
    default:
      return { status: "active", entitlementState: "active" };
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
    const attrs = body.data?.attributes as Record<string, unknown> | undefined;

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

    const lemonStatus = attrs?.status as string | undefined;
    const mapped = mapLemonStatusToSubscription(eventName, lemonStatus, attrs);

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
      entitlement_state: mapped.entitlementState,
      updated_at: new Date().toISOString(),
    };

    if (periodEndsAt) {
      upsertData.current_period_ends_at = periodEndsAt;
    }
    if (mapped.trialUsed !== undefined) {
      upsertData.trial_used = mapped.trialUsed;
    }

    await supabase.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });

    const rank = rankForSubscription("lemon", mapped.entitlementState);
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
