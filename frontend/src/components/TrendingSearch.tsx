"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import { Search, ExternalLink, Loader2 } from "lucide-react";

interface TrendItem {
  name: string;
  imageUrl: string;
  category: string;
  price: number;
}

interface TrendingSearchProps {
  onAddProduct?: (item: TrendItem) => void;
}

export default function TrendingSearch({ onAddProduct }: TrendingSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/trends/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        🚀 Buscar Tendencias
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Buscá ideas de productos populares (ej: "soporte celular", "lampara 3d")
      </p>
      
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar tendencias..."
            className="w-full bg-gray-950 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-4 py-3 rounded-xl text-white font-medium"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.map((item, i) => (
            <div
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition group"
            >
              <div className="aspect-square bg-gray-700 relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="p-3">
                <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                <p className="text-orange-400 font-bold">${item.price}</p>
                {onAddProduct && (
                  <button
                    onClick={() => onAddProduct(item)}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-sm"
                  >
                    Agregar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <a
          href="https://wa.me/5493794000000?text=Hola! Quiero suggest una tendencia"
          target="_blank"
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Sugerir una idea
        </a>
      </div>
    </div>
  );
}