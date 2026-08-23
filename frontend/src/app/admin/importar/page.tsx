"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// El importador de Excel sobre localStorage se retiró. Los datos ahora viven en el servidor.
export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return null;
}
