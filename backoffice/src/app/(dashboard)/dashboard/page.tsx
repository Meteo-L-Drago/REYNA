"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupplierId, useSupplierOrders } from "@/hooks/useSupplierOrders";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

const PRESETS = [
  { key: "7", label: "7 Tage" },
  { key: "30", label: "30 Tage" },
  { key: "90", label: "90 Tage" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const { orders, loading } = useSupplierOrders(supplierId, false);
  const [daysFilter, setDaysFilter] = useState("30");

  const days = parseInt(daysFilter, 10) || 30;
  const deliveredOrders = useMemo(
    () => orders.filter((o) => ["delivered", "shipped", "confirmed"].includes(o.status)),
    [orders]
  );
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  const revenueByDay = useMemo(() => {
    const result: { date: string; umsatz: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = deliveredOrders.filter((o) => o.created_at.startsWith(dayStr));
      result.push({
        date: dayStr.slice(8, 10) + "." + dayStr.slice(5, 7),
        umsatz: dayOrders.reduce((s, o) => s + o.total_amount, 0) / 100,
      });
    }
    return result;
  }, [deliveredOrders, days]);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Übersicht</h1>
        <div className="flex items-center gap-3">
          <span className="badge bg-emerald-50 text-emerald-700">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value)}
            className="select-field w-auto min-w-[120px] py-2"
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Gesamtumsatz</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: ACCENT }}>
            {formatEuro(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-stone-400">{deliveredOrders.length} abgeschlossene Bestellungen</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Bestellungen gesamt</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{orders.length}</p>
          <p className="mt-1 text-xs text-stone-400">
            {orders.filter((o) => o.status === "pending").length} offen
          </p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ø Bestellwert</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatEuro(avgOrderValue)}</p>
          <p className="mt-1 text-xs text-stone-400">bei abgeschlossenen Bestellungen</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-5 text-lg font-semibold text-stone-900">
          Umsatz der letzten {days} Tage
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#78716c" />
              <YAxis tickFormatter={(v) => v + " €"} tick={{ fontSize: 11 }} stroke="#78716c" />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2) + " €", "Umsatz"]}
                labelFormatter={(label) => "Datum: " + label}
              />
              <Bar dataKey="umsatz" fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header text-base font-semibold text-stone-900">
          Letzte Bestellungen
        </h2>
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Status</th>
                <th className="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id}>
                  <td>
                    {new Date(o.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td>
                    <span
                      className={`badge ${o.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50"}`}
                      style={o.status !== "delivered" ? { color: ACCENT } : undefined}
                    >
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="text-right font-semibold" style={{ color: ACCENT }}>
                    {formatEuro(o.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="py-12 text-center text-stone-500">Noch keine Bestellungen.</p>
        )}
      </div>
    </div>
  );
}
