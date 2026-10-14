"use client";

import CatalogPage from "@/components/store/CatalogPage";
import { useStoreSection } from "@/lib/storeCatalog";

export default function ImpresorasPage() {
  const { section, contact, loading } = useStoreSection("impresorasSection");
  return (
    <CatalogPage
      kicker="Impresoras"
      section={section}
      contact={contact}
      loading={loading}
      closing="¿Qué impresora te conviene? Te asesoramos según lo que vas a imprimir."
    />
  );
}
