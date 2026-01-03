import { getProductById } from "@/data-access/products";
import { isProductFavorite } from "@/data-access/user/favorites";
import ProductDetials from "@/components/parts/ProductDetials";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  try {
    const product = await getProductById(id);

    if (!product || !product.is_active) {
      notFound();
    }

    // Map Database Product to ProductDetail UI Type
    const mappedProduct = {
      id: product.id,
      name: product.title,
      type: product.brand?.name || product.category?.name || "Eau de Parfum",
      baseImage: product.base_image_url || "",
      images: product.gallery_images || [],
      sizes:
        product.variants?.map((v) => ({
          label: v.size_label,
          price: v.price,
          stock: v.stock_quantity,
          thumbnail: v.thumbnail_image,
          images: v.images?.map((img: any) => img.image_url) || [],
        })) || [],
      baseDescription: product.description || "",
      rating: product.rating || 5.0, // Default if 0
      reviewCount: product.review_count || 0,
      reviews: [], // TODO: Fetch real reviews
    };

    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/pages/shop" },
      {
        label: product.brand?.name || "Brand",
        href: `/pages/shop?brand_id=${product.brand_id}`,
      },
    ];

    const isFavorite = await isProductFavorite(id);

    return (
      <section className="pt-20">
        <ProductDetials
          product={mappedProduct as any}
          breadcrumbs={breadcrumbs}
          isFavorite={isFavorite}
        />
      </section>
    );
  } catch (error) {
    console.error("Failed to load product:", error);
    notFound();
  }
}
