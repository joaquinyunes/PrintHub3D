import { CheckCircle2 } from 'lucide-react';
import type { Order } from '../types';

interface DeliverModalProps {
  order: Order;
  finalCost: string;
  onFinalCostChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeliverModal({
  order,
  finalCost,
  onFinalCostChange,
  onConfirm,
  onClose,
}: DeliverModalProps) {
  const total = order.total ?? 0;
  const profit = total - Number(finalCost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" /> Confirmar Entrega
        </h2>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          El pedido se marcará como entregado y se guardará en ventas.
        </p>
        <div className="bg-[#141414] p-5 rounded-xl border border-white/5 mb-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-medium">Total Venta</span>
            <span className="font-bold text-white">${total.toLocaleString()}</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
              Costo Real (Luz + Material)
            </label>
            <input
              autoFocus
              type="number"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="0"
              value={finalCost}
              onChange={(e) => onFinalCostChange(e.target.value)}
            />
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between text-sm">
            <span className="text-gray-400">Ganancia Neta</span>
            <span className={`font-bold ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${profit.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-green-900/20"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
