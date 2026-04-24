"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { Settings, Plus, X, Edit, ExternalLink, Save, Loader2 } from "lucide-react";

interface Idea {
  name: string;
  icon: string;
  category: string;
  downloads: string;
  link: string;
}

interface PrinterItem {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  link: string;
}

interface HomepageSections {
  ideas: Idea[];
  printers: PrinterItem[];
  printersTitle: string;
  printersSubtitle: string;
}

interface StoredUser {
  token: string;
  user: { role: string };
}

interface HomeSections {
  ideas: Idea[];
  printers: PrinterItem[];
  printersTitle: string;
  printersSubtitle: string;
}

export default function HomeSettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<HomeSections>({
    ideas: [
      { name: 'iPhone Stand', icon: '📱', category: 'Organizers', downloads: '15k+', link: '' },
      { name: 'Under Desk Drawer', icon: '🗄️', category: 'Storage', downloads: '12k+', link: '' },
      { name: 'OTF Fidget', icon: '🎯', category: 'Toys', downloads: '10k+', link: '' },
      { name: 'Cable Wrapper', icon: '🔌', category: 'Organizers', downloads: '8k+', link: '' },
      { name: 'Filament Clip', icon: '🎞️', category: 'Accessories', downloads: '7k+', link: '' },
      { name: 'Capybara', icon: '🦫', category: 'Toys', downloads: '5k+', link: '' },
    ],
    printers: [],
    printersTitle: 'Impresoras 3D',
    printersSubtitle: 'Vendemos impresoras Bambu Lab y accesorios'
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

  const addIdea = () => {
    setSections(prev => ({
      ...prev,
      ideas: [...prev.ideas, { name: '', icon: '💡', category: '', downloads: '', link: '' }]
    }));
  };

  const updateIdea = (index: number, field: keyof Idea, value: string) => {
    const newIdeas = [...sections.ideas];
    newIdeas[index] = { ...newIdeas[index], [field]: value };
    setSections(prev => ({ ...prev, ideas: newIdeas }));
  };

  const removeIdea = (index: number) => {
    setSections(prev => ({
      ...prev,
      ideas: prev.ideas.filter((_, i) => i !== index)
    }));
  };

  const addPrinter = () => {
    setSections(prev => ({
      ...prev,
      printers: [...prev.printers, { name: '', description: '', imageUrl: '', price: 0, link: '' }]
    }));
  };

  const updatePrinter = (index: number, field: keyof PrinterItem, value: string | number) => {
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

        {/* IDEAS SECTION */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Ideas (¿Qué podés imprimir?)</h2>
            <button onClick={addIdea} className="flex items-center gap-1 text-sm text-blue-400">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          
          <div className="space-y-3">
            {sections.ideas.map((idea, i) => (
              <div key={i} className="flex gap-2 items-center bg-black/30 p-3 rounded-xl">
                <input
                  type="text"
                  value={idea.icon}
                  onChange={e => updateIdea(i, 'icon', e.target.value)}
                  className="w-12 bg-zinc-800 rounded-lg py-2 px-2 text-center"
                  placeholder="Icono"
                />
                <input
                  type="text"
                  value={idea.name}
                  onChange={e => updateIdea(i, 'name', e.target.value)}
                  className="flex-1 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Nombre"
                />
                <input
                  type="text"
                  value={idea.category}
                  onChange={e => updateIdea(i, 'category', e.target.value)}
                  className="w-24 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Categoría"
                />
                <input
                  type="text"
                  value={idea.downloads}
                  onChange={e => updateIdea(i, 'downloads', e.target.value)}
                  className="w-20 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Descargas"
                />
                <input
                  type="url"
                  value={idea.link}
                  onChange={e => updateIdea(i, 'link', e.target.value)}
                  className="w-32 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Link (MakerLab)"
                />
                <button onClick={() => removeIdea(i)} className="text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* IMPRESORAS SECTION */}
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
                <input
                  type="url"
                  value={printer.imageUrl}
                  onChange={e => updatePrinter(i, 'imageUrl', e.target.value)}
                  className="w-32 bg-zinc-800 rounded-lg py-2 px-3"
                  placeholder="Imagen URL"
                />
                <button onClick={() => removePrinter(i)} className="text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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