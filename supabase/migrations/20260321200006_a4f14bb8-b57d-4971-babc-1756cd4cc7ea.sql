
-- Create restock_reminders table
CREATE TABLE public.restock_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_end_date DATE NOT NULL,
  reminded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.restock_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.restock_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.restock_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.restock_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.restock_reminders FOR DELETE USING (auth.uid() = user_id);

-- Create treatment_logs table
CREATE TABLE public.treatment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.treatment_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.treatment_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.treatment_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.treatment_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_treatment_logs_updated_at BEFORE UPDATE ON public.treatment_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create treatment-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('treatment-photos', 'treatment-photos', true);

CREATE POLICY "Users can upload own treatment photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'treatment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own treatment photos" ON storage.objects FOR UPDATE USING (bucket_id = 'treatment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own treatment photos" ON storage.objects FOR DELETE USING (bucket_id = 'treatment-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view treatment photos" ON storage.objects FOR SELECT USING (bucket_id = 'treatment-photos');
