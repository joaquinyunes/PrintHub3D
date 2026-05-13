"use client";

import React, { useState } from "react";
import { MotionDiv } from "./MotionDiv";
import { ExternalLink, ShoppingCart, TrendingUp } from "lucide-react";

interface Idea {
  name: string;
  icon?: string;
  downloads?: string;
  desc?: string;
  link?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  price?: number;
  trending?: boolean;
  category?: string;
}

interface IdeasGridProps {
  ideas: Idea[];
  handleWhatsAppBuy: (item: Idea) => void;
}

export default function IdeasGrid({ ideas, handleWhatsAppBuy }: IdeasGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState<Record<number, number>>({});

  const getImage = (idea: Idea, index: number) => {
    const images = idea.images || [];
    if (images.length > 0) {
      const imgIdx = currentImageIdx[index] || 0;
      return images[imgIdx] || idea.imageUrl || idea.image;
    }
    return idea.imageUrl || idea.image || "https://images.unsplash.com/photo-1616348436918-d227853a0d4c?w=400&h=400&fit=crop";
  };

  return (
    <section id="ideas" className="py-20 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            ¿Qué podés imprimir?
          </h2>
          <p className="text-gray-400 text-lg">Encontrá el modelo perfecto en MakerWorld · Precio incluye impresión</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {ideas.map((idea, i) => {
            const images = idea.images || [];
            const allImages = [idea.imageUrl || idea.image, ...images].filter(Boolean);
            
            return (
              <MotionDiv 
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4, delay: i * 0.05 }}
                onMouseEnter={() => {
                  setHoveredIndex(i);
                  if (allImages.length > 1) {
                    const nextIdx = ((currentImageIdx[i] || 0) + 1) % allImages.length;
                    setCurrentImageIdx(prev => ({ ...prev, [i]: nextIdx }));
                  }
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-3xl hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
              >
                {idea.trending && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </div>
                )}
                
                <div className="aspect-square overflow-hidden bg-zinc-900/50">
                  <img 
                    src={getImage(idea, i)} 
                    alt={idea.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {allImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
                      {allImages.map((_, idx) => (
                        <span key={idx} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === (currentImageIdx[i] || 0) ? 'bg-white scale-125' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{idea.icon || "📦"}</span>
                    <h3 className="text-base font-bold text-white truncate">{idea.name}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs text-gray-400">{idea.category || "Accesorios"}</span>
                      <p className="text-sm text-gray-500">{idea.downloads || idea.desc} descargas</p>
                    </div>
                    <span className="text-lg font-black text-blue-400">${idea.price || 0}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {idea.link && (
                      <a 
                        href={idea.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver
                      </a>
                    )}
                    <button 
                      onClick={() => handleWhatsAppBuy(idea)} 
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-green-500/30 transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Pedir
                    </button>
                  </div>
                </div>
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000" />
                </div>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}