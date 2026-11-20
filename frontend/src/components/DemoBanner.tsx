// Cartel fijo del entorno de demostración (V3). Solo aparece si el sitio se compiló con NEXT_PUBLIC_DEMO=1,
// así que el entorno real nunca lo muestra (y la demo nunca se confunde con el real).
export default function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-[100] bg-[#9a3412] px-4 py-2 text-center text-sm font-bold text-white">
      ENTORNO DE DEMOSTRACIÓN · datos de ejemplo, no son de un cliente real
    </div>
  );
}
