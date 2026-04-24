"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Box, Search, ArrowRight, Package, CheckCircle, Instagram, Facebook, Youtube, MapPin, Phone, Mail, ExternalLink, LogOut, User, Menu, X } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  description?: string;
}

interface Printer {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  description?: string;
}

interface User {
  token?: string;
  user?: {
    id?: string;
    name?: string;
    role: string;
    email?: string;
  };
  name?: string;
  role?: string;
  email?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("user");
    }

    const loadData = async () => {
      try {
        const [productsRes, printersRes] = await Promise.all([
          fetch(apiUrl("/api/products/public?tenantId=global3d_hq")),
          fetch(apiUrl("/api/products/public?category=Impresoras&tenantId=global3d_hq"))
        ]);

        const productsData = await productsRes.json();
        const printersData = await printersRes.json();

        setProducts(Array.isArray(productsData) ? productsData : []);
        setPrinters(Array.isArray(printersData) ? printersData : []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/";
  };

  const handleWhatsAppBuy = (product: Product) => {
    const phone = "5493794000000";
    const text = `Hola! 👋 Quiero comprar: *${product.name}* ($${product.price}).`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    
    setTrackingLoading(true);
    setTrackingError("");
    
    try {
      const code = trackingCode.trim().toUpperCase();
      router.push(`/track?code=${encodeURIComponent(code)}`);
    } catch (err: any) {
      setTrackingError(err.message);
    } finally {
      setTrackingLoading(false);
    }
  };

  const ideas = [
    { name: "iPhone Stand", category: "Organizers", icon: "����", downloads: "15k+", desc: "Popular phone stand" },
    { name: "Under Desk Drawer", category: "Storage", icon: "🗄️", downloads: "12k+", desc: "Hidden storage" },
    { name: "OTF Fidget", category: "Toys", icon: "🎯", downloads: "10k+", desc: "On-the-fly fidget" },
    { name: "Cable Wrapper", category: "Organizers", icon: "🔌", downloads: "8k+", desc: "Cable management" },
    { name: "Filament Clip", category: "Accessories", icon: "🎞️", downloads: "7k+", desc: "Universal clip" },
    { name: "Capybara", category: "Toys", icon: "🦫", downloads: "5k+", desc: "Wind-up walking" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo completo como botón */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Global 3D
              </span>
              <p className="text-[10px] text-gray-500 -mt-1">Corrientes</p>
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#productos" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Productos</Link>
            <Link href="/#ideas" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Ideas</Link>
            <Link href="/#impresoras" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Impresoras</Link>
            <Link href="/#contacto" className="text-gray-300 hover:text-white text-sm font-medium transition hover:text-blue-400">Contacto</Link>
            
            {user && user.user?.role === "admin" ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg shadow-blue-600/20"
                >
                  Admin
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition"
                >
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

          {/* Mobile menu */}
          <button 
            className="md:hidden p-2" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-gray-900 border-b border-gray-800 p-4 md:hidden z-40">
          <Link href="/#productos" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Productos</Link>
          <Link href="/#ideas" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Ideas</Link>
          <Link href="/#impresoras" className="block py-3 text-gray-300 hover:text-white border-b border-gray-800" onClick={() => setMenuOpen(false)}>Impresoras</Link>
          <Link href="/#contacto" className="block py-3 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <div className="mt-4 pt-4 border-t border-gray-800">
            {user ? (
              <>
                <p className="text-sm text-gray-400 mb-2">{user.name}</p>
                {user.role === "admin" && (
                  <Link href="/admin" className="block py-2 text-blue-400 font-medium" onClick={() => setMenuOpen(false)}>Panel Admin</Link>
                )}
                <button onClick={handleLogout} className="block py-2 text-red-400">Cerrar sesión</button>
              </>
            ) : (
              <Link href="/admin/login" className="block py-2 text-blue-400 font-medium" onClick={() => setMenuOpen(false)}>Ingresar</Link>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN RASTREAR PRODUCTO */}
      <section className="pt-24 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="h-8 w-8 text-blue-400" />
              <h2 className="text-xl md:text-2xl font-bold text-white">Rastrear Mi Pedido</h2>
            </div>
            
            <p className="text-gray-400 text-center mb-6 text-sm">
              Ingresá el código para ver el estado de producción
            </p>
            
            <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ej: JUA-X1Y2Z3"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={trackingLoading || !trackingCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                {trackingLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    Rastrear
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            
            {trackingError && (
              <p className="text-red-400 text-sm text-center mt-3">{trackingError}</p>
            )}
          </div>
        </div>
      </section>

      {/* HERO */}
      <header className="pt-16 pb-8 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Catálogo Online
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Modelos 3D personalizados de alta calidad
        </p>
        
        {/* CONFIANZA */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mt-6">
          <span className="flex items-center gap-1">⭐ <span className="text-yellow-400">4.9/5</span> clientes</span>
          <span className="flex items-center gap-1">📦 <span className="text-green-400">+150</span> pedidos entregados</span>
          <span className="flex items-center gap-1">🚚 Entrega en <span className="text-blue-400">24-72hs</span></span>
          <span className="flex items-center gap-1">🛡️ Garantía de calidad</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="#productos" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition flex items-center gap-2">
            Ver Catálogo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="https://wa.me/5493794000000?text=Hola! Quiero info sobre impresiones 3D" 
            target="_blank"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition flex items-center gap-2"
          >
            Consultar
          </a>
        </div>
      </header>

      {/* IDEAS SECTION */}
      <section id="ideas" className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              ¿Qué podés imprimir?
            </h2>
            <p className="text-gray-400">
              Mirá nuestras ideas o pedí el tuyo propio
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {ideas.map((idea, i) => (
              <Link
                key={i}
                href="#productos"
                className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 text-center hover:bg-gray-800/50 transition group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition">{idea.icon}</div>
                <h3 className="font-medium text-white text-sm">{idea.name}</h3>
                <p className="text-xs text-gray-500">{idea.downloads} downloads</p>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a 
              href="https://wa.me/5493794000000?text=Hola! Tengo una idea para imprimir" 
              target="_blank"
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              ¿Tenés una idea? Consultanos
            </a>
          </div>
        </div>
      </section>

      {/* IMPRESORAS SECTION */}
      <section id="impresoras" className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Impresoras 3D
            </h2>
            <p className="text-gray-400">
              Vendemos impresoras Bambu Lab y accesorios
            </p>
          </div>
          
          {printers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {printers.map((printer, i) => (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition group"
                >
                  <div className="aspect-[4/3] bg-gray-800 relative overflow-hidden">
                    {printer.imageUrl ? (
                      <img src={printer.imageUrl} alt={printer.name} className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Box className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate mb-1">{printer.name}</h3>
                    <p className="text-xs text-gray-500">{printer.description || printer.category}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-orange-400">${printer.price}</span>
                      <button
                        onClick={() => {
                          const phone = "5493794000000";
                          const text = `Hola! Quiero info sobre: *${printer.name}*`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">Próximamente impresoras disponibles</p>
              <a 
                href="https://wa.me/5493794000000?text=Hola! Quiero info sobre impresoras 3D" 
                target="_blank"
                className="text-orange-400 hover:text-orange-300"
              >
                Consultanos availability
              </a>
            </div>
          )}
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Productos Disponibles
            </h2>
          </div>
          
          {/* BUSCADOR Y FILTRO */}
          {products.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          
          {loading ? (
            <p className="text-center text-gray-500">
              Cargando catálogo...
            </p>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition group"
                >
                  <div className="aspect-square bg-gray-800 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Box className="w-16 h-16" />
                      </div>
                    )}
                    {/* BADGE CATEGORÍA */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-xs text-gray-300">
                        {product.category}
                      </span>
                    </div>
                    {/* BADGE OFERTA */}
                    {product.price > 5000 && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          🔥 Oferta
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold truncate mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {product.description || "Personalizado"}
                    </p>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-blue-400">
                        ${product.price}
                      </span>
                      <button
                        onClick={() => handleWhatsAppBuy(product)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl transition"
                        title="Comprar por WhatsApp"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">
                No hay productos disponibles.
              </p>
              <a 
                href="https://wa.me/5493794000000?text=Hola! Quiero pedir un producto" 
                target="_blank"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
              >
                Consultanos disponibilidad
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Contacto
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a 
              href="https://wa.me/5493794000000"
              target="_blank"
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-green-600 transition group"
            >
              <Phone className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition" />
              <h3 className="font-medium mb-1">WhatsApp</h3>
              <p className="text-gray-500 text-sm">+54 9379 4000000</p>
            </a>
            
            <a 
              href="https://instagram.com/global3dcorrientes"
              target="_blank"
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-pink-600 transition group"
            >
              <Instagram className="w-8 h-8 text-pink-500 mx-auto mb-3 group-hover:scale-110 transition" />
              <h3 className="font-medium mb-1">Instagram</h3>
              <p className="text-gray-500 text-sm">@global3dcorrientes</p>
            </a>
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
              <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-medium mb-1">Ubicación</h3>
              <p className="text-gray-500 text-sm">Corrientes, Argentina</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Global 3D
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2024 Global 3D Corrientes. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <a
        href="https://wa.me/5493794000000"
        target="_blank"
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 p-4 rounded-full shadow-lg shadow-green-600/30 z-50 transition hover:scale-110"
        title="Chatear por WhatsApp"
      >
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.162-.173.199-.347.223-.644.075-.197-.103-1.379-1.437-2.612-3.078-.297-.199-.496-.297-.673.15-.176.297-.697.872-1.075.994-.379.123-.646.148-1.143.049-.496-.099-2.425-1.588-3.868-3.012-.298-.298-.497-.447-.696-.447-.02 0-.04 0-.06 0-.2 0-.485.099-.698.298l-1.095 2.697c-.099.297-.022.595.099.793.149.198.397.396.793.495.396.099.793.099 1.141.099.348 0 .695-.099 1.041-.298.349-.198.768-.595.924-.994.099-.299.099-.596.049-.793-.099-.198-.448-1.591-.616-2.137-.149-.546-.298-1.193-.546-1.193z"/>
        </svg>
      </a>
    </div>
  );
}