import {
  Product,
  Benefit,
  FAQ,
  Testimonial,
  BlogPostPreview,
  SocialLink,
} from "@/types";

export const products: Product[] = [
  {
    id: "combo-1",
    title: "O Queridinho",
    subtitle: "1 pote • Tratamento de 30 dias",
    price: 149.90,
    originalPrice: 199.90,
    pricePerUnit: "R$ 149,90/pote",
    quantity: 1,
    category: "combo",
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
    category: "combo",
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
    category: "combo",
  },
  {
    id: "extra-1",
    title: "Shampoo Calmante",
    subtitle: "Extratos naturais • 250ml",
    price: 69.90,
    originalPrice: 89.90,
    pricePerUnit: "R$ 69,90/un",
    quantity: 1,
    category: "extra",
    image: "/images/product-gummy.png",
  },
  {
    id: "extra-2",
    title: "EcoBag Supet",
    subtitle: "Sustentável e estilosa",
    price: 45.00,
    originalPrice: 60.00,
    pricePerUnit: "R$ 45,00/un",
    quantity: 1,
    category: "extra",
    image: "/images/hero-dog.png",
  },
  {
    id: "extra-3",
    title: "Petiscos Imunidade",
    subtitle: "Sabor Carne • 150g",
    price: 39.90,
    originalPrice: 49.90,
    pricePerUnit: "R$ 39,90/un",
    quantity: 1,
    category: "extra",
    image: "/images/dog-closeup.png",
  },
];

export const benefits: Benefit[] = [
  {
    id: "b1",
    icon: "🛡️",
    title: "Imunidade Reforçada",
    description:
      "Nutrientes funcionais que apoiam a resposta natural do organismo e reduzem recorrências.",
  },
  {
    id: "b2",
    icon: "✨",
    title: "Pelo e Pelagem Brilhante",
    description:
      "Ômega, biotina e vitaminas para uma pelagem mais forte, macia e com brilho visível.",
  },
  {
    id: "b3",
    icon: "🌿",
    title: "Fórmula Cruelty-Free",
    description:
      "Composição sem testes em animais e sem ingredientes agressivos para o bem-estar do seu pet.",
  },
  {
    id: "b4",
    icon: "🐾",
    title: "Saúde das Articulações",
    description:
      "Suporte diário para mobilidade, conforto e qualidade de vida em todas as fases.",
  },
];

export const faqs: FAQ[] = [
  {
    id: "f1",
    question: "O que e Supet?",
    answer:
      "Supet e um suplemento natural desenvolvido para ajudar a combater problemas de pele em caes, como coceiras, alergias e queda de pelos.",
  },
  {
    id: "f2",
    question: "Como devo oferecer Supet ao meu pet?",
    answer:
      "Recomenda-se oferecer uma unidade por dia, preferencialmente apos a alimentacao.",
  },
  {
    id: "f3",
    question: "A partir de qual idade o pet pode usar?",
    answer: "Pets a partir de 3 meses ja podem consumir.",
  },
  {
    id: "f4",
    question: "Supet pode engordar meu pet?",
    answer: "Nao. A formula nao contem acucares ou gorduras prejudiciais.",
  },
  {
    id: "f5",
    question: "Existem contraindicacoes?",
    answer: "Supet e formulado com ingredientes naturais e seguros para a maioria dos pets.",
  },
  {
    id: "f6",
    question: "E se meu pet nao se adaptar?",
    answer:
      "Caso seu pet nao se adapte ao produto, existe garantia de satisfacao dentro do prazo informado.",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    petName: "Revi",
    tutorName: "Maria A.",
    quote:
      "Em poucas semanas o Revi parou de se cocar o tempo todo e a pele ficou muito melhor.",
    rating: 5,
    image: "/images/hero-dog.png",
  },
  {
    id: "t2",
    petName: "Mimo",
    tutorName: "Pedro M.",
    quote:
      "A queda de pelos reduziu bastante e ele voltou a ficar ativo. Hoje Supet faz parte da rotina diaria.",
    rating: 5,
    image: "/images/dog-closeup.png",
  },
  {
    id: "t3",
    petName: "Thor",
    tutorName: "Carla F.",
    quote:
      "Testamos varios tratamentos antes, mas com Supet vimos resultado consistente de dentro para fora.",
    rating: 5,
    image: "/images/lifestyle-dog.png",
  },
];

export const blogPreviews: BlogPostPreview[] = [
  {
    id: "p1",
    title: "5 sinais de que a pele do seu pet precisa de suporte nutricional",
    excerpt:
      "Entenda os sintomas mais comuns e quando incluir suplementação na rotina de cuidado.",
    slug: "sinais-pele-pet",
    coverImage: "/images/pet-studio.png",
    publishedAt: "2026-03-01",
  },
  {
    id: "p2",
    title: "Como melhorar a imunidade do seu cão com hábitos simples",
    excerpt:
      "Alimentação, rotina e nutrientes que ajudam a manter o organismo forte no dia a dia.",
    slug: "imunidade-cao-habitos",
    coverImage: "/images/pet-winter.png",
    publishedAt: "2026-02-20",
  },
  {
    id: "p3",
    title: "Pele, pelo e articulações: guia prático para tutores",
    excerpt:
      "Um resumo direto dos cuidados que fazem diferença real na saúde do seu companheiro.",
    slug: "guia-pele-pelo-articulacoes",
    coverImage: "/images/pet-fashion.png",
    publishedAt: "2026-02-12",
  },
  {
    id: "p4",
    title: "Por que as alergias são tão comuns em algumas raças?",
    excerpt:
      "Conheça as predisposições raciais e como proteger o seu amigão da melhor forma possível, evitando crises e desconfortos extremos.",
    slug: "alergias-racas",
    coverImage: "/images/dog-closeup.png",
    publishedAt: "2026-03-05",
  },
  {
    id: "p5",
    title: "O papel fundamental do ômega 3 na saúde canina",
    excerpt:
      "Descubra como escolher o suplemento ideal de ômega 3 e os enormes benefícios para a pele, visão e coração do seu pet.",
    slug: "papel-omega-3",
    coverImage: "/images/lifestyle-dog.png",
    publishedAt: "2026-03-08",
  },
  {
    id: "p6",
    title: "Como garantir o conforto do seu pet em dias quentes",
    excerpt:
      "Dicas práticas e seguras para refrescar o seu cachorro durante o verão e evitar hipertermia ou problemas de pele relacionados ao calor.",
    slug: "conforto-dias-quentes",
    coverImage: "/images/pet-studio.png",
    publishedAt: "2026-01-25",
  },
];

export const socialLinks: SocialLink[] = [
  {
    id: "s1",
    platform: "facebook",
    url: "https://facebook.com/supet.oficial",
    ariaLabel: "Supet no Facebook",
  },
  {
    id: "s2",
    platform: "instagram",
    url: "https://instagram.com/supet.oficial",
    ariaLabel: "Supet no Instagram",
  },
  {
    id: "s3",
    platform: "youtube",
    url: "https://youtube.com/@supet.oficial",
    ariaLabel: "Supet no YouTube",
  },
  {
    id: "s4",
    platform: "tiktok",
    url: "https://tiktok.com/@supet.oficial",
    ariaLabel: "Supet no TikTok",
  },
];
