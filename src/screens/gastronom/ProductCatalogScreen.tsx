import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

const accentColor = '#BA943A';

export default function ProductCatalogScreen({ route, navigation }: any) {
  const { supplierId, supplierName } = route.params;
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [supplierId]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_available', true)
      .order('name');
    if (error) {
      console.error(error);
      return;
    }
    setProducts(data ?? []);
    setLoading(false);
  }

  const categories = Array.from(new Set(products.map((p) => p.category || 'Sonstige').filter(Boolean)));
  categories.sort();
  if (!categories.includes('Sonstige')) categories.push('Sonstige');

  const filteredProducts = products.filter((p) => {
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || (p.category || 'Sonstige') === categoryFilter;
    return matchSearch && matchCategory;
  });

  function handleAddToCart(product: Product, quantity: number) {
    if (quantity < 1) return;
    addToCart(product, quantity, supplierId);
    navigation.getParent()?.getParent()?.navigate('CartTab', { screen: 'Cart' });
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
      <Text style={styles.title}>{supplierName}</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Produkt suchen..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, categoryFilter === 'all' && styles.categoryChipActive]}
            onPress={() => setCategoryFilter('all')}
          >
            <Text style={[styles.categoryChipText, categoryFilter === 'all' && styles.categoryChipTextActive]}>Alle</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, categoryFilter === cat && styles.categoryChipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.categoryChipText, categoryFilter === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductItem
            product={item}
            onAddToCart={handleAddToCart}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search.trim() || categoryFilter !== 'all'
              ? 'Keine Produkte gefunden.'
              : 'Noch keine Produkte vorhanden.'}
          </Text>
        }
      />
    </View>
  );
}

function ProductItem({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <View style={styles.card}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      ) : null}
      <View style={styles.cardContent}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>
          {(product.price / 100).toFixed(2)} € / {product.unit}
        </Text>
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.quantityInput}
          value={String(quantity)}
          onChangeText={(t) => setQuantity(Math.max(0, parseInt(t, 10) || 0))}
          keyboardType="numeric"
          placeholder="Menge"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAddToCart(product, quantity)}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.addButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryRow: {
    marginBottom: 16,
    maxHeight: 44,
  },
  categoryContent: {
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(186,148,58,0.15)',
    borderColor: accentColor,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: accentColor,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
    resizeMode: 'cover',
  },
  cardContent: {
    marginBottom: 16,
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    width: 80,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    flex: 1,
    backgroundColor: accentColor,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
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
