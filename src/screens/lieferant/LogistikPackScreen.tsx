import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAccess } from '../../hooks/useSupplierAccess';

const accentColor = '#BA943A';

interface OrderItemRow {
  id: string;
  quantity: number;
  unit_price: number;
  is_packed?: boolean;
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

const statusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  shipped: 'Versendet',
  delivered: 'Geliefert',
  cancelled: 'Storniert',
};

export default function LogistikPackScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { supplierId, isAdmin, isTeamChief, teamType, loading: accessLoading } = useSupplierAccess(user?.id ?? null);

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const canPack =
    supplierId &&
    (isAdmin || isTeamChief || teamType === 'logistik');

  const fetchOrders = useCallback(async () => {
    if (!supplierId) return;
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        status,
        total_amount,
        payment_method,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          is_packed,
          products (name, unit)
        )
      `
      )
      .eq('supplier_id', supplierId)
      .in('status', ['pending', 'confirmed', 'shipped'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('LogistikPack fetch:', error);
      return;
    }
    setOrders((data ?? []) as OrderWithItems[]);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => {
    if (!supplierId) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [supplierId, fetchOrders]);

  useEffect(() => {
    if (!supplierId) return;
    const channel = supabase
      .channel('logistik-pack')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `supplier_id=eq.${supplierId}`,
        },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplierId, fetchOrders]);

  async function togglePacked(orderItem: OrderItemRow) {
    if (!canPack) return;
    const packed = !orderItem.is_packed;
    await supabase
      .from('order_items')
      .update({ is_packed: packed })
      .eq('id', orderItem.id);
  }

  async function markOrderShipped(order: OrderWithItems) {
    if (!canPack) return;
    const allPacked = order.order_items?.every((oi) => oi.is_packed);
    if (!allPacked) return;
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', order.id);
  }

  if (accessLoading || !supplierId) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!canPack) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>Kein Zugriff auf Logistik.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Zum Packen</Text>
          <Text style={styles.subtitle}>Produkte und Bestellungen abhaken. Chefs sehen Änderungen live.</Text>
        </View>
        <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={20} color={accentColor} />
          <Text style={styles.signOutBtnText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: order }) => {
          const expanded = expandedOrderId === order.id;
          const allPacked = order.order_items?.every((oi) => oi.is_packed);
          const packedCount = order.order_items?.filter((oi) => oi.is_packed).length ?? 0;
          const totalItems = order.order_items?.length ?? 0;

          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => setExpandedOrderId(expanded ? null : order.id)}
                style={styles.cardHeader}
              >
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardAmount}>
                    {(order.total_amount / 100).toFixed(2)} €
                  </Text>
                  <Text style={styles.cardStatus}>
                    {statusLabels[order.status] ?? order.status}
                  </Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={styles.packProgress}>
                    {packedCount}/{totalItems} gepackt
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </View>
              </Pressable>
              <Text style={styles.cardDate}>
                {new Date(order.created_at).toLocaleDateString('de-DE')}
              </Text>

              {expanded && (
                <View style={styles.items}>
                  {(order.order_items ?? []).map((oi) => {
                    const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
                    return (
                      <TouchableOpacity
                        key={oi.id}
                        style={styles.itemRow}
                        onPress={() => togglePacked(oi)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            oi.is_packed && styles.checkboxChecked,
                          ]}
                        >
                          {oi.is_packed && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <Text
                          style={[styles.itemText, oi.is_packed && styles.itemTextStrike]}
                        >
                          {oi.quantity}× {p?.name ?? 'Produkt'} ({p?.unit ?? ''})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {allPacked && order.status !== 'shipped' && order.status !== 'delivered' && (
                    <TouchableOpacity
                      style={styles.shipButton}
                      onPress={() => markOrderShipped(order)}
                    >
                      <Ionicons name="car" size={18} color="#fff" />
                      <Text style={styles.shipButtonText}>Als versendet markieren</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Keine Bestellungen zum Packen.</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: accentColor,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  packProgress: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  items: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: accentColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: accentColor,
    borderColor: accentColor,
  },
  itemText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  itemTextStrike: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  shipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accentColor,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  shipButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});
