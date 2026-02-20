import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

const accentColor = '#BA943A';

export default function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { cart, removeFromCart, updateQuantity, totalBySupplier } = useCart();

  if (Object.keys(cart).length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>Warenkorb</Text>
        <Text style={styles.empty}>Dein Warenkorb ist leer.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.getParent()?.getParent()?.navigate('Browse', { screen: 'Suppliers' })}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Lieferanten durchsuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entries = Object.entries(cart);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Warenkorb</Text>
      <FlatList
        data={entries}
        keyExtractor={([supplierId]) => supplierId}
        contentContainerStyle={styles.list}
        renderItem={({ item: [supplierId, items] }) => (
          <View style={styles.supplierSection}>
            {items.map((ci) => (
              <View key={ci.product_id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{ci.product?.name}</Text>
                  <Text style={styles.itemDetails}>
                    {((ci.product?.price ?? 0) / 100).toFixed(2)} € / {ci.product?.unit}
                  </Text>
                </View>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => updateQuantity(ci.product_id, ci.quantity - 1)}
                  >
                    <Text style={styles.quantityBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{ci.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityBtn}
                    onPress={() => updateQuantity(ci.product_id, ci.quantity + 1)}
                  >
                    <Text style={styles.quantityBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeFromCart(ci.product_id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.subtotal}>
              Summe: {(totalBySupplier(supplierId) / 100).toFixed(2)} €
            </Text>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutButtonText}>Zur Kasse</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    color: '#6b7280',
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: accentColor,
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  supplierSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  itemDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 8,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: accentColor,
    marginTop: 12,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  checkoutButton: {
    backgroundColor: accentColor,
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
