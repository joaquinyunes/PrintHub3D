import type { Order } from '../types';

interface PrintItemModalProps {
  order: Order;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PrintItemModal({
  order,
  selectedIndex,
  onSelect,
  onConfirm,
  onClose,
}: PrintItemModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">
          Elegir ítem a imprimir
        </h2>
        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
          Pedido: <span className="text-white">{order.clientName}</span>
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {order.items.map((item, idx) => {
            const printed = Number(item.printedQuantity || 0) >= Number(item.quantity || 0);
            return (
              <button
                key={idx}
                disabled={printed}
                onClick={() => onSelect(idx)}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left transition-all ${
                  printed
                    ? 'border-emerald-500/30 bg-emerald-500/10 cursor-default opacity-60'
                    : selectedIndex === idx
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-white">{item.productName}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    x{item.quantity} {printed && '· IMPRESO'}
                  </div>
                </div>
                {!printed && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                    Seleccionar
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-[11px] font-bold text-gray-500 hover:text-white uppercase tracking-widest"
          >
            Cerrar
          </button>
          <button
            onClick={onConfirm}
            disabled={selectedIndex === null}
            className="px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white text-black disabled:bg-white/20 disabled:text-gray-500"
          >
            Imprimir seleccionado
          </button>
        </div>
      </div>
    </div>
  );
}
