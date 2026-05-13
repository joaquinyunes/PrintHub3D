"use client";

import { useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface AIImageGeneratorProps {
  onGenerated?: (imageUrl: string) => void;
  prompt?: string;
  size?: "small" | "medium" | "large";
}

export default function AIImageGenerator({ 
  onGenerated, 
  prompt: initialPrompt = "",
  size = "medium"
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    small: "w-24 h-24",
    medium: "w-48 h-48",
    large: "w-64 h-64"
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Ingresá una descripción para la imagen");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/ai/generate-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size })
      });

      if (!res.ok) throw new Error("Error al generar imagen");

      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      onGenerated?.(data.imageUrl);
    } catch (e) {
      setError("No se pudo generar la imagen. Probá más tarde.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {!generatedImage ? (
        <>
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl border-2 border-dashed border-purple-500/50 flex flex-col items-center justify-center p-2`}>
            <Sparkles className="w-8 h-8 text-purple-400 mb-1" />
            <span className="text-xs text-gray-400 text-center">AI Gen</span>
          </div>
          
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Descripción de imagen..."
            className="w-full bg-zinc-800 rounded-lg py-1.5 px-3 text-xs"
          />
          
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {generating ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {generating ? "Generando..." : "Generar con AI"}
          </button>
          
          {error && <span className="text-xs text-red-400">{error}</span>}
        </>
      ) : (
        <div className="relative">
          <img 
            src={generatedImage} 
            alt="AI Generated" 
            className={`${sizeClasses[size]} rounded-xl object-cover`}
          />
          <a 
            href={generatedImage} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-1 right-1 bg-black/70 rounded-full p-1 hover:bg-black/90"
          >
            <Download className="w-3 h-3 text-white" />
          </a>
        </div>
      )}
    </div>
  );
}