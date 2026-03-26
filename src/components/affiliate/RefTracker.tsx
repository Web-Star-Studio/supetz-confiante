import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REF_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface RefData {
  slug: string;
  ts: number;
}

/** Read and validate the stored referral. Returns null if expired or missing. */
export function getActiveRef(): RefData | null {
  try {
    const raw = localStorage.getItem("supet_ref");
    if (!raw) return null;

    // Legacy format: plain string
    if (!raw.startsWith("{")) {
      const data: RefData = { slug: raw, ts: Date.now() };
      localStorage.setItem("supet_ref", JSON.stringify(data));
      return data;
    }

    const data: RefData = JSON.parse(raw);
    if (!data.slug) return null;
    if (Date.now() - data.ts > REF_EXPIRY_MS) {
      localStorage.removeItem("supet_ref");
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem("supet_ref");
    return null;
  }
}

export default function RefTracker() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      const data: RefData = { slug: ref, ts: Date.now() };
      localStorage.setItem("supet_ref", JSON.stringify(data));
      trackClick(ref);
    }
  }, [searchParams]);

  return null;
}

async function trackClick(refSlug: string) {
  try {
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("ref_slug", refSlug)
      .eq("status", "active")
      .maybeSingle();

    if (affiliate) {
      await supabase.from("affiliate_clicks").insert({
        affiliate_id: affiliate.id,
        ip_hash: "anonymous",
        user_agent: navigator.userAgent.substring(0, 200),
      });
    }
  } catch {
    // Silent fail for tracking
  }
}
