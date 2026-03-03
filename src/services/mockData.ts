import { Product, Benefit, FAQ } from "@/types";

export const products: Product[] = [
  {
    id: "combo-1",
    title: "O Queridinho",
    subtitle: "1 pote • Tratamento de 30 dias",
    price: 149.90,
    originalPrice: 199.90,
    pricePerUnit: "R$ 149,90/pote",
    quantity: 1,
  },
  {
    id: "combo-2",
    title: "O Mais Vendido",
    subtitle: "2 potes • Tratamento de 60 dias",
    price: 249.90,
    originalPrice: 399.80,
    pricePerUnit: "R$ 124,95/pote",
    quantity: 2,
    badge: "Mais Popular",
    highlighted: true,
  },
  {
    id: "combo-3",
    title: "O Recomendado",
    subtitle: "3 potes • Tratamento de 90 dias",
    price: 329.90,
    originalPrice: 599.70,
    pricePerUnit: "R$ 109,97/pote",
    quantity: 3,
    badge: "Melhor Custo-Benefício",
  },
];

export const benefits: Benefit[] = [
  {
    id: "b1",
    icon: "⚡",
    title: "Alívio em 7 Dias",
    description: "Resultados visíveis na primeira semana de uso. Seu pet sente a diferença rapidamente.",
  },
  {
    id: "b2",
    icon: "🌿",
    title: "100% Natural",
    description: "Ingredientes naturais selecionados por veterinários. Sem químicos, sem efeitos colaterais.",
  },
  {
    id: "b3",
    icon: "✨",
    title: "Pelagem Linda",
    description: "Pelos mais brilhantes, macios e saudáveis. A mudança que se vê e se sente.",
  },
  {
    id: "b4",
    icon: "🛡️",
    title: "Fortalece a Imunidade",
    description: "Fortalece as defesas do organismo de dentro para fora, prevenindo recaídas.",
  },
];

export const faqs: FAQ[] = [
  {
    id: "f1",
    question: "Em quanto tempo vou ver resultados?",
    answer: "A maioria dos tutores relata melhorias visíveis já na primeira semana. Para resultados completos, recomendamos o uso contínuo por pelo menos 30 dias.",
  },
  {
    id: "f2",
    question: "É seguro para todas as raças e idades?",
    answer: "Sim! Nossa fórmula foi desenvolvida por veterinários e é segura para cães de todas as raças e idades, incluindo filhotes a partir de 3 meses.",
  },
  {
    id: "f3",
    question: "Qual a composição das gomas?",
    answer: "Nossas gomas são feitas com ingredientes 100% naturais, incluindo ômega 3, biotina, zinco, vitamina E e extratos vegetais selecionados.",
  },
  {
    id: "f4",
    question: "Como devo dar para meu pet?",
    answer: "As gomas são palatáveis e a maioria dos cães adora o sabor! Basta oferecer a quantidade recomendada de acordo com o peso do seu pet, uma vez ao dia.",
  },
  {
    id: "f5",
    question: "Tem garantia de satisfação?",
    answer: "Sim! Oferecemos garantia de 30 dias. Se você não notar diferença na saúde do seu pet, devolvemos 100% do seu dinheiro.",
  },
];
