import React from 'react';
import { ArrowRight, Box, Activity, Layers } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden bg-background">
      
      {/* Fondo Grid */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] opacity-20" />
      
      {/* Navbar simulado */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex absolute top-10">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-white/10 bg-black/50 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-900/50 lg:p-4">
          PrintHub 3D&nbsp;
          <span className="font-bold text-green-500">v1.0.0</span>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <div className="flex place-items-center gap-2 p-8 lg:p-0 text-white/60">
            System: <span className="text-green-400 font-bold">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Centro Hero */}
      <div className="relative flex flex-col place-items-center z-10 mt-10">
        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 sm:text-8xl">
          PrintHub 3D
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-lg text-center">
          Sistema Operativo Integral para Manufactura Aditiva.
          Control total de tu granja de impresión.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="h-12 px-8 rounded-md bg-white text-black font-bold hover:bg-gray-200 transition">
            Iniciar Dashboard
          </button>
          <button className="h-12 px-8 rounded-md border border-white/20 hover:bg-white/10 transition">
            Documentación
          </button>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left mt-24 gap-6">
        <div className="group rounded-lg border border-white/10 px-5 py-6 transition-colors hover:border-white/30 hover:bg-white/5">
          <Box className="h-8 w-8 text-blue-400 mb-4" />
          <h2 className="mb-2 text-2xl font-semibold text-white">Slicer Cloud</h2>
          <p className="text-sm text-gray-400">Cotización automática basada en geometría STL real.</p>
        </div>

        <div className="group rounded-lg border border-white/10 px-5 py-6 transition-colors hover:border-white/30 hover:bg-white/5">
          <Activity className="h-8 w-8 text-green-400 mb-4" />
          <h2 className="mb-2 text-2xl font-semibold text-white">IoT Bridge</h2>
          <p className="text-sm text-gray-400">Telemetría en tiempo real de OctoPrint y Klipper.</p>
        </div>

        <div className="group rounded-lg border border-white/10 px-5 py-6 transition-colors hover:border-white/30 hover:bg-white/5">
          <Layers className="h-8 w-8 text-purple-400 mb-4" />
          <h2 className="mb-2 text-2xl font-semibold text-white">IA Manager</h2>
          <p className="text-sm text-gray-400">Detección de fallos y optimización de colas.</p>
        </div>
      </div>
    </main>
  );
}