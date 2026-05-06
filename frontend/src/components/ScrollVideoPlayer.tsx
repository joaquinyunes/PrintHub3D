"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ScrollVideoPlayerProps {
  frameFolder?: string;
  totalFrames: number;
  width: number;
  height: number;
  videoSrc?: string;
}

export default function ScrollVideoPlayer({
  frameFolder = "/frames",
  totalFrames = 300,
  width = 1920,
  height = 1080,
}: ScrollVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(-1);

  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: HTMLImageElement[] = [];
      const totalToLoad = totalFrames;

      for (let i = 0; i < totalToLoad; i++) {
        const img = new Image();
        const frameNum = String(i + 1).padStart(4, "0");
        img.src = `${frameFolder}/frame_${frameNum}.webp`;
        
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            img.src = `/placeholder.webp`;
            resolve();
          };
        });
        
        loadedImages.push(img);
        const pct = Math.round(((i + 1) / totalToLoad) * 100);
        setProgress(pct);
      }
      
      setImages(loadedImages);
      setLoaded(true);
    };

    loadImages();
  }, [frameFolder, totalFrames]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollRange = viewportHeight * 5;
      
      const scrolled = Math.max(0, -rect.top);
      const scrollFraction = Math.min(1, Math.max(0, scrolled / scrollRange));
      
      const frameIndex = Math.floor(scrollFraction * (totalFrames - 1));
      
      if (frameIndex !== currentFrameRef.current && images[frameIndex]) {
        currentFrameRef.current = frameIndex;
        
        requestAnimationFrame(() => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [loaded, totalFrames, images]);

  const aspectRatio = width / height;

  return (
    <div 
      ref={containerRef}
      className="relative h-[600vh]"
    >
      <div 
        className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden"
        style={{ aspectRatio }}
      >
        {!loaded ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm">
              Cargando frames... {progress}%
            </p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            className="w-full h-full object-contain"
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>
    </div>
  );
}