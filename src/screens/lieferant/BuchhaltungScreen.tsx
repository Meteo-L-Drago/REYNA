import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAccess } from '../../hooks/useSupplierAccess';

const accentColor = '#BA943A';

const paymentLabels: Record<string, string> = {
  invoice: 'Auf Rechnung',
  card: 'Karte',
};

interface BuchhaltungOrder {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function BuchhaltungScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { supplierId, isAdmin, teamType, loading: accessLoading } = useSupplierAccess(user?.id ?? null);

  const [orders, setOrders] = useState<BuchhaltungOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = supplierId && (isAdmin || teamType === 'buchhaltung');

  useEffect(() => {
    if (!supplierId || !canAccess) {
      setLoading(false);
      return;
    }
    supabase
      .from('orders_buchhaltung')
      .select('id, total_amount, payment_method, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as BuchhaltungOrder[]);
        setLoading(false);
      });
  }, [supplierId, canAccess]);

  if (accessLoading || !supplierId) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!canAccess) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>Kein Zugriff auf Buchhaltung.</Text>
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
          <Text style={styles.title}>Rechnungen</Text>
          <Text style={styles.subtitle}>Rechnungsrelevante Daten. Kein Lieferstatus.</Text>
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.rechnr}>REY-{item.id.slice(0, 8).toUpperCase()}</Text>
            <View style={styles.row}>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('de-DE')}</Text>
              <Text style={styles.amount}>{(item.total_amount / 100).toFixed(2)} €</Text>
            </View>
            <Text style={styles.payment}>{paymentLabels[item.payment_method] ?? item.payment_method}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Keine Rechnungen.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf9', paddingHorizontal: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafaf9' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  signOutBtnText: { fontSize: 15, fontWeight: '600', color: accentColor },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  rechnr: { fontSize: 12, fontFamily: 'monospace', color: '#6b7280', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 15, color: '#374151' },
  amount: { fontSize: 18, fontWeight: '700', color: accentColor },
  payment: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 48, fontSize: 16 },
});
