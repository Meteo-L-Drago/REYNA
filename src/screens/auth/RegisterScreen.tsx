import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const accentColor = '#BA943A';

export default function RegisterScreen({ navigation, route }: any) {
  const role: UserRole = route.params?.role ?? 'gastronom';
  const restaurantData = route.params?.restaurantData;
  const { refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(restaurantData?.email ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(restaurantData?.contactName ?? '');
  const [companyName, setCompanyName] = useState(restaurantData?.restaurantName ?? '');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !fullName.trim()) {
      Alert.alert('Fehler', 'Alle Pflichtfelder ausfüllen.');
      return;
    }
    if (role === 'lieferant' && !companyName.trim()) {
      Alert.alert('Fehler', 'Firmenname eingeben.');
      return;
    }
    if (role === 'gastronom' && !fullName.trim()) {
      Alert.alert('Fehler', 'Name des Ansprechpartners eingeben.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Fehler', 'Passwort muss mindestens 6 Zeichen haben.');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Registrierung fehlgeschlagen', error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        email: user.email ?? '',
        role,
        company_name: role === 'lieferant' ? companyName.trim() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      setLoading(false);
      Alert.alert('Fehler', profileError.message);
      return;
    }

    if (role === 'lieferant') {
      await supabase.from('suppliers').insert({
        user_id: user.id,
        company_name: companyName.trim(),
      });
    }

    if (role === 'gastronom' && (restaurantData?.addressData || restaurantData?.restaurantName)) {
      const addr = restaurantData.addressData;
      await supabase.from('restaurants').insert({
        gastronom_id: user.id,
        name: restaurantData.restaurantName || companyName.trim() || 'Mein Lokal',
        street: addr?.street || '–',
        postal_code: addr?.postal_code || '–',
        city: addr?.city || '–',
        country: addr?.country || 'Deutschland',
        phone: restaurantData.phone || null,
      });
    }

    await refreshProfile(user.id);
    setLoading(false);
  }

  const roleLabel = role === 'gastronom' ? 'Gastronom' : 'Lieferant';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: accentColor }]}>Erzähl uns etwas über dich</Text>
        <Text style={styles.subheading}>Als {roleLabel} registrieren</Text>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{role === 'gastronom' ? 'Ansprechpartner' : 'Vollständiger Name'}</Text>
            <TextInput
              style={styles.input}
              placeholder={role === 'gastronom' ? 'Name des Ansprechpartners' : 'Vollständiger Name'}
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
          {(role === 'lieferant' || (role === 'gastronom' && restaurantData)) && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{role === 'gastronom' ? 'Name des Restaurants/Lokals' : 'Firmenname'}</Text>
              <TextInput
                style={styles.input}
                placeholder={role === 'gastronom' ? 'Name des Restaurants/Lokals' : 'Firmenname'}
                placeholderTextColor="#9ca3af"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
          )}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-Mail</Text>
            <TextInput
              style={styles.input}
              placeholder="name@beispiel.de"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <Text style={styles.label}>Passwort</Text>
            <TextInput
              style={styles.input}
              placeholder="Mindestens 6 Zeichen"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: loading ? '#d1d5db' : accentColor }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Wird erstellt...' : 'KONTO ERSTELLEN'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login', { role })}
        >
          <Text style={[styles.linkText, { color: accentColor }]}>Bereits registriert? Anmelden</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    marginTop: 24,
  },
  registerButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
