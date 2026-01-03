// Database Types based on SUPABASE_SETUP.sql
// Auto-generated type definitions for type-safety

export type UserRole = "admin" | "customer";
export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
export type TransactionType = "deposit" | "purchase" | "refund";
export type TransactionStatus = "pending" | "confirmed" | "rejected";

// Core Database Tables
export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface VariantImage {
  id: string;
  variant_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  price: number;
  stock_quantity: number;
  thumbnail_image: string | null;
  created_at: string;
  // Joined data
  images?: VariantImage[];
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  role: UserRole;
  created_at: string;
  is_banned?: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  base_image_url: string | null;
  gallery_images?: string[] | null; // Keep for backward compat during migration
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  // Joined data
  brand?: Brand;
  category?: Category;
  variants?: ProductVariant[];
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount: number;
  shipping_info: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  user?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_name_snapshot: string | null;
  quantity: number;
  unit_price_at_purchase: number;
  created_at: string;
  // Joined data
  variant?: ProductVariant;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  status?: TransactionStatus;
  proof_url?: string | null;
  created_at: string;
  // Joined data
  user?: Profile;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  times_used: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GiftCode {
  code: string;
  amount: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string | null;
  rating: number;
  content: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

// Wallet Audit Log (to be added to schema)
export interface WalletLog {
  id: string;
  user_id: string;
  admin_id: string;
  amount_change: number;
  previous_balance: number;
  new_balance: number;
  reason: string;
  created_at: string;
}

// Admin Dashboard Stats
export interface DashboardStats {
  // Revenue & Orders
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  todayOrders: number;

  // Users
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersWeek: number;

  // Products & Inventory
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalVariants: number;

  // Transactions & Wallet
  pendingTransactions: number;
  confirmedTransactions: number;
  rejectedTransactions: number;
  totalWalletBalance: number;
  pendingDeposits: number;

  // Promo & Gift Codes
  activePromoCodes: number;
  totalPromoCodes: number;
  activeGiftCodes: number;
  usedGiftCodes: number;

  // Reviews
  totalReviews: number;
  avgRating: number;

  // Brands & Categories
  totalBrands: number;
  totalCategories: number;
}

// Form Types
export interface CreateProductInput {
  title: string;
  description: string;
  brand_id: string;
  category_id: string;
  base_image_url: string;
  gallery_images?: string[];
  variants: {
    size_label: string;
    price: number;
    stock_quantity: number;
  }[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
  is_active?: boolean;
}

export interface CreatePromoCodeInput {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  usage_limit?: number;
  expires_at?: string;
}

export interface WalletAdjustment {
  user_id: string;
  amount: number;
  reason: string;
}
