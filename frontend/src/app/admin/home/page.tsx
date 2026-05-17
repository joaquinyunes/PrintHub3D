"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import { Plus, X, Trash2, Upload, Image as ImageIcon, Save, Loader2, DollarSign, Home, Package, Printer, Cable, Phone, Search, ArrowUpDown, ChevronDown, ChevronRight, Eye, EyeOff, Video } from "lucide-react";
import dynamic from "next/dynamic";

const FileUploader = dynamic(() => import("@/components/FileUploader"), { ssr: false });
const SimpleUploader = dynamic(() => import("@/components/SimpleUploader"), { ssr: false });

interface ProductItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  videoUrl?: string;
  calidad?: string;
  effects?: string;
  animations?: string;
  enabled?: boolean;
}

interface ProductSubCategory {
  id: string;
  name: string;
  products: ProductItem[];
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  imageUrl?: string;
  subCategories: ProductSubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  products: any[];
}

interface SectionCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  description?: string;
  subCategories?: SubCategory[];
  products?: any[];
}

interface HomeSections {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  monthlyGoal?: number;
  heroStats: { reviews: string; reviewsCount: string; orders: string; delivery: string };
  heroFeatures: string[];
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
  rastreoSection: { enabled: boolean; title: string; subtitle: string; badge: string; categories: SectionCategory[]; customVideos: any[] };
  productosSection: { enabled: boolean; title: string; subtitle: string; badge: string; heroImage: string; categories: SectionCategory[]; allProductsSearch: { enabled: boolean; placeholder: string } };
  impresorasSection: { enabled: boolean; title: string; subtitle: string; badge: string; heroImage: string; categories: SectionCategory[]; animation: any };
  filamentosSection: { enabled: boolean; title: string; subtitle: string; badge: string; heroImage: string; categories: SectionCategory[] };
  contactoSection: { enabled: boolean; title: string; subtitle: string; badge: string };
  contactInfo: {
    whatsapp: string;
    whatsappDisplay: string;
    instagram: string;
    instagramUrl: string;
    facebook: string;
    facebookUrl: string;
    location: string;
    email: string;
  };
}

export default function HomeSettingsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<{ token: string; user: { role: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'inicio' | 'rastreo' | 'productos' | 'impresoras' | 'filamentos' | 'contacto'>('inicio');
  const [sections, setSections] = useState<HomeSections>({
    heroTitle: 'Global 3D',
    heroSubtitle: 'Transformamos tus ideas en objetos reales.',
    heroDescription: 'Impresión 3D de alta calidad en Corrientes',
    heroBadge: 'Envíos gratis en pedidos mayores a $50.000',
    heroStats: { reviews: '4.9', reviewsCount: '200+ reseñas', orders: '500+', delivery: '24-72h' },
    heroFeatures: ['Impresión rápida', 'Calidad premium', 'Envío rápido', 'Soporte 24/7'],
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
    productCategories: [],
    rastreoSection: { enabled: true, title: 'Rastreá tu Pedido', subtitle: 'Ingresá tu código y seguí tu pedido en tiempo real', badge: '📦 RASTREO', categories: [], customVideos: [] },
    productosSection: { enabled: true, title: 'Productos Personalizados', subtitle: 'Vasos, llaveros, trofeos y más', badge: '🏆 PRODUCTOS', heroImage: '', categories: [], allProductsSearch: { enabled: true, placeholder: 'Buscar productos...' } },
    impresorasSection: { enabled: true, title: 'Impresoras 3D', subtitle: 'Bambu Lab y más', badge: '🖨️ IMPRESORAS', heroImage: '', categories: [], animation: { enabled: true, title: 'Impresora 3D Bambu Lab X1C', subtitle: 'La nueva generación', badge: '🖨️ PROFESIONAL', price: '$469.000', accentColor: '#3b82f6', framesDir: '/frames-mp/', totalFrames: 192 } },
    filamentosSection: { enabled: true, title: 'Filamentos y Materiales', subtitle: 'PLA, PETG, ABS y más', badge: '🧵 FILAMENTOS', heroImage: '', categories: [] },
    contactoSection: { enabled: true, title: 'Contactanos', subtitle: 'Estamos para ayudarte', badge: '📩 CONTACTO' },
contactInfo: {
      whatsapp: '',
      whatsappDisplay: '',
      instagram: '',
      instagramUrl: '',
      facebook: '',
      facebookUrl: '',
      location: '',
      email: ''
    }
  });

  const loadSettings = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/settings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.homepageSections || data.rastreoSection || data.productosSection || data.impresorasSection || data.filamentosSection || data.contactInfo) {
          const normalizeSearchOptions = (section: any) => {
            if (!section?.allProductsSearch) return section;
            return {
              ...section,
              allProductsSearch: {
                enabled: section.allProductsSearch.enabled ?? true,
                placeholder: section.allProductsSearch.placeholder ?? 'Buscar productos...',
                sortOptions: section.allProductsSearch.sortOptions ?? ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'],
                filterOptions: section.allProductsSearch.filterOptions ?? ['searchByName', 'searchByDescription', 'filterByPrice']
              }
            };
          };
          setSections(prev => ({ 
            ...prev,
            ...data.homepageSections,
            monthlyGoal: data.monthlyGoal,
            rastreoSection: data.rastreoSection || prev.rastreoSection,
            productosSection: normalizeSearchOptions(data.productosSection || prev.productosSection),
            impresorasSection: normalizeSearchOptions(data.impresorasSection || prev.impresorasSection),
            filamentosSection: normalizeSearchOptions(data.filamentosSection || prev.filamentosSection),
            contactoSection: data.contactInfo?.contactoTitle ? { enabled: true, title: data.contactInfo.contactoTitle, subtitle: data.contactInfo.contactoSubtitle, badge: data.contactInfo.contactoBadge || '📩 CONTACTO' } : prev.contactoSection,
            contactInfo: data.contactInfo || prev.contactInfo,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setSession(user);
        if (user.user.role !== 'admin') {
          router.push('/');
          return;
        }
        loadSettings(user.token);
      } catch {
        router.push('/admin/login');
      }
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  if (!isMounted || loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { monthlyGoal, rastreoSection, productosSection, impresorasSection, filamentosSection, contactoSection, ...homepageSectionsRest } = sections;
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({ 
          monthlyGoal, 
          rastreoSection, 
          productosSection, 
          impresorasSection, 
          filamentosSection, 
          homepageSections: { ...homepageSectionsRest },
          contactInfo: { ...sections.contactInfo, contactoTitle: contactoSection.title, contactoSubtitle: contactoSection.subtitle, contactoBadge: contactoSection.badge } 
        })
      });
      if (res.ok) {
        alert("Guardado!");
      } else {
        alert("Error al guardar");
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    } finally {
      setSaving(false);
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
    return data.imageUrl || '';
  };

  const addCategoryToSection = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection') => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        categories: [...(prev[sectionKey]?.categories || []), { id: Date.now().toString(), name: '', icon: '📦', imageUrl: '', description: '', products: [] }]
      }
    }));
  };

  const updateSectionCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', index: number, field: string, value: string) => {
    const newCategories = [...(sections[sectionKey]?.categories || [])];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setSections(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], categories: newCategories }
    }));
  };

  const removeSectionCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', index: number) => {
    const newCategories = [...(sections[sectionKey]?.categories || [])];
    newCategories.splice(index, 1);
    setSections(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], categories: newCategories }
    }));
  };

  const handleSectionCategoryImage = async (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', index: number, file: File) => {
    try {
      const imageUrl = await uploadImage(file);
      updateSectionCategory(sectionKey, index, 'imageUrl', imageUrl);
    } catch (e) {
      console.error(e);
      alert('Error al subir imagen');
    }
  };

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'rastreo', label: 'Rastreo', icon: Package },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'impresoras', label: 'Impresoras', icon: Printer },
    { id: 'filamentos', label: 'Filamentos', icon: Cable },
    { id: 'contacto', label: 'Contacto', icon: Phone },
  ] as const;

  const toggleCat = (id: string) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSub = (id: string) => setExpandedSubs(prev => ({ ...prev, [id]: !prev[id] }));

  const addSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    categories[catIndex].subCategories = categories[catIndex].subCategories || [];
    categories[catIndex].subCategories.push({ id: Date.now().toString(), name: '', products: [] });
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const updateSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number, subIndex: number, name: string) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    if (categories[catIndex]?.subCategories?.[subIndex]) {
      categories[catIndex].subCategories[subIndex].name = name;
    }
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const removeSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number, subIndex: number) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    categories[catIndex].subCategories = categories[catIndex].subCategories.filter((_: any, i: number) => i !== subIndex);
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const addProductToSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number, subIndex: number) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    categories[catIndex].subCategories[subIndex].products = categories[catIndex].subCategories[subIndex].products || [];
    categories[catIndex].subCategories[subIndex].products.push({
      id: Date.now().toString(),
      name: '',
      price: 0,
      imageUrl: '',
      imageHover: '',
      description: '',
      videoUrl: '',
      enabled: true
    });
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const updateProductInSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number, subIndex: number, prodIndex: number, field: string, value: any) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    categories[catIndex].subCategories[subIndex].products[prodIndex] = {
      ...categories[catIndex].subCategories[subIndex].products[prodIndex],
      [field]: value
    };
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const removeProductFromSubCategory = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', catIndex: number, subIndex: number, prodIndex: number) => {
    const section = sections[sectionKey];
    const categories = [...(section?.categories || [])];
    categories[catIndex].subCategories[subIndex].products = categories[catIndex].subCategories[subIndex].products.filter((_: any, i: number) => i !== prodIndex);
    setSections(prev => ({ ...prev, [sectionKey]: { ...section, categories } }));
  };

  const renderSectionCategories = (sectionKey: 'rastreoSection' | 'productosSection' | 'impresorasSection' | 'filamentosSection', sectionTitle: string) => {
    const section = sections[sectionKey];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Estructura de {sectionTitle}</h3>
          <button onClick={() => addCategoryToSection(sectionKey)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva Categoría
          </button>
        </div>
        
        <div className="space-y-4">
          {(section?.categories || []).map((cat: any, i: number) => (
            <div key={cat.id} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-white/5">
                <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-2">
                  {expandedCats[cat.id] ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                  <div className="flex gap-2">
                    <input type="text" value={cat.icon} onChange={e => updateSectionCategory(sectionKey, i, 'icon', e.target.value)} className="w-12 bg-zinc-800 rounded-lg py-1 px-2 text-center text-lg" placeholder="🏆" />
                    <input type="text" value={cat.name} onChange={e => updateSectionCategory(sectionKey, i, 'name', e.target.value)} className="bg-zinc-800 rounded-lg py-1 px-3 font-bold" placeholder="Nombre de categoría" />
                  </div>
                </button>
                <button onClick={() => removeSectionCategory(sectionKey, i)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedCats[cat.id] && (
                <div className="p-4 border-t border-white/5 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                    <input type="text" value={cat.description || ''} onChange={e => updateSectionCategory(sectionKey, i, 'description', e.target.value)} className="w-full bg-zinc-800 rounded-lg py-2 px-3 text-sm" placeholder="Descripción corta" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-gray-400 flex-1">
                      <Upload className="w-4 h-4" />
                      {cat.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleSectionCategoryImage(sectionKey, i, e.target.files[0])} />
                    </label>
                    {cat.imageUrl && <img src={cat.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-sm font-bold text-gray-400">Subcategorías</span>
                    <button onClick={() => addSubCategory(sectionKey, i)} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                      <Plus className="w-3 h-3"/> Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(cat.subCategories || []).map((sub: any, subIndex: number) => (
                      <div key={sub.id} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden">
                        <div className="p-3 flex items-center justify-between">
                          <button onClick={() => toggleSub(sub.id)} className="flex items-center gap-2">
                            {expandedSubs[sub.id] ? <ChevronDown className="w-3 h-3 text-gray-500"/> : <ChevronRight className="w-3 h-3 text-gray-500"/>}
                            <input
                              value={sub.name}
                              onChange={(e) => updateSubCategory(sectionKey, i, subIndex, e.target.value)}
                              placeholder="Nombre de subcategoría"
                              className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder:text-gray-600"
                            />
                          </button>
                          <button onClick={() => removeSubCategory(sectionKey, i, subIndex)} className="text-red-400 hover:text-red-300 p-1">
                            <X className="w-3 h-3"/>
                          </button>
                        </div>

                        {expandedSubs[sub.id] && (
                          <div className="p-3 border-t border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Productos</span>
                              <button onClick={() => addProductToSubCategory(sectionKey, i, subIndex)} className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1">
                                <Plus className="w-3 h-3"/> Agregar
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(sub.products || []).map((prod: any, prodIndex: number) => (
                                <div key={prod.id} className="bg-black/30 border border-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'enabled', !prod.enabled)}
                                        className={`p-1 rounded ${prod.enabled ? 'text-green-400' : 'text-gray-500'}`}
                                      >
                                        {prod.enabled ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                                      </button>
                                      <input
                                        value={prod.name}
                                        onChange={(e) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'name', e.target.value)}
                                        placeholder="Nombre del producto"
                                        className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 w-40"
                                      />
                                    </div>
                                    <button onClick={() => removeProductFromSubCategory(sectionKey, i, subIndex, prodIndex)} className="text-red-400 hover:text-red-300">
                                      <Trash2 className="w-3 h-3"/>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={prod.description || ''}
                                      onChange={(e) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'description', e.target.value)}
                                      placeholder="Descripción"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                    <input
                                      type="number"
                                      value={prod.price || 0}
                                      onChange={(e) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'price', Number(e.target.value))}
                                      placeholder="Precio"
                                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none"
                                    />
                                    <div className="col-span-2">
                                      <label className="text-[10px] text-gray-500 block mb-1">Imagen</label>
                                      <SimpleUploader
                                        value={prod.imageUrl || ''}
                                        onChange={(url) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'imageUrl', url)}
                                        type="image"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[10px] text-gray-500 block mb-1">Imagen Hover (opcional)</label>
                                      <SimpleUploader
                                        value={prod.imageHover || ''}
                                        onChange={(url) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'imageHover', url)}
                                        type="image"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[10px] text-gray-500 block mb-1">Video (opcional)</label>
                                      <SimpleUploader
                                        value={prod.videoUrl || ''}
                                        onChange={(url) => updateProductInSubCategory(sectionKey, i, subIndex, prodIndex, 'videoUrl', url)}
                                        type="video"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(!sub.products || sub.products.length === 0) && (
                                <p className="text-gray-600 text-xs text-center py-2">Sin productos</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!cat.subCategories || cat.subCategories.length === 0) && (
                      <p className="text-gray-600 text-sm">Sin subcategorías. Agregá una arriba.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {(!section?.categories || section.categories.length === 0) && (
          <p className="text-gray-500 text-center py-8">No hay categorías. Agregá una para mostrar en la web.</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase">Configuración</h1>
            <p className="text-gray-500">Editá todas las secciones del sitio</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-800 pb-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Hero</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Título principal</label><input type="text" value={sections.heroTitle} onChange={e => setSections(prev => ({ ...prev, heroTitle: e.target.value }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.heroSubtitle} onChange={e => setSections(prev => ({ ...prev, heroSubtitle: e.target.value }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Descripción</label><input type="text" value={sections.heroDescription} onChange={e => setSections(prev => ({ ...prev, heroDescription: e.target.value }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.heroBadge} onChange={e => setSections(prev => ({ ...prev, heroBadge: e.target.value }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div><label className="text-xs text-gray-500 block mb-1">Reviews</label><input type="text" value={sections.heroStats?.reviews} onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, reviews: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Reviews count</label><input type="text" value={sections.heroStats?.reviewsCount} onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, reviewsCount: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Pedidos</label><input type="text" value={sections.heroStats?.orders} onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, orders: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Entrega</label><input type="text" value={sections.heroStats?.delivery} onChange={e => setSections(prev => ({ ...prev, heroStats: { ...prev.heroStats, delivery: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                {[0,1,2,3].map(i => (
                  <div key={i}><label className="text-xs text-gray-500 block mb-1">Feature {i+1}</label><input type="text" value={sections.heroFeatures?.[i] || ''} onChange={e => setSections(prev => ({ ...prev, heroFeatures: prev.heroFeatures.map((f, idx) => idx === i ? e.target.value : f) }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Producto Estrella</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sections.productStar?.enabled} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /><span className="text-gray-400">Mostrar</span></label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.productStar?.title || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.productStar?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.productStar?.badge || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Precio</label><input type="text" value={sections.productStar?.price || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, price: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Precio Original</label><input type="text" value={sections.productStar?.originalPrice || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, originalPrice: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Equipos</label><input type="text" value={sections.productStar?.teams?.join(', ') || ''} onChange={e => setSections(prev => ({ ...prev, productStar: { ...prev.productStar, teams: e.target.value.split(',').map(s => s.trim()) } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Copa Animation</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sections.copaAnimation?.enabled} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /><span className="text-gray-400">Mostrar</span></label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.copaAnimation?.title || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.copaAnimation?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.copaAnimation?.badge || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Precio</label><input type="text" value={sections.copaAnimation?.price || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, price: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Color acento</label><input type="text" value={sections.copaAnimation?.accentColor || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, accentColor: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Carpeta frames</label><input type="text" value={sections.copaAnimation?.framesDir || ''} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, framesDir: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Total frames</label><input type="number" value={sections.copaAnimation?.totalFrames || 0} onChange={e => setSections(prev => ({ ...prev, copaAnimation: { ...prev.copaAnimation, totalFrames: parseInt(e.target.value) || 0 } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Impresora Animation</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sections.impresoraAnimation?.enabled} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /><span className="text-gray-400">Mostrar</span></label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.impresoraAnimation?.title || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.impresoraAnimation?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.impresoraAnimation?.badge || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Precio</label><input type="text" value={sections.impresoraAnimation?.price || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, price: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Color acento</label><input type="text" value={sections.impresoraAnimation?.accentColor || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, accentColor: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Carpeta frames</label><input type="text" value={sections.impresoraAnimation?.framesDir || ''} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, framesDir: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Total frames</label><input type="number" value={sections.impresoraAnimation?.totalFrames || 0} onChange={e => setSections(prev => ({ ...prev, impresoraAnimation: { ...prev.impresoraAnimation, totalFrames: parseInt(e.target.value) || 0 } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Explorá - Nuestras Categorías</h2>
                <p className="text-sm text-zinc-400">Categorías que aparecen en la sección "Explorá" del inicio</p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">{sections.productCategories?.length || 0} categorías</span>
                <button onClick={() => setSections(prev => ({ ...prev, productCategories: [...(prev.productCategories || []), { id: Date.now().toString(), name: '', icon: '📦', subCategories: [] }] }))} className="flex items-center gap-1 text-sm text-blue-400"><Plus className="w-4 h-4" /> Agregar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(sections.productCategories || []).map((cat: any, i: number) => (
                  <div key={cat.id} className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input type="text" value={cat.icon} onChange={e => { const newCats = [...sections.productCategories]; newCats[i] = {...newCats[i], icon: e.target.value}; setSections(prev => ({...prev, productCategories: newCats})) }} className="w-14 bg-zinc-800 rounded-lg py-2 px-2 text-center text-xl" placeholder="Icono" />
                        <input type="text" value={cat.name} onChange={e => { const newCats = [...sections.productCategories]; newCats[i] = {...newCats[i], name: e.target.value}; setSections(prev => ({...prev, productCategories: newCats})) }} className="flex-1 bg-zinc-800 rounded-lg py-2 px-3" placeholder="Nombre" />
                      </div>
                      <input type="text" value={cat.description || ''} onChange={e => { const newCats = [...sections.productCategories]; newCats[i] = {...newCats[i], description: e.target.value}; setSections(prev => ({...prev, productCategories: newCats})) }} className="w-full bg-zinc-800 rounded-lg py-2 px-3 text-sm" placeholder="Descripción" />
                      <button onClick={() => { const newCats = [...sections.productCategories]; newCats.splice(i, 1); setSections(prev => ({...prev, productCategories: newCats})) }} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"><Trash2 className="w-4 h-4" /> Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
              {(sections.productCategories?.length || 0) === 0 && <p className="text-gray-500 text-center py-4">No hay categorías. Agregá una para mostrar en la web.</p>}
            </div>
          </div>
        )}

        {activeTab === 'rastreo' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Rastreo</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitado</label><input type="checkbox" checked={sections.rastreoSection?.enabled} onChange={e => setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.rastreoSection?.title || ''} onChange={e => setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.rastreoSection?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.rastreoSection?.badge || ''} onChange={e => setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-purple-400"/> Videos por Código</h2>
                <button 
                  onClick={() => setSections(prev => ({ 
                    ...prev, 
                    rastreoSection: { 
                      ...prev.rastreoSection, 
                      customVideos: [...(prev.rastreoSection?.customVideos || []), { code: '', videoUrl: '', title: '', description: '' }] 
                    } 
                  }))} 
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Agregar Video
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Agregá videos que se mostrarán cuando un cliente busque su pedido. 
                El código se compara con el código de seguimiento (ej: "vasoriver"匹配"joaquin-vasoriver-2026").
              </p>
              
              <div className="space-y-4">
                {(sections.rastreoSection?.customVideos || []).map((video: any, idx: number) => (
                  <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-bold text-purple-400">Video #{idx + 1}</span>
                      <button 
                        onClick={() => setSections(prev => ({ 
                          ...prev, 
                          rastreoSection: { 
                            ...prev.rastreoSection, 
                            customVideos: prev.rastreoSection?.customVideos?.filter((_: any, i: number) => i !== idx) || [] 
                          } 
                        }))} 
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Código (ej: vasoriver)</label>
                        <input
                          value={video.code}
                          onChange={(e) => {
                            const newVideos = [...(sections.rastreoSection?.customVideos || [])];
                            newVideos[idx].code = e.target.value;
                            setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, customVideos: newVideos } }));
                          }}
                          placeholder="vasoriver"
                          className="w-full bg-zinc-800 border border-white/10 rounded-lg py-2 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Título</label>
                        <input
                          value={video.title}
                          onChange={(e) => {
                            const newVideos = [...(sections.rastreoSection?.customVideos || [])];
                            newVideos[idx].title = e.target.value;
                            setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, customVideos: newVideos } }));
                          }}
                          placeholder="Vaso River Plate"
                          className="w-full bg-zinc-800 border border-white/10 rounded-lg py-2 px-3 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">URL del Video</label>
                        <input
                          value={video.videoUrl}
                          onChange={(e) => {
                            const newVideos = [...(sections.rastreoSection?.customVideos || [])];
                            newVideos[idx].videoUrl = e.target.value;
                            setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, customVideos: newVideos } }));
                          }}
                          placeholder="https://ejemplo.com/video.mp4"
                          className="w-full bg-zinc-800 border border-white/10 rounded-lg py-2 px-3 text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                        <textarea
                          value={video.description}
                          onChange={(e) => {
                            const newVideos = [...(sections.rastreoSection?.customVideos || [])];
                            newVideos[idx].description = e.target.value;
                            setSections(prev => ({ ...prev, rastreoSection: { ...prev.rastreoSection, customVideos: newVideos } }));
                          }}
                          placeholder="Descripción opcional..."
                          rows={2}
                          className="w-full bg-zinc-800 border border-white/10 rounded-lg py-2 px-3 text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(!sections.rastreoSection?.customVideos || sections.rastreoSection.customVideos.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay videos. Agregá uno para mostrar en rastreo.</p>
              )}
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              {renderSectionCategories('rastreoSection', 'Rastreo')}
            </div>
          </div>
        )}

        {activeTab === 'productos' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Productos</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitado</label><input type="checkbox" checked={sections.productosSection?.enabled} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.productosSection?.title || ''} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.productosSection?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge (emoji)</label><input type="text" value={sections.productosSection?.badge || ''} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-1">Imagen Hero (fondo) - Recomendado: 1920x1080px (16:9)</label>
                <FileUploader
                  value={sections.productosSection?.heroImage || ''}
                  onChange={(url) => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, heroImage: url } }))}
                  type="image"
                />
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> Todos los Productos - Búsqueda</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitar búsqueda</label><input type="checkbox" checked={sections.productosSection?.allProductsSearch?.enabled} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, allProductsSearch: { ...prev.productosSection?.allProductsSearch, enabled: e.target.checked } } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Placeholder</label><input type="text" value={sections.productosSection?.allProductsSearch?.placeholder || ''} onChange={e => setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, allProductsSearch: { ...prev.productosSection?.allProductsSearch, placeholder: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="Buscar productos..." /></div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-2">Opciones de orden disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-700">
                      <input 
                        type="checkbox" 
                        checked={sections.productosSection?.allProductsSearch?.sortOptions?.includes(opt)}
                        onChange={e => {
                          const current = sections.productosSection?.allProductsSearch?.sortOptions || [];
                          const updated = e.target.checked 
                            ? [...current, opt] 
                            : current.filter((o: string) => o !== opt);
                          setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, allProductsSearch: { ...prev.productosSection?.allProductsSearch, sortOptions: updated } } }));
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-300">
                        {opt === 'price_asc' && 'Menor precio'}
                        {opt === 'price_desc' && 'Mayor precio'}
                        {opt === 'name_asc' && 'Nombre A-Z'}
                        {opt === 'name_desc' && 'Nombre Z-A'}
                        {opt === 'newest' && 'Más recientes'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-2">Filtros de búsqueda</label>
                <div className="flex flex-wrap gap-2">
                  {['searchByName', 'searchByDescription', 'filterByPrice'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-zinc-700">
                      <input 
                        type="checkbox" 
                        checked={sections.productosSection?.allProductsSearch?.filterOptions?.includes(opt)}
                        onChange={e => {
                          const current = sections.productosSection?.allProductsSearch?.filterOptions || [];
                          const updated = e.target.checked 
                            ? [...current, opt] 
                            : current.filter((o: string) => o !== opt);
                          setSections(prev => ({ ...prev, productosSection: { ...prev.productosSection, allProductsSearch: { ...prev.productosSection?.allProductsSearch, filterOptions: updated } } }));
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-300">
                        {opt === 'searchByName' && 'Buscar por nombre'}
                        {opt === 'searchByDescription' && 'Buscar por descripción'}
                        {opt === 'filterByPrice' && 'Filtrar por precio'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              {renderSectionCategories('productosSection', 'Productos')}
            </div>
          </div>
        )}

        {activeTab === 'impresoras' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Impresoras</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitado</label><input type="checkbox" checked={sections.impresorasSection?.enabled} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.impresorasSection?.title || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.impresorasSection?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge (emoji)</label><input type="text" value={sections.impresorasSection?.badge || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-1">Imagen Hero (fondo)</label>
                <FileUploader
                  value={sections.impresorasSection?.heroImage || ''}
                  onChange={(url) => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, heroImage: url } }))}
                  type="image"
                />
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Animación Hero</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Animación habilitada</label><input type="checkbox" checked={sections.impresorasSection?.animation?.enabled} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, enabled: e.target.checked } } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.impresorasSection?.animation?.title || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, title: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.impresorasSection?.animation?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, subtitle: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.impresorasSection?.animation?.badge || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, badge: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Precio</label><input type="text" value={sections.impresorasSection?.animation?.price || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, price: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Color acento</label><input type="text" value={sections.impresorasSection?.animation?.accentColor || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, accentColor: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Carpeta frames</label><input type="text" value={sections.impresorasSection?.animation?.framesDir || ''} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, framesDir: e.target.value } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Total frames</label><input type="number" value={sections.impresorasSection?.animation?.totalFrames || 0} onChange={e => setSections(prev => ({ ...prev, impresorasSection: { ...prev.impresorasSection, animation: { ...prev.impresorasSection?.animation, totalFrames: parseInt(e.target.value) || 0 } } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              {renderSectionCategories('impresorasSection', 'Impresoras')}
            </div>
          </div>
        )}

        {activeTab === 'filamentos' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Filamentos</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitado</label><input type="checkbox" checked={sections.filamentosSection?.enabled} onChange={e => setSections(prev => ({ ...prev, filamentosSection: { ...prev.filamentosSection, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.filamentosSection?.title || ''} onChange={e => setSections(prev => ({ ...prev, filamentosSection: { ...prev.filamentosSection, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.filamentosSection?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, filamentosSection: { ...prev.filamentosSection, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge (emoji)</label><input type="text" value={sections.filamentosSection?.badge || ''} onChange={e => setSections(prev => ({ ...prev, filamentosSection: { ...prev.filamentosSection, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-1">Imagen Hero (fondo)</label>
                <FileUploader
                  value={sections.filamentosSection?.heroImage || ''}
                  onChange={(url) => setSections(prev => ({ ...prev, filamentosSection: { ...prev.filamentosSection, heroImage: url } }))}
                  type="image"
                />
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              {renderSectionCategories('filamentosSection', 'Filamentos')}
            </div>
          </div>
        )}

        {activeTab === 'contacto' && (
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Sección Contacto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 block mb-1">Habilitado</label><input type="checkbox" checked={sections.contactoSection?.enabled} onChange={e => setSections(prev => ({ ...prev, contactoSection: { ...prev.contactoSection, enabled: e.target.checked } }))} className="w-5 h-5 rounded" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Título</label><input type="text" value={sections.contactoSection?.title || ''} onChange={e => setSections(prev => ({ ...prev, contactoSection: { ...prev.contactoSection, title: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Subtítulo</label><input type="text" value={sections.contactoSection?.subtitle || ''} onChange={e => setSections(prev => ({ ...prev, contactoSection: { ...prev.contactoSection, subtitle: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Badge</label><input type="text" value={sections.contactoSection?.badge || ''} onChange={e => setSections(prev => ({ ...prev, contactoSection: { ...prev.contactoSection, badge: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" /></div>
              </div>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Información de Contacto</h2>
              <p className="text-sm text-zinc-400 mb-4">Editá los datos de contacto que aparecerán en la web</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">WhatsApp (números)</label>
                  <input type="text" value={sections.contactInfo?.whatsapp || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, whatsapp: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="5493794123456" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">WhatsApp Visible</label>
                  <input type="text" value={sections.contactInfo?.whatsappDisplay || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, whatsappDisplay: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="+54 9 3794 123456" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Instagram</label>
                  <input type="text" value={sections.contactInfo?.instagram || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, instagram: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="global3dcorrientes" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">URL Instagram</label>
                  <input type="text" value={sections.contactInfo?.instagramUrl || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, instagramUrl: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Facebook (usuario)</label>
                  <input type="text" value={sections.contactInfo?.facebook || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, facebook: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="global3d" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">URL Facebook</label>
                  <input type="text" value={sections.contactInfo?.facebookUrl || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, facebookUrl: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ubicación</label>
                  <input type="text" value={sections.contactInfo?.location || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, location: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="Corrientes, Argentina" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Email</label>
                  <input type="email" value={sections.contactInfo?.email || ''} onChange={e => setSections(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="contacto@global3d.com" />
                </div>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Configuración General
              </h3>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Meta mensual de facturación ($)</label>
                <input type="number" value={sections.monthlyGoal ?? 2000000} onChange={e => setSections(prev => ({ ...prev, monthlyGoal: Number(e.target.value) }))} className="w-full bg-zinc-800 rounded-lg py-2 px-3" placeholder="2000000" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}