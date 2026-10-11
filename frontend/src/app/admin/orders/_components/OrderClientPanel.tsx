import { useState } from 'react';
import { MessageSquare, Plus, X } from 'lucide-react';
import { ORIGINS, PAYMENTS } from '../constants';
import type { OrderFile } from '../types';

export interface OrderFormData {
  clientName: string;
  origin: string;
  paymentMethod: string;
  deposit: string;
  notes: string;
  dueDate: string;
  chatLink: string;
}

interface OrderClientPanelProps {
  formData: OrderFormData;
  onFormChange: (patch: Partial<OrderFormData>) => void;
  files: OrderFile[];
  onFilesChange: (files: OrderFile[]) => void;
}

/** Columna izquierda del formulario de pedido: cliente, origen, pago, fecha, archivos y notas. */
export default function OrderClientPanel({
  formData,
  onFormChange,
  files,
  onFilesChange,
}: OrderClientPanelProps) {
  const [tempFile, setTempFile] = useState<OrderFile>({ name: '', url: '' });

  const addFile = () => {
    if (!tempFile.name || !tempFile.url) return;
    onFilesChange([...files, tempFile]);
    setTempFile({ name: '', url: '' });
  };

  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-6">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">
            Cliente
          </label>
          <input
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
            value={formData.clientName}
            onChange={(e) => onFormChange({ clientName: e.target.value })}
            placeholder="Nombre completo"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest flex items-center gap-2">
            <MessageSquare size={12} /> Link del Chat
          </label>
          <input
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-blue-500"
            placeholder="https://web.whatsapp.com/..."
            value={formData.chatLink}
            onChange={(e) => onFormChange({ chatLink: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">
              Origen
            </label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={formData.origin}
              onChange={(e) => onFormChange({ origin: e.target.value })}
            >
              {ORIGINS.map((o) => (
                <option key={o} value={o} className="bg-black">
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">
              Pago
            </label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500"
              value={formData.paymentMethod}
              onChange={(e) => onFormChange({ paymentMethod: e.target.value })}
            >
              {PAYMENTS.map((p) => (
                <option key={p} value={p} className="bg-black">
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">
          Fecha de Entrega
        </label>
        <input
          type="date"
          className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500"
          value={formData.dueDate}
          onChange={(e) => onFormChange({ dueDate: e.target.value })}
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">
          Archivos
        </label>
        <div className="flex gap-2 mb-2">
          <input
            placeholder="Nombre"
            className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white"
            value={tempFile.name}
            onChange={(e) => setTempFile({ ...tempFile, name: e.target.value })}
          />
          <input
            placeholder="Link"
            className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white"
            value={tempFile.url}
            onChange={(e) => setTempFile({ ...tempFile, url: e.target.value })}
          />
          <button onClick={addFile} className="bg-purple-600 p-3 rounded-xl text-white">
            <Plus />
          </button>
        </div>
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex justify-between bg-white/5 p-2 rounded text-xs">
              <span className="text-gray-300">{f.name}</span>
              <button
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                className="text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <textarea
        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white h-24 outline-none resize-none focus:border-white/30"
        value={formData.notes}
        onChange={(e) => onFormChange({ notes: e.target.value })}
        placeholder="Notas..."
      />
    </div>
  );
}
