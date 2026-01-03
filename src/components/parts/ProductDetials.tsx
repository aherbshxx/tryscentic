"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Reviews from "./Reviews";
import { ProductDetail, ProductSizeOption } from "@/types/product";
import ButtonAddToCart from "@/components/ui/Buttons/AddToCart";
import { toggleFavorite } from "@/data-access/user/favorites";
import { toast } from "sonner";

type Breadcrumb = {
  label: string;
  href?: string;
};

const defaultBreadcrumbs: Breadcrumb[] = [
  { label: "Home", href: "/" },
  { label: "Fragrances", href: "/pages/shop" },
];

type ProductDetailsProps = {
  product: ProductDetail;
  breadcrumbs?: Breadcrumb[];
  isFavorite?: boolean;
};

export default function ProductDetials({
  product,
  breadcrumbs = defaultBreadcrumbs,
  isFavorite = false,
}: ProductDetailsProps) {
  const [liked, setLiked] = useState(isFavorite);

  // Sync state (e.g. after revalidation)
  useEffect(() => {
    setLiked(isFavorite);
  }, [isFavorite]);

  const [selectedSize, setSelectedSize] = useState<ProductSizeOption>(
    product.sizes[0] ?? { label: "Standard", price: 0 }
  );

  // The gallery of images to display for the current selection
  const currentImages = useMemo(() => {
    if (selectedSize.images && selectedSize.images.length > 0) {
      return selectedSize.images;
    }
    return product.images;
  }, [selectedSize, product.images]);

  const [selectedImage, setSelectedImage] = useState(
    currentImages[0] ?? product.baseImage
  );

  // Sync selected image if currentImages changes and doesn't contain the selected image anymore
  useEffect(() => {
    if (selectedSize.images && selectedSize.images.length > 0) {
      setSelectedImage(selectedSize.images[0]);
    }
  }, [selectedSize]);

  const priceLabel = useMemo(
    () => `LE ${selectedSize.price.toFixed(0)}`,
    [selectedSize.price]
  );

  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleToggleFavorite = async () => {
    try {
      setLiked(prev => !prev); // Optimistic
      const newStatus = await toggleFavorite(product.id || ""); // Ensure ID exists
      setLiked(newStatus);
      if (newStatus) toast.success("Added to favorites");
      else toast.success("Removed from favorites");
    } catch {
      setLiked(prev => !prev); // Revert
      toast.error("Please login to manage favorites");
    }
  };

  return (
    <section className="min-h-screen px-4 py-8  text-white sm:px-6 lg:px-12">
      <div className="mx-auto space-y-16">
        <div className="space-y-12">
          <nav className="text-sm text-white/60">
            <ul className="flex items-center gap-2">
              {[...breadcrumbs, { label: product.name }].map(
                ({ label, href }, index) => (
                  <li
                    key={`${label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {index !== 0 && <span>/</span>}
                    {href ? (
                      <Link href={href} className="transition hover:text-white">
                        {label}
                      </Link>
                    ) : (
                      <span className="text-white">{label}</span>
                    )}
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="relative mb-6 aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black">
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {currentImages.map((image) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImage(image)}
                    className={`relative aspect-square overflow-hidden rounded-2xl border transition ${selectedImage === image
                      ? "border-white"
                      : "border-white/10 hover:border-white/40"
                      }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} preview`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                  {product.type}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-wide sm:text-5xl">
                  {product.name}
                </h1>
                <p className="mt-2 text-3xl font-semibold text-amber-400">
                  {priceLabel}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/50">
                  Size
                </p>
                <div className="flex gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${selectedSize.label === size.label
                        ? "border-white bg-white text-black"
                        : "border-white/30 text-white hover:border-white"
                        }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Quantity
                </p>
                <div className="flex items-center rounded-full border border-white/30">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-4 py-2 text-lg font-semibold text-white transition hover:bg-white/10"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="min-w-[60px] text-center text-xl font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-4 py-2 text-lg font-semibold text-white transition hover:bg-white/10"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <ButtonAddToCart
                  product={product}
                  sizes={selectedSize}
                  quantity={quantity}
                />
                <button
                  onClick={handleToggleFavorite}
                  className="rounded-full border border-white/30 p-3 text-white transition hover:border-white hover:bg-white/10"
                >
                  {liked ? (
                    <Heart fill="red" className="h-6 w-6 text-red-600" />
                  ) : (
                    <Heart className="h-6 w-6" />
                  )}
                </button>
                <button className="rounded-full  border border-white/30 p-3 text-white transition hover:border-white hover:bg-white/10">
                  <Share2 className="h-6 w-6" />
                </button>
              </div>

              <details
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white"
                open
              >
                <summary className="cursor-pointer text-lg font-semibold tracking-wide">
                  Description
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  {product.baseDescription}
                </p>
              </details>
            </div>
          </div>
        </div>
        <Reviews
          productId={product.id}
          initialRating={product.rating}
          initialReviewCount={product.reviewCount}
        />
      </div>
    </section>
  );
}
