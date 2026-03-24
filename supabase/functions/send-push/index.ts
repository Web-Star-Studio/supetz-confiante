import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push utilities for VAPID signing
const VAPID_PUBLIC_KEY = "BFkdlQ0yHWosqvYLhrHVJq124UJS3Q9loArwJw3H4d5sPi8wEw7vjSupkta4RUuPxqT_k_-JYQh7eahdQnoAmkA";

function base64urlToUint8Array(b64: string): Uint8Array {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function importVapidKey(privateKeyB64url: string): Promise<CryptoKey> {
  const raw = base64urlToUint8Array(privateKeyB64url);
  // Build JWK from raw private key
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: btoa(String.fromCharCode(...base64urlToUint8Array(VAPID_PUBLIC_KEY).slice(1, 33)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...base64urlToUint8Array(VAPID_PUBLIC_KEY).slice(33, 65)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    d: privateKeyB64url,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidAuthHeader(
  endpoint: string,
  privateKeyB64url: string,
  subject: string,
): Promise<{ authorization: string; cryptoKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

  const encHeader = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  const key = await importVapidKey(privateKeyB64url);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );

  // Convert DER signature to raw r||s
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4 + (rLen - 32 > 0 ? rLen - 32 : 0);
    r = sigBytes.slice(4, 4 + rLen);
    if (r.length > 32) r = r.slice(r.length - 32);
    const sOffset = 4 + rLen;
    const sLen = sigBytes[sOffset + 1];
    s = sigBytes.slice(sOffset + 2, sOffset + 2 + sLen);
    if (s.length > 32) s = s.slice(s.length - 32);
  }

  const rPadded = new Uint8Array(32);
  rPadded.set(r, 32 - r.length);
  const sPadded = new Uint8Array(32);
  sPadded.set(s, 32 - s.length);
  const rawSig = new Uint8Array(64);
  rawSig.set(rPadded, 0);
  rawSig.set(sPadded, 32);

  const token = `${unsigned}.${uint8ArrayToBase64url(rawSig)}`;

  return {
    authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    cryptoKey: `p256ecdsa=${VAPID_PUBLIC_KEY}`,
  };
}

async function sendPushToSubscription(
  endpoint: string,
  title: string,
  body: string,
  privateKey: string,
  icon?: string,
  url?: string,
): Promise<boolean> {
  try {
    const vapidHeaders = await createVapidAuthHeader(endpoint, privateKey, "mailto:contato@supet.com.br");

    const payload = JSON.stringify({ title, body, icon: icon || "/pwa-192x192.png", url: url || "/" });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...vapidHeaders,
        "Content-Type": "application/octet-stream",
        TTL: "86400",
      },
      body: new TextEncoder().encode(payload),
    });

    return res.ok || res.status === 201;
  } catch (err) {
    console.error("Push send failed:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { title, body, user_ids, icon, url } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get subscriptions
    let query = supabase.from("push_subscriptions").select("endpoint, user_id");
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    }
    const { data: subscriptions, error } = await query;

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    for (const sub of subscriptions) {
      const ok = await sendPushToSubscription(sub.endpoint, title, body, vapidPrivateKey, icon, url);
      if (ok) sent++;
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sent}/${subscriptions.length} notifications`, sent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
