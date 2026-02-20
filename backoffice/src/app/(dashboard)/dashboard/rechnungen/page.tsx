"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupplierId, useSupplierOrders } from "@/hooks/useSupplierOrders";
import { supabase } from "@/lib/supabase";

const ACCENT = "#BA943A";

const statusLabels: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  shipped: "Versendet",
  delivered: "Geliefert",
  cancelled: "Storniert",
};

const statusOptions = [
  { value: "pending", label: "Ausstehend" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "shipped", label: "Versendet" },
  { value: "delivered", label: "Geliefert" },
  { value: "cancelled", label: "Storniert" },
];

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

function printInvoice(order: {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    products: { name: string; unit: string } | Array<{ name: string; unit: string }> | null;
  }>;
}, restaurantName?: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  const items = order.order_items
    ?.map((oi) => {
      const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
      return `<tr><td>${oi.quantity}</td><td>${p?.name ?? "Produkt"}</td><td>${(oi.unit_price / 100).toFixed(2)} €</td><td>${(oi.quantity * oi.unit_price / 100).toFixed(2)} €</td></tr>`;
    })
    .join("") ?? "";
  win.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Rechnung ${order.id.slice(0, 8)}</title>
<style>body{font-family:system-ui;max-width:600px;margin:2rem auto;padding:1rem;color:#1a1a1a}
table{width:100%;border-collapse:collapse;margin:1rem 0}
th,td{border-bottom:1px solid #e5e5e5;padding:8px;text-align:left}
th{background:#f5f5f5}
.total{font-weight:700;font-size:1.1rem;margin-top:1rem}
@media print{body{margin:0}}</style></head>
<body>
<h1>Rechnung</h1>
<p><strong>Rechnungsnummer:</strong> REY-${order.id.slice(0, 8).toUpperCase()}</p>
<p><strong>Datum:</strong> ${new Date(order.created_at).toLocaleDateString("de-DE")}</p>
${restaurantName ? `<p><strong>Rechnungsempfänger:</strong><br>${restaurantName}</p>` : ""}
<table>
<thead><tr><th>Menge</th><th>Artikel</th><th>Preis</th><th>Summe</th></tr></thead>
<tbody>${items}</tbody>
</table>
<p class="total">Gesamtbetrag: ${formatEuro(order.total_amount)}</p>
<p>Zahlungsart: ${paymentLabels[order.payment_method] ?? order.payment_method}</p>
<p style="margin-top:2rem;font-size:0.85rem;color:#666">REYNA · B2B Bestellplattform</p>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export default function RechnungenPage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const { orders, loading, refetch } = useSupplierOrders(supplierId, true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () =>
      statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (!error) refetch();
    setUpdatingId(null);
  }

  async function handlePrintInvoice(order: (typeof orders)[0]) {
    let restaurantName: string | undefined;
    if (order.gastronom_id) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("gastronom_id", order.gastronom_id)
        .single();
      if (restaurant?.name) restaurantName = restaurant.name;
    }
    printInvoice(order, restaurantName);
  }

  function handleExportCSV() {
    const headers = ["Datum", "ID", "Status", "Zahlung", "Betrag (€)", "Positionen"];
    const rows = filteredOrders.map((o) => {
      const pos = o.order_items
        ?.map((oi) => {
          const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
          return `${oi.quantity}× ${p?.name ?? "Produkt"} @ ${(oi.unit_price / 100).toFixed(2)} €`;
        })
        .join(" | ") ?? "";
      return [
        new Date(o.created_at).toLocaleDateString("de-DE"),
        o.id.slice(0, 8),
        statusLabels[o.status] ?? o.status,
        paymentLabels[o.payment_method] ?? o.payment_method,
        (o.total_amount / 100).toFixed(2),
        pos,
      ].join(";");
    });
    const csv = [headers.join(";"), ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `reyna-rechnungen-${date}.csv`);
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Rechnungen & Bestellungen</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge bg-emerald-50 text-emerald-700">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field w-auto min-w-[160px]"
          >
            <option value="all">Alle Status</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="btn-secondary">
            CSV exportieren
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Status</th>
                <th>Zahlung</th>
                <th className="text-right">Betrag</th>
                <th>Positionen</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    {new Date(o.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={updatingId === o.id}
                      className="select-field w-auto min-w-[110px] py-1.5 text-xs"
                      style={{
                        backgroundColor:
                          o.status === "delivered"
                            ? "rgba(34,197,94,0.15)"
                            : o.status === "cancelled"
                              ? "rgba(239,68,68,0.15)"
                              : "rgba(186,148,58,0.12)",
                        color:
                          o.status === "delivered"
                            ? "#16a34a"
                            : o.status === "cancelled"
                              ? "#dc2626"
                              : ACCENT,
                      }}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {paymentLabels[o.payment_method] ?? o.payment_method}
                  </td>
                  <td className="text-right font-semibold" style={{ color: ACCENT }}>
                    {formatEuro(o.total_amount)}
                  </td>
                  <td>
                    {o.order_items?.map((oi, idx) => {
                      const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
                      return (
                        <span key={idx} className="block text-xs">
                          {oi.quantity}× {p?.name ?? "Produkt"} ({(oi.unit_price / 100).toFixed(2)} €)
                        </span>
                      );
                    })}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handlePrintInvoice(o)}
                      className="btn-ghost px-2 py-1 text-xs"
                    >
                      Rechnung drucken
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <p className="py-12 text-center text-stone-500">Keine Bestellungen gefunden.</p>
        )}
      </div>
    </div>
  );
}
