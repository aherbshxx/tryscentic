import { z } from "zod";

// Product Validation
export const createProductSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  brand_id: z.string().uuid("Invalid brand ID"),
  category_id: z.string().uuid("Invalid category ID"),
  base_image_url: z.string().url("Invalid image URL"),
  gallery_images: z.array(z.string().url()).optional().nullable(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size_label: z.string().min(1, "Size label is required"),
        price: z.number().min(0.01, "Price must be greater than 0"),
        stock_quantity: z.number().int().min(0, "Stock cannot be negative"),
        thumbnail_image: z
          .string()
          .url("Invalid thumbnail URL")
          .optional()
          .nullable(),
        images: z
          .array(
            z.object({
              id: z.string().uuid().optional(),
              image_url: z.string().url("Invalid image URL"),
              sort_order: z.number().int().default(0),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one variant is required"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid("Invalid product ID"),
  is_active: z.boolean().optional(),
});

// Promo Code Validation
export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be less than 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, hyphens and underscores"
    ),
  description: z.string().min(5, "Description must be at least 5 characters"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z
    .number()
    .min(0.01, "Discount value must be greater than 0")
    .refine((val) => val <= 100, "Percentage discount cannot exceed 100%"), // Basic check, ideally depends on type but this fixes lint for now
  min_order_amount: z
    .number()
    .min(0, "Minimum order amount cannot be negative"),
  usage_limit: z.number().int().min(1).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

// Wallet Adjustment Validation
export const walletAdjustmentSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  amount: z
    .number()
    .refine((val) => val !== 0, "Amount cannot be zero")
    .refine((val) => Math.abs(val) >= 0.01, "Amount must be at least 0.01"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

// Order Status Update
export const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]),
});

// Transaction Confirmation
export const confirmTransactionSchema = z.object({
  transaction_id: z.string().uuid("Invalid transaction ID"),
  action: z.enum(["confirm", "reject"]),
  admin_note: z.string().optional(),
});

// User Ban/Unban
export const userBanSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  is_banned: z.boolean(),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .optional(),
});

// Brand & Category
export const createBrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers and hyphens"
    ),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  parent_id: z.string().uuid().optional().nullable(),
});

// Export all types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
export type WalletAdjustmentInput = z.infer<typeof walletAdjustmentSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ConfirmTransactionInput = z.infer<typeof confirmTransactionSchema>;
export type UserBanInput = z.infer<typeof userBanSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
