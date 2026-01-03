import Link from "next/link";
import Image from "next/image";
import { getBrands } from "@/data-access/admin/products";
import { readdir } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { Plus, Edit2 } from "lucide-react";
import DeleteBrandButton from "@/components/admin/DeleteBrandButton";

export default async function BrandsPage() {
    const brands = await getBrands();

    // Get list of existing brand images
    let brandImages: string[] = [];
    try {
        const brandsDir = join(cwd(), "public", "assets", "images", "brands");
        brandImages = await readdir(brandsDir);
    } catch (error) {
        // Directory might not exist yet
        brandImages = [];
    }

    // Helper to find image for a brand
    const getBrandImage = (brandName: string) => {
        const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
        const imageFile = brandImages.find(file => {
            const ext = '.' + file.split('.').pop()?.toLowerCase();
            const name = file.substring(0, file.lastIndexOf('.')); // Remove extension
            return name === brandName && validExtensions.includes(ext);
        });
        return imageFile ? `/assets/images/brands/${imageFile}` : null;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-serif">Brands</h1>
                    <p className="text-gray-200 mt-1">Manage product brands</p>
                </div>
                <Link
                    href="/dashboard/brands/add"
                    className="flex items-center gap-2 px-4 py-2 bg-[#511624] text-white rounded-lg hover:bg-[#511624]/90 transition-colors font-medium shadow-sm"
                >
                    <Plus size={20} />
                    Add Brand
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Brand</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4">Image Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {brands.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No brands found. Add your first brand to get started.
                                    </td>
                                </tr>
                            ) : (
                                brands.map((brand) => {
                                    const imageUrl = getBrandImage(brand.name);

                                    return (
                                        <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                {imageUrl ? (
                                                    <div className="relative w-10 h-10 border border-gray-200 rounded-md overflow-hidden bg-white p-1">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={brand.name}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">
                                                        No Img
                                                    </div>
                                                )}
                                                {brand.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{brand.slug}</td>
                                            <td className="px-6 py-4">
                                                {imageUrl ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Image Found
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Missing Image
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/brands/${brand.id}/edit`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs font-semibold"
                                                    >
                                                        <Edit2 size={14} />
                                                        Edit
                                                    </Link>
                                                    <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
