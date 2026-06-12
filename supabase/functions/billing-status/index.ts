import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type BillingCapabilities = {
  can_change_plan: boolean;
  can_resume: boolean;
  can_manage_payment: boolean;
  can_cancel_pending_plan_change: boolean;
};

function deriveBillingCapabilities(
  provider: string,
  entitlementState: string,
  status: string,
  pendingPlanCode: string | null = null,
): BillingCapabilities {
  if (provider !== "lemon") {
    return {
      can_change_plan: false,
      can_resume: false,
      can_manage_payment: false,
      can_cancel_pending_plan_change: false,
    };
  }

  const isActiveEntitlement = entitlementState === "active";
  const isCancelledGrace = entitlementState === "cancelled_but_active_until_end";
  const isPastDue = entitlementState === "payment_issue_with_access" || status === "past_due";
  const hasPendingPlanChange = pendingPlanCode !== null;

  return {
    can_change_plan: isActiveEntitlement && !hasPendingPlanChange,
    can_resume: isCancelledGrace,
    can_manage_payment: isActiveEntitlement || isCancelledGrace || isPastDue,
    can_cancel_pending_plan_change: isActiveEntitlement && hasPendingPlanChange,
  };
}

function billingAmountJpyForPlanCode(planCode: string): number | null {
  if (planCode === "core_monthly") return 3980;
  if (planCode === "core_yearly") return 34800;
  return null;
}

function nextBillingAmountJpy(planCode: string, pendingPlanCode: string | null): number | null {
  const effectivePlanCode = pendingPlanCode ?? planCode;
  return billingAmountJpyForPlanCode(effectivePlanCode);
}

function buildBillingResponse(
  provider: string,
  status: string,
  entitlementState: string,
  planCode: string,
  trialUsed: boolean,
  trialUsedAt: string | null,
  currentPeriodEndsAt: string | null,
  pendingPlanCode: string | null = null,
  pendingPlanEffectiveAt: string | null = null,
) {
  const caps = deriveBillingCapabilities(provider, entitlementState, status, pendingPlanCode);
  return {
    provider,
    status,
    entitlement_state: entitlementState,
    plan_code: planCode,
    trial_used: trialUsed,
    trial_used_at: trialUsedAt,
    current_period_ends_at: currentPeriodEndsAt,
    pending_plan_code: pendingPlanCode,
    pending_plan_effective_at: pendingPlanEffectiveAt,
    next_billing_amount_jpy: nextBillingAmountJpy(planCode, pendingPlanCode),
    can_change_plan: caps.can_change_plan,
    can_resume: caps.can_resume,
    can_manage_payment: caps.can_manage_payment,
    can_cancel_pending_plan_change: caps.can_cancel_pending_plan_change,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      return new Response(JSON.stringify({ error: "Failed to fetch subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscription) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("rank, lemon_subscription_status, lemon_trial_used, lemon_trial_used_at")
        .eq("id", user.id)
        .single();

      const st = profile?.lemon_subscription_status;
      if (st === "past_due") {
        return new Response(JSON.stringify(buildBillingResponse(
          "lemon",
          "past_due",
          "payment_issue_with_access",
          "unknown",
          profile?.lemon_trial_used ?? false,
          profile?.lemon_trial_used_at ?? null,
          null,
        )), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isLemonActive = st === "active" || st === "on_trial";

      return new Response(JSON.stringify(buildBillingResponse(
        isLemonActive ? "lemon" : "none",
        isLemonActive ? (st === "on_trial" ? "trial" : "active") : "expired",
        isLemonActive ? "active" : "expired",
        "unknown",
        profile?.lemon_trial_used ?? false,
        profile?.lemon_trial_used_at ?? null,
        null,
      )), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(buildBillingResponse(
      subscription.provider,
      subscription.status,
      subscription.entitlement_state,
      subscription.plan_code,
      subscription.trial_used,
      subscription.trial_used_at ?? null,
      subscription.current_period_ends_at,
      subscription.pending_plan_code ?? null,
      subscription.pending_plan_effective_at ?? null,
    )), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
