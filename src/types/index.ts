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

export interface SocialLink {
  id: string;
  platform: "facebook" | "instagram" | "youtube" | "tiktok";
  url: string;
  ariaLabel: string;
}
