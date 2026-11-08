import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Link2, MessageSquare, Plus, Upload, X } from 'lucide-react';
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
  referenceUrl: string;
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

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Foto de referencia o modelo 3D (.stl/.3mf): el servidor valida el contenido real antes de guardarlo.
  const upload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiFetch('/api/orders/attachments', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'No se pudo subir el archivo.');
      onFilesChange([...files, { name: data.name, url: data.url, kind: data.kind }]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const addFile = () => {
    if (!tempFile.name || !tempFile.url) return;
    onFilesChange([...files, tempFile]);
    setTempFile({ name: '', url: '' });
  };

  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-6">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">
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
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest flex items-center gap-2">
            <MessageSquare size={12} /> Link del Chat
          </label>
          <input
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-blue-500"
            placeholder="https://web.whatsapp.com/..."
            value={formData.chatLink}
            onChange={(e) => onFormChange({ chatLink: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="order-reference" className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest flex items-center gap-2">
            <Link2 size={12} /> Link de referencia
          </label>
          <input
            id="order-reference"
            type="url"
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-blue-500"
            placeholder="https://www.thingiverse.com/... o una foto"
            value={formData.referenceUrl}
            onChange={(e) => onFormChange({ referenceUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">
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
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">
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
          <button type="button" onClick={addFile} aria-label="Agregar link como archivo" className="bg-purple-600 p-3 rounded-xl text-white">
            <Plus />
          </button>
        </div>
        <div className="mb-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*,.stl,.3mf"
            className="sr-only"
            id="order-attachment"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <label htmlFor="order-attachment" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20">
            <Upload size={14} /> {uploading ? 'Subiendo…' : 'Subir foto o modelo 3D (.stl / .3mf, máx. 50 MB)'}
          </label>
          {uploadError && <p role="alert" className="mt-1 text-xs text-red-300">{uploadError}</p>}
        </div>
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex justify-between bg-white/5 p-2 rounded text-xs">
              <span className="text-gray-300">{f.kind === 'model' ? '🧊 ' : f.kind === 'image' ? '🖼️ ' : ''}{f.name}</span>
              <button
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                aria-label={`Quitar ${f.name}`}
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
