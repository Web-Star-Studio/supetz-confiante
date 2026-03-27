import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data needed for score calculation
    const [ordersRes, productsRes, profilesRes, expensesRes, campaignsRes, recipientsRes] =
      await Promise.all([
        supabase.from("orders").select("*", { count: "exact" }).limit(10000),
        supabase.from("products").select("*"),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("expenses").select("*").limit(5000),
        supabase.from("campaigns").select("*"),
        supabase.from("campaign_recipients").select("id", { count: "exact" }),
      ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const profilesCount = profilesRes.count || 0;
    const expenses = expensesRes.data || [];
    const campaigns = campaignsRes.data || [];
    const recipientsCount = recipientsRes.count || 0;

    // Calculate funnel
    const activeOrders = orders.filter((o: any) => o.status !== "cancelled");
    const buyerIds = new Set(activeOrders.map((o: any) => o.user_id));
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentBuyers = new Set(
      activeOrders
        .filter((o: any) => new Date(o.created_at) >= sixtyDaysAgo)
        .map((o: any) => o.user_id)
    );

    const activeBuyers = recentBuyers.size;
    const inactiveBuyers = buyerIds.size - activeBuyers;
    const leads = Math.max(0, profilesCount - buyerIds.size);
    const vipBuyers = activeOrders
      .reduce((map: Map<string, number>, o: any) => {
        map.set(o.user_id, (map.get(o.user_id) || 0) + 1);
        return map;
      }, new Map<string, number>());
    const vipCount = Array.from(vipBuyers.values()).filter((c) => c >= 3).size || 0;

    // Calculate radar metrics
    const totalRevenue = activeOrders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const lowStockCount = products.filter(
      (p: any) => p.active && p.quantity <= p.low_stock_threshold
    ).length;
    const activeProducts = products.filter((p: any) => p.active).length;
    const activeCampaigns = campaigns.filter(
      (c: any) => c.status === "active" || c.status === "sent"
    ).length;

    const margin =
      totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;
    const retentionRate =
      profilesCount > 0
        ? ((activeBuyers + vipCount) / profilesCount) * 100
        : 0;
    const stockHealth =
      products.length > 0
        ? ((products.length - lowStockCount) / products.length) * 100
        : 100;
    const catalogDiversity = Math.min(activeProducts * 15, 100);
    const marketingReach =
      profilesCount > 0
        ? Math.min((recipientsCount / profilesCount) * 100, 100)
        : 0;
    const conversionRate =
      profilesCount > 0
        ? Math.min((activeOrders.length / profilesCount) * 100, 100)
        : 0;

    const metrics = [
      Math.max(0, Math.min(margin, 100)),
      Math.min(retentionRate, 100),
      stockHealth,
      catalogDiversity,
      marketingReach,
      conversionRate,
    ];

    const overallScore = Math.round(
      metrics.reduce((s, v) => s + v, 0) / metrics.length
    );

    console.log(`Business health score: ${overallScore}`);

    // Read configurable threshold from store_settings
    const { data: thresholdSetting } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "health_score_threshold")
      .maybeSingle();

    const THRESHOLD = thresholdSetting?.value?.value
      ? Number(thresholdSetting.value.value)
      : 40;

    if (overallScore < THRESHOLD) {
      // Check if we already sent an alert in the last 24h
      const { data: recentAlerts } = await supabase
        .from("admin_notifications")
        .select("id")
        .eq("type", "health_alert")
        .gte(
          "created_at",
          new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        )
        .limit(1);

      if (!recentAlerts || recentAlerts.length === 0) {
        const weakMetrics = [];
        const metricNames = [
          "Margem",
          "Retenção",
          "Estoque",
          "Catálogo",
          "Marketing",
          "Conversão",
        ];
        metrics.forEach((v, i) => {
          if (v < 30) weakMetrics.push(`${metricNames[i]}: ${Math.round(v)}%`);
        });

        await supabase.from("admin_notifications").insert({
          title: "🚨 Score do negócio abaixo de 40!",
          message: `O score geral do negócio está em ${overallScore}/100. Áreas críticas: ${
            weakMetrics.length > 0 ? weakMetrics.join(", ") : "múltiplas métricas baixas"
          }. Acesse o dashboard para detalhes.`,
          type: "health_alert",
        });

        console.log("Health alert notification created");
      } else {
        console.log("Alert already sent in last 24h, skipping");
      }
    }

    return new Response(
      JSON.stringify({ score: overallScore, threshold: THRESHOLD, alerted: overallScore < THRESHOLD }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking business health:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
