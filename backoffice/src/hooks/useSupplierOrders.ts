"use client";

import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  gastronom_id?: string;
}

export interface OrderWithItems extends OrderRow {
  order_items: Array<{
    quantity: number;
    unit_price: number;
    products: { name: string; unit: string } | Array<{ name: string; unit: string }> | null;
  }>;
}

export function useSupplierOrders(supplierId: string | null, withItems = false) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!supplierId) {
      setLoading(false);
      return;
    }
    setError(null);
    const select = withItems
      ? "id, total_amount, status, payment_method, created_at, gastronom_id, order_items(quantity, unit_price, products(name, unit))"
      : "id, total_amount, status, payment_method, created_at";
    const { data, error } = await supabase
      .from("orders")
      .select(select)
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setOrders((data ?? []) as unknown as OrderWithItems[]);
    setLoading(false);
  }, [supplierId, withItems]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime: Bei INSERT/UPDATE/DELETE auf orders automatisch neu laden
  useEffect(() => {
    if (!supplierId) return;
    const ch = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `supplier_id=eq.${supplierId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();
    setChannel(ch);
    return () => {
      supabase.removeChannel(ch);
      setChannel(null);
    };
  }, [supplierId, fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

export function useSupplierId(userId: string | null) {
  const [supplierId, setSupplierId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSupplierId(null);
      return;
    }
    let mounted = true;
    (async () => {
      const { data: supplier } = await supabase.from("suppliers").select("id").eq("user_id", userId).single();
      if (mounted && supplier?.id) {
        setSupplierId(supplier.id);
        return;
      }
      const { data: member } = await supabase.from("supplier_team_members").select("supplier_id").eq("user_id", userId).single();
      if (mounted) setSupplierId((member as { supplier_id?: string })?.supplier_id ?? null);
    })();
    return () => { mounted = false; };
  }, [userId]);

  return supplierId;
}
