"use client";

import CatalogPage from "@/components/store/CatalogPage";
import { useStoreSection } from "@/lib/storeCatalog";

export default function ProductosPage() {
  const { section, contact, loading } = useStoreSection("productosSection");
  return (
    <CatalogPage
      kicker="Productos"
      section={section}
      contact={contact}
      loading={loading}
      closing="¿Tenés una idea? La diseñamos, la imprimimos y te la mandamos."
    />
  );
}
