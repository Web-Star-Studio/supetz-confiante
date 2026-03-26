import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RefTracker() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("supet_ref", ref);
      // Track click
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
