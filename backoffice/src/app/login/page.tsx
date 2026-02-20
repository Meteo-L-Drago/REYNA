"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TEST_ACCOUNTS = {
  buchhaltung: { email: "test-buchhaltung@reyna.demo", password: "ReynaTest123!" },
  vertrieb: { email: "test-vertrieb@reyna.demo", password: "ReynaTest123!" },
  admin: { email: "lieferant@test.com", password: "ReynaTest123!" },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleError = searchParams.get("error") === "role";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
            if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
        if (profile?.role !== "lieferant") {
          await supabase.auth.signOut();
          setError("Nur Lieferanten haben Zugang. Profil-Rolle ist: " + (profile?.role ?? "fehlt") + ". Führe node scripts/seed-test-accounts.js aus.");
          setLoading(false);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen. Existiert der Account? (node scripts/seed-test-accounts.js)");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="card w-full max-w-md overflow-visible p-8 shadow-md">
        <div className="mb-8 text-center">
          <h1 className="font-reyna text-4xl text-stone-800">Reyna</h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-widest text-stone-500">Backoffice</p>
          <p className="mt-3 text-sm text-stone-600">Zahlen, Rechnungen & Umsätze</p>
        </div>

        {(error || roleError) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {roleError ? "Nur Lieferanten haben Zugang. Bitte mit einem Lieferanten-Account anmelden." : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="lieferant@firma.de"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? "Wird angemeldet…" : "Anmelden"}
          </button>
        </form>

        {process.env.NODE_ENV !== "production" && (
          <>
            <p className="mt-6 text-center text-xs text-stone-500">
              Test-Accounts: node scripts/seed-test-accounts.js ausführen
            </p>
            <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError("");
              const { data, error: e } = await supabase.auth.signInWithPassword(TEST_ACCOUNTS.admin);
              if (e) {
                setLoading(false);
                setError(e.message + " – Führe node scripts/seed-test-accounts.js aus.");
                return;
              }
              const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
              if (profile?.role !== "lieferant") {
                await supabase.auth.signOut();
                setLoading(false);
                setError("Profil hat keine Lieferanten-Rolle. node scripts/seed-test-accounts.js ausführen.");
                return;
              }
              setLoading(false);
              router.replace("/dashboard");
              router.refresh();
            }}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            Test-Zugang: Admin (Lieferant)
          </button>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError("");
              const { error: e } = await supabase.auth.signInWithPassword(TEST_ACCOUNTS.buchhaltung);
              setLoading(false);
              if (e) setError(e.message);
              else {
                router.replace("/dashboard");
                router.refresh();
              }
            }}
            disabled={loading}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Test-Zugang: Buchhaltung
          </button>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError("");
              const { error: e } = await supabase.auth.signInWithPassword(TEST_ACCOUNTS.vertrieb);
              setLoading(false);
              if (e) setError(e.message);
              else {
                router.replace("/dashboard");
                router.refresh();
              }
            }}
            disabled={loading}
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Test-Zugang: Vertrieb
          </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
