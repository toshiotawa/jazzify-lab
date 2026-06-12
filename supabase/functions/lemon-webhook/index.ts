import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * @deprecated 本番 Webhook は Netlify `lemonsqueezyWebhook` を使用すること。
 * Lemon Squeezy ダッシュボードには Netlify URL のみ登録し、この Edge Function は登録解除すること。
 * 二重 webhook により plan_code / trial 状態が上書きされる事故を防ぐため、ここではイベントを記録のみ行う。
 */
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

    return new Response(JSON.stringify({
      received: true,
      skipped: "deprecated_use_netlify_webhook",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
