import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface OrderWithSupplier {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  suppliers: { company_name: string } | { company_name: string }[] | null;
}

const accentColor = '#BA943A';

export default function OrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user?.id]);

  async function fetchOrders() {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        payment_method,
        created_at,
        suppliers (company_name)
      `)
      .eq('gastronom_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    setOrders((data ?? []) as OrderWithSupplier[]);
    setLoading(false);
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    shipped: 'Versendet',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Meine Bestellungen</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>
              {(Array.isArray(item.suppliers) ? item.suppliers[0] : item.suppliers)?.company_name ?? 'Lieferant'}
            </Text>
            <Text style={styles.cardAmount}>
              {(item.total_amount / 100).toFixed(2)} €
            </Text>
            <Text style={styles.cardStatus}>
              {statusLabels[item.status] ?? item.status}
            </Text>
            <Text style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString('de-DE')}
            </Text>
          </TouchableOpacity>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardAmount: {
    fontSize: 16,
    color: accentColor,
    fontWeight: '600',
    marginTop: 4,
  },
  cardStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});
