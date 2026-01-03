"use client";

import { MapPin, CreditCard, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import Image from "next/image";

interface ReviewOrderProps {
    shippingData: {
        fullName: string;
        address: string;
        city: string;
        country: string;
        phone: string;
    };
    paymentMethod: string;
    onBack: () => void;
    onPlaceOrder: () => void;
    isSubmitting: boolean;
}

export default function ReviewOrder({ shippingData, paymentMethod, onBack, onPlaceOrder, isSubmitting }: ReviewOrderProps) {
    const { cartItems, subtotal } = useCart();
    const shipping = 5.0;
    const grandTotal = subtotal + shipping;

    const getPaymentName = (method: string) => {
        switch (method) {
            case "apple_pay": return "Apple Pay";
            case "insta_pay": return "Insta Pay";
            case "vodafone_cash": return "Vodafone Cash";
            case "wallet": return "Scentic Wallet";
            default: return method;
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold">Review Order</h2>

            <div className="grid gap-6">
                {/* Shipping Summary */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4 text-secondary">
                        <MapPin size={20} />
                        <h3 className="font-semibold text-white">Shipping Address</h3>
                    </div>
                    <div className="text-white/80 space-y-1">
                        <p className="font-medium text-white">{shippingData.fullName}</p>
                        <p>{shippingData.address}</p>
                        <p>{shippingData.city}, {shippingData.country}</p>
                        <p>{shippingData.phone}</p>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4 text-secondary">
                        <CreditCard size={20} />
                        <h3 className="font-semibold text-white">Payment Method</h3>
                    </div>
                    <p className="text-white/80 font-medium">{getPaymentName(paymentMethod)}</p>
                </div>

                {/* Items Summary */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-2 mb-4 text-secondary">
                        <ShoppingBag size={20} />
                        <h3 className="font-semibold text-white">Order Items</h3>
                    </div>
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                                    <Image src={item.image} alt={item.name} width={40} height={40} className="object-contain" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{item.name}</p>
                                    <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-white">LE {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="text-white/70 hover:text-white font-medium transition-colors disabled:opacity-50"
                >
                    Back to Payment
                </button>
                <button
                    onClick={onPlaceOrder}
                    disabled={isSubmitting}
                    className="bg-secondary px-8 py-4 text-white font-bold rounded-lg hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Placing Order...
                        </>
                    ) : (
                        "Place Order"
                    )}
                </button>
            </div>
        </div>
    );
}
