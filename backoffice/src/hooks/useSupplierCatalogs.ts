"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SupplierCatalog {
  id: string;
  supplier_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

export function useSupplierCatalogs(supplierId: string | null) {
  const [catalogs, setCatalogs] = useState<SupplierCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    if (!supplierId) {
      setLoading(false);
      return;
    }
    setError(null);
    const { data, error } = await supabase
      .from("supplier_catalogs")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setCatalogs((data ?? []) as SupplierCatalog[]);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  return { catalogs, loading, error, refetch: fetchCatalogs };
}
