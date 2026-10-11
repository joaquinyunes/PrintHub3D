import { useState } from 'react';
import { CheckCircle2, Pencil, Plus, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import OrderClientPanel, { type OrderFormData } from './OrderClientPanel';
import OrderCartPanel, { cartTotal } from './OrderCartPanel';
import type { Order, OrderFile, OrderItem, Product, ProductTypeOption } from '../types';

interface OrderFormModalProps {
  /** Pedido a editar; `null` para uno nuevo. */
  order: Order | null;
  products: Product[];
  productTypeOptions: ProductTypeOption[];
  onClose: () => void;
  /** Se llama con el pedido guardado por el servidor. */
  onSaved: (saved: Order, meta: { isNew: boolean; hasCustomItem: boolean }) => void;
}

const emptyForm = (): OrderFormData => ({
  clientName: '',
  origin: 'Local',
  paymentMethod: 'Efectivo',
  deposit: '',
  notes: '',
  dueDate: '',
  chatLink: '',
});

const formFromOrder = (o: Order): OrderFormData => ({
  clientName: o.clientName,
  origin: o.origin || 'Local',
  paymentMethod: o.paymentMethod || 'Efectivo',
  deposit: String(o.deposit || 0),
  notes: o.notes || '',
  dueDate: o.dueDate ? o.dueDate.split('T')[0] : '',
  chatLink: o.chatLink || '',
});

export default function OrderFormModal({
  order,
  products,
  productTypeOptions,
  onClose,
  onSaved,
}: OrderFormModalProps) {
  const [formData, setFormData] = useState<OrderFormData>(() =>
    order ? formFromOrder(order) : emptyForm(),
  );
  const [files, setFiles] = useState<OrderFile[]>(order?.files || []);
  const [cart, setCart] = useState<OrderItem[]>(order?.items || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.clientName || cart.length === 0 || saving) return;

    const payload = {
      ...formData,
      dueDate: formData.dueDate || null,
      deposit: Number(formData.deposit) || 0,
      items: cart,
      files,
      total: cartTotal(cart),
    };

    setSaving(true);
    try {
      const res = await apiFetch(order ? `/api/orders/${order._id}` : '/api/orders', {
        method: order ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved: Order = await res.json();
        onSaved(saved, { isNew: !order, hasCustomItem: cart.some((i) => i.isCustom) });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'No se pudo guardar el pedido.');
      }
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#141414]">
          <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
            {order ? (
              <Pencil className="text-yellow-500 h-6 w-6" />
            ) : (
              <Plus className="text-blue-500 h-6 w-6" />
            )}
            {order ? 'Editar Pedido' : 'Nueva Orden'}
          </h2>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-500 hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <OrderClientPanel
            formData={formData}
            onFormChange={(patch) => setFormData((cur) => ({ ...cur, ...patch }))}
            files={files}
            onFilesChange={setFiles}
          />
          <OrderCartPanel
            cart={cart}
            onCartChange={setCart}
            products={products}
            productTypeOptions={productTypeOptions}
            deposit={formData.deposit}
            onDepositChange={(deposit) => setFormData((cur) => ({ ...cur, deposit }))}
          />
        </div>

        <div className="p-6 border-t border-white/10 bg-[#141414] flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
          >
            <CheckCircle2 size={16} /> {saving ? 'Guardando...' : 'Guardar Orden'}
          </button>
        </div>
      </div>
    </div>
  );
}
