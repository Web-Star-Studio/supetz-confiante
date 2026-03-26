export interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  pricePerUnit: string;
  quantity: number;
  badge?: string;
  highlighted?: boolean;
  category?: "combo" | "extra" | "acessorio" | "higiene" | "brinquedo" | "alimentacao";
  image?: string;
  description?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  petName: string;
  tutorName: string;
  quote: string;
  rating: number;
  image: string;
}

export interface BlogPostPreview {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  coverImage: string;
  publishedAt: string;
}

export interface BlogPost extends BlogPostPreview {
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  readTime: number; // in minutes
  content: BlogPostContent[];
  relatedPosts?: string[]; // IDs of related posts
}

export interface BlogPostContent {
  type: "paragraph" | "heading" | "list" | "quote" | "image";
  content?: string;
  items?: string[]; // for list type
  alt?: string; // for image type
  level?: 2 | 3; // for heading type (h2 or h3)
}

export interface SocialLink {
  id: string;
  platform: "facebook" | "instagram" | "youtube" | "tiktok";
  url: string;
  ariaLabel: string;
}
