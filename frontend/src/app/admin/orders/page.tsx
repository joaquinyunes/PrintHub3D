"use client";

import React, { useEffect, useState } from 'react';
import { 
  Plus, Calendar, Clock, CheckCircle, Truck, Printer, User, Search 
} from 'lucide-react';

// --- TIPOS ---
interface Order {
  _id: string;
  customerName: string;
  source: string;
  status: 'pendiente' | 'imprimiendo' | 'terminado' | 'entregado';
  totalAmount: number;
  items: any[];
  createdAt: string; 
  dueDate?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    source: 'whatsapp',
    items: [] as any[],
    createdAt: new Date().toISOString().split('T')[0], // Hoy
    dueDate: '', 
  });
  
  // Items Temporales
  const [selectedInput, setSelectedInput] = useState(''); // Lo que escribe el usuario
  const [tempPrice, setTempPrice] = useState(''); // Precio manual o automático
  const [quantity, setQuantity] = useState(1);

  // CARGAR DATOS
  const fetchData = async () => {
    try {
      const [resOrders, resProducts] = await Promise.all([
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/products')
      ]);
      setOrders(await resOrders.json());
      setProducts(await resProducts.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA AGREGAR ITEM (HÍBRIDO) ---
  const addItem = () => {
    if (!selectedInput) return;

    // Buscamos si lo que escribió coincide con un producto real
    const realProduct = products.find(p => p.name.toLowerCase() === selectedInput.toLowerCase());

    let newItem;
    if (realProduct) {
        // Es producto de inventario
        newItem = { 
            productId: realProduct._id, 
            productName: realProduct.name, 
            price: Number(tempPrice) || realProduct.price, 
            quantity: Number(quantity) 
        };
    } else {
        // Es custom (escrito a mano)
        newItem = { 
            productName: selectedInput, 
            price: Number(tempPrice) || 0, 
            quantity: Number(quantity) 
        };
    }

    setNewOrder({ ...newOrder, items: [...newOrder.items, newItem] });
    // Limpiar inputs
    setSelectedInput('');
    setTempPrice('');
    setQuantity(1);
  };

  // --- MANEJO DEL INPUT INTELIGENTE ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedInput(val);
    
    // Si coincide con uno existente, autocompletar precio
    const found = products.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (found) {
        setTempPrice(found.price.toString());
    }
  };

  // GUARDAR PEDIDO
  const saveOrder = async () => {
    const res = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewOrder({ customerName: '', source: 'whatsapp', items: [], createdAt: new Date().toISOString().split('T')[0], dueDate: '' });
      fetchData();
    }
  };

  // --- BOTÓN DE ESTADOS ---
  const handleNextStep = async (order: Order) => {
    let nextStatus = '';
    let body = {};

    if (order.status === 'pendiente') {
      const mins = prompt("¿Tiempo estimado (min)?", "60");
      if (!mins) return;
      nextStatus = 'imprimiendo';
      body = { status: nextStatus, printTimeMinutes: Number(mins) };
    } 
    else if (order.status === 'imprimiendo') {
      if (!confirm("¿Impresión terminada?")) return;
      nextStatus = 'terminado';
      body = { status: nextStatus };
    } 
    else if (order.status === 'terminado') {
      if (!confirm("¿Marcar como Entregado?")) return;
      nextStatus = 'entregado';
      body = { status: nextStatus };
    }

    if (nextStatus) {
      await fetch(`http://localhost:5000/api/orders/${order._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      fetchData();
    }
  };

  // HELPERS
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'}) : '-';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-black px-4 py-2 rounded-md font-bold hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Pedido
        </button>
      </div>

      {/* TABLA DE PEDIDOS */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Fechas</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="font-bold text-white flex gap-2"><User className="h-4 w-4"/> {order.customerName}</div>
                  <div className="text-xs text-muted-foreground uppercase pl-6">{order.source}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs gap-1">
                     <span className="flex gap-2 text-gray-300"><Calendar className="h-3 w-3"/> {formatDate(order.createdAt)}</span>
                     {order.dueDate && <span className="flex gap-2 text-red-300 font-bold"><Clock className="h-3 w-3"/> {formatDate(order.dueDate)}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {order.items.map((i, k) => <div key={k} className="text-xs text-gray-300"><span className="text-white font-bold">{i.quantity}x</span> {i.productName}</div>)}
                  <div className="text-green-400 font-bold text-xs mt-1">${order.totalAmount.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 uppercase text-xs font-bold">{order.status}</td>
                <td className="px-6 py-4 text-right">
                  {order.status === 'pendiente' && <button onClick={() => handleNextStep(order)} className="bg-blue-600 px-3 py-1 rounded text-white text-xs">Iniciar</button>}
                  {order.status === 'imprimiendo' && <button onClick={() => handleNextStep(order)} className="bg-green-600 px-3 py-1 rounded text-white text-xs">Terminar</button>}
                  {order.status === 'terminado' && <button onClick={() => handleNextStep(order)} className="border border-white/20 px-3 py-1 rounded text-white text-xs">Entregar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FLEXIBLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-white/10 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Cargar Pedido</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <input placeholder="Nombre Cliente" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} className="bg-black/50 border border-white/10 rounded p-2 text-sm outline-none"/>
                 <select value={newOrder.source} onChange={e => setNewOrder({...newOrder, source: e.target.value})} className="bg-black/50 border border-white/10 rounded p-2 text-sm outline-none">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="local">Local</option>
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs text-muted-foreground">Fecha Pedido</label><input type="date" value={newOrder.createdAt} onChange={e => setNewOrder({...newOrder, createdAt: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm"/></div>
                 <div><label className="text-xs text-muted-foreground">Entrega (Opcional)</label><input type="date" value={newOrder.dueDate} onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm focus:border-red-500"/></div>
              </div>

              {/* INPUT PRODUCTO FLEXIBLE */}
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <input 
                            list="products-list" 
                            placeholder="Producto (Elegir o Escribir)..." 
                            value={selectedInput}
                            onChange={handleInputChange}
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
                        />
                        <datalist id="products-list">
                            {products.map(p => <option key={p._id} value={p.name}>Stock: {p.stock} | ${p.price}</option>)}
                        </datalist>
                    </div>
                    <input type="number" placeholder="$" value={tempPrice} onChange={e => setTempPrice(e.target.value)} className="w-20 bg-black/50 border border-white/10 rounded p-2 text-center text-sm"/>
                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-14 bg-black/50 border border-white/10 rounded p-2 text-center text-sm"/>
                    <button onClick={addItem} className="bg-white/10 p-2 rounded hover:bg-white/20"><Plus className="h-4 w-4"/></button>
                </div>
                {/* LISTA ITEMS */}
                <div className="mt-2 space-y-1 max-h-32 overflow-auto">
                    {newOrder.items.map((it, i) => (
                        <div key={i} className="text-xs flex justify-between bg-black/30 p-1 rounded">
                            <span>{it.quantity}x {it.productName}</span>
                            <span>${it.price * it.quantity}</span>
                        </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-sm hover:bg-white/10">Cancelar</button>
                <button onClick={saveOrder} disabled={newOrder.items.length === 0} className="bg-primary text-black px-6 py-2 rounded font-bold text-sm hover:bg-primary/90 disabled:opacity-50">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}