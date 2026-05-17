"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, Save, X, ChevronDown, ChevronRight, Video, Package, Printer, Layers, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface CustomVideo {
  code: string;
  videoUrl: string;
  title: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  videoUrl: string;
  effects: string;
  animations: string;
  enabled: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  imageUrl: string;
  description: string;
  subCategories: SubCategory[];
}

interface SectionData {
  rastreoSection: {
    customVideos: CustomVideo[];
  };
  productosSection: {
    categories: Category[];
  };
  impresorasSection: {
    categories: Category[];
  };
  filamentosSection: {
    categories: Category[];
  };
}

type SectionType = 'rastreo' | 'productos' | 'impresoras' | 'filamentos';

export default function SectionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('productos');
  const [data, setData] = useState<SectionData>({
    rastreoSection: { customVideos: [] },
    productosSection: { categories: [] },
    impresorasSection: { categories: [] },
    filamentosSection: { categories: [] }
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
      loadData(user.token);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const loadData = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/settings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const settings = await res.json();
        setData({
          rastreoSection: { 
            customVideos: settings.rastreoSection?.customVideos || [] 
          },
          productosSection: { 
            categories: settings.productosSection?.categories || [] 
          },
          impresorasSection: { 
            categories: settings.impresorasSection?.categories || [] 
          },
          filamentosSection: { 
            categories: settings.filamentosSection?.categories || [] 
          }
        });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          rastreoSection: { customVideos: data.rastreoSection.customVideos },
          productosSection: { categories: data.productosSection.categories },
          impresorasSection: { categories: data.impresorasSection.categories },
          filamentosSection: { categories: data.filamentosSection.categories }
        })
      });
      if (res.ok) {
        alert('✅ Configuración guardada');
      } else {
        alert('❌ Error al guardar');
      }
    } catch(e) { 
      console.error(e);
      alert('❌ Error de conexión');
    }
    setSaving(false);
  };

  const addCustomVideo = () => {
    setData({
      ...data,
      rastreoSection: {
        customVideos: [...data.rastreoSection.customVideos, { code: '', videoUrl: '', title: '', description: '' }]
      }
    });
  };

  const updateCustomVideo = (index: number, field: keyof CustomVideo, value: string) => {
    const videos = [...data.rastreoSection.customVideos];
    videos[index] = { ...videos[index], [field]: value };
    setData({ ...data, rastreoSection: { customVideos: videos } });
  };

  const removeCustomVideo = (index: number) => {
    const videos = data.rastreoSection.customVideos.filter((_, i) => i !== index);
    setData({ ...data, rastreoSection: { customVideos: videos } });
  };

  const addCategory = (section: SectionType) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const newCategory: Category = {
      id: Date.now().toString(),
      name: '',
      icon: '',
      imageUrl: '',
      description: '',
      subCategories: []
    };
    setData({
      ...data,
      [`${section}Section`]: {
        ...sectionData,
        categories: [...sectionData.categories, newCategory]
      }
    });
  };

  const updateCategory = (section: SectionType, catIndex: number, field: keyof Category, value: any) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex] = { ...categories[catIndex], [field]: value };
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const removeCategory = (section: SectionType, catIndex: number) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = sectionData.categories.filter((_: any, i: number) => i !== catIndex);
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const addSubCategory = (section: SectionType, catIndex: number) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories.push({
      id: Date.now().toString(),
      name: '',
      products: []
    });
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const updateSubCategory = (section: SectionType, catIndex: number, subIndex: number, name: string) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories[subIndex].name = name;
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const removeSubCategory = (section: SectionType, catIndex: number, subIndex: number) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories = categories[catIndex].subCategories.filter((_: any, i: number) => i !== subIndex);
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const addProduct = (section: SectionType, catIndex: number, subIndex: number) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories[subIndex].products.push({
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      videoUrl: '',
      effects: '',
      animations: '',
      enabled: true
    });
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const updateProduct = (section: SectionType, catIndex: number, subIndex: number, prodIndex: number, field: keyof Product, value: any) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories[subIndex].products[prodIndex] = {
      ...categories[catIndex].subCategories[subIndex].products[prodIndex],
      [field]: field === 'price' || field === 'enabled' ? value : value
    };
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  const removeProduct = (section: SectionType, catIndex: number, subIndex: number, prodIndex: number) => {
    const sectionData = data[`${section}Section` as keyof SectionData] as any;
    const categories = [...sectionData.categories];
    categories[catIndex].subCategories[subIndex].products = categories[catIndex].subCategories[subIndex].products.filter((_: any, i: number) => i !== prodIndex);
    setData({ ...data, [`${section}Section`]: { ...sectionData, categories } });
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  const sectionConfig = {
    rastreo: { icon: Video, label: 'Videos por Código', color: 'text-purple-400' },
    productos: { icon: Package, label: 'Productos', color: 'text-blue-400' },
    impresoras: { icon: Printer, label: 'Impresoras', color: 'text-green-400' },
    filamentos: { icon: Layers, label: 'Filamentos', color: 'text-orange-400' }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-400"/>
          </button>
          <h1 className="text-2xl font-black uppercase">Gestión de Secciones</h1>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
          Guardar Cambios
        </button>
      </div>

      <div className="flex">
        <aside className="w-64 border-r border-white/10 p-4 space-y-2">
          {(Object.keys(sectionConfig) as SectionType[]).map((key) => {
            const config = sectionConfig[key];
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeSection === key ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Icon className={`h-5 w-5 ${activeSection === key ? '' : config.color}`}/>
                <span className="font-bold">{config.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {activeSection === 'rastreo' && (
            <div className="space-y-6">
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-purple-400"/>
                  <h2 className="text-xl font-black uppercase">Videos por Código</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Agregá videos que se mostrarán cuando un cliente busque su pedido. 
                  El código se compara con el código de seguimiento del pedido (ej: "vasoriver"匹配"joaquin-vasoriver-2026").
                </p>
                
                <div className="space-y-4">
                  {data.rastreoSection.customVideos.map((video, index) => (
                    <div key={index} className="bg-black/40 border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-bold text-purple-400">Video #{index + 1}</span>
                        <button onClick={() => removeCustomVideo(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Código (ej: vasoriver)</label>
                          <input
                            value={video.code}
                            onChange={(e) => updateCustomVideo(index, 'code', e.target.value)}
                            placeholder="vasoriver"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Título</label>
                          <input
                            value={video.title}
                            onChange={(e) => updateCustomVideo(index, 'title', e.target.value)}
                            placeholder="Vaso River Plate"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 block mb-1">URL del Video</label>
                          <input
                            value={video.videoUrl}
                            onChange={(e) => updateCustomVideo(index, 'videoUrl', e.target.value)}
                            placeholder="https://ejemplo.com/video.mp4"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                          <textarea
                            value={video.description}
                            onChange={(e) => updateCustomVideo(index, 'description', e.target.value)}
                            placeholder="Descripción opcional..."
                            rows={2}
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-purple-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCustomVideo}
                  className="mt-4 w-full py-3 border-2 border-dashed border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/10 font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4"/> Agregar Video
                </button>
              </div>
            </div>
          )}

          {(activeSection === 'productos' || activeSection === 'impresoras' || activeSection === 'filamentos') && (
            <CategoryManager
              section={activeSection}
              categories={data[`${activeSection}Section` as keyof SectionData] as any}
              onAddCategory={() => addCategory(activeSection)}
              onUpdateCategory={(catIndex: number, field: string, value: any) => updateCategory(activeSection, catIndex, field, value)}
              onRemoveCategory={(catIndex: number) => removeCategory(activeSection, catIndex)}
              onAddSubCategory={(catIndex: number) => addSubCategory(activeSection, catIndex)}
              onUpdateSubCategory={(catIndex: number, subIndex: number, name: string) => updateSubCategory(activeSection, catIndex, subIndex, name)}
              onRemoveSubCategory={(catIndex: number, subIndex: number) => removeSubCategory(activeSection, catIndex, subIndex)}
              onAddProduct={(catIndex: number, subIndex: number) => addProduct(activeSection, catIndex, subIndex)}
              onUpdateProduct={(catIndex: number, subIndex: number, prodIndex: number, field: string, value: any) => updateProduct(activeSection, catIndex, subIndex, prodIndex, field, value)}
              onRemoveProduct={(catIndex: number, subIndex: number, prodIndex: number) => removeProduct(activeSection, catIndex, subIndex, prodIndex)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function CategoryManager({ 
  section,
  categories,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onAddSubCategory,
  onUpdateSubCategory,
  onRemoveSubCategory,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct
}: any) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

  const toggleCat = (id: string) => setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleSub = (id: string) => setExpandedSubs((prev) => ({ ...prev, [id]: !prev[id] }));

  const colors = {
    productos: 'blue',
    impresoras: 'green',
    filamentos: 'orange'
  };
  const color = colors[section as keyof typeof colors] || 'blue';

  return (
    <div className="space-y-6">
      <div className={`bg-${color}-900/20 border border-${color}-500/20 rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black uppercase">Categorías y Productos</h2>
          <button
            onClick={onAddCategory}
            className={`bg-${color}-600 hover:bg-${color}-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2`}
          >
            <Plus className="h-4 w-4"/> Nueva Categoría
          </button>
        </div>

        <div className="space-y-4">
          {categories.categories.map((cat: Category, catIndex: number) => (
            <div key={cat.id} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-white/5">
                <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-2">
                  {expandedCats[cat.id] ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                  <input
                    value={cat.name}
                    onChange={(e) => onUpdateCategory(catIndex, 'name', e.target.value)}
                    placeholder="Nombre de categoría"
                    className="bg-transparent border-none outline-none font-bold text-white placeholder:text-gray-600"
                  />
                </button>
                <button onClick={() => onRemoveCategory(catIndex)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>

              {expandedCats[cat.id] && (
                <div className="p-4 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Icono (emoji)</label>
                      <input
                        value={cat.icon}
                        onChange={(e) => onUpdateCategory(catIndex, 'icon', e.target.value)}
                        placeholder="🏆"
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">URL de Imagen</label>
                      <input
                        value={cat.imageUrl}
                        onChange={(e) => onUpdateCategory(catIndex, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-400">Subcategorías</span>
                    <button onClick={() => onAddSubCategory(catIndex)} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                      <Plus className="h-3 w-3"/> Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cat.subCategories.map((sub, subIndex) => (
                      <div key={sub.id} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                        <div className="p-3 flex items-center justify-between">
                          <button onClick={() => toggleSub(sub.id)} className="flex items-center gap-2">
                            {expandedSubs[sub.id] ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
                            <input
                              value={sub.name}
                              onChange={(e) => onUpdateSubCategory(catIndex, subIndex, e.target.value)}
                              placeholder="Nombre de subcategoría"
                              className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder:text-gray-600"
                            />
                          </button>
                          <button onClick={() => onRemoveSubCategory(catIndex, subIndex)} className="text-red-400 hover:text-red-300 p-1">
                            <X className="h-3 w-3"/>
                          </button>
                        </div>

                        {expandedSubs[sub.id] && (
                          <div className="p-3 border-t border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Productos</span>
                              <button onClick={() => onAddProduct(catIndex, subIndex)} className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1">
                                <Plus className="h-3 w-3"/> Agregar
                              </button>
                            </div>

                            <div className="space-y-2">
                              {sub.products.map((prod, prodIndex) => (
                                <div key={prod.id} className="bg-black/30 border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => onUpdateProduct(catIndex, subIndex, prodIndex, 'enabled', !prod.enabled)}
                                        className={`p-1 rounded ${prod.enabled ? 'text-green-400' : 'text-gray-500'}`}
                                      >
                                        {prod.enabled ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>}
                                      </button>
                                      <input
                                        value={prod.name}
                                        onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'name', e.target.value)}
                                        placeholder="Nombre del producto"
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 w-40"
                                      />
                                    </div>
                                    <button onClick={() => onRemoveProduct(catIndex, subIndex, prodIndex)} className="text-red-400 hover:text-red-300">
                                      <Trash2 className="h-3 w-3"/>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={prod.description}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'description', e.target.value)}
                                      placeholder="Descripción"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                    <input
                                      type="number"
                                      value={prod.price}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'price', Number(e.target.value))}
                                      placeholder="Precio"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                    <input
                                      value={prod.imageUrl}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'imageUrl', e.target.value)}
                                      placeholder="URL imagen"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none col-span-2"
                                    />
                                    <input
                                      value={prod.videoUrl}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'videoUrl', e.target.value)}
                                      placeholder="URL video"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none col-span-2"
                                    />
                                    <input
                                      value={prod.effects}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'effects', e.target.value)}
                                      placeholder="Efectos (descripción)"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                    <input
                                      value={prod.animations}
                                      onChange={(e) => onUpdateProduct(catIndex, subIndex, prodIndex, 'animations', e.target.value)}
                                      placeholder="Animaciones"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                  </div>
                                </div>
                              ))}
                              {sub.products.length === 0 && (
                                <p className="text-gray-600 text-xs text-center py-2">Sin productos</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {cat.subCategories.length === 0 && (
                      <p className="text-gray-600 text-sm">Sin subcategorías</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {categories.categories.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No hay categorías. Creá una arriba!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}