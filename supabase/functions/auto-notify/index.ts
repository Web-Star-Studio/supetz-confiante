import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: string[] = [];

    // 1. Check low stock products
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("id, title, quantity, low_stock_threshold")
      .filter("active", "eq", true);

    const lowStock = (lowStockProducts || []).filter(
      (p) => p.quantity <= p.low_stock_threshold
    );

    if (lowStock.length > 0) {
      const titles = lowStock.map((p) => `${p.title} (${p.quantity}un)`).join(", ");

      // Notify all admin users via push
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);

        // Call send-push function
        try {
          await supabase.functions.invoke("send-push", {
            body: {
              title: "⚠️ Estoque baixo!",
              body: `Produtos com estoque crítico: ${titles}`,
              user_ids: adminIds,
              url: "/admin/estoque",
            },
          });
          results.push(`Low stock alert sent for: ${titles}`);
        } catch (e) {
          results.push(`Low stock push failed: ${e}`);
        }
      }
    }

    // 2. Check recent orders (last 10 min) to notify admins
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, customer_name, total, created_at")
      .gte("created_at", tenMinAgo)
      .order("created_at", { ascending: false });

    if (recentOrders && recentOrders.length > 0) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);

        for (const order of recentOrders) {
          try {
            await supabase.functions.invoke("send-push", {
              body: {
                title: "🎉 Novo pedido!",
                body: `${order.customer_name || "Cliente"} — R$ ${Number(order.total).toFixed(2)}`,
                user_ids: adminIds,
                url: "/admin/pedidos",
              },
            });
            results.push(`Order push sent for #${order.id.slice(0, 8)}`);
          } catch (e) {
            results.push(`Order push failed: ${e}`);
          }
        }
      }
    }

    // 3. Check restock reminders expiring soon → notify users
    const now = new Date();
    const threeDays = new Date();
    threeDays.setDate(now.getDate() + 3);

    const { data: reminders } = await supabase
      .from("restock_reminders")
      .select("user_id, product_title, estimated_end_date")
      .eq("reminded", false)
      .lte("estimated_end_date", threeDays.toISOString().split("T")[0])
      .gte("estimated_end_date", now.toISOString().split("T")[0]);

    if (reminders && reminders.length > 0) {
      for (const r of reminders) {
        try {
          await supabase.functions.invoke("send-push", {
            body: {
              title: "⏰ Hora de repor!",
              body: `O ${r.product_title} está acabando. Reponha agora!`,
              user_ids: [r.user_id],
              url: "/shop",
            },
          });
          results.push(`Restock push for user ${r.user_id.slice(0, 8)}`);
        } catch (e) {
          results.push(`Restock push failed: ${e}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Auto-notify completed", results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("auto-notify error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
