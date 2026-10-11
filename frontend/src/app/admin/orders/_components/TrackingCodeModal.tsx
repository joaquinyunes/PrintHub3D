interface TrackingCodeModalProps {
  code: string;
  onClose: () => void;
}

export default function TrackingCodeModal({ code, onClose }: TrackingCodeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-gradient-to-br from-purple-900/80 to-black border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="text-2xl font-black text-white mb-2">¡Código de Seguimiento Creado!</h2>
          <p className="text-purple-300 text-sm">
            Este código sirve para que el cliente rastree su pedido y vea el video personalizado
          </p>
        </div>

        <div className="bg-black/50 rounded-2xl p-6 mb-6 border border-purple-500/20">
          <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-3 text-center">
            Código para el Cliente
          </label>
          <div className="text-center">
            <span className="inline-block bg-purple-600/30 text-purple-300 px-6 py-3 rounded-xl font-mono text-2xl font-black tracking-wider">
              {code}
            </span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            El cliente debe buscar este código en /track
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-xs font-bold mb-1">📋 IMPORTANTE</p>
          <p className="text-gray-400 text-xs">Para que el cliente pueda ver el video, necesitas:</p>
          <ol className="text-xs text-gray-500 mt-2 space-y-1 list-decimal list-inside">
            <li>
              Ir a{' '}
              <a
                href="/admin/home"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                /admin/home
              </a>
            </li>
            <li>
              En &quot;Videos por código&quot;, usar el mismo texto que el tipo de producto o el
              nombre (ej: <span className="text-purple-300">vasoriver</span> o{' '}
              <span className="text-purple-300">vaso-boca</span>); varios clientes con el mismo
              tipo verán el mismo video
            </li>
            <li>Subir el video correspondiente y guardar</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-xl text-white font-black uppercase tracking-widest transition-all hover:scale-105"
        >
          Entendido ✓
        </button>
      </div>
    </div>
  );
}
