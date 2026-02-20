"use client";

import { useAuth } from "@/context/AuthContext";
import { useSupplierId, useSupplierOrders } from "@/hooks/useSupplierOrders";

const ACCENT = "#BA943A";
const statusLabels: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  shipped: "Versendet",
  delivered: "Geliefert",
  cancelled: "Storniert",
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function LogistikPage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const { orders, loading } = useSupplierOrders(supplierId, true);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Bestellungen – Logistik</h1>
      <p className="text-stone-600">Zusammenpacken und Versand. Hier siehst du alle eingegangenen Bestellungen.</p>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Status</th>
                <th className="text-right">Betrag</th>
                <th>Positionen</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{new Date(o.created_at).toLocaleDateString("de-DE")}</td>
                  <td>
                    <span
                      className={`badge ${o.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50"}`}
                      style={o.status !== "delivered" ? { color: ACCENT } : undefined}
                    >
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="text-right font-semibold" style={{ color: ACCENT }}>{formatEuro(o.total_amount)}</td>
                  <td>
                    {o.order_items?.map((oi, idx) => {
                      const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
                      return <span key={idx} className="block text-xs">{oi.quantity}× {p?.name ?? "Produkt"}</span>;
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <p className="py-12 text-center text-stone-500">Keine Bestellungen.</p>}
      </div>
    </div>
  );
}
