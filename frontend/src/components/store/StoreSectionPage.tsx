"use client";

import CatalogPage from "@/components/store/CatalogPage";
import { useStoreSection, type SectionKey } from "@/lib/storeCatalog";

interface Props {
  sectionKey: SectionKey;
  kicker: string;
  closing: string;
  /** Ajustes públicos traídos en el servidor (cacheados) */
  initial?: Record<string, any>;
}

export default function StoreSectionPage({ sectionKey, kicker, closing, initial }: Props) {
  const { section, contact, loading } = useStoreSection(sectionKey, initial);
  return (
    <CatalogPage kicker={kicker} section={section} contact={contact} loading={loading} closing={closing} />
  );
}
