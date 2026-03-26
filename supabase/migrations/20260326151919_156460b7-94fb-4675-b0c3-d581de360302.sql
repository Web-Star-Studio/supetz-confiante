
-- Marketing automations table
CREATE TABLE public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL DEFAULT 'notification',
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing_automations"
  ON public.marketing_automations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_marketing_automations_updated_at
  BEFORE UPDATE ON public.marketing_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Execution log
CREATE TABLE public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action_taken text NOT NULL DEFAULT 'notification',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation_executions"
  ON public.automation_executions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default automations
INSERT INTO public.marketing_automations (name, description, trigger_type, trigger_config, action_type, action_config, enabled) VALUES
(
  'Aniversário do Pet',
  'Envia uma mensagem de parabéns e cupom de desconto no aniversário do pet',
  'pet_birthday',
  '{"days_before": 0}'::jsonb,
  'both',
  '{"notification_title": "🎂 Feliz aniversário, {{pet_nome}}!", "notification_message": "Hoje é o dia especial do seu pet! Use o cupom exclusivo.", "coupon_discount_type": "percentage", "coupon_discount_value": 15, "coupon_expires_days": 7, "coupon_min_order": 50}'::jsonb,
  false
),
(
  'Cliente Inativo',
  'Reengaja clientes que não compram há muito tempo',
  'inactive_customer',
  '{"days_inactive": 60}'::jsonb,
  'both',
  '{"notification_title": "💛 Sentimos sua falta!", "notification_message": "Faz tempo que não te vemos! Voltou com um presente especial.", "coupon_discount_type": "percentage", "coupon_discount_value": 10, "coupon_expires_days": 14, "coupon_min_order": 40}'::jsonb,
  false
),
(
  'Pós-Compra',
  'Envia um agradecimento e dicas de uso após a compra',
  'post_purchase',
  '{"days_after": 3}'::jsonb,
  'notification',
  '{"notification_title": "✨ Como está o tratamento?", "notification_message": "Já faz alguns dias desde a sua compra. Lembre-se de aplicar o produto diariamente para melhores resultados!", "coupon_discount_type": "percentage", "coupon_discount_value": 5, "coupon_expires_days": 30, "coupon_min_order": 0}'::jsonb,
  false
),
(
  'Boas-vindas (sem compra)',
  'Incentiva novos usuários que ainda não fizeram a primeira compra',
  'welcome_no_purchase',
  '{"days_after_signup": 3}'::jsonb,
  'both',
  '{"notification_title": "🐾 Ainda não experimentou?", "notification_message": "Seu pet merece o melhor! Aproveite um desconto especial na primeira compra.", "coupon_discount_type": "percentage", "coupon_discount_value": 10, "coupon_expires_days": 14, "coupon_min_order": 30}'::jsonb,
  false
),
(
  'Primeira Avaliação',
  'Pede avaliação do produto após entrega',
  'post_delivery',
  '{"days_after_delivery": 5}'::jsonb,
  'notification',
  '{"notification_title": "⭐ O que achou do produto?", "notification_message": "Sua opinião é muito importante! Avalie seu produto e ajude outros tutores.", "coupon_discount_type": "percentage", "coupon_discount_value": 5, "coupon_expires_days": 30, "coupon_min_order": 0}'::jsonb,
  false
);
