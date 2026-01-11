"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Credenciales incorrectas');

      // Guardar sesión
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/admin');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      
      {/* Fondos decorativos */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-blue-500/10 rounded-full blur-[128px] -top-20 -left-20" />
      <div className="absolute h-96 w-96 bg-purple-500/10 rounded-full blur-[128px] -bottom-20 -right-20" />

      {/* Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-md p-8 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4">
            <Box className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Privado</h1>
          <p className="text-muted-foreground text-sm">Global 3D Corrientes OS</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-500 transition">
              <Mail className="h-5 w-5" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="admin@global3d.com"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition"
              onChange={handleChange}
              required
            />
          </div>

          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-500 transition">
              <Lock className="h-5 w-5" />
            </div>
            <input
              name="password"
              type="password"
              placeholder="Contraseña Maestra"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Ingresar al Sistema <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">Acceso restringido únicamente a personal autorizado.</p>
        </div>

      </div>
    </div>
  );
}