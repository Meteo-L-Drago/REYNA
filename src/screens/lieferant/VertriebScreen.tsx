import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAccess } from '../../hooks/useSupplierAccess';

const accentColor = '#BA943A';

interface VertriebOrder {
  id: string;
  total_amount: number;
  created_at: string;
  gastronom_id: string;
}

export default function VertriebScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { supplierId, isAdmin, teamType, loading: accessLoading } = useSupplierAccess(user?.id ?? null);

  const [assignments, setAssignments] = useState<{ gastronom_id: string }[]>([]);
  const [orders, setOrders] = useState<VertriebOrder[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const canAccess = supplierId && (isAdmin || teamType === 'vertrieb');

  useEffect(() => {
    if (!supplierId || !user?.id || !canAccess) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: a } = await supabase
        .from('customer_vertrieb_assignments')
        .select('gastronom_id')
        .eq('supplier_id', supplierId)
        .eq('vertrieb_user_id', user.id);
      const gastronomIds = ((a ?? []) as { gastronom_id: string }[]).map((x) => x.gastronom_id);
      setAssignments(a ?? []);

      if (gastronomIds.length === 0) {
        setOrders([]);
        setRestaurantNames({});
        setLoading(false);
        return;
      }
      const { data: o } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, gastronom_id')
        .eq('supplier_id', supplierId)
        .in('gastronom_id', gastronomIds)
        .order('created_at', { ascending: false });
      setOrders((o ?? []) as VertriebOrder[]);

      const { data: rests } = await supabase
        .from('restaurants')
        .select('gastronom_id, name')
        .in('gastronom_id', gastronomIds);
      const map: Record<string, string> = {};
      ((rests ?? []) as { gastronom_id: string; name: string }[]).forEach((r) => {
        map[r.gastronom_id] = r.name || '–';
      });
      setRestaurantNames(map);
      setLoading(false);
    })();
  }, [supplierId, user?.id, canAccess]);

  const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0);

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
        <Text style={styles.empty}>Kein Zugriff auf Vertrieb.</Text>
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
          <Text style={styles.title}>Meine Kunden</Text>
          <Text style={styles.subtitle}>Bestellungen deiner zugeordneten Kunden.</Text>
        </View>
        <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={20} color={accentColor} />
          <Text style={styles.signOutBtnText}>Abmelden</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Kundenumsatz</Text>
          <Text style={[styles.statValue, { color: accentColor }]}>
            {(totalRevenue / 100).toFixed(2)} €
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Zugeordnete Kunden</Text>
          <Text style={styles.statValue}>{assignments.length}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.customerName}>{restaurantNames[item.gastronom_id] ?? '–'}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('de-DE')}</Text>
            </View>
            <Text style={styles.amount}>{(item.total_amount / 100).toFixed(2)} €</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {assignments.length === 0
              ? 'Dir sind noch keine Kunden zugeordnet.'
              : 'Noch keine Bestellungen deiner Kunden.'}
          </Text>
        }
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
  stats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  list: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardLeft: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  date: { fontSize: 14, color: '#6b7280' },
  amount: { fontSize: 18, fontWeight: '700', color: accentColor },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 48, fontSize: 16 },
});
