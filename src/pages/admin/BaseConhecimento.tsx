import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, ChevronDown, ChevronRight, Shield, Brain, Dog, Apple,
  Thermometer, Heart, Scissors, AlertTriangle, Package, Bot, Database,
  Users, ShoppingCart, Settings, Megaphone, Star, Bell, FileText, Zap,
  Wrench, BookA, GraduationCap, Plus, Pencil, Trash2, Save, X, Tag,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Icon map for DB articles ─── */
const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Brain: <Brain className="w-4 h-4" />,
  Dog: <Dog className="w-4 h-4" />,
  Apple: <Apple className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4" />,
  Bot: <Bot className="w-4 h-4" />,
  Database: <Database className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  ShoppingCart: <ShoppingCart className="w-4 h-4" />,
  Scissors: <Scissors className="w-4 h-4" />,
  Thermometer: <Thermometer className="w-4 h-4" />,
  Bell: <Bell className="w-4 h-4" />,
  Megaphone: <Megaphone className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  BookA: <BookA className="w-4 h-4" />,
  Tag: <Tag className="w-4 h-4" />,
};

/* ─── Category colors ─── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  produto: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  "ia-sistema": { bg: "bg-violet-500/10", text: "text-violet-600", border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
  racas: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  nutricao: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  cuidados: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-200", badge: "bg-rose-100 text-rose-700" },
  sistema: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  marketing: { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-200", badge: "bg-pink-100 text-pink-700" },
  troubleshooting: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  glossario: { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-200", badge: "bg-teal-100 text-teal-700" },
  onboarding: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  "faqs-internas": { bg: "bg-cyan-500/10", text: "text-cyan-600", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700" },
  custom: { bg: "bg-slate-500/10", text: "text-slate-600", border: "border-slate-200", badge: "bg-slate-100 text-slate-700" },
};

const defaultColors = { bg: "bg-primary/10", text: "text-primary", border: "border-border", badge: "bg-muted text-muted-foreground" };

function getCatColors(catId: string) {
  return CATEGORY_COLORS[catId] || defaultColors;
}

/* ─── Types ─── */
interface KBArticle {
  id: string;
  title: string;
  icon: React.ReactNode;
  iconName: string;
  tags: string[];
  content: string;
  isCustom?: boolean;
}

interface KBCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  articles: KBArticle[];
}

/* ─── Static Knowledge Base ─── */
const staticKnowledgeBase: KBCategory[] = [
  {
    id: "produto",
    title: "Produto Supet",
    icon: <Package className="w-5 h-5" />,
    description: "Suplemento, ingredientes, dosagem e garantias",
    articles: [
      { id: "s-o-que-e", title: "O que é o Supet?", icon: <Package className="w-4 h-4" />, iconName: "Package", tags: ["produto", "suplemento", "gomas"],
        content: `**Supet** é um suplemento natural em formato de goma, desenvolvido por veterinários dermatologistas. Age de dentro para fora para acabar com coceiras, alergias, queda excessiva de pelo e vermelhidão.

### Características
- Formato: gomas palatáveis com sabor de carne de panela
- Menos de **15 calorias** por goma · Livre de açúcares e gorduras ruins
- **100% natural** — Ingredientes: Ômega 3, Zinco, Biotina

### Importante
Os produtos Supet são **suplementos naturais para bem-estar**, NÃO são medicamentos e NÃO substituem tratamento veterinário.` },
      { id: "s-dosagem", title: "Dosagem por Peso", icon: <Star className="w-4 h-4" />, iconName: "Star", tags: ["dosagem", "peso", "uso"],
        content: `### Dosagem Recomendada

| Peso do cão | Gomas/dia |
|---|---|
| Até 10 kg | 1 goma |
| 11 a 25 kg | 2 gomas |
| Acima de 25 kg | 3 gomas |

### Modo de Uso
- Petisco diário ou misturado na ração
- Seguro a partir de **3 meses de idade**

### Resultados Esperados
- **7-14 dias**: diminuição na coceira e vermelhidão
- **60-90 dias**: protocolo completo de reconstrução` },
      { id: "s-garantia", title: "Garantia e Devoluções", icon: <Shield className="w-4 h-4" />, iconName: "Shield", tags: ["garantia", "devolução", "30 dias"],
        content: `### Desafio Supet 30 Dias
Se em 30 dias não notar melhoras ou o pet não se adaptar ao sabor, devolvemos **100% do dinheiro**. Sem burocracia.

### Segurança de Compra
- Criptografia SSL · Pagamentos seguros · Dados protegidos` },
      { id: "s-envio", title: "Prazo de Entrega", icon: <ShoppingCart className="w-4 h-4" />, iconName: "ShoppingCart", tags: ["entrega", "frete", "prazo"],
        content: `### Prazos

| Região | Prazo |
|---|---|
| Sul e Sudeste | 3 a 7 dias úteis |
| Demais regiões | 5 a 12 dias úteis |

Rastreio enviado por **WhatsApp** e **e-mail**.` },
    ],
  },
  {
    id: "ia-sistema",
    title: "Sistema de IA",
    icon: <Brain className="w-5 h-5" />,
    description: "Configurações, regras de segurança e modos da IA",
    articles: [
      { id: "s-regras", title: "Regras de Segurança da IA", icon: <Shield className="w-4 h-4" />, iconName: "Shield", tags: ["segurança", "regras", "ia"],
        content: `### Regras Obrigatórias

1. **Não é veterinária** — NUNCA diagnosticar doenças ou prescrever medicamentos
2. **Sintomas graves** → instruir a procurar veterinário IMEDIATAMENTE
3. **Disclaimer obrigatório** em respostas sobre saúde
4. **Linguagem cautelosa** — "geralmente", "pode ser", "é recomendável consultar"
5. **Zero medicamentos** — Apenas veterinários prescrevem
6. **Suplementos ≠ Medicamentos** — Nunca prometer cura
7. **Honestidade** — Se não souber, dizer "não tenho certeza"
8. **Sem procedimentos invasivos** — Não recomendar dietas restritivas ou procedimentos caseiros` },
      { id: "s-modos", title: "Modos da Super Pet AI", icon: <Bot className="w-4 h-4" />, iconName: "Bot", tags: ["modos", "assistente", "ia"],
        content: `### Modos Disponíveis

| Modo | Descrição | Formato |
|---|---|---|
| **assistant** | Chat conversacional | Streaming |
| **tips** | 3 dicas personalizadas | JSON |
| **analysis** | Análise dos registros de tratamento | Streaming |
| **recipes** | 2 receitas de petiscos | JSON |
| **fun_facts** | 4 curiosidades sobre a raça | JSON |
| **health_plan** | Plano semanal de 7 dias | JSON |

### Configuração Técnica
- Modelo: **google/gemini-3-flash-preview** · Temperatura: 0.4
- Contexto: últimas 20 mensagens
- Cache: tabela \`ai_cached_content\` por pet e modo` },
      { id: "s-emergencias", title: "Detecção de Emergências", icon: <AlertTriangle className="w-4 h-4" />, iconName: "AlertTriangle", tags: ["emergência", "detecção", "segurança"],
        content: `### Sistema de Interceptação

Bloqueia prompts com palavras-chave de emergência **antes** de chamar a IA.

### Categorias Monitoradas

| Categoria | Exemplos |
|---|---|
| **Convulsões** | convulsão, tremendo muito, espasmos |
| **Sangramento** | sangue nas fezes, vomitando sangue |
| **Respiratório** | não respira, cianose, língua roxa |
| **Envenenamento** | comeu chocolate, comeu uva, intoxicação |
| **Fraturas/Trauma** | fratura, atropelado, queda de altura |
| **Inconsciência** | desmaiou, inconsciente, não reage |
| **Torção gástrica** | barriga inchada, vômito improdutivo |
| **Anafilaxia** | reação alérgica, focinho inchado |

### Registro
Tabela \`emergency_logs\` com user_id, conteúdo, keyword e fonte.` },
      { id: "s-acesso", title: "Controle de Acesso à IA", icon: <Zap className="w-4 h-4" />, iconName: "Zap", tags: ["acesso", "créditos", "compra"],
        content: `### Sistema de Créditos
- Tabela: \`ai_access_credits\`
- Cada compra concede **30 dias** de acesso
- Verificação server-side antes de cada chamada
- Trigger \`grant_ai_access_on_order\` calcula dias baseado na quantidade de itens` },
    ],
  },
  {
    id: "racas",
    title: "Base de Raças",
    icon: <Dog className="w-5 h-5" />,
    description: "75+ raças com predisposições e cuidados específicos",
    articles: [
      { id: "s-peq", title: "Raças de Pequeno Porte (até 10kg)", icon: <Dog className="w-4 h-4" />, iconName: "Dog", tags: ["raças", "pequeno"],
        content: `| Raça | Predisposições | Expectativa |
|---|---|---|
| **Yorkshire** | Dentários, luxação patelar | 11-15 anos |
| **Shih Tzu** | Oculares, respiratórios (braqui) | 10-18 anos |
| **Pinscher** | Luxação patelar, dentários | 12-16 anos |
| **Maltês** | Manchas de lágrima, dentários | 12-15 anos |
| **Chihuahua** | Hipoglicemia, dentários | 14-16 anos |
| **Pomerânia** | Alopecia X (NUNCA tosar), luxação patelar | 12-16 anos |
| **Lhasa Apso** | Renais, oculares | 12-15 anos |
| **Pug** | Respiratórios, oculares, dobras (braqui) | 13-15 anos |
| **Dachshund** | DDIV (coluna!), evitar saltos/escadas | 12-16 anos |` },
      { id: "s-med", title: "Raças de Médio Porte (10-25kg)", icon: <Dog className="w-4 h-4" />, iconName: "Dog", tags: ["raças", "médio"],
        content: `| Raça | Predisposições | Expectativa |
|---|---|---|
| **Bulldog Francês** | Alergias, coluna (braqui) | 10-12 anos |
| **Beagle** | Otite, obesidade, epilepsia | 10-15 anos |
| **Cocker Spaniel** | Otite crônica, oculares | 10-14 anos |
| **Border Collie** | Displasia, epilepsia (90+min exercício!) | 12-15 anos |
| **Poodle** | Luxação patelar, epilepsia | 12-15 anos |
| **Schnauzer** | Pancreatite (dieta baixa gordura!) | 12-15 anos |
| **SRD** | Vigor híbrido, geralmente saudáveis | 12-16 anos |` },
      { id: "s-grd", title: "Raças de Grande/Gigante Porte (25kg+)", icon: <Dog className="w-4 h-4" />, iconName: "Dog", tags: ["raças", "grande", "gigante"],
        content: `### Grande Porte (25-45kg)

| Raça | Predisposições | Expectativa |
|---|---|---|
| **Golden Retriever** | Displasia, câncer | 10-12 anos |
| **Labrador** | Obesidade (gene POMC!), displasia | 10-12 anos |
| **Pastor Alemão** | Displasia, dermatite, estômago sensível | 9-13 anos |
| **Rottweiler** | Displasia, osteossarcoma | 8-10 anos |
| **Husky Siberiano** | Sofre MUITO com calor, NUNCA tosar | 12-14 anos |
| **Doberman** | Cardiomiopatia (check-up anual!) | 10-12 anos |

### Gigantes (45kg+)

| Raça | Predisposições | Expectativa |
|---|---|---|
| **Dogue Alemão** | Torção gástrica, cardiomiopatia | **6-8 anos** |
| **São Bernardo** | Displasia, torção gástrica | 8-10 anos |
| **Fila Brasileiro** | Guardião nato, dono experiente | 9-11 anos |` },
    ],
  },
  {
    id: "nutricao",
    title: "Nutrição Canina",
    icon: <Apple className="w-5 h-5" />,
    description: "Alimentos seguros, tóxicos e orientações",
    articles: [
      { id: "s-seguros", title: "Alimentos Seguros", icon: <Apple className="w-4 h-4" />, iconName: "Apple", tags: ["nutrição", "seguros"],
        content: `**Frutas:** banana, maçã (sem sementes), melancia (sem sementes), manga, morango, blueberry, pera

**Legumes:** cenoura, batata-doce cozida, abóbora cozida, brócolis (pouca qtd), pepino, abobrinha

**Proteínas:** frango cozido sem tempero, peito de peru, ovos cozidos, peixe cozido (sem espinhas)

**Outros:** arroz, aveia cozida, pasta de amendoim (sem xilitol)` },
      { id: "s-toxicos", title: "Alimentos TÓXICOS", icon: <AlertTriangle className="w-4 h-4" />, iconName: "AlertTriangle", tags: ["nutrição", "tóxicos", "perigo"],
        content: `### ⚠️ NUNCA Oferecer

| Alimento | Perigo |
|---|---|
| **Chocolate** | Teobromina tóxica (amargo = pior) |
| **Uva e passa** | Insuficiência renal aguda |
| **Cebola e alho** | Anemia hemolítica |
| **Xilitol** | Hipoglicemia grave + insuficiência hepática |
| **Macadâmia** | Vômito, tremores, hipertermia |
| **Abacate** | Persina (problemas gastrointestinais) |
| **Cafeína** | Arritmia cardíaca e convulsões |
| **Álcool** | Tóxico em qualquer dose |
| **Ossos cozidos** | Estilhaçam → perfuração intestinal |` },
      { id: "s-fases-alim", title: "Alimentação por Fase de Vida", icon: <Heart className="w-4 h-4" />, iconName: "Heart", tags: ["nutrição", "filhote", "adulto", "idoso"],
        content: `| Fase | Refeições/dia |
|---|---|
| Filhotes 2-6 meses | 3-4 |
| Filhotes 6-12 meses | 2-3 |
| Adultos | 2 |
| Idosos | 2-3 menores |

- Transição alimentar: gradual em **7-10 dias**
- Gigantes: porções menores e frequentes (torção gástrica)` },
    ],
  },
  {
    id: "cuidados",
    title: "Cuidados e Saúde",
    icon: <Heart className="w-5 h-5" />,
    description: "Higiene, exercício, fases da vida e sazonalidade",
    articles: [
      { id: "s-higiene", title: "Higiene e Cuidados Básicos", icon: <Scissors className="w-4 h-4" />, iconName: "Scissors", tags: ["higiene", "banho"],
        content: `### Banho
A cada 15-30 dias com shampoo canino. Secar bem (orelhas e dobras).

### Escovação de Pelos

| Tipo | Frequência |
|---|---|
| Curto | 1-2x/semana |
| Médio | 2-3x/semana |
| Longo | Diariamente |

### Unhas, Dentes, Orelhas
- **Unhas**: a cada 2-4 semanas
- **Dentes**: 2-3x/semana com pasta canina
- **Orelhas**: semanal (orelha caída = mais frequente)` },
      { id: "s-exercicio", title: "Exercício por Porte", icon: <Zap className="w-4 h-4" />, iconName: "Zap", tags: ["exercício", "atividade"],
        content: `| Porte | Exercício/dia |
|---|---|
| Pequeno | 20-40 min |
| Médio | 40-60 min |
| Grande | 60-90 min |
| Gigante | 30-60 min (moderado) |
| Braquicefálicos | Leve, SEM calor |

### Enriquecimento
- Kong, tapete de lamber, treinamento positivo, rodízio de brinquedos
- Sinais de estresse: lamber lábios, bocejar, orelhas para trás, destruir objetos` },
      { id: "s-fases", title: "Cuidados por Fase da Vida", icon: <Heart className="w-4 h-4" />, iconName: "Heart", tags: ["filhote", "adulto", "idoso"],
        content: `### Filhotes (0-12 meses)
- Vacinação V8/V10 + antirrábica · Socialização 3-16 semanas
- Sem passeios públicos antes da vacinação completa

### Adultos (1-7 anos)
- Check-up anual · Reforço vacinal · Controle de peso

### Idosos (7+, gigantes 5+)
- Check-up **semestral** · Atenção artrite · Rampas em móveis` },
      { id: "s-sazonal", title: "Cuidados Sazonais no Brasil", icon: <Thermometer className="w-4 h-4" />, iconName: "Thermometer", tags: ["verão", "inverno", "calor"],
        content: `### Verão
- Braquicefálicos: risco ALTO de golpe de calor
- Passeios só **antes das 8h** ou **após 18h**
- NUNCA deixar pet no carro · Protetor solar para raças claras

### Inverno
- Roupinha para pequenos/pelo curto · Frio agrava artrite

### Chuvas
- Secar bem · Leptospirose (evitar enchentes) · Checar pulgas/carrapatos` },
      { id: "s-doencas", title: "Doenças Comuns por Porte", icon: <AlertTriangle className="w-4 h-4" />, iconName: "AlertTriangle", tags: ["doenças", "predisposição"],
        content: `| Porte | Doenças Comuns |
|---|---|
| **Pequeno** | Luxação patelar, dentários, colapso traqueal, hipoglicemia |
| **Médio** | Otite, alergias, epilepsia, displasia |
| **Grande** | Displasia, torção gástrica, osteossarcoma |
| **Gigante** | Torção gástrica (!), cardiomiopatia, vida curta |` },
    ],
  },
  {
    id: "sistema",
    title: "Sistema e Funcionalidades",
    icon: <Database className="w-5 h-5" />,
    description: "Banco de dados, edge functions e módulos",
    articles: [
      { id: "s-tabelas", title: "Tabelas do Banco de Dados", icon: <Database className="w-4 h-4" />, iconName: "Database", tags: ["banco", "tabelas"],
        content: `### Tabelas Principais

| Tabela | Descrição |
|---|---|
| \`profiles\` | Dados do usuário (nome, telefone, avatar) |
| \`pets\` | Pets (nome, raça, peso, nascimento) |
| \`orders\` | Pedidos (itens, total, status, endereço) |
| \`products\` | Catálogo de produtos |
| \`user_roles\` | Papéis (admin/user) |
| \`loyalty_points\` | Pontos de fidelidade |
| \`user_coupons\` | Cupons de desconto |
| \`user_addresses\` | Endereços de entrega |
| \`treatment_logs\` | Diário de tratamento |
| \`restock_reminders\` | Lembretes de reposição |
| \`chat_messages\` | Mensagens do chatbot |
| \`ai_cached_content\` | Cache da IA |
| \`ai_access_credits\` | Créditos de acesso IA |
| \`emergency_logs\` | Emergências detectadas |

### Tabelas Admin

| Tabela | Descrição |
|---|---|
| \`admin_notifications\` | Notificações admin |
| \`audit_logs\` | Log de auditoria |
| \`campaigns\` / \`campaign_recipients\` | Marketing |
| \`customer_notes\` / \`customer_status\` / \`customer_tags\` | CRM |
| \`stock_movements\` | Estoque |
| \`expenses\` | Despesas |
| \`store_settings\` | Configurações |` },
      { id: "s-edge", title: "Edge Functions (Backend)", icon: <Zap className="w-4 h-4" />, iconName: "Zap", tags: ["edge", "functions", "backend"],
        content: `| Função | Descrição |
|---|---|
| \`pet-ai\` | IA com 6 modos |
| \`chatbot\` | Chatbot geral com contexto |
| \`auto-notify\` | Notificações automáticas |
| \`check-ai-expiry\` | Verificação expiração IA |
| \`check-restock-reminders\` | Lembretes reposição |
| \`send-push\` | Notificações push |

### Modelo IA
**google/gemini-3-flash-preview** · temp 0.4 · Gateway: ai.gateway.lovable.dev` },
      { id: "s-admin", title: "Módulos do Painel Admin", icon: <Settings className="w-4 h-4" />, iconName: "Settings", tags: ["admin", "módulos"],
        content: `| Módulo | Funcionalidades |
|---|---|
| **Dashboard** | Resumo vendas, pedidos, clientes |
| **Pedidos** | Lista, status, detalhes |
| **Produtos** | CRUD, preços, badges, imagens |
| **Estoque** | Movimentações, alertas baixo |
| **Clientes (CRM)** | Funil, tags, notas, exportar CSV |
| **Fidelização** | Pontos, cupons, recompensas |
| **Marketing** | Campanhas com cupons e segmentação |
| **Financeiro** | Receitas vs despesas |
| **Auditoria** | Log de ações |
| **Base de Conhecimento** | Documentação do sistema |` },
      { id: "s-usuario", title: "Funcionalidades do Usuário", icon: <Users className="w-4 h-4" />, iconName: "Users", tags: ["usuário", "perfil"],
        content: `| Módulo | Descrição |
|---|---|
| **Dashboard** | Resumo de pedidos, pontos, pets |
| **Pedidos** | Histórico com timeline |
| **Perfil do Pet** | Cadastro com foto e raça |
| **Diário** | Registro diário com fotos |
| **Super Pet AI** | 6 modos interativos |
| **Cupons** | Ativos e utilizados |
| **Pontos** | Histórico e saldo |
| **Endereços** | Gestão de endereços |
| **Lembretes** | Reposição automática |
| **Conquistas** | Gamificação |
| **Notificações** | Central de notificações |` },
      { id: "s-chatbot", title: "Contexto do Chatbot", icon: <Bot className="w-4 h-4" />, iconName: "Bot", tags: ["chatbot", "contexto"],
        content: `### Dados Injetados no Prompt (usuário logado)

| Dado | Fonte |
|---|---|
| Nome | \`profiles.full_name\` |
| Pets | \`pets\` (até 3, com info da raça) |
| Pedidos | \`orders\` (últimos 3) |
| Cupons | \`user_coupons\` (ativos) |
| Pontos | \`loyalty_points\` (soma) |
| Lembretes | \`restock_reminders\` (próximos 3) |

Respostas terminam com 2-3 sugestões de follow-up.` },
    ],
  },
  {
    id: "marketing",
    title: "Marketing e Campanhas",
    icon: <Megaphone className="w-5 h-5" />,
    description: "Campanhas, fidelização e notificações",
    articles: [
      { id: "s-campanhas", title: "Sistema de Campanhas", icon: <Megaphone className="w-4 h-4" />, iconName: "Megaphone", tags: ["campanhas", "marketing"],
        content: `### Tipos
- **Notificação**: in-app para segmento de clientes
- **Cupom**: cupons personalizados por campanha

### Segmentação
- Status do funil · Tags · Histórico de compras · Pontos

### Fluxo
1. Criar (nome, tipo, mensagem)
2. Definir segmento
3. Configurar cupom (se aplicável)
4. Enviar → \`draft\` → \`sent\` → \`completed\`` },
      { id: "s-fidelizacao", title: "Programa de Fidelização", icon: <Star className="w-4 h-4" />, iconName: "Star", tags: ["pontos", "fidelidade"],
        content: `### Pontos
- **1 ponto = R$ 0,01** em desconto
- Fonte principal: compras · Admins podem ajustar manualmente

### Cupons
- Tipos: porcentagem ou valor fixo
- Pedido mínimo configurável · Expiração · Uso único` },
      { id: "s-notificacoes", title: "Sistema de Notificações", icon: <Bell className="w-4 h-4" />, iconName: "Bell", tags: ["notificações", "push"],
        content: `### Admin: novos pedidos, estoque baixo, ações do sistema
### Usuário: status de pedidos, campanhas, lembretes, informações

### Push
- Assinaturas em \`push_subscriptions\`
- Edge function \`send-push\`
- Web Push API` },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: <Wrench className="w-5 h-5" />,
    description: "Problemas comuns e soluções rápidas",
    articles: [
      { id: "s-ts-ia", title: "IA não responde ou erro 403", icon: <Bot className="w-4 h-4" />, iconName: "Bot", tags: ["troubleshooting", "ia", "erro"],
        content: `### Problema: Super Pet AI não responde

**Causa provável**: Créditos de acesso expirados.

### Solução
1. Verificar tabela \`ai_access_credits\` para o user_id
2. Checar se \`expires_at\` é maior que \`now()\`
3. Se expirado, o usuário precisa fazer uma nova compra
4. Cada compra renova por **30 dias × quantidade de itens**

### Erro 429 (Rate limit)
- Usuário enviando muitas mensagens rápido
- Aguardar alguns segundos e tentar novamente

### Erro 402 (Créditos do sistema)
- Créditos de IA do sistema esgotados
- Verificar saldo no painel de configurações` },
      { id: "s-ts-pedidos", title: "Pedido não aparece no painel", icon: <ShoppingCart className="w-4 h-4" />, iconName: "ShoppingCart", tags: ["troubleshooting", "pedidos"],
        content: `### Problema: Pedido criado mas não aparece

**Verificações**:
1. Checar se o pedido foi inserido na tabela \`orders\`
2. Verificar RLS: admin precisa ter role \`admin\` em \`user_roles\`
3. Verificar se o trigger \`notify_admin_new_order\` está ativo

### Problema: Status não atualiza
- Verificar RLS: apenas admins podem atualizar pedidos
- Checar trigger \`notify_user_order_update\` para notificações` },
      { id: "s-ts-estoque", title: "Estoque não deduz automaticamente", icon: <Package className="w-4 h-4" />, iconName: "Package", tags: ["troubleshooting", "estoque"],
        content: `### Problema: Estoque não diminui após compra

**Verificações**:
1. Trigger \`deduct_stock_on_order\` deve estar ativo
2. O título do item no pedido (\`items[].title\`) deve corresponder exatamente ao \`products.title\`
3. Verificar \`stock_movements\` para movimentações registradas

### Alerta de estoque baixo
- Configurado via \`low_stock_threshold\` em cada produto
- Notificação admin é criada automaticamente quando estoque atinge o threshold` },
      { id: "s-ts-auth", title: "Problemas de autenticação", icon: <Shield className="w-4 h-4" />, iconName: "Shield", tags: ["troubleshooting", "auth", "login"],
        content: `### Problema: Usuário não consegue acessar admin

**Verificações**:
1. Confirmar que \`user_roles\` tem registro com \`role = 'admin'\` para o user_id
2. A função \`has_role\` é \`SECURITY DEFINER\` — não depende de RLS

### Problema: Perfil não criado após cadastro
- Trigger \`handle_new_user\` deve criar perfil e role automaticamente
- Verificar se o trigger está ativo na tabela \`auth.users\`` },
    ],
  },
  {
    id: "glossario",
    title: "Glossário",
    icon: <BookA className="w-5 h-5" />,
    description: "Termos técnicos e veterinários utilizados",
    articles: [
      { id: "s-gloss-vet", title: "Termos Veterinários", icon: <Heart className="w-4 h-4" />, iconName: "Heart", tags: ["glossário", "veterinário"],
        content: `| Termo | Definição |
|---|---|
| **Braquicefálico** | Raças de focinho achatado (Pug, Bulldog, Shih Tzu). Propensos a problemas respiratórios e golpe de calor |
| **Displasia** | Desenvolvimento anormal de articulação (quadril ou cotovelo). Comum em raças grandes |
| **Luxação patelar** | Deslocamento da rótula do joelho. Comum em raças pequenas |
| **DDIV** | Doença do Disco Intervertebral. Comum em Dachshunds e raças longilíneas |
| **Torção gástrica (DVG)** | Dilatação-vólvulo gástrica. EMERGÊNCIA em raças grandes/gigantes. Estômago torce sobre si |
| **Alopecia X** | Queda de pelo em Spitz/Pomerânia se tosado rente. Pelo pode não crescer novamente |
| **Cardiomiopatia** | Doença do músculo cardíaco. Dilatada (Doberman, Boxer) ou hipertrófica |
| **Osteossarcoma** | Câncer ósseo. Comum em raças grandes (Rottweiler, Golden) |
| **Otite** | Inflamação do ouvido. Comum em raças de orelha caída (Beagle, Cocker) |
| **Hipoglicemia** | Queda do açúcar no sangue. Risco em filhotes de raças toy |
| **Entrópio** | Pálpebra que vira para dentro, irritando o olho. Comum em Cane Corso, Shar Pei |` },
      { id: "s-gloss-tech", title: "Termos Técnicos do Sistema", icon: <Database className="w-4 h-4" />, iconName: "Database", tags: ["glossário", "técnico"],
        content: `| Termo | Definição |
|---|---|
| **RLS** | Row Level Security — Controle de acesso por linha no banco |
| **Edge Function** | Função serverless executada na borda (Deno runtime) |
| **Security Definer** | Função SQL executada com permissões do criador, bypass RLS |
| **Trigger** | Ação automática executada quando dados mudam no banco |
| **Streaming** | Resposta da IA enviada em chunks progressivos |
| **JWT** | Token de autenticação com informações do usuário |
| **Anon Key** | Chave pública para acesso ao banco (segura para frontend) |
| **Service Role Key** | Chave privada com acesso total (apenas backend) |` },
    ],
  },
  {
    id: "onboarding",
    title: "Guia de Onboarding",
    icon: <GraduationCap className="w-5 h-5" />,
    description: "Guias para novos administradores",
    articles: [
      { id: "s-onb-inicio", title: "Primeiros Passos como Admin", icon: <GraduationCap className="w-4 h-4" />, iconName: "GraduationCap", tags: ["onboarding", "admin", "início"],
        content: `### Bem-vindo ao Painel Admin Supet! 🎉

**Passo 1**: Familiarize-se com o Dashboard
- Visualize resumo de vendas, pedidos recentes e alertas

**Passo 2**: Confira os Produtos
- Vá em **Produtos** e verifique se todos estão ativos e com estoque correto
- Configure o \`low_stock_threshold\` para alertas automáticos

**Passo 3**: Gerencie Pedidos
- Pedidos novos aparecem como "pending"
- Atualize para: confirmed → shipped → delivered

**Passo 4**: Explore o CRM
- Clientes são categorizados automaticamente (lead, ativo, inativo, VIP)
- Adicione tags e notas para organização

**Passo 5**: Configure Marketing
- Crie sua primeira campanha de notificação
- Segmente por status ou tags de cliente` },
      { id: "s-onb-triggers", title: "Automações Ativas no Sistema", icon: <Zap className="w-4 h-4" />, iconName: "Zap", tags: ["onboarding", "automações", "triggers"],
        content: `### Triggers Automáticos

| Evento | Ação Automática |
|---|---|
| **Novo usuário cadastrado** | Cria perfil + role "user" + cupom de boas-vindas (10% off) |
| **Novo pedido criado** | Deduz estoque + notifica admin + concede pontos + concede acesso IA |
| **Status do pedido muda** | Notifica usuário (confirmado, enviado, entregue, cancelado) |
| **Estoque atinge threshold** | Notifica admin sobre estoque baixo |
| **Novo cupom atribuído** | Notifica usuário sobre cupom disponível |
| **Pontos concedidos** | Notifica usuário sobre pontos ganhos |

### Conversão de Pontos
- **1 ponto por R$ 1 gasto** (arredondado para baixo)
- Cada ponto vale R$ 0,01 em desconto` },
    ],
  },
  {
    id: "faqs-internas",
    title: "FAQs Internas",
    icon: <FileText className="w-5 h-5" />,
    description: "Perguntas frequentes da equipe",
    articles: [
      { id: "s-faq-precos", title: "Posso alterar preços de produtos?", icon: <ShoppingCart className="w-4 h-4" />, iconName: "ShoppingCart", tags: ["faq", "preços", "produtos"],
        content: `### Sim! Via painel Produtos.

1. Vá em **Produtos** no menu lateral
2. Clique no produto desejado
3. Altere \`price\` (preço atual) e \`original_price\` (preço riscado)
4. O badge "Promoção" pode ser adicionado via campo \`badge\`

### Cuidado
- Alterações são **imediatas** e afetam a loja
- Pedidos existentes mantêm o preço original` },
      { id: "s-faq-admin", title: "Como adicionar novo administrador?", icon: <Users className="w-4 h-4" />, iconName: "Users", tags: ["faq", "admin", "acesso"],
        content: `### Adicionando Admin

1. O usuário deve se cadastrar normalmente
2. No banco de dados, inserir na tabela \`user_roles\`:
   - \`user_id\`: ID do usuário
   - \`role\`: \`admin\`
3. O usuário já terá acesso ao painel \`/admin\`

### Segurança
- A verificação usa a função \`has_role\` (Security Definer)
- Não armazene roles em localStorage ou cookies
- Sempre valide server-side via RLS` },
      { id: "s-faq-backup", title: "Os dados são seguros?", icon: <Shield className="w-4 h-4" />, iconName: "Shield", tags: ["faq", "segurança", "backup"],
        content: `### Sim! Proteções ativas:

- **RLS** em todas as tabelas (acesso granular por usuário/admin)
- **Security Definer** para funções de verificação de roles
- **SSL** em todas as conexões
- **Backups automáticos** do banco de dados
- **Auth separada** — senhas nunca acessíveis via API

### Separação de Dados
- Usuários só acessam seus próprios dados
- Admins têm acesso estendido via políticas RLS
- Service Role Key usada apenas em edge functions (backend)` },
      { id: "s-faq-reembolso", title: "Como processar um reembolso?", icon: <ShoppingCart className="w-4 h-4" />, iconName: "ShoppingCart", tags: ["faq", "reembolso", "pedidos"],
        content: `### Processo de Reembolso (Desafio 30 Dias)

1. Verificar se o pedido tem menos de 30 dias
2. Atualizar status do pedido para **"cancelled"**
3. O estoque NÃO é devolvido automaticamente — fazer ajuste manual em **Estoque**
4. Processar reembolso via plataforma de pagamento
5. Os pontos de fidelidade concedidos permanecem (decisão de negócio)

### Registro
- Todas as ações ficam registradas em **Auditoria**` },
    ],
  },
];

/* ─── Markdown Renderer ─── */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushTable = () => {
    if (tableHeaders.length > 0) {
      elements.push(
        <div key={`t-${elements.length}`} className="overflow-x-auto my-4 rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="text-left py-2.5 px-4 font-semibold text-foreground text-xs uppercase tracking-wide">{renderInline(h.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2.5 px-4 text-muted-foreground">{renderInline(cell.trim())}</td>
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
      let first: { idx: number; len: number; node: React.ReactNode } | null = null;
      if (codeMatch?.index !== undefined) {
        const c = { idx: codeMatch.index, len: codeMatch[0].length, node: <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">{codeMatch[1]}</code> };
        if (!first || c.idx < first.idx) first = c;
      }
      if (boldMatch?.index !== undefined) {
        const c = { idx: boldMatch.index, len: boldMatch[0].length, node: <strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong> };
        if (!first || c.idx < first.idx) first = c;
      }
      if (first) {
        if (first.idx > 0) parts.push(remaining.slice(0, first.idx));
        parts.push(first.node);
        remaining = remaining.slice(first.idx + first.len);
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
      if (cells.every(c => /^[\s-:]+$/.test(c))) continue;
      if (!inTable) { inTable = true; tableHeaders = cells; } else { tableRows.push(cells); }
      continue;
    }
    if (inTable) flushTable();
    if (line.startsWith("### ")) elements.push(<h3 key={i} className="text-sm font-bold text-foreground mt-5 mb-2">{renderInline(line.slice(4))}</h3>);
    else if (line.startsWith("## ")) elements.push(<h2 key={i} className="text-base font-bold text-foreground mt-5 mb-2">{renderInline(line.slice(3))}</h2>);
    else if (line.startsWith("- ")) elements.push(<li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    else if (line.trim() === "") elements.push(<div key={i} className="h-1.5" />);
    else elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1.5">{renderInline(line)}</p>);
  }
  if (inTable) flushTable();
  return <div>{elements}</div>;
}

/* ─── Article Editor Dialog ─── */
function ArticleEditor({
  open,
  onClose,
  article,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  article: { id?: string; category: string; title: string; tags: string[]; content: string; icon: string } | null;
  categories: string[];
  onSave: (data: { id?: string; category: string; title: string; tags: string[]; content: string; icon: string }) => void;
}) {
  const [form, setForm] = useState({ category: "", title: "", tags: "", content: "", icon: "FileText" });

  useEffect(() => {
    if (article) {
      setForm({ category: article.category, title: article.title, tags: article.tags.join(", "), content: article.content, icon: article.icon });
    } else {
      setForm({ category: categories[0] || "", title: "", tags: "", content: "", icon: "FileText" });
    }
  }, [article, categories]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article?.id ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
              <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ex: troubleshooting" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ícone</label>
              <Select value={form.icon} onValueChange={(v) => setForm(f => ({ ...f, icon: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ICON_MAP).map(name => (
                    <SelectItem key={name} value={name}><span className="flex items-center gap-2">{ICON_MAP[name]} {name}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título</label>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título do artigo" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tags (separadas por vírgula)</label>
            <Input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2, tag3" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Conteúdo (Markdown)</label>
            <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={12} className="font-mono text-xs" placeholder="### Título\n\nConteúdo em markdown..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ id: article?.id, category: form.category, title: form.title, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), content: form.content, icon: form.icon })}>
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function BaseConhecimento() {
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("produto");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(staticKnowledgeBase[0].articles[0]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [customArticles, setCustomArticles] = useState<any[]>([]);

  // Load custom articles from DB
  useEffect(() => {
    loadCustomArticles();
  }, []);

  const loadCustomArticles = async () => {
    const { data } = await supabase.from("kb_articles").select("*").order("sort_order");
    if (data) setCustomArticles(data);
  };

  // Set of static IDs that have DB overrides
  const overriddenStaticIds = useMemo(() => {
    const set = new Set<string>();
    customArticles.forEach((a) => { if (a.static_id) set.add(a.static_id); });
    return set;
  }, [customArticles]);

  // Merge static + custom articles (DB overrides replace static ones)
  const knowledgeBase = useMemo(() => {
    const merged = staticKnowledgeBase.map(cat => ({
      ...cat,
      articles: cat.articles.map(a => {
        // Check if this static article has a DB override
        const override = customArticles.find(ca => ca.static_id === a.id);
        if (override) {
          return {
            id: override.id,
            title: override.title,
            icon: ICON_MAP[override.icon] || <FileText className="w-4 h-4" />,
            iconName: override.icon,
            tags: override.tags || [],
            content: override.content,
            isCustom: true,
            staticId: a.id,
          };
        }
        return { ...a, staticId: a.id };
      }),
    }));

    // Add purely custom articles (no static_id)
    const customByCategory: Record<string, any[]> = {};
    customArticles.filter(a => !a.static_id).forEach((a) => {
      if (!customByCategory[a.category]) customByCategory[a.category] = [];
      customByCategory[a.category].push(a);
    });

    Object.entries(customByCategory).forEach(([catId, articles]) => {
      const existing = merged.find(c => c.id === catId);
      const mapped = articles.map(a => ({
        id: a.id, title: a.title,
        icon: ICON_MAP[a.icon] || <FileText className="w-4 h-4" />,
        iconName: a.icon, tags: a.tags || [], content: a.content, isCustom: true, staticId: undefined as string | undefined,
      }));
      if (existing) {
        existing.articles.push(...mapped);
      } else {
        merged.push({
          id: catId,
          title: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, " "),
          icon: ICON_MAP[articles[0]?.icon] || <FileText className="w-5 h-5" />,
          description: "Artigos personalizados",
          articles: mapped,
        });
      }
    });

    return merged;
  }, [customArticles]);

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    knowledgeBase.forEach(c => c.articles.forEach(a => a.tags.forEach(t => tags.add(t))));
    return Array.from(tags).sort();
  }, [knowledgeBase]);

  const normalizedSearch = search.toLowerCase().trim();

  const filteredCategories = useMemo(() => {
    let cats = knowledgeBase;
    if (normalizedSearch || activeTag) {
      cats = cats.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a => {
          const matchSearch = !normalizedSearch ||
            a.title.toLowerCase().includes(normalizedSearch) ||
            a.tags.some(t => t.includes(normalizedSearch)) ||
            a.content.toLowerCase().includes(normalizedSearch);
          const matchTag = !activeTag || a.tags.includes(activeTag);
          return matchSearch && matchTag;
        }),
      })).filter(cat => cat.articles.length > 0);
    }
    return cats;
  }, [knowledgeBase, normalizedSearch, activeTag]);

  const totalArticles = knowledgeBase.reduce((sum, c) => sum + c.articles.length, 0);
  const totalCategories = knowledgeBase.length;

  // Save article
  const handleSaveArticle = async (data: { id?: string; category: string; title: string; tags: string[]; content: string; icon: string; staticId?: string }) => {
    if (data.id) {
      const { error } = await supabase.from("kb_articles").update({
        category: data.category, title: data.title, tags: data.tags, content: data.content, icon: data.icon, updated_at: new Date().toISOString(),
      }).eq("id", data.id);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Artigo atualizado!");
    } else {
      const insertData: any = {
        category: data.category, title: data.title, tags: data.tags, content: data.content, icon: data.icon,
      };
      if (data.staticId) insertData.static_id = data.staticId;
      const { error } = await supabase.from("kb_articles").insert(insertData);
      if (error) { toast.error("Erro ao criar artigo"); return; }
      toast.success(data.staticId ? "Artigo personalizado!" : "Artigo criado!");
    }
    setEditorOpen(false);
    setEditingArticle(null);
    loadCustomArticles();
  };

  const handleDeleteArticle = async (id: string) => {
    const { error } = await supabase.from("kb_articles").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Artigo excluído!");
    if (selectedArticle?.id === id) setSelectedArticle(null);
    loadCustomArticles();
  };

  // Find parent category of selected article
  const selectedCategory = knowledgeBase.find(c => c.articles.some(a => a.id === selectedArticle?.id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              Base de Conhecimento
            </h1>
            <p className="text-sm text-muted-foreground mt-1 ml-[52px]">
              Documentação completa do sistema Supet
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar artigos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => { setEditingArticle(null); setEditorOpen(true); }} size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Categorias", value: totalCategories, icon: <BookOpen className="w-4 h-4" /> },
            { label: "Artigos", value: totalArticles, icon: <FileText className="w-4 h-4" /> },
            { label: "Tags", value: allTags.length, icon: <Tag className="w-4 h-4" /> },
            { label: "Personalizados", value: customArticles.length, icon: <Pencil className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{stat.icon}</div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tag filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setActiveTag(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!activeTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            Todas
          </button>
          {allTags.slice(0, 20).map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {tag}
            </button>
          ))}
          {allTags.length > 20 && <span className="px-3 py-1.5 text-xs text-muted-foreground">+{allTags.length - 20}</span>}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[60vh]">
          {/* Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const colors = getCatColors(cat.id);
              return (
                <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{cat.title}</p>
                      <p className="text-[10px] text-muted-foreground">{cat.articles.length} artigos</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCategory === cat.id ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {expandedCategory === cat.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="border-t border-border/50 py-1">
                          {cat.articles.map((article) => (
                            <button
                              key={article.id}
                              onClick={() => setSelectedArticle(article)}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-left text-[13px] transition-colors ${
                                selectedArticle?.id === article.id
                                  ? `${colors.bg} ${colors.text} font-semibold`
                                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                              }`}
                            >
                              <ChevronRight className="w-3 h-3 shrink-0" />
                              <span className="truncate flex-1">{article.title}</span>
                              {article.isCustom && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Article */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedArticle ? (
              <motion.div key={selectedArticle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card">
                {/* Breadcrumb */}
                {selectedCategory && (
                  <div className="px-6 pt-5 flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Base de Conhecimento</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className={getCatColors(selectedCategory.id).text}>{selectedCategory.title}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-foreground font-medium truncate">{selectedArticle.title}</span>
                  </div>
                )}

                <div className="p-6 pt-4">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${selectedCategory ? getCatColors(selectedCategory.id).bg : "bg-primary/10"} flex items-center justify-center ${selectedCategory ? getCatColors(selectedCategory.id).text : "text-primary"} shrink-0 mt-0.5`}>
                        {selectedArticle.icon}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{selectedArticle.title}</h2>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedArticle.tags.map((tag) => (
                            <button key={tag} onClick={() => setActiveTag(tag)} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${selectedCategory ? getCatColors(selectedCategory.id).badge : "bg-muted text-muted-foreground"} hover:opacity-80`}>
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {selectedArticle.isCustom && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => {
                          const dbArticle = customArticles.find(a => a.id === selectedArticle.id);
                          if (dbArticle) { setEditingArticle(dbArticle); setEditorOpen(true); }
                        }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteArticle(selectedArticle.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border/50 pt-5">
                    <MarkdownRenderer content={selectedArticle.content} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-foreground font-semibold mb-1">Selecione um artigo</p>
                <p className="text-sm text-muted-foreground">Escolha uma categoria e artigo no menu lateral</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ArticleEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingArticle(null); }}
        article={editingArticle ? { id: editingArticle.id, category: editingArticle.category, title: editingArticle.title, tags: editingArticle.tags, content: editingArticle.content, icon: editingArticle.icon } : null}
        categories={knowledgeBase.map(c => c.id)}
        onSave={handleSaveArticle}
      />
    </AdminLayout>
  );
}
