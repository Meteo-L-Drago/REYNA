import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  products: { name: string; unit: string } | null;
}

interface OrderDetail {
  id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  suppliers: { company_name: string } | { company_name: string }[] | null;
  order_items: OrderItemRow[];
}

const accentColor = '#BA943A';
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

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, total_amount, payment_method, created_at,
        suppliers (company_name),
        order_items (quantity, unit_price, products (name, unit))
      `)
      .eq('id', orderId)
      .eq('gastronom_id', user?.id ?? '')
      .single();

    if (error) {
      console.error(error);
      setOrder(null);
    } else {
        setOrder(data as OrderDetail);
    }
    setLoading(false);
  }

  async function handleStorno() {
    if (!order) return;
    Alert.alert(
      'Bestellung stornieren',
      'Möchtest du diese Bestellung wirklich stornieren? Diese Aktion lässt sich nicht rückgängig machen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Stornieren',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const { error } = await supabase
              .from('orders')
              .update({ status: 'cancelled' })
              .eq('id', order.id)
              .eq('gastronom_id', user?.id ?? '');
            setCancelling(false);
            if (error) {
              Alert.alert('Fehler', error.message);
            } else {
              setOrder((o) => (o ? { ...o, status: 'cancelled' } : null));
              Alert.alert('Storniert', 'Die Bestellung wurde storniert.');
              navigation.goBack();
            }
          },
        },
      ]
    );
  }

  if (loading || !order) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const supplierName = (Array.isArray(order.suppliers) ? order.suppliers[0] : order.suppliers)?.company_name ?? 'Lieferant';
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.orderId, { color: accentColor }]}>REY-{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.supplierName}>{supplierName}</Text>
        <Text style={styles.date}>{new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
      </View>

      <View style={[styles.badge, order.status === 'cancelled' && styles.badgeCancelled]}>
        <Text style={[styles.badgeText, order.status === 'cancelled' && styles.badgeTextCancelled]}>
          {statusLabels[order.status] ?? order.status}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Positionen</Text>
        {(order.order_items ?? []).map((oi, idx) => {
          const p = Array.isArray(oi.products) ? oi.products[0] : oi.products;
          const lineTotal = oi.quantity * oi.unit_price;
          return (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowText}>
                {oi.quantity}× {p?.name ?? 'Produkt'} ({(oi.unit_price / 100).toFixed(2)} €)
              </Text>
              <Text style={[styles.rowAmount, { color: accentColor }]}>{(lineTotal / 100).toFixed(2)} €</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Gesamtbetrag</Text>
        <Text style={[styles.totalAmount, { color: accentColor }]}>{(order.total_amount / 100).toFixed(2)} €</Text>
      </View>
      <Text style={styles.paymentMethod}>
        Zahlungsart: {paymentLabels[order.payment_method] ?? order.payment_method}
      </Text>

      {canCancel && (
        <TouchableOpacity
          style={[styles.stornoButton, cancelling && styles.stornoDisabled]}
          onPress={handleStorno}
          disabled={cancelling}
        >
          <Ionicons name="close-circle-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
          <Text style={styles.stornoText}>Bestellung stornieren</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
  },
  header: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  supplierName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(186,148,58,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeCancelled: {
    backgroundColor: 'rgba(220,38,38,0.15)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: accentColor,
  },
  badgeTextCancelled: {
    color: '#dc2626',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowText: {
    fontSize: 15,
    color: '#1a1a1a',
    flex: 1,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  stornoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  stornoDisabled: {
    opacity: 0.6,
  },
  stornoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});
