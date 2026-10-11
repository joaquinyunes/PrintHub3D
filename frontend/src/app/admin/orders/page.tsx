'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Package, Plus, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { TABS, mergeOrderProductTypes } from './constants';
import { filterAndSortOrders, groupOrdersByDueDate, sortGroupKeys } from './groupOrders';
import { useCustomCodes } from './useCustomCodes';
import type { Order, Product, TabId } from './types';
import OrderCard from './_components/OrderCard';
import OrderFormModal from './_components/OrderFormModal';
import DeliverModal from './_components/DeliverModal';
import PrintItemModal from './_components/PrintItemModal';
import TrackingCodeModal from './_components/TrackingCodeModal';

export default function OrderListPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<TabId>('production');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deliverOrder, setDeliverOrder] = useState<Order | null>(null);
  const [finalCost, setFinalCost] = useState('');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printIndex, setPrintIndex] = useState<number | null>(null);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);

  const { codes: customCodes, refresh: refreshCustomCodes } = useCustomCodes();
  const productTypeOptions = useMemo(() => mergeOrderProductTypes(customCodes), [customCodes]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resO, resP] = await Promise.all([apiFetch('/api/orders'), apiFetch('/api/products')]);
        if (resO.ok) {
          const raw = await resO.json();
          setOrders(Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : []);
        }
        if (resP.ok) setProducts(await resP.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const groupedOrders = useMemo(
    () => groupOrdersByDueDate(filterAndSortOrders(orders, activeTab, searchTerm), activeTab),
    [orders, activeTab, searchTerm],
  );
  const sortedGroupKeys = sortGroupKeys(Object.keys(groupedOrders));

  // --- ACCIONES ---
  const replaceOrder = (updated: Order) =>
    setOrders((cur) => cur.map((o) => (o._id === updated._id ? updated : o)));

  const openNew = () => {
    setEditingOrder(null);
    refreshCustomCodes();
    setFormOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    refreshCustomCodes();
    setFormOpen(true);
  };

  const openDeliver = (order: Order) => {
    setDeliverOrder(order);
    setFinalCost('');
  };

  const handleSaved = (saved: Order, meta: { isNew: boolean; hasCustomItem: boolean }) => {
    if (meta.isNew) setOrders((cur) => [saved, ...cur]);
    else replaceOrder(saved);

    // Con un ítem personalizado, mostramos el código de seguimiento al operario.
    if (meta.hasCustomItem && saved.trackingCode) setCreatedOrderCode(saved.trackingCode);
    setFormOpen(false);
  };

  const confirmDelivery = async () => {
    if (!deliverOrder) return;
    try {
      const res = await apiFetch(`/api/orders/${deliverOrder._id}/register-sale`, {
        method: 'POST',
        body: JSON.stringify({ finalCost: Number(finalCost) || 0 }),
      });
      if (res.ok) {
        const { order } = await res.json();
        replaceOrder(order);
        setDeliverOrder(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    if (status === 'delivered') {
      const order = orders.find((x) => x._id === id);
      if (order) {
        openDeliver(order);
        return;
      }
    }

    const previous = orders;
    setOrders((cur) => cur.map((o) => (o._id === id ? { ...o, status } : o)));
    try {
      const res = await apiFetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const updated = await res.json();
      setOrders((cur) => cur.map((o) => (o._id === id ? { ...o, ...updated } : o)));
    } catch (e) {
      console.error(e);
      setOrders(previous);
      alert('No se pudo cambiar el estado del pedido. Reintentá en unos segundos.');
    }
  };

  const markAsPaid = async (order: Order) => {
    if (!confirm('¿Saldar deuda?')) return;
    try {
      const res = await apiFetch(`/api/orders/${order._id}`, {
        method: 'PUT',
        body: JSON.stringify({ deposit: order.total }),
      });
      if (res.ok) {
        replaceOrder(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'No se pudo saldar la deuda.');
      }
    } catch (e) {
      console.error(e);
      alert('No se pudo saldar la deuda.');
    }
  };

  const openPrintModal = (order: Order) => {
    setPrintOrder(order);
    setPrintIndex(0);
  };

  const closePrintModal = () => {
    setPrintOrder(null);
    setPrintIndex(null);
  };

  const handlePrintItem = async () => {
    if (!printOrder || printIndex === null) return;
    try {
      const res = await apiFetch(`/api/orders/${printOrder._id}/print-item`, {
        method: 'POST',
        body: JSON.stringify({ itemIndex: printIndex }),
      });
      if (res.ok) {
        replaceOrder(await res.json());
        closePrintModal();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 className="animate-spin text-blue-500 h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans selection:bg-blue-500/30">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
          <div>
            <h1
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter mb-2"
              style={{ textShadow: '0px 0px 30px rgba(59,130,246,0.3)' }}
            >
              PEDIDOS
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] pl-1">
              Centro de Comando
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative group flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 h-4 w-4 transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-xs font-bold text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all uppercase tracking-wider"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={openNew}
              className="bg-white text-black px-8 py-4 rounded-full font-black flex items-center gap-3 hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap"
            >
              <Plus className="h-5 w-5" /> <span className="hidden md:inline">Nuevo Pedido</span>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-12 border-b border-white/10 pb-1 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = orders.filter((o) => tab.statuses.includes(o.status)).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-4 px-6 text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-3 group min-w-fit ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-300'}`}
              >
                <tab.icon
                  className={`h-5 w-5 ${isActive ? tab.color : 'text-gray-600 group-hover:text-gray-400'}`}
                />
                <div className="flex flex-col items-start">
                  <span>{tab.label}</span>
                  <span className="text-[9px] normal-case opacity-50 font-medium tracking-normal">
                    {tab.description}
                  </span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-black' : 'bg-white/10 text-gray-500'}`}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <div
                    className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${tab.color.split('-')[1]}-500 to-transparent shadow-[0_-5px_10px_${tab.color.split('-')[1]}]`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* LISTA */}
        <div className="space-y-16 pb-20">
          {sortedGroupKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Package size={64} className="mb-4 text-gray-500" />
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
                No hay pedidos en esta sección
              </p>
            </div>
          ) : (
            sortedGroupKeys.map((dateLabel) => (
              <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`h-px flex-1 ${dateLabel.includes('VENCIDOS') ? 'bg-red-500/50' : 'bg-white/10'}`}
                  ></div>
                  <h3
                    className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${dateLabel.includes('VENCIDOS') ? 'text-red-500 animate-pulse' : dateLabel.includes('HOY') ? 'text-yellow-400' : 'text-white'}`}
                  >
                    {dateLabel.includes('VENCIDOS') && <AlertTriangle className="h-6 w-6" />}
                    {dateLabel}
                  </h3>
                  <div
                    className={`h-px flex-1 ${dateLabel.includes('VENCIDOS') ? 'bg-red-500/50' : 'bg-white/10'}`}
                  ></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {groupedOrders[dateLabel].map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      activeTab={activeTab}
                      onEdit={() => openEdit(order)}
                      onDeliver={() => openDeliver(order)}
                      onStatusChange={changeStatus}
                      onPay={() => markAsPaid(order)}
                      onPrint={() => openPrintModal(order)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {deliverOrder && (
          <DeliverModal
            order={deliverOrder}
            finalCost={finalCost}
            onFinalCostChange={setFinalCost}
            onConfirm={confirmDelivery}
            onClose={() => setDeliverOrder(null)}
          />
        )}

        {formOpen && (
          <OrderFormModal
            order={editingOrder}
            products={products}
            productTypeOptions={productTypeOptions}
            onClose={() => setFormOpen(false)}
            onSaved={handleSaved}
          />
        )}

        {printOrder && (
          <PrintItemModal
            order={printOrder}
            selectedIndex={printIndex}
            onSelect={setPrintIndex}
            onConfirm={handlePrintItem}
            onClose={closePrintModal}
          />
        )}

        {createdOrderCode && (
          <TrackingCodeModal code={createdOrderCode} onClose={() => setCreatedOrderCode(null)} />
        )}
      </div>
    </div>
  );
}
