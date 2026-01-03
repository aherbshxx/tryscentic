import BrandForm from "@/components/admin/BrandForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBrandById } from "@/data-access/admin/products";
import { notFound } from "next/navigation";

interface EditBrandPageProps {
    params: {
        id: string;
    };
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
    const { id } = await params;

    let brand;
    try {
        brand = await getBrandById(id);
    } catch (error) {
        return notFound();
    }

    if (!brand) return notFound();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/brands"
                    className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-200" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif">Edit Brand</h1>
                    <p className="text-gray-200">Update brand details and logo</p>
                </div>
            </div>

            <BrandForm brand={brand} />
        </div>
    );
}
