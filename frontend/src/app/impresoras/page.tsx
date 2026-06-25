"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import CollectionPage from "@/components/CollectionPage";
import ScrollAnimationImpresora from "@/components/ScrollAnimationImpresora";

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageHover?: string;
  videoUrl?: string;
  effects?: string;
  animations?: string;
  enabled?: boolean;
  categoryId?: string;
  stock?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  description?: string;
}

interface SubCategory {
  id: string;
  name: string;
  products: ProductItem[];
}

interface AnimationData {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  price: string;
  accentColor: string;
}

interface SectionData {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  heroImage: string;
  animation: AnimationData;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    imageUrl?: string;
    description?: string;
    subCategories: SubCategory[];
  }>;
}

export default function ImpresorasPage() {
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings/public"));
      if (res.ok) {
        const data = await res.json();
        setSectionData(data.impresorasSection || {
          enabled: true,
          title: "Impresoras 3D",
          subtitle: "Bambu Lab y más",
          badge: "🖨️ IMPRESORAS",
          heroImage: "",
          animation: { enabled: true, title: 'Impresora 3D Bambu Lab X1C', subtitle: 'La nueva generación', badge: '🖨️ PROFESIONAL', price: '$469.000', accentColor: '#3b82f6', framesDir: '/frames-mp/', totalFrames: 192 },
          categories: []
        });
      }
    } catch (e) {
      console.error("Error loading impresoras:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAllProducts = (): ProductItem[] => {
    if (!sectionData?.categories) return [];
    
    const products: ProductItem[] = [];
    sectionData.categories.forEach((cat: any) => {
      if (cat.subCategories) {
        cat.subCategories.forEach((sub: any) => {
          if (sub.products) {
            sub.products.forEach((prod: any) => {
              const prodName = prod.name?.trim() || prod.description?.trim() || 'Sin nombre';
              const prodDesc = prod.description || '';
              if (prodName && prodName !== 'Sin nombre' || prod.imageUrl) {
                products.push({
                  id: prod.id || Date.now().toString(),
                  name: prodName,
                  description: prodDesc,
                  price: prod.price || 0,
                  imageUrl: prod.imageUrl || '',
                  imageHover: prod.imageHover || '',
                  videoUrl: prod.videoUrl || '',
                  categoryId: cat.id
                });
              }
            });
          }
        });
      }
      if (cat.products) {
        cat.products.forEach((prod: any) => {
          const prodName = prod.name?.trim() || prod.description?.trim() || 'Sin nombre';
          const prodDesc = prod.description || '';
          if (prodName && prodName !== 'Sin nombre' || prod.imageUrl) {
            products.push({
              id: prod.id || Date.now().toString(),
              name: prodName,
              description: prodDesc,
              price: prod.price || 0,
              imageUrl: prod.imageUrl || '',
              imageHover: prod.imageHover || '',
              videoUrl: prod.videoUrl || '',
              categoryId: cat.id
            });
          }
        });
      }
    });
    
    return products;
  };

  const getCategories = (): Category[] => {
    if (!sectionData?.categories) return [];
    return sectionData.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      imageUrl: cat.imageUrl,
      description: cat.description
    }));
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allProducts = getAllProducts();
  const categories = getCategories();

  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {sectionData?.title || "Impresoras"}
          </span>
          <div className="w-20" />
        </div>
      </div>

      {sectionData?.animation?.enabled && (
        <div className="pt-16">
          <ScrollAnimationImpresora
            videoSrc="/mp_.mp4"
            title={sectionData.animation.title || 'Impresora 3D Bambu Lab X1C'}
            subtitle={sectionData.animation.subtitle || 'La nueva generación de precisión y velocidad'}
            badge={sectionData.animation.badge || 'PROFESIONAL'}
            price={sectionData.animation.price || '$469.000'}
            accentColor={sectionData.animation.accentColor || '#3b82f6'}
          />
        </div>
      )}

      {allProducts.length === 0 && categories.length === 0 ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🖨️</div>
            <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
            <p className="text-gray-500">Consultanos por modelos y disponibilidad</p>
          </div>
        </div>
      ) : (
        <CollectionPage
          title={sectionData?.title || "Impresoras 3D"}
          subtitle={sectionData?.subtitle || "Bambu Lab y más"}
          badge={sectionData?.badge || "🖨️ IMPRESORAS"}
          heroImage={sectionData?.heroImage}
          categories={categories}
          products={allProducts}
          accentColor="#10b981"
        />
      )}
    </div>
  );
}