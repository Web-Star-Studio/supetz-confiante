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

    // Find reminders expiring within 5 days that haven't been reminded yet
    const now = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(now.getDate() + 5);

    const { data: reminders, error } = await supabase
      .from("restock_reminders")
      .select("id, user_id, product_title, estimated_end_date, pet_id")
      .eq("reminded", false)
      .lte("estimated_end_date", fiveDaysFromNow.toISOString().split("T")[0])
      .gte("estimated_end_date", now.toISOString().split("T")[0]);

    if (error) throw error;

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to process", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const reminder of reminders) {
      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", reminder.user_id)
        .maybeSingle();

      // Get pet name if linked
      let petName = "";
      if (reminder.pet_id) {
        const { data: pet } = await supabase
          .from("pets")
          .select("name")
          .eq("id", reminder.pet_id)
          .maybeSingle();
        petName = pet?.name || "";
      }

      const daysLeft = Math.ceil(
        (new Date(reminder.estimated_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const userName = profile?.full_name || "Cliente";
      const petInfo = petName ? ` do ${petName}` : "";
      const urgency = daysLeft <= 0 ? "esgotou" : daysLeft === 1 ? "acaba amanhã" : `acaba em ${daysLeft} dias`;

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        title: `⏰ Reposição: ${reminder.product_title}`,
        message: `${userName} — ${reminder.product_title}${petInfo} ${urgency}`,
        type: "restock",
      });

      // Mark as reminded
      await supabase
        .from("restock_reminders")
        .update({ reminded: true })
        .eq("id", reminder.id);

      processed++;
    }

    return new Response(
      JSON.stringify({ message: `Processed ${processed} restock reminders`, count: processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing restock reminders:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});