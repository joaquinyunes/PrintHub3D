"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Image, Video, Trash2, Upload, CheckCircle2, Loader2, Search } from "lucide-react";
import { apiUrl, resolveMediaUrl } from "@/lib/api";

interface ProductMedia {
  _id: string;
  productName: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'image' | 'video';
}

interface StoredUser { token: string; user: { role: string } }

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<StoredUser | null>(null);

  const [form, setForm] = useState({
    productName: '',
    imageUrl: '',
    videoUrl: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      setSession(user);
      if (user.user.role !== 'admin') {
        router.push('/');
        return;
      }
      loadMedia(user.token);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const loadMedia = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/products/media'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setMedia([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMedia(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); setMedia([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName) return;

    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/products/media'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          productName: form.productName,
          imageUrl: form.imageUrl || undefined,
          videoUrl: form.videoUrl || undefined,
          type: form.videoUrl ? 'video' : 'image'
        })
      });

      if (res.ok) {
        setForm({ productName: '', imageUrl: '', videoUrl: '' });
        loadMedia(session!.token);
      } else {
        alert('Error al agregar');
      }
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    
    try {
      await fetch(apiUrl(`/api/products/media/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.token}` }
      });
      setMedia(media.filter(m => m._id !== id));
    } catch(e) { console.error(e); }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http')) {
        if (text.match(/\.(mp4|webm|mov)$/i)) {
          setForm({ ...form, videoUrl: text });
        } else {
          setForm({ ...form, imageUrl: text });
        }
      }
    } catch(e) { console.error(e); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setForm({ ...form, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      try {
        setSaving(true);
        const response = await fetch(`/api/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });
        const blob = await response.json();
        if (blob.url) {
          setForm({ ...form, videoUrl: blob.url });
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        alert('Error al subir el video');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">Imágenes de Productos</h1>
          <p className="text-gray-500 mt-2">Agrega fotos/videos para cada producto. Se mostrarán cuando el cliente rastree su pedido.</p>
        </div>

        {/* FORM AGREGAR */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Nombre del Producto</label>
              <input
                type="text"
                value={form.productName}
                onChange={e => setForm({ ...form, productName: e.target.value })}
                placeholder="Ej: vaso river, llavero, figura 5cm"
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2">
                <Image size={14}/> Imagen
                <span className="text-blue-400 text-[10px] font-normal normal-case">(URL o Subir)</span>
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500 mb-2"
              />
              <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition">
                <Upload size={14} className="text-gray-400"/>
                <span className="text-sm text-gray-400">Subir desde PC</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2">
                <Video size={14}/> Video
                <span className="text-blue-400 text-[10px] font-normal normal-case">(URL o Subir)</span>
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://... (mp4)"
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500 mb-2"
              />
              <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition">
                <Upload size={14} className="text-gray-400"/>
                <span className="text-sm text-gray-400">Subir video desde PC</span>
                <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              </label>
</div>
          </div>
          <button
            type="submit"
            disabled={saving || !form.productName}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}
            Agregar
          </button>
        </form>

        {/* LISTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map(item => (
            <div key={item._id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 relative group">
              <button
                onClick={() => handleDelete(item._id)}
                className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} className="text-red-400"/>
              </button>
              
              <div className="text-xs font-bold text-gray-400 uppercase mb-2">{item.productName}</div>
              
              {item.type === 'video' && item.videoUrl ? (
                <div className="space-y-2">
                  <video src={resolveMediaUrl(item.videoUrl)} className="w-full h-32 object-cover rounded-lg" controls/>
                  <a 
                    href={resolveMediaUrl(item.videoUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Ver video
                  </a>
                </div>
              ) : item.imageUrl ? (
                <img src={resolveMediaUrl(item.imageUrl)} alt={item.productName} className="w-full h-32 object-cover rounded-lg mb-2"/>
              ) : (
                <div className="w-full h-32 bg-zinc-800 rounded-lg mb-2 flex items-center justify-center">
                  <Image size={32} className="text-zinc-600"/>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-[10px]">
                {item.imageUrl && <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={10}/> Imagen</span>}
                {item.videoUrl && <span className="text-purple-400 flex items-center gap-1"><CheckCircle2 size={10}/> Video</span>}
              </div>
            </div>
          ))}
        </div>

        {media.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Image size={48} className="mx-auto mb-4 opacity-50"/>
            <p>No hay imágenes agregadas</p>
          </div>
        )}
      </div>
    </div>
  );
}