"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, ArrowRight, Package, Instagram, MapPin, LogOut, Menu, X, Box, Phone, Mail } from "lucide-react";
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

  const displayProducts = products;
  
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
    <div className="min-h-screen bg-tone-darker text-white font-mono">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-tone-red/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-tone-amber/10 blur-[120px] rounded-full" />
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-tone-darker/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-tone-red via-tone-pink to-tone-amber rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-lg shadow-tone-red/30">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-tone-red via-tone-pink to-tone-amber bg-clip-text text-transparent">{homeSections?.heroTitle || "Global 3D"}</span>
              <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase -mt-1">Corrientes</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {[
              { href: "/rastreo", label: "Rastreo" },
              { href: "/productos", label: "Productos" },
              { href: "/impresoras", label: "Impresoras" },
              { href: "/filamentos", label: "Filamentos" },
              { href: "/contacto", label: "Contacto" }
            ].map((item, i) => (
              <Link key={i} href={item.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 relative group">
                {item.label}
                <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-tone-red rounded-full group-hover:w-full group-hover:left-0 transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <CartIcon />
            {user?.role === "admin" ? (
              <div className="flex items-center gap-2">
                <Link href="/admin" className="px-5 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white rounded-xl text-sm font-bold transition-all">Admin</Link>
                <button onClick={handleLogout} className="p-2.5 text-gray-600 hover:text-tone-red hover:bg-tone-red/10 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/admin/login" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl border border-white/5 transition-all">Ingresar</Link>
            )}
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden fixed top-16 left-0 right-0 bg-tone-darker border-b border-white/5 p-4 z-40">
            <Link href="/rastreo" className="block py-3 text-gray-400 hover:text-white border-b border-white/5" onClick={() => setMenuOpen(false)}>Rastreo</Link>
            <Link href="/productos" className="block py-3 text-gray-400 hover:text-white border-b border-white/5" onClick={() => setMenuOpen(false)}>Productos</Link>
            <Link href="/impresoras" className="block py-3 text-gray-400 hover:text-white border-b border-white/5" onClick={() => setMenuOpen(false)}>Impresoras</Link>
            <Link href="/filamentos" className="block py-3 text-gray-400 hover:text-white border-b border-white/5" onClick={() => setMenuOpen(false)}>Filamentos</Link>
            <Link href="/contacto" className="block py-3 text-gray-400 hover:text-white" onClick={() => setMenuOpen(false)}>Contacto</Link>
          </div>
        )}
      </nav>

      {/* 1. 📦 RASTREO */}
      <section id="rastreo" className="pt-28 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-7 w-7 text-tone-red" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Rastrear Mi Pedido</h2>
            </div>
            <p className="text-gray-600 text-center mb-6 text-sm">Ingresá el código para ver el estado de producción</p>
            <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700" />
                <input type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ej: joaquin-vasoboca-17032026"
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40" />
              </div>
              <button type="submit" disabled={!trackingCode.trim()}
                className="bg-tone-red hover:bg-tone-red/90 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
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
          videoSrc="/copakling-optimized.mp4"
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
            <span className="inline-block px-4 py-1.5 rounded-full border border-tone-red/30 bg-tone-red/10 text-tone-red text-xs tracking-[0.15em] uppercase mb-4">Explorá</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-2">Nuestras Categorías</h2>
            <p className="text-gray-600 mt-3 text-sm max-w-xl mx-auto">Elegí una sección para ver todos nuestros productos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link href="/productos" className="group text-left relative bg-tone-dark/60 border border-white/5 rounded-xl p-8 hover:scale-[1.02] hover:-translate-y-1 hover:border-tone-red/40 transition-all shadow-lg">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="font-bold text-white text-xl leading-tight">Productos Personalizados</h3>
              <p className="text-sm text-gray-500 mt-3">Vasos, trofeos, llaveros y más</p>
            </Link>
            <Link href="/impresoras" className="group text-left relative bg-tone-dark/60 border border-white/5 rounded-xl p-8 hover:scale-[1.02] hover:-translate-y-1 hover:border-tone-red/40 transition-all shadow-lg">
              <div className="text-5xl mb-4">🖨️</div>
              <h3 className="font-bold text-white text-xl leading-tight">Impresoras 3D</h3>
              <p className="text-sm text-gray-500 mt-3">Bambu Lab y más modelos</p>
            </Link>
            <Link href="/filamentos" className="group text-left relative bg-tone-dark/60 border border-white/5 rounded-xl p-8 hover:scale-[1.02] hover:-translate-y-1 hover:border-tone-red/40 transition-all shadow-lg">
              <div className="text-5xl mb-4">🧵</div>
              <h3 className="font-bold text-white text-xl leading-tight">Filamentos</h3>
              <p className="text-sm text-gray-500 mt-3">PLA, PETG, ABS y materiales</p>
            </Link>
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
      {filteredProducts.length > 0 && (
        <section id="productos" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full border border-tone-red/30 bg-tone-red/10 text-tone-red text-xs tracking-[0.15em] uppercase mb-4">Productos</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Todos los Productos</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar productos..."
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40" />
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-tone-darker/80 border border-white/5 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-tone-red/40 [&>option]:bg-tone-darker [&>option]:text-white">
                <option value="all">Todas las categorías</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product._id} product={product} handleWhatsAppBuy={handleWhatsAppBuy} idx={idx} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. 🖨️ VIDEO 2: IMPRESORAS (Scroll Animation) */}
      {homeSections?.impresoraAnimation?.enabled !== false && (
        <ScrollAnimationImpresora 
          videoSrc="/mp_.mp4"
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
            <span className="inline-block px-4 py-1.5 rounded-full border border-tone-red/30 bg-tone-red/10 text-tone-red text-xs tracking-[0.15em] uppercase mb-4">Contacto</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Contacto</h2>
            <p className="text-gray-600">Respondemos en el día</p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid md:grid-cols-3 gap-6">
              <a href={`https://wa.me/${homeSections?.contactInfo?.whatsapp || WHATSAPP_PHONE}`} target="_blank" className="contact-card bg-tone-dark/60 border border-white/5 rounded-xl p-8 text-center hover:border-tone-red/30 hover:scale-105 transition-all group" style={{animationDelay: '0.1s'}}>
                <div className="w-14 h-14 bg-tone-red/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-tone-red/20 group-hover:scale-110 transition-all">
                  <Phone className="w-7 h-7 text-tone-red" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">WhatsApp</h3>
                <p className="text-gray-500">{homeSections?.contactInfo?.whatsappDisplay || WHATSAPP_DISPLAY}</p>
              </a>
              <a href={homeSections?.contactInfo?.instagramUrl || 'https://instagram.com/global3dcorrientes'} target="_blank" className="contact-card bg-tone-dark/60 border border-white/5 rounded-xl p-8 text-center hover:border-tone-amber/30 hover:scale-105 transition-all group" style={{animationDelay: '0.2s'}}>
                <div className="w-14 h-14 bg-tone-amber/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-tone-amber/20 group-hover:scale-110 transition-all">
                  <Instagram className="w-7 h-7 text-tone-amber" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Instagram</h3>
                <p className="text-gray-500">@{homeSections?.contactInfo?.instagram || 'global3dcorrientes'}</p>
              </a>
              <div className="contact-card bg-tone-dark/60 border border-white/5 rounded-xl p-8 text-center" style={{animationDelay: '0.3s'}}>
                <div className="w-14 h-14 bg-tone-red/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-tone-red" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Ubicación</h3>
                <p className="text-gray-500">{homeSections?.contactInfo?.location || 'Corrientes, Argentina'}</p>
              </div>
            </div>
            <a href={`mailto:${homeSections?.contactInfo?.email || 'contacto@global3d.com'}`} className="contact-card bg-tone-dark/60 border border-white/5 rounded-xl p-8 text-center hover:border-tone-amber/30 hover:scale-105 transition-all group max-w-md mx-auto w-full" style={{animationDelay: '0.4s'}}>
              <div className="w-14 h-14 bg-tone-amber/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-tone-amber/20 group-hover:scale-110 transition-all">
                <Mail className="w-7 h-7 text-tone-amber" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Email</h3>
              <p className="text-gray-500">{homeSections?.contactInfo?.email || 'contacto@global3d.com'}</p>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-tone-red to-tone-amber rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-tone-red to-tone-amber bg-clip-text text-transparent text-lg">{homeSections?.heroTitle || "Global 3D"}</span>
          </div>
          <p className="text-gray-700 text-sm">© 2024 Global 3D Corrientes. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank"
        className="fixed bottom-6 right-6 bg-tone-red hover:bg-tone-red/90 p-4 rounded-full shadow-lg shadow-tone-red/30 z-50 transition hover:scale-110" title="Chatear por WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.162-.173.199-.347.223-.644.075-.197-.103-1.379-1.437-2.612-3.078-.297-.199-.496-.297-.673.15-.176.297-.697.872-1.075.994-.379.123-.646.148-1.143.049-.496-.099-2.425-1.588-3.868-3.012-.298-.298-.497-.447-.696-.447-.02 0-.04 0-.06 0-.2 0-.485.099-.698.298l-1.095 2.697c-.099.297-.022.595.099.793.149.198.397.396.793.495.396.099.793.099 1.141.099.348 0 .695-.099 1.041-.298.349-.198.768-.595.924-.994.099-.299.099-.596.049-.793-.099-.198-.448-1.591-.616-2.137-.149-.546-.298-1.193-.546-1.193z"/>
        </svg>
      </a>
    </div>
  );
}