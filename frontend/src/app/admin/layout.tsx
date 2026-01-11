"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  MessageSquare, 
  LogOut,
  Printer
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // 1. VERIFICAR SI HAY TOKEN
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      // Si no hay llave, ¡AFUERA!
      router.push('/admin/login');
    } else {
      // Si hay llave, pase usted
      const user = JSON.parse(userStr);
      setUserName(user.name);
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  // Evitamos "parpadeos" mostrando nada hasta confirmar autorización
  if (!isAuthorized) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando seguridad...</div>;

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/admin' },
    { icon: <ShoppingCart size={20} />, label: 'Pedidos', href: '/admin/orders' },
    { icon: <Printer size={20} />, label: 'Producción', href: '/admin/production' },
    { icon: <Package size={20} />, label: 'Productos', href: '/admin/products' },
    { icon: <MessageSquare size={20} />, label: 'Mensajes', href: '/admin/social' },
    { icon: <Users size={20} />, label: 'Clientes', href: '/admin/clients' },
    { icon: <BarChart3 size={20} />, label: 'Finanzas', href: '/admin/analytics' }, // Cambié ruta a algo más común
    { icon: <Settings size={20} />, label: 'Ajustes', href: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans selection:bg-primary selection:text-black">
      
      {/* SIDEBAR FIJO */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-white/5">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            GLOBAL 3D <span className="text-[10px] bg-primary text-black px-1 rounded">OS</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Hola, {userName}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 
                  ${isActive 
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

    </div>
  );
}