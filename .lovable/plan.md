

# Funcionalidades Inteligentes para o Painel de Usuário

## Proposta de implementação em fases

### Fase 1 — Fundamentos (mais impacto imediato)

**1. Perfil do Pet**
- Nova tabela `pets` (name, breed, weight_kg, birth_date, photo_url, user_id)
- Aba "Meu Pet" no perfil com formulário e upload de foto
- Usado depois para personalizar dosagem e lembretes

**2. Endereços Salvos**
- Nova tabela `user_addresses` (label, street, number, complement, neighborhood, city, state, zip, is_default, user_id)
- Aba "Endereços" no perfil com CRUD
- Seleção rápida no checkout

**3. Recompra Rápida**
- Botão "Comprar novamente" em cada pedido na aba Compras
- Adiciona todos os itens do pedido ao carrinho

### Fase 2 — Engajamento

**4. Lembrete de Reposição**
- Calcular duração estimada do produto baseado no peso do pet
- Tabela `restock_reminders` com data estimada de reposição
- Notificação in-app + badge na aba do perfil

**5. Diário de Tratamento**
- Tabela `treatment_logs` (pet_id, date, notes, photo_url, user_id)
- Timeline visual com fotos de antes/depois
- Storage bucket para fotos do tratamento

### Fase 3 — Fidelização

**6. Programa de Pontos**
- Tabela `loyalty_points` (user_id, points, source, order_id)
- Acumular pontos por compra, exibir saldo no perfil
- Trocar pontos por desconto no checkout

**7. Cupons Pessoais**
- Tabela `user_coupons` com código, desconto, validade
- Seção no perfil mostrando cupons ativos

---

## Recomendação

Começar pela **Fase 1** (Perfil do Pet + Endereços + Recompra) — são as funcionalidades que mais agregam valor imediato e requerem menos complexidade.

Qual fase ou funcionalidade específica você quer implementar primeiro?

