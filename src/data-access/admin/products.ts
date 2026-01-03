"use server";

import { verifyAdmin, revalidateAdminPaths } from "./auth";
import type {
  Product,
  ProductVariant,
  Brand,
  Category,
} from "@/types/database";
import {
  createProductSchema,
  updateProductSchema,
  createBrandSchema,
  createCategorySchema,
} from "@/lib/validation/admin-schemas";

/**
 * Get all products with variants
 */
export async function getProducts(params?: {
  search?: string;
  page?: number;
  limit?: number;
  category_id?: string;
  brand_id?: string;
  is_active?: boolean;
}) {
  const { supabase } = await verifyAdmin();

  const {
    search = "",
    page = 1,
    limit = 20,
    category_id,
    brand_id,
    is_active,
  } = params || {};
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("products").select(
    `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*, images:variant_images(*))
    `,
    { count: "exact" }
  );

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  if (brand_id) {
    query = query.eq("brand_id", brand_id);
  }

  if (is_active !== undefined) {
    query = query.eq("is_active", is_active);
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
 * Create a new product with variants
 */
export async function createProduct(input: {
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
    thumbnail_image?: string | null;
    images?: { image_url: string; sort_order: number }[];
  }[];
}) {
  const { supabase } = await verifyAdmin();

  const validatedInput = createProductSchema.parse(input);

  // 1. Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      title: validatedInput.title,
      description: validatedInput.description,
      brand_id: validatedInput.brand_id,
      category_id: validatedInput.category_id,
      base_image_url: validatedInput.base_image_url,
      gallery_images: validatedInput.gallery_images || [],
      is_active: true,
    })
    .select()
    .single();

  if (productError) {
    throw new Error(`Failed to create product: ${productError.message}`);
  }

  // 2. Create variants and their images
  for (const variantData of validatedInput.variants) {
    const { images, ...v } = variantData;
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        ...v,
      })
      .select()
      .single();

    if (variantError)
      throw new Error(`Failed to create variant: ${variantError.message}`);

    if (images && images.length > 0) {
      const imagesToInsert = images.map((img) => ({
        variant_id: variant.id,
        image_url: img.image_url,
        sort_order: img.sort_order,
      }));
      const { error: imagesError } = await supabase
        .from("variant_images")
        .insert(imagesToInsert);
      if (imagesError)
        throw new Error(
          `Failed to create variant images: ${imagesError.message}`
        );
    }
  }

  revalidateAdminPaths();

  return product;
}

/**
 * Update product and/or variants
 */
export async function updateProduct(input: {
  id: string;
  title?: string;
  description?: string;
  brand_id?: string;
  category_id?: string;
  base_image_url?: string;
  gallery_images?: string[];
  variants?: {
    id?: string;
    size_label: string;
    price: number;
    stock_quantity: number;
    thumbnail_image?: string | null;
    images?: { id?: string; image_url: string; sort_order: number }[];
  }[];
  is_active?: boolean;
}) {
  const { supabase } = await verifyAdmin();

  // Validate input
  const validatedInput = updateProductSchema.parse(input);
  const { id, variants, ...updates } = validatedInput;

  // 1. Update Product Base Details
  if (Object.keys(updates).length > 0) {
    const { error: productError } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id);

    if (productError) {
      throw new Error(`Failed to update product: ${productError.message}`);
    }
  }

  // 2. Handle Variants
  if (variants) {
    // Identify variants to keep (IDs present in input)
    const variantIdsToKeep = variants
      .map((v) => v.id)
      .filter((vId): vId is string => !!vId);

    // Delete variants NOT in the input list
    if (variantIdsToKeep.length > 0) {
      const { error: deleteVariantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id)
        .not("id", "in", `(${variantIdsToKeep.join(",")})`);
      if (deleteVariantsError)
        throw new Error(
          `Failed to delete old variants: ${deleteVariantsError.message}`
        );
    } else {
      // If no IDs to keep, it implies all existing variants should be deleted
      const { error: deleteAllVariantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);
      if (deleteAllVariantsError)
        throw new Error(
          `Failed to delete all variants: ${deleteAllVariantsError.message}`
        );
    }

    // Upsert each variant
    for (const variantData of variants) {
      const { id: vId, images, ...vFields } = variantData;
      let currentVariantId: string;

      if (vId) {
        // Update existing variant
        const { error: updateVariantError } = await supabase
          .from("product_variants")
          .update(vFields)
          .eq("id", vId);
        if (updateVariantError)
          throw new Error(
            `Failed to update variant ${vId}: ${updateVariantError.message}`
          );
        currentVariantId = vId;
      } else {
        // Insert new variant
        const { data: newVariant, error: insertVariantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: id,
            ...vFields,
          })
          .select("id")
          .single();
        if (insertVariantError)
          throw new Error(
            `Failed to insert new variant: ${insertVariantError.message}`
          );
        currentVariantId = newVariant.id;
      }

      // Handle variant images for the current variant
      if (images) {
        const imageIdsToKeep = images
          .map((img) => img.id)
          .filter((imgId): imgId is string => !!imgId);

        // Delete images not in the input list for this variant
        if (imageIdsToKeep.length > 0) {
          const { error: deleteImagesError } = await supabase
            .from("variant_images")
            .delete()
            .eq("variant_id", currentVariantId)
            .not("id", "in", `(${imageIdsToKeep.join(",")})`);
          if (deleteImagesError)
            throw new Error(
              `Failed to delete old variant images for variant ${currentVariantId}: ${deleteImagesError.message}`
            );
        } else {
          // If no image IDs to keep, delete all images for this variant
          const { error: deleteAllImagesError } = await supabase
            .from("variant_images")
            .delete()
            .eq("variant_id", currentVariantId);
          if (deleteAllImagesError)
            throw new Error(
              `Failed to delete all variant images for variant ${currentVariantId}: ${deleteAllImagesError.message}`
            );
        }

        // Upsert each image
        for (const img of images) {
          if (img.id) {
            // Update existing image
            const { error: updateImageError } = await supabase
              .from("variant_images")
              .update({
                image_url: img.image_url,
                sort_order: img.sort_order,
              })
              .eq("id", img.id);
            if (updateImageError)
              throw new Error(
                `Failed to update image ${img.id}: ${updateImageError.message}`
              );
          } else {
            // Insert new image
            const { error: insertImageError } = await supabase
              .from("variant_images")
              .insert({
                variant_id: currentVariantId,
                image_url: img.image_url,
                sort_order: img.sort_order,
              });
            if (insertImageError)
              throw new Error(
                `Failed to insert new image for variant ${currentVariantId}: ${insertImageError.message}`
              );
          }
        }
      } else {
        // If images array is explicitly null/undefined, delete all images for this variant
        const { error: deleteImagesError } = await supabase
          .from("variant_images")
          .delete()
          .eq("variant_id", currentVariantId);
        if (deleteImagesError)
          throw new Error(
            `Failed to delete variant images for variant ${currentVariantId}: ${deleteImagesError.message}`
          );
      }
    }
  }

  revalidateAdminPaths();

  return { success: true };
}

/**
 * Delete product (cascades to variants)
 */
export async function deleteProduct(productId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  revalidateAdminPaths();

  return { success: true };
}

/**
 * Update product variant stock
 */
export async function updateVariantStock(variantId: string, quantity: number) {
  const { supabase } = await verifyAdmin();

  if (quantity < 0) {
    throw new Error("Stock quantity cannot be negative");
  }

  const { error } = await supabase
    .from("product_variants")
    .update({ stock_quantity: quantity })
    .eq("id", variantId);

  if (error) {
    throw new Error(`Failed to update stock: ${error.message}`);
  }

  revalidateAdminPaths();

  return { success: true };
}

/**
 * Get low stock products (stock < 10)
 */
export async function getLowStockProducts() {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `
      *,
      product:products(*)
    `
    )
    .lt("stock_quantity", 10)
    .order("stock_quantity", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch low stock products: ${error.message}`);
  }

  return data;
}

/**
 * Get all brands
 */
export async function getBrands() {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  return data as Brand[];
}

/**
 * Get brand by ID
 */
export async function getBrandById(brandId: string) {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch brand: ${error.message}`);
  }

  return data as Brand;
}

/**
 * Create brand
 */
export async function createBrand(input: { name: string; slug: string }) {
  const { supabase } = await verifyAdmin();

  const validatedInput = createBrandSchema.parse(input);

  const { data, error } = await supabase
    .from("brands")
    .insert(validatedInput)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }

  revalidateAdminPaths();

  return data;
}

/**
 * Update brand
 */
export async function updateBrand(input: {
  id: string;
  name: string;
  slug: string;
}) {
  const { supabase } = await verifyAdmin();

  // Validate using schema (we can reuse createBrandSchema for individual fields if needed)
  const validatedInput = createBrandSchema.parse({
    name: input.name,
    slug: input.slug,
  });

  const { data, error } = await supabase
    .from("brands")
    .update(validatedInput)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }

  revalidateAdminPaths();

  return data;
}

/**
 * Delete brand
 */
export async function deleteBrand(brandId: string) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase.from("brands").delete().eq("id", brandId);

  if (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }

  revalidateAdminPaths();

  return { success: true };
}

/**
 * Get all categories
 */
export async function getCategories() {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data as Category[];
}

/**
 * Create category
 */
export async function createCategory(input: {
  name: string;
  parent_id?: string | null;
}) {
  const { supabase } = await verifyAdmin();

  const validatedInput = createCategorySchema.parse(input);

  const { data, error } = await supabase
    .from("categories")
    .insert(validatedInput)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  revalidateAdminPaths();

  return data;
}

/**
 * Get product by ID (admin)
 */
export async function getProductById(productId: string) {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq("id", productId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data as Product;
}

/**
 * Toggle product active status
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
) {
  const { supabase } = await verifyAdmin();

  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }

  await revalidateAdminPaths();

  return { success: true };
}
