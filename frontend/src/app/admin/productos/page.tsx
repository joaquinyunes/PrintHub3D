"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta pantalla se unificó con /admin/products (datos en el servidor).
export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/products");
  }, [router]);
  return null;
}
