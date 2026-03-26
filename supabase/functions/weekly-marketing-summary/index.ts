import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Calculate last week's range (Mon-Sun)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const lastMonday = new Date(now)
  lastMonday.setDate(now.getDate() - dayOfWeek - 6)
  lastMonday.setHours(0, 0, 0, 0)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  const weekStartStr = lastMonday.toISOString().split('T')[0]
  const weekEndStr = lastSunday.toISOString().split('T')[0]

  // Check if summary already exists for this week
  const { data: existing } = await supabase
    .from('weekly_marketing_summaries')
    .select('id')
    .eq('week_start', weekStartStr)
    .maybeSingle()

  if (existing) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'already_generated', week: weekStartStr }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const startISO = lastMonday.toISOString()
  const endISO = lastSunday.toISOString()

  // Gather metrics in parallel
  const [
    campaignsRes,
    recipientsRes,
    automationsRes,
    executionsRes,
    newSubsRes,
    unsubsRes,
    emailLogsRes,
  ] = await Promise.all([
    supabase.from('campaigns').select('id, status').gte('created_at', startISO).lte('created_at', endISO),
    supabase.from('campaign_recipients').select('id, opened').gte('sent_at', startISO).lte('sent_at', endISO),
    supabase.from('marketing_automations').select('id, enabled'),
    supabase.from('automation_executions').select('id, automation_id').gte('created_at', startISO).lte('created_at', endISO),
    supabase.from('newsletter_subscribers').select('id').gte('subscribed_at', startISO).lte('subscribed_at', endISO).eq('status', 'active'),
    supabase.from('newsletter_subscribers').select('id').gte('unsubscribed_at', startISO).lte('unsubscribed_at', endISO),
    supabase.from('email_send_log').select('id, message_id, status').gte('created_at', startISO).lte('created_at', endISO),
  ])

  const campaigns = campaignsRes.data || []
  const recipients = recipientsRes.data || []
  const automations = automationsRes.data || []
  const executions = executionsRes.data || []
  const emailLogs = emailLogsRes.data || []

  // Deduplicate email logs by message_id
  const deduped = new Map<string, { status: string }>()
  emailLogs.forEach((log: any) => {
    const key = log.message_id || log.id
    deduped.set(key, log)
  })
  const uniqueEmails = Array.from(deduped.values())
  const emailsSent = uniqueEmails.filter(e => e.status === 'sent').length
  const emailsFailed = uniqueEmails.filter(e => e.status === 'dlq' || e.status === 'failed').length

  const totalOpened = recipients.filter((r: any) => r.opened).length
  const openRate = recipients.length > 0 ? Number(((totalOpened / recipients.length) * 100).toFixed(1)) : 0

  const summary = {
    campaigns_created: campaigns.length,
    campaigns_sent: campaigns.filter((c: any) => c.status === 'active' || c.status === 'completed').length,
    recipients_reached: recipients.length,
    open_rate: openRate,
    automations_active: automations.filter((a: any) => a.enabled).length,
    automation_executions: executions.length,
    new_subscribers: (newSubsRes.data || []).length,
    unsubscribes: (unsubsRes.data || []).length,
    emails_sent: emailsSent,
    emails_failed: emailsFailed,
  }

  // Save summary
  await supabase.from('weekly_marketing_summaries').insert({
    week_start: weekStartStr,
    week_end: weekEndStr,
    summary,
  })

  // Create admin notification
  const lines = [
    `📊 Campanhas: ${summary.campaigns_sent} enviadas, ${summary.recipients_reached} destinatários (${summary.open_rate}% abertura)`,
    `⚡ Automações: ${summary.automation_executions} execuções`,
    `📧 E-mails: ${summary.emails_sent} enviados, ${summary.emails_failed} falhas`,
    `👥 Newsletter: +${summary.new_subscribers} novos, -${summary.unsubscribes} cancelamentos`,
  ]

  await supabase.from('admin_notifications').insert({
    title: `📈 Resumo semanal de marketing (${lastMonday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${lastSunday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
    message: lines.join(' | '),
    type: 'marketing_summary',
  })

  return new Response(
    JSON.stringify({ success: true, week: weekStartStr, summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
