import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EntitlementState =
  | "active"
  | "payment_issue_with_access"
  | "payment_issue_no_access"
  | "cancelled_but_active_until_end"
  | "expired";

interface AppleNotification {
  notificationType: string;
  subtype?: string;
  data?: {
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
}

interface AppleTransactionInfo {
  appAccountToken?: string;
  originalTransactionId?: string;
  expiresDate?: number;
  productId?: string;
  offerDiscountType?: string;
}

function decodeJWSPayload(jws: string): Record<string, unknown> {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWS");
  const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(payload);
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** App Store の年額サブスク Product ID（iOS Config.iapYearlyProductID と一致させる） */
const APPLE_YEARLY_PRODUCT_ID = "jp.jazzify.premium.yearly";

function planCodeForAppleProduct(productId: string | undefined): string | null {
  if (!productId) return null;
  return productId === APPLE_YEARLY_PRODUCT_ID ? "core_yearly" : "core_monthly";
}

function normalizeUuidString(value: string): string | null {
  const lower = value.trim().toLowerCase();
  return UUID_RE.test(lower) ? lower : null;
}

function isAppleFreeTrialOffer(transactionInfo: AppleTransactionInfo | undefined): boolean {
  return transactionInfo?.offerDiscountType === "FREE_TRIAL";
}

function mapAppleNotification(
  notificationType: string,
  subtype: string | undefined,
  expiresDateMs: number | undefined,
  isFreeTrial: boolean,
  nowMs: number = Date.now(),
): { status: string; entitlementState: EntitlementState; trialUsed?: boolean } {
  const periodEndMs = expiresDateMs ?? 0;
  const periodStillActive = expiresDateMs !== undefined && periodEndMs > nowMs;

  switch (notificationType) {
    case "SUBSCRIBED":
      if (subtype === "INITIAL_BUY" && isFreeTrial) {
        return { status: "trial", entitlementState: "active", trialUsed: true };
      }
      return { status: "active", entitlementState: "active" };
    case "DID_RENEW":
      return { status: "active", entitlementState: "active" };
    case "DID_FAIL_TO_RENEW":
      return { status: "billing_retry", entitlementState: "payment_issue_no_access" };
    case "GRACE_PERIOD_STARTED":
      return { status: "grace", entitlementState: "active" };
    case "EXPIRED":
      return { status: "expired", entitlementState: "expired" };
    case "DID_CHANGE_RENEWAL_STATUS":
      if (subtype === "AUTO_RENEW_DISABLED") {
        if (expiresDateMs === undefined || periodStillActive) {
          return { status: "canceled", entitlementState: "cancelled_but_active_until_end" };
        }
        return { status: "canceled", entitlementState: "expired" };
      }
      if (subtype === "AUTO_RENEW_ENABLED") {
        return { status: "active", entitlementState: "active" };
      }
      return { status: "active", entitlementState: "active" };
    case "REVOKE":
    case "REFUND":
      return { status: "expired", entitlementState: "expired" };
    case "OFFER_REDEEMED":
      return { status: "trial", entitlementState: "active", trialUsed: true };
    default:
      return { status: "active", entitlementState: "active" };
  }
}

function nextAppleTrialUsed(
  existingTrialUsed: boolean,
  mappedTrialUsed: boolean | undefined,
): boolean {
  if (existingTrialUsed) {
    return true;
  }
  return mappedTrialUsed === true;
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

async function recordUserMilestoneSafe(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  milestone: "trial_start",
): Promise<void> {
  try {
    const { error } = await supabase.rpc("record_user_milestone", {
      p_user_id: userId,
      p_milestone: milestone,
    });
    if (error) {
      /* analytics must not block webhook processing */
    }
  } catch {
    /* analytics must not block webhook processing */
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

      const tokenFromBody =
        typeof body.appAccountToken === "string"
          ? normalizeUuidString(body.appAccountToken)
          : null;
      const authUserId = normalizeUuidString(user.id);
      if (!tokenFromBody || !authUserId || tokenFromBody !== authUserId) {
        return new Response(JSON.stringify({ error: "appAccountToken mismatch" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ received: true, skipped: "subscription_row_exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const clientPlanCode =
        planCodeForAppleProduct(typeof body.productId === "string" ? body.productId : undefined)
        ?? "core_monthly";

      const { error: insertErr } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        provider: "apple",
        provider_subscription_id: body.originalTransactionId,
        plan_code: clientPlanCode,
        status: "active",
        entitlement_state: "active",
        trial_used: false,
      });

      if (insertErr && insertErr.code !== "23505") {
        return new Response(JSON.stringify({ error: "insert_failed", details: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!insertErr) {
        await supabase.from("profiles").update({ rank: "standard" }).eq("id", user.id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      return new Response(JSON.stringify({ error: "Missing signedPayload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notification = decodeJWSPayload(signedPayload) as unknown as AppleNotification;
    const { notificationType, subtype, data } = notification;

    let transactionInfo: AppleTransactionInfo = {};
    if (data?.signedTransactionInfo) {
      transactionInfo = decodeJWSPayload(data.signedTransactionInfo) as AppleTransactionInfo;
    }

    const appAccountTokenRaw = transactionInfo.appAccountToken;
    const appAccountToken = appAccountTokenRaw
      ? normalizeUuidString(appAccountTokenRaw)
      : null;
    const originalTransactionId = transactionInfo.originalTransactionId;
    const expiresDate = transactionInfo.expiresDate;
    const productId = transactionInfo.productId;
    const isFreeTrial = isAppleFreeTrialOffer(transactionInfo);

    await supabase.from("subscription_events").insert({
      user_id: appAccountToken,
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

    const mapped = mapAppleNotification(notificationType, subtype, expiresDate, isFreeTrial);

    let planCode = planCodeForAppleProduct(productId);
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan_code, trial_used, trial_used_at")
      .eq("user_id", appAccountToken)
      .maybeSingle();

    if (!planCode) {
      planCode = existingSub?.plan_code ?? "core_monthly";
    }

    const existingTrialUsed = existingSub?.trial_used === true;
    const nextTrialUsed = nextAppleTrialUsed(existingTrialUsed, mapped.trialUsed);
    const trialBecameUsed = nextTrialUsed && !existingTrialUsed;

    const upsertData: Record<string, unknown> = {
      user_id: appAccountToken,
      provider: "apple",
      provider_subscription_id: originalTransactionId,
      plan_code: planCode,
      status: mapped.status,
      entitlement_state: mapped.entitlementState,
      trial_used: nextTrialUsed,
      updated_at: new Date().toISOString(),
    };

    if (expiresDate) {
      upsertData.current_period_ends_at = new Date(expiresDate).toISOString();
    }

    if (trialBecameUsed) {
      upsertData.trial_used_at = new Date().toISOString();
    }

    await supabase.from("subscriptions").upsert(upsertData, { onConflict: "user_id" });

    const rank = rankForSubscription("apple", mapped.entitlementState);
    await supabase.from("profiles").update({ rank }).eq("id", appAccountToken);

    if (trialBecameUsed) {
      await recordUserMilestoneSafe(supabase, appAccountToken, "trial_start");
    }

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
