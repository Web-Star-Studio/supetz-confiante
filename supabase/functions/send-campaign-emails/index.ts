import { createClient } from 'npm:@supabase/supabase-js@2'

const SITE_NAME = "supetz-playful-trust"
const SENDER_DOMAIN = "notify.supet.com.br"
const FROM_DOMAIN = "supet.com.br"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let campaignId: string
  try {
    const body = await req.json()
    campaignId = body.campaign_id
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!campaignId) {
    return new Response(
      JSON.stringify({ error: 'campaign_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Fetch campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campErr || !campaign) {
    return new Response(
      JSON.stringify({ error: 'Campaign not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 2. Fetch template if linked
  let htmlContent: string | null = null
  let emailSubject = `📢 ${campaign.name}`

  if (campaign.template_id) {
    const { data: template } = await supabase
      .from('campaign_templates')
      .select('html_content, subject, name')
      .eq('id', campaign.template_id)
      .single()

    if (template) {
      htmlContent = template.html_content
      emailSubject = template.subject || emailSubject
    }
  }

  // If no template, build a simple HTML from campaign message
  if (!htmlContent && campaign.message) {
    htmlContent = `
      <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:600px;margin:0 auto;padding:0">
        <div style="background-color:#E87B1C;padding:24px 32px;border-radius:16px 16px 0 0;text-align:center">
          <span style="color:#fff;font-size:24px;font-weight:800;letter-spacing:1px">🐾 Supet</span>
        </div>
        <div style="padding:32px;text-align:center">
          <h1 style="font-size:22px;font-weight:800;color:#3D3228;margin:0 0 16px">${campaign.name}</h1>
          <p style="font-size:15px;color:#7A6E63;line-height:1.6;margin:0 0 24px">${campaign.message}</p>
          <a href="https://supet.com.br/shop" style="display:inline-block;padding:14px 28px;background-color:#E87B1C;color:#fff;font-weight:700;border-radius:999px;text-decoration:none;font-size:14px">
            Ver Produtos
          </a>
        </div>
        <div style="padding:16px 32px;text-align:center;border-top:1px solid #F0E8E0">
          <p style="font-size:12px;color:#C4B5A5;margin:0">Supet — Cuidado natural para seu pet 🐾</p>
        </div>
      </div>`
  }

  if (!htmlContent) {
    return new Response(
      JSON.stringify({ error: 'No email content (template or message required)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 3. Get campaign recipients
  const { data: recipients } = await supabase
    .from('campaign_recipients')
    .select('user_id')
    .eq('campaign_id', campaignId)

  if (!recipients?.length) {
    return new Response(
      JSON.stringify({ error: 'No recipients found', enqueued: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 4. Resolve emails from auth.users via admin API
  const userIds = recipients.map((r) => r.user_id)
  const userEmails: Record<string, string> = {}

  // Batch fetch user emails - Supabase admin listUsers
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (usersData?.users) {
    for (const u of usersData.users) {
      if (userIds.includes(u.id) && u.email) {
        userEmails[u.id] = u.email
      }
    }
  }

  // 5. Check suppression and enqueue emails
  let enqueuedCount = 0
  let suppressedCount = 0

  for (const recipient of recipients) {
    const email = userEmails[recipient.user_id]
    if (!email) continue

    // Check suppression
    const { data: suppressed } = await supabase
      .from('suppressed_emails')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (suppressed) {
      suppressedCount++
      continue
    }

    // Get or create unsubscribe token
    const normalizedEmail = email.toLowerCase()
    let unsubscribeToken: string

    const { data: existingToken } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingToken && !existingToken.used_at) {
      unsubscribeToken = existingToken.token
    } else if (!existingToken) {
      unsubscribeToken = generateToken()
      await supabase
        .from('email_unsubscribe_tokens')
        .upsert(
          { token: unsubscribeToken, email: normalizedEmail },
          { onConflict: 'email', ignoreDuplicates: true }
        )
      const { data: storedToken } = await supabase
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalizedEmail)
        .maybeSingle()
      unsubscribeToken = storedToken?.token || unsubscribeToken
    } else {
      // Token already used (unsubscribed)
      suppressedCount++
      continue
    }

    const messageId = crypto.randomUUID()

    // Replace template variables
    let personalizedHtml = htmlContent
      .replace(/\{\{nome\}\}/gi, '') // We don't have name easily; leave blank
      .replace(/\{\{email\}\}/gi, email)

    // Log pending
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: `campaign-${campaign.name.slice(0, 50)}`,
      recipient_email: email,
      status: 'pending',
    })

    // Enqueue
    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: emailSubject,
        html: personalizedHtml,
        text: campaign.message || campaign.name,
        purpose: 'transactional',
        label: `campaign-${campaignId.slice(0, 8)}`,
        idempotency_key: `campaign-${campaignId}-${recipient.user_id}`,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (!enqueueError) {
      enqueuedCount++
    } else {
      console.error('Failed to enqueue campaign email', { error: enqueueError, email })
    }
  }

  // 6. Update campaign status
  await supabase
    .from('campaigns')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', campaignId)

  console.log('Campaign emails enqueued', {
    campaignId,
    enqueued: enqueuedCount,
    suppressed: suppressedCount,
  })

  return new Response(
    JSON.stringify({ success: true, enqueued: enqueuedCount, suppressed: suppressedCount }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
