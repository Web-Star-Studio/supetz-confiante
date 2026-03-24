
-- CRM: Customer funnel status
CREATE TABLE public.customer_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'inactive', 'vip')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage customer_status" ON public.customer_status FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CRM: Customer tags
CREATE TABLE public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage customer_tags" ON public.customer_tags FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CRM: Tag assignments (N:N)
CREATE TABLE public.customer_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);
ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tag_assignments" ON public.customer_tag_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CRM: Customer notes (internal)
CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage customer_notes" ON public.customer_notes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- CRM: Customer interactions timeline
CREATE TABLE public.customer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'note' CHECK (type IN ('purchase', 'contact', 'support', 'note', 'status_change', 'tag_change')),
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage customer_interactions" ON public.customer_interactions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Marketing: Campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'notification' CHECK (type IN ('coupon', 'notification', 'both')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  segment_filter jsonb DEFAULT '{}',
  message text,
  coupon_discount_type text CHECK (coupon_discount_type IN ('percentage', 'fixed')),
  coupon_discount_value numeric,
  coupon_min_order numeric,
  coupon_expires_days integer DEFAULT 30,
  recipients_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  completed_at timestamptz
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Marketing: Campaign recipients
CREATE TABLE public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sent_at timestamptz DEFAULT now(),
  opened boolean DEFAULT false,
  coupon_id uuid REFERENCES public.user_coupons(id),
  UNIQUE(campaign_id, user_id)
);
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage campaign_recipients" ON public.campaign_recipients FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
