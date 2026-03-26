CREATE TABLE public.weekly_marketing_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  week_end date NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

ALTER TABLE public.weekly_marketing_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view weekly summaries" ON public.weekly_marketing_summaries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage weekly summaries" ON public.weekly_marketing_summaries
  FOR ALL TO public USING (auth.role() = 'service_role'::text) WITH CHECK (auth.role() = 'service_role'::text);