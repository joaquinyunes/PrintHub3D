"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
}

interface UserData {
  name: string;
  role: string;
  email?: string;
  token?: string;
}

export default function PaymentButtons({ product }: { product: Product }) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handlePayment = async (deposit: boolean) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/payments/create-payment"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token || ""}`
        },
        body: JSON.stringify({
          productName: product.name,
          price: product.price,
          deposit
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Completá el pago por WhatsApp");
        const phone = "5493794000000";
        const text = deposit 
          ? `Hola! Quiero pagar la seña (30%) de: *${product.name}* ($${Math.round(product.price * 0.3)})`
          : `Hola! Quiero comprar: *${product.name}* ($${product.price})`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (e) {
      console.error(e);
      alert("Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (deposit: boolean) => {
    const phone = "5493794000000";
    const amount = deposit ? Math.round(product.price * 0.3) : product.price;
    const text = deposit
      ? `Hola! Quiero pagar la seña (30%) de: *${product.name}* ($${amount})`
      : `Hola! Quiero comprar: *${product.name}* ($${amount})`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-2 mt-3">
      <button
        onClick={() => handleWhatsApp(false)}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.964-.94 1.162-.173.199-.347.223-.644.075-.197-.103-1.379-1.437-2.612-3.078-.297-.199-.496-.297-.673.15-.176.297-.697.872-1.075.994-.379.123-.646.148-1.143.049-.496-.099-2.425-1.588-3.868-3.012-.298-.298-.497-.447-.696-.447-.02 0-.04 0-.06 0-.2 0-.485.099-.698.298l-1.095 2.697c-.099.297-.022.595.099.793.149.198.397.396.793.495.396.099.793.099 1.141.099.348 0 .695-.099 1.041-.298.349-.198.768-.595.924-.994.099-.299.099-.596.049-.793-.099-.198-.448-1.591-.616-2.137-.149-.546-.298-1.193-.546-1.193z"/>
        </svg>
        Comprar - ${product.price}
      </button>
      
      <button
        onClick={() => handleWhatsApp(true)}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white py-2 rounded-xl font-medium transition text-sm"
      >
        Señar 30% (${Math.round(product.price * 0.3)}) - Abonar por WhatsApp
      </button>
    </div>
  );
}