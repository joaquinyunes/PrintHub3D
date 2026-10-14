import StoreSectionPage from "@/components/store/StoreSectionPage";
import { fetchPublicSettings } from "@/lib/storeCatalogData";

// El catálogo se arma en el servidor y se renueva cada 60 s: la página llega completa
// aunque el backend esté dormido.
export const revalidate = 60;

export default async function FilamentosPage() {
  const settings = await fetchPublicSettings();
  return (
    <StoreSectionPage
      sectionKey="filamentosSection"
      kicker="Filamentos e insumos"
      closing="¿Dudás qué material usar? Contanos tu proyecto y te recomendamos."
      initial={settings && { filamentosSection: settings.filamentosSection, contactInfo: settings.contactInfo }}
    />
  );
}
