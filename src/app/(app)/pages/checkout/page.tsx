"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ShippingForm from "@/components/parts/ShippingForm";
import PaymentForm, { PaymentMethod } from "@/components/parts/PaymentForm";
import ReviewOrder from "@/components/parts/ReviewOrder";
import OrderSummary from "@/components/parts/OrderSummary";
import { useCart } from "@/lib/context/CartContext";
import { createOrder } from "@/actions/order-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";

type Step = "shipping" | "payment" | "review";

interface ShippingData {
  fullName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState<Step>("shipping");
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("apple_pay");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const { cartItems, subtotal, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();
        if (profile) setWalletBalance(profile.wallet_balance);
      }
    };
    fetchBalance();
  }, [supabase]);

  // ارتفاع الهيدر الافتراضي
  const HEADER_HEIGHT_CLASS = "mt-20"; // mt-20 ≈ 80px

  const handleShippingNext = (data: ShippingData) => {
    setShippingData(data);
    setCurrentStep("payment");
  };

  const handlePaymentNext = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setCurrentStep("review");
  };

  const handlePlaceOrder = async () => {
    if (!shippingData) return;

    setIsSubmitting(true);
    try {
      const orderItems = cartItems.map(item => ({
        variant_id: item.id,
        product_name_snapshot: item.name,
        quantity: item.quantity,
        unit_price_at_purchase: item.price,
      }));

      const res = await createOrder({
        shipping_info: shippingData,
        total_amount: subtotal + 5.0, // shipping cost
        items: orderItems,
        payment_method: paymentMethod,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Order placed successfully!");
        clearCart();
        router.push("/pages/user-dashboard");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "shipping": return "33.33%";
      case "payment": return "66.66%";
      case "review": return "100%";
      default: return "0%";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary text-white">
      {/* Main content */}
      <main className={`flex-1 px-4 lg:px-10 ${HEADER_HEIGHT_CLASS}`}>
        <div className="max-w-7xl mx-auto relative">

          {/* رابط Back to Shop */}
          <Link
            href="/pages/shop"
            className="inline-block w-full text-sm text-white/70 hover:text-white transition-colors border-b border-white/20 pb-1 mb-4 text-right"
          >
            Back to Shop
          </Link>

          {/* الصفحة الفعلية */}
          <div className="pt-10 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className={`lg:col-span-2 text-white`}>

                <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                <div className="mb-10 w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`font-semibold transition-colors ${currentStep === "shipping" ? "text-secondary" : "text-white"}`}>Shipping Information</span>
                    <span className={`font-semibold transition-colors ${currentStep === "payment" ? "text-secondary" : (currentStep === "shipping" ? "text-white/50" : "text-white")}`}>Payment</span>
                    <span className={`font-semibold transition-colors ${currentStep === "review" ? "text-secondary" : "text-white/50"}`}>Review Order</span>
                  </div>

                  <div className="w-full h-2 relative rounded overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-secondary transition-all duration-500 ease-in-out"
                      style={{ width: getStepProgress() }}
                    ></div>
                  </div>
                </div>

                {currentStep === "shipping" && (
                  <ShippingForm
                    onNext={handleShippingNext}
                    initialData={shippingData || undefined}
                  />
                )}

                {currentStep === "payment" && (
                  <PaymentForm
                    onNext={handlePaymentNext}
                    onBack={() => setCurrentStep("shipping")}
                    initialMethod={paymentMethod}
                    walletBalance={walletBalance}
                  />
                )}

                {currentStep === "review" && shippingData && (
                  <ReviewOrder
                    shippingData={shippingData}
                    paymentMethod={paymentMethod}
                    onBack={() => setCurrentStep("payment")}
                    onPlaceOrder={handlePlaceOrder}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </div>

            <OrderSummary />
          </div>
        </div>
      </main>
    </div>
  );
}

