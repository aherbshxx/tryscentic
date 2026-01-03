import BrandForm from "@/components/admin/BrandForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddBrandPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/brands"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-200" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif">Add New Brand</h1>
                    <p className="text-gray-200">Create a new brand and upload its logo</p>
                </div>
            </div>

            <BrandForm />
        </div>
    );
}
