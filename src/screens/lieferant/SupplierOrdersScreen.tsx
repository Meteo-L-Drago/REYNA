import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAccess } from '../../hooks/useSupplierAccess';

const accentColor = '#BA943A';

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  products: { name: string; unit: string } | { name: string; unit: string }[] | null;
}

interface OrderWithItems {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  order_items: OrderItemRow[];
}

export default function SupplierOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { supplierId, loading: accessLoading } = useSupplierAccess(user?.id ?? null);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [supplierId]);

  async function fetchOrders() {
    if (!supplierId) return;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        payment_method,
        created_at,
        order_items (
          quantity,
          unit_price,
          products (name, unit)
        )
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setOrders((data ?? []) as OrderWithItems[]);
    setLoading(false);
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    shipped: 'Versendet',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
  };

  const paymentLabels: Record<string, string> = {
    invoice: 'Auf Rechnung',
    card: 'Karte',
  };

  if (accessLoading || loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Bestellungen</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardAmount}>
                {(item.total_amount / 100).toFixed(2)} €
              </Text>
              <Text style={styles.cardStatus}>
                {statusLabels[item.status] ?? item.status}
              </Text>
            </View>
            <Text style={styles.cardPayment}>
              {paymentLabels[item.payment_method] ?? item.payment_method}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString('de-DE')}
            </Text>
            {item.order_items?.map((oi, idx) => {
              const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
              return (
                <Text key={idx} style={styles.cardItem}>
                  {oi.quantity}× {p?.name ?? 'Produkt'} ({(oi.unit_price / 100).toFixed(2)} € / {p?.unit ?? ''})
                </Text>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Bestellungen.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: accentColor,
  },
  cardStatus: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  cardPayment: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardItem: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});
