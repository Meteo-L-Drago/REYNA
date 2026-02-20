import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export default function RoleSelectScreen({ navigation }: any) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  async function handleComplete() {
    if (!role) {
      Alert.alert('Fehler', 'Wähle deine Rolle.');
      return;
    }
    if (role === 'lieferant' && !companyName.trim()) {
      Alert.alert('Fehler', 'Firmenname eingeben.');
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      Alert.alert('Fehler', 'Nicht angemeldet.');
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? '',
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
      const { error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          company_name: companyName.trim(),
        });
      if (supplierError) {
        console.error('Supplier create error:', supplierError);
      }
    }

    await refreshProfile(user.id);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wie möchtest du REYNA nutzen?</Text>

      <TouchableOpacity
        style={[styles.roleButton, role === 'gastronom' && styles.roleButtonActive]}
        onPress={() => setRole('gastronom')}
      >
        <Text style={styles.roleTitle}>Gastronom</Text>
        <Text style={styles.roleDesc}>Ware bei Lieferanten bestellen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleButton, role === 'lieferant' && styles.roleButtonActive]}
        onPress={() => setRole('lieferant')}
      >
        <Text style={styles.roleTitle}>Lieferant</Text>
        <Text style={styles.roleDesc}>Produkte anbieten und Bestellungen erhalten</Text>
      </TouchableOpacity>

      {role === 'lieferant' && (
        <TextInput
          style={styles.input}
          placeholder="Firmenname"
          placeholderTextColor="#999"
          value={companyName}
          onChangeText={setCompanyName}
        />
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Wird gespeichert...' : 'Fertig'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 32,
    textAlign: 'center',
  },
  roleButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  roleButtonActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#1e293b',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  roleDesc: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600',
  },
});
