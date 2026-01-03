"use client";

import { useState, useEffect } from "react";
import { createBrandAction, updateBrandAction } from "@/actions/brand-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, Save, Link as LinkIcon, Tag, Globe } from "lucide-react";
import { InputField } from "@/components/ui/Forms/InputField";
import { Brand } from "@/types/database";

interface BrandFormProps {
    brand?: Brand;
}

export default function BrandForm({ brand }: BrandFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(brand?.name || "");
    const [slug, setSlug] = useState(brand?.slug || "");
    const [manualSlug, setManualSlug] = useState(!!brand);

    // Auto-generate slug from name unless manually edited
    useEffect(() => {
        if (!manualSlug) {
            const generatedSlug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(generatedSlug);
        }
    }, [name, manualSlug]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value);
        setManualSlug(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            let result;

            if (brand) {
                result = await updateBrandAction(brand.id, null, formData);
            } else {
                result = await createBrandAction(null, formData);
            }

            if (result.success) {
                toast.success(brand ? "Brand updated successfully" : "Brand created successfully");
                router.push("/dashboard/brands");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-lg mx-auto">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Brand Name *
                    </label>
                    <InputField
                        icon={<Tag size={18} className="text-[#511624]" />}
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Chanel"
                        required
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    />
                </div>

                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <LinkIcon size={14} className="text-gray-400" />
                        Brand Slug *
                    </label>
                    <InputField
                        icon={<Globe size={18} className="text-white" />}
                        type="text"
                        name="slug"
                        value={slug}
                        onChange={handleSlugChange}
                        placeholder="brand-slug"
                        required
                        disabled
                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all font-mono text-xs"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">The URL-friendly version of the name. Must be unique.</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Brand Logo {brand ? "(Leave empty to keep current)" : "*"}
                    </label>
                    <div className="group relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer">
                        <input
                            type="file"
                            name="logo"
                            id="logo-upload"
                            accept=".svg,.png,.jpg,.jpeg,.webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required={!brand}
                        />
                        <div className="space-y-2 pointer-events-none">
                            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-secondary/20 group-hover:text-secondary transition-colors">
                                <Upload size={24} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 block">
                                {brand ? "Click to change logo" : "Click or drag logo here"}
                            </span>
                            <span className="text-xs text-gray-400 block">SVG, PNG, JPG (max 2MB)</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#511624] text-white rounded-xl hover:bg-[#511624]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-[#511624]/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {brand ? "Update Brand" : "Save Brand"}
                    </button>
                </div>
            </div>
        </form>
    );
}


