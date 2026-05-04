"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 👈 AGREGADO: Importamos Image de Next.js
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Printer,
  BarChart3,
  DollarSign,
  Home,
  Store
} from "lucide-react";

interface StoredUser {
  token: string;
  user: {
    name?: string;
    role: string;
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- 1. SEGURIDAD ---
  useEffect(() => {
    // ... tu código de seguridad se mantiene igual ...
    if (pathname === "/admin/login") {
      setIsAuthorized(true);
      return;
    }

    const stored = localStorage.getItem("user");

    if (!stored) {
      router.replace("/admin/login");
      return;
    }

    try {
      const session: StoredUser = JSON.parse(stored);
      if (!session.token || session.user?.role !== "admin") {
        localStorage.clear();
        router.replace("/admin/login");
        return;
      }
      setIsAuthorized(true);
    } catch {
      localStorage.clear();
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/admin/login");
  };

  // --- 2. RENDERIZADO ---
  if (pathname === "/admin/login") {
    return <main className="min-h-screen bg-black">{children}</main>;
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-400 animate-pulse">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // --- 3. PANEL DE ADMINISTRACIÓN ---
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0 flex flex-col`}
      >
        {/* 👇👇👇 SECCIÓN DE LOGO ACTUALIZADA 👇👇👇 */}
        <div className="flex h-[4.5rem] items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            
            {/* Contenedor del Logo */}
            <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 p-1 border border-white/10 shadow-lg shadow-blue-900/20">
              <Image 
                src="/logo.png" // 👈 Cambia esto por el nombre real de tu archivo en la carpeta public
                alt="Logo Global 3D"
                fill
                className="object-contain" // Para que no se deforme
              />
            </div>

            {/* Texto Estilizado */}
            <div className="flex flex-col justify-center">
              <span className="text-base font-black tracking-tight text-white leading-tight">
                GLOBAL 3D
              </span>
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                Corrientes
              </span>
            </div>

          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* 👆👆👆 FIN DE SECCIÓN DE LOGO 👆👆👆 */}

        {/* Links de Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/admin"} />
          <NavItem href="/admin/home" icon={<Home size={20} />} label="Inicio Web" active={pathname === "/admin/home"} />
          <NavItem href="/admin/products" icon={<Package size={20} />} label="Inventario" active={pathname.includes("/products")} />
          <NavItem href="/admin/orders" icon={<ShoppingCart size={20} />} label="Pedidos" active={pathname.includes("/orders")} />
          <NavItem href="/admin/production" icon={<Printer size={20} />} label="Producción" active={pathname.includes("/production")} />
          <NavItem href="/admin/expenses" icon={<DollarSign size={20} />} label="Gastos" active={pathname.includes("/expenses")} />
          <NavItem href="/admin/analytics" icon={<BarChart3 size={20} />} label="Reportes" active={pathname.includes("/analytics")} />
          
          <div className="my-4 h-px bg-white/5 mx-2" />
          
          <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Configuración" active={pathname.includes("/settings")} />
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            onClick={() => window.open('/', '_blank')}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-green-400 hover:bg-green-500/10 hover:text-green-300 rounded-xl transition-colors"
          >
            <Store size={18} />
            <span>Ver Tienda</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden flex h-16 items-center px-4 border-b border-white/10 bg-[#111]">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white p-2">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-white">Panel Admin</span>
        </header>

        <main className="flex-1 overflow-auto bg-[#0a0a0a]">
          {children}
        </main>
      </div>
      
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Componente NavItem se mantiene igual...
function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-blue-600/20 to-blue-600/10 text-blue-400 shadow-sm border border-blue-500/10"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className={`${active ? "text-blue-400" : "text-gray-500 group-hover:text-white transition-colors"}`}>
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  );
}