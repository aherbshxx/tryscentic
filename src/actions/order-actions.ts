"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrder(orderData: {
  shipping_info: any;
  total_amount: number;
  items: {
    variant_id: string;
    product_name_snapshot: string;
    quantity: number;
    unit_price_at_purchase: number;
  }[];
  payment_method: string;
}) {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "You must be logged in to place an order." };
  }

  // 2. Insert Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: orderData.total_amount,
      shipping_info: orderData.shipping_info,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order creation error:", orderError);
    return { error: "Failed to create order." };
  }

  // 3. Insert Order Items
  const orderItems = orderData.items.map((item) => ({
    order_id: order.id,
    variant_id: item.variant_id,
    product_name_snapshot: item.product_name_snapshot,
    quantity: item.quantity,
    unit_price_at_purchase: item.unit_price_at_purchase,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Order items creation error:", itemsError);
    // Note: In a production app, you might want to handle this partial failure (e.g., delete the order)
    return { error: "Failed to create order items." };
  }

  // 4. Handle Wallet Payment if selected
  if (orderData.payment_method === "wallet") {
    const { data: success, error: walletError } = await supabase.rpc(
      "pay_with_wallet",
      {
        order_total: orderData.total_amount,
        order_id_input: order.id,
      }
    );

    if (walletError || !success) {
      console.error("Wallet payment error:", walletError);
      return { error: walletError?.message || "Insufficient wallet balance." };
    }
  }

  revalidatePath("/pages/user-dashboard");
  revalidatePath("/pages/checkout");

  return { success: true, orderId: order.id };
}
