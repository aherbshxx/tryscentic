"use client";

import { CreditCard, Wallet, Smartphone, Landmark } from "lucide-react";
import { useState } from "react";

export type PaymentMethod = "apple_pay" | "insta_pay" | "vodafone_cash" | "wallet";

interface PaymentFormProps {
    onNext: (method: PaymentMethod) => void;
    onBack: () => void;
    initialMethod?: PaymentMethod;
    walletBalance: number;
}

export default function PaymentForm({ onNext, onBack, initialMethod, walletBalance }: PaymentFormProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(initialMethod || "apple_pay");

    const methods = [
        {
            id: "apple_pay",
            name: "Apple Pay",
            icon: <Smartphone className="text-[#000000]" />,
            description: "Pay securely with Apple Pay",
        },
        {
            id: "insta_pay",
            name: "Insta Pay",
            icon: <Landmark className="text-[#1a73e8]" />,
            description: "Transfer via InstaPay",
        },
        {
            id: "vodafone_cash",
            name: "Vodafone Cash",
            icon: <PhoneWrapper />,
            description: "Pay with Vodafone Cash",
        },
        {
            id: "wallet",
            name: "Scentic Wallet",
            icon: <Wallet className="text-[#511624]" />,
            description: `Available balance: LE ${walletBalance.toFixed(2)}`,
        },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>

            <div className="grid gap-4">
                {methods.map((method) => (
                    <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === method.id
                                ? "border-secondary bg-secondary/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                    >
                        <div className={`p-3 rounded-lg ${selectedMethod === method.id ? "bg-secondary text-white" : "bg-white/10 text-white/70"}`}>
                            {method.icon}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-white">{method.name}</p>
                            <p className="text-sm text-white/60">{method.description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? "border-secondary" : "border-white/20"
                            }`}>
                            {selectedMethod === method.id && <div className="w-3 h-3 rounded-full bg-secondary" />}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="text-white/70 hover:text-white font-medium transition-colors"
                >
                    Back to Shipping
                </button>
                <button
                    onClick={() => onNext(selectedMethod)}
                    className="bg-secondary px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity"
                >
                    Review Order
                </button>
            </div>
        </div>
    );
}

function PhoneWrapper() {
    return (
        <div className="relative">
            <Smartphone className="text-[#E60000]" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <div className="w-1.5 h-1.5 bg-[#E60000] rounded-full" />
            </div>
        </div>
    );
}
