"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Image from "next/image";
import Link from "next/link";
import type { Brand } from "@/types/database";

export default function Brands({ brands, existingImages }: { brands: Brand[], existingImages: string[] }) {
    // Helper to find image for a brand
    const getBrandImage = (brandName: string) => {
        const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
        const imageFile = existingImages.find(file => {
            const ext = '.' + file.split('.').pop()?.toLowerCase();
            const name = file.substring(0, file.lastIndexOf('.')); // Remove extension
            // Compare case-insensitive? The user asked for "brand name" matching.
            // Filesystem is case-insensitive on Windows but sensitive on Linux.
            // Assuming user names the file exactly as the brand name for safety.
            return name === brandName && validExtensions.includes(ext);
        });
        return imageFile ? `/assets/images/brands/${imageFile}` : null;
    };

    // Filter brands that have a matching logo
    const brandsWithLogos = brands.map(brand => ({
        ...brand,
        logoUrl: getBrandImage(brand.name)
    })).filter(brand => brand.logoUrl);

    if (brandsWithLogos.length === 0) return null;

    return (
        <section className="py-6 bg-gradient-to-t from-secondary/40 to-transparent">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-8 uppercase tracking-widest text-white">
                    Shop By Brand
                </h2>

                <Swiper
                    modules={[Autoplay]}
                    spaceBetween={30}
                    slidesPerView={2}
                    loop={true}
                    autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 3,
                        },
                        768: {
                            slidesPerView: 4,
                        },
                        1024: {
                            slidesPerView: 5,
                        },
                    }}
                    className="brands-swiper"
                >
                    {brandsWithLogos.map((brand) => (
                        <SwiperSlide key={brand.id} className="flex items-center justify-center py-2 px-4 rounded-3xl bg-white border border-secondary">
                            <Link
                                href={`/pages/shop?brand_id=${brand.id}`}
                                className="group flex flex-col items-center justify-center p-4 transition-transform hover:scale-105"
                            >
                                <div className="relative w-32 h-20 md:w-40 md:h-24">
                                    <Image
                                        src={brand.logoUrl!}
                                        alt={brand.name}
                                        fill
                                        className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                    />
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
