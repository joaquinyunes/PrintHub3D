"use client";

import React, { useEffect, useState } from 'react';
import { Users, Search, Star, MessageCircle, Instagram, Facebook } from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  source: string;
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
        const res = await fetch('http://localhost:5000/api/clients');
        const data = await res.json();
        setClients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

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
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg">
                {client.name.charAt(0).toUpperCase()}
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