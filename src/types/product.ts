export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  image: string;
  category?: string;
  inStock?: boolean;
}

export interface ProductSizeOption {
  label: string;
  price: number;
  images?: string[];
  thumbnail?: string | null;
}

export interface ProductReview {
  author: string;
  rating: number;
  content: string;
  date?: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  type: string;
  baseDescription: string;
  baseImage: string;
  images: string[];
  sizes: ProductSizeOption[];
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  category?: string;
  brand?: string;
  inStock?: boolean;
}

export type ProductCatalog = Record<string, ProductDetail>;
