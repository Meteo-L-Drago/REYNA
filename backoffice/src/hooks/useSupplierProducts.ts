"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export function useSupplierProducts(supplierId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!supplierId) {
      setLoading(false);
      return;
    }
    setError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("name");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
