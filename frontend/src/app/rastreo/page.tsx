"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RastreoRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const code = params.get("code") || params.get("codigo") || "";
    router.replace(code ? `/track?code=${encodeURIComponent(code)}` : "/track");
  }, [router, params]);
  return null;
}

export default function RastreoPage() {
  return (
    <Suspense fallback={null}>
      <RastreoRedirect />
    </Suspense>
  );
}
