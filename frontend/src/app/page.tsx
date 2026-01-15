"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Box } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  description?: string;
}

interface User {
  name: string;
  role: "admin" | "user";
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ USUARIO
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem("user");
    }

    // 2️⃣ PRODUCTOS (RUTA PÚBLICA CORRECTA)
    const loadProducts = async () => {
      try {
        const res = await fetch(
        
          "http://localhost:5000/api/products/public?tenantId=global3d_hq" // ✅ CORRECTO: Coincide con tu product.routes.ts
        );

        if (!res.ok) {
          console.error("Error HTTP:", res.status);
          setProducts([]);
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.warn("La API no devolvió un array:", data);
          setProducts([]);
        }
      } catch (err) {
        console.error("Error de conexión:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleWhatsAppBuy = (product: Product) => {
    const phone = "5493794000000";
    const text = `Hola! 👋 Quiero comprar: *${product.name}* ($${product.price}).`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Global 3D
          </span>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300 hidden md:block">
                {user.name}
              </span>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase"
                >
                  Panel Admin
                </Link>
              )}

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/admin/login";
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link href="/admin/login" className="text-sm text-gray-300">
              Ingresar
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <header className="pt-32 pb-12 text-center">
        <h1 className="text-5xl font-bold mb-4">Catálogo Online</h1>
        <p className="text-gray-400">Modelos 3D de alta calidad</p>
      </header>

      {/* PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <p className="text-center text-gray-500">
            Cargando catálogo...
          </p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-zinc-900 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition"
              >
                <div className="aspect-square bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Box />
                    </div>
                  )}
                </div>

                <h3 className="font-bold truncate">{product.name}</h3>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-lg font-bold text-blue-400">
                    ${product.price}
                  </span>
                  <button
                    onClick={() => handleWhatsAppBuy(product)}
                    className="bg-white text-black p-2 rounded-lg hover:bg-gray-200"
                  >
                    <ShoppingCart size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-gray-500">
              No hay productos disponibles.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
