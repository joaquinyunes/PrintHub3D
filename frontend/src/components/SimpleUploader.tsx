"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Video, X, Loader2 } from "lucide-react";

interface SimpleUploaderProps {
  value: string;
  onChange: (url: string) => void;
  type: "image" | "video";
  label?: string;
}

export default function SimpleUploader({ value, onChange, type, label }: SimpleUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
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

  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isVideo = value?.match(/\.(mp4|webm|mov)$/i);

  if (value) {
    return (
      <div className="relative group rounded-lg overflow-hidden h-10">
        {isVideo ? (
          <video src={value} className="w-full h-full object-cover" />
        ) : isImage ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
            {type === 'video' ? <Video className="w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>}
          </div>
        )}
        <button
          onClick={() => onChange("")}
          className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={type === "image" ? "image/*" : "video/*"}
        onChange={handleUpload}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-1.5 px-2 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-white transition"
      >
        {uploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : type === "video" ? (
          <>
            <Video className="w-3 h-3" />
            <span>Subir video</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-3 h-3" />
            <span>Subir</span>
          </>
        )}
      </button>
    </div>
  );
}