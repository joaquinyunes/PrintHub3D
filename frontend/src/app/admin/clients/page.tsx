"use client";

import React, { useEffect, useState } from 'react';
import { Users, Search, Star, MessageCircle, Instagram, Facebook, Camera } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Client {
  _id: string;
  name: string;
  source: string;
  avatar?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const stored = localStorage.getItem("user");
        const token = stored ? JSON.parse(stored).token : '';
        const res = await fetch(apiUrl('/api/clients'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setClients(data.items || data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const updateAvatar = async (clientId: string, avatarUrl: string) => {
    const stored = localStorage.getItem("user");
    const token = stored ? JSON.parse(stored).token : '';
    
    await fetch(apiUrl(`/api/clients/${clientId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ avatar: avatarUrl })
    });
    
    setClients(prev => prev.map(c => c._id === clientId ? { ...c, avatar: avatarUrl } : c));
  };

  const getSourceIcon = (source: string) => {
    if (source === 'instagram') return <Instagram className="h-4 w-4 text-pink-500" />;
    if (source === 'facebook') return <Facebook className="h-4 w-4 text-blue-500" />;
    return <MessageCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Cartera de Clientes</h1>
           <p className="text-muted-foreground">Tus mejores compradores ordenados por valor.</p>
        </div>
        <div className="bg-card border border-white/10 p-2 rounded-lg flex items-center gap-2 w-64">
           <Search className="h-4 w-4 text-muted-foreground" />
           <input placeholder="Buscar cliente..." className="bg-transparent outline-none text-sm w-full"/>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client, index) => (
          <div key={client._id} className="group relative bg-card border border-white/10 rounded-xl p-6 hover:bg-white/5 transition duration-300">
            
            {/* Medalla para el TOP 3 */}
            {index < 3 && (
               <div className="absolute top-4 right-4 text-yellow-500 animate-pulse">
                 <Star className="h-5 w-5 fill-yellow-500" />
               </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="relative group">
                {client.avatar ? (
                  <img 
                    src={client.avatar} 
                    alt={client.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button 
                  onClick={() => {
                    const url = prompt('Ingresá la URL de la imagen:', client.avatar || '');
                    if (url) updateAvatar(client._id, url);
                  }}
                  className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <Camera className="h-3 w-3 text-white" />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-lg">{client.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                   {getSourceIcon(client.source)}
                   <span className="capitalize">{client.source}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Gastado</p>
                <p className="font-mono text-lg text-green-400 font-bold">
                  ${client.totalSpent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="font-mono text-lg text-white font-bold">
                  {client.orderCount}
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-center text-gray-500">
              Última compra: {new Date(client.lastOrderDate).toLocaleDateString()}
            </div>
            
          </div>
        ))}

        {clients.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aún no hay clientes registrados.</p>
            <p className="text-sm">Carga tu primer pedido y el cliente aparecerá aquí automáticamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}