'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct, getBrands, getCategories, createBrand, createCategory } from '@/data-access/admin/products';
import { uploadImage, uploadImages } from '@/lib/utils/upload-image';
import { Brand, Category, Product } from '@/types/database';
import { toast } from 'sonner';
import { Plus, X, Upload, ArrowLeft, ImageIcon, Loader2, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { InputField } from '../ui/Forms/InputField';

interface VariantFormData {
    id?: string;
    size_label: string;
    price: number;
    stock_quantity: number;
    thumbnail_image: string | null;
    images: {
        id?: string;
        image_url: string;
        sort_order: number;
    }[];
}

interface ProductFormData {
    title: string;
    description: string;
    brand_id: string;
    category_id: string;
    base_image_url: string;
    variants: VariantFormData[];
}

interface ProductFormProps {
    initialData?: Product;
    mode?: 'create' | 'edit';
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export default function ProductForm({ initialData, mode = 'create' }: ProductFormProps) {
    const router = useRouter();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showNewBrand, setShowNewBrand] = useState(false);
    const [showNewCategory, setShowNewCategory] = useState(false);

    // Initialize form data
    const [formData, setFormData] = useState<ProductFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        brand_id: initialData?.brand_id || '',
        category_id: initialData?.category_id || '',
        base_image_url: initialData?.base_image_url || '',
        variants: initialData?.variants?.map(v => ({
            id: v.id, // Keep ID for updates
            size_label: v.size_label,
            price: v.price,
            stock_quantity: v.stock_quantity,
            thumbnail_image: v.thumbnail_image || null,
            images: v.images?.map(img => ({
                id: img.id,
                image_url: img.image_url,
                sort_order: img.sort_order
            })) || []
        })) || [
                { size_label: '', price: 0, stock_quantity: 0, thumbnail_image: null, images: [] }
            ]
    });

    const [newBrand, setNewBrand] = useState({ name: '', slug: '' });
    const [newCategory, setNewCategory] = useState({ name: '', parent_id: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [brandsData, categoriesData] = await Promise.all([
                getBrands(),
                getCategories(),
            ]);
            setBrands(brandsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load brands and categories');
        }
    };

    const handleCreateBrand = async () => {
        try {
            const slug = newBrand.slug || newBrand.name.toLowerCase().replace(/\s+/g, '-');
            const brand = await createBrand({ name: newBrand.name, slug });
            setBrands([...brands, brand]);
            setFormData({ ...formData, brand_id: brand.id });
            setNewBrand({ name: '', slug: '' });
            setShowNewBrand(false);
            toast.success('Brand created successfully');
        } catch (error) {
            console.error('Failed to create brand:', error);
            toast.error('Failed to create brand');
        }
    };

    const handleCreateCategory = async () => {
        try {
            const category = await createCategory(newCategory);
            setCategories([...categories, category]);
            setFormData({ ...formData, category_id: category.id });
            setNewCategory({ name: '', parent_id: null });
            setShowNewCategory(false);
            toast.success('Category created successfully');
        } catch (error) {
            console.error('Failed to create category:', error);
            toast.error('Failed to create category');
        }
    };

    // Variant Management
    const handleAddVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size_label: '', price: 0, stock_quantity: 0, thumbnail_image: null, images: [] }]
        });
    };

    const handleRemoveVariant = (index: number) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index)
        });
    };

    const handleVariantChange = (index: number, field: string, value: string | number) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    // Variant Image Management
    const handleVariantImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            const fileArray = Array.from(files);
            const filesToUpload = await Promise.all(
                fileArray.map(async (file) => {
                    const base64 = await fileToBase64(file);
                    return {
                        name: file.name,
                        data: base64
                    };
                })
            );

            const urls = await uploadImages(filesToUpload);
            const newVariants = [...formData.variants];
            const variant = newVariants[variantIndex];

            const newImages = [...variant.images, ...urls.map((url, i) => ({
                image_url: url,
                sort_order: variant.images.length + i
            }))];

            newVariants[variantIndex] = { ...variant, images: newImages };
            setFormData(prev => ({ ...prev, variants: newVariants }));

            toast.success('Variant images uploaded');
        } catch (error) {
            console.error(error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
        const newVariants = [...formData.variants];
        const variant = newVariants[variantIndex];
        const newImages = variant.images.filter((_, i) => i !== imageIndex);
        newVariants[variantIndex] = { ...variant, images: newImages };
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleSetVariantThumbnail = (variantIndex: number, imageUrl: string) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex] = { ...newVariants[variantIndex], thumbnail_image: imageUrl };
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    // Base Image Upload (formerly handleFileUpload)
    const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            setUploading(true);
            const file = files[0];
            const base64 = await fileToBase64(file);
            const url = await uploadImage(base64, file.name);
            setFormData(prev => ({ ...prev, base_image_url: url }));
            toast.success('Base image uploaded');
        } catch (error) {
            console.error(error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.brand_id || !formData.category_id) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.variants.length === 0) {
            toast.error('Please add at least one variant');
            return;
        }

        if (formData.variants.some(v => !v.size_label || v.price <= 0)) {
            toast.error('All variants must have a size label and price');
            return;
        }

        try {
            setLoading(true);

            if (mode === 'create') {
                await createProduct(formData);
                toast.success('Product created successfully!');
            } else {
                if (!initialData?.id) throw new Error('Product ID missing');
                await updateProduct({
                    id: initialData.id,
                    ...formData
                });
                toast.success('Product updated successfully!');
            }

            router.push('/dashboard/products');
            router.refresh();
        } catch (error: any) {
            console.error('Failed to save product:', error);
            toast.error(error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                        Product Title *
                    </label>
                    <InputField
                        icon=""
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Dior Sauvage Eau de Toilette"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624] focus:border-transparent transition-all shadow-sm"
                        placeholder="Describe the perfume notes, longevity, occasion..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                            Brand *
                        </label>
                        {!showNewBrand ? (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={formData.brand_id}
                                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                                        className="w-full appearance-none px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624]"
                                        required
                                    >
                                        <option value="" className="text-gray-400">Select Brand</option>
                                        {brands.map((brand) => (
                                            <option key={brand.id} value={brand.id} className="text-gray-900">
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowNewBrand(true)}
                                    className="px-4 py-2 text-[#511624] bg-[#511624]/5 hover:bg-[#511624]/10 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <InputField
                                    icon=""
                                    type="text"
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    placeholder="Brand Name"
                                />
                                <InputField
                                    icon=""
                                    type="text"
                                    value={newBrand.slug}
                                    onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                                    placeholder="Slug (optional)"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCreateBrand}
                                        className="px-4 py-2 bg-[#511624] text-white rounded-lg hover:bg-[#511624]/90 text-sm"
                                    >
                                        Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewBrand(false)}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                            Category *
                        </label>
                        {!showNewCategory ? (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full appearance-none px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624]"
                                        required
                                    >
                                        <option value="" className="text-gray-400">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id} className="text-gray-900">
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(true)}
                                    className="px-4 py-2 text-[#511624] bg-[#511624]/5 hover:bg-[#511624]/10 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <InputField
                                    icon=""
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    placeholder="Category Name"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCreateCategory}
                                        className="px-4 py-2 bg-[#511624] text-white rounded-lg hover:bg-[#511624]/90 text-sm"
                                    >
                                        Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCategory(false)}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Images (Base) */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Product Images</h2>
                <div className="flex items-start gap-6">
                    <div className="relative w-40 h-40 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 shrink-0 group">
                        {formData.base_image_url ? (
                            <>
                                <Image
                                    src={formData.base_image_url}
                                    alt="Base"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer p-2 bg-white rounded-full text-[#511624] hover:scale-110 transition-transform shadow-lg">
                                        <Edit2 size={20} />
                                        <input type="file" accept="image/*" className="hidden" onChange={handleBaseImageUpload} />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                <Upload className="text-gray-400 mb-2" size={32} />
                                <span className="text-xs font-medium text-gray-500">Upload Base Image</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleBaseImageUpload} />
                            </label>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="animate-spin text-[#511624]" size={32} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-medium text-gray-900">Base Image</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                            This is the primary image shown in search results and at the top of the product page.
                            Variant-specific images can be added in the variants section below.
                        </p>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <ImageIcon size={14} />
                            Recommended: 1000x1000px+, Square aspect ratio
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 border border-gray-100">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
                    <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-2 text-[#511624] bg-[#511624]/5 hover:bg-[#511624]/10 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                        <Plus size={16} />
                        Add Variant
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                        <div key={index} className="p-5 bg-gray-50 rounded-xl border border-gray-100 shadow-sm relative group">
                            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 group-hover:bg-[#511624] transition-colors" />
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                        Size Label
                                    </label>
                                    <input
                                        type="text"
                                        value={variant.size_label}
                                        onChange={(e) => handleVariantChange(index, 'size_label', e.target.value)}
                                        className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624] focus:border-transparent text-sm"
                                        placeholder="e.g., 100ML"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                        Price (LE)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full pl-8 px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624] focus:border-transparent text-sm"
                                            min="0"
                                            step="1"
                                            required
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">LE</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        value={variant.stock_quantity}
                                        onChange={(e) => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#511624] focus:border-transparent text-sm"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Variant Image Manager */}
                            <div className="mt-6 pt-6 border-t border-gray-200/60">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Variant Gallery</h3>
                                        <p className="text-xs text-gray-500">Add photos specific to this {variant.size_label || 'size'}</p>
                                    </div>
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#511624] text-white rounded-lg text-xs font-bold hover:bg-[#511624]/90 transition-all shadow-sm active:scale-95">
                                        <Plus size={14} />
                                        Add Photos
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleVariantImageUpload(index, e)}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3">
                                    {variant.images.map((img, imgIdx) => (
                                        <div
                                            key={imgIdx}
                                            className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${variant.thumbnail_image === img.image_url ? 'border-[#511624] ring-2 ring-[#511624]/20 scale-95' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <Image src={img.image_url} alt="Variant" fill className="object-cover" />
                                            {variant.thumbnail_image === img.image_url && (
                                                <div className="absolute top-1 left-1 bg-[#511624] text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                                                    THUMBNAIL
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetVariantThumbnail(index, img.image_url)}
                                                    title="Set as Thumbnail"
                                                    className={`p-1.5 rounded-md transition-colors ${variant.thumbnail_image === img.image_url ? 'bg-[#511624] text-white' : 'bg-white text-[#511624] hover:bg-[#511624] hover:text-white'}`}
                                                >
                                                    <ImageIcon size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveVariantImage(index, imgIdx)}
                                                    title="Remove Image"
                                                    className="p-1.5 bg-white text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {variant.images.length === 0 && (
                                        <div className="col-span-full py-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-white/50">
                                            <ImageIcon size={24} className="mb-2 opacity-50" />
                                            <span className="text-xs font-medium">No images for this variant yet</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {formData.variants.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 pt-4 rounded-lg sticky bottom-0 bg-gray-50/10 backdrop-blur-sm p-4 border-t z-10">
                <Link
                    href="/dashboard/products"
                    className="px-6 py-3 text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-bold shadow-sm"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-[#511624]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-md flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                    {mode === 'create' ? 'Create Product' : 'Update Product'}
                </button>
            </div>
        </form>
    );
}
