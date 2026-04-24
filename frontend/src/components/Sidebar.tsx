"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  LogOut, 
  Settings,
  Store
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Función para saber si el link está activo
  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/admin/login");
  };

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0a0a0a] md:flex">
      {/* LOGO */}
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white">
                P
            </div>
            <span className="text-lg font-bold text-white tracking-tight">PrintHub 3D</span>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        
        {/* 1. DASHBOARD (Opcional, si tienes una home) */}
        {/* <Link 
          href="/admin" 
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isActive('/admin') ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="font-medium">Dashboard</span>
        </Link> 
        */}

        {/* 2. PRODUCTOS */}
        <Link 
          href="/admin/products" 
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isActive('/admin/products') ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive('/admin/products') ? 'bg-blue-500 text-white' : 'bg-white/5 group-hover:bg-white/10'}`}>
             <Package className="h-4 w-4" />
          </div>
          <span className="font-medium">Productos</span>
        </Link>

        {/* 3. REPORTES (NUEVO) */}
        <Link 
          href="/admin/analytics" 
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isActive('/admin/analytics') ? 'bg-purple-600/10 text-purple-400 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive('/admin/analytics') ? 'bg-purple-500 text-white' : 'bg-white/5 group-hover:bg-white/10'}`}>
             <BarChart3 className="h-4 w-4" />
          </div>
          <span className="font-medium">Reportes</span>
        </Link>
        
        {/* SEPARADOR */}
        <div className="my-4 h-px bg-white/5 mx-2" />

        {/* OTROS LINKS (Ejemplo) */}
        <Link 
            href="#" 
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
             <Settings className="h-5 w-5" />
             <span className="font-medium">Configuración</span>
        </Link>
      </div>

      {/* FOOTER / LOGOUT */}
      <div className="border-t border-white/5 p-4">
        <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-400 hover:bg-red-500/10 transition-all"
        >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}