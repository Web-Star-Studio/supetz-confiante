
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
  threshold integer := 70;
  recent_alert_exists boolean;
BEGIN
  -- Only check on negative feedback
  IF NEW.rating <> 'negative' THEN
    RETURN NEW;
  END IF;

  -- Count feedbacks from last 7 days
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE rating = 'positive')
  INTO total_count, positive_count
  FROM public.chat_feedback
  WHERE created_at >= now() - interval '7 days';

  -- Need at least 5 feedbacks to trigger
  IF total_count < 5 THEN
    RETURN NEW;
  END IF;

  satisfaction_rate := ROUND((positive_count::numeric / total_count) * 100);

  -- Only alert if below threshold
  IF satisfaction_rate >= threshold THEN
    RETURN NEW;
  END IF;

  -- Avoid duplicate alerts within 24h
  SELECT EXISTS (
    SELECT 1 FROM public.admin_notifications
    WHERE type = 'feedback_alert'
      AND created_at >= now() - interval '24 hours'
  ) INTO recent_alert_exists;

  IF recent_alert_exists THEN
    RETURN NEW;
  END IF;

  -- Create admin notification
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

CREATE TRIGGER trg_check_feedback_satisfaction
AFTER INSERT ON public.chat_feedback
FOR EACH ROW
EXECUTE FUNCTION public.check_feedback_satisfaction_alert();
