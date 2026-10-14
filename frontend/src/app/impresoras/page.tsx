import StoreSectionPage from "@/components/store/StoreSectionPage";
import { fetchPublicSettings } from "@/lib/storeCatalogData";

// El catálogo se arma en el servidor y se renueva cada 60 s: la página llega completa
// aunque el backend esté dormido.
export const revalidate = 60;

export default async function ImpresorasPage() {
  const settings = await fetchPublicSettings();
  return (
    <StoreSectionPage
      sectionKey="impresorasSection"
      kicker="Impresoras"
      closing="¿Qué impresora te conviene? Te asesoramos según lo que vas a imprimir."
      initial={settings && { impresorasSection: settings.impresorasSection, contactInfo: settings.contactInfo }}
    />
  );
}
