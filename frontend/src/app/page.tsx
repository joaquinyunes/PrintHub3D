"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, ArrowRight, Package, Instagram, MapPin, LogOut, Menu, X, Box, Phone } from "lucide-react";
import CartIcon from "@/components/CartIcon";
import { WHATSAPP_PHONE, WHATSAPP_DISPLAY } from "@/lib/config";
import { motion } from "framer-motion";
import { apiUrl } from "@/lib/api";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import IdeasGrid from "@/components/IdeasGrid";
import ScrollVideoPlayer from "@/components/ScrollVideoPlayer";
import type { Product } from "@/types";

interface Idea {
  name: string;
  downloads: string;
  desc: string;
  link: string;
  image?: string;
  price: number;
  trending?: boolean;
}

interface Printer {
  name: string;
  price: number;
  imageUrl?: string;
  link: string;
  description: string;
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
  // NEW: dynamic home data for Ideas and Printers
  const [ideasData, setIdeasData] = useState<Idea[]>([]);
  const [printersData, setPrintersData] = useState<Printer[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const ideas: Idea[] = [
    { name: "iPhone Stand", downloads: "15k+", desc: "Soporte para celular", link: "https://makerworld.bambulab.com/es/model/23618", image: "https://images.unsplash.com/photo-1616348436918-d227853a0d4c?w=400&h=400&fit=crop", price: 2500, trending: true },
    { name: "Under Desk Drawer", downloads: "12k+", desc: "Cajón secreto", link: "https://makerworld.bambulab.com/es/model/18956", image: "https://images.unsplash.com/photo-1558618666-fda70efd1e81?w=400&h=400&fit=crop", price: 3000, trending: true },
    { name: "OTF Fidget", downloads: "10k+", desc: "Spinner táctil", link: "https://makerworld.bambulab.com/es/model/45201", image: "https://images.unsplash.com/photo-1609146804283-2276bfb19e40?w=400&h=400&fit=crop", price: 1500 },
    { name: "Cable Wrapper", downloads: "8k+", desc: "Organizador", link: "https://makerworld.bambulab.com/es/model/34567", image: "https://images.unsplash.com/photo-1625723044792-44b16c3f5a5d?w=400&h=400&fit=crop", price: 1200 },
    { name: "Filament Clip", downloads: "7k+", desc: "Clip universal", link: "https://makerworld.bambulab.com/es/model/12345", image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=400&fit=crop", price: 800 },
    { name: "Capybara", downloads: "5k+", desc: "Capy caminante", link: "https://makerworld.bambulab.com/es/model/67890", image: "https://images.unsplash.com/photo-1535295972055-1c76275bb4c2?w=400&h=400&fit=crop", price: 3500 },
  ];

  const printers: Printer[] = [
    { name: "Bambu Lab A1", price: 469000, imageUrl: "https://images.unsplash.com/photo-1631549916768-4115659e404e?w=600&h=400&fit=crop", link: "https://store.bambulab.com/products/a1", description: "Impresora IDEAL para começar" },
    { name: "Bambu Lab P1P", price: 1159000, imageUrl: "https://images.unsplash.com/photo-1565689157206-850c86b1b131?w=600&h=400&fit=crop", link: "https://store.bambulab.com/products/p1p", description: "Alta velocidade e precisão" },
    { name: "Bambu Lab X1C", price: 1599000, imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c0acd9807?w=600&h=400&fit=crop", link: "https://store.bambulab.com/products/x1c", description: "Flagship com multi-material" },
  ];

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
  // SD: dynamic home content display helpers
  const displayIdeas = ideasData.length > 0 ? ideasData : ideas;
  const displayPrinters = printersData.length > 0 ? printersData : printers;

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
    // Load home data (ideas & printers) from API
    const loadHomeData = async () => {
      try {
        const [ideasRes, printersRes] = await Promise.all([
          fetch(apiUrl("/api/home/ideas")),
          fetch(apiUrl("/api/home/printers"))
        ]);
        const ideasJson = await ideasRes.json();
        const printersJson = await printersRes.json();
        if (Array.isArray(ideasJson)) setIdeasData(ideasJson as Idea[]);
        if (Array.isArray(printersJson)) setPrintersData(printersJson as Printer[]);
      } catch (e) {
        console.error("Error loading home data:", e);
      } finally {
        setHomeLoading(false);
      }
    };
    loadHomeData();
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
    if (!trackingCode.trim()) return;
    const code = trackingCode.trim().toUpperCase();
    router.push(`/track?code=${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Global 3D</span>
              <p className="text-[10px] text-gray-500 -mt-1">Corrientes</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#productos" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Productos</Link>
            <Link href="#ideas" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Ideas</Link>
            <Link href="#impresoras" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Impresoras</Link>
            <Link href="#contacto" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Contacto</Link>
            <CartIcon />

            {user?.role === "admin" ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
                <Link href="/admin" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition">
                  Admin
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition">
                  <LogOut className="w-3 h-3" />
                  Salir
                </button>
              </div>
            ) : (
              <Link href="/admin/login" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition border border-gray-700">
                Ingresar
              </Link>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 md:hidden z-40">
          <Link href="#productos" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Productos</Link>
          <Link href="#ideas" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Ideas</Link>
          <Link href="#impresoras" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Impresoras</Link>
          <Link href="#contacto" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <Link href="/cart" className="block py-3 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Carrito</Link>
        </div>
      )}

      <section className="pt-24 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-8 w-8 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Rastrear Mi Pedido</h2>
            </div>
            <p className="text-gray-400 text-center mb-6 text-sm">Ingresá el código para ver el estado de producción</p>
            <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Ej: JUA-X1Y2Z3"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" disabled={trackingLoading || !trackingCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-900 disabled:text-gray-500 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                Rastrear <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {trackingError && <p className="text-red-400 text-sm text-center mt-3">{trackingError}</p>}
          </div>
        </div>
      </section>

      <HeroSection 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        trackingCode={trackingCode}
        setTrackingCode={setTrackingCode}
        handleTrackOrder={handleTrackOrder}
        handleWhatsAppBuy={handleWhatsAppBuy}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Scroll-Driven Video Section - Apple Style 
         Para activarlo:
         1. Extrae los frames de tu video con: node scripts/extract-frames.js tu-video.mp4
         2. Los frames se guardarán en public/frames/
         3. Descomenta el componente abajo
      */}
      {/* <ScrollVideoPlayer totalFrames={300} width={1920} height={1080} /> */}

      <IdeasGrid ideas={displayIdeas} handleWhatsAppBuy={handleWhatsAppBuy} />

      <section id="impresoras" className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Impresoras 3D</h2>
            <p className="text-gray-400">Vendemos todas las Bambu Lab · Precio incluye distribución</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {printers.map((printer, i) => (
              <div key={i} className="relative group overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:scale-[1.06] hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300">
                <div className="aspect-[4/3] bg-gray-800/50 overflow-hidden">
                  {printer.imageUrl && <img src={printer.imageUrl} alt={printer.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-500" />}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white">{printer.name}</h3>
                  <p className="text-xs text-gray-500">{printer.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xl font-bold text-orange-400">${printer.price.toLocaleString("es-AR")}</span>
                    <button onClick={() => window.open(printer.link, "_blank")}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 shadow-lg shadow-orange-500/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition">Ver Producto</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="productos" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Productos Disponibles</h2>
          </div>
          
          {displayProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar productos..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500">
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
              <a href="https://wa.me/5493794000000?text=Hola! Quiero pedir un producto" target="_blank" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">Consultanos disponibilidad</a>
            </div>
          )}
        </div>
      </section>

      <section id="contacto" className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Contacto</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank" className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center hover:border-green-600 transition group">
              <Phone className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition" />
              <h3 className="font-medium mb-1">WhatsApp</h3>
              <p className="text-gray-500 text-sm">{WHATSAPP_DISPLAY}</p>
            </a>
            <a href="https://instagram.com/global3dcorrientes" target="_blank" className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center hover:border-pink-600 transition group">
              <Instagram className="w-8 h-8 text-pink-500 mx-auto mb-3 group-hover:scale-110 transition" />
              <h3 className="font-medium mb-1">Instagram</h3>
              <p className="text-gray-500 text-sm">@global3dcorrientes</p>
            </a>
            <div className="bg-gray-900 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
              <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-medium mb-1">Ubicación</h3>
              <p className="text-gray-500 text-sm">Corrientes, Argentina</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Global 3D</span>
          </div>
          <p className="text-gray-600 text-sm">© 2024 Global 3D Corrientes. Todos los derechos reservados.</p>
        </div>
      </footer>

      <a href={`https://wa.me/${WHATSAPP_PHONE}`} target="_blank"
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 p-4 rounded-full shadow-lg shadow-green-600/30 z-50 transition hover:scale-110" title="Chatear por WhatsApp">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.162-.173.199-.347.223-.644.075-.197-.103-1.379-1.437-2.612-3.078-.297-.199-.496-.297-.673.15-.176.297-.697.872-1.075.994-.379.123-.646.148-1.143.049-.496-.099-2.425-1.588-3.868-3.012-.298-.298-.497-.447-.696-.447-.02 0-.04 0-.06 0-.2 0-.485.099-.698.298l-1.095 2.697c-.099.297-.022.595.099.793.149.198.397.396.793.495.396.099.793.099 1.141.099.348 0 .695-.099 1.041-.298.349-.198.768-.595.924-.994.099-.299.099-.596.049-.793-.099-.198-.448-1.591-.616-2.137-.149-.546-.298-1.193-.546-1.193z"/>
        </svg>
      </a>
    </div>
  );
}
