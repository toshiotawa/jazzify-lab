import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AppleNotification {
  notificationType: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
}

function decodeJWSPayload(jws: string): Record<string, unknown> {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWS");
  const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(payload);
}

function mapAppleStatusToSubscription(
  notificationType: string,
  subtype?: string,
): { status: string; trialUsed?: boolean } {
  switch (notificationType) {
    case "SUBSCRIBED":
      if (subtype === "INITIAL_BUY") return { status: "active" };
      return { status: "active" };
    case "DID_RENEW":
      return { status: "active" };
    case "DID_FAIL_TO_RENEW":
      return { status: "billing_retry" };
    case "GRACE_PERIOD_STARTED":
      return { status: "grace" };
    case "EXPIRED":
      return { status: "expired" };
    case "DID_CHANGE_RENEWAL_STATUS":
      if (subtype === "AUTO_RENEW_DISABLED") return { status: "canceled" };
      return { status: "active" };
    case "REVOKE":
    case "REFUND":
      return { status: "expired" };
    case "OFFER_REDEEMED":
      return { status: "trial", trialUsed: true };
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();

    // Client sync from iOS app
    if (body.action === "client_sync") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        provider: "apple",
        provider_subscription_id: body.originalTransactionId,
        plan_code: "core_monthly",
        status: "active",
        trial_used: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await supabase.from("profiles").update({ rank: "standard" }).eq("id", user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apple Server Notification V2
    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      return new Response(JSON.stringify({ error: "Missing signedPayload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notification = decodeJWSPayload(signedPayload) as unknown as AppleNotification;
    const { notificationType, subtype, data } = notification;

    let transactionInfo: Record<string, unknown> = {};
    if (data?.signedTransactionInfo) {
      transactionInfo = decodeJWSPayload(data.signedTransactionInfo);
    }

    const appAccountToken = transactionInfo.appAccountToken as string | undefined;
    const originalTransactionId = transactionInfo.originalTransactionId as string | undefined;
    const expiresDate = transactionInfo.expiresDate as number | undefined;

    await supabase.from("subscription_events").insert({
      user_id: appAccountToken || null,
      provider: "apple",
      event_type: notificationType + (subtype ? `:${subtype}` : ""),
      provider_event_id: originalTransactionId ?? null,
      payload: { notification: notificationType, subtype, transactionInfo },
    });

    if (!appAccountToken || !originalTransactionId) {
      return new Response(JSON.stringify({ received: true, skipped: "no_user_mapping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapped = mapAppleStatusToSubscription(notificationType, subtype);

    const upsertData: Record<string, unknown> = {
      user_id: appAccountToken,
      provider: "apple",
      provider_subscription_id: originalTransactionId,
      plan_code: "core_monthly",
      status: mapped.status,
      updated_at: new Date().toISOString(),
    };

    if (expiresDate) {
      upsertData.current_period_ends_at = new Date(expiresDate).toISOString();
    }

    if (mapped.trialUsed !== undefined) {
      upsertData.trial_used = mapped.trialUsed;
    }

    await supabase.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });

    const rank = ["active", "trial", "grace", "billing_retry"].includes(mapped.status) ? "standard" : "free";
    await supabase.from("profiles").update({ rank }).eq("id", appAccountToken);

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
