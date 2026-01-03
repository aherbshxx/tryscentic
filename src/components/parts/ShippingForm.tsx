"use client";

import { Building2, Globe, Home, Phone, User } from "lucide-react";
import { InputField } from "../ui/Forms/InputField";
import { useState } from "react";
import { toast } from "sonner";

interface ShippingData {
  fullName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

interface ShippingFormProps {
  onNext: (data: ShippingData) => void;
  initialData?: ShippingData;
}

export default function ShippingForm({ onNext, initialData }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingData>(initialData || {
    fullName: "",
    address: "",
    city: "",
    country: "Egypt",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.fullName || !formData.address || !formData.city || !formData.phone) {
      toast("Please fill in all fields.");
      return;
    }
    onNext(formData);
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="flex flex-col relative">
          <label className="text-sm text-gray-400 mb-1" htmlFor="fullName">
            Full Name
          </label>
          <InputField
            id="fullName"
            icon={<User />}
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>


        <div className="flex flex-col relative">
          <label className="text-sm text-gray-400 mb-1" htmlFor="address">
            Address
          </label>
          <InputField
            id="address"
            icon={<Home />}
            type="text"
            placeholder="123 Perfume Lane"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col relative">
            <label className="text-sm text-gray-400 mb-1" htmlFor="city">
              City
            </label>
            <InputField
              id="city"
              icon={<Building2 />}
              type="text"
              placeholder="Fragranceville"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col relative">
            <label className="text-sm text-gray-400 mb-1" htmlFor="country">
              Country
            </label>
            <InputField
              id="country"
              icon={<Globe className="text-white" />}
              type="text"
              placeholder="Egypt"
              value={formData.country}
              disabled
              readOnly
            />
          </div>
        </div>


        <div className="flex flex-col relative">
          <label className="text-sm text-gray-400 mb-1" htmlFor="phone">
            Phone Number
          </label>
          <InputField
            id="phone"
            icon={<Phone />}
            type="text"
            placeholder="+20 10 2880 6961"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="bg-secondary px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </>
  );
}

