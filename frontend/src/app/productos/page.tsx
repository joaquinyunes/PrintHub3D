"use client";

import { useState, useEffect } from "react";
import { apiUrl } from "@/lib/api";
import CollectionPage from "@/components/CollectionPage";
import Nav from "@/components/store/Nav";
import Footer from "@/components/store/Footer";

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
  // 🟢 Agregado el tipado de la barra de búsqueda para solucionar el error
  allProductsSearch?: {
    enabled: boolean;
    placeholder: string;
    sortOptions?: string[];
    filterOptions?: string[];
  };
}

export default function ProductosPage() {
  const [loading, setLoading] = useState(true);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [contact, setContact] = useState<any>(null);
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
        if (data.contactInfo) setContact(data.contactInfo);
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
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-flame border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allProducts = getAllProducts();
  const categories = getCategories();

  return (
    <div className="bg-ground min-h-screen">
      <Nav />

      {allProducts.length === 0 && categories.length === 0 ? (
        <div className="min-h-screen bg-ground flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">Próximamente</h2>
            <p className="text-ink-dim">Estamos agregando productos. Consultanos por WhatsApp</p>
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
          accentColor="#ff5c1a"
          // 🟢 Corregido con el fallback por si la base de datos devuelve un valor vacío al inicio
          searchOptions={sectionData?.allProductsSearch || { enabled: true, placeholder: "Buscar productos..." }}
        />
      )}
      <Footer contact={contact} />
    </div>
  );
}