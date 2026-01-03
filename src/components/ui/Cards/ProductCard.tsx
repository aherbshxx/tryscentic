"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { toast } from "sonner";
import styles from "./cards.module.css";
import type { Product } from "@/types/product";



interface ProductCardProps {
  product: Product;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
}

export default function ProductCard({ product, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const [liked, setLiked] = useState(isFavorite);
  const { addToCart } = useCart();

  // Sync local state with prop when it changes (e.g. after data fetch)
  useEffect(() => {
    setLiked(isFavorite);
  }, [isFavorite]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const previousState = liked;
    setLiked(!previousState);

    if (onToggleFavorite) {
      try {
        await onToggleFavorite(product);
      } catch {
        // Revert on error
        setLiked(previousState);
      }
    }
  };


  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
    });
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <article
      className={
        styles.card +
        ` sm:p-3 shadow-card shadow shadow-white hover:cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-102 hover:rounded-xl hover:border hover:border-white/50 bg-white/5 p-4 `
      }
    >
      <Link href={`/pages/shop/${product.id}`}>


        {/* Aspect Ratio Wrapper for Responsive Image */}
        <div className="rounded-md mb-2 sm:mb-4 relative aspect-square">
          {/* Ensure the parent element is relatively positioned for `fill` to work */}

          <Image
            className="rounded-2xl object-cover"
            src={product.image}
            alt={product.title}
            fill
            loading="eager"
          />
        </div>

        <h4 className="text-white font-semibold mb-1 text-sm sm:text-base line-clamp-1">{product.title}</h4>
        <div className="text-white/70 text-xs mb-2 sm:mb-4">{product.brand}</div>
        <div className="text-white font-bold mb-2 sm:mb-4 text-sm sm:text-base">
          LE {product.price}
        </div>

      </Link>
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={handleAddToCart}
          className="flex-3 btn py-2 sm:py-3 rounded-md font-semibold bg-secondary hover:bg-accent transition text-xs sm:text-sm"
        >
          Add to Cart
        </button>
        <button
          onClick={handleToggle}
          className="flex-1btn rounded-md bg-white flex items-center justify-center p-2 sm:p-3"
        >
          {liked ? (
            <Heart fill="red" className="text-red-600 w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Heart className="text-black w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </article>
  );
}
