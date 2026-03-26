
CREATE TABLE public.campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  html_content text NOT NULL DEFAULT '',
  preview_text text NOT NULL DEFAULT '',
  accent_color text NOT NULL DEFAULT '#f97316',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign_templates"
  ON public.campaign_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON public.campaign_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link templates to campaigns
ALTER TABLE public.campaigns ADD COLUMN template_id uuid REFERENCES public.campaign_templates(id);

-- Insert default templates
INSERT INTO public.campaign_templates (name, subject, category, accent_color, preview_text, html_content) VALUES
('Boas-vindas', 'Bem-vindo à família Supet! 🐾', 'onboarding', '#10b981', 'Obrigado por se juntar a nós!', '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#10b981;padding:32px;text-align:center;border-radius:16px 16px 0 0"><h1 style="color:#fff;margin:0;font-size:28px">Bem-vindo à Supet! 🐾</h1></div><div style="padding:32px;background:#fff"><p style="font-size:16px;color:#333;line-height:1.6">Olá <strong>{{nome}}</strong>,</p><p style="font-size:16px;color:#333;line-height:1.6">Estamos muito felizes em ter você na nossa comunidade de tutores que cuidam dos seus pets com amor e ciência.</p><div style="text-align:center;margin:32px 0"><a href="{{link}}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">Conheça nossos produtos</a></div><p style="font-size:14px;color:#666;line-height:1.6">Se tiver qualquer dúvida, estamos aqui para ajudar!</p></div></div>'),
('Promoção', '🔥 Oferta especial para você!', 'promocao', '#f97316', 'Não perca essa oferta exclusiva!', '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#f97316,#ef4444);padding:32px;text-align:center;border-radius:16px 16px 0 0"><h1 style="color:#fff;margin:0;font-size:28px">🔥 Oferta Especial!</h1><p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px">Por tempo limitado</p></div><div style="padding:32px;background:#fff"><p style="font-size:16px;color:#333;line-height:1.6">Olá <strong>{{nome}}</strong>,</p><p style="font-size:16px;color:#333;line-height:1.6">Preparamos uma oferta exclusiva para você:</p><div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:24px;text-align:center;margin:24px 0"><p style="font-size:14px;color:#666;margin:0 0 8px">Use o cupom:</p><p style="font-size:28px;font-weight:bold;color:#f97316;margin:0;letter-spacing:2px">{{cupom}}</p><p style="font-size:14px;color:#666;margin:8px 0 0">{{desconto}} de desconto</p></div><div style="text-align:center;margin:32px 0"><a href="{{link}}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">Aproveitar agora</a></div></div></div>'),
('Reengajamento', 'Sentimos sua falta! 💛', 'reengajamento', '#8b5cf6', 'Faz tempo que não nos visitamos...', '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#8b5cf6;padding:32px;text-align:center;border-radius:16px 16px 0 0"><h1 style="color:#fff;margin:0;font-size:28px">Sentimos sua falta! 💛</h1></div><div style="padding:32px;background:#fff"><p style="font-size:16px;color:#333;line-height:1.6">Olá <strong>{{nome}}</strong>,</p><p style="font-size:16px;color:#333;line-height:1.6">Faz um tempo que não te vemos por aqui e queremos saber como seu pet está! 🐕</p><p style="font-size:16px;color:#333;line-height:1.6">Temos novidades incríveis esperando por você.</p><div style="text-align:center;margin:32px 0"><a href="{{link}}" style="background:#8b5cf6;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px">Ver novidades</a></div></div></div>');
