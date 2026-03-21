import {
  Product,
  Benefit,
  FAQ,
  Testimonial,
  BlogPostPreview,
  BlogPost,
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
    image: "/images/product-shampoo.png",
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
    image: "/images/product-ecobag.png",
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
    image: "/images/product-petiscos.png",
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
    image: "/images/tutor_maria.png",
  },
  {
    id: "t2",
    petName: "Mimo",
    tutorName: "Pedro M.",
    quote:
      "A queda de pelos reduziu bastante e ele voltou a ficar ativo. Hoje Supet faz parte da rotina diaria.",
    rating: 5,
    image: "/images/tutor_pedro.png",
  },
  {
    id: "t3",
    petName: "Thor",
    tutorName: "Carla F.",
    quote:
      "Testamos varios tratamentos antes, mas com Supet vimos resultado consistente de dentro para fora.",
    rating: 5,
    image: "/images/tutor_carla.png",
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
    coverImage: "/images/pet-healthy-coat.png",
    publishedAt: "2026-02-20",
  },
  {
    id: "p3",
    title: "Pele, pelo e articulações: guia prático para tutores",
    excerpt:
      "Um resumo direto dos cuidados que fazem diferença real na saúde do seu companheiro.",
    slug: "guia-pele-pelo-articulacoes",
    coverImage: "/images/pet-comfortable-home.png",
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

export const blogPosts: BlogPost[] = [
  {
    id: "p1",
    title: "5 sinais de que a pele do seu pet precisa de suporte nutricional",
    excerpt:
      "Entenda os sintomas mais comuns e quando incluir suplementação na rotina de cuidado.",
    slug: "sinais-pele-pet",
    coverImage: "/images/pet-studio.png",
    publishedAt: "2026-03-01",
    author: {
      name: "Dra. Amanda Silva",
      role: "Médica Veterinária Dermatologista",
    },
    category: "Saúde da Pele",
    tags: ["pele", "nutrição", "suplementação", "sintomas"],
    readTime: 6,
    content: [
      {
        type: "paragraph",
        content: "A pele é o maior órgão do corpo do seu cão e funciona como uma barreira protetora contra agentes externos. Quando essa barreira está comprometida por falta de nutrientes essenciais, sinais visíveis começam a aparecer. Identificá-los precocemente pode fazer toda a diferença no tratamento e na qualidade de vida do seu pet."
      },
      {
        type: "heading",
        level: 2,
        content: "1. Coceira Persistente e Lambedura Excessiva"
      },
      {
        type: "paragraph",
        content: "Se o seu cão se coça constantemente, especialmente após as refeições ou durante a noite, isso pode indicar uma deficiência nutricional que está afetando a saúde da pele. A lambedura excessiva, principalmente nas patas, barriga e axilas, é um sinal de que a pele está irritada e inflamada."
      },
      {
        type: "paragraph",
        content: "Nutrientes como Ômega 3 possuem ação anti-inflamatória natural que ajuda a reduzir essas irritações de dentro para fora, ao contrário de pomadas que apenas mascaram o sintoma temporariamente."
      },
      {
        type: "heading",
        level: 2,
        content: "2. Vermelhidão e Hot Spots"
      },
      {
        type: "paragraph",
        content: "Áreas avermelhadas na pele, especialmente aquelas que o pet não para de lamber, evoluem rapidamente para hot spots - lesões quentes e úmidas que podem infeccionar. Essa condição indica que a barreira cutânea está enfraquecida e precisa de reforço nutricional urgente."
      },
      {
        type: "paragraph",
        content: "O Zinco quelato desempenha papel fundamental na cicatrização e regeneração dessas áreas, acelerando a recuperação quando fornecido nas doses adequadas."
      },
      {
        type: "heading",
        level: 2,
        content: "3. Pelagem Opaca e Quebradiça"
      },
      {
        type: "paragraph",
        content: "Uma pelagem sem brilho, quebradiça ou com queda excessiva de pelos é um dos sinais mais evidentes de deficiência nutricional. O pelo saudável deve ser macio, brilhante e resistente."
      },
      {
        type: "paragraph",
        content: "A Biotina ativa é essencial para a produção de queratina, a proteína que compõe os pelos. Sem ela, a pelagem perde força e vitalidade rapidamente."
      },
      {
        type: "heading",
        level: 2,
        content: "4. Descamação e Pele Seca"
      },
      {
        type: "paragraph",
        content: "Se você nota escamas brancas na pelagem do seu cão ou a pele parece ressecada ao toque, isso indica que a hidratação natural da pele está comprometida. Esse é um sinal claro de que os ácidos graxos essenciais estão em falta."
      },
      {
        type: "paragraph",
        content: "O Ômega 3 de alta qualidade restaura a camada lipídica da pele, devolvendo a hidratação e elasticidade naturais."
      },
      {
        type: "heading",
        level: 2,
        content: "5. Infecções Recorrentes"
      },
      {
        type: "paragraph",
        content: "Se o seu pet sofre com infecções de pele frequentes, mesmo após tratamento com antibióticos, isso pode significar que o sistema imunológico cutâneo está fraco. A pele saudável possui defesas naturais que impedem a proliferação de bactérias e fungos."
      },
      {
        type: "paragraph",
        content: "Uma combinação estratégica de vitaminas e minerais fortalece essa imunidade local, reduzindo drasticamente a recorrência de infecções."
      },
      {
        type: "heading",
        level: 2,
        content: "Quando Considerar Suplementação"
      },
      {
        type: "paragraph",
        content: "Se você identificou dois ou mais desses sinais no seu pet, é hora de considerar uma suplementação nutricional específica para pele e pelagem. Consulte sempre um veterinário para um diagnóstico preciso e escolha produtos com ingredientes de alta qualidade e biodisponibilidade comprovada."
      },
      {
        type: "quote",
        content: "A nutrição preventiva é sempre mais eficaz e segura do que tratamentos paliativos. Cuidar da pele de dentro para fora garante resultados duradouros e uma vida mais confortável para o seu melhor amigo."
      }
    ],
    relatedPosts: ["p2", "p5"]
  },
  {
    id: "p2",
    title: "Como melhorar a imunidade do seu cão com hábitos simples",
    excerpt:
      "Alimentação, rotina e nutrientes que ajudam a manter o organismo forte no dia a dia.",
    slug: "imunidade-cao-habitos",
    coverImage: "/images/pet-healthy-coat.png",
    publishedAt: "2026-02-20",
    author: {
      name: "Dr. Rafael Costa",
      role: "Médico Veterinário Nutrólogo",
    },
    category: "Imunidade",
    tags: ["imunidade", "nutrição", "prevenção", "rotina"],
    readTime: 8,
    content: [
      {
        type: "paragraph",
        content: "O sistema imunológico do seu cão é uma complexa rede de defesas que trabalha 24 horas por dia para protegê-lo de doenças. Fortalecer essa proteção natural não requer medidas extremas - pequenas mudanças na rotina e alimentação podem fazer uma diferença significativa na saúde e longevidade do seu pet."
      },
      {
        type: "heading",
        level: 2,
        content: "Alimentação de Qualidade: A Base da Imunidade"
      },
      {
        type: "paragraph",
        content: "A nutrição é o pilar fundamental da saúde imunológica. Uma ração de qualidade premium fornece os nutrientes básicos, mas muitas vezes não oferece quantidades terapêuticas de compostos bioativos essenciais para uma imunidade otimizada."
      },
      {
        type: "list",
        items: [
          "Escolha rações com proteína de alta qualidade como primeiro ingrediente",
          "Evite alimentos com excesso de corantes e conservantes artificiais",
          "Considere suplementação com Ômega 3, que possui ação anti-inflamatória comprovada",
          "Mantenha horários regulares de alimentação para não sobrecarregar o sistema digestivo"
        ]
      },
      {
        type: "paragraph",
        content: "Estudos mostram que 70% do sistema imunológico está localizado no intestino. Uma flora intestinal saudável é essencial para a produção de anticorpos e células de defesa."
      },
      {
        type: "heading",
        level: 2,
        content: "Exercícios Físicos Regulares"
      },
      {
        type: "paragraph",
        content: "A atividade física moderada e regular fortalece o sistema imunológico através de vários mecanismos: melhora a circulação sanguínea, facilita a eliminação de toxinas e reduz o estresse - um dos principais inimigos da imunidade."
      },
      {
        type: "paragraph",
        content: "O ideal é garantir pelo menos 30 minutos de atividade física diária adaptada à raça e idade do seu cão. Caminhadas, brincadeiras e natação são excelentes opções."
      },
      {
        type: "heading",
        level: 2,
        content: "Sono de Qualidade"
      },
      {
        type: "paragraph",
        content: "Durante o sono profundo, o organismo do seu cão produz citocinas - proteínas essenciais para combater infecções e inflamações. Cães adultos precisam de 12 a 14 horas de sono por dia, enquanto filhotes podem precisar de até 18 horas."
      },
      {
        type: "paragraph",
        content: "Garanta um ambiente tranquilo, confortável e escuro para o descanso. Evite interromper o sono do seu pet desnecessariamente."
      },
      {
        type: "heading",
        level: 2,
        content: "Hidratação Adequada"
      },
      {
        type: "paragraph",
        content: "A água é essencial para todas as funções corporais, incluindo o transporte de nutrientes e a eliminação de toxinas. Cães desidratados apresentam queda na produção de células de defesa e maior susceptibilidade a infecções."
      },
      {
        type: "paragraph",
        content: "Mantenha sempre água fresca e limpa disponível. Troque pelo menos duas vezes ao dia e lave o bebedouro regularmente."
      },
      {
        type: "heading",
        level: 2,
        content: "Redução do Estresse"
      },
      {
        type: "paragraph",
        content: "O estresse crônico suprime o sistema imunológico através da liberação de cortisol. Cães estressados ficam mais vulneráveis a infecções, alergias e doenças autoimunes."
      },
      {
        type: "list",
        items: [
          "Mantenha rotinas previsíveis para gerar segurança",
          "Evite exposição a ruídos altos por períodos prolongados",
          "Socialize gradualmente seu pet com outros animais",
          "Ofereça brinquedos interativos para estimulação mental",
          "Reserve tempo de qualidade para interagir com seu cão diariamente"
        ]
      },
      {
        type: "heading",
        level: 2,
        content: "Suplementação Estratégica"
      },
      {
        type: "paragraph",
        content: "Mesmo com todos os cuidados, a alimentação moderna muitas vezes não fornece doses terapêuticas de nutrientes específicos que comprovadamente fortalecem a imunidade:"
      },
      {
        type: "paragraph",
        content: "O Ômega 3 de alta concentração modula a resposta inflamatória, essencial para prevenir doenças autoimunes e alergias. O Zinco participa da produção e maturação de células de defesa. A Vitamina E protege as células imunológicas do dano oxidativo."
      },
      {
        type: "paragraph",
        content: "Suplementos formulados especificamente para cães, com ingredientes de grau farmacêutico, garantem absorção máxima e resultados consistentes."
      },
      {
        type: "quote",
        content: "Prevenir é sempre melhor e mais econômico do que remediar. Hábitos simples implementados consistentemente podem adicionar anos de vida saudável ao seu companheiro."
      },
      {
        type: "paragraph",
        content: "Lembre-se: antes de iniciar qualquer suplementação, consulte um médico veterinário para orientação personalizada de acordo com as necessidades específicas do seu pet."
      }
    ],
    relatedPosts: ["p1", "p3"]
  },
  {
    id: "p5",
    title: "O papel fundamental do ômega 3 na saúde canina",
    excerpt:
      "Descubra como escolher o suplemento ideal de ômega 3 e os enormes benefícios para a pele, visão e coração do seu pet.",
    slug: "papel-omega-3",
    coverImage: "/images/lifestyle-dog.png",
    publishedAt: "2026-03-08",
    author: {
      name: "Dra. Carolina Mendes",
      role: "Médica Veterinária Especialista em Nutrologia",
    },
    category: "Nutrição",
    tags: ["ômega 3", "nutrição", "pele", "coração", "suplementação"],
    readTime: 10,
    content: [
      {
        type: "paragraph",
        content: "O Ômega 3 é um dos nutrientes mais estudados e comprovadamente eficazes para a saúde canina. Trata-se de um ácido graxo essencial - ou seja, o organismo do cão não consegue produzi-lo naturalmente, tornando sua obtenção através da alimentação absolutamente necessária. Entender como e por que suplementar corretamente pode transformar a saúde do seu pet."
      },
      {
        type: "heading",
        level: 2,
        content: "O que é Ômega 3 e Por que é Essencial"
      },
      {
        type: "paragraph",
        content: "O Ômega 3 é uma família de ácidos graxos poli-insaturados, sendo os mais importantes para cães o EPA (ácido eicosapentaenoico) e o DHA (ácido docosahexaenoico). Esses compostos desempenham papéis críticos em praticamente todos os sistemas do organismo."
      },
      {
        type: "paragraph",
        content: "Ao contrário do que muitos pensam, nem todos os tipos de Ômega 3 são iguais. O Ômega 3 de origem marinha (peixe) contém EPA e DHA em formas biodisponíveis, enquanto o de origem vegetal (linhaça) contém ALA, que precisa ser convertido pelo organismo - processo ineficiente em cães."
      },
      {
        type: "heading",
        level: 2,
        content: "Benefícios Comprovados para a Pele"
      },
      {
        type: "paragraph",
        content: "O Ômega 3 age diretamente na saúde da pele através de múltiplos mecanismos:"
      },
      {
        type: "list",
        items: [
          "Reduz significativamente a produção de citocinas inflamatórias responsáveis por coceiras e vermelhidão",
          "Fortalece a barreira lipídica da pele, prevenindo perda excessiva de água",
          "Melhora a qualidade da pelagem, tornando-a mais brilhante e resistente",
          "Acelera a cicatrização de feridas e hot spots através de ação anti-inflamatória local",
          "Reduz descamação e ressecamento cutâneo"
        ]
      },
      {
        type: "paragraph",
        content: "Estudos clínicos demonstram que cães com dermatite atópica apresentam melhora de até 40% nos sintomas após 8 semanas de suplementação adequada com Ômega 3."
      },
      {
        type: "heading",
        level: 2,
        content: "Proteção Cardiovascular"
      },
      {
        type: "paragraph",
        content: "O DHA e EPA possuem ação cardioprotetora comprovada em múltiplos estudos:"
      },
      {
        type: "paragraph",
        content: "Reduzem níveis de triglicerídeos no sangue, diminuindo o risco de formação de placas nas artérias. Melhoram a elasticidade dos vasos sanguíneos, facilitando a circulação. Possuem leve efeito antiarrítmico, estabilizando o ritmo cardíaco. Reduzem a pressão arterial em cães hipertensos."
      },
      {
        type: "paragraph",
        content: "Para cães de raças predispostas a problemas cardíacos (como Dobermans, Boxers e Cavalier King Charles), a suplementação preventiva com Ômega 3 é altamente recomendada."
      },
      {
        type: "heading",
        level: 2,
        content: "Saúde Cerebral e Cognitiva"
      },
      {
        type: "paragraph",
        content: "O DHA compõe aproximadamente 30% da massa seca do cérebro. Sua presença adequada é fundamental para:"
      },
      {
        type: "list",
        items: [
          "Manutenção da função cognitiva em cães idosos",
          "Prevenção da síndrome de disfunção cognitiva canina (equivalente ao Alzheimer)",
          "Desenvolvimento cerebral saudável em filhotes",
          "Melhora da capacidade de aprendizado e memória"
        ]
      },
      {
        type: "paragraph",
        content: "Filhotes e cães idosos são os grupos que mais se beneficiam da suplementação focada em DHA."
      },
      {
        type: "heading",
        level: 2,
        content: "Saúde Articular e Mobilidade"
      },
      {
        type: "paragraph",
        content: "A ação anti-inflamatória natural do Ômega 3 beneficia diretamente a saúde das articulações:"
      },
      {
        type: "paragraph",
        content: "Reduz dor e rigidez em cães com artrite ou displasia. Diminui a necessidade de anti-inflamatórios sintéticos (que podem ter efeitos colaterais). Protege a cartilagem articular da degradação. Melhora significativamente a mobilidade e qualidade de vida."
      },
      {
        type: "paragraph",
        content: "Estudos mostram que a combinação de Ômega 3 com glucosamina potencializa os efeitos de ambos no tratamento de problemas articulares."
      },
      {
        type: "heading",
        level: 2,
        content: "Como Escolher o Suplemento Ideal"
      },
      {
        type: "paragraph",
        content: "Nem todo suplemento de Ômega 3 é criado igual. Critérios essenciais para escolha:"
      },
      {
        type: "paragraph",
        content: "**Origem:** Prefira Ômega 3 de óleo de peixe (especialmente sardinhas, anchovas ou salmão de águas profundas). Evite óleos vegetais que contêm apenas ALA."
      },
      {
        type: "paragraph",
        content: "**Concentração:** Verifique os mg de EPA + DHA por dose, não apenas a quantidade total de óleo. Produtos de qualidade indicam claramente essas concentrações."
      },
      {
        type: "paragraph",
        content: "**Pureza:** Busque produtos certificados quanto à ausência de metais pesados (mercúrio, chumbo) e PCBs. Certificações como IFOS ou USP são indicadores de qualidade."
      },
      {
        type: "paragraph",
        content: "**Forma:** O Ômega 3 na forma de triglicerídeos (TG) ou fosfolipídeos tem melhor absorção que a forma de éster etílico (EE)."
      },
      {
        type: "paragraph",
        content: "**Antioxidantes:** O produto deve conter vitamina E ou outros antioxidantes para prevenir oxidação do óleo."
      },
      {
        type: "heading",
        level: 2,
        content: "Dosagem Recomendada"
      },
      {
        type: "paragraph",
        content: "A dosagem ideal varia conforme o objetivo e peso do animal:"
      },
      {
        type: "list",
        items: [
          "Manutenção geral: 20-30mg de EPA+DHA por kg de peso corporal",
          "Tratamento de alergias/pele: 50-100mg de EPA+DHA por kg",
          "Suporte articular: 70-100mg de EPA+DHA por kg",
          "Cães idosos (cognitivo): 40-60mg de EPA+DHA por kg"
        ]
      },
      {
        type: "paragraph",
        content: "Sempre consulte um veterinário para determinar a dose exata ideal para o seu pet, considerando condições de saúde específicas e possíveis interações com medicamentos."
      },
      {
        type: "heading",
        level: 2,
        content: "Quando Esperar Resultados"
      },
      {
        type: "paragraph",
        content: "Os efeitos da suplementação com Ômega 3 são progressivos:"
      },
      {
        type: "list",
        items: [
          "Melhora na pelagem e brilho: 4-6 semanas",
          "Redução de coceiras e inflamação de pele: 6-8 semanas",
          "Melhora articular: 8-12 semanas",
          "Efeitos cognitivos: 12+ semanas"
        ]
      },
      {
        type: "paragraph",
        content: "A consistência é fundamental - resultados ótimos requerem suplementação contínua a longo prazo."
      },
      {
        type: "quote",
        content: "O Ômega 3 não é apenas um suplemento - é um nutriente essencial que a natureza projetou para ser parte fundamental da dieta canina. Garantir sua presença adequada é um dos investimentos mais valiosos que você pode fazer na saúde do seu companheiro."
      },
      {
        type: "paragraph",
        content: "Escolha produtos de alta qualidade, com concentrações terapêuticas e certificações de pureza. Seu pet merece o melhor."
      }
    ],
    relatedPosts: ["p1", "p2"]
  },
  {
    id: "p3",
    title: "Pele, pelo e articulações: guia prático para tutores",
    excerpt:
      "Um resumo direto dos cuidados que fazem diferença real na saúde do seu companheiro.",
    slug: "guia-pele-pelo-articulacoes",
    coverImage: "/images/pet-comfortable-home.png",
    publishedAt: "2026-02-12",
    author: {
      name: "Dra. Amanda Silva",
      role: "Médica Veterinária Dermatologista",
    },
    category: "Guia Prático",
    tags: ["pele", "pelagem", "articulações", "guia", "cuidados"],
    readTime: 7,
    content: [
      {
        type: "paragraph",
        content: "Se você é tutor de primeira viagem ou simplesmente quer organizar a rotina de cuidados do seu cão, este guia prático reúne os três pilares que mais impactam a qualidade de vida: pele saudável, pelagem forte e articulações funcionais. São sistemas interligados, e negligenciar um afeta diretamente os outros."
      },
      {
        type: "heading",
        level: 2,
        content: "Pele: A Primeira Linha de Defesa"
      },
      {
        type: "paragraph",
        content: "A pele do cão é muito mais fina que a humana e renova-se completamente a cada 21 dias. Esse ciclo intenso demanda uma oferta constante de nutrientes específicos, especialmente ácidos graxos essenciais, zinco e vitaminas do complexo B."
      },
      {
        type: "heading",
        level: 3,
        content: "Rotina Básica de Cuidados com a Pele"
      },
      {
        type: "list",
        items: [
          "Banhe seu cão no máximo a cada 15 dias com shampoo dermatológico de pH adequado (entre 6,5 e 7,5)",
          "Seque completamente após o banho, especialmente entre dobras cutâneas e dedos das patas",
          "Inspecione semanalmente orelhas, patas e barriga em busca de vermelhidão ou descamação",
          "Mantenha o ambiente limpo e livre de ácaros, trocando a cama do pet regularmente",
          "Evite perfumes e produtos humanos na pele do animal"
        ]
      },
      {
        type: "paragraph",
        content: "Se a pele apresentar qualquer odor desagradável, secreção ou mudança de coloração, procure o veterinário imediatamente. Infecções cutâneas tratadas precocemente são resolvidas em dias; ignoradas, podem levar semanas."
      },
      {
        type: "heading",
        level: 2,
        content: "Pelagem: O Reflexo da Saúde Interna"
      },
      {
        type: "paragraph",
        content: "A pelagem funciona como um espelho do estado nutricional do seu cão. Pelos opacos, quebradiços ou com queda excessiva quase sempre indicam deficiência nutricional, e não apenas falta de escovação."
      },
      {
        type: "heading",
        level: 3,
        content: "O que Fazer Pela Pelagem"
      },
      {
        type: "list",
        items: [
          "Escove pelo menos 3 vezes por semana para estimular circulação e distribuir oleosidade natural",
          "Garanta ingestão adequada de Biotina (essencial para produção de queratina)",
          "Suplemente com Ômega 3 de fonte marinha para brilho e maciez",
          "Evite tosas muito rentes em raças de pelagem dupla, pois compromete a termorregulação",
          "Ofereça alimentação rica em proteína de alta qualidade"
        ]
      },
      {
        type: "quote",
        content: "A queda de pelo é normal e faz parte do ciclo de renovação. O que não é normal é queda excessiva, falhas visíveis ou ausência de brilho. Esses são sinais claros de que algo precisa de atenção."
      },
      {
        type: "heading",
        level: 2,
        content: "Articulações: Mobilidade é Qualidade de Vida"
      },
      {
        type: "paragraph",
        content: "Problemas articulares afetam 1 em cada 5 cães adultos e são a principal causa de dor crônica na espécie. A prevenção começa cedo e combina exercício adequado, peso controlado e suplementação inteligente."
      },
      {
        type: "heading",
        level: 3,
        content: "Sinais de Alerta Articular"
      },
      {
        type: "list",
        items: [
          "Dificuldade para levantar-se, especialmente após descanso prolongado",
          "Mancar ou claudicar após exercício físico",
          "Relutância em subir escadas, pular ou brincar como antes",
          "Lambedura frequente nas articulações",
          "Postura encurvada ou mudança na forma de caminhar"
        ]
      },
      {
        type: "heading",
        level: 3,
        content: "Prevenção e Manejo"
      },
      {
        type: "paragraph",
        content: "Mantenha o peso corporal dentro da faixa ideal para a raça. A obesidade é o fator de risco número um para problemas articulares em cães. Cada quilo extra exerce pressão adicional significativa sobre cartilagens e ligamentos."
      },
      {
        type: "paragraph",
        content: "Exercício moderado e regular fortalece a musculatura de suporte articular. Evite atividades de alto impacto como saltos repetitivos ou corrida em superfícies duras. Natação e caminhadas em terreno macio são ideais."
      },
      {
        type: "paragraph",
        content: "A suplementação com Ômega 3 (EPA e DHA) demonstra redução significativa de dor e inflamação articular. Combinado com glucosamina e condroitina, forma uma estratégia preventiva de excelência."
      },
      {
        type: "heading",
        level: 2,
        content: "Integrando os Três Pilares"
      },
      {
        type: "paragraph",
        content: "A beleza desta abordagem está na sinergia: o Ômega 3 que protege as articulações é o mesmo que fortalece a barreira cutânea e dá brilho à pelagem. A Biotina que reconstrói o pelo também participa da saúde das unhas e integridade da pele."
      },
      {
        type: "paragraph",
        content: "Uma suplementação bem formulada atende os três pilares simultaneamente, simplificando a rotina do tutor e maximizando os resultados para o pet. Consulte seu veterinário para a orientação mais adequada ao perfil do seu cão."
      }
    ],
    relatedPosts: ["p1", "p5"]
  },
  {
    id: "p4",
    title: "Por que as alergias são tão comuns em algumas raças?",
    excerpt:
      "Conheça as predisposições raciais e como proteger o seu amigão da melhor forma possível, evitando crises e desconfortos extremos.",
    slug: "alergias-racas",
    coverImage: "/images/dog-closeup.png",
    publishedAt: "2026-03-05",
    author: {
      name: "Dr. Rafael Costa",
      role: "Médico Veterinário Nutrólogo",
    },
    category: "Alergias",
    tags: ["alergias", "raças", "genética", "dermatite", "prevenção"],
    readTime: 9,
    content: [
      {
        type: "paragraph",
        content: "Se você é tutor de um Buldogue, Labrador, Golden Retriever, Shih Tzu ou Pastor Alemão, provavelmente já enfrentou algum episódio alérgico no seu cão. Não é coincidência: a genética desempenha papel determinante na predisposição a alergias cutâneas, e entender esse fator é o primeiro passo para proteger seu pet de forma eficaz."
      },
      {
        type: "heading",
        level: 2,
        content: "A Base Genética das Alergias Caninas"
      },
      {
        type: "paragraph",
        content: "A dermatite atópica canina, a forma mais comum de alergia cutânea, é uma condição hereditária. Cães afetados nascem com uma barreira cutânea geneticamente mais fina e permeável, o que permite que alérgenos ambientais penetrem na pele com mais facilidade."
      },
      {
        type: "paragraph",
        content: "Estudos genéticos identificaram mutações no gene da filagrina, uma proteína estrutural da pele, em cães com dermatite atópica. Essa deficiência compromete a integridade da barreira epitelial, tornando o animal cronicamente vulnerável."
      },
      {
        type: "heading",
        level: 2,
        content: "Raças Mais Predispostas"
      },
      {
        type: "paragraph",
        content: "Embora qualquer cão possa desenvolver alergias, algumas raças apresentam incidência significativamente maior:"
      },
      {
        type: "heading",
        level: 3,
        content: "Buldogue Francês e Inglês"
      },
      {
        type: "paragraph",
        content: "As dobras cutâneas criam microambientes quentes e úmidos, perfeitos para proliferação de bactérias e fungos. A pele curta e as narinas estreitas adicionam fatores de estresse ao sistema respiratório e imunológico."
      },
      {
        type: "heading",
        level: 3,
        content: "Golden Retriever e Labrador"
      },
      {
        type: "paragraph",
        content: "Possuem alta incidência de dermatite atópica e alergias alimentares. A pelagem densa pode ocultar lesões iniciais, atrasando o diagnóstico. Hot spots são extremamente frequentes nessas raças."
      },
      {
        type: "heading",
        level: 3,
        content: "Shih Tzu e Lhasa Apso"
      },
      {
        type: "paragraph",
        content: "A pelagem longa e sedosa requer manutenção intensa. Quando negligenciada, favorece dermatites por umidade retida e irritação mecânica. Alergias alimentares são particularmente comuns."
      },
      {
        type: "heading",
        level: 3,
        content: "Pastor Alemão"
      },
      {
        type: "paragraph",
        content: "Predisposição genética tanto para dermatite atópica quanto para pioderma profunda. O sistema imunológico tende a ser reativo, gerando respostas inflamatórias desproporcionais."
      },
      {
        type: "heading",
        level: 3,
        content: "West Highland White Terrier"
      },
      {
        type: "paragraph",
        content: "Uma das raças com maior prevalência de dermatite atópica no mundo, com estudos apontando até 25% da população afetada. A pele clara torna as lesões mais visíveis e a predisposição é fortemente hereditária."
      },
      {
        type: "heading",
        level: 2,
        content: "Os Três Tipos Principais de Alergia"
      },
      {
        type: "list",
        items: [
          "Dermatite Atópica Ambiental: Reação a alérgenos como pólen, ácaros, mofo e gramíneas. É sazonal em alguns casos e perene em outros",
          "Alergia Alimentar: Proteínas específicas (frango, boi, soja) desencadeiam reação imunológica. Manifesta-se com coceira intensa, vômitos e diarreia crônica",
          "Dermatite Alérgica à Picada de Pulga (DAPP): Uma única picada de pulga pode desencadear coceira severa por dias em animais sensibilizados"
        ]
      },
      {
        type: "heading",
        level: 2,
        content: "Estratégias de Prevenção por Raça"
      },
      {
        type: "paragraph",
        content: "Conhecer a predisposição racial do seu cão permite implementar estratégias preventivas antes que as crises se instalem:"
      },
      {
        type: "list",
        items: [
          "Mantenha o controle rigoroso de pulgas e carrapatos durante o ano todo",
          "Escolha alimentação hipoalergênica ou de proteína novel para raças sensíveis",
          "Fortaleça a barreira cutânea com suplementação de Ômega 3 e Zinco desde filhote",
          "Realize banhos com frequência adequada usando produtos dermatológicos específicos",
          "Monitore sazonalidade dos sintomas para identificar gatilhos ambientais",
          "Considere imunoterapia para casos de dermatite atópica confirmada"
        ]
      },
      {
        type: "heading",
        level: 2,
        content: "O Papel da Nutrição na Prevenção"
      },
      {
        type: "paragraph",
        content: "A suplementação nutricional estratégica é uma das ferramentas mais poderosas na prevenção de crises alérgicas. Ácidos graxos Ômega 3 (EPA e DHA) modulam a resposta inflamatória, reduzindo a intensidade e frequência dos episódios."
      },
      {
        type: "paragraph",
        content: "O Zinco quelato fortalece a barreira cutânea em nível celular, compensando parcialmente a deficiência genética de filagrina. A Biotina acelera a renovação epidérmica, ajudando a manter a pele íntegra e resistente."
      },
      {
        type: "quote",
        content: "A genética carrega o revólver, mas é o ambiente que puxa o gatilho. Com os cuidados preventivos corretos, mesmo cães de raças predispostas podem viver com muito menos desconforto e mais qualidade de vida."
      },
      {
        type: "paragraph",
        content: "Se o seu cão pertence a uma raça predisposta, não espere os sintomas aparecerem. A prevenção nutricional e ambiental iniciada precocemente pode reduzir em até 60% a ocorrência de crises alérgicas ao longo da vida."
      }
    ],
    relatedPosts: ["p1", "p6"]
  },
  {
    id: "p6",
    title: "Como garantir o conforto do seu pet em dias quentes",
    excerpt:
      "Dicas práticas e seguras para refrescar o seu cachorro durante o verão e evitar hipertermia ou problemas de pele relacionados ao calor.",
    slug: "conforto-dias-quentes",
    coverImage: "/images/pet-happy-playing.png",
    publishedAt: "2026-01-25",
    author: {
      name: "Dra. Carolina Mendes",
      role: "Médica Veterinária Especialista em Nutrologia",
    },
    category: "Bem-estar",
    tags: ["verão", "calor", "hidratação", "pele", "conforto"],
    readTime: 6,
    content: [
      {
        type: "paragraph",
        content: "Com temperaturas ultrapassando os 35 graus em boa parte do Brasil, o verão pode ser um período de risco real para a saúde do seu cão. Diferente dos humanos, cães não transpiram pela pele. Sua principal forma de termorregulação é a respiração ofegante, o que os torna muito mais vulneráveis ao superaquecimento."
      },
      {
        type: "heading",
        level: 2,
        content: "Entendendo a Hipertermia Canina"
      },
      {
        type: "paragraph",
        content: "A hipertermia ocorre quando a temperatura corporal do cão ultrapassa 39,5°C, podendo levar a falência de órgãos e morte se não tratada imediatamente. Raças braquicefálicas (focinho curto) como Buldogues, Pugs e Boxers são especialmente vulneráveis, assim como cães obesos, idosos e de pelagem escura."
      },
      {
        type: "heading",
        level: 3,
        content: "Sinais de Alerta"
      },
      {
        type: "list",
        items: [
          "Respiração ofegante excessiva e ruidosa",
          "Salivação abundante e espessa",
          "Gengivas avermelhadas ou azuladas",
          "Desorientação, tropeços ou fraqueza nas pernas",
          "Vômitos e diarreia",
          "Colapso ou perda de consciência"
        ]
      },
      {
        type: "paragraph",
        content: "Se você notar qualquer desses sinais, mova o animal para um local fresco imediatamente, aplique toalhas úmidas e frias nas axilas, virilhas e almofadas das patas, e procure atendimento veterinário de emergência."
      },
      {
        type: "heading",
        level: 2,
        content: "Hidratação: Muito Além da Água no Pote"
      },
      {
        type: "paragraph",
        content: "No verão, a necessidade hídrica do seu cão pode aumentar em até 50%. Apenas deixar o pote cheio não é suficiente para muitos cães que naturalmente bebem pouca água."
      },
      {
        type: "list",
        items: [
          "Ofereça múltiplos pontos de água pela casa e no quintal",
          "Adicione cubos de gelo na água para torná-la mais atrativa",
          "Prepare picolés caninos com caldo de carne sem sal ou frutas como melancia e banana",
          "Umedeça a ração seca com água para aumentar ingestão hídrica indireta",
          "Troque a água pelo menos 3 vezes ao dia para mantê-la fresca"
        ]
      },
      {
        type: "heading",
        level: 2,
        content: "Horários de Passeio: A Regra do Asfalto"
      },
      {
        type: "paragraph",
        content: "Nunca passeie com seu cão entre 10h e 16h no verão. Além do risco de hipertermia, o asfalto pode atingir temperaturas superiores a 60°C, causando queimaduras graves nas almofadas plantares."
      },
      {
        type: "paragraph",
        content: "Faça o teste da mão: coloque as costas da mão no chão por 5 segundos. Se for desconfortável para você, está quente demais para as patas do seu cão. Prefira passeios ao amanhecer (antes das 8h) ou ao entardecer (após as 17h), priorizando grama e terra."
      },
      {
        type: "heading",
        level: 2,
        content: "Cuidados com a Pele no Calor"
      },
      {
        type: "paragraph",
        content: "O calor intensifica problemas de pele existentes e pode criar novos. A umidade e o suor acumulados em dobras cutâneas favorecem infecções bacterianas e fúngicas. A exposição solar direta sem proteção pode causar dermatite solar, especialmente em cães de pelagem clara."
      },
      {
        type: "list",
        items: [
          "Nunca tose o pelo rente no verão pensando em refrescar. A pelagem é isolante térmico e protetor solar natural",
          "Aplique protetor solar específico para cães em áreas expostas como focinho e orelhas",
          "Seque completamente dobras cutâneas após banhos ou brincadeiras na água",
          "Aumente a frequência de inspeção da pele para detectar irritações precoces",
          "Mantenha suplementação com Ômega 3 para fortalecer a barreira cutânea durante o período de estresse térmico"
        ]
      },
      {
        type: "heading",
        level: 2,
        content: "Ambiente Seguro em Casa"
      },
      {
        type: "paragraph",
        content: "Garanta que seu cão tenha sempre acesso a uma área sombreada e ventilada. Ventiladores, tapetes gelados (cooling mats) e casas com boa circulação de ar fazem diferença real."
      },
      {
        type: "paragraph",
        content: "Evite deixar seu cão em carros fechados mesmo por poucos minutos. Em dias quentes, a temperatura interna de um veículo pode ultrapassar 50°C em menos de 10 minutos, mesmo com janelas parcialmente abertas."
      },
      {
        type: "heading",
        level: 2,
        content: "Nutrição no Verão"
      },
      {
        type: "paragraph",
        content: "No calor, o apetite do cão tende a diminuir naturalmente, pois o gasto energético com termorregulação cai. Respeite esse ritmo, mas garanta que a qualidade nutricional se mantenha alta."
      },
      {
        type: "paragraph",
        content: "Suplementação com antioxidantes (Vitamina E, Selênio) ajuda a combater o estresse oxidativo intensificado pelo calor. O Ômega 3 mantém a hidratação da pele e a integridade da barreira cutânea, que é testada ao máximo durante o verão."
      },
      {
        type: "quote",
        content: "O verão deveria ser um período de diversão e energia, não de sofrimento. Com planejamento simples e cuidados preventivos, seu cão pode aproveitar a estação com segurança e conforto total."
      }
    ],
    relatedPosts: ["p4", "p3"]
  }
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
