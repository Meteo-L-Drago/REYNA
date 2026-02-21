"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    async function handleCallback() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { data: { session }, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (!mounted) return;
        if (!error && session?.user) {
          setStatus("success");
          await fetch("/api/accept-invitation", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          router.replace("/dashboard");
          return;
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setStatus("success");
        await fetch("/api/accept-invitation", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        router.replace("/dashboard");
      } else {
        setStatus("error");
        setTimeout(() => router.replace("/login"), 2000);
      }
    }
    const t = setTimeout(handleCallback, 300);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="mt-4 text-stone-600">Einladung wird akzeptiert…</p>
          </>
        )}
        {status === "success" && (
          <p className="text-stone-600">Weiterleitung zum Dashboard…</p>
        )}
        {status === "error" && (
          <>
            <p className="text-amber-700">Link konnte nicht verarbeitet werden.</p>
            <p className="mt-2 text-sm text-stone-500">Weiterleitung zur Anmeldung…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
