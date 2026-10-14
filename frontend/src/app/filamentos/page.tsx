"use client";

import CatalogPage from "@/components/store/CatalogPage";
import { useStoreSection } from "@/lib/storeCatalog";

export default function FilamentosPage() {
  const { section, contact, loading } = useStoreSection("filamentosSection");
  return (
    <CatalogPage
      kicker="Filamentos e insumos"
      section={section}
      contact={contact}
      loading={loading}
      closing="¿Dudás qué material usar? Contanos tu proyecto y te recomendamos."
    />
  );
}
