import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: automations, error: autoErr } = await supabase
      .from("marketing_automations")
      .select("*")
      .eq("enabled", true);

    if (autoErr) throw autoErr;
    if (!automations || automations.length === 0) {
      return new Response(JSON.stringify({ message: "No enabled automations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const results: Record<string, number> = {};

    for (const auto of automations) {
      let targetUserIds: string[] = [];

      try {
        // ── Resolve target users based on trigger type ──
        targetUserIds = await resolveTargetUsers(supabase, auto, now);

        // Deduplicate
        targetUserIds = [...new Set(targetUserIds)];

        // Filter out users who already received this automation today
        if (targetUserIds.length > 0) {
          const { data: existing } = await supabase
            .from("automation_executions")
            .select("user_id")
            .eq("automation_id", auto.id)
            .gte("created_at", today + "T00:00:00Z");

          const existingSet = new Set((existing || []).map((e: any) => e.user_id));
          targetUserIds = targetUserIds.filter((uid) => !existingSet.has(uid));
        }

        // ── Execute actions ──
        let executedCount = 0;
        const actionConfig = auto.action_config || {};
        const needsEmail = auto.action_type === "email" || auto.action_type === "email_and_notification";
        const needsNotification = auto.action_type === "notification" || auto.action_type === "both" || auto.action_type === "email_and_notification";
        const needsCoupon = auto.action_type === "coupon" || auto.action_type === "both";

        // Pre-fetch email template HTML if needed
        let emailHtml: string | null = null;
        let emailSubject: string | null = null;
        if (needsEmail && actionConfig.email_template_id) {
          const { data: tpl } = await supabase
            .from("campaign_templates")
            .select("html_content, subject, name")
            .eq("id", actionConfig.email_template_id)
            .single();
          if (tpl) {
            emailHtml = tpl.html_content;
            emailSubject = tpl.subject || `Novidade da Supet — ${tpl.name}`;
          }
        }

        for (const uid of targetUserIds) {
          let couponId: string | null = null;

          // Get contextual data for variable replacement
          let petName = "";
          let productTitle = "";

          if (auto.trigger_type === "pet_birthday") {
            const { data: pet } = await supabase
              .from("pets")
              .select("name")
              .eq("user_id", uid)
              .limit(1)
              .single();
            petName = pet?.name || "seu pet";
          }

          if (auto.trigger_type === "restock_reminder") {
            const { data: reminder } = await supabase
              .from("restock_reminders")
              .select("product_title")
              .eq("user_id", uid)
              .eq("reminded", false)
              .limit(1)
              .single();
            productTitle = reminder?.product_title || "seu produto";
          }

          // Create coupon if applicable
          if (needsCoupon) {
            const code = `AUTO-${auto.trigger_type.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            const { data: couponData } = await supabase
              .from("user_coupons")
              .insert({
                user_id: uid,
                code,
                discount_type: actionConfig.coupon_discount_type || "percentage",
                discount_value: actionConfig.coupon_discount_value || 10,
                min_order_value: actionConfig.coupon_min_order || 0,
                expires_at: new Date(
                  Date.now() + (actionConfig.coupon_expires_days || 14) * 86400000
                ).toISOString(),
              })
              .select()
              .single();

            couponId = couponData?.id || null;
          }

          // Send notification
          if (needsNotification) {
            const title = (actionConfig.notification_title || "")
              .replace("{{pet_nome}}", petName)
              .replace("{{produto}}", productTitle);
            const message = (actionConfig.notification_message || "")
              .replace("{{pet_nome}}", petName)
              .replace("{{produto}}", productTitle);

            await supabase.from("user_notifications").insert({
              user_id: uid,
              title,
              message,
              type: "campaign",
              link: "/shop",
            });
          }

          // Send email via queue
          if (needsEmail && emailHtml) {
            try {
              // Resolve user email from auth.users via find_user_id_by_email (reverse lookup not available)
              // Instead, use service role to query auth.users
              const { data: authData } = await supabase.auth.admin.getUserById(uid);
              const userEmail = authData?.user?.email;

              if (userEmail) {
                // Check suppression
                const { data: suppressed } = await supabase
                  .from("suppressed_emails")
                  .select("id")
                  .eq("email", userEmail)
                  .limit(1);

                if (!suppressed || suppressed.length === 0) {
                  // Replace variables in HTML
                  let finalHtml = emailHtml
                    .replace(/\{\{pet_nome\}\}/g, petName)
                    .replace(/\{\{produto\}\}/g, productTitle);

                  let finalSubject = (emailSubject || "Supet")
                    .replace(/\{\{pet_nome\}\}/g, petName)
                    .replace(/\{\{produto\}\}/g, productTitle);

                  // Enqueue the email
                  await supabase.rpc("enqueue_email", {
                    queue_name: "transactional_emails",
                    payload: {
                      to: userEmail,
                      subject: finalSubject,
                      html: finalHtml,
                      purpose: "transactional",
                      idempotency_key: `auto-${auto.id}-${uid}-${today}`,
                    },
                  });
                }
              }
            } catch (emailErr) {
              console.error(`Email error for user ${uid}:`, emailErr);
            }
          }

          // Log execution
          await supabase.from("automation_executions").insert({
            automation_id: auto.id,
            user_id: uid,
            action_taken: auto.action_type,
            metadata: { coupon_id: couponId, trigger_type: auto.trigger_type },
          });

          executedCount++;
        }

        results[auto.name] = executedCount;

        await supabase
          .from("marketing_automations")
          .update({ last_run_at: now.toISOString() })
          .eq("id", auto.id);
      } catch (triggerErr) {
        console.error(`Error processing automation ${auto.name}:`, triggerErr);
        results[auto.name] = -1;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Automation engine error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helper: resolve target user IDs based on trigger type ──
async function resolveTargetUsers(supabase: any, auto: any, now: Date): Promise<string[]> {
  const targetUserIds: string[] = [];

  switch (auto.trigger_type) {
    case "pet_birthday": {
      const daysBefore = auto.trigger_config?.days_before ?? 0;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetMM = String(targetDate.getMonth() + 1).padStart(2, "0");
      const targetDD = String(targetDate.getDate()).padStart(2, "0");

      const { data: pets } = await supabase
        .from("pets")
        .select("user_id, name, birth_date")
        .not("birth_date", "is", null);

      if (pets) {
        for (const pet of pets) {
          if (!pet.birth_date) continue;
          const mm = pet.birth_date.substring(5, 7);
          const dd = pet.birth_date.substring(8, 10);
          if (mm === targetMM && dd === targetDD) {
            targetUserIds.push(pet.user_id);
          }
        }
      }
      break;
    }

    case "inactive_customer": {
      const daysInactive = auto.trigger_config?.days_inactive ?? 60;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - daysInactive);

      const { data: profiles } = await supabase.from("profiles").select("user_id");
      if (profiles) {
        const userIds = profiles.map((p: any) => p.user_id);
        const { data: orders } = await supabase
          .from("orders")
          .select("user_id, created_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false });

        const lastOrderMap: Record<string, string> = {};
        (orders || []).forEach((o: any) => {
          if (!lastOrderMap[o.user_id]) lastOrderMap[o.user_id] = o.created_at;
        });

        for (const uid of userIds) {
          const lastOrder = lastOrderMap[uid];
          if (lastOrder && new Date(lastOrder) < cutoff) {
            targetUserIds.push(uid);
          } else if (!lastOrder) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("created_at")
              .eq("user_id", uid)
              .single();
            if (prof && new Date(prof.created_at) < cutoff) {
              targetUserIds.push(uid);
            }
          }
        }
      }
      break;
    }

    case "post_purchase": {
      const daysAfter = auto.trigger_config?.days_after ?? 3;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - daysAfter);
      const targetStr = targetDate.toISOString().split("T")[0];

      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, created_at")
        .gte("created_at", targetStr + "T00:00:00Z")
        .lt("created_at", targetStr + "T23:59:59Z")
        .not("status", "eq", "cancelled");

      if (orders) {
        targetUserIds.push(...[...new Set(orders.map((o: any) => o.user_id))]);
      }
      break;
    }

    case "welcome_no_purchase": {
      const daysAfterSignup = auto.trigger_config?.days_after_signup ?? 3;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - daysAfterSignup);
      const targetStr = targetDate.toISOString().split("T")[0];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, created_at")
        .gte("created_at", targetStr + "T00:00:00Z")
        .lt("created_at", targetStr + "T23:59:59Z");

      if (profiles) {
        for (const p of profiles) {
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", p.user_id);
          if (count === 0) {
            targetUserIds.push(p.user_id);
          }
        }
      }
      break;
    }

    case "post_delivery": {
      const daysAfterDelivery = auto.trigger_config?.days_after_delivery ?? 5;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - daysAfterDelivery);
      const targetStr = targetDate.toISOString().split("T")[0];

      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, updated_at")
        .eq("status", "delivered")
        .gte("updated_at", targetStr + "T00:00:00Z")
        .lt("updated_at", targetStr + "T23:59:59Z");

      if (orders) {
        targetUserIds.push(...[...new Set(orders.map((o: any) => o.user_id))]);
      }
      break;
    }

    case "restock_reminder": {
      const daysBefore = auto.trigger_config?.days_before_end ?? 5;
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetStr = targetDate.toISOString().split("T")[0];

      const { data: reminders } = await supabase
        .from("restock_reminders")
        .select("user_id, product_title")
        .eq("reminded", false)
        .lte("estimated_end_date", targetStr);

      if (reminders) {
        for (const r of reminders) {
          targetUserIds.push(r.user_id);
        }
      }
      break;
    }
  }

  return targetUserIds;
}
