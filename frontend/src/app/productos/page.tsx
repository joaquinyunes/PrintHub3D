import StoreSectionPage from "@/components/store/StoreSectionPage";
import { fetchPublicSettings } from "@/lib/storeCatalogData";

// El catálogo se arma en el servidor y se renueva cada 60 s: la página llega completa
// aunque el backend esté dormido.
export const revalidate = 60;

export default async function ProductosPage() {
  const settings = await fetchPublicSettings();
  return (
    <StoreSectionPage
      sectionKey="productosSection"
      kicker="Productos"
      closing="¿Tenés una idea? La diseñamos, la imprimimos y te la mandamos."
      initial={settings && { productosSection: settings.productosSection, contactInfo: settings.contactInfo }}
    />
  );
}
