
-- Stock movements history table
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'sale', 'return')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL DEFAULT 0,
  new_stock integer NOT NULL DEFAULT 0,
  reason text,
  order_id uuid REFERENCES public.orders(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Low stock threshold column on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- Function to auto-deduct stock on order creation and log movement
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  prod record;
  item_qty integer;
  item_title text;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    item_title := item->>'title';
    item_qty := COALESCE((item->>'quantity')::integer, 1);
    
    -- Find product by title
    SELECT id, quantity INTO prod FROM public.products WHERE title = item_title LIMIT 1;
    
    IF prod.id IS NOT NULL THEN
      -- Log stock movement
      INSERT INTO public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, order_id, created_by)
      VALUES (prod.id, 'sale', item_qty, prod.quantity, GREATEST(0, prod.quantity - item_qty), 'Venda automática', NEW.id, NEW.user_id);
      
      -- Deduct stock
      UPDATE public.products SET quantity = GREATEST(0, quantity - item_qty) WHERE id = prod.id;
      
      -- Alert admin if low stock
      IF (prod.quantity - item_qty) <= (SELECT low_stock_threshold FROM public.products WHERE id = prod.id) THEN
        INSERT INTO public.admin_notifications (title, message, type)
        VALUES (
          '⚠️ Estoque baixo!',
          item_title || ' está com estoque baixo (' || GREATEST(0, prod.quantity - item_qty) || ' un.)',
          'stock'
        );
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Trigger to auto-deduct stock
CREATE TRIGGER trg_deduct_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order();
