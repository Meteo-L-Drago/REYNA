import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAccess } from '../../hooks/useSupplierAccess';
import { Product } from '../../types';

const accentColor = '#BA943A';

export default function ProductsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { supplierId, loading: accessLoading } = useSupplierAccess(user?.id ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!supplierId) {
        setLoading(false);
        return;
      }
      fetchProducts();
    }, [supplierId])
  );

  async function fetchProducts() {
    if (!supplierId) return;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('name');
    if (error) {
      console.error(error);
      return;
    }
    setProducts(data ?? []);
    setLoading(false);
  }

  async function toggleAvailability(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: !p.is_available } : p
      )
    );
  }

  if (accessLoading || loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  if (!supplierId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.empty}>Kein Lieferanten-Profil gefunden.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meine Produkte</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct', { supplierId })}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>Produkt</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_available && styles.cardDisabled]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productImage} />
            ) : null}
            <View style={styles.cardContent}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>
                {(item.price / 100).toFixed(2)} € / {item.unit}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                !item.is_available && styles.toggleBtnInactive,
              ]}
              onPress={() => toggleAvailability(item)}
            >
              <Text style={[styles.toggleBtnText, item.is_available ? { color: '#6b7280' } : { color: accentColor }]}>
                {item.is_available ? 'Deaktivieren' : 'Aktivieren'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Produkte. Füge welche hinzu.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: accentColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
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
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.65,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
    resizeMode: 'cover',
  },
  cardContent: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  productPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(186, 148, 58, 0.1)',
    borderRadius: 10,
  },
  toggleBtnInactive: {
    backgroundColor: '#f3f4f6',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
  },
});
