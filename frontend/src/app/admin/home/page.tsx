"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { Plus, X, Trash2, ChevronDown, ChevronRight, Upload, Image as ImageIcon, Save, Loader2 } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  /** Texto corto que se muestra en la web al abrir la categoría */
  description?: string;
  /** URL de video opcional (ej. /uploads/....mp4) para mostrar en la ficha */
  videoUrl?: string;
}

interface ProductSubCategory {
  id: string;
  name: string;
  products: ProductItem[];
}

interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  subCategories: ProductSubCategory[];
}

interface CustomCode {
  code: string;
  name: string;
  videoUrl: string;
}

interface HomeSections {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  heroStats: { reviews: string; reviewsCount: string; orders: string; delivery: string };
  heroFeatures: string[];
  ideas: any[];
  productStar: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    price: string;
    originalPrice: string;
    teams: string[];
  };
  copaAnimation: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    price: string;
    accentColor: string;
    framesDir: string;
    totalFrames: number;
  };
  impresoraAnimation: {
    enabled: boolean;
    title: string;
    subtitle: string;
    badge: string;
    price: string;
    accentColor: string;
    framesDir: string;
    totalFrames: number;
  };
  printers: any[];
  printersTitle: string;
  printersSubtitle: string;
  productCategories: ProductCategory[];
  customCodes: CustomCode[];
}

export default function HomeSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ token: string; user: { role: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<HomeSections>({
    heroTitle: 'Global 3D',
    heroSubtitle: 'Transformamos tus ideas en objetos reales.',
    heroDescription: 'Impresión 3D de alta calidad en Corrientes',
    heroBadge: 'Envíos gratis en pedidos mayores a $50.000',
    heroStats: { reviews: '4.9', reviewsCount: '200+ reseñas', orders: '500+', delivery: '24-72h' },
    heroFeatures: ['Impresión rápida', 'Calidad premium', 'Envío rápido', 'Soporte 24/7'],
    ideas: [],
    productStar: {
      enabled: true,
      title: 'Vaso Personalizado River Plate',
      subtitle: 'Impresión 3D de alta calidad con el escudo de tu equipo favorito.',
      badge: '🔥 #1 MÁS VENDIDO',
      price: '$3.500',
      originalPrice: '$4.500',
      teams: ['Boca', 'Racing', 'Independiente', 'Huracán']
    },
    copaAnimation: {
      enabled: true,
      title: 'Copa de la Liga',
      subtitle: 'Diseño 3D de alta calidad con detalles premium',
      badge: '🏆 TROFEO PREMIUM',
      price: '$12.500',
      accentColor: '#f59e0b',
      framesDir: '/frames-copakling/',
      totalFrames: 73
    },
    impresoraAnimation: {
      enabled: true,
      title: 'Impresora 3D Bambu Lab X1C',
      subtitle: 'La nueva generación de precisión y velocidad',
      badge: '🖨️ PROFESIONAL',
      price: '$469.000',
      accentColor: '#3b82f6',
      framesDir: '/frames-mp/',
      totalFrames: 192
    },
    printers: [],
    printersTitle: 'Impresoras 3D',
    printersSubtitle: 'Vendemos impresoras Bambu Lab y accesorios',
    productCategories: [
      {
        id: 'productos',
        name: 'Productos',
        icon: '🎯',
        imageUrl: '',
        subCategories: [
          { id: 'porta-latas', name: 'Porta Latas', products: [] },
          { id: 'vasos', name: 'Vasos', products: [] },
          { id: 'guardador-figuritas', name: 'Guardador de Figuritas', products: [] },
          { id: 'llaveros', name: 'Llaveros', products: [] },
          { id: 'trofeos', name: 'Trofeos', products: [] }
        ]
      },
      {
        id: 'otros-productos',
        name: 'Otros Productos',
        icon: '🎮',
        imageUrl: '',
        subCategories: [
          { id: 'funkos', name: 'Funkos', products: [] },
          { id: 'juegos', name: 'Juegos', products: [] }
        ]
      }
    ],
    customCodes: []
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
      loadSettings(user.token);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const loadSettings = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/settings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.homepageSections) {
        setSections(prev => ({
          ...prev,
          ...data.homepageSections
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({ homepageSections: sections })
});
      alert("Guardado!");
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const addPrinter = () => {
    setSections(prev => ({
      ...prev,
      printers: [...prev.printers, { name: '', description: '', imageUrl: '', price: 0, link: '' }]
    }));
  };

  const updatePrinter = (index: number, field: string, value: string | number) => {
    const newPrinters = [...sections.printers];
    newPrinters[index] = { ...newPrinters[index], [field]: value };
    setSections(prev => ({ ...prev, printers: newPrinters }));
  };

  const removePrinter = (index: number) => {
    setSections(prev => ({
      ...prev,
      printers: prev.printers.filter((_, i) => i !== index)
    }));
  };

  const addProductCategory = () => {
    setSections(prev => ({
      ...prev,
      productCategories: [
        ...prev.productCategories,
        { id: Date.now().toString(), name: '', icon: '📦', subCategories: [] }
      ]
    }));
  };

  const updateProductCategory = (index: number, field: keyof ProductCategory, value: string) => {
    const newCategories = [...sections.productCategories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const removeProductCategory = (index: number) => {
    setSections(prev => ({
      ...prev,
      productCategories: prev.productCategories.filter((_, i) => i !== index)
    }));
  };

  const addSubCategory = (catIndex: number) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories.push({
      id: Date.now().toString(),
      name: '',
      products: []
    });
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const updateSubCategory = (catIndex: number, subIndex: number, field: keyof ProductSubCategory, value: string) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories[subIndex] = {
      ...newCategories[catIndex].subCategories[subIndex],
      [field]: value
    };
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const removeSubCategory = (catIndex: number, subIndex: number) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories.splice(subIndex, 1);
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const addProductToSubCategory = (catIndex: number, subIndex: number) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories[subIndex].products.push({
      id: Date.now().toString(),
      name: '',
      price: 0,
      description: '',
      videoUrl: ''
    });
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const updateProductInSubCategory = (catIndex: number, subIndex: number, prodIndex: number, field: keyof ProductItem, value: string | number) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories[subIndex].products[prodIndex] = {
      ...newCategories[catIndex].subCategories[subIndex].products[prodIndex],
      [field]: value
    };
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const handleProductVideoUpload = async (catIndex: number, subIndex: number, prodIndex: number, file: File) => {
    if (!session) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(apiUrl('/api/settings/upload-image'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData
      });
      const data = await res.json();
      updateProductInSubCategory(catIndex, subIndex, prodIndex, 'videoUrl', data.imageUrl || '');
    } catch (e) {
      console.error(e);
      alert('Error al subir video');
    }
  };

  const removeProductFromSubCategory = (catIndex: number, subIndex: number, prodIndex: number) => {
    const newCategories = [...sections.productCategories];
    newCategories[catIndex].subCategories[subIndex].products.splice(prodIndex, 1);
    setSections(prev => ({ ...prev, productCategories: newCategories }));
  };

  const handleCategoryImageUpload = async (catIndex: number, file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      const newCategories = [...sections.productCategories];
      newCategories[catIndex].imageUrl = imageUrl;
      setSections(prev => ({ ...prev, productCategories: newCategories }));
    } catch (e) {
      console.error(e);
      alert('Error al subir imagen');
    }
};

  const addCustomCode = () => {
    setSections(prev => ({
      ...prev,
      customCodes: [...prev.customCodes, { code: '', name: '', videoUrl: '' }]
    }));
  };

  const updateCustomCode = (index: number, field: keyof CustomCode, value: string) => {
    const newCodes = [...sections.customCodes];
    newCodes[index] = { ...newCodes[index], [field]: value };
    setSections(prev => ({ ...prev, customCodes: newCodes }));
  };

  const removeCustomCode = (index: number) => {
    setSections(prev => ({
      ...prev,
      customCodes: prev.customCodes.filter((_, i) => i !== index)
    }));
  };

  const handleVideoUpload = async (index: number, file: File) => {
    if (!session) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(apiUrl('/api/settings/upload-image'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData
      });
      const data = await res.json();
      const newCodes = [...sections.customCodes];
      newCodes[index].videoUrl = data.imageUrl;
      setSections(prev => ({ ...prev, customCodes: newCodes }));
    } catch (e) {
      console.error(e);
      alert('Error al subir video');
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!session) return '';
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(apiUrl('/api/settings/upload-image'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: formData
    });
    const data = await res.json();
    return data.imageUrl;
  };

  const uploadPrinterImage = async (index: number, file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      const newPrinters = [...sections.printers];
      newPrinters[index].imageUrl = imageUrl;
      setSections(prev => ({ ...prev, printers: newPrinters }));
    } catch (e) {
      console.error(e);
      alert('Error al subir imagen');
    }
  };

  const handleProductImageUpload = async (catIndex: number, subIndex: number, prodIndex: number, file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      const newCategories = [...sections.productCategories];
      newCategories[catIndex].subCategories[subIndex].products[prodIndex].imageUrl = imageUrl;
      setSections(prev => ({ ...prev, productCategories: newCategories }));
    } catch (e) {
      console.error(e);
      alert('Error al subir imagen');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase">Configurar Inicio</h1>
            <p className="text-gray-500">Edita las secciones de la página principal</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>

        {/* HERO SECTION */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Sección Hero</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título principal</label>
              <input
                type="text"
                value={sections.heroTitle}
                onChange={e => setSections(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Global 3D"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
              <input
                type="text"
                value={sections.heroSubtitle}
                onChange={e => setSections(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Transformamos tus ideas en objetos reales."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Descripción</label>
              <input
                type="text"
                value={sections.heroDescription}
                onChange={e => setSections(prev => ({ ...prev, heroDescription: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Impresión 3D de alta calidad en Corrientes"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Badge (promo)</label>
              <input
                type="text"
                value={sections.heroBadge}
                onChange={e => setSections(prev => ({ ...prev, heroBadge: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Envíos gratis en pedidos mayores a $50.000"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Reviews (número)</label>
              <input
                type="text"
                value={sections.heroStats.reviews}
                onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, reviews: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="4.9"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Reviews count</label>
              <input
                type="text"
                value={sections.heroStats.reviewsCount}
                onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, reviewsCount: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="200+ reseñas"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Pedidos</label>
              <input
                type="text"
                value={sections.heroStats.orders}
                onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, orders: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="500+"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Entrega</label>
              <input
                type="text"
                value={sections.heroStats.delivery}
                onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, delivery: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="24-72h"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Feature 1</label>
              <input
                type="text"
                value={sections.heroFeatures[0]}
                onChange={e => setSections(prev => ({ ...prev, heroFeatures: [e.target.value, prev.heroFeatures[1], prev.heroFeatures[2], prev.heroFeatures[3]] }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Impresión rápida"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Feature 2</label>
              <input
                type="text"
                value={sections.heroFeatures[1]}
                onChange={e => setSections(prev => ({ ...prev, heroFeatures: [prev.heroFeatures[0], e.target.value, prev.heroFeatures[2], prev.heroFeatures[3]] }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Calidad premium"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Feature 3</label>
              <input
                type="text"
                value={sections.heroFeatures[2]}
                onChange={e => setSections(prev => ({ ...prev, heroFeatures: [prev.heroFeatures[0], prev.heroFeatures[1], e.target.value, prev.heroFeatures[3]] }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Envío rápido"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Feature 4</label>
              <input
                type="text"
                value={sections.heroFeatures[3]}
                onChange={e => setSections(prev => ({ ...prev, heroFeatures: [prev.heroFeatures[0], prev.heroFeatures[1], prev.heroFeatures[2], e.target.value] }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
                placeholder="Soporte 24/7"
              />
            </div>
          </div>
        </div>

        
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Impresoras 3D</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título</label>
              <input
                type="text"
                value={sections.printersTitle}
                onChange={e => setSections(prev => ({ ...prev, printersTitle: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
              <input
                type="text"
                value={sections.printersSubtitle}
                onChange={e => setSections(prev => ({ ...prev, printersSubtitle: e.target.value }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">{sections.printers.length} impresoras</span>
            <button onClick={addPrinter} className="flex items-center gap-1 text-sm text-blue-400">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          
          <div className="space-y-3">
            {sections.printers.map((printer, i) => (
              <div key={i} className="flex gap-2 items-center bg-black/30 p-3 rounded-xl">
                <input
                  type="text"
                  value={printer.name}
                  onChange={e => updatePrinter(i, 'name', e.target.value)}
                  className="flex-1 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Nombre"
                />
                <input
                  type="text"
                  value={printer.description}
                  onChange={e => updatePrinter(i, 'description', e.target.value)}
                  className="w-40 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Descripción"
                />
                <input
                  type="number"
                  value={printer.price}
                  onChange={e => updatePrinter(i, 'price', parseInt(e.target.value) || 0)}
                  className="w-24 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Precio"
                />
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
                  <Upload className="w-3 h-3" />
                  {printer.imageUrl ? 'Cambiar' : 'Subir'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && uploadPrinterImage(i, e.target.files[0])}
                  />
                </label>
                {printer.imageUrl && (
                  <a href={printer.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">Ver</a>
                )}
                <button onClick={() => removePrinter(i)} className="text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ⭐ PRODUCTO ESTRELLA */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">⭐ Producto Estrella</h2>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={sections.productStar.enabled}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, enabled: e.target.checked } }))}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-400">Mostrar</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título</label>
              <input type="text" value={sections.productStar.title}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, title: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
              <input type="text" value={sections.productStar.subtitle}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, subtitle: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Badge</label>
              <input type="text" value={sections.productStar.badge}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, badge: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio</label>
              <input type="text" value={sections.productStar.price}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, price: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio Original (tachado)</label>
              <input type="text" value={sections.productStar.originalPrice}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, originalPrice: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Equipos (separados por coma)</label>
              <input type="text" value={sections.productStar.teams.join(', ')}
                onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, teams: e.target.value.split(',').map(s => s.trim()) } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
          </div>
        </div>

        {/* 🏆 COPA - Scroll Animation */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🏆 Copa - Scroll Animation</h2>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={sections.copaAnimation.enabled}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, enabled: e.target.checked } }))}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-400">Mostrar</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título</label>
              <input type="text" value={sections.copaAnimation.title}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, title: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
              <input type="text" value={sections.copaAnimation.subtitle}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, subtitle: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Badge</label>
              <input type="text" value={sections.copaAnimation.badge}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, badge: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio</label>
              <input type="text" value={sections.copaAnimation.price}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, price: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Color Acento (hex)</label>
              <input type="text" value={sections.copaAnimation.accentColor}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, accentColor: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Carpeta de Frames</label>
              <input type="text" value={sections.copaAnimation.framesDir}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, framesDir: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Total Frames</label>
              <input type="number" value={sections.copaAnimation.totalFrames}
                onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, totalFrames: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
          </div>
        </div>

        {/* 🖨️ IMPRESORA - Scroll Animation */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🖨️ Impresora 3D - Scroll Animation</h2>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={sections.impresoraAnimation.enabled}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, enabled: e.target.checked } }))}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-400">Mostrar</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título</label>
              <input type="text" value={sections.impresoraAnimation.title}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, title: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
              <input type="text" value={sections.impresoraAnimation.subtitle}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, subtitle: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Badge</label>
              <input type="text" value={sections.impresoraAnimation.badge}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, badge: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio</label>
              <input type="text" value={sections.impresoraAnimation.price}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, price: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Color Acento (hex)</label>
              <input type="text" value={sections.impresoraAnimation.accentColor}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, accentColor: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Carpeta de Frames</label>
              <input type="text" value={sections.impresoraAnimation.framesDir}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, framesDir: e.target.value } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Total Frames</label>
              <input type="number" value={sections.impresoraAnimation.totalFrames}
                onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, totalFrames: parseInt(e.target.value) || 0 } }))}
                className="w-full bg-zinc-800 rounded-lg py-2 px-3" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Categorías de Productos</h2>
              <p className="text-sm text-zinc-300 mt-1">Estas categorías se muestran en la página principal. Podés agregar subcategorías, productos, texto visible y video opcional por producto.</p>
            </div>
            <button onClick={addProductCategory} type="button" className="flex items-center justify-center gap-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2 shrink-0">
              <Plus className="w-4 h-4" /> Agregar categoría
            </button>
          </div>
          
          <div className="space-y-4">
            {sections.productCategories.map((category, catIndex) => (
              <div key={category.id} className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <input
                    type="text"
                    value={category.name}
                    onChange={e => updateProductCategory(catIndex, 'name', e.target.value)}
                    className="flex-1 min-w-[140px] bg-zinc-800 rounded-lg py-2.5 px-3 text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Nombre de categoría"
                  />
                  <input
                    type="text"
                    value={category.icon}
                    onChange={e => updateProductCategory(catIndex, 'icon', e.target.value)}
                    className="w-16 bg-zinc-800 rounded-lg py-2.5 px-2 text-white text-center placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                    placeholder="Icono"
                  />
                  <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs font-medium text-zinc-100 border border-zinc-600">
                    <Upload className="w-3 h-3" />
                    <span>Imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleCategoryImageUpload(catIndex, e.target.files[0])}
                    />
                  </label>
                  <button type="button" onClick={() => removeProductCategory(catIndex)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10" title="Eliminar categoría">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="ml-0 sm:ml-2 space-y-3 border-l-2 border-blue-500/40 pl-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white tracking-wide">Subcategorías</span>
                    <button 
                      type="button"
                      onClick={() => addSubCategory(catIndex)} 
                      className="text-xs font-bold text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg px-3 py-1.5 flex items-center gap-1 border border-zinc-500"
                    >
                      <Plus className="w-3 h-3" /> Agregar subcategoría
                    </button>
                  </div>
                  
                  {category.subCategories.map((subCat, subIndex) => (
                    <div key={subCat.id} className="bg-zinc-800/80 rounded-lg p-3 border border-zinc-600/50">
                      <div className="flex gap-2 items-center mb-3">
                        <input
                          type="text"
                          value={subCat.name}
                          onChange={e => updateSubCategory(catIndex, subIndex, 'name', e.target.value)}
                          className="flex-1 bg-zinc-900 rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Nombre de subcategoría"
                        />
                        <button 
                          type="button"
                          onClick={() => removeSubCategory(catIndex, subIndex)} 
                          className="text-red-400 hover:text-red-300 p-2 shrink-0"
                          title="Quitar subcategoría"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mt-2 pl-0 sm:pl-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Productos</span>
                          <button 
                            type="button"
                            onClick={() => addProductToSubCategory(catIndex, subIndex)} 
                            className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg px-2.5 py-1 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Agregar producto
                          </button>
                        </div>
                        
                        {subCat.products.map((product, prodIndex) => (
                          <div key={product.id} className="flex flex-col gap-2 bg-black/30 p-3 rounded-lg border border-zinc-700/80">
                            <div className="flex flex-wrap gap-2 items-center">
                              <input
                                type="text"
                                value={product.name}
                                onChange={e => updateProductInSubCategory(catIndex, subIndex, prodIndex, 'name', e.target.value)}
                                className="flex-1 min-w-[120px] bg-zinc-900 rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                                placeholder="Nombre del producto"
                              />
                              <input
                                type="number"
                                value={product.price}
                                onChange={e => updateProductInSubCategory(catIndex, subIndex, prodIndex, 'price', parseInt(e.target.value, 10) || 0)}
                                className="w-24 bg-zinc-900 rounded-lg py-2 px-3 text-sm text-white border border-zinc-600 focus:border-blue-500 focus:outline-none"
                                placeholder="Precio"
                              />
                              <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 rounded-lg px-2 py-2 flex items-center gap-1 text-xs font-medium text-white shrink-0 border border-zinc-500">
                                <ImageIcon className="w-3 h-3" />
                                <span className="hidden sm:inline">Foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => e.target.files?.[0] && handleProductImageUpload(catIndex, subIndex, prodIndex, e.target.files[0])}
                                />
                              </label>
                              <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 rounded-lg px-2 py-2 flex items-center gap-1 text-xs font-medium text-white shrink-0 border border-zinc-500">
                                <Upload className="w-3 h-3" />
                                <span className="hidden sm:inline">Video</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={e => e.target.files?.[0] && handleProductVideoUpload(catIndex, subIndex, prodIndex, e.target.files[0])}
                                />
                              </label>
                              <button 
                                type="button"
                                onClick={() => removeProductFromSubCategory(catIndex, subIndex, prodIndex)} 
                                className="text-red-400 hover:text-red-300 p-2 shrink-0"
                                title="Quitar producto"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={product.description ?? ''}
                              onChange={e => updateProductInSubCategory(catIndex, subIndex, prodIndex, 'description', e.target.value)}
                              className="w-full bg-zinc-900 rounded-lg py-2 px-3 text-sm text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                              placeholder="Descripción (se muestra en la web al abrir la categoría)"
                            />
                            <input
                              type="text"
                              value={product.videoUrl ?? ''}
                              onChange={e => updateProductInSubCategory(catIndex, subIndex, prodIndex, 'videoUrl', e.target.value)}
                              className="w-full bg-zinc-900 rounded-lg py-2 px-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                              placeholder="URL de video (opcional), ej. /uploads/archivo.mp4"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CÓDIGOS PERSONALIZADOS — también alimentan los tipos en Pedidos → Personalizado */}
        <div id="videos-por-codigo" className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6 scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Videos por código y tipos de pedido</h2>
            <button onClick={addCustomCode} className="flex items-center gap-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
            <span className="font-bold text-white">Código:</span> debe coincidir con la parte del producto en el código de seguimiento (ej.{" "}
            <span className="text-zinc-100 font-mono">vasoriver</span> dentro de{" "}
            <span className="text-zinc-100 font-mono">joaquin-vasoriver-17032026</span>).{" "}
            <span className="font-bold text-white">Nombre + video:</span> lo que ve el cliente al rastrear.{" "}
            <span className="font-bold text-purple-200">Tipos de pedido:</span> cada fila con código relleno aparece como botón en{" "}
            <span className="text-white">Pedidos → Nuevo pedido → Personalizado → Tipo de producto</span> (no hace falta video para que aparezca el tipo).
          </p>
          
          <div className="space-y-3">
            {sections.customCodes.map((code, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center bg-black/40 border border-white/10 p-3 rounded-xl">
                <input
                  type="text"
                  value={code.code}
                  onChange={e => updateCustomCode(i, 'code', e.target.value)}
                  className="w-40 min-w-[120px] bg-zinc-800 rounded-lg py-2 px-3 text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Código (ej: vasoriver)"
                />
                <input
                  type="text"
                  value={code.name}
                  onChange={e => updateCustomCode(i, 'name', e.target.value)}
                  className="flex-1 min-w-[160px] bg-zinc-800 rounded-lg py-2 px-3 text-white placeholder:text-zinc-500 border border-zinc-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre visible (ej: Vaso River)"
                />
                <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
                  <Upload className="w-3 h-3" />
                  {code.videoUrl ? 'Cambiar Video' : 'Subir Video'}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleVideoUpload(i, e.target.files[0])}
                  />
                </label>
                {code.videoUrl && (
                  <a href={apiUrl(code.videoUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs">Ver Video</a>
                )}
                <button onClick={() => removeCustomCode(i)} className="text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {sections.customCodes.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No hay códigos personalizados. Agregá uno para vincular un video a un pedido.</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium w-full justify-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}