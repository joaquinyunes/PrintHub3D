import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Factory,
  FileText,
  Flame,
  History,
  Link as LinkIcon,
  MessageSquare,
  PackageCheck,
} from 'lucide-react';
import { ORIGIN_CONFIG, STATUSES } from '../constants';
import { parseDueDate } from '../groupOrders';
import type { Order, TabId } from '../types';

interface OrderCardProps {
  order: Order;
  activeTab: TabId;
  onEdit: () => void;
  onDeliver: () => void;
  onStatusChange: (id: string, status: string) => void;
  onPay: () => void;
  onPrint: () => void;
}

export default function OrderCard({
  order,
  activeTab,
  onEdit,
  onDeliver,
  onStatusChange,
  onPay,
  onPrint,
}: OrderCardProps) {
  const originConf = ORIGIN_CONFIG[order.origin || 'Local'] || ORIGIN_CONFIG['Local'];
  const OriginIcon = originConf.icon;
  const balance = (order.total ?? 0) - (order.deposit ?? 0);
  const statusInfo = STATUSES.find((s) => s.value === order.status) || STATUSES[0];

  const dueDate = parseDueDate(order.dueDate);
  const isOverdue = dueDate !== null && dueDate.getTime() < new Date().setHours(0, 0, 0, 0);

  // Efecto "En Proceso"
  const isPrinting = order.status === 'in_progress';
  const cardStyle = isPrinting
    ? 'bg-gradient-to-br from-orange-900/20 to-[#0f0f0f] border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-pulse-slow'
    : 'bg-[#0f0f0f] border-white/5 shadow-xl hover:border-white/20 hover:bg-[#141414]';

  return (
    <div
      className={`rounded-3xl p-6 relative group transition-all duration-500 border ${cardStyle}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPrinting ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : order.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : order.status === 'delivered' ? 'bg-gray-500' : 'bg-yellow-500'}`}
      />

      <div className="flex justify-between items-start mb-4 pl-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-lg ${originConf.color} bg-opacity-20`}>
              <OriginIcon size={12} className="text-current" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {order.origin}
            </span>
          </div>
          <h4 className="font-bold text-white text-lg line-clamp-1">{order.clientName}</h4>
          {order.items?.some((it) => it.isCustom) && order.trackingCode && (
            <p
              className="mt-1 text-[10px] font-mono text-purple-300/90 truncate"
              title={order.trackingCode}
            >
              Código: {order.trackingCode}
            </p>
          )}
          {/* FECHA */}
          {dueDate && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              <Calendar size={12} className={isOverdue ? 'text-red-500' : 'text-gray-500'} />
              {dueDate.toLocaleDateString()}
            </div>
          )}
          {/* LINK CHAT */}
          {order.chatLink && (
            <a
              href={order.chatLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider hover:underline w-fit"
            >
              <MessageSquare size={12} /> Ir al chat
            </a>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-white">
            ${(order.total ?? 0).toLocaleString()}
          </div>
          {balance > 0 ? (
            <button
              onClick={onPay}
              className="text-[10px] text-red-400 font-bold uppercase bg-red-500/10 px-2 py-0.5 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1 ml-auto"
            >
              Resta ${balance.toLocaleString()} <DollarSign size={8} />
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 ml-auto">
              <CheckCircle2 size={10} /> Pagado
            </span>
          )}
        </div>
      </div>

      {/* SI ESTÁ IMPRIMIENDO */}
      {isPrinting && (
        <div className="mb-4 pl-3 flex items-center gap-2 text-orange-500 font-black uppercase text-xs tracking-widest animate-pulse">
          <Flame size={14} /> Imprimiendo en curso...
        </div>
      )}

      <div className="bg-black/30 rounded-xl p-3 mb-4 space-y-2 border border-white/5 pl-3 min-h-[60px]">
        {order.items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-300">
            <span className="truncate max-w-[150px]">{item.productName}</span>
            <span className="font-bold text-white bg-white/10 px-1.5 rounded">
              {item.quantity}x
            </span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-[10px] text-center text-gray-500 italic">
            + {order.items.length - 3} más
          </p>
        )}
      </div>

      {(order.notes || (order.files && order.files.length > 0)) && (
        <div className="mb-4 pl-3 flex gap-2">
          {order.notes && (
            <div
              className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg border border-yellow-500/20"
              title={order.notes}
            >
              <FileText size={14} />
            </div>
          )}
          {order.files?.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <LinkIcon size={14} />
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pl-3">
        <button
          onClick={onEdit}
          className="flex-1 min-w-[80px] py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors border border-white/5 uppercase tracking-wider"
        >
          Editar
        </button>

        {activeTab === 'production' && order.status === 'pending' && (
          <button
            onClick={() => onStatusChange(order._id, 'in_progress')}
            className="flex-[2] min-w-[130px] py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Flame size={16} /> Empezar
          </button>
        )}

        {activeTab === 'production' && order.status === 'in_progress' && (
          <button
            onClick={() => onStatusChange(order._id, 'completed')}
            className="flex-[2] min-w-[130px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <PackageCheck size={16} /> Marcar listo
          </button>
        )}

        {activeTab === 'production' && (
          <button
            onClick={onPrint}
            title="Marcar ítem como impreso"
            className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
          >
            <Factory size={16} />
          </button>
        )}

        {activeTab === 'ready' && !order.isSaleRegistered && (
          <button
            onClick={onDeliver}
            className="flex-[2] min-w-[130px] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <PackageCheck size={16} /> ENTREGAR
          </button>
        )}

        {activeTab === 'ready' && (
          <button
            onClick={() => onStatusChange(order._id, 'in_progress')}
            title="Volver a producción"
            className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
          >
            <History size={16} />
          </button>
        )}

        {activeTab === 'history' && (
          <span
            className={`flex-[2] min-w-[130px] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center border ${statusInfo.color} border-opacity-30`}
          >
            {statusInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}
