
CREATE OR REPLACE FUNCTION public.check_feedback_satisfaction_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_count integer;
  positive_count integer;
  satisfaction_rate integer;
  threshold integer;
  recent_alert_exists boolean;
BEGIN
  IF NEW.rating <> 'negative' THEN
    RETURN NEW;
  END IF;

  -- Read configurable threshold from store_settings, default 70
  SELECT COALESCE((value->>'value')::integer, 70)
  INTO threshold
  FROM public.store_settings
  WHERE key = 'feedback_satisfaction_threshold';

  IF threshold IS NULL THEN
    threshold := 70;
  END IF;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 'positive')
  INTO total_count, positive_count
  FROM public.chat_feedback
  WHERE created_at >= now() - interval '7 days';

  IF total_count < 5 THEN
    RETURN NEW;
  END IF;

  satisfaction_rate := ROUND((positive_count::numeric / total_count) * 100);

  IF satisfaction_rate >= threshold THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_notifications
    WHERE type = 'feedback_alert'
      AND created_at >= now() - interval '24 hours'
  ) INTO recent_alert_exists;

  IF recent_alert_exists THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (title, message, type)
  VALUES (
    '⚠️ Satisfação da Super IA em queda!',
    'A taxa de satisfação dos últimos 7 dias caiu para ' || satisfaction_rate || '% (limiar: ' || threshold || '%). ' || 
    total_count || ' feedbacks analisados, ' || (total_count - positive_count) || ' negativos.',
    'feedback_alert'
  );

  RETURN NEW;
END;
$$;
