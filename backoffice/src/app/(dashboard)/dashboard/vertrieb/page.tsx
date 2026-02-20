"use client";

import { useAuth } from "@/context/AuthContext";
import { useSupplierId } from "@/hooks/useSupplierOrders";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ACCENT = "#BA943A";

function formatEuro(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function VertriebPage() {
  const { user } = useAuth();
  const supplierId = useSupplierId(user?.id ?? null);
  const [assignments, setAssignments] = useState<{ gastronom_id: string }[]>([]);
  const [orders, setOrders] = useState<{ id: string; total_amount: number; created_at: string; gastronom_id: string }[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId || !user) return;
    (async () => {
      const { data: a } = await supabase
        .from("customer_vertrieb_assignments")
        .select("gastronom_id")
        .eq("supplier_id", supplierId)
        .eq("vertrieb_user_id", user.id);
      const gastronomIds = ((a ?? []) as { gastronom_id: string }[]).map((x) => x.gastronom_id);
      setAssignments(a ?? []);

      if (gastronomIds.length === 0) {
        setOrders([]);
        setRestaurantNames({});
        setLoading(false);
        return;
      }
      const { data: o } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, gastronom_id")
        .eq("supplier_id", supplierId)
        .in("gastronom_id", gastronomIds)
        .order("created_at", { ascending: false });
      setOrders((o ?? []) as typeof orders);

      const { data: rests } = await supabase
        .from("restaurants")
        .select("gastronom_id, name")
        .in("gastronom_id", gastronomIds);
      const map: Record<string, string> = {};
      ((rests ?? []) as { gastronom_id: string; name: string }[]).forEach((r) => {
        map[r.gastronom_id] = r.name || "–";
      });
      setRestaurantNames(map);
      setLoading(false);
    })();
  }, [supplierId, user?.id]);

  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);
  const customerCount = new Set(orders.map((o) => o.gastronom_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">Meine Kunden & Deals</h1>
      <p className="text-stone-600">Hier siehst du nur die Bestellungen deiner zugeordneten Kunden.</p>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-500">Kundenumsatz (gesamt)</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: ACCENT }}>{formatEuro(totalRevenue)}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-stone-500">Zugeordnete Kunden</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{assignments.length}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-header font-semibold text-stone-900">Bestellungen meiner Kunden</h2>
        <div className="overflow-x-auto">
          <table className="table-professional w-full">
            <thead>
              <tr>
                <th>Kunde</th>
                <th>Datum</th>
                <th className="text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{restaurantNames[o.gastronom_id] ?? "–"}</td>
                  <td>{new Date(o.created_at).toLocaleDateString("de-DE")}</td>
                  <td className="text-right font-semibold" style={{ color: ACCENT }}>{formatEuro(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && <p className="py-12 text-center text-stone-500">Noch keine Bestellungen deiner Kunden.</p>}
      </div>

      {assignments.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Dir sind noch keine Kunden zugeordnet. Der Admin oder dein Teamchef kann Kundenzuordnungen vornehmen.
        </p>
      )}
    </div>
  );
}
