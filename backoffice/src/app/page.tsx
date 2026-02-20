"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile?.role !== "lieferant") {
      router.replace("/login?error=role");
      return;
    }
    router.replace("/dashboard");
  }, [user, profile, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        <p className="text-sm text-stone-500">Lade Backoffice…</p>
        <a href="/login" className="text-amber-600 font-medium hover:underline">Direkt zum Login</a>
      </div>
    </div>
  );
}
