"use server";

import { createClient } from "@/lib/utils/supabase/server";
import type { Product } from "@/types/database";

/**
 * Get all active products for customers (public-facing)
 */
export async function getPublicProducts(params?: {
  search?: string;
  page?: number;
  limit?: number;
  category_id?: string;
  brand_id?: string;
}) {
  const supabase = await createClient();

  const {
    search = "",
    page = 1,
    limit = 12,
    category_id,
    brand_id,
  } = params || {};
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(
      `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*, images:variant_images(*))
    `,
      { count: "exact" }
    )
    .eq("is_active", true); // Only active products

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  if (brand_id) {
    query = query.eq("brand_id", brand_id);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return {
    products: data as Product[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get single product by ID (public)
 */
export async function getProductById(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*, images:variant_images(*))
    `
    )
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data as Product;
}

/**
 * Get all brands (public)
 */
export async function getPublicBrands() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  return data;
}

/**
 * Get all categories (public)
 */
export async function getPublicCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data;
}
