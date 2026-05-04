import React from "react";
import TrendingSearch from "./TrendingSearch";
import { Idea } from "@/types";
import { MotionDiv } from "./MotionDiv";

interface IdeasGridProps {
  ideas: Idea[];
  handleWhatsAppBuy: (item: Idea) => void;
}

export default function IdeasGrid({ ideas, handleWhatsAppBuy }: IdeasGridProps) {
  return (
    <section id="ideas" className="py-16 px-4 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">¿Qué podés imprimir?</h2>
          <p className="text-gray-400">Modelos populares de MakerWorld · Precio incluye impresión</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {ideas.map((idea, i) => (
            <MotionDiv key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative group overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl hover:scale-[1.06] hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000" />
              </div>
              <div className="aspect-square overflow-hidden">
                {idea.image && <img src={idea.image} alt={idea.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-white truncate">{idea.name}</h3>
                <p className="text-xs text-gray-500">{idea.downloads} downloads</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-blue-400 font-bold">${idea.price}</span>
                  <button onClick={() => handleWhatsAppBuy(idea)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-green-500/30 text-white px-2 py-1 rounded text-xs">Pedir</button>
                </div>
              </div>
              {idea.trending && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">🔥 Trending</span>
              )}
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
