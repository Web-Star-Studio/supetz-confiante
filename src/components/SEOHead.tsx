import { Helmet } from "react-helmet-async";

const BASE_URL = "https://supetz-playful-trust.lovable.app";
const DEFAULT_IMAGE = `${BASE_URL}/favicon.png`;
const SITE_NAME = "Supet";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  /** ISO date for article publish */
  publishedTime?: string;
  /** ISO date for article modification */
  modifiedTime?: string;
  /** Author name for articles */
  author?: string;
  /** Article section / category */
  section?: string;
  /** Article tags */
  tags?: string[];
}

export default function SEOHead({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  jsonLd,
  noindex = false,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: SEOHeadProps) {
  const url = `${BASE_URL}${path}`;
  const fullTitle = path === "/" ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      {/* Article-specific Open Graph */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" && tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// ─── Reusable structured data builders ───────────────────────────

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || DEFAULT_IMAGE,
    brand: { "@type": "Brand", name: "Supet" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/shop`,
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
        bestRating: 5,
      },
    }),
  };
}

/**
 * Article schema for blog posts — critical for AEO/GEO.
 * Includes speakable markup for voice assistants.
 */
export function buildArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedAt?: string;
  modifiedAt?: string;
  authorName: string;
  authorRole?: string;
  category?: string;
  tags?: string[];
  wordCount?: number;
  readTime?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image || DEFAULT_IMAGE,
    url: article.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt || article.publishedAt,
    author: {
      "@type": "Person",
      name: article.authorName,
      ...(article.authorRole && { jobTitle: article.authorRole }),
    },
    publisher: {
      "@type": "Organization",
      name: "Supet",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/favicon.png` },
    },
    ...(article.category && { articleSection: article.category }),
    ...(article.tags && { keywords: article.tags.join(", ") }),
    ...(article.wordCount && { wordCount: article.wordCount }),
    ...(article.readTime && {
      timeRequired: `PT${article.readTime}M`,
    }),
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable='true']"],
    },
  };
}

/**
 * HowTo schema — useful for treatment/usage guides.
 */
export function buildHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; image?: string }[];
  totalTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    ...(howTo.totalTime && { totalTime: howTo.totalTime }),
    step: howTo.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

/**
 * ItemList schema for blog listing pages — improves carousels in SERPs.
 */
export function buildItemListSchema(items: { url: string; name: string; image?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: item.url,
      name: item.name,
      ...(item.image && { image: item.image }),
    })),
  };
}

/**
 * Local/online business schema for brand authority signals.
 */
export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineBusiness",
    name: "Supet",
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    description: "Gomas 100% naturais para a saúde do seu pet. Acabam com coceiras, alergias e queda de pelo em até 30 dias.",
    priceRange: "$$",
    areaServed: { "@type": "Country", name: "BR" },
    brand: { "@type": "Brand", name: "Supet" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Portuguese",
    },
  };
}
