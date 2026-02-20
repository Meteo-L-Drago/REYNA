import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { SupplierProfile } from '../../types';
const accentColor = '#BA943A';

export default function SupplierListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [filtered, setFiltered] = useState<SupplierProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(suppliers);
    } else {
      const q = search.toLowerCase();
      setFiltered(suppliers.filter((s) => s.company_name.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q)));
    }
  }, [search, suppliers]);

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('company_name');
    if (error) {
      console.error(error);
      return;
    }
    setSuppliers(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: accentColor }]}>Dashboard</Text>
        <Text style={styles.subheading}>Finde Lieferanten und bestelle Produkte</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Lieferant suchen..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductCatalog', { supplierId: item.id, supplierName: item.company_name })}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>{item.company_name}</Text>
            {item.address ? (
              <Text style={styles.cardSub}>{item.address}</Text>
            ) : null}
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={20} color={accentColor} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search.trim() ? 'Keine Lieferanten gefunden.' : 'Noch keine Lieferanten registriert.'}
          </Text>
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
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 8,
  },
  searchRow: {
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
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
  cardSub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});
