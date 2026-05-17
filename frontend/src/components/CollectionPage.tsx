"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WHATSAPP_PHONE } from "@/lib/config";

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imageHover?: string;
  videoUrl?: string;
  enabled?: boolean;
  effects?: string;
  animations?: string;
  stock?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  description?: string;
}

interface SearchOptions {
  enabled?: boolean;
  placeholder?: string;
  sortOptions?: string[];
  filterOptions?: string[];
}

interface CollectionPageProps {
  title: string;
  subtitle: string;
  badge: string;
  categories: Category[];
  products: ProductItem[];
  accentColor?: string;
  heroImage?: string;
  searchOptions?: SearchOptions;
}

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "amber" | "red" }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
}

function ProductCard({ product, category, onSelect }: { product: ProductItem; category?: Category; onSelect: (p: ProductItem) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(product)}
    >
      <div 
        className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[4/5] mb-3"
        style={{ boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.2)", transition: "box-shadow 0.4s ease" }}
      >
        {product.imageUrl ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
              style={{ opacity: hovered && product.imageHover ? 0 : 1, transform: hovered ? "scale(1.06)" : "scale(1)" }}
            />
            {product.imageHover && (
              <img
                src={product.imageHover}
                alt={product.name + " hover"}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                style={{ opacity: hovered ? 1 : 0, transform: hovered ? "scale(1.04)" : "scale(1.1)" }}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {category?.icon || "📦"}
          </div>
        )}
        
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent transition-opacity duration-400"
          style={{ opacity: hovered ? 1 : 0 }}
        />

        <div 
          className="absolute bottom-4 left-4 right-4 transition-all duration-400"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(8px)" }}
        >
          <a
            href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! Quiero info sobre: ${product.name}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="block w-full py-2.5 bg-white text-black text-sm font-bold rounded-xl text-center hover:bg-gray-100 transition"
          >
            Consultar por WhatsApp
          </a>
        </div>

        {!product.enabled && (
          <div className="absolute top-3 left-3">
            <span className="bg-gray-900/90 text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium">Oculto</span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500/90 text-white text-xs px-2.5 py-1 rounded-full font-medium">Sin stock</span>
          </div>
        )}
      </div>

      <div className="px-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            {category && (
              <p className="text-gray-500 text-xs mb-0.5">{category.icon} {category.name}</p>
            )}
            <h3 className="font-bold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors duration-300">{product.name}</h3>
          </div>
          <span className="text-white font-black text-sm whitespace-nowrap">${product.price?.toLocaleString()}</span>
        </div>
        {product.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-1">{product.description}</p>
        )}
      </div>
    </motion.article>
  );
}

function ProductModal({ product, category, onClose }: { product: ProductItem; category?: Category; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] bg-gray-800">
          {product.videoUrl ? (
            <video src={product.videoUrl} controls className="w-full h-full object-cover" />
          ) : product.imageHover ? (
            <img src={product.imageHover} alt={product.name} className="w-full h-full object-cover" />
          ) : product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {category?.icon || "📦"}
            </div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition">
            <span className="text-white text-lg leading-none">×</span>
          </button>
        </div>
        <div className="p-6">
          {category && <Badge color="amber">{category.icon} {category.name}</Badge>}
          <h2 className="text-2xl font-black text-white mt-3 mb-2">{product.name}</h2>
          {product.description && <p className="text-gray-400 mb-4">{product.description}</p>}
          {product.effects && (
            <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <span className="text-purple-400 text-sm font-bold">✨ Efectos: </span>
              <span className="text-gray-300 text-sm">{product.effects}</span>
            </div>
          )}
          {product.animations && (
            <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-blue-400 text-sm font-bold">🎬 Animaciones: </span>
              <span className="text-gray-300 text-sm">{product.animations}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <span className="text-4xl font-black text-white">${product.price?.toLocaleString()}</span>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 5 && <Badge color="red">¡Solo {product.stock} disponibles!</Badge>}
            {product.stock === -1 && <Badge color="green">Disponible</Badge>}
          </div>
          <a 
            href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! Me interesa: ${product.name} ($${product.price?.toLocaleString()})`}
            target="_blank"
            className="block w-full py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-center text-lg transition"
          >
            💬 Consultar por WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CollectionPage({ title, subtitle, badge, categories, products, accentColor = "#3b82f6", heroImage, searchOptions }: CollectionPageProps) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [scrolled, setScrolled] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState(500);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    if (heroRef.current) {
      setHeroHeight(heroRef.current.offsetHeight);
    }
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const flatProducts = products.filter(p => p.enabled === undefined || p.enabled !== false);
  const sortOpts = searchOptions?.sortOptions || ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'];
  const filterOpts = searchOptions?.filterOptions || ['searchByName', 'searchByDescription', 'filterByPrice'];

  const filtered = flatProducts
    .filter(p => selectedCat === "all" || p.categoryId === selectedCat)
    .filter(p => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const nameMatch = filterOpts.includes('searchByName') && p.name?.toLowerCase().includes(searchLower);
      const descMatch = filterOpts.includes('searchByDescription') && p.description?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch;
    })
    .sort((a, b) => {
      if (sort === "price_asc" && sortOpts.includes('price_asc')) return a.price - b.price;
      if (sort === "price_desc" && sortOpts.includes('price_desc')) return b.price - a.price;
      if (sort === "name_asc" && sortOpts.includes('name_asc')) return a.name.localeCompare(b.name);
      if (sort === "name_desc" && sortOpts.includes('name_desc')) return b.name.localeCompare(a.name);
      if (sort === "newest" && sortOpts.includes('newest')) return 0;
      return a.name.localeCompare(b.name);
    });

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO SECTION CON IMAGEN DE FONDO Y PARALLAX */}
      <div 
        ref={heroRef}
        className="relative h-[500px] overflow-hidden"
      >
        {/* Imagen de fondo con parallax */}
        {heroImage ? (
          <div 
            className="absolute inset-0 w-full"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: scrolled ? '100%' : '120%',
              transform: scrolled ? 'translateY(0)' : 'translateY(-10%)',
              transition: 'transform 0.3s ease-out, height 0.3s ease-out'
            }}
          />
        ) : (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20 0%, #1a1a2e 50%, #16213e 100%)`
            }}
          />
        )}
        
        {/* Overlay para que el texto sea legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black" />
        
        {/* Contenido del hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span 
              className="inline-block px-4 py-1.5 text-xs font-bold rounded-full border mb-5"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` }}
            >
              {badge}
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-[0.9] tracking-tight">
              {title}
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-xl mx-auto">{subtitle}</p>
          </motion.div>
        </div>

        {/* Indicador de scroll */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS - FIJA ABAJO DEL HERO */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchOptions?.placeholder || "Buscar..."}
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-2xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition [&>option]:bg-gray-900 appearance-none cursor-pointer"
            >
              {sortOpts.includes('name_asc') && <option value="name_asc">Nombre A–Z</option>}
              {sortOpts.includes('name_desc') && <option value="name_desc">Nombre Z–A</option>}
              {sortOpts.includes('price_asc') && <option value="price_asc">Menor precio</option>}
              {sortOpts.includes('price_desc') && <option value="price_desc">Mayor precio</option>}
              {sortOpts.includes('newest') && <option value="newest">Más recientes</option>}
            </select>
            <span className="text-gray-600 text-sm py-3.5 whitespace-nowrap self-center">{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* CATEGORÍAS ABAJO DE LA BARRA DE BÚSQUEDA */}
          {categories.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button 
                onClick={() => setSelectedCat("all")}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCat === "all" ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
              >
                Todos
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedCat(c.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCat === c.id ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"}`}
                >
                  <span>{c.icon}</span> {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Sin resultados</h2>
            <p className="text-gray-500">Probá con otra búsqueda o categoría.</p>
            <button 
              onClick={() => { setSearch(""); setSelectedCat("all"); }} 
              className="mt-6 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-sm transition"
            >
              Ver todos los productos
            </button>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  category={getCategoryById(p.categoryId)}
                  onSelect={setSelectedProduct}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* FOOTER CTA */}
      <section className="border-t border-gray-900 py-16 px-6 text-center">
        <p className="text-gray-500 text-sm mb-3">¿No encontrás lo que buscás?</p>
        <a 
          href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola! Quiero información sobre productos`} 
          target="_blank"
          className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-lg transition"
        >
          💬 Consultanos por WhatsApp
        </a>
      </section>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            category={getCategoryById(selectedProduct.categoryId)}
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}