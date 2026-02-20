import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const accentColor = '#BA943A';

interface Restaurant {
  id: string;
  name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string | null;
  delivery_notes: string | null;
}

export default function RestaurantProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [phone, setPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('restaurants')
      .select('*')
      .eq('gastronom_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoading(false);
          return;
        }
        if (data) {
          const r = data as Restaurant;
          setName(r.name || '');
          setStreet(r.street || '');
          setPostalCode(r.postal_code || '');
          setCity(r.city || '');
          setCountry(r.country || 'Deutschland');
          setPhone(r.phone || '');
          setDeliveryNotes(r.delivery_notes || '');
          setHasRestaurant(true);
        }
        setLoading(false);
      });
  }, [user?.id]);

  async function handleSave() {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Fehler', 'Restaurantname ist erforderlich.');
      return;
    }
    if (!street.trim() || !postalCode.trim() || !city.trim()) {
      Alert.alert('Fehler', 'Lieferadresse (Straße, PLZ, Ort) ist erforderlich.');
      return;
    }
    setSaving(true);
    const { error } = hasRestaurant
      ? await supabase
          .from('restaurants')
          .update({
            name: name.trim(),
            street: street.trim(),
            postal_code: postalCode.trim(),
            city: city.trim(),
            country: country.trim() || 'Deutschland',
            phone: phone.trim() || null,
            delivery_notes: deliveryNotes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('gastronom_id', user.id)
      : await supabase.from('restaurants').insert({
          gastronom_id: user.id,
          name: name.trim(),
          street: street.trim(),
          postal_code: postalCode.trim(),
          city: city.trim(),
          country: country.trim() || 'Deutschland',
          phone: phone.trim() || null,
          delivery_notes: deliveryNotes.trim() || null,
        });
    setHasRestaurant(true);
    setSaving(false);
    if (error) {
      Alert.alert('Fehler', error.message);
    } else {
      Alert.alert('Gespeichert', 'Deine Restaurant-Daten wurden aktualisiert.');
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const canSave = !!name.trim() && !!street.trim() && !!postalCode.trim() && !!city.trim();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mein Restaurant</Text>
        <Text style={styles.subtitle}>Adresse und Kontaktdaten für Lieferungen</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Restaurantname *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="z.B. Restaurant Sonne"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Straße & Hausnummer *</Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder="Musterstraße 12"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>PLZ *</Text>
            <TextInput
              style={styles.input}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="12345"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Ort *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Berlin"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Land</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Deutschland"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telefon</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+49 30 1234567"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Lieferhinweise (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            placeholder="z.B. Hinterhof, Klingel links"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Speichern</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  half: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: accentColor,
    borderRadius: 30,
    paddingVertical: 18,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
