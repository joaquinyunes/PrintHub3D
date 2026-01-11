"use client";

import React, { useEffect, useState } from 'react';
import { Save, Building, Phone, DollarSign, MessageSquare, Database } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [formData, setFormData] = useState({
    businessName: '',
    adminPhone: '',
    currencySymbol: '$',
    filamentCostAverage: 15000,
    welcomeMessage: ''
  });

  // Cargar datos actuales
  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        setFormData({
            businessName: data.businessName || '',
            adminPhone: data.adminPhone || '',
            currencySymbol: data.currencySymbol || '$',
            filamentCostAverage: data.filamentCostAverage || 0,
            welcomeMessage: data.welcomeMessage || ''
        });
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg("");
    try {
        const res = await fetch('http://localhost:5000/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales de Global 3D OS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* TARJETA 1: DATOS GENERALES */}
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Building className="h-4 w-4 text-primary"/> Negocio</h3>
            
            <div>
                <label className="text-xs text-muted-foreground block mb-1">Nombre del Negocio</label>
                <input 
                    name="businessName" value={formData.businessName} onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary" 
                />
            </div>
            
            <div>
                <label className="text-xs text-muted-foreground block mb-1">Teléfono Admin (Alertas WhatsApp)</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input 
                        name="adminPhone" value={formData.adminPhone} onChange={handleChange}
                        placeholder="Ej: 5493794123456"
                        className="w-full bg-black/50 border border-white/10 rounded p-2 pl-9 text-sm outline-none focus:border-primary" 
                    />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Sin espacios ni símbolos (+). Debe incluir código de país.</p>
            </div>
        </div>

        {/* TARJETA 2: FINANZAS */}
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500"/> Finanzas & Costos</h3>
            
            <div>
                <label className="text-xs text-muted-foreground block mb-1">Símbolo de Moneda</label>
                <input 
                    name="currencySymbol" value={formData.currencySymbol} onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none" 
                />
            </div>

            <div>
                <label className="text-xs text-muted-foreground block mb-1">Costo Promedio Filamento (1kg)</label>
                <input 
                    type="number"
                    name="filamentCostAverage" value={formData.filamentCostAverage} onChange={handleChange}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none" 
                />
                <p className="text-[10px] text-gray-500 mt-1">Usado para estimaciones rápidas si el producto no tiene costo definido.</p>
            </div>
        </div>

        {/* TARJETA 3: AUTOMATIZACIÓN (Futuro) */}
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4 md:col-span-2 opacity-80">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500"/> Respuestas Automáticas</h3>
            
            <div>
                <label className="text-xs text-muted-foreground block mb-1">Mensaje de Bienvenida (Bot)</label>
                <textarea 
                    name="welcomeMessage" value={formData.welcomeMessage} onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm outline-none resize-none" 
                />
            </div>
        </div>

      </div>

      {/* BOTÓN GUARDAR */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
         <span className={`text-sm font-bold ${msg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
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