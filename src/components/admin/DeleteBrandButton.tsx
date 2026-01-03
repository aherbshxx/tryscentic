"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteBrandAction } from "@/actions/brand-actions";
import { toast } from "sonner";

interface DeleteBrandButtonProps {
    brandId: string;
    brandName: string;
}

export default function DeleteBrandButton({ brandId, brandName }: DeleteBrandButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${brandName}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteBrandAction(brandId);
            if (result.success) {
                toast.success("Brand deleted successfully");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("An error occurred while deleting the brand");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-50"
            title="Delete Brand"
        >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
        </button>
    );
}
