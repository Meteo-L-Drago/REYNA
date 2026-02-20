"use client";

import { useAuth } from "@/context/AuthContext";
import { useSupplierId } from "@/hooks/useSupplierOrders";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ACCENT = "#BA943A";

const paymentLabels: Record<string, string> = {
  invoice: "Auf Rechnung",
  card: "Karte",
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function downloadCSV(data: string, filename: string) {
  const blob = new Blob(["\ufeff" + data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BuchhaltungPage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const [orders, setOrders] = useState<{ id: string; total_amount: number; payment_method: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;
    supabase
      .from("orders_buchhaltung")
      .select("id, total_amount, payment_method, created_at")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as typeof orders);
        setLoading(false);
      });
  }, [supplierId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  function handleExportCSV() {
    const headers = ["Rechnungsnr.", "Datum", "Zahlung", "Betrag (€)"];
    const rows = orders.map((o) => [
      `REY-${o.id.slice(0, 8).toUpperCase()}`,
      new Date(o.created_at).toLocaleDateString("de-DE"),
      paymentLabels[o.payment_method] ?? o.payment_method,
      (o.total_amount / 100).toFixed(2),
    ].join(";"));
    const csv = [headers.join(";"), ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `reyna-buchhaltung-${date}.csv`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Rechnungen – Buchhaltung</h1>
          <p className="mt-1 text-stone-600">Rechnungsrelevante Daten. Kein Zugriff auf Lieferstatus.</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary">
          CSV exportieren
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Rechnungsnr.</th>
                <th>Datum</th>
                <th>Zahlung</th>
                <th className="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono">REY-{o.id.slice(0, 8).toUpperCase()}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("de-DE")}</td>
                  <td>{paymentLabels[o.payment_method] ?? o.payment_method}</td>
                  <td className="text-right font-semibold" style={{ color: "#BA943A" }}>{formatEuro(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <p className="py-12 text-center text-stone-500">Keine Rechnungen.</p>}
      </div>
    </div>
  );
}
