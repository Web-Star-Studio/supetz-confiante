import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, ChevronDown, ChevronRight, Shield, Brain, Dog, Apple, 
  Thermometer, Heart, Scissors, AlertTriangle, Package, Bot, Database,
  Users, ShoppingCart, Settings, Megaphone, Star, Bell, FileText, Zap,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface KBArticle {
  id: string;
  title: string;
  icon: React.ReactNode;
  tags: string[];
  content: string;
}

interface KBCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  articles: KBArticle[];
}

const knowledgeBase: KBCategory[] = [
  {
    id: "produto",
    title: "Produto Supet",
    icon: <Package className="w-5 h-5" />,
    description: "Informações sobre o suplemento, ingredientes, dosagem e garantias",
    articles: [
      {
        id: "o-que-e",
        title: "O que é o Supet?",
        icon: <Package className="w-4 h-4" />,
        tags: ["produto", "suplemento", "gomas"],
        content: `**Supet** é um suplemento natural em formato de goma, desenvolvido por veterinários dermatologistas. Ele age de dentro para fora para acabar com coceiras, alergias, queda excessiva de pelo e vermelhidão, reconstruindo a imunidade e a barreira protetora da pele do cão.

### Características
- Formato: gomas palatáveis com sabor de carne de panela
- Menos de **15 calorias** por goma
- Livre de açúcares adicionados e gorduras ruins
- **100% natural** baseado em vitaminas e minerais
- Ingredientes principais: Ômega 3, Zinco, Biotina

### Importante
Os produtos Supet são **suplementos naturais para bem-estar**, NÃO são medicamentos e NÃO substituem tratamento veterinário. Nunca prometemos cura ou resultados garantidos.`
      },
      {
        id: "dosagem",
        title: "Dosagem por Peso",
        icon: <Star className="w-4 h-4" />,
        tags: ["dosagem", "peso", "uso"],
        content: `### Dosagem Recomendada

| Peso do cão | Gomas/dia |
|---|---|
| Até 10 kg | 1 goma |
| 11 a 25 kg | 2 gomas |
| Acima de 25 kg | 3 gomas |

### Modo de Uso
- Pode ser dado como petisco diário ou misturado na ração
- Seguro para cães a partir de **3 meses de idade**
- Para filhotes menores, recomendar consulta ao veterinário

### Resultados Esperados
- **7-14 dias**: diminuição significativa na coceira e vermelhidão
- **60-90 dias**: protocolo completo para reconstrução total da pelagem e cicatrização`
      },
      {
        id: "garantia",
        title: "Garantia e Devoluções",
        icon: <Shield className="w-4 h-4" />,
        tags: ["garantia", "devolução", "30 dias"],
        content: `### Desafio Supet 30 Dias

Se em 30 dias de uso correto o tutor não notar melhoras na pele e na pelagem do cão, ou se o animal não se adaptar ao sabor, devolvemos **100% do dinheiro**. Sem burocracia.

### Segurança de Compra
- Tecnologia de criptografia de ponta (SSL)
- Pagamentos processados por plataformas financeiras seguras
- Dados 100% protegidos`
      },
      {
        id: "envio",
        title: "Prazo de Entrega",
        icon: <ShoppingCart className="w-4 h-4" />,
        tags: ["entrega", "frete", "prazo"],
        content: `### Prazos de Entrega

| Região | Prazo |
|---|---|
| Sul e Sudeste | 3 a 7 dias úteis |
| Demais regiões | 5 a 12 dias úteis |

O código de rastreio é enviado por **WhatsApp** e **e-mail**.`
      },
    ],
  },
  {
    id: "ia-sistema",
    title: "Sistema de IA",
    icon: <Brain className="w-5 h-5" />,
    description: "Configurações, regras de segurança e modos da IA do Supet",
    articles: [
      {
        id: "regras-seguranca",
        title: "Regras de Segurança da IA",
        icon: <Shield className="w-4 h-4" />,
        tags: ["segurança", "regras", "ia"],
        content: `### Regras Obrigatórias (Nunca Ignorar)

1. **Não é veterinária** — NUNCA diagnosticar doenças, prescrever medicamentos ou recomendar doses de remédios
2. **Sintomas graves** → instruir tutor a procurar veterinário IMEDIATAMENTE
3. **Disclaimer obrigatório** — Toda resposta sobre saúde termina com: "⚠️ Estas são orientações gerais de uma IA. Consulte sempre um veterinário profissional."
4. **Linguagem cautelosa** — "geralmente", "pode ser", "é recomendável consultar"
5. **Zero medicamentos** — Apenas veterinários podem prescrever
6. **Suplementos ≠ Medicamentos** — Nunca prometer cura ou resultados garantidos
7. **Honestidade** — Se não souber, dizer "não tenho certeza"
8. **Sem procedimentos invasivos** — Não recomendar dietas restritivas, jejuns ou procedimentos caseiros`
      },
      {
        id: "modos-ia",
        title: "Modos da Super Pet AI",
        icon: <Bot className="w-4 h-4" />,
        tags: ["modos", "assistente", "ia"],
        content: `### Modos Disponíveis

| Modo | Descrição | Formato de Resposta |
|---|---|---|
| **assistant** | Chat conversacional sobre cuidados com pets | Texto livre (streaming) |
| **tips** | 3 dicas personalizadas de cuidados | JSON: \`{"tips": [...]}\` |
| **analysis** | Análise dos registros de tratamento | Texto livre (streaming) |
| **recipes** | 2 receitas de petiscos caseiros saudáveis | JSON: \`{"recipes": [...]}\` |
| **fun_facts** | 4 curiosidades sobre a raça do pet | JSON: \`{"facts": [...]}\` |
| **health_plan** | Plano semanal de cuidados (7 dias) | JSON: \`{"plan": [...]}\` |

### Modelo Utilizado
- **google/gemini-3-flash-preview** com temperatura 0.4
- Contexto máximo: últimas 20 mensagens
- Streaming habilitado para modos: assistant, analysis

### Cache de Conteúdo
Respostas geradas são persistidas na tabela \`ai_cached_content\` por pet e por modo, permitindo carregamento instantâneo sem chamadas redundantes à API.`
      },
      {
        id: "emergencias-ia",
        title: "Detecção de Emergências",
        icon: <AlertTriangle className="w-4 h-4" />,
        tags: ["emergência", "detecção", "segurança"],
        content: `### Sistema de Detecção de Emergências

A IA possui um interceptor que bloqueia prompts com palavras-chave de emergência médica **antes** de chamar o modelo de IA.

### Categorias Monitoradas

| Categoria | Exemplos de Palavras-chave |
|---|---|
| **Convulsões** | convulsão, tremendo muito, espasmos |
| **Sangramento** | sangue nas fezes, vomitando sangue, hemorragia |
| **Respiratório** | não respira, dificuldade respiratória, cianose, língua roxa |
| **Envenenamento** | comeu chocolate, comeu uva, intoxicação, ingeriu veneno |
| **Fraturas/Trauma** | fratura, atropelado, queda de altura |
| **Inconsciência** | desmaiou, inconsciente, não reage, letargia extrema |
| **Engasgo** | engasgou, engasgando |
| **Mobilidade** | não consegue andar, paralisia, arrastando as patas |
| **Torção gástrica** | barriga inchada, tentando vomitar sem conseguir, abdômen rígido |
| **Anafilaxia** | reação alérgica, focinho inchado, picada de abelha/cobra |
| **Outros** | hipotermia, golpe de calor, prolapso |

### Resposta de Emergência
Quando detectado, o sistema retorna:
- 🚨 Alerta de emergência
- Instrução para levar ao veterinário IMEDIATAMENTE
- Aviso que IA não substitui atendimento presencial

### Registro
Todas as emergências são registradas na tabela \`emergency_logs\` com: user_id, conteúdo da mensagem, keyword detectada e fonte (chatbot ou pet-ai).`
      },
      {
        id: "acesso-ia",
        title: "Controle de Acesso à IA",
        icon: <Zap className="w-4 h-4" />,
        tags: ["acesso", "créditos", "compra"],
        content: `### Sistema de Créditos de Acesso

O acesso à Super Pet AI é controlado por créditos vinculados a compras.

- Tabela: \`ai_access_credits\`
- Cada compra concede **30 dias** de acesso
- Verificação server-side antes de cada chamada à IA
- Se expirado: "Seu acesso ao SuperPet AI expirou. Faça uma compra para reativar!"

### Edge Function de Verificação
A função \`check-ai-expiry\` pode ser executada periodicamente para verificar expiração de créditos.`
      },
    ],
  },
  {
    id: "racas",
    title: "Base de Raças",
    icon: <Dog className="w-5 h-5" />,
    description: "Informações detalhadas sobre raças de cães usadas pela IA",
    articles: [
      {
        id: "pequeno-porte",
        title: "Raças de Pequeno Porte (até 10kg)",
        icon: <Dog className="w-4 h-4" />,
        tags: ["raças", "pequeno", "porte"],
        content: `### Raças de Pequeno Porte

| Raça | Características | Predisposições | Expectativa |
|---|---|---|---|
| **Yorkshire** | Pelo longo sedoso, escovação diária | Problemas dentários, luxação patelar | 11-15 anos |
| **Shih Tzu** | Braquicefálico, sensível ao calor | Problemas oculares e respiratórios | 10-18 anos |
| **Pinscher** | Muito ativo, sensível ao frio | Luxação patelar, problemas dentários | 12-16 anos |
| **Maltês** | Hipoalergênico, pelo branco | Manchas de lágrima, problemas dentários | 12-15 anos |
| **Chihuahua** | Menor raça do mundo | Hipoglicemia, problemas dentários | 14-16 anos |
| **Pomerânia** | Pelagem dupla densa, NUNCA tosar rente | Luxação patelar, Alopecia X | 12-16 anos |
| **Lhasa Apso** | Independente, pelo longo | Problemas renais e oculares | 12-15 anos |
| **Pug** | Braquicefálico severo | Problemas respiratórios, oculares, dobras | 13-15 anos |
| **Dachshund** | Coluna EXTREMAMENTE sensível | DDIV, obesidade (evitar saltos/escadas) | 12-16 anos |`
      },
      {
        id: "medio-porte",
        title: "Raças de Médio Porte (10-25kg)",
        icon: <Dog className="w-4 h-4" />,
        tags: ["raças", "médio", "porte"],
        content: `### Raças de Médio Porte

| Raça | Características | Predisposições | Expectativa |
|---|---|---|---|
| **Bulldog Francês** | Braquicefálico, não tolera calor | Alergias de pele, problemas de coluna | 10-12 anos |
| **Beagle** | Muito olfativo e curioso | Obesidade, otite, epilepsia | 10-15 anos |
| **Cocker Spaniel** | Orelhas longas, limpar 2-3x/semana | Otite crônica, problemas oculares | 10-14 anos |
| **Border Collie** | Raça MAIS inteligente, energia muito alta | Displasia de quadril, epilepsia | 12-15 anos |
| **Poodle** | Hipoalergênico, tosa obrigatória | Luxação patelar, epilepsia | 12-15 anos |
| **Schnauzer** | Dieta BAIXA em gordura obrigatória | Pancreatite, hiperlipidemia, diabetes | 12-15 anos |
| **Shiba Inu** | Muito independente, artista de fuga | Alergias de pele, luxação patelar | 13-16 anos |
| **SRD** | Vigor híbrido, geralmente mais saudáveis | Varia por indivíduo | 12-16 anos |`
      },
      {
        id: "grande-porte",
        title: "Raças de Grande/Gigante Porte (25kg+)",
        icon: <Dog className="w-4 h-4" />,
        tags: ["raças", "grande", "gigante"],
        content: `### Raças de Grande Porte (25-45kg)

| Raça | Características | Predisposições | Expectativa |
|---|---|---|---|
| **Golden Retriever** | Dócil e familiar | Displasia, câncer (alta incidência) | 10-12 anos |
| **Labrador** | MUITO propenso a obesidade (gene POMC) | Displasia, problemas articulares | 10-12 anos |
| **Pastor Alemão** | Estômago sensível | Displasia, dermatite | 9-13 anos |
| **Rottweiler** | Socialização precoce essencial | Displasia, osteossarcoma, cardiomiopatia | 8-10 anos |
| **Boxer** | Braquicefálico de grande porte | Cardiomiopatia, câncer | 10-12 anos |
| **Pit Bull** | Socialização extensiva desde filhote | Alergias de pele, displasia | 12-16 anos |
| **Husky Siberiano** | SOFRE MUITO com calor no Brasil, NUNCA tosar | Problemas oculares e de pele | 12-14 anos |
| **Doberman** | Check-up cardíaco anual obrigatório | Cardiomiopatia dilatada, von Willebrand | 10-12 anos |

### Raças Gigantes (45kg+)

| Raça | Características | Predisposições | Expectativa |
|---|---|---|---|
| **Dogue Alemão** | Maior raça do mundo | Torção gástrica, cardiomiopatia | **6-8 anos** |
| **São Bernardo** | Sofre MUITO com calor, baba bastante | Displasia, torção gástrica | 8-10 anos |
| **Fila Brasileiro** | Guardião nato, dono muito experiente | Displasia, protetor extremo | 9-11 anos |
| **Cane Corso** | Socialização extensiva obrigatória | Displasia, torção gástrica, entrópio | 9-12 anos |`
      },
    ],
  },
  {
    id: "nutricao",
    title: "Nutrição Canina",
    icon: <Apple className="w-5 h-5" />,
    description: "Alimentos seguros, tóxicos e orientações de alimentação",
    articles: [
      {
        id: "alimentos-seguros",
        title: "Alimentos Seguros para Cães",
        icon: <Apple className="w-4 h-4" />,
        tags: ["nutrição", "alimentos", "seguros"],
        content: `### Alimentos Seguros

**Frutas:** banana, maçã (sem sementes), melancia (sem sementes), manga, morango, blueberry, pera

**Legumes:** cenoura, batata-doce cozida, abóbora cozida, brócolis (pouca quantidade), pepino, abobrinha

**Proteínas:** frango cozido sem tempero, peito de peru, ovos cozidos, peixe cozido (sem espinhas)

**Outros:** arroz, aveia cozida, pasta de amendoim (sem xilitol)`
      },
      {
        id: "alimentos-toxicos",
        title: "Alimentos TÓXICOS (NUNCA oferecer)",
        icon: <AlertTriangle className="w-4 h-4" />,
        tags: ["nutrição", "tóxicos", "perigo"],
        content: `### ⚠️ Alimentos Tóxicos para Cães

| Alimento | Perigo |
|---|---|
| **Chocolate** | Teobromina tóxica, amargo é o mais perigoso |
| **Uva e passa** | Insuficiência renal aguda |
| **Cebola e alho** | Anemia hemolítica |
| **Xilitol** | Hipoglicemia grave e insuficiência hepática |
| **Macadâmia** | Vômito, tremores e hipertermia |
| **Abacate** | Persina causa problemas gastrointestinais |
| **Cafeína** | Arritmia cardíaca e convulsões |
| **Álcool** | Tóxico mesmo em pequenas doses |
| **Ossos cozidos** | Estilhaçam, perfuração intestinal |`
      },
      {
        id: "alimentacao-fase",
        title: "Alimentação por Fase de Vida",
        icon: <Heart className="w-4 h-4" />,
        tags: ["nutrição", "filhote", "adulto", "idoso"],
        content: `### Frequência de Refeições

| Fase | Refeições/dia |
|---|---|
| Filhotes 2-6 meses | 3-4 refeições |
| Filhotes 6-12 meses | 2-3 refeições |
| Adultos | 2 refeições |
| Idosos | 2-3 refeições menores |

### Orientações Gerais
- Quantidade varia com peso, idade, nível de atividade e metabolismo
- **Transição alimentar deve ser gradual (7-10 dias)**
- Raças gigantes: alimentar em porções menores e frequentes (risco de torção gástrica)`
      },
    ],
  },
  {
    id: "cuidados",
    title: "Cuidados e Saúde",
    icon: <Heart className="w-5 h-5" />,
    description: "Higiene, exercício, fases da vida e cuidados sazonais",
    articles: [
      {
        id: "higiene",
        title: "Higiene e Cuidados Básicos",
        icon: <Scissors className="w-4 h-4" />,
        tags: ["higiene", "banho", "escovação"],
        content: `### Banho
- Frequência geral: a cada 15-30 dias
- Usar shampoo específico para cães
- Secar bem, especialmente orelhas e dobras de pele

### Escovação de Pelos
| Tipo de pelo | Frequência |
|---|---|
| Curto | 1-2x por semana |
| Médio | 2-3x por semana |
| Longo | Diariamente |

### Unhas, Dentes e Orelhas
- **Unhas**: cortar a cada 2-4 semanas
- **Dentes**: escovação 2-3x por semana com pasta canina
- **Orelhas**: limpeza semanal, raças de orelha caída com mais frequência`
      },
      {
        id: "exercicio",
        title: "Exercício por Porte",
        icon: <Zap className="w-4 h-4" />,
        tags: ["exercício", "atividade", "porte"],
        content: `### Exercício Recomendado por Porte

| Porte | Exercício/dia |
|---|---|
| Pequeno | 20-40 min |
| Médio | 40-60 min |
| Grande | 60-90 min |
| Gigante | 30-60 min (moderado) |
| Braquicefálicos | Leve, SEM calor |

### Enriquecimento Ambiental
- Brinquedos interativos (Kong, tapete de lamber)
- Passeios com tempo para farejar
- Treinamento com reforço positivo
- Rodízio de brinquedos

### Sinais de Estresse
Lamber lábios, bocejar fora de contexto, orelhas para trás, destruir objetos, esconder-se`
      },
      {
        id: "fases-vida",
        title: "Cuidados por Fase da Vida",
        icon: <Heart className="w-4 h-4" />,
        tags: ["filhote", "adulto", "idoso", "vacinação"],
        content: `### Filhotes (0-12 meses)
- Vacinação: V8/V10, antirrábica (consultar veterinário)
- Socialização: período crítico entre 3-16 semanas
- Vermifugação regular
- Não passear em locais públicos antes da vacinação completa
- Treinamento básico desde cedo

### Adultos (1-7 anos)
- Check-up veterinário anual
- Vacinação de reforço
- Exercício adequado ao porte e raça
- Escovação dos dentes 2-3x por semana
- Controle de peso regular

### Idosos (7+ anos, gigantes 5+ anos)
- Check-up veterinário **semestral**
- Atenção a sinais de artrite
- Alimentação adequada para idosos
- Exercício mais leve e frequente
- Rampas para subir/descer de móveis`
      },
      {
        id: "sazonal",
        title: "Cuidados Sazonais no Brasil",
        icon: <Thermometer className="w-4 h-4" />,
        tags: ["verão", "inverno", "calor", "frio", "chuva"],
        content: `### Verão / Calor Intenso
- **Braquicefálicos** (Pug, Bulldog, Shih Tzu, Boxer): risco ALTO de golpe de calor
- **Raças nórdicas** (Husky, Malamute, Samoieda): ambiente climatizado obrigatório
- Passeios apenas **antes das 8h** ou **após 18h**
- Testar asfalto com dorso da mão
- Água fresca sempre disponível, tapetes gelados
- NUNCA deixar pet dentro do carro
- Protetor solar para raças de pelo claro/curto

### Inverno / Frio
- Raças pequenas e pelo curto: usar roupinha
- Camas elevadas e quentinhas
- Frio agrava artrite em idosos

### Época de Chuvas
- Secar bem o pet (especialmente dobras e orelhas)
- **Leptospirose**: evitar contato com água parada/enchentes
- Verificar pulgas e carrapatos com mais frequência`
      },
      {
        id: "doencas-porte",
        title: "Doenças Comuns por Porte",
        icon: <AlertTriangle className="w-4 h-4" />,
        tags: ["doenças", "porte", "predisposição"],
        content: `### Doenças por Porte

| Porte | Doenças Comuns |
|---|---|
| **Pequeno** | Luxação patelar, problemas dentários, colapso traqueal, hipoglicemia, shunt hepático |
| **Médio** | Otite (orelha caída), alergias de pele, epilepsia, displasia de quadril |
| **Grande** | Displasia de quadril/cotovelo, torção gástrica, osteossarcoma |
| **Gigante** | Torção gástrica (emergência!), cardiomiopatia dilatada, vida curta |`
      },
    ],
  },
  {
    id: "sistema",
    title: "Sistema e Funcionalidades",
    icon: <Database className="w-5 h-5" />,
    description: "Documentação das funcionalidades do painel admin e do app",
    articles: [
      {
        id: "tabelas-db",
        title: "Tabelas do Banco de Dados",
        icon: <Database className="w-4 h-4" />,
        tags: ["banco", "tabelas", "dados"],
        content: `### Tabelas Principais

| Tabela | Descrição | RLS |
|---|---|---|
| \`profiles\` | Dados do usuário (nome, telefone, avatar) | Usuário próprio + Admin |
| \`pets\` | Pets cadastrados (nome, raça, peso, nascimento) | Usuário próprio |
| \`orders\` | Pedidos (itens, total, status, endereço) | Usuário próprio + Admin |
| \`products\` | Catálogo de produtos | Público (leitura) + Admin (CRUD) |
| \`user_roles\` | Papéis dos usuários (admin/user) | Admin + Usuário próprio (leitura) |
| \`loyalty_points\` | Pontos de fidelidade | Usuário próprio + Admin |
| \`user_coupons\` | Cupons de desconto | Usuário próprio + Admin |
| \`user_addresses\` | Endereços de entrega | Usuário próprio |
| \`treatment_logs\` | Diário de tratamento | Usuário próprio |
| \`restock_reminders\` | Lembretes de reposição | Usuário próprio |
| \`chat_messages\` | Mensagens do chatbot | Usuário próprio |
| \`ai_cached_content\` | Cache de respostas da IA | Usuário próprio |
| \`ai_access_credits\` | Créditos de acesso à IA | Usuário próprio (leitura) |
| \`emergency_logs\` | Registros de emergências detectadas | Admin (leitura) |

### Tabelas Administrativas

| Tabela | Descrição |
|---|---|
| \`admin_notifications\` | Notificações do painel admin |
| \`audit_logs\` | Log de auditoria de ações admin |
| \`campaigns\` | Campanhas de marketing |
| \`campaign_recipients\` | Destinatários de campanhas |
| \`customer_notes\` | Notas sobre clientes |
| \`customer_status\` | Status do funil de CRM |
| \`customer_tags\` | Tags para segmentação |
| \`customer_tag_assignments\` | Associação tag-cliente |
| \`customer_interactions\` | Interações com clientes |
| \`stock_movements\` | Movimentações de estoque |
| \`expenses\` | Despesas financeiras |
| \`store_settings\` | Configurações da loja |
| \`push_subscriptions\` | Assinaturas push |`
      },
      {
        id: "edge-functions",
        title: "Edge Functions (Backend)",
        icon: <Zap className="w-4 h-4" />,
        tags: ["edge", "functions", "backend"],
        content: `### Edge Functions Disponíveis

| Função | Descrição |
|---|---|
| \`pet-ai\` | IA principal com 6 modos (assistant, tips, analysis, recipes, fun_facts, health_plan) |
| \`chatbot\` | Chatbot geral do site com contexto do usuário |
| \`auto-notify\` | Notificações automáticas |
| \`check-ai-expiry\` | Verificação de expiração de créditos IA |
| \`check-restock-reminders\` | Verificação de lembretes de reposição |
| \`send-push\` | Envio de notificações push |

### Modelo de IA
- **google/gemini-3-flash-preview** — temperatura 0.4
- Gateway: ai.gateway.lovable.dev
- Autenticação via LOVABLE_API_KEY`
      },
      {
        id: "funcionalidades-admin",
        title: "Funcionalidades do Painel Admin",
        icon: <Settings className="w-4 h-4" />,
        tags: ["admin", "painel", "funcionalidades"],
        content: `### Módulos do Painel Administrativo

| Módulo | Funcionalidades |
|---|---|
| **Dashboard** | Resumo de vendas, pedidos, clientes, estoque |
| **Pedidos** | Lista de pedidos, atualização de status, detalhes |
| **Produtos** | CRUD de produtos, preços, badges, imagens |
| **Estoque** | Movimentações de estoque, alertas de estoque baixo |
| **Clientes (CRM)** | Funil de vendas, tags, notas, interações, exportar CSV |
| **Fidelização** | Gestão de pontos, cupons, recompensas |
| **Marketing** | Campanhas de notificação com cupons e segmentação |
| **Financeiro** | Receitas vs despesas, gestão de custos |
| **Auditoria** | Log de todas as ações administrativas |
| **Configurações** | Configurações gerais da loja |`
      },
      {
        id: "funcionalidades-usuario",
        title: "Funcionalidades do Usuário",
        icon: <Users className="w-4 h-4" />,
        tags: ["usuário", "perfil", "funcionalidades"],
        content: `### Módulos do Perfil do Usuário

| Módulo | Descrição |
|---|---|
| **Dashboard** | Resumo de pedidos, pontos, pets |
| **Meus Pedidos** | Histórico com timeline de rastreamento |
| **Perfil do Pet** | Cadastro e edição de pets (raça, peso, nascimento, foto) |
| **Diário de Tratamento** | Registro diário com fotos e notas |
| **Super Pet AI** | Assistente IA com 6 modos interativos |
| **Cupons** | Lista de cupons ativos e utilizados |
| **Pontos** | Histórico e saldo de pontos de fidelidade |
| **Endereços** | Gestão de endereços de entrega |
| **Lembretes** | Lembretes automáticos de reposição |
| **Conquistas** | Sistema de gamificação |
| **Notificações** | Central de notificações |

### Chatbot do Site
- Disponível para todos os visitantes (flutuante)
- Com contexto do usuário logado (pets, pedidos, cupons, pontos)
- Detecção de emergências integrada`
      },
      {
        id: "chatbot-contexto",
        title: "Contexto do Chatbot",
        icon: <Bot className="w-4 h-4" />,
        tags: ["chatbot", "contexto", "personalização"],
        content: `### Dados Contextuais do Chatbot

Quando o usuário está logado, o chatbot injeta automaticamente no prompt:

| Dado | Fonte |
|---|---|
| Nome do usuário | \`profiles.full_name\` |
| Pets (nome, raça, peso) | \`pets\` (até 3) |
| Últimos pedidos | \`orders\` (últimos 3, com status) |
| Cupons ativos | \`user_coupons\` (não usados, não expirados) |
| Pontos de fidelidade | \`loyalty_points\` (soma total) |
| Lembretes de reposição | \`restock_reminders\` (próximos 3) |

### Informações de Raça
Para cada pet do usuário, se a raça tiver dados no mapa de raças, informações específicas são injetadas no contexto (predisposições, cuidados especiais).

### Follow-up Suggestions
Toda resposta termina com 2-3 sugestões de perguntas que o usuário pode fazer.`
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing e Campanhas",
    icon: <Megaphone className="w-5 h-5" />,
    description: "Sistema de campanhas, segmentação e notificações",
    articles: [
      {
        id: "campanhas",
        title: "Sistema de Campanhas",
        icon: <Megaphone className="w-4 h-4" />,
        tags: ["campanhas", "marketing", "notificações"],
        content: `### Tipos de Campanha
- **Notificação**: Envia notificação in-app para segmento de clientes
- **Cupom**: Gera cupons personalizados por campanha

### Segmentação de Clientes
Filtros disponíveis por:
- Status do funil (lead, ativo, inativo, VIP)
- Tags atribuídas
- Histórico de compras
- Pontos de fidelidade

### Fluxo de Campanha
1. Criar campanha (nome, tipo, mensagem)
2. Definir segmento-alvo
3. Configurar cupom (se aplicável): tipo de desconto, valor, validade, pedido mínimo
4. Enviar (gera notificações e cupons automaticamente)

### Status de Campanha
\`draft\` → \`sent\` → \`completed\``
      },
      {
        id: "fidelizacao",
        title: "Programa de Fidelização",
        icon: <Star className="w-4 h-4" />,
        tags: ["pontos", "fidelidade", "recompensas"],
        content: `### Sistema de Pontos

- Fonte principal: compras (source: \`purchase\`)
- Conversão: **1 ponto = R$ 0,01** em desconto
- Admins podem adicionar/ajustar pontos manualmente

### Cupons de Desconto
- Tipos: porcentagem ou valor fixo
- Valor mínimo de pedido configurável
- Data de expiração
- Uso único por cupom`
      },
      {
        id: "notificacoes",
        title: "Sistema de Notificações",
        icon: <Bell className="w-4 h-4" />,
        tags: ["notificações", "push", "alertas"],
        content: `### Tipos de Notificação

**Admin (\`admin_notifications\`)**:
- Novos pedidos
- Alertas de estoque baixo
- Ações relevantes do sistema

**Usuário (\`user_notifications\`)**:
- Atualizações de pedidos
- Campanhas de marketing
- Lembretes de reposição
- Informações gerais

### Push Notifications
- Assinaturas armazenadas em \`push_subscriptions\`
- Edge function \`send-push\` para envio
- Suporte a Web Push API`
      },
    ],
  },
];

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="text-left py-2 px-3 font-semibold text-foreground">{renderInline(h.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-muted-foreground">{renderInline(cell.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeaders = [];
    tableRows = [];
    inTable = false;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/`([^`]+)`/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      let firstMatch: { index: number; length: number; node: React.ReactNode } | null = null;

      if (codeMatch && codeMatch.index !== undefined) {
        const candidate = { index: codeMatch.index, length: codeMatch[0].length, node: <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">{codeMatch[1]}</code> };
        if (!firstMatch || candidate.index < firstMatch.index) firstMatch = candidate;
      }
      if (boldMatch && boldMatch.index !== undefined) {
        const candidate = { index: boldMatch.index, length: boldMatch[0].length, node: <strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong> };
        if (!firstMatch || candidate.index < firstMatch.index) firstMatch = candidate;
      }

      if (firstMatch) {
        if (firstMatch.index > 0) parts.push(remaining.slice(0, firstMatch.index));
        parts.push(firstMatch.node);
        remaining = remaining.slice(firstMatch.index + firstMatch.length);
      } else {
        parts.push(remaining);
        break;
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cells.every(c => /^[\s-:]+$/.test(c))) continue; // separator row
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-base font-bold text-foreground mt-6 mb-3 flex items-center gap-2">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("- ")) {
      elements.push(<li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{renderInline(line)}</p>);
    }
  }

  if (inTable) flushTable();

  return <div>{elements}</div>;
}

export default function BaseConhecimento() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("produto");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(knowledgeBase[0].articles[0]);

  const normalizedSearch = search.toLowerCase().trim();

  const filteredCategories = normalizedSearch
    ? knowledgeBase.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a =>
          a.title.toLowerCase().includes(normalizedSearch) ||
          a.tags.some(t => t.includes(normalizedSearch)) ||
          a.content.toLowerCase().includes(normalizedSearch)
        ),
      })).filter(cat => cat.articles.length > 0)
    : knowledgeBase;

  const totalArticles = knowledgeBase.reduce((sum, c) => sum + c.articles.length, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalArticles} artigos · Documentação completa do sistema Supet
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos, tags, conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
          {/* Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-2">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{cat.title}</p>
                    <p className="text-[11px] text-muted-foreground">{cat.articles.length} artigos</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCategory === cat.id ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {expandedCategory === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-border/50 py-1">
                        {cat.articles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                              selectedArticle?.id === article.id
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                          >
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{article.title}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Article Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedArticle ? (
              <motion.div
                key={selectedArticle.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6 md:p-8"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    {selectedArticle.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedArticle.title}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedArticle.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-6">
                  <MarkdownRenderer content={selectedArticle.content} />
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">Selecione um artigo para visualizar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
