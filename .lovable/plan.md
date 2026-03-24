

## Plano: Sistema de Creditos de Acesso ao SuperPet AI (30 dias por compra)

### O que sera feito

Cada compra concede **30 dias de acesso ao SuperPet AI por produto comprado** (3 produtos = 90 dias, acumulativos). Quando o credito expira, o usuario ve uma tela informando que precisa comprar para reativar.

### Alteracoes

#### 1. Migracao SQL — tabela `ai_access_credits`

```sql
CREATE TABLE public.ai_access_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  days_granted integer NOT NULL DEFAULT 30,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.ai_access_credits ENABLE ROW LEVEL SECURITY;

-- RLS: usuarios veem apenas seus proprios creditos
CREATE POLICY "Users can view own credits" ON public.ai_access_credits
  FOR SELECT TO public USING (auth.uid() = user_id);

-- Funcao que concede creditos automaticamente ao criar pedido
CREATE OR REPLACE FUNCTION public.grant_ai_access_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  item_count integer;
  latest_expiry timestamptz;
  new_start timestamptz;
BEGIN
  -- Contar quantidade total de itens no pedido
  SELECT COALESCE(SUM((item->>'quantity')::integer), 1)
  INTO item_count
  FROM jsonb_array_elements(NEW.items) AS item;

  -- Buscar a data de expiracao mais recente do usuario
  SELECT MAX(expires_at) INTO latest_expiry
  FROM public.ai_access_credits WHERE user_id = NEW.user_id;

  -- Se ja tem credito ativo, acumular a partir da expiracao; senao, a partir de agora
  new_start := GREATEST(COALESCE(latest_expiry, now()), now());

  INSERT INTO public.ai_access_credits (user_id, order_id, days_granted, expires_at)
  VALUES (NEW.user_id, NEW.id, item_count * 30, new_start + (item_count * 30 || ' days')::interval);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_grant_ai_access
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.grant_ai_access_on_order();
```

#### 2. `src/components/profile/AIPetAssistantTab.tsx`

- Adicionar estado `aiAccessExpiry: Date | null` e `aiAccessLoading: boolean`
- No `useEffect` inicial, consultar `ai_access_credits` para buscar o `MAX(expires_at)` do usuario
- Se `expires_at < now()` ou nenhum registro existir: renderizar tela de bloqueio com:
  - Icone de cadeado estilizado
  - Mensagem: "Seu acesso ao SuperPet AI expirou"
  - Dias restantes (se ainda ativo) em barra de progresso
  - Botao "Comprar agora" linkando para `/shop`
- Se ativo: mostrar badge com dias restantes no header do pet selecionado
- Consulta: `supabase.from("ai_access_credits").select("expires_at").eq("user_id", user.id).order("expires_at", { ascending: false }).limit(1)`

#### 3. `supabase/functions/pet-ai/index.ts`

- Antes de chamar a IA, verificar se o usuario tem credito ativo:
  ```ts
  const { data: credit } = await supabaseAdmin
    .from("ai_access_credits")
    .select("expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (!credit || new Date(credit.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "Seu acesso ao SuperPet AI expirou. Faça uma compra para reativar!" }), { status: 403 });
  }
  ```

### Detalhes tecnicos

- Creditos sao **acumulativos**: comprar com credito ativo estende a data final
- A contagem de produtos usa o campo `quantity` de cada item no JSON `items` do pedido
- Verificacao server-side na edge function impede bypass
- Nenhuma alteracao no fluxo de checkout existente — o trigger cuida de tudo automaticamente

