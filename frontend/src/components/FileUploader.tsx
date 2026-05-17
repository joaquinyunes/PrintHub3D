"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Video } from "lucide-react";

interface FileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  type?: "image" | "video" | "any";
  label?: string;
}

export default function FileUploader({ value, onChange, type = "image", label }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      onChange(data.url);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Error al subir: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === "image" && !file.type.startsWith("image/")) return;
      if (type === "video" && !file.type.startsWith("video/")) return;
      handleUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const isVideo = value?.match(/\.(mp4|webm|mov|avi)$/i) || type === "video";
  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || type === "image";

  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-gray-500 block">{label}</label>}
      
      {value ? (
        <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
          {isVideo ? (
            <video src={value} className="w-full h-32 object-cover" />
          ) : (
            <img src={value} alt="Preview" className="w-full h-32 object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragOver 
              ? "border-blue-500 bg-blue-500/10" 
              : "border-white/10 hover:border-white/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={type === "image" ? "image/*" : type === "video" ? "video/*" : "image/*,video/*"}
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              {type === "video" ? (
                <Video className="w-8 h-8" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
              <span className="text-sm">Click or drag to upload</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}