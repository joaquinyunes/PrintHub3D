"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
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
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al registrarse');

      // Guardamos sesión automáticamente y redirigimos a la tienda
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/'); // Redirigir al inicio (tienda)

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden">
      
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute h-96 w-96 bg-green-500/10 rounded-full blur-[128px] -top-20 -right-20" />

      <div className="relative z-10 w-full max-w-md p-8 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Crear Cuenta</h1>
          <p className="text-muted-foreground text-sm">Únete a Global 3D</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-500">
              <User className="h-5 w-5" />
            </div>
            <input
              name="name"
              type="text"
              placeholder="Nombre Completo"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 transition"
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="tu@email.com"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 transition"
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="relative group">
            <div className="absolute left-3 top-3 text-gray-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 transition"
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Registrarme <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/admin/login" className="text-xs text-gray-500 hover:text-white transition">
            ¿Ya tienes cuenta? Iniciar Sesión
          </Link>
        </div>

      </div>
    </div>
  );
}