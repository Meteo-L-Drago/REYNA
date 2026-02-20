import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { PaymentMethod } from '../../types';

const accentColor = '#BA943A';

export default function CheckoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { cart, totalBySupplier, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('invoice');
  const [loading, setLoading] = useState(false);
  const [minOrderErrors, setMinOrderErrors] = useState<string[]>([]);

  async function handlePlaceOrder() {
    if (!user) {
      Alert.alert('Fehler', 'Nicht angemeldet.');
      return;
    }
    const entries = Object.entries(cart);
    if (entries.length === 0) {
      Alert.alert('Fehler', 'Warenkorb ist leer.');
      return;
    }

    const errors: string[] = [];
    for (const [supplierId, items] of entries) {
      const totalAmount = totalBySupplier(supplierId);
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('company_name, min_order_amount')
        .eq('id', supplierId)
        .single();
      const minAmount = (supplier as { min_order_amount?: number })?.min_order_amount ?? 0;
      if (minAmount > 0 && totalAmount < minAmount) {
        const name = (supplier as { company_name?: string })?.company_name ?? 'Lieferant';
        errors.push(`${name}: Mindestbestellwert ${(minAmount / 100).toFixed(2)} €, aktuell ${(totalAmount / 100).toFixed(2)} €`);
      }
    }
    if (errors.length > 0) {
      setMinOrderErrors(errors);
      Alert.alert('Mindestbestellwert nicht erreicht', errors.join('\n\n'));
      return;
    }
    setMinOrderErrors([]);

    setLoading(true);

    for (const [supplierId, items] of entries) {
      const totalAmount = totalBySupplier(supplierId);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          gastronom_id: user.id,
          supplier_id: supplierId,
          status: 'pending',
          payment_method: paymentMethod,
          total_amount: totalAmount,
        })
        .select('id')
        .single();

      if (orderError) {
        Alert.alert('Fehler', orderError.message);
        setLoading(false);
        return;
      }

      const orderItems = items.map((ci) => ({
        order_id: order.id,
        product_id: ci.product_id,
        quantity: ci.quantity,
        unit_price: ci.product?.price ?? 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        Alert.alert('Fehler', itemsError.message);
        setLoading(false);
        return;
      }
    }

    clearCart();
    setLoading(false);
    Alert.alert('Bestellung aufgegeben', 'Deine Bestellung wurde erfolgreich übermittelt.');
    const tabNav = navigation.getParent();
    if (tabNav) tabNav.navigate('Orders');
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 24 }]} contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}>
      <Text style={styles.title}>Kasse</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zahlungsmethode</Text>
        <TouchableOpacity
          style={[styles.option, paymentMethod === 'invoice' && styles.optionActive]}
          onPress={() => setPaymentMethod('invoice')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Auf Rechnung</Text>
          <Text style={styles.optionDesc}>Der Lieferant sendet dir die Rechnung</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, paymentMethod === 'card' && styles.optionActive]}
          onPress={() => setPaymentMethod('card')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Sofort bezahlen</Text>
          <Text style={styles.optionDesc}>Kreditkarte / Debitkarte (Stripe)</Text>
        </TouchableOpacity>
      </View>

      {minOrderErrors.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Mindestbestellwert nicht erreicht</Text>
          {minOrderErrors.map((msg, i) => (
            <Text key={i} style={styles.errorText}>{msg}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.totalLabel}>Gesamtbetrag</Text>
        <Text style={styles.totalValue}>{(total() / 100).toFixed(2)} €</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {paymentMethod === 'card'
            ? (loading ? 'Zahlung...' : 'Bezahlen & Bestellen')
            : (loading ? 'Wird bestellt...' : 'Bestellung aufgeben')}
        </Text>
      </TouchableOpacity>

      {paymentMethod === 'card' && (
        <Text style={styles.note}>
          Hinweis: Stripe-Integration kommt in einer späteren Version.
          Bitte wähle „Auf Rechnung“.
        </Text>
      )}
    </ScrollView>
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
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  optionActive: {
    borderColor: accentColor,
    backgroundColor: 'rgba(186, 148, 58, 0.06)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: accentColor,
    marginTop: 4,
  },
  button: {
    backgroundColor: accentColor,
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  note: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    marginTop: 4,
  },
});
