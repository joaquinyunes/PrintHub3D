"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Save, Building, Phone, DollarSign, MessageSquare, Database, Wifi, WifiOff, QrCode, RefreshCw, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface CustomerTemplates {
  pending: string;
  in_progress: string;
  completed: string;
  delivered: string;
  cancelled: string;
  resendTracking: string;
}

interface SettingsForm {
  businessName: string;
  adminPhone: string;
  currencySymbol: string;
  filamentCostAverage: number;
  welcomeMessage: string;
  trackingBaseUrl: string;
  customerMessageTemplates: CustomerTemplates;
}

const defaultTemplates: CustomerTemplates = {
  pending: 'Hola {clientName} 👋 Tu pedido {trackingCode} está pendiente de producción. Sigue tu pedido en {trackingUrl}',
  in_progress: 'Hola {clientName} 👋 Tu pedido {trackingCode} ya está en producción. Sigue el avance en {trackingUrl}',
  completed: '¡Buenas noticias {clientName}! Tu pedido {trackingCode} está listo para retiro/entrega. Más detalles en {trackingUrl}',
  delivered: 'Gracias por tu compra {clientName} 🙌 Tu pedido {trackingCode} figura como entregado. Puedes valorar tu experiencia en {trackingUrl}',
  cancelled: 'Hola {clientName}, tu pedido {trackingCode} fue cancelado. Si quieres retomarlo escríbenos por WhatsApp.',
  resendTracking: 'Hola {clientName} 👋 Aquí tienes nuevamente tu código de seguimiento: {trackingCode}. Consulta tu pedido en {trackingUrl}',
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [waStatus, setWaStatus] = useState<{ isReady: boolean; hasQr: boolean }>({ isReady: false, hasQr: false });
  const [qrImage, setQrImage] = useState<string>("");
  const [connecting, setConnecting] = useState(false);
  const eventSource = useRef<EventSource | null>(null);

  const [formData, setFormData] = useState<SettingsForm>({
    businessName: '',
    adminPhone: '',
    currencySymbol: '$',
    filamentCostAverage: 15000,
    welcomeMessage: '',
    trackingBaseUrl: '',
    customerMessageTemplates: defaultTemplates,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = localStorage.getItem("user");
        const token = stored ? JSON.parse(stored).token : null;
        const res = await fetch(apiUrl('/api/settings'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setFormData({
          businessName: data.businessName || '',
          adminPhone: data.adminPhone || '',
          currencySymbol: data.currencySymbol || '$',
          filamentCostAverage: data.filamentCostAverage || 0,
          welcomeMessage: data.welcomeMessage || '',
          trackingBaseUrl: data.trackingBaseUrl || '',
          customerMessageTemplates: {
            ...defaultTemplates,
            ...(data.customerMessageTemplates || {}),
          },
        });
      } catch {
        // silencioso
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTemplateChange = (key: keyof CustomerTemplates, value: string) => {
    setFormData({
      ...formData,
      customerMessageTemplates: {
        ...formData.customerMessageTemplates,
        [key]: value,
      },
    });
  };

  const connectWhatsApp = () => {
    setConnecting(true);
    eventSource.current = new EventSource(apiUrl('/api/whatsapp/qr'));

    eventSource.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.qr) {
        setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.qr)}`);
        setConnecting(false);
      }
    };

    eventSource.current.addEventListener('connected', () => {
      setWaStatus({ isReady: true, hasQr: false });
      setQrImage("");
      setConnecting(false);
      eventSource.current?.close();
    });

    eventSource.current.addEventListener('disconnected', () => {
      setWaStatus({ isReady: false, hasQr: true });
      eventSource.current?.close();
      fetchWaStatus();
    });

    eventSource.current.onerror = () => {
      setConnecting(false);
    };
  };

  const fetchWaStatus = async () => {
    try {
      const stored = localStorage.getItem("user");
      const token = stored ? JSON.parse(stored).token : null;
      const res = await fetch(apiUrl('/api/whatsapp/status'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setWaStatus({ isReady: data.isReady, hasQr: data.hasQr });
      if (data.hasQr && !data.isReady) {
        connectWhatsApp();
      }
    } catch { /* silencioso */ }
  };

  const reconnectWa = async () => {
    try {
      const stored = localStorage.getItem("user");
      const token = stored ? JSON.parse(stored).token : null;
      await fetch(apiUrl('/api/whatsapp/reconnect'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      connectWhatsApp();
    } catch { /* silencioso */ }
  };

  useEffect(() => {
    fetchWaStatus();
    return () => { eventSource.current?.close(); };
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMsg("");
    try {
      const stored = localStorage.getItem("user");
      const token = stored ? JSON.parse(stored).token : null;
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setMsg("✅ Configuración guardada correctamente");
      } else {
        setMsg("❌ Error al guardar");
      }
    } catch (error) {
      setMsg("❌ Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes generales del negocio, notificaciones y plantillas de mensajes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" /> Negocio
          </h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Nombre del Negocio
            </label>
            <input
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Teléfono Admin (Alertas WhatsApp)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                name="adminPhone"
                value={formData.adminPhone}
                onChange={handleChange}
                placeholder="Ej: 5493794123456"
                className="w-full bg-black/50 border border-white/10 rounded p-2 pl-9 text-sm outline-none focus:border-primary"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Sin espacios ni símbolos (+). Debe incluir código de país.
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              URL base de tracking público
            </label>
            <input
              name="trackingBaseUrl"
              value={formData.trackingBaseUrl}
              onChange={handleChange}
              placeholder="https://tu-dominio.com/track"
              className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Se usará en los enlaces de seguimiento enviados al cliente.
            </p>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            {waStatus.isReady ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            WhatsApp
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {waStatus.isReady ? (
              <span className="text-green-400 flex items-center gap-1"><Wifi className="h-3 w-3" /> Conectado</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><WifiOff className="h-3 w-3" /> Desconectado</span>
            )}
          </div>
          {qrImage && (
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
              <img src={qrImage} alt="QR WhatsApp" className="w-48 h-48" />
              <p className="text-xs text-black text-center">Escanea con tu WhatsApp</p>
            </div>
          )}
          {connecting && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Esperando QR...
            </div>
          )}
          <div className="flex gap-2">
            {!waStatus.isReady && !qrImage && (
              <button
                onClick={connectWhatsApp}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" /> Conectar QR
              </button>
            )}
            {waStatus.isReady && (
              <button
                onClick={reconnectWa}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Reconectar
              </button>
            )}
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" /> Finanzas & Costos
          </h3>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Símbolo de Moneda
            </label>
            <input
              name="currencySymbol"
              value={formData.currencySymbol}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Costo Promedio Filamento (1kg)
            </label>
            <input
              type="number"
              name="filamentCostAverage"
              value={formData.filamentCostAverage}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Usado para estimaciones rápidas si el producto no tiene costo definido.
            </p>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4 md:col-span-2">
          <h3 className="font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" /> Mensajes automáticos
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Mensaje de Bienvenida (Bot)
              </label>
              <textarea
                name="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={handleChange}
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none resize-none"
              />
            </div>
            <div className="text-[10px] text-gray-500 space-y-1">
              <p className="font-semibold">Variables disponibles:</p>
              <p>
                <code className="bg-black/40 px-1 rounded">{'{clientName}'}</code>,{' '}
                <code className="bg-black/40 px-1 rounded">{'{trackingCode}'}</code>,{' '}
                <code className="bg-black/40 px-1 rounded">{'{status}'}</code>,{' '}
                <code className="bg-black/40 px-1 rounded">{'{trackingUrl}'}</code>,{' '}
                <code className="bg-black/40 px-1 rounded">{'{businessName}'}</code>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4 md:col-span-2">
          <h3 className="font-bold flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" /> Plantillas por estado de pedido
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {(
              Object.entries(formData.customerMessageTemplates) as [
                keyof CustomerTemplates,
                string
              ][]
            ).map(([key, value]) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1 capitalize">
                  {key === 'resendTracking' ? 'Reenviar tracking' : key.replace('_', ' ')}
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none resize-none"
                  value={value}
                  onChange={(e) => handleTemplateChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span
          className={`text-sm font-bold ${
            msg.includes('Error') ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {msg}
        </span>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}