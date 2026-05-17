"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import CollectionPage from "@/components/CollectionPage";

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageHover?: string;
  videoUrl?: string;
  enabled?: boolean;
  categoryId?: string;
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

interface SectionData {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  heroImage: string;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    imageUrl?: string;
    description?: string;
    subCategories: SubCategory[];
  }>;
}

export default function ProductosPage() {
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
        setSectionData(data.productosSection || {
          enabled: true,
          title: "Productos Personalizados",
          subtitle: "Vasos, llaveros, trofeos y más",
          badge: "🏆 PRODUCTOS",
          heroImage: "",
          categories: []
        });
      }
    } catch (e) {
      console.error("Error loading productos:", e);
    } finally {
      setLoading(false);
    }
  };

  const getAllProducts = (): ProductItem[] => {
    if (!sectionData?.categories) return [];
    
    const products: ProductItem[] = [];
    let idx = 0;
    sectionData.categories.forEach((cat: any) => {
      if (cat.subCategories) {
        cat.subCategories.forEach((sub: any) => {
          if (sub.products) {
            sub.products.forEach((prod: any) => {
              const prodName = prod.name?.trim() || prod.description?.trim() || 'Sin nombre';
              const prodDesc = prod.description || '';
              if (prodName && prodName !== 'Sin nombre' || prod.imageUrl) {
                idx++;
                products.push({
                  id: prod.id || `prod-${idx}`,
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
            idx++;
            products.push({
              id: prod.id || `prod-${idx}`,
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
            {sectionData?.title || "Productos"}
          </span>
          <div className="w-20" />
        </div>
      </div>

      {allProducts.length === 0 && categories.length === 0 ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
            <p className="text-gray-500">Estamos agregando productos. Consultanos por WhatsApp</p>
          </div>
        </div>
      ) : (
        <CollectionPage
          title={sectionData?.title || "Productos Personalizados"}
          subtitle={sectionData?.subtitle || "Vasos, llaveros, trofeos y más"}
          badge={sectionData?.badge || "🏆 PRODUCTOS"}
          heroImage={sectionData?.heroImage}
          categories={categories}
          products={allProducts}
          accentColor="#3b82f6"
          searchOptions={sectionData?.allProductsSearch}
        />
      )}
    </div>
  );
}