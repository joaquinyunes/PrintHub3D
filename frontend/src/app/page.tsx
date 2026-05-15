"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, ArrowRight, Package, Instagram, MapPin, LogOut, Menu, X, Box, Phone } from "lucide-react";
import CartIcon from "@/components/CartIcon";
import { WHATSAPP_PHONE, WHATSAPP_DISPLAY } from "@/lib/config";
import { apiUrl } from "@/lib/api";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ScrollAnimation from "@/components/ScrollAnimation";
import ScrollAnimationImpresora from "@/components/ScrollAnimationImpresora";
import type { Product } from "@/types";

interface ShowcaseProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  videoUrl?: string;
}

interface ShowcaseSubCategory {
  id: string;
  name: string;
  products: ShowcaseProduct[];
}

interface ShowcaseCategory {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  subCategories: ShowcaseSubCategory[];
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [productsError, setProductsError] = useState("");
  
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  
  // Dynamic home sections from admin
  const [homeSections, setHomeSections] = useState<any>(null);
  const [openShowcaseCategory, setOpenShowcaseCategory] = useState<ShowcaseCategory | null>(null);

  const resolveMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return apiUrl(path.startsWith("/") ? path : `/${path}`);
  };

  const showcaseCategoriesFromAdmin = useMemo(() => {
    const list = homeSections?.productCategories;
    if (!Array.isArray(list) || list.length === 0) return null;
    const withNames = list.filter((c: { name?: string }) => String(c?.name || "").trim());
    return withNames.length ? withNames : null;
  }, [homeSections]);

  const FALLBACK_CATEGORY_CARDS = useMemo(
    () => [
      { icon: "🥫", name: "Porta Latas", desc: "Personalizado a medida" },
      { icon: "🥤", name: "Vasos", desc: "River, Boca, Racing y más" },
      { icon: "🏆", name: "Trofeos", desc: "Calidad premium" },
      { icon: "🔑", name: "Llaveros", desc: "Diseños únicos" },
      { icon: "🎮", name: "Funkos", desc: "Coleccionables" },
      { icon: "🎲", name: "Juegos", desc: "Piezas para tablero" },
      { icon: "📦", name: "Guardadores", desc: "Figuritas y más" },
      { icon: "⭐", name: "Más", desc: "Ver catálogo completo" },
    ],
    [],
  );

  const fallbackProducts: Product[] = [
    { _id: "1", name: "Soporte Celular Premium", price: 2500, imageUrl: "https://images.unsplash.com/photo-1616348436918-d227853a0d4c?w=400&h=400&fit=crop", description: "Soporte de aluminio para escritorio", category: "Accesorios" },
    { _id: "2", name: "Organizador de Cables", price: 1800, imageUrl: "https://images.unsplash.com/photo-1625723044792-44b16c3f5a5d?w=400&h=400&fit=crop", description: "Organizador magnético", category: "Organizers" },
    { _id: "3", name: "Soporte Auriculares", price: 2200, imageUrl: "https://images.unsplash.com/photo-1593113598332-cd2880eac669?w=400&h=400&fit=crop", description: "Soporte de Pared", category: "Accesorios" },
    { _id: "4", name: "Clip Filamento", price: 800, imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=400&fit=crop", description: "Pack de 10 clips", category: "Accesorios" },
    { _id: "5", name: "Cajón Escondido", price: 3500, imageUrl: "https://images.unsplash.com/photo-1558618666-fda70efd1e81?w=400&h=400&fit=crop", description: "Cajón secreto para escritorio", category: "Storage" },
    { _id: "6", name: "Soporte Cuello", price: 2800, imageUrl: "https://images.unsplash.com/photo-1616348436918-d227853a0d4c?w=400&h=400&fit=crop", description: "Ergonómico para ver películas", category: "Accesorios" },
  ];

  const displayProducts = products.length > 0 ? products : fallbackProducts;
  
  const filteredProducts = displayProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(displayProducts.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      } catch {}
    }

    const loadData = async () => {
      setLoading(true);
      setProductsError("");
      try {
        const res = await fetch(apiUrl("/api/products/public?tenantId=global3d_hq"));
        if (!res.ok) {
          setProductsError("Error cargando productos");
        } else {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setProductsError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Load settings from admin
    const loadSettings = async () => {
      try {
        const res = await fetch(apiUrl("/api/settings/public"));
        if (res.ok) {
          const data = await res.json();
          if (data.homepageSections) setHomeSections(data.homepageSections);
        } else {
          console.error("Error loading settings:", res.status);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    };
    loadSettings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const handleWhatsAppBuy = (item: any) => {
    const text = `Hola! 👋 Quiero comprar: *${item.name}* ($${item.price}).`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim();
    if (!code) return;
    router.push(`/track?code=${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-lg shadow-blue-500/30">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{homeSections?.heroTitle || "Global 3D"}</span>
              <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase -mt-1">Corrientes</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {[
              { href: "#rastreo", label: "📦 Rastreo" },
              { href: "#producto-estrella", label: "⭐ Producto Estrella" },
              { href: "#categorias", label: "Categorías" },
              { href: "#productos", label: "Productos" },
              { href: "#contacto", label: "Contacto" }
            ].map((item, i) => (
              <Link key={i} href={item.href} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 relative group">
                {item.label}
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-full group-hover:left-0 transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <CartIcon />
            {user?.role === "admin" ? (
              <div className="flex items-center gap-2">
                <Link href="/admin" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all">Admin</Link>
                <button onClick={handleLogout} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/admin/login" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/10 transition-all">Ingresar</Link>
            )}
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden fixed top-16 left-0 right-0 bg-black border-b border-white/10 p-4 z-40">
            <Link href="#rastreo" className="block py-3 text-gray-300 hover:text-white border-b border-white/10" onClick={() => setMenuOpen(false)}>📦 Rastreo</Link>
            <Link href="#producto-estrella" className="block py-3 text-gray-300 hover:text-white border-b border-white/10" onClick={() => setMenuOpen(false)}>⭐ Producto Estrella</Link>
            <Link href="#categorias" className="block py-3 text-gray-300 hover:text-white border-b border-white/10" onClick={() => setMenuOpen(false)}>Categorías</Link>
            <Link href="#productos" className="block py-3 text-gray-300 hover:text-white border-b border-white/10" onClick={() => setMenuOpen(false)}>Productos</Link>
            <Link href="#contacto" className="block py-3 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Contacto</Link>
          </div>
        )}
      </nav>

      {/* 1. 📦 RASTREO */}
      <section id="rastreo" className="pt-28 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-7 w-7 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Rastrear Mi Pedido</h2>
            </div>
            <p className="text-gray-400 text-center mb-6 text-sm">Ingresá el código para ver el estado de producción</p>
            <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ej: joaquin-vasoboca-17032026"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={!trackingCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-900 disabled:text-gray-500 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                Rastrear <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. 🏠 HERO */}
      <HeroSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        trackingCode={trackingCode}
        setTrackingCode={setTrackingCode}
        handleTrackOrder={handleTrackOrder}
        handleWhatsAppBuy={handleWhatsAppBuy}
        user={user}
        handleLogout={handleLogout}
        heroData={{
          title: homeSections?.heroTitle || "Global 3D",
          subtitle: homeSections?.heroSubtitle || "Transformamos tus ideas en objetos reales.",
          description: homeSections?.heroDescription || "Impresión 3D de alta calidad en Corrientes",
          badge: homeSections?.heroBadge || "Envíos gratis en pedidos mayores a $50.000",
          stats: homeSections?.heroStats || { reviews: "4.9", reviewsCount: "200+ reseñas", orders: "500+", delivery: "24-72h" },
          features: homeSections?.heroFeatures || ["Impresión rápida", "Calidad premium", "Envío rápido", "Soporte 24/7"]
        }}
      />

      {/* 3. ⭐ PRODUCTO ESTRELLA */}
      {homeSections?.productStar?.enabled !== false && (
        <section id="producto-estrella" className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white">Producto Estrella</h2>
          </div>
        </section>
      )}

      {/* 4. 🏆 VIDEO 1: COPA KLING (Scroll Animation) */}
      {homeSections?.copaAnimation?.enabled !== false && (
        <ScrollAnimation 
          totalFrames={homeSections?.copaAnimation?.totalFrames || 73}
          nativeWidth={744}
          nativeHeight={1232}
          framesDir={homeSections?.copaAnimation?.framesDir || '/frames-copakling/'}
          title={homeSections?.copaAnimation?.title || 'Copa de la Liga'}
          subtitle={homeSections?.copaAnimation?.subtitle || 'Diseño 3D de alta calidad con detalles premium'}
          badge={homeSections?.copaAnimation?.badge || 'TROFEO PREMIUM'}
          price={homeSections?.copaAnimation?.price || '$12.500'}
          accentColor={homeSections?.copaAnimation?.accentColor || '#f59e0b'}
        />
      )}

      {/* 5. 📂 CATEGORÍAS */}
      <section id="categorias" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-blue-400 text-sm uppercase tracking-wider font-bold">Explorá</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-2">Nuestras Categorías</h2>
            <p className="text-zinc-300 mt-3 text-sm md:text-base max-w-xl mx-auto font-medium">
              Tocá una categoría para ver subcategorías y productos (configurables en Admin → Inicio web).
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {showcaseCategoriesFromAdmin
              ? showcaseCategoriesFromAdmin.map((cat: { id: string; name: string; icon?: string; subCategories?: { name?: string }[] }) => {
                  const subs = Array.isArray(cat.subCategories) ? cat.subCategories : [];
                  const preview =
                    subs
                      .map((s) => String(s?.name || "").trim())
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(" · ") || "Ver productos y videos";
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setOpenShowcaseCategory(cat as ShowcaseCategory)}
                      className="group text-left relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/15 rounded-2xl p-6 hover:scale-[1.02] hover:-translate-y-1 hover:border-blue-500/40 transition-all shadow-lg shadow-black/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    >
                      <div className="text-4xl mb-3 drop-shadow-md">{cat.icon || "📦"}</div>
                      <h3 className="font-black text-white text-base leading-tight">{cat.name}</h3>
                      <p className="text-sm text-zinc-200 mt-2 font-semibold leading-snug">{preview}</p>
                    </button>
                  );
                })
              : FALLBACK_CATEGORY_CARDS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="group text-left relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/15 rounded-2xl p-6 hover:scale-[1.02] hover:-translate-y-1 hover:border-amber-500/35 transition-all shadow-lg shadow-black/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <div className="text-4xl mb-3 drop-shadow-md">{item.icon}</div>
                    <h3 className="font-black text-white text-base leading-tight">{item.name}</h3>
                    <p className="text-sm text-zinc-200 mt-2 font-semibold leading-snug">{item.desc}</p>
                  </button>
                ))}
          </div>
        </div>
      </section>

      {openShowcaseCategory && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          onClick={() => setOpenShowcaseCategory(null)}
        >
          <div
            className="w-full sm:max-w-lg bg-zinc-950 border border-white/20 sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-3 p-5 border-b border-white/10 bg-zinc-900/90 shrink-0">
              <h3 id="category-modal-title" className="text-xl sm:text-2xl font-black text-white leading-tight pr-2">
                <span className="mr-2" aria-hidden>{openShowcaseCategory.icon || "📦"}</span>
                {openShowcaseCategory.name}
              </h3>
              <button
                type="button"
                className="shrink-0 rounded-xl p-2 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setOpenShowcaseCategory(null)}
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-8 flex-1">
              {(openShowcaseCategory.subCategories || []).length === 0 ? (
                <p className="text-zinc-200 font-medium text-center py-6">
                  Todavía no hay subcategorías cargadas. Configuralas en <span className="text-white font-bold">Admin → Inicio web → Categorías de productos</span>.
                </p>
              ) : (
                openShowcaseCategory.subCategories.map((sub) => (
                  <div key={sub.id}>
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-3 border-b border-blue-500/30 pb-2">
                      {String(sub.name || "").trim() || "Sin nombre"}
                    </h4>
                    <div className="space-y-4">
                      {(sub.products || []).length === 0 ? (
                        <p className="text-zinc-300 text-sm font-medium">Sin productos en esta subcategoría.</p>
                      ) : (
                        (sub.products || []).map((p) => (
                          <div
                            key={p.id}
                            className="bg-zinc-900/90 rounded-xl p-4 border border-white/10 space-y-3"
                          >
                            {p.imageUrl ? (
                              <img
                                src={resolveMediaUrl(p.imageUrl)}
                                alt=""
                                className="w-full max-h-48 object-cover rounded-lg border border-white/10"
                              />
                            ) : null}
                            {p.videoUrl ? (
                              <video
                                src={resolveMediaUrl(p.videoUrl)}
                                controls
                                className="w-full rounded-lg border border-white/10 bg-black"
                              />
                            ) : null}
                            <p className="text-lg font-black text-white">{String(p.name || "").trim() || "Producto"}</p>
                            {p.description ? (
                              <p className="text-sm text-zinc-100 leading-relaxed font-medium">{p.description}</p>
                            ) : null}
                            <p className="text-emerald-400 font-black text-xl">
                              ${Number(p.price || 0).toLocaleString("es-AR")}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                handleWhatsAppBuy({
                                  name: p.name || "Producto",
                                  price: p.price ?? 0,
                                })
                              }
                              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
                            >
                              Consultar por WhatsApp
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. 🛒 CATÁLOGO DE PRODUCTOS */}
      <section id="productos" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full mb-4">🛒 PRODUCTOS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Todos los Productos</h2>
          </div>
          
          {displayProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar productos..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900 [&>option]:text-white">
                <option value="all">Todas las categorías</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="aspect-square bg-gray-800/50 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-800/50 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-800/50 rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-gray-800/50 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-red-400 mb-4">{productsError}</p>
              <button onClick={() => window.location.reload()} className="text-blue-400">Reintentar</button>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product._id} product={product} handleWhatsAppBuy={handleWhatsAppBuy} idx={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">No hay productos disponibles.</p>
              <a href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! Quiero pedir un producto`} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">Consultanos disponibilidad</a>
            </div>
          )}
        </div>
      </section>

      {/* 7. 🖨️ VIDEO 2: IMPRESORAS (Scroll Animation) */}
      {homeSections?.impresoraAnimation?.enabled !== false && (
        <ScrollAnimationImpresora 
          totalFrames={homeSections?.impresoraAnimation?.totalFrames || 192}
          nativeWidth={1280}
          nativeHeight={720}
          framesDir={homeSections?.impresoraAnimation?.framesDir || '/frames-mp/'}
          title={homeSections?.impresoraAnimation?.title || 'Impresora 3D Bambu Lab X1C'}
          subtitle={homeSections?.impresoraAnimation?.subtitle || 'La nueva generación de precisión y velocidad'}
          badge={homeSections?.impresoraAnimation?.badge || '🖨️ PROFESIONAL'}
          price={homeSections?.impresoraAnimation?.price || '$469.000'}
          accentColor={homeSections?.impresoraAnimation?.accentColor || '#3b82f6'}
        />
      )}

      {/* 8. 📞 CONTACTO */}
      <section id="contacto" className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Contacto</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <a href={`https://wa.me/${homeSections?.contactInfo?.whatsapp || WHATSAPP_PHONE}`} target="_blank" className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 text-center hover:border-green-600 hover:scale-105 transition-all group">
              <Phone className="w-10 h-10 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-all" />
              <h3 className="font-bold text-white text-lg mb-2">WhatsApp</h3>
              <p className="text-gray-500">{homeSections?.contactInfo?.whatsappDisplay || WHATSAPP_DISPLAY}</p>
            </a>
            <a href={homeSections?.contactInfo?.instagramUrl || 'https://instagram.com/global3dcorrientes'} target="_blank" className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 text-center hover:border-pink-600 hover:scale-105 transition-all group">
              <Instagram className="w-10 h-10 text-pink-500 mx-auto mb-4 group-hover:scale-110 transition-all" />
              <h3 className="font-bold text-white text-lg mb-2">Instagram</h3>
              <p className="text-gray-500">@{homeSections?.contactInfo?.instagram || 'global3dcorrientes'}</p>
            </a>
            <div className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 text-center">
              <MapPin className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h3 className="font-bold text-white text-lg mb-2">Ubicación</h3>
              <p className="text-gray-500">{homeSections?.contactInfo?.location || 'Corrientes, Argentina'}</p>
            </div>
            <a href={`mailto:${homeSections?.contactInfo?.email || 'contacto@global3d.com'}`} className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 text-center hover:border-blue-600 hover:scale-105 transition-all group">
              <Phone className="w-10 h-10 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-all" />
              <h3 className="font-bold text-white text-lg mb-2">Email</h3>
              <p className="text-gray-500">{homeSections?.contactInfo?.email || 'contacto@global3d.com'}</p>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-lg">{homeSections?.heroTitle || "Global 3D"}</span>
          </div>
          <p className="text-gray-600 text-sm">© 2024 Global 3D Corrientes. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank"
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 p-4 rounded-full shadow-lg shadow-green-600/30 z-50 transition hover:scale-110" title="Chatear por WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.162-.173.199-.347.223-.644.075-.197-.103-1.379-1.437-2.612-3.078-.297-.199-.496-.297-.673.15-.176.297-.697.872-1.075.994-.379.123-.646.148-1.143.049-.496-.099-2.425-1.588-3.868-3.012-.298-.298-.497-.447-.696-.447-.02 0-.04 0-.06 0-.2 0-.485.099-.698.298l-1.095 2.697c-.099.297-.022.595.099.793.149.198.397.396.793.495.396.099.793.099 1.141.099.348 0 .695-.099 1.041-.298.349-.198.768-.595.924-.994.099-.299.099-.596.049-.793-.099-.198-.448-1.591-.616-2.137-.149-.546-.298-1.193-.546-1.193z"/>
        </svg>
      </a>
    </div>
  );
}