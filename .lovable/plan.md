

## Plano: Base de Conhecimento por Raça + Ficha do Pet Personalizada

### O que sera feito

1. **Criar base de dados detalhada por raça** (`src/data/breedInfo.ts`) — um mapa com informações específicas de cada raça da lista `DOG_BREEDS`: porte, expectativa de vida, nível de energia, tipo de pelagem, predisposições de saúde, necessidade de exercício, cuidados especiais e temperamento.

2. **Mostrar ficha da raça no PetProfileTab** — Após o usuário selecionar uma raça no combobox, exibir um card informativo com os dados da raça (porte, energia, cuidados, predisposições). Isso ajuda o tutor a conhecer melhor seu pet.

3. **Enriquecer o contexto enviado à IA** — No `pet-ai/index.ts`, usar a raça do pet para injetar informações específicas no prompt (em vez de depender apenas da base genérica). Exemplo: se o pet é um Pug, o prompt recebe automaticamente "braquicefálico, sensível ao calor, propenso a problemas respiratórios".

4. **Expandir a base de conhecimento da edge function** — Adicionar seções sobre: doenças comuns por porte, cuidados sazonais (calor/frio no Brasil), socialização por temperamento e orientações de adestramento por nível de energia.

### Arquivos

**Novo: `src/data/breedInfo.ts`**
- Exportar `BREED_INFO: Record<string, BreedDetails>` com dados para todas as 75+ raças
- Interface `BreedDetails`: `{ porte, expectativaVida, energia, pelagem, predisposicoes, exercicio, cuidadosEspeciais, temperamento }`

**`src/components/profile/PetProfileTab.tsx`**
- Importar `BREED_INFO`
- Após seleção de raça, renderizar card com informações da raça abaixo do combobox
- Card com badges coloridos por porte/energia e lista de cuidados

**`supabase/functions/pet-ai/index.ts`**
- Criar mapa `BREED_SPECIFIC_INFO` com dados condensados das raças mais populares (top 30)
- No `petContext`, se a raça do pet existir no mapa, injetar informações específicas automaticamente
- Adicionar seções ao `DOG_KNOWLEDGE_BASE`: cuidados sazonais Brasil, doenças por porte, socialização

**`supabase/functions/chatbot/index.ts`**
- Mesmo enriquecimento de contexto por raça no chatbot flutuante

### Detalhes tecnicos

- `BREED_INFO` no frontend é completo (75+ raças) para exibição visual
- `BREED_SPECIFIC_INFO` na edge function é condensado (top 30 raças) para não exceder limites de tokens no prompt
- Nenhuma alteração no banco de dados
- Raças não mapeadas recebem informações genéricas baseadas no porte estimado pelo peso

