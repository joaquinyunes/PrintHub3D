import { useState } from 'react';
import {
  Calculator,
  Coins,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Timer,
  Trash2,
  Wrench,
} from 'lucide-react';
import type { OrderItem, Product, ProductTypeOption } from '../types';

const DEFAULT_PRINT_MINUTES = 30;

export const cartTotal = (cart: OrderItem[]): number =>
  cart.reduce((acc, i) => acc + Number(i.price) * Number(i.quantity), 0);

interface ItemInput {
  id: string;
  qty: number;
  customName: string;
  customPrice: string;
  printTimeMinutes: number;
  productType: string;
}

const EMPTY_ITEM_INPUT: ItemInput = {
  id: '',
  qty: 1,
  customName: '',
  customPrice: '',
  printTimeMinutes: DEFAULT_PRINT_MINUTES,
  productType: '',
};

interface OrderCartPanelProps {
  cart: OrderItem[];
  onCartChange: (cart: OrderItem[]) => void;
  products: Product[];
  productTypeOptions: ProductTypeOption[];
  deposit: string;
  onDepositChange: (value: string) => void;
}

/** Columna derecha del formulario de pedido: alta de ítems, carrito y totales. */
export default function OrderCartPanel({
  cart,
  onCartChange,
  products,
  productTypeOptions,
  deposit,
  onDepositChange,
}: OrderCartPanelProps) {
  const [itemTab, setItemTab] = useState<'product' | 'custom'>('product');
  const [itemInput, setItemInput] = useState<ItemInput>(EMPTY_ITEM_INPUT);

  const patchInput = (patch: Partial<ItemInput>) => setItemInput({ ...itemInput, ...patch });

  const addItem = () => {
    if (itemTab === 'product') {
      const p = products.find((x) => x._id === itemInput.id);
      if (!p || itemInput.qty <= 0) return;
      onCartChange([
        ...cart,
        {
          productId: p._id,
          productName: p.name,
          price: Number(p.price),
          quantity: Number(itemInput.qty),
          isCustom: false,
          printTimeMinutes: Number(itemInput.printTimeMinutes) || DEFAULT_PRINT_MINUTES,
        },
      ]);
      patchInput({ qty: 1, printTimeMinutes: DEFAULT_PRINT_MINUTES });
      return;
    }

    if (!itemInput.customName || !itemInput.customPrice) return;
    const productName = itemInput.productType
      ? `${itemInput.customName} (${itemInput.productType})`
      : itemInput.customName;
    onCartChange([
      ...cart,
      {
        productName,
        price: Number(itemInput.customPrice),
        quantity: Number(itemInput.qty) || 1,
        isCustom: true,
        printTimeMinutes: Number(itemInput.printTimeMinutes) || DEFAULT_PRINT_MINUTES,
        productType: itemInput.productType || undefined,
      },
    ]);
    patchInput({
      customName: '',
      customPrice: '',
      productType: '',
      qty: 1,
      printTimeMinutes: DEFAULT_PRINT_MINUTES,
    });
  };

  return (
    <div className="lg:col-span-7 flex flex-col h-full lg:pl-10 lg:border-l border-white/5">
      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <ShoppingCart size={14} /> Carrito de Compra
      </h3>

      {/* Selector Tipo Item */}
      <div className="flex bg-[#141414] p-1.5 rounded-2xl mb-6 border border-white/5 w-fit">
        <button
          onClick={() => setItemTab('product')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${itemTab === 'product' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Package size={14} /> PRODUCTO
        </button>
        <button
          onClick={() => setItemTab('custom')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${itemTab === 'custom' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Wrench size={14} /> PERSONALIZADO
        </button>
      </div>

      {/* Inputs Agregar Item */}
      <div
        className={`mb-4 bg-white/5 p-2 rounded-2xl border border-white/5 ${
          itemTab === 'custom' ? 'flex flex-col gap-3' : 'flex gap-2 flex-wrap items-center'
        }`}
      >
        {itemTab === 'product' ? (
          <>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <select
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-blue-500 appearance-none [&>option]:bg-zinc-900 [&>option]:text-white"
                value={itemInput.id}
                onChange={(e) => patchInput({ id: e.target.value })}
              >
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (${p.price})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20 border-l border-white/10">
              <input
                type="number"
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 text-center text-white outline-none text-sm"
                value={itemInput.qty}
                onChange={(e) => patchInput({ qty: Number(e.target.value) })}
              />
            </div>
            <div
              className="w-24 border-l border-white/10 flex items-center justify-center gap-1 px-1"
              title="Tiempo de impresión (minutos)"
            >
              <Timer size={12} className="text-gray-500" />
              <input
                type="number"
                className="w-12 bg-transparent border-none py-3 text-center text-white outline-none text-xs"
                value={itemInput.printTimeMinutes}
                onChange={(e) => patchInput({ printTimeMinutes: Number(e.target.value) })}
              />
            </div>
            <button
              type="button"
              onClick={addItem}
              className="bg-white text-black px-4 rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              <Plus size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center w-full">
              <input
                className="flex-1 min-w-[200px] bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-purple-500"
                placeholder="Nombre del producto (ej: Vaso River)"
                value={itemInput.customName}
                onChange={(e) => patchInput({ customName: e.target.value })}
              />
              <div className="relative w-32 min-w-[7rem] border border-white/10 rounded-xl bg-zinc-900/80">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  className="w-full bg-transparent border-none pl-7 pr-2 py-3 text-white outline-none text-sm"
                  placeholder="Precio"
                  value={itemInput.customPrice}
                  onChange={(e) => patchInput({ customPrice: e.target.value })}
                />
              </div>
              <div className="w-20 min-w-[5rem] border border-white/10 rounded-xl bg-zinc-900/80">
                <input
                  type="number"
                  className="w-full bg-transparent border-none py-3 text-center text-white outline-none text-sm"
                  value={itemInput.qty}
                  onChange={(e) => patchInput({ qty: Number(e.target.value) })}
                />
              </div>
              <div
                className="w-24 min-w-[6rem] border border-white/10 rounded-xl bg-zinc-900/80 flex items-center justify-center gap-1 px-1"
                title="Tiempo de impresión (minutos)"
              >
                <Timer size={12} className="text-zinc-500 shrink-0" />
                <input
                  type="number"
                  className="w-full bg-transparent border-none py-3 text-center text-white outline-none text-xs min-w-0"
                  value={itemInput.printTimeMinutes}
                  onChange={(e) => patchInput({ printTimeMinutes: Number(e.target.value) })}
                />
              </div>
              <button
                type="button"
                onClick={addItem}
                className="bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-bold shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-purple-500/25 bg-zinc-950/90 p-3">
              <p className="text-[11px] font-bold text-purple-200 uppercase tracking-widest mb-2">
                Tipo de producto
              </p>
              <div className="flex flex-wrap gap-2">
                {productTypeOptions.map((t, optIdx) => {
                  const selected = itemInput.productType === t.value;
                  return (
                    <button
                      key={`opt-${optIdx}-${t.value || 'none'}`}
                      type="button"
                      onClick={() => patchInput({ productType: t.value })}
                      className={`rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                        selected
                          ? 'bg-purple-600 border-purple-300 text-white shadow-md shadow-purple-900/40'
                          : 'bg-zinc-900 border-white/15 text-zinc-100 hover:border-white/35 hover:bg-zinc-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                Para <span className="text-zinc-200 font-semibold">agregar tipos nuevos</span>, andá
                a{' '}
                <a
                  href="/admin/home#videos-por-codigo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-300 hover:text-purple-200 underline font-semibold"
                >
                  Admin → Inicio web → Videos por código
                </a>
                : cada fila (código + nombre + video) aparece acá como tipo. Guardá en Inicio y
                reabrí este pedido para refrescar.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Lista Carrito */}
      <div className="flex-1 bg-[#141414] rounded-2xl border border-white/5 overflow-hidden flex flex-col mb-6">
        <div className="overflow-y-auto flex-1 custom-scrollbar p-3 space-y-2">
          {cart.map((i, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${i.isCustom ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}
                >
                  {i.isCustom ? <Wrench size={16} /> : <Package size={16} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{i.productName}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {i.quantity} x ${i.price.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-white font-bold text-lg">
                  ${(i.price * i.quantity).toLocaleString()}
                </span>
                <button
                  onClick={() => onCartChange(cart.filter((_, x) => x !== idx))}
                  className="text-gray-600 hover:text-red-400 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-30 gap-2">
              <ShoppingCart size={40} />
              <p className="text-xs uppercase tracking-widest">Carrito vacío</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel Totales */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-black p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Calculator size={100} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Total Estimado
          </span>
          <span className="text-4xl font-black text-white tracking-tighter">
            ${cartTotal(cart).toLocaleString()}
          </span>
        </div>
        <div className="h-px bg-white/10 w-full"></div>
        <div className="flex justify-between items-center">
          <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Coins size={14} /> Seña / Anticipo
          </span>
          <div className="flex items-center gap-2 bg-yellow-500/10 px-3 rounded-xl border border-yellow-500/20 overflow-hidden">
            <span className="text-yellow-500 font-bold">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="bg-black/20 rounded-lg text-right w-28 text-xl text-yellow-400 font-black outline-none py-2 px-2 placeholder:text-yellow-700"
              value={deposit}
              onChange={(e) => onDepositChange(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
