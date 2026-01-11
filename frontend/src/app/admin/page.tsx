"use client";

import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    income: 0,
    profit: 0,
    orders: 0,
    stockWarning: 0,
    clients: 0
  });

  useEffect(() => {
    // 1. Obtener el token
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // 👈 ENVIAMOS LA LLAVE
        }
    })
      .then(res => {
          if (res.ok) return res.json();
          throw new Error("Error cargando dashboard");
      })
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  // Función segura para formatear dinero
  const formatMoney = (amount: number) => {
      return (amount || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold text-white">Panel Financiero</h1>
        <p className="text-gray-400">Estado actual de Global 3D.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* INGRESOS BRUTOS */}
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden">
          <div className="flex justify-between relative z-10">
            <div>
                <h3 className="text-sm font-medium text-gray-400">Facturación Total</h3>
                <div className="text-2xl font-bold text-white mt-1">
                    $ {formatMoney(stats.income)} {/* 👈 Uso seguro */}
                </div>
            </div>
            <DollarSign className="h-8 w-8 text-gray-700" />
          </div>
        </div>

        {/* 🤑 GANANCIA NETA (PROFIT) */}
        <div className="p-6 bg-green-900/20 border border-green-500/30 rounded-xl relative overflow-hidden group hover:bg-green-900/30 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <TrendingUp className="h-16 w-16 text-green-500" />
          </div>
          <div className="flex justify-between relative z-10">
            <div>
                <h3 className="text-sm font-bold text-green-400">Ganancia Neta (Profit)</h3>
                <div className="text-3xl font-bold text-green-400 mt-1 shadow-green-500/50 drop-shadow-sm">
                    $ {formatMoney(stats.profit)} {/* 👈 Uso seguro */}
                </div>
                <p className="text-xs text-green-300/60 mt-2">Dinero real en tu bolsillo</p>
            </div>
            <Wallet className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* PEDIDOS ACTIVOS */}
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex justify-between">
            <div>
                <h3 className="text-sm font-medium text-gray-400">En Producción</h3>
                <div className="text-2xl font-bold text-white mt-1">{stats.orders || 0}</div>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* CLIENTES */}
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex justify-between">
            <div>
                <h3 className="text-sm font-medium text-gray-400">Clientes Totales</h3>
                <div className="text-2xl font-bold text-white mt-1">{stats.clients || 0}</div>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

      </div>
    </div>
  );
}