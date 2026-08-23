"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta pantalla se unificó con /admin/production (datos en el servidor).
export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/production");
  }, [router]);
  return null;
}
