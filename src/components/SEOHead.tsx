import { Helmet } from "react-helmet-async";

const BASE_URL = "https://supetz-playful-trust.lovable.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/og-image.jpg`;
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
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export default function SEOHead({
  title,
  description,
  path = "/",
  image,
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
  const ogImage = image || DEFAULT_OG_IMAGE;

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
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
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
      <meta name="twitter:image" content={ogImage} />

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

export { BASE_URL, DEFAULT_IMAGE, DEFAULT_OG_IMAGE, SITE_NAME };

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
  sku?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || DEFAULT_IMAGE,
    sku: product.sku || "SUPET-GOMAS",
    brand: { "@type": "Brand", name: "Supet" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/shop`,
      priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      seller: { "@type": "Organization", name: "Supet" },
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

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
    image: article.image || DEFAULT_OG_IMAGE,
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
    ...(article.readTime && { timeRequired: `PT${article.readTime}M` }),
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable='true']"],
    },
  };
}

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
    sameAs: [],
  };
}

/**
 * VideoObject schema for video testimonials — critical for Google Video results.
 */
export function buildVideoObjectSchema(video: {
  name: string;
  description: string;
  thumbnailUrl?: string;
  contentUrl: string;
  uploadDate?: string;
  duration?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl || DEFAULT_OG_IMAGE,
    contentUrl: video.contentUrl,
    uploadDate: video.uploadDate || "2025-01-01",
    ...(video.duration && { duration: video.duration }),
    inLanguage: "pt-BR",
  };
}

/**
 * CollectionPage schema for product listing pages.
 */
export function buildCollectionPageSchema(collection: {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: collection.url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: collection.numberOfItems,
    },
  };
}

/**
 * Educational content schema for Ciência page.
 */
export function buildEducationalSchema(content: {
  name: string;
  description: string;
  url: string;
  about: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.name,
    description: content.description,
    url: content.url,
    educationalLevel: "general",
    about: {
      "@type": "Thing",
      name: content.about,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", "[data-speakable='true']"],
    },
    inLanguage: "pt-BR",
  };
}
